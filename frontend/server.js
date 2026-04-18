const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.FRONTEND_PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Proxy API requests to backend
app.use('/api', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api' // keep /api prefix
  }
}));

// Proxy uploads to backend
app.use('/uploads', createProxyMiddleware({
  target: BACKEND_URL,
  changeOrigin: true
}));

// Route mapping for pages
const pageRoutes = {
  '/': 'landing.html',
  '/home': 'landing.html',
  '/login': 'citizen-login.html',
  '/signup': 'citizen-signup.html',
  '/verify': 'citizen-verify.html',
  '/dashboard': 'citizen-dashboard.html',
  '/report': 'report.html',
  '/report-detail': 'report-detail.html',
  '/report-success': 'report-success.html',
  '/my-reports': 'my-reports.html',
  '/profile': 'profile.html',
  '/settings': 'settings.html',
  '/achievements': 'achievements.html',
  '/rating': 'rating.html',
  '/admin-dashboard': 'admin-dashboard.html',
  '/admin-login': 'official-login.html',
  '/map': 'map.html'
};

// Serve pages based on routes
Object.entries(pageRoutes).forEach(([route, file]) => {
  app.get(route, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', file));
  });
});

// Handle all other routes by serving landing.html (fallback for SPA routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.listen(PORT, () => {
  console.log(`Frontend server running on port ${PORT}`);
  console.log(`Proxying API requests to ${BACKEND_URL}`);
});