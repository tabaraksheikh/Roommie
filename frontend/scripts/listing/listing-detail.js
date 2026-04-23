/**
 * common-listing-detail.js - Shared listing detail page behavior.
 */

let detailFromPage = 'home';

async function openDetail(idOrListing, fromPage) {
  if (!Auth.isLoggedIn()) return showModal('login');
  detailFromPage = fromPage || 'home';
  showPage('detail');

  const backBtn = document.getElementById('detail-back-btn');
  if (backBtn) backBtn.onclick = () => showPage(detailFromPage);

  let room;
  if (typeof idOrListing === 'object' && idOrListing !== null) {
    room = idOrListing;
  } else {
    try {
      const data = await RoommieAPI.getListing(idOrListing);
      room = normalizeApiListing(data.listing);
    } catch {
      showToast('Could not load listing');
      showPage(detailFromPage);
      return;
    }
  }

  fillDetailPage(room);
}

function fillDetailPage(room) {
  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '';
  };
  const setHtml = (id, html) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };

  const image = document.getElementById('detail-img');
  if (image) {
    const imageUrls = (room.imageUrls || []).filter(Boolean);
    if (imageUrls.length > 0) {
      image.innerHTML = `
        <div class="detail-gallery">
          <img class="detail-gallery-main" src="${escapeAttribute(imageUrls[0])}" alt="${escapeAttribute(room.title)}">
          ${imageUrls.length > 1 ? `<div class="detail-gallery-thumbs">${imageUrls.map((url, index) => `<button type="button" class="detail-gallery-thumb ${index === 0 ? 'active' : ''}" data-image-url="${escapeAttribute(url)}" aria-label="View photo ${index + 1}"><img src="${escapeAttribute(url)}" alt="${escapeAttribute(room.title)} photo ${index + 1}"></button>`).join('')}</div>` : ''}
        </div>`;
      const mainImage = image.querySelector('.detail-gallery-main');
      image.querySelectorAll('.detail-gallery-thumb').forEach((thumb) => {
        thumb.addEventListener('click', () => {
          if (mainImage) mainImage.src = thumb.dataset.imageUrl || '';
          image.querySelectorAll('.detail-gallery-thumb').forEach((item) => item.classList.remove('active'));
          thumb.classList.add('active');
        });
      });
    } else {
      image.innerHTML = 'Room';
    }
  }

  const badge = document.getElementById('detail-badge');
  if (badge) {
    badge.textContent = room.type;
    badge.className = `badge ${getBadgeClass(room.type)}`;
  }

  setText('detail-location', room.location);
  setText('detail-title', room.title);
  setText('detail-desc', room.desc || room.description || '');
  setText('detail-price', formatPriceTRY(room.price));
  const amenitiesHtml = (room.amenities || []).map((amenity) => `<span class="amenity-tag">${escapeHtml(amenity)}</span>`).join('');
  setHtml('detail-amenities', amenitiesHtml || '<span style="color:var(--light);font-size:13px">None listed</span>');

  const prefs = room.prefs || {};
  setHtml('detail-prefs', `
    <div class="pref-item"><span class="pref-label">Gender Pref.</span><span class="pref-val">${escapeHtml(prefs.gender || room.prefGender || 'Any')}</span></div>
    <div class="pref-item"><span class="pref-label">Smoking</span><span class="pref-val">${escapeHtml(prefs.smoking || room.smoking || '-')}</span></div>
    <div class="pref-item"><span class="pref-label">Environment</span><span class="pref-val">${escapeHtml(prefs.env || room.env || '-')}</span></div>
    <div class="pref-item"><span class="pref-label">Pets</span><span class="pref-val">${escapeHtml(prefs.pets || room.pets || '-')}</span></div>
    <div class="pref-item"><span class="pref-label">Roommates</span><span class="pref-val">${escapeHtml(`${prefs.roommates ?? room.roommates ?? 0} current`)}</span></div>
  `);

  const phoneBtn = document.getElementById('detail-phone');
  if (phoneBtn) {
    const phoneNumber = room.phone || '';
    const phoneLabel = phoneNumber || 'Phone not provided';
    phoneBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.67A2 2 0 012 1h3a2 2 0 012 1.72 19.79 19.79 0 00.7 2.81 2 2 0 01-.45 2.11L6.91 8.91a16 16 0 006.29 6.29l1.27-1.27a2 2 0 012.11-.45 19.79 19.79 0 002.81.7A2 2 0 0122 16.92z"></path></svg><span>${escapeHtml(phoneLabel)}</span>`;
    phoneBtn.disabled = !phoneNumber;
    phoneBtn.onclick = () => phoneNumber ? (window.location.href = `tel:${phoneNumber}`) : showToast('No phone number provided');
  }

  const mapBtn = document.getElementById('detail-map-btn');
  if (mapBtn) {
    const mapLink = room.mapLocation || '';
    mapBtn.style.display = mapLink ? 'flex' : 'none';
    mapBtn.onclick = () => mapLink ? window.open(mapLink, '_blank', 'noopener,noreferrer') : showToast('No map location provided');
  }

  const waBtn = document.getElementById('detail-wa-btn');
  if (waBtn) {
    const whatsappLink = room.wa || room.whatsapp || '';
    waBtn.style.display = whatsappLink ? 'flex' : 'none';
    waBtn.onclick = () => whatsappLink ? window.open(whatsappLink, '_blank', 'noopener,noreferrer') : showToast('No WhatsApp link provided');
  }

  const saveBtn = document.querySelector('#page-detail .btn-save');
  if (saveBtn) {
    saveBtn.onclick = () => handleSaveListing(room.id, saveBtn);
    setSaveButtonState(saveBtn, false);
    refreshSaveButton(room.id, saveBtn);
  }

  if (room.poster) {
    setText('detail-poster-emoji', getAvatarDisplay());
    setText('detail-poster-name', room.poster.name || 'User');
    setText('detail-poster-sub', room.poster.gender || room.poster.sub || '');
    const posterCard = document.getElementById('detail-poster-card');
    if (posterCard) posterCard.onclick = () => openPoster(room.poster.id, 'detail');
  }
}

window.fillDetailPage = fillDetailPage;
window.openDetail = openDetail;
