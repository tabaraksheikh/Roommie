/**
 * index.js - Home page.
 */

function onAuthSuccess() {
  loadFeatured();
}

function renderFeaturedPreviewState(message, actionLabel, actionHandler) {
  const grid = document.getElementById('featured-rooms');
  if (!grid) return;

  grid.innerHTML = `
    <div class="empty-state-card">
      <div class="empty-state-copy">
        <span class="empty-state-eyebrow">Fresh start</span>
        <h3>${message}</h3>
        <p>The homepage is ready. New rooms will appear here as soon as the first listing is published.</p>
        <div class="empty-state-actions">
          <button type="button" class="empty-state-btn empty-state-btn-primary" id="empty-state-primary">${actionLabel}</button>
          <button type="button" class="empty-state-btn empty-state-btn-secondary" id="empty-state-secondary">Browse after login</button>
        </div>
      </div>
      <div class="empty-state-previews" aria-hidden="true">
        <div class="preview-room-card">
          <div class="preview-room-image preview-room-image-a"></div>
          <div class="preview-room-body">
            <div class="preview-room-badge">Private Room</div>
            <div class="preview-room-line preview-room-line-title"></div>
            <div class="preview-room-line"></div>
            <div class="preview-room-line preview-room-line-short"></div>
          </div>
        </div>
        <div class="preview-room-card preview-room-card-offset">
          <div class="preview-room-image preview-room-image-b"></div>
          <div class="preview-room-body">
            <div class="preview-room-badge">Shared Flat</div>
            <div class="preview-room-line preview-room-line-title"></div>
            <div class="preview-room-line"></div>
            <div class="preview-room-line preview-room-line-short"></div>
          </div>
        </div>
      </div>
    </div>`;

  document.getElementById('empty-state-primary')?.addEventListener('click', actionHandler);
  document.getElementById('empty-state-secondary')?.addEventListener('click', () => {
    handleProtectedNavigation('/pages/browse.html');
  });
}

async function loadFeatured() {
  const grid = document.getElementById('featured-rooms');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--light)">
      <div style="width:36px;height:36px;border:3px solid var(--teal);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>
      Loading rooms...
    </div>`;

  try {
    const { listings } = await RoommieAPI.getFeatured();
    grid.innerHTML = '';

    if (!listings.length) {
      renderFeaturedPreviewState(
        'No listings yet',
        Auth.isLoggedIn() ? 'Post the first room' : 'Create account',
        () => {
          if (Auth.isLoggedIn()) {
            window.location.href = '/pages/post.html';
            return;
          }
          showModal('signup');
        }
      );
      return;
    }

    listings.forEach((listing) => {
      const room = normalizeApiListing(listing);
      grid.appendChild(renderCard(room, () => openDetail(room.id, 'home')));
    });
  } catch (error) {
    console.error('Featured load error:', error.message);
    renderFeaturedPreviewState('Featured section is temporarily unavailable', 'Try again', () => loadFeatured());
  }
}

function initHeroSearch() {
  const input = document.getElementById('hero-search-input');
  const browseButton = document.getElementById('hero-browse-btn');
  const seeAllLink = document.getElementById('see-all-rooms-link');
  if (!input || !browseButton) return;

  const goToBrowse = () => {
    const search = input.value.trim();
    const target = search ? `/pages/browse.html?search=${encodeURIComponent(search)}` : '/pages/browse.html';
    handleProtectedNavigation(target);
  };

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      goToBrowse();
    }
  });

  browseButton.addEventListener('click', (event) => {
    event.preventDefault();
    goToBrowse();
  });

  if (seeAllLink) {
    seeAllLink.addEventListener('click', (event) => {
      event.preventDefault();
      handleProtectedNavigation('/pages/browse.html');
    });
  }
}

function initHeroBg() {
  const heroBg = document.getElementById('hero-bg');
  if (heroBg) heroBg.style.backgroundImage = "url('/images/hero-bg.jpg')";
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroBg();
  loadFeatured();
  initHeroSearch();
});

