// File: /functions/api/auth-login.js
// Build 188 compatibility alias for /api/auth/login. It gives login a flat fallback route
// if a nested Pages Function route ever misbehaves.
export { onRequest, onRequestGet, onRequestHead, onRequestOptions, onRequestPost } from "./auth/login.js";
