/**
 * Manifest Handler
 * 
 * Adds manifest link when served over HTTP/HTTPS
 */

// Only include manifest when served from HTTP/HTTPS (not file://)
if (window.location.protocol.startsWith('http')) {
    document.write('<link rel="manifest" href="site.webmanifest">');
}