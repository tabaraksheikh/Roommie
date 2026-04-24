(function injectSharedLayout() {
  const page = document.body?.dataset?.page || '';
  const showHeaderActions = ['home', 'browse', 'poster'].includes(page);
  const navActive = {
    home: 'home',
    browse: 'browse',
    post: 'post',
    profile: 'profile',
    space: 'space',
  }[page] || '';

  const browseLinkVariant = ['poster', 'space'].includes(page)
    ? {
        shared: 'browse.html',
        private: 'browse.html',
      }
    : {
        shared: 'browse.html?type=Shared',
        private: 'browse.html?type=Private',
      };

  const headerHost = document.getElementById('app-header');
  if (headerHost) {
    headerHost.innerHTML = `
      <header class="top-header">
        <button class="header-toggle" data-ui-action="toggle-sidebar">&#9776;</button>
        <span class="header-title" data-navigate="/pages/index.html">Roommie</span>
        ${showHeaderActions ? `
          <div class="header-actions">
            <button class="btn-header btn-header-outline" data-modal-open="login">Log In</button>
            <button class="btn-header btn-header-solid" data-modal-open="signup">Sign Up</button>
          </div>
        ` : ''}
      </header>
    `;
  }

  const sidebarHost = document.getElementById('app-sidebar');
  if (sidebarHost) {
    sidebarHost.innerHTML = `
      <nav class="sidebar" id="sidebar">
        <div class="sidebar-section">
          <div class="sidebar-label">Navigation</div>
          <a class="nav-item ${navActive === 'home' ? 'active' : ''}" href="index.html"><span class="nav-label">Home</span></a>
          <a class="nav-item ${navActive === 'browse' ? 'active' : ''}" href="browse.html"><span class="nav-label">Browse Rooms</span></a>
          <a class="nav-item ${navActive === 'post' ? 'active' : ''}" href="post.html"><span class="nav-label">Post a Room</span></a>
        </div>
        <div class="sidebar-section" style="margin-top:12px">
          <div class="sidebar-label">Account</div>
          <a class="nav-item ${navActive === 'profile' ? 'active' : ''}" href="profile.html"><span class="nav-label">My Profile</span></a>
          <a class="nav-item ${navActive === 'space' ? 'active' : ''}" href="space.html"><span class="nav-label">My Space</span></a>
        </div>
      </nav>
    `;
  }

  const footerHost = document.getElementById('app-footer');
  if (footerHost) {
    footerHost.innerHTML = `
      <footer>
        <div class="footer-grid">
          <div class="footer-brand"><h3>Roommie</h3><p>The easiest way to find rooms and roommates.</p></div>
          <div class="footer-col"><h4>Browse</h4><a href="browse.html">All Listings</a><a href="${browseLinkVariant.shared}">Shared Rooms</a><a href="${browseLinkVariant.private}">Private Rooms</a></div>
          <div class="footer-col"><h4>Account</h4><a href="#" data-modal-open="login">Log In</a><a href="#" data-modal-open="signup">Sign Up</a><a href="profile.html">Profile</a></div>
        </div>
        <div class="footer-bottom">&copy; 2026 Roommie. All rights reserved.</div>
      </footer>
    `;
  }
})();
