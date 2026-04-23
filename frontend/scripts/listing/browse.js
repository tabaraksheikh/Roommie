/**
 * browse.js - Room listings and filters.
 */

const MIN_PRICE_FILTER = 1;
const MAX_PRICE_FILTER = 10000;
const LISTINGS_PER_PAGE = 12;

const activeFilters = {
  type: 'All',
  city: 'All Cities',
  district: 'All Districts',
  page: 1,
  maxPrice: MAX_PRICE_FILTER,
  search: '',
  amenities: [],
  maxRoommates: null,
  prefGender: null,
  smoking: null,
  env: null,
  pets: null
};

function isMobileBrowseLayout() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function syncBrowseFilterToggleState() {
  const wrap = document.getElementById('browse-wrap');
  const toggleBtn = document.getElementById('filter-toggle-btn');
  if (!wrap || !toggleBtn) return;
  const isOpen = isMobileBrowseLayout()
    ? wrap.classList.contains('filters-open')
    : !wrap.classList.contains('filters-collapsed');
  toggleBtn.setAttribute('aria-expanded', String(isOpen));
}

function openBrowseFilters() {
  const wrap = document.getElementById('browse-wrap');
  if (!wrap) return;
  wrap.classList.remove('filters-collapsed');
  wrap.classList.add('filters-open');
  syncBrowseFilterToggleState();
}

function closeBrowseFilters() {
  const wrap = document.getElementById('browse-wrap');
  if (!wrap) return;
  if (isMobileBrowseLayout()) {
    wrap.classList.remove('filters-open');
  } else {
    wrap.classList.add('filters-collapsed');
    wrap.classList.remove('filters-open');
  }
  syncBrowseFilterToggleState();
}

function toggleBrowseFilters() {
  const wrap = document.getElementById('browse-wrap');
  if (!wrap) return;
  if (isMobileBrowseLayout()) {
    wrap.classList.toggle('filters-open');
  } else {
    wrap.classList.toggle('filters-collapsed');
    wrap.classList.toggle('filters-open', !wrap.classList.contains('filters-collapsed'));
  }
  syncBrowseFilterToggleState();
}

function syncBrowseFiltersForViewport() {
  const wrap = document.getElementById('browse-wrap');
  if (!wrap) return;
  if (isMobileBrowseLayout()) {
    wrap.classList.remove('filters-collapsed');
    wrap.classList.remove('filters-open');
  } else if (!wrap.classList.contains('filters-collapsed')) {
    wrap.classList.add('filters-open');
  }
  syncBrowseFilterToggleState();
}

function onAuthSuccess() {
  loadBrowse();
}

async function loadBrowse() {
  const container = document.getElementById('browse-rooms');
  const pagination = document.getElementById('browse-pagination');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:60px 0;color:var(--light)"><div style="width:32px;height:32px;border:3px solid var(--teal);border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div>Searching rooms...</div>';
  if (pagination) pagination.hidden = true;

  try {
    const response = await RoommieAPI.getListings(buildParams());
    activeFilters.page = response.page || activeFilters.page;
    const results = response.listings.map(normalizeApiListing);
    container.innerHTML = '';
    if (results.length === 0) {
      renderNoResultsState(container);
      renderActiveFilterTags();
      renderPagination(response.total || 0, response.page || activeFilters.page, response.limit || LISTINGS_PER_PAGE);
      return;
    }
    results.forEach((room) => container.appendChild(renderCard(room, () => openDetail(room.id, 'browse'))));
    renderActiveFilterTags();
    renderPagination(response.total || results.length, response.page || activeFilters.page, response.limit || LISTINGS_PER_PAGE);
  } catch (error) {
    container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--light)"><p>Could not load listings. Please make sure the server is running.</p></div>';
    renderPagination(0, 1, LISTINGS_PER_PAGE);
    console.error('Browse error:', error.message);
  }
}

function buildParams() {
  const params = {
    page: activeFilters.page,
    limit: LISTINGS_PER_PAGE,
  };
  if (activeFilters.type !== 'All') params.type = activeFilters.type;
  if (activeFilters.city !== 'All Cities') params.city = activeFilters.city;
  if (activeFilters.district !== 'All Districts') params.district = activeFilters.district;
  if (activeFilters.maxPrice < MAX_PRICE_FILTER) params.maxPrice = activeFilters.maxPrice;
  if (activeFilters.search) params.search = activeFilters.search;
  if (activeFilters.amenities.length > 0) params.amenities = activeFilters.amenities.join(',');
  if (activeFilters.maxRoommates !== null) params.roommates = activeFilters.maxRoommates;
  if (activeFilters.prefGender) params.prefGender = activeFilters.prefGender;
  if (activeFilters.smoking) params.smoking = activeFilters.smoking;
  if (activeFilters.env) params.env = activeFilters.env;
  if (activeFilters.pets) params.pets = activeFilters.pets;
  return params;
}

function handleCityFilterChange() {
  const city = document.getElementById('city-filter')?.value || 'All Cities';
  activeFilters.city = city;
  activeFilters.district = 'All Districts';
  activeFilters.page = 1;
  RoommieLocationUtils.populateDistrictSelect(document.getElementById('district-filter'), city === 'All Cities' ? '' : city, 'All Districts', 'All Districts');
  applyFilters();
}

function setSingleChoiceFilter(containerSelector, activeValue, nextValue, applyValue) {
  const valueToApply = activeValue === nextValue ? null : nextValue;
  document.querySelectorAll(`${containerSelector} .chip`).forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.value === String(valueToApply));
  });
  applyValue(valueToApply);
  activeFilters.page = 1;
  loadBrowse();
}

function filterType(value) {
  document.querySelectorAll('#type-chips .chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.value === value);
  });
  activeFilters.type = value;
  activeFilters.page = 1;
  loadBrowse();
}

function filterRoommates(value) {
  setSingleChoiceFilter('#roommates-chips', activeFilters.maxRoommates, value, (nextValue) => {
    activeFilters.maxRoommates = nextValue;
  });
}

function filterPrefGender(value) {
  setSingleChoiceFilter('#pref-gender-chips', activeFilters.prefGender, value, (nextValue) => {
    activeFilters.prefGender = nextValue;
  });
}

function filterSmoking(value) {
  setSingleChoiceFilter('#smoking-chips', activeFilters.smoking, value, (nextValue) => {
    activeFilters.smoking = nextValue;
  });
}

function filterEnv(value) {
  setSingleChoiceFilter('#env-chips', activeFilters.env, value, (nextValue) => {
    activeFilters.env = nextValue;
  });
}

function filterPets(value) {
  setSingleChoiceFilter('#pets-chips', activeFilters.pets, value, (nextValue) => {
    activeFilters.pets = nextValue;
  });
}

function toggleAmenity(element) {
  const value = element.dataset.value;
  element.dataset.a = value;
  element.classList.toggle('active');
  activeFilters.amenities = element.classList.contains('active') ? [...activeFilters.amenities, value] : activeFilters.amenities.filter((amenity) => amenity !== value);
  activeFilters.page = 1;
  loadBrowse();
}

function applyFilters() {
  activeFilters.city = document.getElementById('city-filter')?.value || 'All Cities';
  activeFilters.district = document.getElementById('district-filter')?.value || 'All Districts';
  activeFilters.search = document.getElementById('search-input')?.value || '';
  activeFilters.page = 1;
  loadBrowse();
}

function updatePriceFilter(value) {
  activeFilters.maxPrice = parseInt(value, 10);
  activeFilters.page = 1;
  const valueEl = document.getElementById('price-max-val');
  if (valueEl) valueEl.textContent = Number(value).toLocaleString('tr-TR');
  loadBrowse();
}

function resetFilters() {
  activeFilters.type = 'All'; activeFilters.city = 'All Cities'; activeFilters.district = 'All Districts'; activeFilters.page = 1; activeFilters.maxPrice = MAX_PRICE_FILTER; activeFilters.search = ''; activeFilters.amenities = []; activeFilters.maxRoommates = null; activeFilters.prefGender = null; activeFilters.smoking = null; activeFilters.env = null; activeFilters.pets = null;
  document.querySelectorAll('#type-chips .chip').forEach((chip) => chip.classList.toggle('active', chip.textContent === 'All'));
  const cityFilter = document.getElementById('city-filter'); if (cityFilter) cityFilter.value = 'All Cities';
  RoommieLocationUtils.populateDistrictSelect(document.getElementById('district-filter'), '', 'All Districts', 'All Districts');
  const priceFilter = document.getElementById('price-filter'); if (priceFilter) priceFilter.value = MAX_PRICE_FILTER;
  const priceVal = document.getElementById('price-max-val'); if (priceVal) priceVal.textContent = Number(MAX_PRICE_FILTER).toLocaleString('tr-TR');
  const searchInput = document.getElementById('search-input'); if (searchInput) searchInput.value = '';
  document.querySelectorAll('#amenity-chips .chip, #roommates-chips .chip, #pref-gender-chips .chip, #smoking-chips .chip, #env-chips .chip, #pets-chips .chip').forEach((chip) => chip.classList.remove('active'));
  loadBrowse();
}

function renderActiveFilterTags() {
  const container = document.getElementById('active-filter-tags');
  if (!container) return;
  const tags = [];
  if (activeFilters.type !== 'All') tags.push({ label: `Type: ${activeFilters.type}`, rm: () => { activeFilters.type = 'All'; activeFilters.page = 1; document.querySelectorAll('#type-chips .chip').forEach((chip) => chip.classList.toggle('active', chip.textContent === 'All')); loadBrowse(); } });
  if (activeFilters.city !== 'All Cities') tags.push({ label: `City: ${activeFilters.city}`, rm: () => { activeFilters.city = 'All Cities'; activeFilters.district = 'All Districts'; activeFilters.page = 1; const cityFilter = document.getElementById('city-filter'); if (cityFilter) cityFilter.value = 'All Cities'; RoommieLocationUtils.populateDistrictSelect(document.getElementById('district-filter'), '', 'All Districts', 'All Districts'); loadBrowse(); } });
  if (activeFilters.district !== 'All Districts') tags.push({ label: `District: ${activeFilters.district}`, rm: () => { activeFilters.district = 'All Districts'; activeFilters.page = 1; const districtFilter = document.getElementById('district-filter'); if (districtFilter) districtFilter.value = 'All Districts'; loadBrowse(); } });
  if (activeFilters.maxPrice < MAX_PRICE_FILTER) tags.push({ label: `Max ${formatPriceTRY(activeFilters.maxPrice)}`, rm: () => { activeFilters.maxPrice = MAX_PRICE_FILTER; activeFilters.page = 1; const priceFilter = document.getElementById('price-filter'); if (priceFilter) priceFilter.value = MAX_PRICE_FILTER; const priceVal = document.getElementById('price-max-val'); if (priceVal) priceVal.textContent = Number(MAX_PRICE_FILTER).toLocaleString('tr-TR'); loadBrowse(); } });
  if (activeFilters.maxRoommates !== null) tags.push({ label: `Max ${activeFilters.maxRoommates} roommate${activeFilters.maxRoommates !== 1 ? 's' : ''}`, rm: () => { activeFilters.maxRoommates = null; activeFilters.page = 1; document.querySelectorAll('#roommates-chips .chip').forEach((chip) => chip.classList.remove('active')); loadBrowse(); } });
  if (activeFilters.prefGender) tags.push({ label: `Gender: ${activeFilters.prefGender}`, rm: () => { activeFilters.prefGender = null; activeFilters.page = 1; document.querySelectorAll('#pref-gender-chips .chip').forEach((chip) => chip.classList.remove('active')); loadBrowse(); } });
  if (activeFilters.smoking) tags.push({ label: `Smoking: ${activeFilters.smoking}`, rm: () => { activeFilters.smoking = null; activeFilters.page = 1; document.querySelectorAll('#smoking-chips .chip').forEach((chip) => chip.classList.remove('active')); loadBrowse(); } });
  if (activeFilters.env) tags.push({ label: `Environment: ${activeFilters.env}`, rm: () => { activeFilters.env = null; activeFilters.page = 1; document.querySelectorAll('#env-chips .chip').forEach((chip) => chip.classList.remove('active')); loadBrowse(); } });
  if (activeFilters.pets) tags.push({ label: `Pets: ${activeFilters.pets}`, rm: () => { activeFilters.pets = null; activeFilters.page = 1; document.querySelectorAll('#pets-chips .chip').forEach((chip) => chip.classList.remove('active')); loadBrowse(); } });
  activeFilters.amenities.forEach((amenity) => tags.push({ label: amenity, rm: () => { activeFilters.amenities = activeFilters.amenities.filter((item) => item !== amenity); activeFilters.page = 1; document.querySelectorAll('#amenity-chips .chip').forEach((chip) => { if (chip.dataset.a === amenity) chip.classList.remove('active'); }); loadBrowse(); } }));
  container.innerHTML = '';
  tags.forEach((tag) => {
    const chip = document.createElement('span');
    chip.className = 'filter-tag';
    chip.append(document.createTextNode(`${tag.label} `));
    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'filter-tag-rm';
    removeButton.textContent = 'x';
    removeButton.addEventListener('click', tag.rm);
    chip.appendChild(removeButton);
    container.appendChild(chip);
  });
}

function readUrlParams() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('search')) {
    activeFilters.search = params.get('search');
    const input = document.getElementById('search-input');
    if (input) input.value = activeFilters.search;
  }
  if (params.get('type') && params.get('type') !== 'All') {
    activeFilters.type = params.get('type');
    document.querySelectorAll('#type-chips .chip').forEach((chip) => chip.classList.toggle('active', chip.textContent === activeFilters.type));
  }
  const page = parseInt(params.get('page') || '1', 10);
  activeFilters.page = Number.isFinite(page) && page > 0 ? page : 1;
}

function initBrowseLocationFilters() {
  RoommieLocationUtils.populateCitySelect(document.getElementById('city-filter'), 'All Cities', 'All Cities');
  RoommieLocationUtils.populateDistrictSelect(document.getElementById('district-filter'), '', 'All Districts', 'All Districts');
}

function bindBrowseInteractions() {
  document.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-browse-action]');
    if (!actionEl) return;

    const action = actionEl.getAttribute('data-browse-action');
    const value = actionEl.getAttribute('data-value');

    if (action === 'close-filters') return closeBrowseFilters();
    if (action === 'toggle-filters') return toggleBrowseFilters();
    if (action === 'reset') return resetFilters();
    if (action === 'search') return applyFilters();
    if (action === 'type') return filterType(value);
    if (action === 'amenity') return toggleAmenity(actionEl);
    if (action === 'roommates') return filterRoommates(Number(value));
    if (action === 'pref-gender') return filterPrefGender(value);
    if (action === 'smoking') return filterSmoking(value);
    if (action === 'env') return filterEnv(value);
    if (action === 'pets') return filterPets(value);
  });

  document.getElementById('city-filter')?.addEventListener('change', handleCityFilterChange);
  document.getElementById('district-filter')?.addEventListener('change', applyFilters);
  document.getElementById('price-filter')?.addEventListener('input', (event) => updatePriceFilter(event.target.value));
  document.getElementById('search-input')?.addEventListener('input', applyFilters);
}

function renderNoResultsState(container) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'text-align:center;padding:80px 20px;color:var(--light)';

  const icon = document.createElement('div');
  icon.style.cssText = 'font-size:52px;margin-bottom:16px';
  icon.textContent = 'Search';

  const heading = document.createElement('h3');
  heading.style.cssText = "margin-bottom:8px;font-family:'Fraunces',serif";
  heading.textContent = 'No results found';

  const copy = document.createElement('p');
  copy.textContent = 'Try broadening your filters.';

  const action = document.createElement('button');
  action.type = 'button';
  action.style.cssText = 'margin-top:16px;padding:10px 20px;background:var(--teal);color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px';
  action.textContent = 'Clear Filters';
  action.addEventListener('click', resetFilters);

  wrapper.append(icon, heading, copy, action);
  container.appendChild(wrapper);
}

function renderPagination(total, page, limit) {
  const container = document.getElementById('browse-pagination');
  if (!container) return;

  const totalPages = Math.max(1, Math.ceil((total || 0) / Math.max(limit || LISTINGS_PER_PAGE, 1)));
  container.innerHTML = '';

  if (!total || totalPages <= 1) {
    container.hidden = true;
    return;
  }

  container.hidden = false;

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'browse-pagination-btn';
  prevBtn.textContent = 'Previous';
  prevBtn.disabled = page <= 1;
  prevBtn.addEventListener('click', () => {
    if (activeFilters.page <= 1) return;
    activeFilters.page -= 1;
    loadBrowse();
  });

  const info = document.createElement('div');
  info.className = 'browse-pagination-info';
  info.textContent = `Page ${page} of ${totalPages}`;

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'browse-pagination-btn';
  nextBtn.textContent = 'Next';
  nextBtn.disabled = page >= totalPages;
  nextBtn.addEventListener('click', () => {
    if (activeFilters.page >= totalPages) return;
    activeFilters.page += 1;
    loadBrowse();
  });

  container.append(prevBtn, info, nextBtn);
}

document.addEventListener('DOMContentLoaded', () => {
  initBrowseLocationFilters();
  readUrlParams();
  bindBrowseInteractions();
  syncBrowseFiltersForViewport();
  window.addEventListener('resize', syncBrowseFiltersForViewport);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeBrowseFilters();
  });
  loadBrowse();
});

