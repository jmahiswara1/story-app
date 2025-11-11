export function NotFoundView({ mainRoot }) {
  mainRoot.innerHTML = '';
  const container = document.createElement('div');
  container.className = 'container';
  const card = document.createElement('section');
  card.className = 'card';
  card.innerHTML = `
    <h1>Halaman tidak ditemukan</h1>
    <a class="btn" href="#/">Kembali ke Beranda</a>
  `;
  container.append(card);
  mainRoot.append(container);
}


