const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { sendReportNotification } = require('../services/emailService');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');

// @route   POST api/reports
// @desc    Create a new report
// @access  Private (requires authentication)
router.post('/', protect, async (req, res) => {
  try {
    console.log('Received POST /api/reports', req.body);
    console.log('req.user:', req.user);
    console.log('Authorization header:', req.headers.authorization);

    const { title, description, location, category, images: incomingImages = [], userEmail, department } = req.body;

    // Persist images to /uploads and build relative paths array
    const imagePaths = [];
    if (Array.isArray(incomingImages) && incomingImages.length > 0) {
      const uploadsDir = path.join(__dirname, '../../uploads');
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        incomingImages.forEach((imgStr, idx) => {
          if (!imgStr) return;

          let base64 = imgStr;
          let extension = 'jpg';

          // If we received a full data URL, separate header and detect extension
          const match = imgStr.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            extension = match[1].split('/')[1];
            base64 = match[2];
          }

          const filename = `report_${Date.now()}_${idx}.${extension}`;
          const filePath = path.join(uploadsDir, filename);
          try {
            fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
            imagePaths.push(`/uploads/${filename}`);
          } catch (writeErr) {
            console.error('Error writing image file:', writeErr);
          }
        });
      } catch (dirErr) {
        console.error('Error ensuring uploads directory:', dirErr);
      }
    }
    
    // Compute coordinates robustly
    const coords = Array.isArray(location?.coordinates) && location.coordinates.length === 2
      ? location.coordinates
      : (location?.lat !== undefined && location?.lng !== undefined)
        ? [location.lng, location.lat]
        : [0, 0];

    const locObj = {
      type: 'Point',
      coordinates: coords,
      address: location?.address || 'Unknown address'
    };

    // Prepare report data
    const reportData = {
      title,
      description,
      location: locObj,
      category,
      images: imagePaths,
      status: 'pending',
      userEmail: req.user?.email || userEmail || 'no-email@example.com',
      userMobile: req.user?.mobile || req.body.userMobile || 'no-mobile',
      department
    };
    if (req.user?.id) {
      reportData.user = req.user.id; // Only set if authenticated
    }

    const newReport = new Report(reportData);

    console.log('Saving new report...');
    const report = await newReport.save();
    console.log('Report saved:', report);
    
    // Send email notification
    try {
      // Replace with actual admin email or get from environment variables
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@civicsense.com';
      await sendReportNotification(report, adminEmail);
      
      // If user provided email, send them a confirmation
      if (userEmail) {
        await sendReportNotification({
          ...report.toObject(),
          title: `[Confirmation] ${report.title}`,
          userMobile: req.user?.mobile || req.body.userMobile || 'no-mobile'
        }, userEmail);
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully!'
    });
  } catch (err) {
    console.error('Full error:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET api/reports
// @desc    Get all reports for the authenticated user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    console.log('Fetching reports for user:', {
      userId: req.user?._id,
      email: req.user?.email
    });

    // Build query based on available user info
    const query = {};
    
    if (req.user?._id) {
      query.user = req.user._id;
    } 
    
    if (req.user?.email) {
      query.$or = query.$or || [];
      query.$or.push({ userEmail: req.user.email });
    }
    
    // If no user info is available, return empty array
    if (!query.user && !query.$or) {
      console.log('No user information available to fetch reports');
      return res.json({ success: true, data: [] });
    }

    console.log('Querying reports with:', query);
    
    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .lean();
      
    console.log(`Found ${reports.length} reports`);
    
    res.json({ 
      success: true, 
      data: reports 
    });
    
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// @route   GET api/reports/:id
// @desc    Get report by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ msg: 'Report not found' });
    }
    
    res.json(report);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Report not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   GET api/reports/stats
// @desc    Get report stats for a department
// @access  Private (admin only)
router.get('/stats', protect, async (req, res) => {
  try {
    // Accept department from query or JWT (prefer JWT if available)
    let department = req.query.department;
    if (req.user && req.user.department) {
      department = req.user.department.name || req.user.department;
    }
    if (!department) {
      return res.status(400).json({ success: false, message: 'Department required' });
    }
    // Normalize department string for matching
    department = department.trim();
    // Aggregate counts by status
    const [total, pending, inProgress, resolved] = await Promise.all([
      Report.countDocuments({ department }),
      Report.countDocuments({ department, status: { $in: ['pending', 'Pending'] } }),
      Report.countDocuments({ department, status: { $in: ['in-progress', 'in_progress', 'In Progress'] } }),
      Report.countDocuments({ department, status: { $in: ['resolved', 'Resolved'] } })
    ]);
    res.json({
      success: true,
      data: { total, pending, inProgress, resolved }
    });
  } catch (err) {
    console.error('Error fetching department stats:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
