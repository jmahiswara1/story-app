import { StoryApi } from '../api/storyApi.js';
import { showToast } from '../components/Toast.js';

export function LoginView({ mainRoot }) {
  mainRoot.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';

  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h1>Masuk</h1>
    <form id="login-form" novalidate>
      <div class="grid" style="grid-template-columns:1fr; gap:12px;">
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" autocomplete="email" required aria-required="true" />
          <span class="help">Masukkan email terdaftar</span>
        </div>
        <div class="field">
          <label for="password">Kata sandi</label>
          <input id="password" name="password" type="password" minlength="8" required aria-required="true" />
          <span class="help">Minimal 8 karakter</span>
        </div>
        <div class="actions">
          <button type="submit" class="btn">Masuk</button>
          <a class="btn secondary" href="#/register">Daftar</a>
        </div>
      </div>
    </form>
  `;

  container.append(card);
  mainRoot.append(container);

  const form = card.querySelector('#login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!email || !password) return showToast('Lengkapi email dan kata sandi', 'error');
    try {
      await StoryApi.login({ email, password });
      showToast('Berhasil masuk', 'success');
      window.location.hash = '#/';
    } catch (err) {
      showToast(err.message || 'Gagal masuk', 'error');
    }
  });
}


