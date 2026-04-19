// Sample report data - In a real app, this would come from an API
const sampleReports = [
  {
    id: 'RPT-2023-001',
    title: 'Pothole on Main Street',
    description: 'Large pothole causing traffic issues near the intersection with 5th Avenue. Several cars have already been damaged.',
    category: 'Roads',
    status: 'active',
    priority: 'high',
    location: '123 Main St, Anytown',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    dateReported: '2023-05-15T10:30:00',
    dateUpdated: '2023-05-20T14:15:00',
    progress: 60,
    currentStage: 'In Progress',
    stages: [
      { name: 'Reported', completed: true, date: '2023-05-15T10:30:00' },
      { name: 'Verified', completed: true, date: '2023-05-16T09:15:00' },
      { name: 'Assigned', completed: true, date: '2023-05-18T11:45:00' },
      { name: 'In Progress', completed: true, date: '2023-05-20T14:15:00' },
      { name: 'Resolved', completed: false, date: null }
    ],
    assignedTo: 'Public Works Dept',
    lastUpdate: 'Work order issued and repair scheduled for next week',
    photos: ['/img/sample-pothole.jpg'],
    pointsEarned: 0
  }
];

// DOM Elements (will be initialized in setupEventListeners)
let reportsList, statsCards, performanceMetrics,
    searchInput, dateRangeFilter, categoryFilter, statusFilter,
    itemsPerPageSelect, pagination, showingFrom, showingTo, totalItems;

// State
let currentPage = 1;
let itemsPerPage = 10;
let filteredReports = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', async () => {
  // Check authentication
  if (!window.isAuthenticated()) {
    window.location.href = '/login';
    return;
  }

  try {
    // Load user data
    await loadUserData();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load reports
  await loadReports();
    
    // Setup theme toggle
    setupThemeToggle();
  } catch (error) {
    console.error('Error initializing page:', error);
    showToast('error', 'Failed to initialize page');
  }
});

async function loadUserData() {
  try {
    const token = window.getToken();
    if (!token) {
      throw new Error('No auth token found');
    }

    const response = await fetch('/api/v1/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await response.json();
    
    if (userData.success) {
      // Update user data in localStorage and update UI
      localStorage.setItem('user', JSON.stringify(userData.data));
      
      // Update dropdown user info
      document.getElementById('ddUserName').textContent = `${userData.data.firstName} ${userData.data.lastName}`;
      document.getElementById('ddUserEmail').textContent = userData.data.email;
      
      // Update avatar display
      updateAvatarDisplay(userData.data.photo, userData.data.firstName, userData.data.lastName);
      
      // Update dropdown avatar explicitly
      const ddAvatar = document.getElementById('ddUserAvatar');
      if (ddAvatar) {
          if (userData.data.photo) {
              ddAvatar.src = `/uploads/${userData.data.photo}`;
          } else {
              ddAvatar.src = `https://ui-avatars.com/api/?name=${userData.data.firstName}+${userData.data.lastName}&background=random&color=fff`;
          }
      }
    } else {
      throw new Error(userData.message || 'Failed to load user data');
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    showToast('error', 'Failed to load user data');
  }
}

// Update avatar display with initials fallback
function updateAvatarDisplay(photoUrl, firstName, lastName) {
  const userAvatar = document.getElementById('userAvatar');
  const avatarInitials = document.getElementById('avatarInitials');
  
  if (photoUrl) {
    // If there's a photo URL, use it
    userAvatar.src = `/uploads/${photoUrl}`;
    userAvatar.style.display = 'block';
    if (avatarInitials) avatarInitials.style.display = 'none';
    
    // Handle image load error
    userAvatar.onerror = function() {
      this.style.display = 'none';
      if (avatarInitials) {
        avatarInitials.style.display = 'flex';
        avatarInitials.textContent = getInitials(firstName, lastName);
      }
    };
  } else {
    // Show initials if no image
    userAvatar.style.display = 'none';
    if (avatarInitials) {
      avatarInitials.style.display = 'flex';
      avatarInitials.textContent = getInitials(firstName, lastName);
    }
  }
}

// Get user initials
function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last || 'U';
}

// Setup theme toggle
function setupThemeToggle() {
  const themeSwitch = document.getElementById('themeSwitch');
  if (!themeSwitch) return;

  // Set initial state
  const currentTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', currentTheme);
  themeSwitch.checked = currentTheme === 'dark';

  // Handle theme toggle
  themeSwitch.addEventListener('change', () => {
    const newTheme = themeSwitch.checked ? 'dark' : 'light';
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  });
}

// Setup logout handler
function setupLogoutHandler() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.logout(); // Use the logout function from auth.js
    });
  }
}

function setupEventListeners() {
  // Initialize DOM elements
  reportsList = document.getElementById('reportsList');
  statsCards = document.getElementById('statsCards');
  performanceMetrics = document.getElementById('performanceMetrics');
  searchInput = document.getElementById('searchReports');
  dateRangeFilter = document.getElementById('dateRangeFilter');
  categoryFilter = document.getElementById('categoryFilter');
  statusFilter = document.getElementById('statusFilter');
  itemsPerPageSelect = document.getElementById('itemsPerPage');
  pagination = document.getElementById('pagination');
  showingFrom = document.getElementById('showingFrom');
  showingTo = document.getElementById('showingTo');
  totalItems = document.getElementById('totalItems');
  
  // Add event listeners to filters
  if (searchInput) {
    searchInput.addEventListener('input', filterReports);
  }
  
  if (dateRangeFilter) {
    dateRangeFilter.addEventListener('change', filterReports);
  }
  
  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterReports);
  }
  
  if (statusFilter) {
    statusFilter.addEventListener('change', filterReports);
  }
  
  if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener('change', function() {
      itemsPerPage = parseInt(this.value);
    currentPage = 1;
    updatePagination();
    renderReports();
  });
}

  // Reset filters button
  const resetFiltersBtn = document.getElementById('resetFilters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      if (dateRangeFilter) dateRangeFilter.selectedIndex = 0;
      if (categoryFilter) categoryFilter.selectedIndex = 0;
      if (statusFilter) statusFilter.selectedIndex = 0;
      filterReports();
    });
  }

  // Setup logout handler
  setupLogoutHandler();
}

async function loadReports() {
  try {
    const userId = localStorage.getItem('userId');
    const userEmail = localStorage.getItem('userEmail');

    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (userEmail) params.append('userEmail', userEmail);
    const response = await fetch(`/api/reports?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch reports');
    }

    const resJson = await response.json();
    const apiReports = Array.isArray(resJson.data) ? resJson.data : [];

    // Transform API payload into structure expected by UI helpers
    const adapted = apiReports.map(adaptReportForUI);

    // Replace existing report array contents with the fetched data
    sampleReports.splice(0, sampleReports.length, ...adapted);

    // Refresh UI with new data
    filterReports();
    updateStatsCards();
    updatePerformanceMetrics();
  } catch (error) {
    console.error('Error loading reports:', error);
    showToast('error', 'Failed to load reports');
  }
}

/**
 * Convert raw backend report document into the shape required by the
 * existing UI helpers (progress bar, status badges, etc.).
 */
function adaptReportForUI(r) {
  // Map backend status to UI status with more granular stages
  const statusMap = { 
    'pending': 'reported',
    'active': 'in-progress', // Map 'active' to 'in-progress'
    'verified': 'verified',
    'assigned': 'assigned',
    'in-progress': 'in-progress',
    'resolved': 'resolved',
    'rejected': 'reported' // Reset to reported if rejected
  };
  let uiStatus = statusMap[r.status] || 'reported';

  const reportedDateObj = r.createdAt ? new Date(r.createdAt) : new Date();
  const updatedDateObj = r.updatedAt ? new Date(r.updatedAt) : reportedDateObj;
  const resolvedDateObj = r.resolvedAt ? new Date(r.resolvedAt) : (r.status === 'resolved' ? updatedDateObj : null);

  // Mark as overdue if unresolved for more than 15 days
  const MS_IN_DAY = 86400000;
  const daysSinceReport = (Date.now() - reportedDateObj.getTime()) / MS_IN_DAY;
  let overdueBy;
  if (uiStatus !== 'resolved' && daysSinceReport > 15) {
    uiStatus = 'overdue';
    overdueBy = `${Math.floor(daysSinceReport - 15)} days`;
  }

  // Calculate progress percentage based on current stage
  const progressMap = {
    'reported': 10,
    'verified': 30,
    'assigned': 50,
    'in-progress': 70,
    'resolved': 100,
    'overdue': 30 // Override if status is overdue
  };
  
  let progress = progressMap[uiStatus] || 10;
  
  // For custom stages, ensure progress is within bounds
  progress = Math.min(100, Math.max(0, progress));

  return {
    id: r._id,
    title: r.title || 'Untitled',
    description: r.description || '',
    category: (() => {
      const cat = (r.category || 'Others').toString().toLowerCase();
      const map = {
        'roads': 'Roads',
        'water': 'Water',
        'electric': 'Electricity',
        'environment': 'Environment',
        'sanitation': 'Sanitation',
        'infrastructure': 'Infrastructure',
        'others': 'Others'
      };
      return map[cat] || (cat.charAt(0).toUpperCase() + cat.slice(1));
    })(),
    status: uiStatus,
    priority: 'medium',
    location: r.location?.address || 'Unknown location',
    coordinates: {
      lat: r.location?.coordinates?.[1] ?? 0,
      lng: r.location?.coordinates?.[0] ?? 0
    },
    dateReported: reportedDateObj.toISOString(),
    dateUpdated: updatedDateObj.toISOString(),
    dateResolved: resolvedDateObj ? resolvedDateObj.toISOString() : null,
    progress,
    currentStage: uiStatus === 'resolved' ? 'Resolved' : (uiStatus === 'in-progress' ? 'In Progress' : (uiStatus === 'overdue' ? 'Overdue' : 'Reported')),
    // Build timeline stages – only include a date if the stage is actually completed
    stages: [
      {
        name: 'Reported',
        completed: true,
        date: reportedDateObj.toISOString()
      },
      {
        name: 'Verified',
        completed: ['verified', 'assigned', 'in-progress', 'resolved'].includes(uiStatus),
        date: ['verified', 'assigned', 'in-progress', 'resolved'].includes(uiStatus)
          ? (r.verifiedAt ? new Date(r.verifiedAt).toISOString() : updatedDateObj.toISOString())
          : null
      },
      {
        name: 'Assigned',
        completed: ['assigned', 'in-progress', 'resolved'].includes(uiStatus),
        date: ['assigned', 'in-progress', 'resolved'].includes(uiStatus)
          ? (r.assignedAt ? new Date(r.assignedAt).toISOString() : updatedDateObj.toISOString())
          : null
      },
      {
        name: 'In Progress',
        completed: ['in-progress', 'resolved'].includes(uiStatus),
        date: ['in-progress', 'resolved'].includes(uiStatus)
          ? (r.inProgressAt ? new Date(r.inProgressAt).toISOString() : updatedDateObj.toISOString())
          : null
      },
      {
        name: 'Resolved',
        completed: uiStatus === 'resolved',
        date: uiStatus === 'resolved'
          ? (resolvedDateObj ? resolvedDateObj.toISOString() : null)
          : null
      }
    ],
    assignedTo: r.assignedTo || '',
    lastUpdate: r.lastUpdate || '',
    photos: r.images || [],
    userMobile: r.userMobile || '',
    overdueBy
  };
}

// Filter reports based on search and filters
function filterReports() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const selectedStatus = statusFilter.value; // Get the selected status from dropdown
  const dateRange = dateRangeFilter.value;
  // Pre-compute earliest date based on range for efficiency
  let earliestDate = null;
  const now = new Date();
  switch (dateRange) {
    case 'Last 7 days':
      earliestDate = new Date(now.getTime() - 7 * 86400000);
      break;
    case 'Last 30 days':
      earliestDate = new Date(now.getTime() - 30 * 86400000);
      break;
    case 'Last 90 days':
      earliestDate = new Date(now.getTime() - 90 * 86400000);
      break;
    case 'This year':
      earliestDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      // 'All time' => no restriction
      earliestDate = null;
  }
  
  filteredReports = sampleReports.filter(report => {
    // Search term filter
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm) ||
      report.description.toLowerCase().includes(searchTerm) ||
      report.id.toLowerCase().includes(searchTerm);
    
    // Category filter
    const normalizedCategoryFilter = category.toLowerCase();
    const matchesCategory = normalizedCategoryFilter === 'all categories'
      || report.category.toLowerCase() === normalizedCategoryFilter
      || report.category.toLowerCase().includes(normalizedCategoryFilter);
    
    // Status filter - use the same mapping as in adaptReportForUI for consistency
    const statusMap = {
      'pending': 'reported',
      'active': 'in-progress',
      'verified': 'verified',
      'assigned': 'assigned',
      'in-progress': 'in-progress',
      'resolved': 'resolved',
      'overdue': 'overdue'
    };
    
    // Get the UI status using the same mapping as in adaptReportForUI
    const uiStatus = statusMap[report.status] || 'reported';
    
    // For 'active' filter, include any non-resolved report
    // For other filters, do exact match against the UI status
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' ? uiStatus !== 'resolved' : uiStatus === selectedStatus);
    
    // Date range filter
    const matchesDateRange = earliestDate ? (new Date(report.dateReported) >= earliestDate && new Date(report.dateReported) <= now) : true;
    
    return matchesSearch && matchesCategory && matchesStatus && matchesDateRange;
  });
  
  totalItems.textContent = filteredReports.length;
  updatePagination();
  renderReports();
}

// Render the reports list
function renderReports() {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, endIndex);
  
  showingFrom.textContent = filteredReports.length > 0 ? startIndex + 1 : 0;
  showingTo.textContent = Math.min(endIndex, filteredReports.length);
  
  if (paginatedReports.length === 0) {
    reportsList.innerHTML = `
      <div class="card">
        <div class="card-body text-center py-5">
          <i class="fas fa-inbox fa-3x text-muted mb-3"></i>
          <h5>No reports found</h5>
          <p class="text-muted">Try adjusting your search or filter criteria</p>
          <button class="btn btn-primary mt-2" onclick="window.location.href='/report'">
            <i class="fas fa-plus-circle me-2"></i>Create New Report
          </button>
        </div>
      </div>`;
    return;
  }
  
  reportsList.innerHTML = paginatedReports.map(report => createReportCard(report)).join('');
  
  // Add event listeners to view buttons
  document.querySelectorAll('.view-report-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const reportId = e.currentTarget.dataset.id;
      viewReportDetails(reportId);
    });
  });
}

// Create HTML for a report card
function createReportCard(report) {
  const statusClass = {
    'active': 'status-active',
    'in-progress': 'status-in-progress',
    'resolved': 'status-resolved',
    'overdue': 'status-overdue'
  }[report.status] || 'status-active';
  
  const statusText = {
    'active': 'Active',
    'in-progress': 'In Progress',
    'resolved': 'Resolved',
    'overdue': 'Overdue'
  }[report.status] || 'Active';
  
  const categoryIcon = getCategoryIcon(report.category);
  const daysAgo = Math.floor((new Date() - new Date(report.dateUpdated)) / (1000 * 60 * 60 * 24));
  
  // Add phone number to the card
  const phoneSection = `<div class="mb-1"><strong>Phone:</strong> ${report.userMobile || '-'}</div>`;
  const resolvedSection = report.dateResolved ? `<div class="mb-1"><strong>Resolved on:</strong> ${formatDate(report.dateResolved)}</div>` : '';
  
  const getImgUrl = (path) => {
    if (!path) return 'https://images.unsplash.com/photo-1595240212001-c889de340801?q=80&w=2670&auto=format&fit=crop';
    if (path.startsWith('data:') || path.startsWith('http')) return path;
    if (path.startsWith('/uploads/')) return path;
    if (path.startsWith('uploads/')) return '/' + path;
    return '/uploads/' + path;
  };

  const reportImg = getImgUrl(report.photos && report.photos.length > 0 ? report.photos[0] : null);

  return `
    <div class="card report-card scroll-reveal">
      <div class="report-card-inner">
        <div class="row g-4">
          <div class="col-lg-4">
            <div class="report-img-container">
              <img src="${reportImg}" alt="${report.title}">
              <div class="status-badge ${statusClass}" style="position: absolute; top: 1rem; left: 1rem; z-index: 2;">
                ${statusText}
              </div>
            </div>
          </div>
          <div class="col-lg-8">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div>
                <div class="d-flex align-items-center gap-2 mb-2">
                  <div class="category-icon" style="width: 32px; height: 32px; font-size: 0.9rem;">
                    <i class="${categoryIcon}"></i>
                  </div>
                  <span class="text-uppercase fw-bold text-secondary small" style="letter-spacing: 1px;">${report.category}</span>
                </div>
                <h4 class="fw-bold mb-1">${report.title}</h4>
                <div class="d-flex align-items-center gap-3 text-muted small">
                  <span><i class="fas fa-fingerprint me-1"></i> ${report._id || report.id}</span>
                  <span><i class="fas fa-calendar-alt me-1"></i> ${formatDate(report.dateReported)}</span>
                </div>
              </div>
              <div class="text-end d-none d-sm-block">
                <div class="badge bg-light text-dark border p-2 rounded-3 mb-2">
                   <i class="fas fa-map-marker-alt text-danger me-1"></i>
                   ${report.location}
                </div>
              </div>
            </div>

            <p class="text-secondary mb-4" style="font-size: 1.05rem; line-height: 1.6;">${report.description}</p>
            
            <!-- Progress Tracker -->
            <div class="mb-4">
              <div class="d-flex justify-content-between mb-2">
                <span class="fw-bold small">Current Phase: <span class="text-accent">${report.currentStage}</span></span>
                <span class="fw-bold small">${report.progress}%</span>
              </div>
              <div class="progress" style="height: 6px; background: rgba(0,0,0,0.05);">
                <div class="progress-bar" role="progressbar" style="width: ${report.progress}%"></div>
              </div>
            </div>

            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div class="d-flex gap-2">
                <button class="btn btn-primary px-4 view-report-btn" data-id="${report.id}">
                  <i class="fas fa-expand-arrows-alt me-2"></i>Full Details
                </button>
                <button class="btn btn-outline-secondary px-3">
                  <i class="fas fa-map-pin"></i>
                </button>
              </div>
              
              <div class="text-muted small">
                 <i class="fas fa-sync-alt fa-spin-hover me-1"></i> Updated ${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// Update stats cards
function updateStatsCards() {
  const MS_IN_DAY = 86400000;
  const now = Date.now();
  
  // Process each report to determine if it's overdue
  const reportsWithOverdue = sampleReports.map(report => {
    if (report.status === 'resolved') return { ...report, isOverdue: false };
    
    const reportedDate = new Date(report.dateReported || report.createdAt || now).getTime();
    const daysSinceReport = (now - reportedDate) / MS_IN_DAY;
    const isOverdue = daysSinceReport > 15;
    
    return {
      ...report,
      isOverdue,
      // Update status to overdue if needed
      status: isOverdue ? 'overdue' : report.status
    };
  });
  
  const totalReports = reportsWithOverdue.length;
  const resolvedCount = reportsWithOverdue.filter(r => r.status === 'resolved').length;
  const overdueCount = reportsWithOverdue.filter(r => r.isOverdue).length;
  const activeCount = totalReports - resolvedCount - overdueCount;
  
  const inProgressCount = reportsWithOverdue.filter(r => 
    (r.status === 'in-progress' || r.status === 'active' || r.status === 'assigned' || r.status === 'verified') && 
    !r.isOverdue
  ).length;
  
  // For backward compatibility
  const statusCounts = {
    pending: reportsWithOverdue.filter(r => (r.status === 'pending' || r.status === 'reported') && !r.isOverdue).length,
    inProgress: inProgressCount,
    resolved: resolvedCount,
    overdue: overdueCount
  };
  
  const statusArray = [statusCounts.pending, inProgressCount, resolvedCount];
  const resolutionRate = totalReports ? Math.round((statusCounts.resolved / totalReports) * 100) : 0;
  
  statsCards.innerHTML = `
    <div class="stat-card" style="opacity: 1; transform: translateY(0px); transition: 0.6s;">
      <div class="card-body d-flex flex-column justify-content-center">
        <div class="stat-icon">
          <i class="fas fa-clipboard-list"></i>
        </div>
          <h3 class="display-5 fw-bold metric-value text-dark">${totalReports}</h3>
          <p class="text-muted">Total Reports</p>
        </div>
      </div>
    <div class="stat-card" style="opacity: 1; transform: translateY(0px); transition: 0.6s;">
      <div class="card-body d-flex flex-column justify-content-center">
        <div class="stat-icon">
          <i class="fas fa-check-circle"></i>
        </div>
        <h3 class="display-5 fw-bold metric-value text-dark">${resolvedCount}</h3>
        <p class="text-muted">Reports Resolved</p>
        </div>
      </div>
    <div class="stat-card" style="opacity: 1; transform: translateY(0px); transition: 0.6s;">
      <div class="card-body d-flex flex-column justify-content-center">
        <div class="stat-icon">
          <i class="fas fa-chart-line"></i>
        </div>
        <h3 class="display-5 fw-bold metric-value text-dark">${resolutionRate}%</h3>
        <p class="text-muted mb-0">Resolution Rate</p>
        </div>
      </div>
    <div class="stat-card" style="opacity: 1; transform: translateY(0px); transition: 0.6s;">
      <div class="card-body d-flex flex-column justify-content-center">
        <div class="stat-icon">
          <i class="fas fa-clock"></i>
          </div>
        <h3 class="display-5 fw-bold metric-value text-dark">${activeCount}</h3>
        <p class="text-muted mb-0">Active Reports</p>
          </div>
        </div>
      </div>
    <div class="stat-card" style="opacity: 1; transform: translateY(0px); transition: 0.6s;">
      <div class="card-body d-flex flex-column justify-content-center">
        <div class="stat-icon">
          <i class="fas fa-exclamation-triangle"></i>
        </div>
        <h3 class="display-5 fw-bold metric-value text-dark">${overdueCount}</h3>
        <p class="text-muted mb-0">Overdue</p>
      </div>
    </div>
  `;
  
  animateMetricValues();
}

// Update performance metrics
function updatePerformanceMetrics() {
  const performanceMetrics = document.getElementById('performanceMetrics');
  
  if (sampleReports.length === 0) {
  performanceMetrics.innerHTML = `
    <div class="card-header bg-white">
        <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Performance Metrics</h5>
      </div>
      <div class="card-body text-center py-5">
        <i class="fas fa-exclamation-circle fa-3x text-info mb-3"></i>
        <p class="lead">No reports filed yet.</p>
        <p class="text-muted">File your first report to see your performance metrics here!</p>
        <button class="btn btn-primary mt-3" onclick="window.location.href='/report'">
          <i class="fas fa-plus-circle me-2"></i>File New Report
        </button>
      </div>
    `;
    return; // Exit the function if no reports
  }

  // Calculate metrics from actual data
  const totalReports = sampleReports.length;
  const resolvedReports = sampleReports.filter(r => r.status === 'resolved').length;
  const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
  const MS_IN_DAY = 1000 * 60 * 60 * 24;
  
  // Calculate average resolution time
  // Calculate average resolution time (in days with one decimal place)
  let avgResolutionTime = 0.0;
  if (resolvedReports > 0) {
    const resolvedReportsWithDates = sampleReports.filter(r => r.status === 'resolved' && r.dateReported && r.dateResolved);
    if (resolvedReportsWithDates.length > 0) {
      const totalDays = resolvedReportsWithDates.reduce((sum, report) => {
        const reportedDate = new Date(report.dateReported);
        const resolvedDate = new Date(report.dateResolved);
        return sum + ((resolvedDate - reportedDate) / MS_IN_DAY);
      }, 0);
      avgResolutionTime = (totalDays / resolvedReportsWithDates.length);
    }
  }
  // Keep only one decimal for display
  const avgResolutionTimeDisplay = avgResolutionTime.toFixed(1);
  
  // Get data for last 2 months for trend calculation
  const lastTwoMonthsData = getMonthlyData(getLastMonths(2));
  const currentMonthReported = lastTwoMonthsData.reportedData[1] || 0;
  const currentMonthResolved = lastTwoMonthsData.resolvedData[1] || 0;
  const prevMonthReported = lastTwoMonthsData.reportedData[0] || 0;
  const prevMonthResolved = lastTwoMonthsData.resolvedData[0] || 0;

  const currentMonthResolutionRate = currentMonthReported > 0 ? (currentMonthResolved / currentMonthReported) : 0;
  const prevMonthResolutionRate = prevMonthReported > 0 ? (prevMonthResolved / prevMonthReported) : 0;

  let resolutionTrend = 0;
  if (prevMonthResolutionRate > 0) {
    resolutionTrend = ((currentMonthResolutionRate - prevMonthResolutionRate) / prevMonthResolutionRate) * 100;
  } else if (currentMonthResolutionRate > 0) {
    resolutionTrend = 100; // Significant increase if previous was zero and current is not
  }

  // Round trend to 2 decimal places for display
  const resolutionTrendDisplay = Math.abs(resolutionTrend).toFixed(2);
  const resolutionTrendClass = resolutionTrend >= 0 ? 'text-success' : 'text-danger';
  const resolutionTrendIcon = resolutionTrend >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
  
  // Create HTML structure
  performanceMetrics.innerHTML = `
    <div class="card-header bg-white d-flex justify-content-between align-items-center">
      <h5 class="mb-0"><i class="fas fa-chart-line me-2"></i>Performance Metrics</h5>
        <div class="dropdown">
        <button class="btn btn-sm btn-outline-secondary dropdown-toggle time-range-selector" type="button" data-bs-toggle="dropdown">
          <i class="fas fa-calendar me-1"></i> <span>Last 6 Months</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item time-range" href="#" data-months="3">Last 3 Months</a></li>
          <li><a class="dropdown-item time-range active" href="#" data-months="6">Last 6 Months</a></li>
          <li><a class="dropdown-item time-range" href="#" data-months="12">Last Year</a></li>
          </ul>
      </div>
    </div>
    <div class="card-body">
      <div class="row mb-4">
        <!-- Resolution Rate Metric -->
        <div class="col-md-6 mb-4 mb-md-0">
          <div class="metric-card p-3 rounded-3 h-100">
            <div class="d-flex align-items-center mb-2">
              <div class="metric-icon bg-primary bg-opacity-10 p-2 rounded-circle me-2">
                <i class="fas fa-tachometer-alt text-primary"></i>
            </div>
              <h6 class="mb-0">Resolution Rate</h6>
            </div>
            <div class="d-flex align-items-end mt-3">
               <h2 class="display-4 mb-0 fw-bold metric-value">${resolutionRate}%</h2>
               <div class="ms-2 mb-1 ${resolutionTrendClass}">
                 <i class="fas ${resolutionTrendIcon} me-1"></i>
                 <small>${resolutionTrendDisplay}% ${resolutionTrend >= 0 ? 'increase' : 'decrease'}</small>
          </div>
        </div>
            <div class="progress mt-3" style="height: 8px;">
              <div class="progress-bar bg-primary progress-bar-animated" role="progressbar" 
                   style="width: ${resolutionRate}%; transition: width 1.5s ease-in-out;" 
                   aria-valuenow="${resolutionRate}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="text-muted small mt-2">Compared to previous period</div>
          </div>
        </div>
        
        <!-- Average Resolution Time Metric -->
        <div class="col-md-6 mb-4 mb-md-0">
          <div class="metric-card p-3 rounded-3 h-100">
            <div class="d-flex align-items-center mb-2">
              <div class="metric-icon bg-success bg-opacity-10 p-2 rounded-circle me-2">
                <i class="fas fa-clock text-success"></i>
              </div>
              <h6 class="mb-0">Avg. Resolution Time</h6>
            </div>
            <div class="d-flex align-items-end mt-3">
               <h2 class="display-4 mb-0 fw-bold metric-value">${avgResolutionTime}</h2>
              <div class="mb-1 ms-2">days</div>
            </div>
            <div class="progress mt-3" style="height: 8px;">
              <div class="progress-bar bg-success" role="progressbar" 
                   style="width: ${Math.min(100, avgResolutionTime * 10)}%; transition: width 1.5s ease-in-out;" 
                   aria-valuenow="${Math.min(100, avgResolutionTime * 10)}" aria-valuemin="0" aria-valuemax="100"></div>
            </div>
            <div class="d-flex justify-content-between mt-1">
              <span class="text-muted small"></span>
              <span class="text-muted small">Max: 10.0</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Monthly Trend Chart -->
      <div class="mt-5">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h6 class="mb-0">Monthly Trend</h6>
          <div class="chart-legend d-flex align-items-center">
            <div class="d-flex align-items-center me-3">
              <div class="legend-color bg-primary me-2"></div>
              <span class="small">Reported</span>
            </div>
          <div class="d-flex align-items-center">
              <div class="legend-color bg-success me-2"></div>
              <span class="small">Resolved</span>
            </div>
            </div>
          </div>
        <div class="chart-container" style="position: relative; height: 250px;">
          <canvas id="monthlyTrendChart"></canvas>
        </div>
      </div>
    </div>`;

  // Add event listeners to time range selector
  document.querySelectorAll('.time-range').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const months = parseInt(e.target.dataset.months);
      document.querySelectorAll('.time-range').forEach(el => el.classList.remove('active'));
      e.target.classList.add('active');
      document.querySelector('.time-range-selector span').textContent = `Last ${months} ${months === 1 ? 'Month' : 'Months'}`;
      updateMetricsTimeRange(months);
    });
  });

  // Create chart
  createMonthlyTrendChart(lastTwoMonthsData);

  // Add styles for metrics
  addMetricStyles();
  
  // Add animation to metric values
  animateMetricValues();
}

// Helper function to get data for the last N months
function getLastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = month.toLocaleDateString('en-US', { month: 'short' });
    months.push(monthName);
  }
  return months;
}

// Helper function to get monthly report data
function getMonthlyData(months) {
  // Use actual report data to generate the chart
  const reportedByMonth = {};
  const resolvedByMonth = {};
  
  // Initialize all months with zero values
  months.forEach(month => {
    reportedByMonth[month] = 0;
    resolvedByMonth[month] = 0;
  });
  
  // Count reports by month
  sampleReports.forEach(report => {
    if (report.dateReported) {
      const reportDate = new Date(report.dateReported);
      const reportMonth = reportDate.toLocaleDateString('en-US', { month: 'short' });
      
      if (months.includes(reportMonth)) {
        reportedByMonth[reportMonth]++;
      }
    }
    
    if (report.dateResolved && report.status === 'resolved') {
      const resolvedDate = new Date(report.dateResolved);
      const resolvedMonth = resolvedDate.toLocaleDateString('en-US', { month: 'short' });
      
      if (months.includes(resolvedMonth)) {
        resolvedByMonth[resolvedMonth]++;
      }
    }
  });
  
  // Convert to arrays for Chart.js
  const reportedData = months.map(month => reportedByMonth[month]);
  const resolvedData = months.map(month => resolvedByMonth[month]);
  
  // If we have no data, generate some sample data for visualization
  if (reportedData.every(val => val === 0)) {
    for (let i = 0; i < months.length; i++) {
      // Base values with some randomness
      const baseReported = 5 + Math.floor(Math.random() * 5);
      reportedData[i] = baseReported;
      
      // Resolution rate improves over time
      const resolutionRate = 0.5 + (i * 0.05);
      resolvedData[i] = Math.floor(baseReported * resolutionRate);
    }
  }
  
  return {
    months,
    reportedData,
    resolvedData
  };
}

// Create monthly trend chart using Chart.js
function createMonthlyTrendChart(data) {
  const ctx = document.getElementById('monthlyTrendChart').getContext('2d');
  
  // Destroy existing chart if it exists
  if (window.monthlyChart) {
    window.monthlyChart.destroy();
  }
  
  window.monthlyChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.months,
      datasets: [
        {
          label: 'Reported',
          data: data.reportedData,
          backgroundColor: 'rgba(13, 110, 253, 0.7)',
          borderColor: 'rgba(13, 110, 253, 1)',
          borderWidth: 1
        },
        {
          label: 'Resolved',
          data: data.resolvedData,
          backgroundColor: 'rgba(25, 135, 84, 0.7)',
          borderColor: 'rgba(25, 135, 84, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          },
          ticks: {
            precision: 0
          }
        }
      }
        }
      });
    }
    

// Update metrics based on selected time range
function updateMetricsTimeRange(months) {
  const updatedMonths = getLastMonths(months);
  const updatedData = getMonthlyData(updatedMonths);
  createMonthlyTrendChart(updatedData);
}

// Generate star rating HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
  
  let html = '';
  
  // Full stars
  for (let i = 0; i < fullStars; i++) {
    html += '<i class="fas fa-star"></i>';
  }
  
  // Half star
  if (halfStar) {
    html += '<i class="fas fa-star-half-alt"></i>';
  }
  
  // Empty stars
  for (let i = 0; i < emptyStars; i++) {
    html += '<i class="far fa-star"></i>';
  }
  
  return html;
}

// Add CSS styles for metrics
function addMetricStyles() {
  // Check if styles already exist
  if (document.getElementById('metric-styles')) return;
  
  const styleEl = document.createElement('style');
  styleEl.id = 'metric-styles';
  styleEl.textContent = `
    .stats-card {
      transition: all 0.3s ease;
      border: 1px solid #e9ecef; /* Lighter border for a cleaner look */
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); /* Even softer shadow */
      background: #ffffff;
      border-radius: 8px; /* Sharper corners like the image */
      padding: 25px 30px; /* Increased padding for wider appearance and overall size */
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    
    .stats-card:hover {
      transform: translateY(-2px); /* Less dramatic hover effect */
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    
    .icon-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      margin-bottom: 15px; /* Adjusted margin */
      box-shadow: none; /* No shadow on icon circle, as in image */
    }
    
    /* Individual icon circle background colors for stats cards */
    .stats-card:nth-child(1) .icon-circle { background-color: #e0f2ff; } /* Light blue */
    .stats-card:nth-child(2) .icon-circle { background-color: #e6ffed; } /* Light green */
    .stats-card:nth-child(3) .icon-circle { background-color: #e0f8ff; } /* Light blue for resolution rate */
    .stats-card:nth-child(4) .icon-circle { background-color: #fffde0; } /* Light yellow */
    .stats-card:nth-child(5) .icon-circle { background-color: #ffe0e0; } /* Light red */

    .metric-card {
      transition: all 0.3s ease;
      border: 1px solid #e9ecef;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      background: #ffffff;
      border-radius: 8px;
      padding: 20px;
    }
    
    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    
    .metric-icon {
      width: 45px;
      height: 45px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      border-radius: 50%;
      box-shadow: 0 1px 5px rgba(0,0,0,0.08); /* Softer shadow */
    }
    
    .chart-legend .legend-color {
      width: 14px;
      height: 14px;
      border-radius: 3px;
    }
    
    .dropdown-item.active {
      background-color: rgba(13, 110, 253, 0.1);
      color: #0d6efd;
      font-weight: 500;
    }
    
    .metric-value {
      background: none; /* Remove gradient */
      -webkit-background-clip: unset;
      background-clip: unset;
      color: #212529; /* Plain dark text */
      text-shadow: none; /* Remove text shadow */
      font-size: 2.5rem; /* Adjusted for image */
      font-weight: bold; /* Keep numbers bold */
      margin-bottom: 0px; /* Adjust spacing */
    }
    
    .stats-card .metric-value {
        font-size: 3rem; /* Increased for better visual impact as per image */
        font-weight: bold;
        margin-top: 0px; /* Remove extra top margin */
    }
    
    .stats-card p.text-muted {
        font-size: 0.85rem; /* Adjusted for compactness as per image */
        color: #6c757d; /* Standard muted text color */
        font-weight: normal; /* Normal weight for descriptive text */
        margin-top: 5px; /* Add a bit of space */
    }

    .progress {
      overflow: hidden;
      border-radius: 8px;
      background-color: #e9ecef;
      box-shadow: none; /* Remove shadow on progress bar */
    }
    
    .progress-bar {
      border-radius: 8px;
      box-shadow: none; /* Remove shadow on progress bar */
    }
    
    .chart-container {
      border-radius: 10px;
      padding: 20px;
      background-color: #ffffff;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: all 0.3s ease;
    }
    
    .chart-container:hover {
      box-shadow: 0 4px 10px rgba(0,0,0,0.08);
    }
    
    .rating-stars {
      letter-spacing: 1px;
      font-size: 1.2rem;
      color: #ffc107;
    }
    
    @media (max-width: 992px) {
      .stats-card {
        padding: 15px;
      }
      .icon-circle {
        width: 45px;
        height: 45px;
        font-size: 1.2rem;
        margin-bottom: 8px;
      }
      .stats-card .metric-value {
        font-size: 2rem;
      }
      .stats-card p.text-muted {
        font-size: 0.75rem;
      }
      .metric-card {
        padding: 15px;
      }
      .metric-icon {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }
      .metric-value {
        font-size: 2.2rem;
      }
    }

    @media (max-width: 768px) {
      .stats-card {
        padding: 12px;
      }
      .icon-circle {
        width: 40px;
        height: 40px;
        font-size: 1.1rem;
        margin-bottom: 6px;
      }
      .stats-card .metric-value {
        font-size: 1.8rem;
      }
      .stats-card p.text-muted {
        font-size: 0.7rem;
      }
      .metric-value {
        font-size: 1.8rem;
      }
      .metric-icon {
        width: 30px;
        height: 30px;
        font-size: 0.9rem;
      }
    }

    @media (max-width: 576px) {
      .stats-card {
        padding: 10px;
      }
      .icon-circle {
        width: 35px;
        height: 35px;
        font-size: 1rem;
        margin-bottom: 4px;
      }
      .stats-card .metric-value {
        font-size: 1.4rem;
      }
      .stats-card p.text-muted {
        font-size: 0.65rem;
      }
      .metric-value {
        font-size: 1.5rem;
      }
    }
  `;
  
  document.head.appendChild(styleEl);
}

// Animate metric values with a counting effect
function animateMetricValues() {
  const metricValues = document.querySelectorAll('.metric-value');
  
  metricValues.forEach(element => {
    const finalValue = parseFloat(element.textContent);
    const suffix = element.textContent.replace(/[0-9.]/g, ''); // Get any suffix like '%'
    const decimal = element.textContent.includes('.') ? 1 : 0;
    const duration = 1500; // Animation duration in milliseconds
    const frameRate = 30; // Frames per second
    const totalFrames = duration / (1000 / frameRate);
    const increment = finalValue / totalFrames;
    
    let currentValue = 0;
    let frame = 0;
    
    // Clear any existing content
    element.textContent = '0' + suffix;
    
    // Start animation
    const animation = setInterval(() => {
      frame++;
      currentValue += increment;
      
      // Ensure we don't exceed the final value
      if (frame === totalFrames || currentValue >= finalValue) {
        clearInterval(animation);
        element.textContent = finalValue.toFixed(decimal) + suffix;
      } else {
        element.textContent = currentValue.toFixed(decimal) + suffix;
      }
    }, 1000 / frameRate);
  });
  
  // Animate rating stars
  const ratingStars = document.querySelector('.rating-stars');
  if (ratingStars) {
    ratingStars.style.opacity = '0';
    setTimeout(() => {
      ratingStars.style.transition = 'opacity 1s ease-in-out';
      ratingStars.style.opacity = '1';
    }, 500);
  }
}

// Show a toast message
function showToast(type, message) {
  // Create toast container if it doesn't exist
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'success'} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove toast after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

// View report details in modal
function viewReportDetails(reportId) {
  const report = sampleReports.find(r => r.id === reportId);
  if (!report) return;
  
  const modal = new bootstrap.Modal(document.getElementById('reportDetailsModal'));
  const modalContent = document.getElementById('reportDetailsContent');
  
  // Create modal content based on report data
  let content = `
    <div class="mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4>${report.title}</h4>
        <span class="badge ${report.status === 'resolved' ? 'bg-success' : 'bg-primary'}">
          ${report.status === 'resolved' ? 'Resolved' : 'In Progress'}
        </span>
      </div>
      
      <div class="row mb-4">
        <div class="col-md-6">
          <p class="mb-2"><strong>Report ID:</strong> ${report.id}</p>
          <p class="mb-2"><strong>Category:</strong> ${report.category}</p>
          <p class="mb-2"><strong>Location:</strong> ${report.location}</p>
        </div>
        <div class="col-md-6">
          <p class="mb-2"><strong>Reported On:</strong> ${formatDate(report.dateReported, true)}</p>
          <p class="mb-2"><strong>Last Updated:</strong> ${formatDate(report.dateUpdated, true)}</p>
          ${report.dateResolved ? `<p class="mb-2"><strong>Resolved On:</strong> ${formatDate(report.dateResolved, true)}</p>` : ''}
        </div>
      </div>
      
      <h5>Description</h5>
      <p class="mb-4">${report.description}</p>
      
      <h5>Status Updates</h5>
      <div class="timeline">
        ${report.stages.map(stage => `
          <div class="timeline-item ${stage.completed ? 'completed' : ''}">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <h6 class="mb-1">${stage.name}</h6>
              <p class="text-muted small mb-2">
                ${stage.date ? formatDate(stage.date, true) : 'Pending'}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${report.photos && report.photos.length > 0 ? `
        <h5 class="mt-4">Photos</h5>
        <div class="row g-2">
          ${report.photos.map(photo => `
            <div class="col-4 col-md-3">
              <img src="${photo}" class="img-thumbnail" style="height: 100px; width: 100%; object-fit: cover;">
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${report.status === 'resolved' ? `
        <div class="alert alert-success mt-4">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5><i class="fas fa-check-circle me-2"></i>Issue Resolved</h5>
              <p class="mb-0">${report.resolutionDetails || 'The issue has been successfully resolved.'}</p>
            </div>
            <div class="text-end">
              <div class="text-warning mb-1">
                ${Array(5).fill().map((_, i) => 
                  `<i class="fas fa-star${i < (report.rating || 5) ? '' : '-o'}"></i>`
                ).join('')}
              </div>
              <span class="badge bg-success">+${report.pointsEarned} Points Earned</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>`;
  
  modalContent.innerHTML = content;
  modal.show();
}

// Helper function to format dates
function formatDate(dateString, includeTime = false) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    ...(includeTime && { hour: '2-digit', minute: '2-digit' })
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

// Helper function to get category icon
function getCategoryIcon(category) {
  const icons = {
    'Roads': 'fas fa-road',
    'Water': 'fas fa-tint',
    'Electricity': 'fas fa-bolt',
    'Sanitation': 'fas fa-trash-alt',
    'Infrastructure': 'fas fa-hard-hat',
    'Others': 'fas fa-ellipsis-h'
  };
  return icons[category] || 'fas fa-question-circle';
}

// Export functions that need to be accessible from HTML
window.viewReportDetails = viewReportDetails;

// Function to handle rating a resolution
function handleRateResolution(reportId) {
  const report = sampleReports.find(r => r.id === reportId);
  if (!report) return;
  
  // In a real app, this would open a rating modal
  const rating = prompt(`Rate the resolution for ${report.title} (1-5):`, report.rating || '5');
  if (rating && rating >= 1 && rating <= 5) {
    report.rating = parseInt(rating);
    alert(`Thank you for rating this resolution ${rating} stars!`);
    // In a real app, you would save this to the server
    renderReports();
  }
}

// Function to export report data
function exportReportData(reportId) {
  const report = sampleReports.find(r => r.id === reportId);
  if (!report) return;
  
  // Create a printable version of the report
  const printWindow = window.open('', '_blank');
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Report: ${report.id}</title>
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
      <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
      <style>
        @media print {
          .no-print { display: none !important; }
          body { padding: 20px; font-size: 12px; }
          .card { border: 1px solid #ddd; }
        }
        .header { margin-bottom: 20px; }
        .logo { max-height: 50px; margin-right: 15px; }
        .print-title { font-size: 18px; font-weight: bold; }
        .print-date { font-size: 12px; color: #666; }
        .section-title { 
          font-size: 16px; 
          font-weight: bold; 
          border-bottom: 1px solid #eee; 
          padding-bottom: 5px; 
          margin-top: 15px; 
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header d-flex justify-content-between align-items-center mb-4">
          <div class="d-flex align-items-center">
            <img src="/img/logo.png" alt="Logo" class="logo">
            <div>
              <div class="print-title">CivicSense Report</div>
              <div class="print-date">Generated on ${new Date().toLocaleString()}</div>
            </div>
          </div>
          <div class="no-print">
            <button class="btn btn-primary btn-sm" onclick="window.print()">
              <i class="fas fa-print me-1"></i> Print
            </button>
          </div>
        </div>
        
        <div class="card mb-4">
          <div class="card-body">
            <div class="row mb-3">
              <div class="col-md-6">
                <h4>${report.title}</h4>
                <p class="text-muted">${report.id} • ${report.category}</p>
              </div>
              <div class="col-md-6 text-end">
                <span class="badge ${report.status === 'resolved' ? 'bg-success' : 'bg-primary'} p-2">
                  ${report.status === 'resolved' ? 'Resolved' : 'In Progress'}
                </span>
              </div>
            </div>
            
            <div class="section-title">Report Details</div>
            <div class="row mb-3">
              <div class="col-md-6">
                <p><strong>Location:</strong> ${report.location}</p>
                <p><strong>Reported On:</strong> ${formatDate(report.dateReported)}</p>
                ${report.dateResolved ? `<p><strong>Resolved On:</strong> ${formatDate(report.dateResolved)}</p>` : ''}
              </div>
              <div class="col-md-6">
                <p><strong>Status:</strong> ${report.currentStage}</p>
                <p><strong>Assigned To:</strong> ${report.assignedTo}</p>
                <p><strong>Progress:</strong> ${report.progress}%</p>
              </div>
            </div>
            
            <div class="section-title">Description</div>
            <p class="mb-4">${report.description}</p>
            
            ${report.resolutionDetails ? `
              <div class="section-title">Resolution Details</div>
              <p class="mb-4">${report.resolutionDetails}</p>
            ` : ''}
            
            <div class="section-title">Timeline</div>
            <div class="timeline">
              ${report.stages.map(stage => `
                <div class="timeline-item ${stage.completed ? 'completed' : ''}">
                  <div class="timeline-marker"></div>
                  <div class="timeline-content">
                    <h6 class="mb-1">${stage.name}</h6>
                    <p class="text-muted small mb-2">
                      ${stage.date ? formatDate(stage.date, true) : 'Pending'}
                    </p>
                  </div>
                </div>
              `).join('')}
            </div>
            
            ${report.rating ? `
                <div class="section-title">Your Rating</div>
                <div class="text-warning">
                  ${Array(5).fill().map((_, i) => 
                    `<i class="fas fa-star${i < report.rating ? '' : '-o'}"></i>`
                  ).join('')}
                  <span class="text-muted ms-2">${report.rating}.0/5.0</span>
              </div>
            ` : ''}
          </div>
        </div>
        
        <div class="text-center text-muted small no-print">
          This report was generated from CivicSense on ${new Date().toLocaleString()}
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Write the content to the new window
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Auto-print if needed
  // printWindow.print();
}

// Update pagination
function updatePagination() {
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  
  let paginationHTML = `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage - 1}" aria-label="Previous">
        <span aria-hidden="true">&laquo;</span>
      </a>
    </li>`;
  
  // Show first page, current page, and pages around current page
  const maxVisiblePages = 3;
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }
  
  if (startPage > 1) {
    paginationHTML += `
      <li class="page-item"><a class="page-link" href="#" data-page="1">1</a></li>
      ${startPage > 2 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <li class="page-item ${i === currentPage ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>`;
  }
  
  if (endPage < totalPages) {
    paginationHTML += `
      ${endPage < totalPages - 1 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
      <li class="page-item"><a class="page-link" href="#" data-page="${totalPages}">${totalPages}</a></li>`;
  }
  
  paginationHTML += `
    <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>`;
  
  pagination.innerHTML = paginationHTML;
  
  // Update showing text
  const start = filteredReports.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, filteredReports.length);
  
  if (showingFrom) showingFrom.textContent = start;
  if (showingTo) showingTo.textContent = end;
  if (totalItems) totalItems.textContent = filteredReports.length;
  
  // Add event listeners to pagination links
  document.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      if (link.parentElement.classList.contains('disabled')) return;
      
      const page = parseInt(link.dataset.page);
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        currentPage = page;
        renderReports();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}