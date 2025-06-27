#!/usr/bin/env python3
"""
Simple shutdown service for Pi kiosk
Provides /shutdown endpoint for web dashboard
"""

import http.server
import socketserver
import subprocess
import json

class ShutdownHandler(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/shutdown':
            try:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"status": "success", "message": "Shutdown initiated"}
                self.wfile.write(json.dumps(response).encode())
                
                print("Shutdown requested via web interface")
                subprocess.Popen(["sudo", "shutdown", "-h", "now"])
                
            except Exception as e:
                print(f"Error: {e}")
                self.send_response(500)
                self.end_headers()
        elif self.path == '/reboot':
            try:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"status": "success", "message": "Reboot initiated"}
                self.wfile.write(json.dumps(response).encode())
                
                print("Reboot requested via web interface")
                subprocess.Popen(["sudo", "shutdown", "-r", "now"])
                
            except Exception as e:
                print(f"Error: {e}")
                self.send_response(500)
                self.end_headers()
        else:
            self.send_error(404)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def log_message(self, format, *args):
        return  # Suppress logs

if __name__ == "__main__":
    port = 9999
    print(f"Shutdown service starting on port {port}")
    
    with socketserver.TCPServer(("", port), ShutdownHandler) as httpd:
        httpd.serve_forever()