// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorMsg = document.getElementById('error-msg');
  const btn = document.getElementById('login-btn');

  errorMsg.textContent = '';

  if (!email || !password) {
    errorMsg.textContent = 'Please enter your email and password.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      window.location.href = '/dashboard.html';
    } else {
      errorMsg.textContent = data.error || 'Login failed.';
    }
  } catch {
    errorMsg.textContent = 'Server error. Please try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Login';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') login(); });
