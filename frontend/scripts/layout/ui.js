/**
 * layout/ui.js - Shared UI helpers and navigation utilities.
 */

let toastTimer = null;
const LOGIN_REDIRECT_KEY = 'roommie_login_redirect';

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  if (!sidebar) return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    sidebar.classList.toggle('open');
    return;
  }
  sidebar.classList.toggle('collapsed');
  if (main) main.classList.toggle('sidebar-collapsed');
}

function syncSidebarForViewport() {
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('main-content');
  if (!sidebar) return;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  if (isMobile) {
    sidebar.classList.remove('collapsed');
    if (main) main.classList.remove('sidebar-collapsed');
  } else {
    sidebar.classList.remove('open');
  }
}

function showModal(name) {
  const modal = document.getElementById('modal-' + name);
  if (modal) modal.classList.add('open');
}

function closeModal(name) {
  const modal = document.getElementById('modal-' + name);
  if (modal) modal.classList.remove('open');
}

document.addEventListener('click', (event) => {
  const actionEl = event.target.closest('[data-ui-action],[data-modal-open],[data-modal-close],[data-modal-switch-from],[data-navigate]');
  if (actionEl) {
    const navigateTarget = actionEl.getAttribute('data-navigate');
    if (navigateTarget) {
      event.preventDefault();
      window.location.href = navigateTarget;
      return;
    }

    const modalToOpen = actionEl.getAttribute('data-modal-open');
    if (modalToOpen) {
      event.preventDefault();
      showModal(modalToOpen);
      return;
    }

    const modalToClose = actionEl.getAttribute('data-modal-close');
    if (modalToClose) {
      event.preventDefault();
      closeModal(modalToClose);
      return;
    }

    const modalSwitchFrom = actionEl.getAttribute('data-modal-switch-from');
    const modalSwitchTo = actionEl.getAttribute('data-modal-switch-to');
    if (modalSwitchFrom && modalSwitchTo) {
      event.preventDefault();
      closeModal(modalSwitchFrom);
      showModal(modalSwitchTo);
      return;
    }

    const uiAction = actionEl.getAttribute('data-ui-action');
    if (uiAction === 'toggle-sidebar') {
      event.preventDefault();
      toggleSidebar();
      return;
    }
  }

  if (event.target.classList.contains('modal-overlay')) {
    event.target.classList.remove('open');
  }
});

function showPage(name) {
  document.querySelectorAll('.page').forEach((page) => page.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) {
    page.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function getBadgeClass(type) {
  if (type === 'Private') return 'badge-private';
  if (type === 'Shared') return 'badge-shared';
  return 'badge-studio';
}

function formatPriceTRY(price) {
  const amount = Number(price || 0);
  const hasDecimals = Math.abs(amount % 1) > 0.000001;
  return `TL ${amount.toLocaleString('tr-TR', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

function parsePriceInput(value) {
  if (value === undefined || value === null) return NaN;
  const normalized = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(',', '.');

  if (!normalized) return NaN;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return NaN;

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : NaN;
}

function formatPostingDate(dateValue) {
  if (!dateValue) return 'Posted recently';
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Posted recently';
  return `Posted ${date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function getCurrentPath() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function rememberLoginRedirect(path) {
  if (!path) return;
  localStorage.setItem(LOGIN_REDIRECT_KEY, path);
}

function consumeLoginRedirect() {
  const path = localStorage.getItem(LOGIN_REDIRECT_KEY);
  localStorage.removeItem(LOGIN_REDIRECT_KEY);
  return path;
}

function redirectToLoginPage(path = getCurrentPath()) {
  if (window.location.pathname.endsWith('/index.html')) {
    rememberLoginRedirect(path);
    showModal('login');
    return;
  }
  window.location.href = `/pages/index.html?login=1&redirect=${encodeURIComponent(path)}`;
}

function handleProtectedNavigation(targetPath) {
  if (Auth.isLoggedIn()) {
    window.location.href = targetPath;
    return true;
  }
  rememberLoginRedirect(targetPath);
  redirectToLoginPage(targetPath);
  return false;
}

function requirePageAuth() {
  if (document.body.dataset.requiresAuth !== 'true') return true;
  if (Auth.isLoggedIn()) return true;
  redirectToLoginPage();
  return false;
}

function openLoginFromQueryIfNeeded() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('redirect')) rememberLoginRedirect(params.get('redirect'));
  if (params.get('login') === '1' && !Auth.isLoggedIn()) {
    window.history.replaceState({}, '', window.location.pathname);
    setTimeout(() => showModal('login'), 0);
  }
}

function getAvatarDisplay(value) {
  const raw = String(value || '').trim();
  return raw && raw.toLowerCase() !== 'user' ? raw : '\u{1F464}';
}

window.closeModal = closeModal;
window.consumeLoginRedirect = consumeLoginRedirect;
window.escapeAttribute = escapeAttribute;
window.escapeHtml = escapeHtml;
window.formatPostingDate = formatPostingDate;
window.formatPriceTRY = formatPriceTRY;
window.getAvatarDisplay = getAvatarDisplay;
window.getBadgeClass = getBadgeClass;
window.getCurrentPath = getCurrentPath;
window.handleProtectedNavigation = handleProtectedNavigation;
window.openLoginFromQueryIfNeeded = openLoginFromQueryIfNeeded;
window.parsePriceInput = parsePriceInput;
window.redirectToLoginPage = redirectToLoginPage;
window.rememberLoginRedirect = rememberLoginRedirect;
window.requirePageAuth = requirePageAuth;
window.showModal = showModal;
window.showPage = showPage;
window.showToast = showToast;
window.syncSidebarForViewport = syncSidebarForViewport;
window.toggleSidebar = toggleSidebar;
