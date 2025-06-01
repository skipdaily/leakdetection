#!/usr/bin/env python3
import http.server
import socketserver
import socket
import os
import sys

# Get the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Change to the directory containing your website files
os.chdir(current_dir)

# Get the local IP address
hostname = socket.gethostname()
local_ip = socket.gethostbyname(hostname)

# Set the port
PORT = 3000

# Try to find an available port
max_port = PORT + 10
original_port = PORT

while PORT < max_port:
    try:
        # Create the HTTP server with the allow_reuse_address option
        socketserver.TCPServer.allow_reuse_address = True
        Handler = http.server.SimpleHTTPRequestHandler
        httpd = socketserver.TCPServer(("", PORT), Handler)
        break
    except OSError:
        print(f"Port {PORT} is in use, trying {PORT+1}")
        PORT += 1

if PORT >= max_port:
    print(f"Could not find an available port in range {original_port}-{max_port-1}")
    sys.exit(1)

print(f"Serving at http://{local_ip}:{PORT}")
print(f"You can also access locally at http://localhost:{PORT}")
print("Press Ctrl+C to stop the server")

# Start the server
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped by user")
    httpd.server_close()

print(f"Serving at http://{local_ip}:{PORT}")
print(f"You can also access locally at http://localhost:{PORT}")
print("Press Ctrl+C to stop the server")

# Start the server
httpd.serve_forever()
