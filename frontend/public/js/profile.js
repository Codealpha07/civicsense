// Profile Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Initialize tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
  });

  // DOM Elements
  const editProfileBtn = document.getElementById('editProfileBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const avatarUploadBtn = document.getElementById('avatarUploadBtn');
  const avatarInput = document.getElementById('avatarInput');
  const profileForm = document.querySelector('.profile-form');
  const formInputs = document.querySelectorAll('.profile-form input:not([type="password"])');
  const changeEmailBtn = document.getElementById('changeEmailBtn');
  const changePhoneBtn = document.getElementById('changePhoneBtn');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const passwordForm = document.getElementById('passwordForm');
  const messageDiv = document.getElementById('message');
  const errorDiv = document.getElementById('error');
  
  // Load user data when page loads
  getUserData();

  
  // Toggle edit mode
  if (editProfileBtn && saveProfileBtn) {
    editProfileBtn.addEventListener('click', function() {
      // Enable editable inputs
      document.getElementById('address').disabled = false;
      document.getElementById('city').disabled = false;
      document.getElementById('state').disabled = false;
      document.getElementById('pinCode').disabled = false;
      
      // Toggle buttons
      editProfileBtn.style.display = 'none';
      saveProfileBtn.style.display = 'block';
      
      // Add edit mode class to form
      if (profileForm) {
        profileForm.classList.add('edit-mode');
      }
    });
    
    saveProfileBtn.addEventListener('click', async function() {
      try {
        // Validate PIN code
        const pinCode = document.getElementById('pinCode').value;
        if (pinCode && !/^\d{6}$/.test(pinCode)) {
          showMessage('Please enter a valid 6-digit PIN code', true);
          return;
        }

        const updatedData = {
          address: document.getElementById('address').value,
          city: document.getElementById('city').value,
          state: document.getElementById('state').value,
          pinCode: pinCode
        };

        const response = await fetch('/api/v1/users/updatedetails', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(updatedData)
        });

        if (!response.ok) {
          throw new Error('Failed to update profile');
        }

        // Disable inputs
        document.getElementById('address').disabled = true;
        document.getElementById('city').disabled = true;
        document.getElementById('state').disabled = true;
        document.getElementById('pinCode').disabled = true;
      
      // Toggle buttons
      editProfileBtn.style.display = 'block';
      saveProfileBtn.style.display = 'none';
      
      // Remove edit mode class
      if (profileForm) {
        profileForm.classList.remove('edit-mode');
      }
      
        showMessage('Profile updated successfully');
        
        // Reload user data to show updated information
        await getUserData();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }
  
  // Function to generate initials avatar
  function generateInitialsAvatar(firstName, lastName) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const size = 200; // Size of the avatar
    
    canvas.width = size;
    canvas.height = size;
    
    // Draw background
    context.fillStyle = '#0d6efd'; // Bootstrap primary color
    context.fillRect(0, 0, size, size);
    
    // Draw text
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    context.fillStyle = '#FFFFFF';
    context.font = 'bold 80px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(initials, size/2, size/2);
    
    return canvas.toDataURL('image/png');
  }

  // Function to update avatar display
  function updateAvatarDisplay(photoUrl, firstName, lastName) {
    const profileAvatar = document.getElementById('profileAvatar');
    const userAvatar = document.getElementById('userAvatar');
    
    if (photoUrl) {
      // If there's a photo URL, use it
      profileAvatar.src = photoUrl;
      userAvatar.src = photoUrl;
      
      // Store the photo URL in localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.photo = photoUrl;
      localStorage.setItem('user', JSON.stringify(userData));
    } else if (firstName && lastName) {
      // If no photo but we have a name, use initials
      const initialsUrl = generateInitialsAvatar(firstName, lastName);
      profileAvatar.src = initialsUrl;
      userAvatar.src = initialsUrl;
    }
  }
  
  // Handle avatar upload
  const profileAvatar = document.getElementById('profileAvatar');
  
  if (avatarInput) {
    avatarInput.addEventListener('change', async function(e) {
      const file = e.target.files[0];
      if (file) {
        // Check file type
        if (!file.type.match('image.*')) {
          showMessage('Please select a valid image file', true);
          return;
        }
        
        // Check file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
          showMessage('Image size should be less than 2MB', true);
          return;
        }
        
        try {
          const formData = new FormData();
          formData.append('photo', file);

          showMessage('Uploading photo...', false);

          const response = await fetch('/api/v1/users/photo', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to upload photo');
          }

          const data = await response.json();
          
          if (data.success) {
            // Update avatar with new photo URL
            const photoUrl = `/uploads/${data.data.photo}`;
            updateAvatarDisplay(photoUrl);
            showMessage('Profile picture updated successfully');
          }
        } catch (error) {
          console.error('Upload error:', error);
          showMessage(error.message || 'Failed to upload photo', true);
        }
      }
    });
  }
  
  // Handle email change
  if (changeEmailBtn) {
    changeEmailBtn.addEventListener('click', async function() {
      const newEmail = document.getElementById('newEmail').value;
      if (!newEmail) {
        showMessage('Please enter a new email address', 'danger');
        return;
      }

      try {
        const response = await fetch('/api/v1/users/updateemail', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ email: newEmail })
        });

        if (!response.ok) {
          throw new Error('Failed to update email');
        }

        showMessage('Email updated successfully! Please verify your new email.');
        await getUserData();
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changeEmailModal'));
        if (modal) modal.hide();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }

  // Handle phone change
  if (changePhoneBtn) {
    changePhoneBtn.addEventListener('click', async function() {
      const newPhone = document.getElementById('newPhone').value;
      if (!newPhone) {
        showMessage('Please enter a new phone number', 'danger');
        return;
      }

      try {
        const response = await fetch('/api/v1/users/updatephone', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ mobile: newPhone })
        });

        if (!response.ok) {
          throw new Error('Failed to update phone number');
        }

        showMessage('Phone number updated successfully');
        await getUserData();
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePhoneModal'));
        if (modal) modal.hide();
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }

  // Handle password change
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', async function() {
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (!currentPassword || !newPassword || !confirmPassword) {
        showMessage('Please fill in all password fields', 'danger');
        return;
      }

      if (newPassword !== confirmPassword) {
        showMessage('New passwords do not match', 'danger');
        return;
      }

      try {
        const response = await fetch('/api/v1/users/updatepassword', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            currentPassword,
            newPassword
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to update password');
        }

        // Update token in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
        }

        showMessage(data.message || 'Password updated successfully');
        
        // Close the modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
        if (modal) modal.hide();
        
        // Clear the form
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
      } catch (error) {
        showMessage(error.message, true);
      }
    });
  }
  
  // Function to show messages
  function showMessage(message, isError = false) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${isError ? 'danger' : 'success'} alert-dismissible fade show`;
    alertDiv.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    document.querySelector('.container').insertBefore(alertDiv, document.querySelector('.container').firstChild);
    
    // Auto dismiss after 5 seconds
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
  
  // Function to fetch and display user data
  async function getUserData() {
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { data } = await response.json();
      
      // Update profile information
      document.getElementById('profileName').textContent = `${data.firstName} ${data.lastName}`;
      document.getElementById('userEmail').textContent = data.email;
      document.getElementById('userPhone').textContent = data.mobile;
      document.getElementById('address').value = data.address || '';
      document.getElementById('city').value = data.city || '';
      document.getElementById('state').value = data.state || '';
      const pin = data.pinCode ?? data.pincode ?? data.pin_code ?? data.zip ?? data.postalCode ?? '';
      document.getElementById('pinCode').value = pin;
      
      // Update header user info
      document.getElementById('ddUserName').textContent = `${data.firstName} ${data.lastName}`;
      document.getElementById('ddUserEmail').textContent = data.email;
      
      // Update location in profile header
      document.getElementById('userLocation').textContent = data.city ? `${data.city}, ${data.state}` : 'Location not set';
      
      // Update avatar
      if (data.photo) {
        updateAvatarDisplay(`/uploads/${data.photo}`);
      } else {
        updateAvatarDisplay(null, data.firstName, data.lastName);
      }

      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(data));
    } catch (error) {
      showMessage('Failed to load user data', true);
    }
  }
  
  // Handle profile form submission
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData(profileForm);
      const currentData = {
        email: document.getElementById('email').value,
        mobile: document.getElementById('mobile').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        pinCode: document.getElementById('pinCode').value
      };

      // Check if email or mobile is being updated
      const currentUser = await fetch('/api/v1/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      }).then(res => res.json());

      if (currentUser.data.email !== currentData.email || currentUser.data.mobile !== currentData.mobile) {
        const currentPassword = prompt('Please enter your current password to update email or mobile:');
        if (!currentPassword) {
          showMessage('Password is required to update email or mobile', true);
          return;
        }
        currentData.currentPassword = currentPassword;
      }

      const response = await fetch('/api/v1/users/updateprofile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(currentData)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      showMessage('Profile updated successfully');
      
      // Refresh user data
      getUserData();

    } catch (error) {
      showMessage(error.message, true);
    }
  });

  // Handle password form submission
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('token');
      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      if (newPassword !== confirmPassword) {
        throw new Error('New passwords do not match');
      }

      const response = await fetch('/api/v1/users/updatepassword', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update password');
      }

      // Update token in localStorage
      localStorage.setItem('token', data.token);
      
      showMessage('Password updated successfully');
      
      // Clear password form
      passwordForm.reset();

    } catch (error) {
      showMessage(error.message, true);
    }
  });

  // Handle logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = '/login';
    });
  }
});
