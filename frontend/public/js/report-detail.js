// report-detail.js
// This script loads a single report by ID and renders a full-page detail view.

(function () {
  const container = document.getElementById('reportDetailContainer');

  // Utility: show a simple message in the container
  function showMessage(html) {
    container.innerHTML = `<div class="my-5 text-center text-muted">${html}</div>`;
  }

  // Extract reportId from query string
  const params = new URLSearchParams(window.location.search);
  const reportId = params.get('reportId') || params.get('id');

  if (!reportId) {
    showMessage('<p class="lead">No report ID specified.</p><a href="/my-reports.html" class="btn btn-primary mt-2">Back to My Reports</a>');
    return;
  }

  // Ensure the user is authenticated
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Fetch report data from the API
  async function fetchReport(id) {
    try {
      // Attempt a direct endpoint first
      let res = await fetch(`/api/reports/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // Fallback to list query if direct endpoint is unavailable
      if (!res.ok) {
        const listRes = await fetch(`/api/reports?reportId=${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        res = listRes;
      }

      if (!res.ok) throw new Error('Failed to fetch report');

      const json = await res.json();
      // Some APIs return { success, data } others directly the object
      const data = json.data || json.report || json;
      return Array.isArray(data) ? data[0] : data;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // Map status to bootstrap badge classes
  function getStatusBadgeClass(status = '') {
    const map = {
      'pending': 'bg-warning text-dark',
      'active': 'bg-info',
      'verified': 'bg-success',
      'assigned': 'bg-primary',
      'in-progress': 'bg-info',
      'resolved': 'bg-success',
      'overdue': 'bg-danger'
    };
    return map[status] || 'bg-secondary';
  }

  // Format location gracefully for varied structures (aligned with dashboard utility)
  function formatLocation(loc) {
    if (!loc) return 'Location not available';

    // String: strip any leading "Point" label
    if (typeof loc === 'string') {
      return loc.replace(/^Point,?\s*/i, '').trim();
    }

    if (typeof loc === 'object') {
      // Prefer explicit address fields
      const addressKeys = ['address', 'formattedAddress', 'fullAddress', 'display_name', 'displayName'];
      for (const key of addressKeys) {
        if (loc[key]) return loc[key];
      }

      // GeoJSON coordinates [lng, lat]
      if (Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
        const [lng, lat] = loc.coordinates;
        return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }

      // Separate latitude / longitude props
      if (loc.latitude !== undefined && loc.longitude !== undefined) {
        return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
      }

      // Fallback: join meaningful values
      return Object.entries(loc)
        .filter(([k, v]) => k !== 'type' && k !== 'coordinates' && v)
        .map(([_, v]) => Array.isArray(v) ? v.join(', ') : v)
        .join(', ');
    }

    return String(loc);
  }

  // Render the report details to the container
  function renderReport(report) {
    if (!report) {
      showMessage('<p class="lead">Report not found.</p><a href="/my-reports.html" class="btn btn-primary mt-2">Back to My Reports</a>');
      return;
    }

    const badgeClass = getStatusBadgeClass(report.status);
    const reportedDate = report.createdAt || report.dateReported;

    container.innerHTML = `
      <div class="col-lg-10 col-xl-8 mx-auto">
        <div class="card shadow-sm border-0 mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h3 class="mb-0">${report.title || 'Untitled Report'}</h3>
          <span class="badge ${badgeClass} text-capitalize">${report.status || 'unknown'}</span>
        </div>
        <div class="card-body">
          <p class="text-muted mb-2"><i class="fas fa-hashtag me-2"></i><strong>ID:</strong> ${report.id || report._id}</p>
          <p class="text-muted mb-2"><i class="fas fa-tag me-2"></i><strong>Category:</strong> ${report.category || 'General'}</p>
          <p class="text-muted mb-2"><i class="fas fa-map-marker-alt me-2"></i><strong>Location:</strong> ${formatLocation(report.location)}</p>
          ${reportedDate ? `<p class="text-muted mb-3"><i class="far fa-clock me-2"></i><strong>Reported:</strong> ${new Date(reportedDate).toLocaleString()}</p>` : ''}
          <h5>Description</h5>
          <p>${report.description || 'No description provided.'}</p>

          ${Array.isArray(report.images ?? report.photos) && (report.images ?? report.photos).length ? `
            <div class="row g-3 mt-4">
              ${(report.images ?? report.photos).map(src => `
                <div class="col-6 col-md-4">
                  <img src="${src.startsWith('/') ? src : `/uploads/${src}`}" class="img-fluid rounded shadow-sm" alt="Report image">
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
        <div class="card-footer bg-white d-flex justify-content-between align-items-center">
          <button class="btn btn-outline-secondary" onclick="history.back();"><i class="fas fa-arrow-left me-1"></i>Back</button>
          <small class="text-muted">Last updated: ${report.updatedAt ? new Date(report.updatedAt).toLocaleString() : (report.dateUpdated ? new Date(report.dateUpdated).toLocaleString() : 'N/A')}</small>
        </div>
      </div>
    </div>
     `;
  }

  // Initialize
  (async () => {
    const report = await fetchReport(reportId);
    renderReport(report);
  })();
})();
