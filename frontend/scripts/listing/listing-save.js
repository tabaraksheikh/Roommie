/**
 * common-listing-save.js - Shared saved-listing actions.
 */

function setSaveButtonState(button, saved) {
  if (!button) return;
  const label = saved ? 'Saved' : 'Save Listing';
  button.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"></path></svg>${label}`;
}

async function refreshSaveButton(listingId, button) {
  if (!listingId || !Auth.isLoggedIn()) return;
  try {
    const { saved } = await RoommieAPI.checkSaved(listingId);
    setSaveButtonState(button, saved);
  } catch {}
}

async function handleSaveListing(listingId, button) {
  if (!Auth.isLoggedIn()) {
    showToast('Please log in to save listings');
    showModal('login');
    return;
  }

  try {
    const { saved } = await RoommieAPI.checkSaved(listingId);
    if (saved) {
      await RoommieAPI.unsaveListing(listingId);
      showToast('Removed from saved');
    } else {
      await RoommieAPI.saveListing(listingId);
      showToast('Listing saved');
    }
    refreshSaveButton(listingId, button);
  } catch (error) {
    showToast(error.message);
  }
}

window.handleSaveListing = handleSaveListing;
window.refreshSaveButton = refreshSaveButton;
window.setSaveButtonState = setSaveButtonState;
