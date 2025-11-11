export function showToast(message, variant = 'default', timeout = 3000) {
  const root = document.getElementById('toast-root');
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.style.borderColor = variant === 'error' ? 'var(--danger)' : variant === 'success' ? 'var(--success)' : 'var(--border)';
  el.textContent = message;
  root.append(el);
  setTimeout(() => el.remove(), timeout);
}


