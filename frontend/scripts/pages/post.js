/**
 * post.js - Create listing page.
 */

function onAuthSuccess() {}

const MAX_LISTING_IMAGES = 6;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
let postImageFiles = [];

function selectType(element) {
  element.closest('.type-chips').querySelectorAll('.type-chip').forEach((chip) => chip.classList.remove('active'));
  element.classList.add('active');
}

function initUploadZone() {
  const zone = document.getElementById('post-upload-zone');
  if (!zone) return;
  const input = document.createElement('input');
  input.type = 'file';
  input.id = 'post-image-input';
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
    handleFileSelect(Array.from(event.dataTransfer.files || []));
  });
  input.addEventListener('change', (event) => {
    handleFileSelect(Array.from(event.target.files || []));
    input.value = '';
  });
  renderPostImagePreviews();
}

function handleFileSelect(files) {
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
    if (postImageFiles.length >= MAX_LISTING_IMAGES) {
      showToast(`You can upload up to ${MAX_LISTING_IMAGES} photos`);
      break;
    }
    postImageFiles.push(file);
  }
  renderPostImagePreviews();
}

function renderPostImagePreviews() {
  const container = document.getElementById('post-upload-previews');
  if (!container) return;
  container.innerHTML = '';
  postImageFiles.forEach((file, index) => {
    const card = document.createElement('div');
    card.className = 'upload-preview-card';
    const imageUrl = URL.createObjectURL(file);
    card.innerHTML = `<button type="button" class="upload-preview-remove" aria-label="Remove photo">&times;</button><img src="${escapeAttribute(imageUrl)}" alt="${escapeAttribute(file.name)}"/><div class="upload-preview-meta">${escapeHtml(file.name)}</div>`;
    card.querySelector('.upload-preview-remove')?.addEventListener('click', () => {
      postImageFiles.splice(index, 1);
      renderPostImagePreviews();
    });
    const image = card.querySelector('img');
    image?.addEventListener('load', () => URL.revokeObjectURL(imageUrl), { once: true });
    container.appendChild(card);
  });
}

function updatePostPreview() {
  const title = document.getElementById('post-title')?.value || 'Title';
  const rawPrice = document.getElementById('post-price')?.value;
  const parsedPrice = parsePriceInput(rawPrice || '1');
  const price = Math.max(0.01, Number.isFinite(parsedPrice) ? parsedPrice : 1);
  const city = document.getElementById('post-city')?.value || '';
  const district = document.getElementById('post-district')?.value || '';
  const location = RoommieLocationUtils.formatLocationValue(city, district) || 'Location';
  const type = document.querySelector('.type-chip.active')?.textContent || 'Private';
  const preview = document.getElementById('post-preview');
  if (preview) preview.innerHTML = `<strong>${escapeHtml(title)}</strong> - ${escapeHtml(type)} - ${escapeHtml(location)} - ${escapeHtml(formatPriceTRY(price))}/mo`;
}

async function publishListing() {
  if (!Auth.isLoggedIn()) {
    showToast('Please log in to publish a listing');
    showModal('login');
    return;
  }
  const title = document.getElementById('post-title')?.value?.trim();
  const rawPrice = document.getElementById('post-price')?.value;
  const price = parsePriceInput(rawPrice);
  const city = document.getElementById('post-city')?.value || '';
  const district = document.getElementById('post-district')?.value || '';
  const location = RoommieLocationUtils.formatLocationValue(city, district);
  const description = document.getElementById('post-desc')?.value?.trim() || '';
  const phone = document.getElementById('post-phone')?.value?.trim() || '';
  const waInput = document.getElementById('post-wa');
  const whatsapp = (waInput?.value?.trim() === '+90' ? '' : (waInput?.value?.trim() || ''));
  const mapLocation = document.getElementById('post-map-location')?.value?.trim() || '';
  if (!title) return highlightField('post-title', 'Please enter a title');
  if (rawPrice === '' || Number.isNaN(price)) return highlightField('post-price', 'Please enter a price');
  if (price <= 0) return highlightField('post-price', 'Price must be greater than 0');
  if (!phone) return highlightField('post-phone', 'Please enter a phone number');
  if (!city) return highlightField('post-city', 'Please select a city');
  if (!district) return highlightField('post-district', 'Please select a district');
  const waResult = RoommieLocationUtils.normalizeWhatsApp(whatsapp);
  if (!waResult.valid) {
    document.getElementById('post-wa-error').textContent = waResult.message;
    waInput?.classList.add('input-error');
    showToast('Please fix the WhatsApp field');
    waInput?.focus();
    return;
  }
  const mapResult = RoommieLocationUtils.normalizeMapLocationLink(mapLocation);
  if (!mapResult.valid) {
    const mapInput = document.getElementById('post-map-location');
    document.getElementById('post-map-location-error').textContent = mapResult.message;
    mapInput?.classList.add('input-error');
    showToast('Please fix the map link field');
    mapInput?.focus();
    return;
  }
  const type = document.querySelector('.type-chip.active')?.textContent || 'Private';
  const amenities = Array.from(document.querySelectorAll('.amenity-chip.active')).map((chip) => chip.textContent);
  const roommates = document.querySelector('input[name="roommates"]:checked')?.value || '0';
  const gender = document.querySelector('input[name="gender"]:checked')?.value || 'Any';
  const smoking = document.querySelector('input[name="smoke"]:checked')?.value || 'Non-smoker only';
  const env = document.querySelector('input[name="env"]:checked')?.value || 'Quiet environment';
  const pets = document.querySelector('input[name="pets"]:checked')?.value || 'No pets';
  const formData = new FormData();
  formData.append('title', title); formData.append('type', type); formData.append('location', location); formData.append('description', description); formData.append('price', Math.max(0.01, price).toFixed(2)); formData.append('phone', phone); formData.append('whatsapp', waResult.normalized); formData.append('mapLocation', mapResult.normalized); formData.append('amenities', JSON.stringify(amenities)); formData.append('prefsRoommates', roommates); formData.append('prefsGender', gender); formData.append('prefsSmoking', smoking); formData.append('prefsEnv', env); formData.append('prefsPets', pets);
  postImageFiles.forEach((file) => formData.append('images', file));
  const button = document.querySelector('.btn-publish'); if (button) { button.textContent = 'Publishing...'; button.disabled = true; }
  try {
    await RoommieAPI.createListing(formData);
    showToast('Listing published');
    setTimeout(() => { window.location.href = '/pages/space.html'; }, 900);
  } catch (error) {
    showToast(error.message);
    if (button) { button.textContent = 'Publish Listing'; button.disabled = false; }
  }
}

function highlightField(id, message) {
  showToast(message);
  const element = document.getElementById(id);
  if (!element) return;
  element.style.borderColor = '#e57373';
  element.focus();
  setTimeout(() => { element.style.borderColor = ''; }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  initUploadZone();
  const priceInput = document.getElementById('post-price');
  priceInput?.addEventListener('input', () => {
    if (priceInput.value === '') return;
    const parsedPrice = parsePriceInput(priceInput.value);
    if (Number.isFinite(parsedPrice) && parsedPrice < 0.01) priceInput.value = '0.01';
  });
  RoommieLocationUtils.populateCitySelect(document.getElementById('post-city'), 'Select city...');
  const citySelect = document.getElementById('post-city');
  const districtSelect = document.getElementById('post-district');
  citySelect?.addEventListener('change', () => { RoommieLocationUtils.populateDistrictSelect(districtSelect, citySelect.value, 'Select district...'); updatePostPreview(); });
  RoommieLocationUtils.bindWhatsAppValidation(document.getElementById('post-wa'), document.getElementById('post-wa-error'));
  RoommieLocationUtils.bindMapLocationValidation(document.getElementById('post-map-location'), document.getElementById('post-map-location-error'));
  ['post-title', 'post-price', 'post-city', 'post-district'].forEach((id) => {
    const element = document.getElementById(id);
    if (element) element.addEventListener('input', updatePostPreview);
    if (element && element.tagName === 'SELECT') element.addEventListener('change', updatePostPreview);
  });
});

window.onAuthSuccess = onAuthSuccess;
window.publishListing = publishListing;
window.selectType = selectType;
window.updatePostPreview = updatePostPreview;

