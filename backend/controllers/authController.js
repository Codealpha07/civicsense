const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const CitizenProfile = require('../models/CitizenProfile');
const { sendOtp, sendResetPasswordEmail } = require('../utils/emailSender');
const { sendOtpSms } = require('../utils/smsSender');

const ErrorResponse = require('../utils/errorResponse');

// In-memory stores (for demo; use Redis or DB in production)
const pendingUsers = {};
const otps = {};

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d'
  });
};

// @desc    Register a new user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { firstName, lastName, email, mobile, address, city, state, pinCode, password, role = 'Citizen' } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const normalizedEmail = email.toString().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { mobile }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile'
      });
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      mobile,
      address,
      city,
      state,
      pinCode,
      password,
      role
    });

    // Create token
    const token = generateToken(user._id);

    // Create citizen profile if role is Citizen
    if (role === 'Citizen') {
      const citizenProfile = await CitizenProfile.create({
        user: user._id,
        firstName,
        lastName,
        mobile,
        address,
        city,
        state,
        pinCode
      });

      // Update user with profile reference
      user.profile = citizenProfile._id;
      await user.save();
    }

    // Remove password from output
    user.password = undefined;

    res.status(201).json({
      success: true,
      token,
      data: user
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: err.message
    });
  }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, emailOrMobile, mobile, password, role } = req.body;

    // Determine identifier (email or mobile) and ensure it is a string to avoid runtime errors
    let identifierRaw = email ?? emailOrMobile ?? mobile;
    if (!identifierRaw) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    // Convert to string (covers cases where mobile was sent as a number)
    let identifier = identifierRaw.toString().trim();

    // Validate identifier & password
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email/mobile and password'
      });
    }

    // Build query based on identifier type
    let query = {};
    if (identifier.includes('@')) {
      query.email = identifier.toLowerCase();
    } else {
      query.mobile = identifier;
    }

    // Add role to query if provided
    if (role) {
      query.role = role;
    }

    // Check for user
    const user = await User.findOne(query)
      .select('+password')
      .populate('profile');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = Date.now();
    // Save without triggering full validation (older accounts may miss newly required fields)
    await user.save({ validateBeforeSave: false });

    // Create token
    const token = generateToken(user._id);

    // Remove password from output
    user.password = undefined;

    res.status(200).json({
      success: true,
      token,
      user,
      data: user
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: err.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('profile');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Send OTP for verification
// @route   POST /api/v1/auth/send-otp
// @access  Public
exports.sendOtp = async (req, res, next) => {
  try {
    const { email, mobile, method = 'email' } = req.body;
    
    if (!email && !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Email or mobile is required'
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    try {
      if (email) {
        // Store OTP with email as key
        otps[email] = { otp, expiresAt: otpExpire };
        
        // Send OTP via email using the email service directly
        const { sendComplaintEmail } = require('../emailService');
        const emailHtml = `
          <h2>Your Verification Code</h2>
          <p>Your verification code is: <strong>${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        `;
        
        await sendComplaintEmail(
          email,
          'Your Verification Code',
          emailHtml
        );
        
        return res.status(200).json({
          success: true,
          message: 'OTP sent to email',
          method: 'email',
          destination: email
        });
      } 
      
      if (mobile) {
        // Store OTP with mobile as key
        otps[mobile] = { otp, expiresAt: otpExpire };
        
        // Send OTP via SMS
        await sendOtpSms(mobile, otp);
        
        return res.status(200).json({
          success: true,
          message: 'OTP sent to mobile',
          method: 'sms',
          destination: mobile
        });
      }
      
    } catch (error) {
      console.error('Error sending OTP:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP',
        error: error.message
      });
    }
    
  } catch (err) {
    console.error('Send OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: err.message
    });
  }
};

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOtp = async (req, res, next) => {
  try {
    const { email, mobile, otp } = req.body;
    
    if ((!email && !mobile) || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email/mobile and OTP are required'
      });
    }

    const identifier = email || mobile;
    const storedOtp = otps[identifier];

    // Check if OTP exists and is not expired
    if (!storedOtp || storedOtp.expiresAt < Date.now()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP'
      });
    }

    // Verify OTP
    if (storedOtp.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // If we get here, OTP is valid
    // Remove the OTP since it's been used
    delete otps[identifier];

    let verifiedUser = null;
    // If this is for email verification, update user's verified status
    if (email) {
      verifiedUser = await User.findOneAndUpdate(
        { email: email.toLowerCase() },
        { verified: true },
        { new: true, runValidators: true }
      ).select('-password');

      if (!verifiedUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
    }

    const token = verifiedUser ? generateToken(verifiedUser._id) : null;

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      verified: true,
      token,
      user: verifiedUser,
      role: verifiedUser?.role
    });
    
  } catch (err) {
    console.error('Verify OTP error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during OTP verification',
      error: err.message
    });
  }
};

// @desc    Forgot password
// @route   POST /api/v1/auth/forgotpassword
// @access  Public
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent'
      });
    }

    // Get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    try {
      // Send email
      await sendResetPasswordEmail({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        resetUrl
      });

      res.status(200).json({ 
        success: true, 
        message: 'If an account with that email exists, a reset link has been sent',
        data: { email: user.email }
      });
    } catch (err) {
      console.error('Send email error:', err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Email could not be sent',
        error: err.message
      });
    }
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset',
      error: err.message
    });
  }
};

// @desc    Reset password
// @route   PUT /api/v1/auth/resetpassword/:resettoken
// @access  Public
exports.resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Create token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: { id: user._id }
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: err.message
    });
  }
};

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      mobile: req.body.mobile,
      address: req.body.address
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('Update details error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating user details',
      error: err.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    // Create token
    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      data: { id: user._id }
    });
  } catch (err) {
    console.error('Update password error:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: err.message
    });
  }
};

// @desc    Log user out / clear cookie
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: err.message
    });
  }
};
