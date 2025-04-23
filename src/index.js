require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const summaryRoutes = require('./routes/summaryRoutes');

// Initialize Express app
const app = express();

// Configure request body size limit
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware
app.use(helmet({
  contentSecurityPolicy: false // Disable CSP for development
})); 
app.use(cors()); 
app.use(express.static(path.join(__dirname, '../public')));

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log('Request headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request body:', req.body);
  }
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    console.log(`[${new Date().toISOString()}] Response:`, typeof data === 'string' ? data.substring(0, 200) + '...' : data);
    return originalSend.apply(res, arguments);
  };
  
  next();
});

// Timeout middleware to prevent hanging requests
app.use((req, res, next) => {
  // Set a timeout of 60 seconds
  req.setTimeout(60000, () => {
    const err = new Error('Request timeout');
    err.status = 408;
    next(err);
  });
  next();
});

// Rate limiting
const limiter = rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS || 900000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: {
      nodeEnv: process.env.NODE_ENV,
      hasOpenAiKey: !!process.env.OPENAI_API_KEY
    }
  });
});

// Routes
app.use('/summaries', summaryRoutes);

// Serve index.html for the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve the new UI for testing
app.get('/new', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/new-index.html'));
});

// 404 handler
app.use((req, res) => {
  console.log(`[${new Date().toISOString()}] 404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] Error:`, err);
  
  // Handle specific error types
  if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    return res.status(400).json({ 
      error: 'Invalid JSON in request body',
      message: 'The request body contains malformed JSON'
    });
  }
  
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return res.status(408).json({
      error: 'Request timeout',
      message: 'The request took too long to process'
    });
  }
  
  if (err.name === 'URIError') {
    return res.status(400).json({
      error: 'Invalid URL',
      message: 'The provided URL is malformed or contains invalid characters'
    });
  }
  
  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 3000;

function startServer(port) {
  const server = app.listen(port)
    .on('listening', () => {
      console.log(`\n[${new Date().toISOString()}] Server is running on port ${port}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);
      console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? '✓ Present' : '✗ Missing');
      console.log(`Health check available at: http://localhost:${port}/health`);
      console.log(`Frontend available at: http://localhost:${port}\n`);
    })
    .on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use. Trying port ${port + 1}...`);
        server.close();
        // Try the next port
        startServer(port + 1);
      } else {
        console.error('Server error:', error);
        process.exit(1);
      }
    });
  
  return server;
}

// Try to start the server on the specified port
startServer(PORT); 