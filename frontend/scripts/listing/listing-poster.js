/**
 * common-listing-poster.js - Shared poster profile behavior.
 */

let posterFromPage = 'home';

async function openPoster(userId, fromPage) {
  if (!Auth.isLoggedIn()) return showModal('login');
  posterFromPage = fromPage || 'home';
  showPage('poster');

  const backBtn = document.getElementById('poster-back-btn');
  if (backBtn) backBtn.onclick = () => showPage(posterFromPage);

  try {
    const { user, listings } = await RoommieAPI.getUser(userId);
    renderPosterProfile(user, listings, {
      emptyBio: '',
      emptyListingsMessage: 'No listings',
      detailSource: 'poster',
    });
  } catch {
    showToast('Could not load profile');
    showPage(posterFromPage);
  }
}

function renderPosterProfile(user, listings, options = {}) {
  const {
    emptyBio = '',
    emptyListingsMessage = 'No listings',
    detailSource = 'poster',
  } = options;
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value || '';
  };

  setText('poster-big-emoji', getAvatarDisplay());
  setText('poster-big-name', user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim());
  setText('poster-big-sub', user.gender || '');
  setText('poster-big-bio', user.bio || emptyBio);

  const tags = document.getElementById('poster-big-tags');
  if (tags) {
    tags.innerHTML = [user.gender]
      .filter(Boolean)
      .map((tag) => `<span class="poster-tag">${escapeHtml(tag)}</span>`)
      .join('');
  }

  const grid = document.getElementById('poster-listings-grid');
  if (!grid) return;

  grid.innerHTML = '';
  if (!listings || listings.length === 0) {
    grid.innerHTML = `<p style="text-align:center;color:var(--light);padding:40px">${escapeHtml(emptyListingsMessage)}</p>`;
    return;
  }

  listings.forEach((listing) => {
    grid.appendChild(renderCard(normalizeApiListing(listing), () => openDetail(listing.id, detailSource)));
  });
}

window.openPoster = openPoster;
window.renderPosterProfile = renderPosterProfile;
