// Import the built-in HTTP module
const http = require('http');

// Define the server's hostname and port
const hostname = '127.0.0.1';
const port = 3000;

// Create the server
const server = http.createServer((req, res) => {
    res.statusCode = 200; // HTTP status OK
    res.setHeader('Content-Type', 'text/plain');
    res.end('Hello World from Node.js!\n');
});

// Start listening on the defined port
server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});
