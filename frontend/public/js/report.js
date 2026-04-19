/* -------------------------------------------------
   CivicSense Report Page - Main Script
   Features:
   - Dynamic geolocation with Leaflet map
   - Image upload with AI analysis
   - Form validation and submission
--------------------------------------------------*/

(function() {
  // UTILITIES
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);
  
  // GLOBAL STATE
  let selectedCategory = null;
  let currentCoords = null;
  let map = null;
  let marker = null;
  let selectedImages = [];
  
  const categoryToDepartment = {
    "roads": "Public Works Department (PWD)",
    "water": "Water Supply & Sewerage Board",
    "electric": "Electricity Board (e.g., MSEB, BESCOM)",
    "environment": "Pollution Control Board / Environment Department",
    "sanitation": "Municipal Corporation (Sanitation Wing)",
    "infrastructure": "Urban Development Authority / PWD"
  };

  // INITIALIZATION
  async function mainInit() {
    console.log('Initializing report page...');
    
    // Check authentication
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/citizen-login.html';
      return;
    }

    try {
      // 1. Initialize User Data
      await initializeUserData();
      
      // 2. Setup Global Listeners
      setupGlobalListeners();

      // 3. Initialize Map
      if (document.getElementById('map')) {
        initMap();
      }
      
      // 4. Initialize Components
      initCategorySelection();
      initImageUpload();
      initFormSubmission();
      initThemeSwitcher();
      
      console.log('Report page fully initialized');
    } catch (error) {
      console.error('Initialization error:', error);
    }
  }

  // Run on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mainInit);
  } else {
    mainInit();
  }

  // --- USER DATA ---
  async function initializeUserData() {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/v1/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Auth failed');
      const { data } = await response.json();
      
      const nameElem = $('#ddUserName');
      const emailElem = $('#ddUserEmail');
      const userAvatar = $('#userAvatar');
      const ddAvatar = $('#ddUserAvatar');
      
      if (nameElem) nameElem.textContent = `${data.firstName} ${data.lastName}`;
      if (emailElem) emailElem.textContent = data.email;
      
      const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.firstName + ' ' + data.lastName)}&background=random&color=fff`;

      if (data.photo) {
        let avatarSrc = data.photo;
        if (!avatarSrc.startsWith('data:') && !avatarSrc.startsWith('http')) {
            avatarSrc = `/uploads/${avatarSrc}`;
        }
        if (userAvatar) userAvatar.src = avatarSrc;
        if (ddAvatar) ddAvatar.src = avatarSrc;
      } else {
        if (userAvatar) userAvatar.src = defaultAvatar;
        if (ddAvatar) ddAvatar.src = defaultAvatar;
      }
      localStorage.setItem('user', JSON.stringify(data));
    } catch (e) {
      console.error('UserData fetch error:', e);
    }
  }

  function setupGlobalListeners() {
    const logoutBtn = $('#logoutBtn');
    if (logoutBtn) {
      logoutBtn.onclick = (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = '/citizen-login.html';
      };
    }
  }

  // --- MAP FUNCTIONS ---
  function initMap() {
    const defaultLoc = [20.5937, 78.9629]; // India
    
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return;
    }

    map = L.map('map').setView(defaultLoc, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    marker = L.marker(defaultLoc, { draggable: true }).addTo(map);
    
    marker.on('dragend', function() {
      const pos = marker.getLatLng();
      currentCoords = { lat: pos.lat, lng: pos.lng };
      updateLocationText();
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      currentCoords = { lat, lng };
      marker.setLatLng([lat, lng]);
      updateLocationText();
    });

    // Get User Location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const { latitude, longitude } = pos.coords;
        currentCoords = { lat: latitude, lng: longitude };
        map.setView([latitude, longitude], 15);
        marker.setLatLng([latitude, longitude]);
        updateLocationText();
      }, (err) => console.warn('Geolocation failed:', err));
    }
  }

  async function updateLocationText() {
    const addrBox = $('#addressBox');
    const coordDisplay = $('#currentLocation');
    if (!currentCoords) return;

    if (coordDisplay) {
      coordDisplay.textContent = `📍 Lat: ${currentCoords.lat.toFixed(4)}, Lng: ${currentCoords.lng.toFixed(4)}`;
    }

    if (addrBox) {
      addrBox.placeholder = 'Fetching address...';
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentCoords.lat}&lon=${currentCoords.lng}`);
        const data = await res.json();
        addrBox.value = data.display_name || 'Location found';
      } catch (e) {
        addrBox.value = `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}`;
      }
    }
  }

  // --- COMPONENTS ---
  function initCategorySelection() {
    const iconBtns = $$('.category-icon');
    const deptBox = $('#departmentBox');
    const catInput = $('#selectedCategory');
    const dropBtn = $('#categoryDropdown');

    iconBtns.forEach(btn => {
      btn.onclick = () => {
        const val = btn.dataset.value;
        const label = btn.innerText.trim();
        selectCategory(val, label);
      };
    });

    function selectCategory(val, label) {
      selectedCategory = val;
      if (catInput) catInput.value = val;
      if (deptBox) deptBox.value = categoryToDepartment[val] || '';
      if (dropBtn) dropBtn.innerHTML = `${label} ▼`;
      
      iconBtns.forEach(b => b.classList.toggle('selected', b.dataset.value === val));
    }
  }

  function initImageUpload() {
    const cameraInput = $('#cameraInput');
    const galleryInput = $('#galleryInput');
    const previewWrapper = $('#previewWrapper');
    const previewImage = $('#previewImage');
    const removeBtn = $('#removeImage');
    const aiCard = $('#aiCard');

    [cameraInput, galleryInput].forEach(input => {
      if (!input) return;
      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (re) => {
          previewImage.src = re.target.result;
          previewWrapper.classList.remove('d-none');
          aiCard.classList.remove('d-none');

          // Trigger AI Analysis
          const base64 = re.target.result.split(',')[1];
          await runAIAnalysis(base64, file.type);
        };
        reader.readAsDataURL(file);
      };
    });

    if (removeBtn) {
      removeBtn.onclick = () => {
        previewWrapper.classList.add('d-none');
        aiCard.classList.add('d-none');
        if (cameraInput) cameraInput.value = '';
        if (galleryInput) galleryInput.value = '';
      };
    }
  }

  async function runAIAnalysis(base64, mimeType) {
    const aiStatus = $('#aiStatus');
    const aiDesc = $('#aiDescription');
    const loader = $('#descriptionLoader');
    const addrBox = $('#addressBox');

    aiStatus.textContent = 'Analyzing...';
    aiStatus.className = 'badge bg-primary ms-2';
    if (loader) loader.classList.remove('d-none');
    
    try {
      const res = await fetch('/api/reports/analyze-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          image: base64, 
          mimeType,
          location: addrBox ? addrBox.value : '' 
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || errorData.message || 'Analysis failed');
      }
      
      const data = await res.json();
      
      aiStatus.textContent = 'Analysis Complete';
      aiStatus.className = 'badge bg-success ms-2';
      let summary = 'Civic Issue Report';
      let description = data.analysis;

      // Robust parsing for SUMMARY/DESCRIPTION format (case-insensitive)
      const upperAnalysis = data.analysis.toUpperCase();
      if (upperAnalysis.includes('SUMMARY:') && upperAnalysis.includes('DESCRIPTION:')) {
        const descIndex = upperAnalysis.indexOf('DESCRIPTION:');
        summary = data.analysis.substring(upperAnalysis.indexOf('SUMMARY:') + 8, descIndex).trim();
        description = data.analysis.substring(descIndex + 12).trim();
      } else {
        // Fallback: Use the first sentence for title, max 50 chars
        const firstSentence = data.analysis.split(/[.!?]/)[0].trim();
        summary = firstSentence.length > 5 ? firstSentence.substring(0, 50) : 'Civic Issue Report';
        description = data.analysis;
      }

      if (aiDesc) aiDesc.value = description;

      // Update AI Card details
      if ($('#aiIssueType')) $('#aiIssueType').textContent = summary;
      if ($('#aiCategory')) $('#aiCategory').textContent = selectedCategory || 'Detected';
      if ($('#aiGps')) $('#aiGps').textContent = currentCoords ? `${currentCoords.lat.toFixed(4)}, ${currentCoords.lng.toFixed(4)}` : '-';
    } catch (e) {
      console.error('AI Analysis Error:', e.message);
      aiStatus.textContent = 'Analysis Failed';
      aiStatus.className = 'badge bg-danger ms-2';
      if (aiDesc) {
        aiDesc.value = '';
        aiDesc.placeholder = `Error: ${e.message}. Please describe manually.`;
      }
    } finally {
      if (loader) loader.classList.add('d-none');
    }
  }

  function initFormSubmission() {
    const form = $('#reportForm');
    const previewBtn = $('#previewReport');
    const previewModal = new bootstrap.Modal(document.getElementById('previewModal'));
    if (!form) return;

    // PREVIEW FUNCTIONALITY
    if (previewBtn) {
      previewBtn.onclick = () => {
        if (!selectedCategory) return alert('Please select a category');
        const desc = $('#aiDescription').value;
        if (!desc) return alert('Please provide a description');

        const aiIssue = $('#aiIssueType')?.textContent || '';
        const categoryLabel = $('.category-icon.selected small')?.textContent || selectedCategory;

        $('#modalTitle').textContent = aiIssue && aiIssue !== '-' ? aiIssue : `Civic Issue: ${categoryLabel}`;
        $('#modalDesc').textContent = desc;
        $('#modalCategory').textContent = categoryLabel.toUpperCase();
        $('#modalDept').textContent = $('#departmentBox').value;
        $('#modalAddress').textContent = $('#addressBox').value || 'Location pinpointed on map';
        
        const previewSrc = $('#previewImage').src;
        if (previewSrc && previewSrc.startsWith('data:')) {
          $('#modalPreviewImg').src = previewSrc;
          $('#modalPreviewImg').parentElement.classList.remove('d-none');
        } else {
          $('#modalPreviewImg').parentElement.classList.add('d-none');
        }

        previewModal.show();
      };
    }

    // Modal Submit Handle
    $('#confirmSubmit').onclick = () => {
      previewModal.hide();
      form.requestSubmit(); // This triggers form.onsubmit
    };

    form.onsubmit = async (e) => {
      e.preventDefault();
      const submitBtn = form.querySelector('button[type="submit"]');
      
      // Validation
      if (!selectedCategory) return alert('Please select a category');
      if (!$('#aiDescription').value) return alert('Please provide a description');

      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Submitting...';

      try {
        const aiIssue = $('#aiIssueType')?.textContent || '';
        const categoryLabel = $('.category-icon.selected small')?.textContent || selectedCategory;

        const formData = {
          title: aiIssue && aiIssue !== '-' ? aiIssue : `Civic Issue: ${categoryLabel}`,
          category: selectedCategory,
          description: $('#aiDescription').value,
          department: $('#departmentBox').value,
          location: {
            type: 'Point',
            coordinates: currentCoords ? [currentCoords.lng, currentCoords.lat] : [0,0],
            address: $('#addressBox').value
          },
          images: [$('#previewImage').src.split(',')[1]]
        };

        const res = await fetch('/api/reports', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(formData)
        });

        if (res.ok) {
          const result = await res.json();
          window.location.href = `/report-success.html?reportId=${result.data._id}`;
        } else {
          const errData = await res.json();
          alert(`Failed to submit report: ${errData.message || 'Unknown error'}`);
        }
      } catch (err) {
        console.error(err);
        alert('Server error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Report';
      }
    };
  }

  function initThemeSwitcher() {
    const themeSwitch = $('#themeSwitch');
    if (!themeSwitch) return;
    
    const applyTheme = (dark) => {
      document.body.setAttribute('data-bs-theme', dark ? 'dark' : 'light');
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    };

    const saved = localStorage.getItem('theme') === 'dark';
    themeSwitch.checked = saved;
    applyTheme(saved);

    themeSwitch.onchange = (e) => applyTheme(e.target.checked);
  }

})();
