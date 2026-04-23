/**
 * poster.js - Poster profile page.
 */

async function loadPosterPage() {
  const params = new URLSearchParams(window.location.search);
  const userId = params.get('userId');

  if (!userId) {
    document.querySelector('.poster-profile-wrap').innerHTML = `
      <div style="text-align:center;padding:80px;color:var(--light)">
        <div style="font-size:48px;margin-bottom:16px">User</div>
        <p>User not found.</p>
        <br><a href="/pages/browse.html" style="color:var(--teal)">Back to listings</a>
      </div>`;
    return;
  }

  try {
    const { user, listings } = await RoommieAPI.getUser(userId);
    renderPosterProfile(user, listings, {
      emptyBio: 'This user has not added a bio yet.',
      emptyListingsMessage: 'This user has no listings.',
      detailSource: 'poster',
    });
  } catch (error) {
    console.error('Poster load error:', error.message);
    showToast('Could not load profile');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadPosterPage();
});

