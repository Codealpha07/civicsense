const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const multer = require('multer');
const connectDB = require('./config/db');
const { createProxyMiddleware } = require('http-proxy-middleware');
const axios = require('axios');
const fs = require('fs');

// Import API routes
const reportsRoutes = require('./routes/reports');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
console.log('Connecting to MongoDB...');
connectDB();

// Initialize Express app
const app = express();

// Temporarily disable CSP for development
app.use(helmet({
  contentSecurityPolicy: false
}));

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Trust proxy for cookies to work in production
app.set('trust proxy', 1);

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100, // Limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);

// Enable CORS
app.use(cors());
app.options('*', cors());

// Compress all responses
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Mount API routes
app.use('/api/reports', reportsRoutes);

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../public')));

// If no API routes are hit, send the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/citizen-dashboard.html'));
});

// File logging setup
const LOG_FILE = path.join(__dirname, 'server.log');

function logToFile(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, line, { encoding: 'utf8', flag: 'a' });
}

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Import routes
const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaints.new');
const userRoutes = require('./routes/userRoutes');
const geocode = require('./routes/geocode');
const reports = require('./routes/reports');

// Mount routers
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/geocode', geocode);
app.use('/api/reports', reports);

// Proxy requests to ML API
app.use('/api/v1/predict-department', createProxyMiddleware({
  target: 'http://localhost:8000',
  pathRewrite: {
    '^/api/v1/predict-department': '/predict'
  },
  changeOrigin: true
}));

// Proxy route for reverse geocoding
app.get('/api/v1/reverse-geocode', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ 
      status: 'error',
      message: 'Latitude and longitude are required' 
    });
  }
  
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: { 
        format: 'json', 
        lat, 
        lon,
        'accept-language': 'en',
        addressdetails: 1,
        zoom: 18
      },
      headers: { 
        'User-Agent': 'CivicSenseApp/1.0',
        'Accept': 'application/json'
      }
    });
    
    res.json({
      status: 'success',
      data: response.data
    });
  } catch (error) {
    console.error('Reverse geocoding error:', error.message);
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch address',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(uploadsDir));

// Serve HTML files directly (for multi-page app)
const servePage = (page) => (req, res) => {
  res.sendFile(path.join(__dirname, `../public/${page}.html`));
};

// Email service route
const { sendComplaintEmail } = require('./emailService');

app.post('/api/send-complaint', express.json(), async (req, res) => {
  try {
    console.log('Received email request:', {
      to: req.body.to,
      subject: req.body.subject,
      hasHtml: !!req.body.html
    });

    const { to, subject, html } = req.body;
    
    if (!to || !subject) {
      return res.status(400).json({ error: 'Missing required fields: to and subject are required' });
    }

    const result = await sendComplaintEmail(to, subject, html);
    
    if (result.success) {
      console.log('Email sent successfully:', result.messageId);
      res.status(200).json({ 
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      console.error('Email send failed:', result.error);
      res.status(500).json({ 
        success: false,
        error: result.error,
        code: result.code
      });
    }
  } catch (error) {
    console.error('Unexpected error in send-complaint:', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ 
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mount auth routes
app.use('/api/v1/auth', require('./routes/auth.routes'));

// Define routes for each page
app.get('/', servePage('landing'));
app.get('/login', servePage('citizen-login'));
app.get('/signup', servePage('citizen-signup'));
app.get('/dashboard', servePage('citizen-dashboard'));
app.get('/report', servePage('report'));
app.get('/my-reports', servePage('my-reports'));
app.get('/profile', servePage('profile'));
app.get('/settings', servePage('settings'));
app.get('/admin', servePage('admin-dashboard'));

// Fallback for SPA routing - serve index.html for any other route
app.get('*', servePage('landing'));

// Handle 404 - Not Found
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  res.status(err.statusCode).json({
    status: err.status,
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error('Unhandled Rejection at:', promise, 'reason:', err);
  logToFile(`Unhandled Rejection: ${err.message}\n${err.stack}`);
  
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error('Uncaught Exception:', err);
  logToFile(`Uncaught Exception: ${err.message}\n${err.stack}`);
  
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

// Handle SIGTERM for graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('💥 Process terminated!');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

// Log server start
logToFile(`Server started on port ${PORT}`);
