const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const net = require('net');
const url = require('url');

const PROXY_PORT = 9102; // Port on which the proxy server will listen
const STATIC_FOLDER = path.join(__dirname, 'static');

// Create an HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const endpoint = parsedUrl.pathname;

  // Check if the client's IP address is localhost
  if (req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1') {
    res.end();
    return;
  }

  if (endpoint === '/') {
    // Serve index.html from the static folder
    const filePath = path.join(STATIC_FOLDER, 'index.html');
    serveFile(res, filePath);
  } else if (endpoint.startsWith('/static/')) {
    // Serve static files from the static folder
    const fileName = decodeURIComponent(endpoint.slice('/static/'.length));
    const filePath = path.join(STATIC_FOLDER, fileName);
    serveFile(res, filePath);
  } else if (endpoint === '/register_service') {
    serveFile(res, path.join(STATIC_FOLDER, 'register_service.json'));
  } else if (endpoint.startsWith('/proxy/')) {
    // Proxy endpoint
    const targetUrl = decodeURIComponent(endpoint.slice('/proxy/'.length));

    // Create options for the outgoing request
    const options = url.parse(targetUrl);
    options.method = req.method;
    options.headers = req.headers;
    
    // Prevent sending the Referer header
    delete options.headers.referer;

    // Set the correct Host header
    options.headers.host = options.host; // Add this line

    console.log(options)
    const proxyReq = (options.protocol === 'https:' ? https.request : http.request)(
      options,
      (proxyRes) => {
        // Forward all headers from the server response to the client
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    // Handle proxy request error
    proxyReq.on('error', (err) => {
      console.error('Proxy request error:', err);
      res.end();
    });

    // Forward the request body from the client to the target server
    req.pipe(proxyReq);
  } else {
    // Invalid endpoint
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Invalid endpoint');
  }
})

// Handle HTTPS requests
server.on('connect', (clientReq, clientSocket) => {
  // Check if the client's IP address is localhost
  if (clientSocket.remoteAddress === '::1' || clientSocket.remoteAddress === '127.0.0.1') {
    clientSocket.end('Connection from localhost is not allowed');
    return;
  }

  const targetUrl = `https://${clientReq.url}`;

  const options = url.parse(targetUrl);

  const proxySocket = net.connect(options.port || 443, options.hostname, () => {
    clientSocket.write(
      'HTTP/1.1 200 Connection Established\r\n' +
        'Proxy-agent: Node.js-Proxy\r\n' +
        '\r\n'
    );
    proxySocket.pipe(clientSocket);
    clientSocket.pipe(proxySocket);
  });

  // Handle proxy socket error
  proxySocket.on('error', (err) => {
    console.error('Proxy socket error:', err);
    clientSocket.end();
  });
});


function serveFile(res, filePath) {
  const fileStream = fs.createReadStream(filePath);

  fileStream.on('error', (err) => {
    console.error('File stream error:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  });

  // Get the file extension to set the appropriate content type
  const fileExt = path.extname(filePath).toLowerCase();
  let contentType = 'text/plain';

  switch (fileExt) {
    case '.html':
      contentType = 'text/html';
      break;
    case '.css':
      contentType = 'text/css';
      break;
    case '.js':
      contentType = 'application/javascript';
      break;
    case '.jpg':
    case '.jpeg':
      contentType = 'image/jpeg';
      break;
    case '.png':
      contentType = 'image/png';
      break;
    case '.gif':
      contentType = 'image/gif';
      break;
    case '.json':
      contentType = 'application/json';
      break;
  }

  res.writeHead(200, { 'Content-Type': contentType });
  fileStream.pipe(res);
}

// Start the proxy server
server.listen(PROXY_PORT, () => {
  console.log(`Proxy server is listening on port ${PROXY_PORT}`);
})
