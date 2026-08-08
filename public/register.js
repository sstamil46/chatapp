// Redirect if already logged in
if (localStorage.getItem('token')) {
  window.location.href = '/dashboard.html';
}

async function register() {
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const confirm = document.getElementById('confirm').value;
  const errorMsg = document.getElementById('error-msg');
  const btn = document.getElementById('reg-btn');

  errorMsg.textContent = '';

  if (!name || !email || !password || !confirm) {
    errorMsg.textContent = 'All fields are required.';
    return;
  }
  if (password.length < 6) {
    errorMsg.textContent = 'Password must be at least 6 characters.';
    return;
  }
  if (password !== confirm) {
    errorMsg.textContent = 'Passwords do not match.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Creating account...';

  try {
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.name);
      window.location.href = '/dashboard.html';
    } else {
      errorMsg.textContent = data.error || 'Registration failed.';
    }
  } catch {
    errorMsg.textContent = 'Server error. Please try again.';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Register';
  }
}

document.addEventListener('keydown', e => { if (e.key === 'Enter') register(); });
