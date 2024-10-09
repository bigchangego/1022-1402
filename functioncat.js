// proxy-server.js

const express = require('express');
const httpProxy = require('http-proxy');

const app = express();
const PORT = process.env.PORT || 50001;
const apiProxy = httpProxy.createProxyServer();

// Middleware to log incoming requests
app.use((req, res, next) => {
  console.log(`Received request for ${req.url}`);
  next();
});

// Default route for testing purposes
app.get('/', (req, res) => {
  removeBasePathAndForward(req, res, 'http://127.0.0.1:8080'); 
 // res.send('Proxy server is running. Access /apps/chat-ui or /apps/chat-api.');
});
// Function to remove base path and forward request
function removeBasePathAndForward(req, res, target) {
  const originalUrl = req.url;
  if (originalUrl.startsWith('/apps/chat-ui')) {
    req.url = originalUrl.replace('/apps/chat-ui', '');
  } else if (originalUrl.startsWith('/apps/chat-api')) {
    req.url = originalUrl.replace('/apps/chat-api', '');
  }
  console.log(`Rewriting URL from ${originalUrl} to ${req.url} and proxying to ${target}`);
  apiProxy.web(req, res, { target }, (error) => {
    console.error(`Proxy error for ${originalUrl}:`, error);
    res.status(500).send('Proxy encountered an error.');
  });
}

// Proxy configuration for frontend (Vue)
app.all('/apps/chat-ui/*', (req, res) => {
  removeBasePathAndForward(req, res, 'http://127.0.0.1:8080'); // Use IPv4 address
});

// Proxy configuration for backend (Express)
app.all('/apps/chat-api/*', (req, res) => {
  removeBasePathAndForward(req, res, 'http://localhost:3000');
});

// Catch-all route to handle static assets and other requests based on referer
app.all('*', (req, res) => {
  const referer = req.headers.referer || '';
  console.log(`Catch-all route received request for ${req.url} with referer ${referer}`);

  if (referer.includes('/apps/chat-ui') ||  referer.endsWith("50001/")) {
    apiProxy.web(req, res, { target: 'http://127.0.0.1:8080' }, (error) => {
      console.error(`Proxy error for static asset ${req.url}:`, error);
      res.status(500).send('Proxy encountered an error.');
    });
  } else if (referer.includes('/apps/chat-api')) {
    apiProxy.web(req, res, { target: 'http://127.0.0.1:3001' }, (error) => {
      console.error(`Proxy error for static asset ${req.url}:`, error);
      res.status(500).send('Proxy encountered an error.');
    });
  } else {
    res.status(404).send('Not Found');
  }
});
// Start the proxy server
app.listen(PORT, () => {
  console.log(`Proxy server is running on port ${PORT}`);
});