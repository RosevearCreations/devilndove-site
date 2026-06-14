// File: /functions/api/auth-login.js
// Brief description: Build 187 compatibility alias for /api/auth/login. It gives
// login a flat fallback route if a nested Pages Function deployment returns 405.

export { onRequest, onRequestGet, onRequestHead, onRequestOptions, onRequestPost } from "./auth/login.js";
