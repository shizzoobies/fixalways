/**
 * FixAlways — Website Preview Modal
 * Opens service provider websites in an iframe modal overlay.
 */

function createModal() {
  const modal = document.createElement('div');
  modal.id = 'site-modal';
  modal.className = 'site-modal-hidden';
  modal.innerHTML = `
    <div class="site-modal-backdrop"></div>
    <div class="site-modal-container">
      <div class="site-modal-header">
        <div class="site-modal-info">
          <div class="site-modal-name"></div>
          <a class="site-modal-url" href="#" target="_blank" rel="noopener noreferrer"></a>
        </div>
        <div class="site-modal-actions">
          <a class="site-modal-external" href="#" target="_blank" rel="noopener noreferrer" title="Open in new tab">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </a>
          <button class="site-modal-close" type="button" aria-label="Close preview">&times;</button>
        </div>
      </div>
      <div class="site-modal-body">
        <div class="site-modal-loading">
          <div class="site-modal-spinner"></div>
          Loading website...
        </div>
        <iframe class="site-modal-iframe" sandbox="allow-scripts allow-same-origin allow-popups allow-forms" loading="lazy"></iframe>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close events
  modal.querySelector('.site-modal-backdrop').addEventListener('click', closeModal);
  modal.querySelector('.site-modal-close').addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Iframe load event
  const iframe = modal.querySelector('.site-modal-iframe');
  iframe.addEventListener('load', () => {
    modal.querySelector('.site-modal-loading').style.display = 'none';
    iframe.style.opacity = '1';
  });
}

function openModal(url, name) {
  const modal = document.getElementById('site-modal');
  if (!modal) return;

  const iframe = modal.querySelector('.site-modal-iframe');
  const loading = modal.querySelector('.site-modal-loading');
  const nameEl = modal.querySelector('.site-modal-name');
  const urlEl = modal.querySelector('.site-modal-url');
  const externalLink = modal.querySelector('.site-modal-external');

  // Reset state
  loading.style.display = 'flex';
  iframe.style.opacity = '0';
  iframe.src = '';

  // Set info
  nameEl.textContent = name || 'Website Preview';
  urlEl.textContent = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  urlEl.href = url;
  externalLink.href = url;

  // Load iframe
  iframe.src = url;

  // Show modal
  modal.classList.remove('site-modal-hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('site-modal');
  if (!modal) return;

  modal.classList.add('site-modal-hidden');
  document.body.style.overflow = '';

  // Clear iframe after animation
  setTimeout(() => {
    const iframe = modal.querySelector('.site-modal-iframe');
    iframe.src = '';
  }, 300);
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  createModal();

  // Delegate click events for all website preview buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.sitePreviewBtn');
    if (btn) {
      e.preventDefault();
      const url = btn.dataset.url;
      const name = btn.dataset.name;
      openModal(url, name);
    }
  });
});
