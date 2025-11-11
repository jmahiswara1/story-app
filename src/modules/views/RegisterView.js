import { StoryApi } from '../api/storyApi.js';
import { showToast } from '../components/Toast.js';

export function RegisterView({ mainRoot }) {
  mainRoot.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';

  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h1>Daftar</h1>
    <form id="register-form" novalidate>
      <div class="grid" style="grid-template-columns:1fr; gap:12px;">
        <div class="field">
          <label for="name">Nama</label>
          <input id="name" name="name" type="text" required aria-required="true" />
        </div>
        <div class="field">
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required aria-required="true" />
        </div>
        <div class="field">
          <label for="password">Kata sandi</label>
          <input id="password" name="password" type="password" minlength="8" required aria-required="true" />
          <span class="help">Minimal 8 karakter</span>
        </div>
        <div class="actions">
          <button type="submit" class="btn">Buat Akun</button>
          <a class="btn secondary" href="#/login">Sudah punya akun</a>
        </div>
      </div>
    </form>
  `;

  container.append(card);
  mainRoot.append(container);

  const form = card.querySelector('#register-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value;
    if (!name || !email || !password) return showToast('Lengkapi seluruh field', 'error');
    if (password.length < 8) return showToast('Kata sandi minimal 8 karakter', 'error');
    try {
      await StoryApi.register({ name, email, password });
      showToast('Akun berhasil dibuat. Silakan masuk.', 'success');
      window.location.hash = '#/login';
    } catch (err) {
      showToast(err.message || 'Gagal mendaftar', 'error');
    }
  });
}


