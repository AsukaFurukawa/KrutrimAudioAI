# Kruti Notes Proxy Server

A simple Node.js proxy server for Agent Bazaar integration.

## Features
- Proxies requests to local mock-backend
- Health check endpoint
- CORS enabled
- File upload support

## Deployment on Render

1. Connect your GitHub repository to Render
2. Select this directory as the root
3. Use Node.js environment
4. Build command: `npm install`
5. Start command: `node server.js`

## Environment Variables
- `NODE_ENV`: production
- `LOCAL_BACKEND_URL`: http://localhost:8080

## Endpoints
- `GET /health` - Health check
- `POST /v1/turbolearn/take-notes` - Proxy to mock-backend

