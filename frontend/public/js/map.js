// Map page logic with filters & auto-refresh

document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map').setView([20.5937, 78.9629], 5); // Center on India
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  const markersLayer = L.layerGroup().addTo(map);
  let allComplaints = [];
  let refreshInterval;

  async function fetchComplaints() {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.success) {
        allComplaints = data.data;
        updateLastUpdated();
        applyFilters();
      }
    } catch (err) {
      console.error('Failed loading complaints', err);
    }
  }

  function updateLastUpdated() {
    const lbl = document.getElementById('lastUpdatedLabel');
    if (lbl) lbl.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }

  function clearMarkers() {
    markersLayer.clearLayers();
  }

  function applyFilters() {
    clearMarkers();
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const cat = document.getElementById('categoryFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';

    return complaints.filter(c => {
      const matchSearch = !search || (c.issueType?.toLowerCase().includes(search) || c.description?.toLowerCase().includes(search));
      const matchCat = !cat || c.issueType === cat;
      const matchStatus = !status || c.status === status;
      return matchSearch && matchCat && matchStatus;
    });
  }

  function renderComplaints(complaints) {
    console.log('Raw complaints data:', complaints); // Debug
    markersLayer.clearLayers();
    const filtered = filterComplaints(complaints);
    console.log('Filtered complaints:', filtered); // Debug
    const listDiv = document.getElementById('issuesList');
    if (listDiv) {
      let html = '<div class="list-group">';
      filtered.slice(0, 10).forEach(r => {
        html+=`<a href="#" class="list-group-item list-group-item-action">
          <div class="d-flex justify-content-between">
            <span><strong>${r.issueType}</strong> - ${r.status}</span>
            <small>${new Date(r.createdAt).toLocaleDateString()}</small>
          </div>
          <small>${r.description||''}</small>
        </a>`;
      });
      html+='</div>';
      listDiv.innerHTML=html;
    }

    filtered.forEach(c => {
      try {
        if (!c.latitude || !c.longitude) {
          console.warn('Skipping complaint - missing coordinates:', c);
          return;
        }
        
        const statusColors = {
          "New": "red",
          "Pending": "orange",
          "In Progress": "blue",
          "Resolved": "green"
        };
        
        const color = statusColors[c.status] || 'grey';
        console.log(`Creating marker for ${c.issueType} (${c.status}):`, c);
        
        const icon = L.icon({
          iconUrl: `/uploads/markers/marker-icon-${color}.png`,
          shadowUrl: '/uploads/markers/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          shadowAnchor: [12, 41]
        });
        
        const m = L.marker([c.latitude, c.longitude], { icon });
        m.bindPopup(`
          <strong>${c.issueType || 'Unknown Type'}</strong><br>
          ${c.description || 'No description'}<br>
          Status: ${c.status || 'Unknown'}<br>
          Ticket ID: ${c.ticketId || c.id || 'N/A'}
        `);
        markersLayer.addLayer(m);
      } catch (error) {
        console.error('Error creating marker:', error, 'For complaint:', c);
      }
    });
  }

  function startAutoRefresh() {
    stopAutoRefresh();
    refreshInterval = setInterval(fetchComplaints, 60000); // 60s
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  }

  // --- Event bindings ---
  ['searchInput', 'categoryFilter', 'statusFilter'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', applyFilters);
  });

  document.getElementById('autoRefreshToggle')?.addEventListener('change', e => {
    if (e.target.checked) startAutoRefresh(); else stopAutoRefresh();
  });

  // Initial load
  fetchComplaints();
  startAutoRefresh();
});
