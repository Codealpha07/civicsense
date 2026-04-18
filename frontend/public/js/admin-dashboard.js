// Ultra-Elegant CivicVerse Dashboard JavaScript
// Next-generation civic engagement platform

class CivicDashboard {
  constructor() {
    this.userData = null;
    this.reports = [];
    this.achievements = [];
    this.isLoading = true;
    this.particles = [];
    this.mousePosition = { x: 0, y: 0 };
    
    this.init();
  }

  async init() {
    try {
      // Show loading screen with elegant animation
      this.showLoadingScreen();
      
      // Initialize particles system
      this.initParticles();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Check authentication
      await this.checkAuthentication();
      
      // Load user data
      await this.loadUserData();
      
      // Load dashboard data
      await this.loadDashboardData();
      
      // Initialize UI components
      this.initializeUI();
      
      // Hide loading screen
      setTimeout(() => {
        this.hideLoadingScreen();
      }, 2000);
      
    } catch (error) {
      console.error('Dashboard initialization error:', error);
      this.handleError('Failed to initialize dashboard');
    }
  }

  showLoadingScreen() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.opacity = '1';
      loadingContainer.style.visibility = 'visible';
    }
  }

  hideLoadingScreen() {
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.classList.add('hidden');
      
      // Trigger entrance animations
      setTimeout(() => {
        this.triggerEntranceAnimations();
      }, 300);
    }
  }

  triggerEntranceAnimations() {
    // Animate elements with staggered timing
    const animatedElements = document.querySelectorAll('.fade-in-up');
    animatedElements.forEach((element, index) => {
      setTimeout(() => {
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  initParticles() {
    const particlesContainer = document.getElementById('particlesContainer');
    if (!particlesContainer) return;

    // Create floating particles
    for (let i = 0; i < 50; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.animationDelay = Math.random() * 8 + 's';
      particle.style.animationDuration = (8 + Math.random() * 4) + 's';
      particlesContainer.appendChild(particle);
    }

    // Mouse tracking for interactive effects
    document.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
      this.updateParticleInteraction();
    });
  }

  updateParticleInteraction() {
    // Add subtle particle interaction with mouse movement
    const particles = document.querySelectorAll('.particle');
    particles.forEach((particle, index) => {
      if (index % 5 === 0) { // Only affect every 5th particle for performance
        const rect = particle.getBoundingClientRect();
        const distance = Math.sqrt(
          Math.pow(this.mousePosition.x - rect.left, 2) + 
          Math.pow(this.mousePosition.y - rect.top, 2)
        );
        
        if (distance < 100) {
          particle.style.transform = `scale(${1 + (100 - distance) / 200})`;
          particle.style.opacity = Math.min(1, (100 - distance) / 50);
        } else {
          particle.style.transform = 'scale(1)';
          particle.style.opacity = '0.6';
        }
      }
    });
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        this.toggleTheme();
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Notification button
    const notificationBtn = document.getElementById('notificationBtn');
    if (notificationBtn) {
      notificationBtn.addEventListener('click', () => {
        this.showNotifications();
      });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Add scroll-triggered animations
    this.setupScrollAnimations();
  }

  setupScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }
      });
    }, observerOptions);

    // Observe elements for scroll animations
    document.querySelectorAll('.fade-in-up').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(30px)';
      el.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
      observer.observe(el);
    });
  }

  async checkAuthentication() {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      throw new Error('No authentication token');
    }
  }

  async loadUserData() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { data } = await response.json();
      this.userData = data;
      
      // Update UI with user data
      this.updateUserInterface();
      
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  }

  async loadDashboardData() {
    try {
      // Load reports and achievements in parallel
      const [reportsData, achievementsData] = await Promise.all([
        this.fetchReports(),
        this.fetchAchievements()
      ]);

      this.reports = reportsData;
      this.achievements = achievementsData;

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      throw error;
    }
  }

  async fetchReports() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const result = await response.json();
      return result.success ? (result.data || []) : [];

    } catch (error) {
      console.error('Error fetching reports:', error);
      return [];
    }
  }

  async fetchAchievements() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/v1/achievements', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch achievements');
      }

      const result = await response.json();
      return result.success ? (result.data || {}) : {};

    } catch (error) {
      console.error('Error fetching achievements:', error);
      return {};
    }
  }

  updateUserInterface() {
    if (!this.userData) return;

    // Update user name and greeting
    this.updateGreeting();
    
    // Update user avatar/initials
    this.updateUserAvatar();
    
    // Update user info in dropdown
    this.updateUserDropdown();
  }

  updateGreeting() {
    const userName = document.getElementById('userName');
    const timeOfDay = document.getElementById('timeOfDay');
    
    if (userName && this.userData.firstName) {
      userName.textContent = this.userData.firstName;
    }

    if (timeOfDay) {
      const hour = new Date().getHours();
      let greeting = 'day';
      if (hour < 12) greeting = 'morning';
      else if (hour < 18) greeting = 'afternoon';
      else greeting = 'evening';
      
      timeOfDay.textContent = greeting;
    }
  }

  updateUserAvatar() {
    const userInitials = document.getElementById('userInitials');
    if (userInitials && this.userData.firstName && this.userData.lastName) {
      userInitials.textContent = 
        this.userData.firstName.charAt(0) + this.userData.lastName.charAt(0);
    }
  }

  updateUserDropdown() {
    const ddUserName = document.getElementById('ddUserName');
    const ddUserEmail = document.getElementById('ddUserEmail');
    
    if (ddUserName && this.userData.firstName && this.userData.lastName) {
      ddUserName.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
    }
    
    if (ddUserEmail && this.userData.email) {
      ddUserEmail.textContent = this.userData.email;
    }
  }

  initializeUI() {
    // Update statistics with animation
    this.updateStatistics();
    
    // Update recent activity
    this.updateRecentActivity();
    
    // Update impact level
    this.updateImpactLevel();
  }

  updateStatistics() {
    const stats = this.calculateStatistics();
    
    // Animate statistics with elegant counting effect
    this.animateCounter('totalReports', stats.totalReports);
    this.animateCounter('resolvedReports', stats.resolvedReports);
    this.animateCounter('resolutionRate', stats.resolutionRate, '%');
    this.animateCounter('impactPoints', stats.impactPoints);
  }

  calculateStatistics() {
    const totalReports = this.reports.length;
    const resolvedReports = this.reports.filter(r => r.status === 'resolved').length;
    const resolutionRate = totalReports > 0 ? Math.round((resolvedReports / totalReports) * 100) : 0;
    const impactPoints = this.calculateImpactPoints();

    return {
      totalReports,
      resolvedReports,
      resolutionRate,
      impactPoints
    };
  }

  calculateImpactPoints() {
    // Sophisticated point calculation based on report status and engagement
    const pointValues = {
      'reported': 5,
      'in-progress': 10,
      'verified': 15,
      'resolved': 25
    };

    return this.reports.reduce((total, report) => {
      return total + (pointValues[report.status] || 0);
    }, 0);
  }

  animateCounter(elementId, targetValue, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;

    let currentValue = 0;
    const increment = Math.max(1, Math.ceil(targetValue / 50));
    const duration = 2000; // 2 seconds
    const stepTime = duration / (targetValue / increment);

    const timer = setInterval(() => {
      currentValue += increment;
      if (currentValue >= targetValue) {
        currentValue = targetValue;
        clearInterval(timer);
      }
      element.textContent = currentValue + suffix;
    }, stepTime);
  }

  updateRecentActivity() {
    const container = document.getElementById('recentActivityContainer');
    if (!container) return;

    if (this.reports.length === 0) {
      container.innerHTML = this.getEmptyStateHTML();
      return;
    }

    // Sort reports by date and take the 5 most recent
    const recentReports = this.reports
      .sort((a, b) => new Date(b.createdAt || b.dateReported) - new Date(a.createdAt || a.dateReported))
      .slice(0, 5);

    container.innerHTML = recentReports
      .map((report, index) => this.createActivityItemHTML(report, index))
      .join('');

    // Add click handlers for activity items
    this.setupActivityItemHandlers();
  }

  createActivityItemHTML(report, index) {
    const date = new Date(report.createdAt || report.dateReported);
    const timeAgo = this.getTimeAgo(date);
    const statusClass = this.getStatusClass(report.status);
    
    return `
      <div class="activity-item fade-in-up stagger-${index + 1}" data-report-id="${report.id || report._id}">
        <div class="d-flex justify-content-between align-items-start">
          <div class="flex-grow-1">
            <h4 class="activity-title">${report.title || 'Civic Issue Report'}</h4>
            <div class="activity-meta">
              <span class="status-badge status-${statusClass}">${this.formatStatus(report.status)}</span>
              <span><i class="fas fa-clock me-1"></i>${timeAgo}</span>
              <span><i class="fas fa-map-marker-alt me-1"></i>${this.formatLocation(report.location)}</span>
            </div>
          </div>
          <button class="btn btn-sm" style="background: var(--glass-bg); border: 1px solid var(--glass-border); color: white; border-radius: 12px;">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    `;
  }

  setupActivityItemHandlers() {
    document.querySelectorAll('.activity-item').forEach(item => {
      item.addEventListener('click', () => {
        const reportId = item.dataset.reportId;
        this.showReportDetails(reportId);
      });
    });
  }

  getEmptyStateHTML() {
    return `
      <div class="text-center py-5">
        <div style="font-size: 4rem; margin-bottom: 20px; opacity: 0.5;">📋</div>
        <h3 style="color: white; margin-bottom: 15px;">No Recent Activity</h3>
        <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 30px;">
          Start reporting civic issues to see your impact and track your progress!
        </p>
        <a href="/report.html" class="btn" style="background: var(--primary-gradient); color: white; border: none; padding: 12px 30px; border-radius: 20px; font-weight: 600;">
          <i class="fas fa-plus me-2"></i>Create First Report
        </a>
      </div>
    `;
  }

  updateImpactLevel() {
    const impactPoints = this.calculateImpactPoints();
    const level = this.getImpactLevel(impactPoints);
    
    const impactLevelElement = document.getElementById('impactLevel');
    const impactDescriptionElement = document.getElementById('impactDescription');
    
    if (impactLevelElement) {
      impactLevelElement.textContent = level.name;
    }
    
    if (impactDescriptionElement) {
      impactDescriptionElement.textContent = level.description;
    }
  }

  getImpactLevel(points) {
    if (points >= 500) {
      return {
        name: 'Community Hero',
        description: 'Your exceptional dedication is transforming the community!'
      };
    } else if (points >= 200) {
      return {
        name: 'Civic Champion',
        description: 'Your commitment is making a real difference!'
      };
    } else if (points >= 100) {
      return {
        name: 'Active Contributor',
        description: 'You\'re actively improving your community!'
      };
    } else if (points >= 50) {
      return {
        name: 'Rising Citizen',
        description: 'Great start! Keep up the civic engagement!'
      };
    } else {
      return {
        name: 'New Citizen',
        description: 'Welcome to your civic journey!'
      };
    }
  }

  getStatusClass(status) {
    const statusMap = {
      'pending': 'reported',
      'active': 'in-progress',
      'verified': 'verified',
      'assigned': 'in-progress',
      'in-progress': 'in-progress',
      'resolved': 'resolved'
    };
    return statusMap[status] || 'reported';
  }

  formatStatus(status) {
    return status ? status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') : 'Reported';
  }

  formatLocation(location) {
    if (!location) return 'Location not available';
    
    if (typeof location === 'string') {
      return location.replace(/^Point,?\s*/i, '').trim();
    }
    
    if (typeof location === 'object') {
      if (location.latitude && location.longitude) {
        return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      }
      return Object.values(location).filter(val => val).join(', ');
    }
    
    return String(location);
  }

  getTimeAgo(date) {
    const now = new Date();
    const secondsPast = (now.getTime() - date.getTime()) / 1000;

    if (secondsPast < 60) return 'Just now';
    if (secondsPast < 3600) return `${Math.floor(secondsPast / 60)}m ago`;
    if (secondsPast < 86400) return `${Math.floor(secondsPast / 3600)}h ago`;
    if (secondsPast < 2592000) return `${Math.floor(secondsPast / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = document.documentElement.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (themeToggle) {
      themeToggle.classList.toggle('dark', newTheme === 'dark');
    }
  }

  showNotifications() {
    // Create elegant notification modal
    const modalHTML = `
      <div class="modal fade" id="notificationModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content" style="background: var(--glass-bg); backdrop-filter: blur(40px); border: 1px solid var(--glass-border); border-radius: 24px;">
            <div class="modal-header" style="border-bottom: 1px solid var(--glass-border);">
              <h5 class="modal-title text-white">
                <i class="fas fa-bell me-2"></i>Notifications
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="notification-item" style="padding: 15px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); margin-bottom: 15px;">
                <div class="d-flex align-items-center">
                  <div style="width: 40px; height: 40px; background: var(--success-gradient); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <i class="fas fa-check text-white"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="text-white mb-1">Report Resolved</h6>
                    <p class="text-white-50 mb-0 small">Your street light report has been resolved</p>
                  </div>
                  <small class="text-white-50">2h ago</small>
                </div>
              </div>
              
              <div class="notification-item" style="padding: 15px; border-radius: 16px; background: rgba(255, 255, 255, 0.05); margin-bottom: 15px;">
                <div class="d-flex align-items-center">
                  <div style="width: 40px; height: 40px; background: var(--secondary-gradient); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <i class="fas fa-sync text-white"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="text-white mb-1">Report In Progress</h6>
                    <p class="text-white-50 mb-0 small">Your pothole report is being addressed</p>
                  </div>
                  <small class="text-white-50">1d ago</small>
                </div>
              </div>
              
              <div class="notification-item" style="padding: 15px; border-radius: 16px; background: rgba(255, 255, 255, 0.05);">
                <div class="d-flex align-items-center">
                  <div style="width: 40px; height: 40px; background: var(--warning-gradient); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                    <i class="fas fa-trophy text-white"></i>
                  </div>
                  <div class="flex-grow-1">
                    <h6 class="text-white mb-1">Achievement Unlocked</h6>
                    <p class="text-white-50 mb-0 small">You've earned the "Active Reporter" badge</p>
                  </div>
                  <small class="text-white-50">3d ago</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('notificationModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
    modal.show();
  }

  showReportDetails(reportId) {
    const report = this.reports.find(r => (r.id || r._id) === reportId);
    if (!report) return;

    const modalHTML = `
      <div class="modal fade" id="reportModal" tabindex="-1">
        <div class="modal-dialog modal-lg modal-dialog-centered">
          <div class="modal-content" style="background: var(--glass-bg); backdrop-filter: blur(40px); border: 1px solid var(--glass-border); border-radius: 24px;">
            <div class="modal-header" style="border-bottom: 1px solid var(--glass-border);">
              <h5 class="modal-title text-white">
                <i class="fas fa-file-alt me-2"></i>Report Details
              </h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row">
                <div class="col-md-8">
                  <h4 class="text-white mb-3">${report.title || 'Civic Issue Report'}</h4>
                  <div class="mb-3">
                    <span class="status-badge status-${this.getStatusClass(report.status)}">
                      ${this.formatStatus(report.status)}
                    </span>
                  </div>
                  <div class="mb-4">
                    <h6 class="text-white">Description</h6>
                    <p class="text-white-50">${report.description || 'No description provided'}</p>
                  </div>
                  <div class="row">
                    <div class="col-6">
                      <h6 class="text-white">Reported On</h6>
                      <p class="text-white-50">${new Date(report.createdAt || report.dateReported).toLocaleDateString()}</p>
                    </div>
                    <div class="col-6">
                      <h6 class="text-white">Category</h6>
                      <p class="text-white-50">${report.category || 'General'}</p>
                    </div>
                  </div>
                </div>
                <div class="col-md-4">
                  <div style="background: rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px;">
                    <h6 class="text-white mb-3">Location</h6>
                    <p class="text-white-50 mb-0">
                      <i class="fas fa-map-marker-alt me-2"></i>
                      ${this.formatLocation(report.location)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer" style="border-top: 1px solid var(--glass-border);">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
              <a href="/my-reports.html" class="btn" style="background: var(--primary-gradient); color: white; border: none;">
                View All Reports
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Remove existing modal
    const existingModal = document.getElementById('reportModal');
    if (existingModal) existingModal.remove();

    // Add modal to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('reportModal'));
    modal.show();
  }

  handleSearch(query) {
    // Implement search functionality
    console.log('Searching for:', query);
    // This would typically filter reports or navigate to search results
  }

  logout() {
    // Clear all stored data
    localStorage.clear();
    sessionStorage.clear();
    
    // Redirect to login page
    window.location.href = '/login';
  }

  handleError(message) {
    // Show elegant error notification
    this.showToast('error', message);
  }

  showToast(type, message) {
    const toastHTML = `
      <div class="toast align-items-center text-white bg-${type} border-0" role="alert" style="position: fixed; top: 20px; right: 20px; z-index: 9999; border-radius: 16px; backdrop-filter: blur(20px);">
        <div class="d-flex">
          <div class="toast-body">
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', toastHTML);
    const toastElement = document.querySelector('.toast:last-child');
    const toast = new bootstrap.Toast(toastElement);
    toast.show();

    // Remove toast after it's hidden
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-bs-theme', savedTheme);
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.classList.toggle('dark', savedTheme === 'dark');
  }

  // Initialize dashboard
  new CivicDashboard();
});

// Add smooth scrolling and performance optimizations
window.addEventListener('scroll', () => {
  // Throttle scroll events for better performance
  requestAnimationFrame(() => {
    // Add any scroll-based animations here
  });
});

// Handle window resize for responsive adjustments
window.addEventListener('resize', () => {
  // Handle responsive adjustments
  const particles = document.querySelectorAll('.particle');
  particles.forEach(particle => {
    particle.style.left = Math.random() * 100 + '%';
  });
});