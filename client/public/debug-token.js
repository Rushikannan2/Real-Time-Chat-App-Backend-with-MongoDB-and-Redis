// Utility to decode JWT token and check what secret was used
// Run this in browser console to debug token issues

function debugToken() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.log('❌ No token found in localStorage');
    return;
  }
  
  console.log('=== TOKEN DEBUG ===');
  console.log('Full token:', token);
  console.log('Length:', token.length);
  
  // Decode without verification
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.log('❌ Invalid token format');
      return;
    }
    
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    console.log('\nHeader:', header);
    console.log('\nPayload:', payload);
    console.log('\nUser ID:', payload.userId);
    console.log('\nIssued at:', new Date(payload.iat * 1000).toLocaleString());
    console.log('Expires at:', new Date(payload.exp * 1000).toLocaleString());
    console.log('Is expired?:', Date.now() > payload.exp * 1000);
    
  } catch (err) {
    console.log('❌ Error decoding token:', err.message);
  }
}

function clearAuth() {
  console.log('🗑️  Clearing all auth data...');
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  console.log('✅ Auth cleared! Please refresh and login again.');
}

console.log('=== TOKEN DEBUG UTILITIES ===');
console.log('Run: debugToken() - to inspect current token');
console.log('Run: clearAuth() - to clear all auth and force re-login');

// Auto-run debug
debugToken();
