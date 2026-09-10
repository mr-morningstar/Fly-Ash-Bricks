'use strict';

// ── API Base URL ───────────────────────────────────────────────────────────
// When running inside a Capacitor Android app, window.location.hostname
// is 'localhost' (the native WebView) — not the real server.
// So we detect Capacitor and use the hardcoded backend IP instead.
//
// To change the backend URL for the Android app, update CAPACITOR_API_URL below.
// For production (hosted backend), set this to your server's domain.
const CAPACITOR_API_URL  = 'http://192.168.29.16:5000/api'; // ← Your PC's WiFi IP
const BROWSER_API_URL    = `http://${window.location.hostname || '127.0.0.1'}:5000/api`;

const isCapacitor = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
const API_BASE_URL = isCapacitor ? CAPACITOR_API_URL : BROWSER_API_URL;

