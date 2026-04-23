/**
 * profile.js - Profile management.
 */

let pendingProfileEmail = '';

function onAuthSuccess(user) {
  fillProfileForm(user);
}

function getProfileInitials(user) {
  const firstInitial = (user?.firstName || '').trim().charAt(0);
  const lastInitial = (user?.lastName || '').trim().charAt(0);
  const initials = `${firstInitial}${lastInitial}`.toUpperCase();
  return initials || (user?.email || '?').trim().charAt(0).toUpperCase();
}

function fillProfileForm(user) {
  if (!user) return;

  const setValue = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.value = value || '';
  };

  setValue('pf-firstname', user.firstName);
  setValue('pf-lastname', user.lastName);
  setValue('pf-email', user.email);
  setValue('pf-bio', user.bio);

  const avatar = document.getElementById('profile-avatar');
  const name = document.getElementById('profile-display-name');
  const email = document.getElementById('profile-display-email');
  if (avatar) avatar.textContent = getProfileInitials(user);
  if (name) name.textContent = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
  if (email) email.textContent = user.email;

  if (user.gender) {
    document.querySelectorAll('#gender-chips .gender-chip').forEach((chip) => chip.classList.toggle('active', chip.textContent.trim() === user.gender));
  }
}

function selectGender(element) {
  document.querySelectorAll('#gender-chips .gender-chip').forEach((chip) => chip.classList.remove('active'));
  element.classList.add('active');
}

function setPasswordMismatchError(message = '') {
  const errorEl = document.getElementById('pw-confirm-error');
  const confirmInput = document.getElementById('pw-confirm');
  if (errorEl) errorEl.textContent = message;
  if (confirmInput) confirmInput.classList.toggle('input-error', Boolean(message));
}

function openForgotPasswordFromProfile(event) {
  if (event) event.preventDefault();
  const email = Auth.getUser()?.email || document.getElementById('pf-email')?.value || '';
  const forgotEmailInput = document.getElementById('forgot-email');
  if (forgotEmailInput) forgotEmailInput.value = email;
  showModal('forgot-password');
}

function validatePasswordMatch() {
  const newPw = document.getElementById('pw-new')?.value || '';
  const confirmPw = document.getElementById('pw-confirm')?.value || '';
  if (!confirmPw) {
    setPasswordMismatchError('');
    return true;
  }
  if (newPw !== confirmPw) {
    setPasswordMismatchError('Passwords do not match');
    return false;
  }
  setPasswordMismatchError('');
  return true;
}

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const input = document.getElementById(button.dataset.target || '');
      if (!input) return;
      const shouldShow = input.type === 'password';
      input.type = shouldShow ? 'text' : 'password';
      button.textContent = shouldShow ? 'Hide' : 'Show';
      button.setAttribute('aria-label', shouldShow ? 'Hide password' : 'Show password');
    });
  });

  document.getElementById('pw-new')?.addEventListener('input', validatePasswordMatch);
  document.getElementById('pw-confirm')?.addEventListener('input', validatePasswordMatch);
}

async function saveProfileInfo() {
  if (!Auth.isLoggedIn()) return showToast('Please log in first');

  const firstName = document.getElementById('pf-firstname')?.value?.trim();
  const lastName = document.getElementById('pf-lastname')?.value?.trim();
  const email = document.getElementById('pf-email')?.value?.trim().toLowerCase();
  const bio = document.getElementById('pf-bio')?.value?.trim();
  const gender = document.querySelector('#gender-chips .gender-chip.active')?.textContent?.trim() || '';
  const currentUser = Auth.getUser();
  const currentEmail = (currentUser?.email || '').trim().toLowerCase();

  const button = document.querySelector('.btn-save-sm');
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Saving...';
    button.disabled = true;
  }

  try {
    const { user } = await RoommieAPI.updateProfile({ firstName, lastName, bio, gender });
    Auth.setUser(user);
    updateHeaderForAuth(true, user);
    fillProfileForm(user);

    if (email && email !== currentEmail) {
      pendingProfileEmail = email;
      const emailInput = document.getElementById('pf-email');
      if (emailInput) emailInput.value = email;
      await RoommieAPI.requestEmailChange(email);
      setPendingOtpFlow({
        type: 'email-change',
        title: 'Verify your new email',
        subtitle: `We sent a 6-digit code to ${email}. Enter it below to finish updating your profile.`,
        buttonLabel: 'Verify & Update Email',
        email,
        resend: () => RoommieAPI.requestEmailChange(email),
      });
      showModal('verify');
      showToast('Profile saved. Please verify your new email.');
      return;
    }

    showToast('Profile saved');
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

function handleEmailChangeSuccess(user) {
  pendingProfileEmail = '';
  Auth.setUser(user);
  updateHeaderForAuth(true, user);
  fillProfileForm(user);
}

window.handleEmailChangeSuccess = handleEmailChangeSuccess;
window.openForgotPasswordFromProfile = openForgotPasswordFromProfile;

async function updatePassword() {
  if (!Auth.isLoggedIn()) return showToast('Please log in first');

  const currentPw = document.getElementById('pw-current')?.value || '';
  const newPw = document.getElementById('pw-new')?.value || '';
  const confirmPw = document.getElementById('pw-confirm')?.value || '';

  if (!currentPw || !newPw || !confirmPw) return showToast('Please fill in all password fields');
  if (!validatePasswordMatch()) return showToast('New passwords do not match');
  if (newPw.length < 8) return showToast('New password must be at least 8 characters');

  const button = document.querySelectorAll('.btn-save-sm')[1];
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Updating...';
    button.disabled = true;
  }

  try {
    await RoommieAPI.updatePassword(currentPw, newPw);
    showToast('Password updated');
    ['pw-current', 'pw-new', 'pw-confirm'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    setPasswordMismatchError('');
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function deleteAccount() {
  const button = document.querySelector('.btn-danger');
  if (button) button.disabled = true;

  try {
    await RoommieAPI.deleteAccount();
    Auth.logout();
    showToast('Account deleted');
    setTimeout(() => { window.location.href = '/pages/index.html'; }, 1000);
  } catch (error) {
    showToast(error.message);
    if (button) button.disabled = false;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (Auth.isLoggedIn()) fillProfileForm(Auth.getUser());
  initPasswordToggles();
  document.getElementById('confirm-delete-submit')?.addEventListener('click', deleteAccount);
});

window.onAuthSuccess = onAuthSuccess;
window.saveProfileInfo = saveProfileInfo;
window.selectGender = selectGender;
window.updatePassword = updatePassword;

