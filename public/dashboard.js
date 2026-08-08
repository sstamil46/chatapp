const token = localStorage.getItem('token');
const userName = localStorage.getItem('userName') || 'User';

if (!token) window.location.href = '/';

const messagesEl   = document.getElementById('messages');
const inputEl      = document.getElementById('msg-input');
const sendBtn      = document.getElementById('send-btn');
const emptyState   = document.getElementById('empty-state');
const sidebarName  = document.getElementById('sidebar-name');
const sidebarAv    = document.getElementById('sidebar-avatar');
const topbarSub    = document.getElementById('topbar-sub');

// Init user info
sidebarName.textContent = userName;
sidebarAv.textContent   = userName.charAt(0).toUpperCase();
topbarSub.textContent   = `Hi, ${userName} 👋`;

// ── Sidebar (mobile) ──────────────────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('overlay').classList.toggle('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('overlay').classList.remove('show');
}

// ── Auth ──────────────────────────────────────────────────────────────────────
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  window.location.href = '/';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function nowTime() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function hideEmpty() {
  if (emptyState) emptyState.style.display = 'none';
}

function appendMessage(role, text) {
  hideEmpty();

  const isUser = role === 'user';

  const row = document.createElement('div');
  row.className = `msg-row ${isUser ? 'user-row' : ''}`;

  const avatarEl = document.createElement('div');
  avatarEl.className = `msg-avatar ${isUser ? 'user-av' : 'ai-av'}`;
  avatarEl.textContent = isUser ? userName.charAt(0).toUpperCase() : '🤖';

  const content = document.createElement('div');
  content.className = 'msg-content';

  const senderEl = document.createElement('div');
  senderEl.className = 'msg-sender';
  senderEl.textContent = isUser ? 'You' : 'ChatAI';

  const bubble = document.createElement('div');
  bubble.className = `bubble ${isUser ? 'user-bubble' : 'ai-bubble'}`;
  bubble.textContent = text;

  const timeEl = document.createElement('div');
  timeEl.className = 'msg-time';
  timeEl.textContent = nowTime();

  content.appendChild(senderEl);
  content.appendChild(bubble);
  content.appendChild(timeEl);

  row.appendChild(avatarEl);
  row.appendChild(content);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  hideEmpty();
  const row = document.createElement('div');
  row.className = 'typing-row';
  row.id = 'typing-row';

  const av = document.createElement('div');
  av.className = 'msg-avatar ai-av';
  av.textContent = '🤖';

  const bubble = document.createElement('div');
  bubble.className = 'typing-bubble';
  bubble.innerHTML = '<div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div>';

  row.appendChild(av);
  row.appendChild(bubble);
  messagesEl.appendChild(row);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const row = document.getElementById('typing-row');
  if (row) row.remove();
}

// ── Send message ──────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || sendBtn.disabled) return;

  inputEl.value = '';
  inputEl.style.height = 'auto';
  sendBtn.disabled = true;
  appendMessage('user', text);
  showTyping();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message: text })
    });

    removeTyping();

    if (res.status === 401) { logout(); return; }

    const data = await res.json();
    appendMessage('ai', data.aiResponse || 'Sorry, I could not get a response.');
  } catch {
    removeTyping();
    appendMessage('ai', 'Server error. Please try again.');
  } finally {
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// ── Load history ──────────────────────────────────────────────────────────────
async function loadHistory() {
  try {
    const res = await fetch('/api/chat', { headers: authHeaders() });
    if (res.status === 401) { logout(); return; }
    const msgs = await res.json();
    msgs.forEach(m => {
      appendMessage('user', m.userMessage);
      appendMessage('ai', m.aiResponse);
    });
  } catch {
    console.error('Failed to load chat history');
  }
}

// ── Clear chat (visual only) ──────────────────────────────────────────────────
function clearChat() {
  // Remove all msg-row elements
  [...messagesEl.querySelectorAll('.msg-row, .typing-row')].forEach(el => el.remove());
  if (emptyState) emptyState.style.display = '';
  closeSidebar();
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
function useSuggestion(btn) {
  // Strip the emoji prefix
  inputEl.value = btn.textContent.replace(/^.\s/, '');
  inputEl.focus();
  sendMessage();
}

// ── Auto-grow textarea ────────────────────────────────────────────────────────
inputEl.addEventListener('input', () => {
  inputEl.style.height = 'auto';
  inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
});

inputEl.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// ── Boot ──────────────────────────────────────────────────────────────────────
loadHistory();
