/**
 * layout/init.js - Shared page bootstrap.
 */

document.addEventListener('DOMContentLoaded', async () => {
  syncSidebarForViewport();
  window.addEventListener('resize', syncSidebarForViewport);

  const hasValidSession = await validateStoredSession();

  if (document.body.dataset.requiresAuth === 'true' && !hasValidSession) {
    redirectToLoginPage();
    return;
  }

  updateHeaderForAuth(hasValidSession, Auth.getUser());
  bindAuthModals();
  openLoginFromQueryIfNeeded();
});
