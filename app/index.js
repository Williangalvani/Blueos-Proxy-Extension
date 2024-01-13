const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const net = require('net');
const url = require('url');
const { rootCertificates } = require('tls');

const PROXY_PORT = 9102; // Port on which the proxy server will listen
const STATIC_FOLDER = path.join(__dirname, 'static');

let lastRootUrl = ""
// Create an HTTP server
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const endpoint = parsedUrl.pathname;

  // Check if the client's IP address is localhost
  if (req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1') {
    res.end();
    return;
  }

  let options = null;

  if (endpoint === '/') {
    // Serve index.html from the static folder
    const filePath = path.join(STATIC_FOLDER, 'index.html');
    serveFile(res, filePath);
  } else if (endpoint.startsWith('/__static/')) {
    // Serve static files from the static folder
    const fileName = decodeURIComponent(endpoint.slice('/__static/'.length));
    const filePath = path.join(STATIC_FOLDER, fileName);
    serveFile(res, filePath);
  } else if (endpoint === '/register_service') {
    serveFile(res, path.join(STATIC_FOLDER, 'register_service.json'));
  } else {
    if (endpoint.startsWith('/proxy/')) {
      const targetUrl = decodeURIComponent(endpoint.slice('/proxy/'.length));
      // Create options for the outgoing request
      if (targetUrl.indexOf("http") == 0) {
        console.log("got new root url")
        options = url.parse(targetUrl);
        options.method = req.method;
        options.headers = req.headers;
        lastRootUrl = `${targetUrl}`
      } else {
        let new_endpoint = endpoint.replace("/proxy", "")
        console.log("got rogue request")
        options = url.parse(lastRootUrl + new_endpoint);
        console.log(`routing to ${lastRootUrl + new_endpoint}`)
        options.method = req.method;
        options.headers = req.headers;
      }


    } else {
      // Create options for the outgoing request
      console.log('got rogue request')
      options = url.parse(lastRootUrl + endpoint);
      //console.log(options)
      options.method = req.method;
      options.headers = req.headers;
    }

    // Proxy endpoint

    // Prevent sending the Referer header
    delete options.headers.referer;


    // Set the correct Host header
    options.headers.host = options.host; // Add this line

    console.log(options)
    const proxyReq = (options.protocol === 'https:' ? https.request : http.request)(
      options,
      (proxyRes) => {

        if ([301, 302, 307, 308].includes(proxyRes.statusCode)) {
          // Make a new request to the URL specified in the Location header
          const redirectOptions = url.parse(proxyRes.headers.location);
          redirectOptions.method = req.method;
          redirectOptions.headers = req.headers;

          const redirectReq = (redirectOptions.protocol === 'https:' ? https.request : http.request)(
            redirectOptions,
            (redirectRes) => {
              // Forward all headers and the status code from the redirect response to the client
              res.writeHead(redirectRes.statusCode, redirectRes.headers);
              // Pipe the redirect response body to the client
              redirectRes.pipe(res);
            }
          );
          // Pipe the request body to the redirect request
          req.pipe(redirectReq);

          return;
        }


        // Print out the original headers
        //console.log('Original headers:', proxyRes.headers);

        // Forward all headers from the server response to the client
        proxyRes.headers['x-frame-options'] = 'ALLOW-FROM *'; // Replace example.com with your desired domain

        // Modify Content Security Policy
        if (proxyRes.headers['content-security-policy']) {
          //console.log('Original CSP:', proxyRes.headers['content-security-policy']);

          // Remove the nonce
          let modifiedCSP = proxyRes.headers['content-security-policy'].replace(/'nonce-[A-Za-z0-9+\/]*=' /, '');

          // Add 'unsafe-inline' to the 'script-src' directive
          modifiedCSP = modifiedCSP.replace("script-src", "script-src 'unsafe-inline'");

          proxyRes.headers['content-security-policy'] = modifiedCSP;
          //console.log('Modified CSP:', proxyRes.headers['content-security-policy']);
        } else {
          //console.log('No CSP found in the headers');
        }

        //console.log('Modified headers:', proxyRes.headers);
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
