'use strict';

// ── API Base URL ───────────────────────────────────────────────────────────
// When running inside a Capacitor Android app, window.location.hostname
// is 'localhost' (the native WebView) — not the real server.
// So we detect Capacitor and use the hardcoded backend IP instead.
//
// Production backend on Render (Default service name: flyashbricks-backend)
// Update this URL if your Render backend service has a different domain name:
const PROD_API_URL       = 'https://flyashbricks-backend.onrender.com/api';
const CAPACITOR_API_URL  = 'http://192.168.29.16:5000/api'; // Your PC's WiFi IP for local Android testing

const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const isLocal     = ['localhost', '127.0.0.1'].includes(window.location.hostname);

const BROWSER_API_URL = isLocal 
  ? `http://${window.location.hostname}:5000/api`
  : (localStorage.getItem('CUSTOM_API_URL') || PROD_API_URL);

const API_BASE_URL = isCapacitor ? CAPACITOR_API_URL : BROWSER_API_URL;


