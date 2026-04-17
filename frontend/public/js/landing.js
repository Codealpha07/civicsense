document.addEventListener('DOMContentLoaded', () => {
    loadStatsAndActivity();
  });
  
  async function loadStatsAndActivity() {
    try {
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (!data.success) return;
  
      const complaints = data.data;
      // Stats
      const total = complaints.length;
      const resolvedArr = complaints.filter(c => c.status === 'Resolved');
      const resolved = resolvedArr.length;
  
      // Avg resolution time in days
      let avgDays = '--';
      if (resolvedArr.length) {
        const totalMs = resolvedArr.reduce((sum, c) => {
          const created = new Date(c.createdAt).getTime();
          const resolvedAt = new Date(c.updatedAt || c.resolvedAt || c.closedAt || c.createdAt).getTime();
          return sum + (resolvedAt - created);
        }, 0);
        avgDays = (totalMs / resolvedArr.length / (1000 * 60 * 60 * 24)).toFixed(1);
      }
  
      const satisfaction = total ? Math.round((resolved / total) * 100) : 0;
  
      document.getElementById('statTotal').innerText = total;
      document.getElementById('statResolved').innerText = resolved;
      document.getElementById('statAvg').innerText = avgDays;
      document.getElementById('statSatisfaction').innerText = satisfaction;
  
      // Recent activity (last 5)
      const recentList = document.getElementById('recentActivity');
      recentList.innerHTML = '';
      const recent = complaints.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
      recent.forEach(c => {
        const li = document.createElement('li');
        li.className = 'list-group-item';
        const statusEmoji = c.status === 'Resolved' ? '🟢' : (c.status === 'In Progress' ? '🟡' : '🔴');
        li.textContent = `${statusEmoji} ${c.issueType} in ${c.location || c.city || ''}`;
        recentList.appendChild(li);
      });
    } catch (err) {
      console.error(err);
    }
  }