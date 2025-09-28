const axios = require('axios');

// Your local backend URL - you'll need to update this when your IP changes
const LOCAL_BACKEND_URL = 'http://localhost:8080';

module.exports = async (req, res) => {
  // Enable CORS for Agent Bazaar
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-TENANT-ID');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    console.log('🔄 MCP Proxy: Received request from Agent Bazaar');
    console.log('📝 Method:', req.method);
    console.log('📝 URL:', req.url);
    console.log('📝 Headers:', req.headers);
    
    // Forward the request to your local backend
    const response = await axios({
      method: req.method,
      url: `${LOCAL_BACKEND_URL}${req.url}`,
      data: req.body,
      headers: {
        ...req.headers,
        'host': 'localhost:8080'
      },
      timeout: 30000 // 30 second timeout
    });
    
    console.log('✅ MCP Proxy: Successfully forwarded to local backend');
    console.log('📊 Response status:', response.status);
    
    // Return the response from your local backend
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('❌ MCP Proxy Error:', error.message);
    
    // If local backend is not available, return a helpful error
    if (error.code === 'ECONNREFUSED') {
      res.status(503).json({
        success: false,
        error: 'Local backend is not running. Please start your mock-backend server.',
        message: 'To start: cd mock-backend && node server.js'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Proxy error',
        message: error.message
      });
    }
  }
};

