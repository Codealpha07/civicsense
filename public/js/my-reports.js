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
  },
  {
    id: 'RPT-2023-002',
    title: 'Street Light Out',
    description: 'Street light not working on the corner of Maple and Elm streets. Creates a safety hazard at night.',
    category: 'Electricity',
    status: 'in-progress',
    priority: 'medium',
    location: 'Corner of Maple & Elm St',
    coordinates: { lat: 40.7129, lng: -74.0061 },
    dateReported: '2023-05-18T18:45:00',
    dateUpdated: '2023-05-22T10:30:00',
    progress: 40,
    currentStage: 'Assigned',
    stages: [
      { name: 'Reported', completed: true, date: '2023-05-18T18:45:00' },
      { name: 'Verified', completed: true, date: '2023-05-19T10:20:00' },
      { name: 'Assigned', completed: true, date: '2023-05-22T10:30:00' },
      { name: 'In Progress', completed: false, date: null },
      { name: 'Resolved', completed: false, date: null }
    ],
    assignedTo: 'Utilities Department',
    lastUpdate: 'Issue verified and assigned to maintenance team',
    photos: ['/img/sample-streetlight.jpg'],
    pointsEarned: 0
  },
  {
    id: 'RPT-2023-003',
    title: 'Water Leak in Park',
    description: 'Water pipe leaking in Central Park near the playground. Water is being wasted and creating a muddy area.',
    category: 'Water',
    status: 'resolved',
    priority: 'high',
    location: 'Central Park, near playground',
    coordinates: { lat: 40.7130, lng: -74.0062 },
    dateReported: '2023-05-10T08:15:00',
    dateResolved: '2023-05-12T16:45:00',
    dateUpdated: '2023-05-12T16:45:00',
    progress: 100,
    currentStage: 'Resolved',
    stages: [
      { name: 'Reported', completed: true, date: '2023-05-10T08:15:00' },
      { name: 'Verified', completed: true, date: '2023-05-10T10:30:00' },
      { name: 'Assigned', completed: true, date: '2023-05-11T09:15:00' },
      { name: 'In Progress', completed: true, date: '2023-05-12T14:00:00' },
      { name: 'Resolved', completed: true, date: '2023-05-12T16:45:00' }
    ],
    assignedTo: 'Water Department',
    lastUpdate: 'Leak has been fixed and area cleaned up',
    resolutionDetails: 'Pipe section was replaced and area was restored.',
    rating: 5,
    usersHelped: 150,
    achievements: ['Eco Hero', 'Quick Fixer'],
    photos: ['/img/sample-leak-before.jpg', '/img/sample-leak-after.jpg'],
    pointsEarned: 50
  },
  {
    id: 'RPT-2023-004',
    title: 'Garbage Not Collected',
    description: 'Garbage was not collected on our street this week. Bins are overflowing.',
    category: 'Sanitation',
    status: 'overdue',
    priority: 'medium',
    location: '456 Oak Avenue',
    coordinates: { lat: 40.7131, lng: -74.0063 },
    dateReported: '2023-05-20T09:00:00',
    dateUpdated: '2023-05-22T11:20:00',
    progress: 20,
    currentStage: 'Verified',
    stages: [
      { name: 'Reported', completed: true, date: '2023-05-20T09:00:00' },
      { name: 'Verified', completed: true, date: '2023-05-22T11:20:00' },
      { name: 'Assigned', completed: false, date: null },
      { name: 'In Progress', completed: false, date: null },
      { name: 'Resolved', completed: false, date: null }
    ],
    assignedTo: 'Sanitation Department',
    lastUpdate: 'Issue verified, waiting for assignment',
    overdueBy: '2 days',
    photos: ['/img/sample-garbage.jpg'],
    pointsEarned: 0
  },
  {
    id: 'RPT-2023-005',
    title: 'Broken Sidewalk',
    description: 'Uneven and broken sidewalk creating accessibility issues for wheelchair users and pedestrians.',
    category: 'Infrastructure',
    status: 'in-progress',
    priority: 'medium',
    location: '300 Pine Road',
    coordinates: { lat: 40.7132, lng: -74.0064 },
    dateReported: '2023-05-05T14:20:00',
    dateUpdated: '2023-05-23T16:10:00',
    progress: 80,
    currentStage: 'In Progress',
    stages: [
      { name: 'Reported', completed: true, date: '2023-05-05T14:20:00' },
      { name: 'Verified', completed: true, date: '2023-05-08T10:15:00' },
      { name: 'Assigned', completed: true, date: '2023-05-10T11:30:00' },
      { name: 'In Progress', completed: true, date: '2023-05-22T09:00:00' },
      { name: 'Resolved', completed: false, date: null }
    ],
    assignedTo: 'Public Works Dept',
    lastUpdate: 'Repair work has begun, estimated completion in 2 days',
    photos: ['/img/sample-sidewalk.jpg'],
    pointsEarned: 0
  }
];

// DOM Elements
const reportsList = document.getElementById('reportsList');
const statsCards = document.getElementById('statsCards');
const performanceMetrics = document.getElementById('performanceMetrics');
const searchInput = document.getElementById('searchReports');
const dateRangeFilter = document.getElementById('dateRangeFilter');
const categoryFilter = document.getElementById('categoryFilter');
const statusFilter = document.getElementById('statusFilter');
const itemsPerPageSelect = document.getElementById('itemsPerPage');
const pagination = document.getElementById('pagination');
const showingFrom = document.getElementById('showingFrom');
const showingTo = document.getElementById('showingTo');
const totalItems = document.getElementById('totalItems');

// State
let currentPage = 1;
let itemsPerPage = 10;
let filteredReports = [];

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
  loadReports();
  setupEventListeners();
  updateStatsCards();
  updatePerformanceMetrics();
  renderReports();
  updatePagination();
});

// Load reports (in a real app, this would be an API call)
function loadReports() {
  // For now, just use the sample data
  filteredReports = [...sampleReports];
  totalItems.textContent = filteredReports.length;
}

// Set up event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', () => {
    currentPage = 1;
    filterReports();
  });

  // Filter dropdowns
  dateRangeFilter.addEventListener('change', () => {
    currentPage = 1;
    filterReports();
  });

  categoryFilter.addEventListener('change', () => {
    currentPage = 1;
    filterReports();
  });

  // Status filter dropdown
  statusFilter.addEventListener('change', () => {
    currentPage = 1;
    filterReports();
  });

  // Items per page
  itemsPerPageSelect.addEventListener('change', (e) => {
    itemsPerPage = parseInt(e.target.value);
    currentPage = 1;
    updatePagination();
    renderReports();
  });
}

// Filter reports based on search and filters
function filterReports() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const selectedStatus = statusFilter.value; // Get the selected status from dropdown
  
  filteredReports = sampleReports.filter(report => {
    // Search term filter
    const matchesSearch = 
      report.title.toLowerCase().includes(searchTerm) ||
      report.description.toLowerCase().includes(searchTerm) ||
      report.id.toLowerCase().includes(searchTerm);
    
    // Category filter
    const matchesCategory = category === 'All Categories' || report.category === category;
    
    // Status filter - now using dropdown value directly
    const matchesStatus = selectedStatus === 'all' || report.status === selectedStatus;
    
    // Date range filter (simplified for this example)
    const matchesDateRange = true; // In a real app, implement date filtering
    
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
          <button class="btn btn-primary mt-2" onclick="window.location.href='/report.html'">
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
  
  return `
    <div class="card mb-3 report-card">
      <div class="card-body">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="status-badge ${statusClass}">${statusText}</span>
            <div class="category-icon">
              <i class="${categoryIcon}"></i>
            </div>
            <div>
              <h6 class="mb-0">${report.category}</h6>
              <small class="text-muted">${report.id}</small>
            </div>
          </div>
          <div class="text-end">
            <div class="text-muted small">${formatDate(report.dateReported)}</div>
            <div class="small">
              <i class="fas fa-map-marker-alt text-danger me-1"></i>
              <span class="text-muted">${report.location}</span>
            </div>
          </div>
        </div>
        
        <h5 class="card-title">${report.title}</h5>
        <p class="card-text text-muted">"${report.description}"</p>
        
        <!-- Progress Tracker -->
        <div class="mb-3">
          <div class="d-flex justify-content-between mb-1">
            ${report.stages.map((stage, index) => `
              <div class="progress-step ${stage.completed ? 'completed' : ''} ${stage.name === report.currentStage ? 'active' : ''}">
                <div class="step-dot"></div>
                <div class="d-none d-sm-block">${stage.name}</div>
              </div>
            `).join('')}
          </div>
          <div class="progress">
            <div class="progress-bar" role="progressbar" style="width: ${report.progress}%" 
                 aria-valuenow="${report.progress}" aria-valuemin="0" aria-valuemax="100"></div>
          </div>
        </div>
        
        <!-- Latest Update -->
        <div class="alert alert-light mb-3 py-2 small">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <strong>Latest Update:</strong> ${report.lastUpdate}
              ${report.overdueBy ? `<span class="badge bg-warning text-dark ms-2">Overdue by ${report.overdueBy}</span>` : ''}
            </div>
            <div class="text-muted">${daysAgo} ${daysAgo === 1 ? 'day' : 'days'} ago</div>
          </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-sm btn-outline-primary view-report-btn" data-id="${report.id}">
            <i class="fas fa-eye me-1"></i> View Details
          </button>
          <button class="btn btn-sm btn-outline-secondary">
            <i class="fas fa-map-marked-alt me-1"></i> Track on Map
          </button>
          ${report.status === 'resolved' ? `
            <button class="btn btn-sm btn-outline-warning rate-resolution-btn" data-id="${report.id}">
              <i class="fas fa-star me-1"></i> Rate Resolution
            </button>
          ` : ''}
          <div class="dropdown ms-auto">
            <button class="btn btn-sm btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
              <i class="fas fa-ellipsis-v"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
              <li><a class="dropdown-item" href="#" onclick="window.print()"><i class="fas fa-print me-2"></i>Print Report</a></li>
              <li><a class="dropdown-item" href="#" onclick="exportReportData('${report.id}')"><i class="fas fa-file-export me-2"></i>Export</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>`;
}

// Update stats cards
function updateStatsCards() {
  const totalReports = sampleReports.length;
  const resolvedCount = sampleReports.filter(r => r.status === 'resolved').length;
  const activeCount = sampleReports.filter(r => r.status === 'active' || r.status === 'in-progress').length;
  const overdueCount = sampleReports.filter(r => r.status === 'overdue').length;
  const resolutionRate = Math.round((resolvedCount / totalReports) * 100) || 0;
  
  statsCards.innerHTML = `
    <div class="col-md-3">
      <div class="card bg-primary bg-opacity-10 border-0 h-100 stats-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Total Reports</h6>
              <h3 class="mb-0">${totalReports}</h3>
            </div>
            <div class="bg-primary bg-opacity-25 p-3 rounded-circle">
              <i class="fas fa-clipboard-list text-primary"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-success bg-opacity-10 border-0 h-100 stats-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Resolution Rate</h6>
              <h3 class="mb-0">${resolutionRate}%</h3>
            </div>
            <div class="bg-success bg-opacity-25 p-3 rounded-circle">
              <i class="fas fa-check-circle text-success"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-warning bg-opacity-10 border-0 h-100 stats-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Active Reports</h6>
              <h3 class="mb-0">${activeCount}</h3>
            </div>
            <div class="bg-warning bg-opacity-25 p-3 rounded-circle">
              <i class="fas fa-tasks text-warning"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="col-md-3">
      <div class="card bg-danger bg-opacity-10 border-0 h-100 stats-card">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h6 class="text-muted mb-1">Overdue</h6>
              <h3 class="mb-0">${overdueCount}</h3>
            </div>
            <div class="bg-danger bg-opacity-25 p-3 rounded-circle">
              <i class="fas fa-exclamation-triangle text-danger"></i>
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

// Update performance metrics
function updatePerformanceMetrics() {
  performanceMetrics.innerHTML = `
    <div class="card-header bg-white">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Performance Metrics</h5>
        <div class="dropdown">
          <button class="btn btn-link text-muted p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="fas fa-ellipsis-v"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="#">View All Reports</a></li>
            <li><a class="dropdown-item" href="#">Export Data</a></li>
          </ul>
        </div>
      </div>
    </div>
    <div class="card-body">
      <div class="row">
        <div class="col-md-4">
          <div class="d-flex align-items-center mb-3">
            <div class="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
              <i class="fas fa-clock text-primary"></i>
            </div>
            <div>
              <h6 class="mb-0">Average Resolution Time</h6>
              <p class="text-muted mb-0">3.5 days</p>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="d-flex align-items-center mb-3">
            <div class="bg-warning bg-opacity-10 p-3 rounded-circle me-3">
              <i class="fas fa-star text-warning"></i>
            </div>
            <div>
              <h6 class="mb-0">Average Rating</h6>
              <div class="text-warning">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="far fa-star"></i>
                <span class="text-muted ms-1">(4.2/5)</span>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="d-flex align-items-center">
            <div class="bg-success bg-opacity-10 p-3 rounded-circle me-3">
              <i class="fas fa-trophy text-success"></i>
            </div>
            <div>
              <h6 class="mb-0">Points Earned</h6>
              <p class="text-muted mb-0">1,250 points</p>
            </div>
          </div>
        </div>
      </div>
    </div>`;
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
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" data-page="${currentPage + 1}" aria-label="Next">
        <span aria-hidden="true">&raquo;</span>
      </a>
    </li>`;
  
  pagination.innerHTML = paginationHTML;
  
  // Add event listeners to pagination links
  document.querySelectorAll('.page-link').forEach(link => {
    if (!link.getAttribute('aria-label')) { // Not previous/next buttons
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = parseInt(e.currentTarget.dataset.page);
        if (page >= 1 && page <= totalPages && page !== currentPage) {
          currentPage = page;
          updatePagination();
          renderReports();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
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
                <p><strong>Reported On:</strong> ${formatDate(report.dateReported, true)}</p>
                ${report.dateResolved ? `<p><strong>Resolved On:</strong> ${formatDate(report.dateResolved, true)}</p>` : ''}
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
              <div class="mt-4">
                <div class="section-title">Your Rating</div>
                <div class="text-warning">
                  ${Array(5).fill().map((_, i) => 
                    `<i class="fas fa-star${i < report.rating ? '' : '-o'}"></i>`
                  ).join('')}
                  <span class="text-muted ms-2">${report.rating}.0/5.0</span>
                </div>
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