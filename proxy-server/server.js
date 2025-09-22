const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Your local backend URL (this will be your localhost mock-backend)
const LOCAL_BACKEND_URL = process.env.LOCAL_BACKEND_URL || 'http://localhost:8080';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Kruti Notes Proxy Server is running',
        timestamp: new Date().toISOString(),
        localBackend: LOCAL_BACKEND_URL,
        status: 'healthy'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Kruti Notes Agent Proxy Server',
        endpoints: {
            health: '/health',
            notes: '/v1/turbolearn/take-notes',
            youtube: '/v1/turbolearn/youtube-notes'
        },
        status: 'running'
    });
});

// Proxy all requests to your local backend
app.all('*', async (req, res) => {
    try {
        console.log('🔄 Proxy: Received request from Agent Bazaar');
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
        
        console.log('✅ Proxy: Successfully forwarded to local backend');
        console.log('📊 Response status:', response.status);
        
        // Return the response from your local backend
        res.status(response.status).json(response.data);
        
    } catch (error) {
        console.error('❌ Proxy Error:', error.message);
        
        // If local backend is not available, return a helpful error
        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({
                success: false,
                error: 'Local backend is not running. Please start your mock-backend server.',
                message: 'To start: cd mock-backend && node server.js',
                localBackend: LOCAL_BACKEND_URL
            });
        } else {
            res.status(500).json({
                success: false,
                error: 'Proxy error',
                message: error.message,
                localBackend: LOCAL_BACKEND_URL
            });
        }
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Kruti Notes Proxy Server running on port ${PORT}`);
    console.log(`📝 Proxying requests to: ${LOCAL_BACKEND_URL}`);
    console.log(`🌐 Agent Bazaar endpoint: http://localhost:${PORT}/v1/turbolearn/take-notes`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});
