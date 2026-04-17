// Profile Stats & Specialization Logic for Profile Page
// This file is intentionally isolated from profile.js to keep responsibilities clear.
// It fetches user's reports once the page loads and updates the "Civic Stats" and
// "Specialization Areas" sections with live data.

(function () {
  // --- Utility Functions --------------------------------------------------

  // Map backend status to a simpler UI status
  const STATUS_MAP = {
    pending: 'reported',
    rejected: 'reported',
    active: 'in-progress',
    'in-progress': 'in-progress',
    verified: 'verified',
    assigned: 'assigned',
    resolved: 'resolved'
  };

  /**
   * Normalises a raw backend report into a predictable structure used by the UI
   * @param {Object} r Raw report from backend API
   * @returns {Object}
   */
  function adaptReportForUI(r = {}) {
    if (!r || !r._id) return null;

    const uiStatus = STATUS_MAP[r.status] || 'reported';

    const reportedDate = r.createdAt ? new Date(r.createdAt) : new Date();
    const updatedDate = r.updatedAt ? new Date(r.updatedAt) : reportedDate;
    const resolvedDate = r.resolvedAt
      ? new Date(r.resolvedAt)
      : uiStatus === 'resolved'
      ? updatedDate
      : null;

    return {
      id: r._id,
      title: r.title || 'Untitled',
      description: r.description || '',
      category: r.category || 'Others',
      location: r.location || null,
      status: uiStatus,
      dateReported: reportedDate.toISOString(),
      dateUpdated: updatedDate.toISOString(),
      dateResolved: resolvedDate ? resolvedDate.toISOString() : null,
      assignedTo: r.assignedTo || '',
      lastUpdate: r.lastUpdate || '',
      photos: r.images || [],
      userMobile: r.userMobile || ''
    };
  }

  /**
   * Calculates total impact points for a collection of reports
   * @param {Array} reports
   */
  function calculateImpactPoints(reports) {
    const IMPACT_WEIGHTS = {
      resolved: 20,
      'in-progress': 10,
      verified: 5,
      reported: 1
    };

    const CATEGORY_MULTIPLIER = {
      infrastructure: 1.5,
      environment: 1.3,
      'public-safety': 1.4,
      health: 1.6,
      transportation: 1.2,
      waste: 1.2,
      road: 1.1,
      lighting: 1.1,
      others: 1
    };

    return Math.round(
      reports.reduce((total, report) => {
        const base = IMPACT_WEIGHTS[report.status] ?? 1;
        const multiplier = CATEGORY_MULTIPLIER[(report.category || '').toLowerCase()] ?? 1;
        return total + base * multiplier;
      }, 0)
    );
  }

  // --- DOM Update Helpers --------------------------------------------------
  function updateCivicStats(reports = []) {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'resolved').length;
    const resolvedPct = total ? Math.round((resolved / total) * 100) : 0;
    const points = calculateImpactPoints(reports);
  

    const elTotal = document.getElementById('totalReportsCount');
    if (elTotal) elTotal.textContent = total;

    const elPctText = document.getElementById('resolvedPercentageText');
    if (elPctText) elPctText.textContent = `${resolvedPct}%`;

    const elPctBar = document.getElementById('resolvedProgressBar');
    if (elPctBar) {
      elPctBar.style.width = `${resolvedPct}%`;
      elPctBar.setAttribute('aria-valuenow', resolvedPct);
    }

    const elPoints = document.getElementById('pointsValue');
    if (elPoints) elPoints.textContent = points.toLocaleString();
  }

  function updateSpecializationAreas(reports = []) {
    const ALLOWED = ['roads', 'water', 'electricity', 'sanitation', 'infrastructure', 'environment'];

  // Build counts map
  const counts = ALLOWED.reduce((obj, key) => {
    obj[key] = 0;
    return obj;
  }, {});

  reports.forEach(r => {
    const cat = (r.category || '').toLowerCase();

    if (cat.includes('road')) counts.roads++;
    else if (cat.includes('water')) counts.water++;
    else if (cat.includes('electric')) counts.electricity++;
    else if (cat.includes('sanit') || cat.includes('waste') || cat.includes('trash') || cat.includes('garbage')) counts.sanitation++;
    else if (cat.includes('infrastructure') || cat.includes('building') || cat.includes('bridge')) counts.infrastructure++;
    else if (cat.includes('env') || cat.includes('green')) counts.environment++;
  });

  const total = reports.length || 1; // avoid divide by zero

  // Get top 3 categories
  const top = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  let container = document.getElementById('specializationContainer');
  if (!container) {
    // Attempt to locate the specialization card by its heading icon
    const specCardBody = document
      .querySelector('.card-header i.fa-tags')
      ?.closest('.card')
      ?.querySelector('.card-body');

    if (specCardBody) {
      // Purge any legacy static markup
      specCardBody.innerHTML = '';

      container = document.createElement('div');
      container.id = 'specializationContainer';
      specCardBody.appendChild(container);
    }
  }

  if (!container) return; // Still not found, abort safely

  // Clear previous dynamic content
  container.innerHTML = '';

  const META = {
    roads: { icon: 'fa-road', color: 'bg-primary', label: 'Roads' },
    water: { icon: 'fa-tint', color: 'bg-info', label: 'Water' },
    electricity: { icon: 'fa-bolt', color: 'bg-warning', label: 'Electricity' },
    sanitation: { icon: 'fa-trash-alt', color: 'bg-danger', label: 'Sanitation' },
    infrastructure: { icon: 'fa-building', color: 'bg-secondary', label: 'Infrastructure' },
    environment: { icon: 'fa-leaf', color: 'bg-success', label: 'Environment' }
  };

  top.forEach(([key, value], idx) => {
    const pct = Math.round((value / total) * 100);
    const { icon, color, label } = META[key];

    const row = document.createElement('div');
    row.className = idx < top.length - 1 ? 'mb-3' : 'mb-0';
    row.innerHTML = `
      <div class="d-flex justify-content-between mb-1">
        <span><i class="fas ${icon} me-1"></i> ${label}</span>
        <small class="text-muted">${pct}%</small>
      </div>
      <div class="progress" style="height: 8px;">
        <div class="progress-bar ${color}" role="progressbar" style="width: ${pct}%;" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
      </div>`;

    container.appendChild(row);
  });
}


  // --- Data Fetching -------------------------------------------------------
  async function fetchUserReports() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const resp = await fetch('/api/reports', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const result = await resp.json();
      if (!result.success) throw new Error(result.message || 'Failed to fetch reports');

      const reports = (result.data || [])
        .filter(r => r && r._id && r.status)
        .map(adaptReportForUI)
        .filter(Boolean);

      updateCivicStats(reports);
      updateSpecializationAreas(reports);
    } catch (err) {
      // Non-critical: log but don't disrupt profile page
      console.error('Profile Stats: failed to load reports', err);
    }
  }

  // --- Initialise on page load -------------------------------------------
  document.addEventListener('DOMContentLoaded', fetchUserReports);
})();
