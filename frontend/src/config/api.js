/**
 * Backend API URL configuration.
 * In production builds where REACT_APP_BACKEND_URL is not set,
 * falls back to the current window origin (same-domain deployment).
 */
const API_BASE = process.env.REACT_APP_BACKEND_URL || window.location.origin;

export default API_BASE;
