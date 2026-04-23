/**
 * space.js - My listings, saved rooms, and editing.
 */

let editingListingId = null;
const MAX_LISTING_IMAGES = 6;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
let editExistingImageUrls = [];
let editNewImageFiles = [];

function onAuthSuccess() {
  loadSpace();
}

function switchSpaceTab(element, tabId) {
  document.querySelectorAll('.space-tab').forEach((tab) => tab.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('active'));
  element.classList.add('active');
  const pane = document.getElementById(tabId);
  if (pane) pane.classList.add('active');
}

function initEditUploadZone() {
  const zone = document.getElementById('edit-upload-zone');
  if (!zone || document.getElementById('edit-image-input')) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'edit-image-input';
  input.accept = 'image/*';
  input.multiple = true;
  input.style.cssText = 'position:absolute;opacity:0;inset:0;cursor:pointer;width:100%;height:100%';
  zone.style.position = 'relative';
  zone.appendChild(input);
  zone.addEventListener('dragover', (event) => { event.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', (event) => {
    event.preventDefault();
    zone.classList.remove('drag-over');
    handleEditFileSelect(Array.from(event.dataTransfer.files || []));
  });
  input.addEventListener('change', (event) => {
    handleEditFileSelect(Array.from(event.target.files || []));
    input.value = '';
  });
  renderEditImagePreviews();
}

function handleEditFileSelect(files) {
  if (!files.length) return;
  for (const file of files) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      showToast('Please upload JPG, PNG, GIF, or WebP images only');
      continue;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Each file must be under 5 MB');
      continue;
    }
    if (editExistingImageUrls.length + editNewImageFiles.length >= MAX_LISTING_IMAGES) {
      showToast(`You can upload up to ${MAX_LISTING_IMAGES} photos`);
      break;
    }
    editNewImageFiles.push(file);
  }
  renderEditImagePreviews();
}

function renderEditImagePreviews() {
  const container = document.getElementById('edit-upload-previews');
  if (!container) return;
  container.innerHTML = '';

  editExistingImageUrls.forEach((imageUrl, index) => {
    const card = document.createElement('div');
    card.className = 'upload-preview-card';
    card.innerHTML = `<button type="button" class="upload-preview-remove" aria-label="Remove photo">&times;</button><img src="${escapeAttribute(imageUrl)}" alt="Listing photo ${index + 1}"/><div class="upload-preview-meta">Saved photo</div>`;
    card.querySelector('.upload-preview-remove')?.addEventListener('click', () => {
      editExistingImageUrls.splice(index, 1);
      renderEditImagePreviews();
    });
    container.appendChild(card);
  });

  editNewImageFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'upload-preview-card';
    const imageUrl = URL.createObjectURL(file);
    card.innerHTML = `<button type="button" class="upload-preview-remove" aria-label="Remove photo">&times;</button><img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(file.name)}"/><div class="upload-preview-meta">${escapeHtml(file.name)}</div>`;
    card.querySelector('.upload-preview-remove')?.addEventListener('click', () => {
      editNewImageFiles.splice(index, 1);
      renderEditImagePreviews();
    });
    const image = card.querySelector('img');
    image?.addEventListener('load', () => URL.revokeObjectURL(imageUrl), { once: true });
    container.appendChild(card);
  });
}

async function loadSpace() {
  if (!Auth.isLoggedIn()) return;
  await Promise.all([loadMyListings(), loadSavedRooms()]);
}

async function loadMyListings() {
  const pane = document.getElementById('tab-mylistings');
  if (!pane) return;
  pane.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light)"><div style="width:28px;height:28px;border:3px solid var(--teal);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px"></div>Loading your listings...</div>';
  try {
    const { listings } = await RoommieAPI.getListings({ userId: Auth.getUser().id });
    if (listings.length === 0) {
      pane.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--light)"><div style="font-size:52px;margin-bottom:16px">Home</div><h3 style="margin-bottom:8px;font-family:\'Fraunces\',serif">No listings yet</h3><p style="margin-bottom:20px">Ready to share your room?</p><a href="/pages/post.html" style="display:inline-block;padding:12px 28px;background:var(--teal);color:white;border-radius:10px;text-decoration:none;font-weight:600">+ Post a Room</a></div>';
      return;
    }
    pane.innerHTML = '';
    listings.forEach((listing) => pane.appendChild(buildListingManageCard(normalizeApiListing(listing))));
  } catch (error) {
    pane.innerHTML = `<div style="text-align:center;padding:40px;color:#e57373">${escapeHtml(error.message)}</div>`;
  }
}

function buildListingManageCard(room) {
  const card = document.createElement('div');
  card.className = 'listing-manage-card';
  card.style.cssText = 'display:flex;align-items:center;gap:16px;padding:16px 20px;background:white;border:1px solid var(--border);border-radius:14px;margin-bottom:12px;transition:box-shadow 0.2s';
  card.onmouseenter = () => { card.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'; };
  card.onmouseleave = () => { card.style.boxShadow = ''; };
  const imageHtml = room.imageUrl ? `<img src="${escapeAttribute(room.imageUrl)}" style="width:52px;height:52px;border-radius:8px;object-fit:cover;flex-shrink:0" alt=""/>` : '<div style="font-size:20px;width:52px;text-align:center;flex-shrink:0">Room</div>';
  card.innerHTML = `<div style="display:flex;align-items:center;gap:16px;width:100%">${imageHtml}<div style="flex:1;min-width:0"><div style="font-weight:600;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(room.title)}</div><div style="font-size:13px;color:var(--light);margin-top:2px"><span style="background:#f0f0f0;padding:2px 8px;border-radius:12px;font-size:12px;margin-right:6px">${escapeHtml(room.type)}</span>${escapeHtml(room.location)} - ${escapeHtml(formatPriceTRY(room.price))}/mo</div><div style="font-size:12px;color:var(--light);margin-top:6px">${escapeHtml(formatPostingDate(room.createdAt))}</div></div><div class="listing-manage-actions" style="display:flex;gap:8px;flex-shrink:0"><button class="listing-manage-view" style="padding:8px 14px;border:1px solid var(--border);border-radius:8px;background:white;cursor:pointer;font-size:13px;font-family:inherit">View</button><button class="listing-manage-edit" style="padding:8px 14px;border:none;border-radius:8px;background:var(--teal);color:white;cursor:pointer;font-size:13px;font-family:inherit">Edit</button><button class="listing-manage-delete" style="padding:8px 14px;border:none;border-radius:8px;background:#ff6b6b;color:white;cursor:pointer;font-size:13px;font-family:inherit">Delete</button></div></div>`;
  card.querySelector('.listing-manage-view')?.addEventListener('click', () => openDetail(room.id, 'space'));
  card.querySelector('.listing-manage-edit')?.addEventListener('click', () => openEditListing(room.id));
  card.querySelector('.listing-manage-delete')?.addEventListener('click', (event) => {
    confirmDeleteListing(room.id, event.currentTarget);
  });
  return card;
}

async function loadSavedRooms() {
  const pane = document.getElementById('tab-saved');
  if (!pane) return;
  pane.innerHTML = '<div style="text-align:center;padding:40px;color:var(--light)"><div style="width:28px;height:28px;border:3px solid var(--teal);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 12px"></div>Loading saved rooms...</div>';
  try {
    const { listings } = await RoommieAPI.getSaved();
    if (listings.length === 0) {
      pane.innerHTML = '<div style="text-align:center;padding:80px 20px;color:var(--light)"><div style="font-size:52px;margin-bottom:16px">Saved</div><h3 style="margin-bottom:8px;font-family:\'Fraunces\',serif">No saved rooms</h3><p style="margin-bottom:20px">Save rooms you like and find them here.</p><a href="/pages/browse.html" style="display:inline-block;padding:12px 28px;background:var(--teal);color:white;border-radius:10px;text-decoration:none;font-weight:600">Browse Rooms</a></div>';
      return;
    }
    pane.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'rooms-grid';
    listings.forEach((listing) => {
      const room = normalizeApiListing(listing);
      const card = renderCard(room, () => openDetail(room.id, 'space'));
      const removeBtn = document.createElement('button');
      removeBtn.textContent = 'Remove';
      removeBtn.style.cssText = 'position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.6);color:white;border:none;border-radius:6px;padding:4px 10px;font-size:11px;cursor:pointer;z-index:2';
      card.style.position = 'relative';
      removeBtn.onclick = (event) => { event.stopPropagation(); removeSavedRoom(room.id, card); };
      card.appendChild(removeBtn);
      grid.appendChild(card);
    });
    pane.appendChild(grid);
  } catch (error) {
    pane.innerHTML = `<div style="text-align:center;padding:40px;color:#e57373">${escapeHtml(error.message)}</div>`;
  }
}

async function removeSavedRoom(id, cardEl) {
  try {
    await RoommieAPI.unsaveListing(id);
    cardEl?.remove();
    showToast('Removed from saved');
    const pane = document.getElementById('tab-saved');
    if (pane && pane.querySelectorAll('.room-card').length === 0) loadSavedRooms();
  } catch (error) {
    showToast(error.message);
  }
}

function confirmDeleteListing(id, button) { if (confirm('Are you sure you want to permanently delete this listing?')) deleteListing(id, button); }

async function deleteListing(id, button) {
  if (button) button.disabled = true;
  try {
    await RoommieAPI.deleteListing(id);
    showToast('Listing deleted');
    await loadMyListings();
  } catch (error) {
    showToast(error.message);
    if (button) button.disabled = false;
  }
}

async function openEditListing(id) {
  editingListingId = id;
  showPage('edit');
  try {
    fillEditForm(normalizeApiListing((await RoommieAPI.getListing(id)).listing));
  } catch (error) {
    showToast('Could not load listing: ' + error.message);
    showPage('space');
  }
}

function fillEditForm(room) {
  initEditUploadZone();
  const setValue = (id, value) => { const element = document.getElementById(id); if (element) element.value = value || ''; };
  setValue('edit-title', room.title); setValue('edit-desc', room.desc || room.description); setValue('edit-price', room.price); setValue('edit-phone', room.phone); setValue('edit-wa', room.wa || room.whatsapp); setValue('edit-map-location', room.mapLocation);
  RoommieLocationUtils.setCityDistrictValue(document.getElementById('edit-city'), document.getElementById('edit-district'), room.location, { cityPlaceholder: 'Select city...', districtPlaceholder: 'Select district...' });
  document.querySelectorAll('#edit-type-chips .type-chip').forEach((chip) => chip.classList.toggle('active', chip.textContent.trim() === room.type));
  document.querySelectorAll('#edit-amenity-grid .amenity-chip').forEach((chip) => chip.classList.toggle('active', (room.amenities || []).includes(chip.textContent.trim())));
  const setRadio = (name, value) => { const radio = document.querySelector(`input[name="${name}"][value="${value}"]`); if (radio) radio.checked = true; };
  setRadio('edit-roommates', String(room.prefs?.roommates ?? room.roommates ?? 0)); setRadio('edit-gender', room.prefs?.gender || room.prefGender || 'Any'); setRadio('edit-smoke', room.prefs?.smoking || room.smoking || 'Non-smoker only'); setRadio('edit-env', room.prefs?.env || room.env || 'Quiet environment'); setRadio('edit-pets', room.prefs?.pets || room.pets || 'No pets');
  editExistingImageUrls = [...(room.imageUrls || []).slice(0, MAX_LISTING_IMAGES)];
  editNewImageFiles = [];
  renderEditImagePreviews();
  const deleteBtn = document.getElementById('edit-delete-btn'); if (deleteBtn) deleteBtn.onclick = () => { if (confirm('Are you sure you want to delete this listing?')) deleteListing(editingListingId); };
  updateEditPreview();
}

function updateEditPreview() {
  const title = document.getElementById('edit-title')?.value || 'Title';
  const price = document.getElementById('edit-price')?.value || '1.00';
  const city = document.getElementById('edit-city')?.value || '';
  const district = document.getElementById('edit-district')?.value || '';
  const location = RoommieLocationUtils.formatLocationValue(city, district) || 'Location';
  const type = document.querySelector('#edit-type-chips .type-chip.active')?.textContent || 'Private';
  const setText = (id, value) => { const element = document.getElementById(id); if (element) element.textContent = value || ''; };
  setText('edit-preview-title', title); setText('edit-preview-meta', `${type} - ${location}`); setText('edit-preview-price', `${formatPriceTRY(price)}/mo`);
}

function selectEditType(element) { document.querySelectorAll('#edit-type-chips .type-chip').forEach((chip) => chip.classList.remove('active')); element.classList.add('active'); updateEditPreview(); }
function handleEditCityChange() { RoommieLocationUtils.populateDistrictSelect(document.getElementById('edit-district'), document.getElementById('edit-city')?.value || '', 'Select district...'); updateEditPreview(); }

async function saveEditListing() {
  if (!editingListingId) return showToast('No listing selected for editing');
  const title = document.getElementById('edit-title')?.value?.trim();
  const city = document.getElementById('edit-city')?.value || '';
  const district = document.getElementById('edit-district')?.value || '';
  const location = RoommieLocationUtils.formatLocationValue(city, district);
  const description = document.getElementById('edit-desc')?.value || '';
  const rawPrice = document.getElementById('edit-price')?.value;
  const price = parsePriceInput(rawPrice);
  const phone = document.getElementById('edit-phone')?.value?.trim() || '';
  const waInput = document.getElementById('edit-wa');
  const whatsapp = (waInput?.value?.trim() === '+90' ? '' : (waInput?.value || ''));
  const mapLocation = document.getElementById('edit-map-location')?.value?.trim() || '';
  if (!title) return showToast('Please enter a title');
  if (rawPrice === '' || Number.isNaN(price)) return showToast('Please enter a price');
  if (price <= 0) return showToast('Price must be greater than 0');
  if (!phone) return showToast('Please enter a phone number');
  if (!city) return showToast('Please select a city');
  if (!district) return showToast('Please select a district');
  const waResult = RoommieLocationUtils.normalizeWhatsApp(whatsapp);
  if (!waResult.valid) { const errorEl = document.getElementById('edit-wa-error'); if (errorEl) errorEl.textContent = waResult.message; waInput?.classList.add('input-error'); showToast('Please fix the WhatsApp field'); waInput?.focus(); return; }
  const mapResult = RoommieLocationUtils.normalizeMapLocationLink(mapLocation);
  if (!mapResult.valid) { const mapInput = document.getElementById('edit-map-location'); const errorEl = document.getElementById('edit-map-location-error'); if (errorEl) errorEl.textContent = mapResult.message; mapInput?.classList.add('input-error'); showToast('Please fix the map link field'); mapInput?.focus(); return; }
  const type = document.querySelector('#edit-type-chips .type-chip.active')?.textContent || 'Private';
  const amenities = Array.from(document.querySelectorAll('#edit-amenity-grid .amenity-chip.active')).map((chip) => chip.textContent.trim());
  const roommates = document.querySelector('input[name="edit-roommates"]:checked')?.value || '0';
  const gender = document.querySelector('input[name="edit-gender"]:checked')?.value || 'Any';
  const smoking = document.querySelector('input[name="edit-smoke"]:checked')?.value || 'Non-smoker only';
  const env = document.querySelector('input[name="edit-env"]:checked')?.value || 'Quiet environment';
  const pets = document.querySelector('input[name="edit-pets"]:checked')?.value || 'No pets';
  const formData = new FormData();
  formData.append('title', title); formData.append('type', type); formData.append('location', location); formData.append('description', description); formData.append('price', Math.max(0.01, price).toFixed(2)); formData.append('phone', phone); formData.append('whatsapp', waResult.normalized); formData.append('mapLocation', mapResult.normalized); formData.append('amenities', JSON.stringify(amenities)); formData.append('prefsRoommates', roommates); formData.append('prefsGender', gender); formData.append('prefsSmoking', smoking); formData.append('prefsEnv', env); formData.append('prefsPets', pets);
  formData.append('retainedImages', JSON.stringify(editExistingImageUrls));
  editNewImageFiles.forEach((file) => formData.append('images', file));
  const button = document.querySelector('.btn-save-edit'); if (button) button.disabled = true;
  try {
    await RoommieAPI.updateListing(editingListingId, formData);
    showToast('Listing updated');
    setTimeout(async () => { showPage('space'); await loadMyListings(); }, 800);
  } catch (error) {
    showToast(error.message);
    if (button) button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  RoommieLocationUtils.populateCitySelect(document.getElementById('edit-city'), 'Select city...');
  RoommieLocationUtils.populateDistrictSelect(document.getElementById('edit-district'), '', 'Select district...');
  RoommieLocationUtils.bindWhatsAppValidation(document.getElementById('edit-wa'), document.getElementById('edit-wa-error'));
  RoommieLocationUtils.bindMapLocationValidation(document.getElementById('edit-map-location'), document.getElementById('edit-map-location-error'));
  const editPriceInput = document.getElementById('edit-price');
  editPriceInput?.addEventListener('input', () => {
    if (editPriceInput.value === '') return;
    const parsedPrice = parsePriceInput(editPriceInput.value);
    if (Number.isFinite(parsedPrice) && parsedPrice < 0.01) editPriceInput.value = '0.01';
    updateEditPreview();
  });
  loadSpace();
});

window.handleEditCityChange = handleEditCityChange;
window.onAuthSuccess = onAuthSuccess;
window.saveEditListing = saveEditListing;
window.selectEditType = selectEditType;
window.switchSpaceTab = switchSpaceTab;
window.updateEditPreview = updateEditPreview;

