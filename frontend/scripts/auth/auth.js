/**
 * common-auth.js - Shared auth modal and session helpers.
 */

let pendingSignupEmail = null;
let pendingSignupPayload = null;
let pendingOtpFlow = null;
let authActionBindingsReady = false;
const HOME_PAGE_PATH = '/pages/index.html';

function getLoginFields(modal) {
  const emailInput =
    modal?.querySelector('[data-auth-field="login-email"]') ||
    modal?.querySelector('#login-email') ||
    modal?.querySelector('input[type="email"]');
  const passwordInput =
    modal?.querySelector('[data-auth-field="login-password"]') ||
    modal?.querySelector('#login-password') ||
    modal?.querySelector('input[type="password"]');
  return {
    email: emailInput?.value?.trim(),
    password: passwordInput?.value,
  };
}

function getSignupFields(modal) {
  const fullNameInput =
    modal?.querySelector('[data-auth-field="signup-name"]') ||
    modal?.querySelector('#signup-name') ||
    modal?.querySelector('input[type="text"]');
  const emailInput =
    modal?.querySelector('[data-auth-field="signup-email"]') ||
    modal?.querySelector('#signup-email') ||
    modal?.querySelector('input[type="email"]');
  const passwordInput =
    modal?.querySelector('[data-auth-field="signup-password"]') ||
    modal?.querySelector('#signup-password') ||
    modal?.querySelector('input[type="password"]');
  return {
    fullName: fullNameInput?.value?.trim(),
    email: emailInput?.value?.trim(),
    password: passwordInput?.value,
  };
}

function updateHeaderForAuth(loggedIn, user) {
  const actions = document.querySelector('.header-actions');
  if (!actions) return;

  if (loggedIn && user) {
    actions.innerHTML = `<a href="/pages/profile.html" class="btn-header btn-header-outline" style="text-decoration:none">Profile</a><button class="btn-header btn-header-solid" data-auth-action="logout">Log Out</button>`;
    return;
  }

  actions.innerHTML = `<button class="btn-header btn-header-outline" data-modal-open="login">Log In</button><button class="btn-header btn-header-solid" data-modal-open="signup">Sign Up</button>`;
}

function doLogout() {
  Auth.logout();
  updateHeaderForAuth(false);
  showToast('Logged out');
  setTimeout(() => {
    window.location.href = '/pages/index.html';
  }, 500);
}

function configureVerifyModal({ title, subtitle, buttonLabel }) {
  const titleEl = document.getElementById('verify-title');
  const subtitleEl = document.getElementById('verify-subtitle');
  const button = document.getElementById('verify-btn');
  const otpInput = document.getElementById('otp-input');

  if (titleEl) titleEl.textContent = title || 'Verify your email';
  if (subtitleEl) subtitleEl.textContent = subtitle || '';
  if (button) button.textContent = buttonLabel || 'Verify';
  if (otpInput) otpInput.value = '';
}

function setPendingOtpFlow(flow) {
  pendingOtpFlow = flow;
  configureVerifyModal(flow);
}

function bindAuthModals() {
  if (!authActionBindingsReady) {
    document.addEventListener('click', (event) => {
      const actionEl = event.target.closest('[data-auth-action]');
      if (!actionEl) return;
      const action = actionEl.getAttribute('data-auth-action');
      if (action === 'logout') {
        event.preventDefault();
        doLogout();
      }
    });
    authActionBindingsReady = true;
  }

  document.querySelectorAll('.btn-modal-primary').forEach((button) => {
    const modal = button.closest('.modal-overlay');
    if (!modal) return;
    if (modal.id === 'modal-login') button.onclick = handleLogin;
    if (modal.id === 'modal-signup') button.onclick = handleSignup;
  });

  document.querySelectorAll('#modal-login .btn-modal-secondary').forEach((button) => {
    button.onclick = () => {
      closeModal('login');
      showModal('signup');
    };
  });

  document.querySelectorAll('#modal-signup .btn-modal-secondary').forEach((button) => {
    button.onclick = () => {
      closeModal('signup');
      showModal('login');
    };
  });

  const verifyBtn = document.getElementById('verify-btn');
  if (verifyBtn) verifyBtn.onclick = handleVerifyOtp;

  const forgotLink = document.getElementById('forgot-password-link');
  if (forgotLink) {
    forgotLink.onclick = (event) => {
      event.preventDefault();
      closeModal('login');
      showModal('forgot-password');
    };
  }

  const forgotBtn = document.getElementById('forgot-password-btn');
  if (forgotBtn) forgotBtn.onclick = handleForgotPasswordRequest;

  const resetBtn = document.getElementById('reset-password-btn');
  if (resetBtn) resetBtn.onclick = handleResetPassword;

  const resendBtn = document.getElementById('resend-btn');
  if (resendBtn) {
    resendBtn.onclick = async () => {
      if (!pendingOtpFlow?.resend) return showToast('No pending verification');
      resendBtn.disabled = true;
      resendBtn.textContent = 'Sending...';
      try {
        await pendingOtpFlow.resend();
        showToast('New code sent!');
      } catch (err) {
        showToast(err.message);
      } finally {
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend';
      }
    };
  }
}

function completeAuthFlow(user, type) {
  updateHeaderForAuth(true, user);
  const redirectPath = consumeLoginRedirect();
  if (redirectPath && redirectPath !== getCurrentPath()) {
    window.location.href = redirectPath;
    return true;
  }
  if (![HOME_PAGE_PATH, '/'].includes(window.location.pathname)) {
    window.location.href = HOME_PAGE_PATH;
    return true;
  }
  if (typeof onAuthSuccess === 'function') onAuthSuccess(user, type);
  return false;
}

async function handleLogin(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById('modal-login');
  if (!modal) return;

  const { email, password } = getLoginFields(modal);
  if (!email || !password) return showToast('Please enter your email and password');

  const button = modal.querySelector('.btn-modal-primary');
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Logging in...';
    button.disabled = true;
  }

  try {
    const data = await RoommieAPI.login(email, password);
    closeModal('login');
    if (!completeAuthFlow(data.user, 'login')) {
      showToast(`Welcome back, ${data.user.firstName || data.user.fullName || 'there'}!`);
    }
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function handleSignup(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById('modal-signup');
  if (!modal) return;

  const { fullName, email, password } = getSignupFields(modal);

  if (!fullName) return showToast('Please enter your full name');
  if (!email) return showToast('Please enter your email');
  if (!password) return showToast('Please enter a password');
  if (password.length < 8) return showToast('Password must be at least 8 characters');

  const [firstName, ...rest] = fullName.split(' ');
  const lastName = rest.join(' ');

  const button = modal.querySelector('.btn-modal-primary');
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Sending code...';
    button.disabled = true;
  }

  try {
    await RoommieAPI.sendVerification(email, password, firstName, lastName);
    pendingSignupEmail = email;
    pendingSignupPayload = { password, firstName, lastName };
    setPendingOtpFlow({
      type: 'signup',
      title: 'Verify your email',
      subtitle: `We sent a 6-digit code to ${email}. Enter it below.`,
      buttonLabel: 'Verify & Create Account',
      resend: () => RoommieAPI.sendVerification(
        pendingSignupEmail,
        pendingSignupPayload.password,
        pendingSignupPayload.firstName,
        pendingSignupPayload.lastName
      ),
    });

    closeModal('signup');
    showModal('verify');
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function handleVerifyOtp(event) {
  if (event) event.preventDefault();
  if (!pendingOtpFlow?.type) return showToast('Session expired. Please try again.');

  const otpInput = document.getElementById('otp-input');
  const code = otpInput?.value?.trim();
  if (!code || code.length !== 6) return showToast('Please enter the 6-digit code');

  const button = document.getElementById('verify-btn');
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Verifying...';
    button.disabled = true;
  }

  try {
    if (pendingOtpFlow.type === 'signup') {
      const data = await RoommieAPI.verifyEmail(pendingSignupEmail, code);
      pendingSignupEmail = null;
      pendingSignupPayload = null;
      pendingOtpFlow = null;
      closeModal('verify');

      const signupModal = document.getElementById('modal-signup');
      if (signupModal) signupModal.querySelectorAll('input').forEach((input) => { input.value = ''; });

      if (!completeAuthFlow(data.user, 'register')) showToast('Account created! Welcome to Roommie!');
      return;
    }

    if (pendingOtpFlow.type === 'email-change') {
      const data = await RoommieAPI.confirmEmailChange(pendingOtpFlow.email, code);
      pendingOtpFlow = null;
      closeModal('verify');
      if (typeof window.handleEmailChangeSuccess === 'function') {
        window.handleEmailChangeSuccess(data.user);
      }
      showToast(data.message || 'Email updated successfully');
    }
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function handleForgotPasswordRequest(event) {
  if (event) event.preventDefault();
  const emailInput = document.getElementById('forgot-email');
  const email = emailInput?.value?.trim();
  if (!email) return showToast('Please enter your email');

  const button = document.getElementById('forgot-password-btn');
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Sending...';
    button.disabled = true;
  }

  try {
    const data = await RoommieAPI.requestPasswordReset(email);
    const resetEmail = document.getElementById('reset-email');
    if (resetEmail) resetEmail.value = email;
    closeModal('forgot-password');
    showModal('reset-password');
    showToast(data.message || 'Verification code sent');
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function handleResetPassword(event) {
  if (event) event.preventDefault();
  const email = document.getElementById('reset-email')?.value?.trim();
  const code = document.getElementById('reset-code')?.value?.trim();
  const newPassword = document.getElementById('reset-new-password')?.value || '';
  const confirmPassword = document.getElementById('reset-confirm-password')?.value || '';

  if (!email || !code || !newPassword || !confirmPassword) {
    return showToast('Please fill in all reset password fields');
  }
  if (newPassword.length < 8) return showToast('New password must be at least 8 characters');
  if (newPassword !== confirmPassword) return showToast('Passwords do not match');

  const button = document.getElementById('reset-password-btn');
  const originalText = button?.textContent;
  if (button) {
    button.textContent = 'Resetting...';
    button.disabled = true;
  }

  try {
    const data = await RoommieAPI.resetPassword(email, code, newPassword);
    closeModal('reset-password');
    showModal('login');
    ['reset-code', 'reset-new-password', 'reset-confirm-password'].forEach((id) => {
      const input = document.getElementById(id);
      if (input) input.value = '';
    });
    showToast(data.message || 'Password reset successfully');
  } catch (error) {
    showToast(error.message);
  } finally {
    if (button) {
      button.textContent = originalText;
      button.disabled = false;
    }
  }
}

async function validateStoredSession() {
  if (!Auth.isLoggedIn()) return false;
  try {
    const data = await RoommieAPI.getMe();
    const user = data.user || data;
    if (user) Auth.setUser(user);
    return true;
  } catch {
    Auth.logout();
    return false;
  }
}

window.RoommieCommonAuth = {
  bindAuthModals,
  completeAuthFlow,
  configureVerifyModal,
  doLogout,
  handleForgotPasswordRequest,
  handleLogin,
  handleResetPassword,
  handleSignup,
  handleVerifyOtp,
  setPendingOtpFlow,
  updateHeaderForAuth,
  validateStoredSession,
};

window.bindAuthModals = bindAuthModals;
window.completeAuthFlow = completeAuthFlow;
window.configureVerifyModal = configureVerifyModal;
window.doLogout = doLogout;
window.handleForgotPasswordRequest = handleForgotPasswordRequest;
window.handleLogin = handleLogin;
window.handleResetPassword = handleResetPassword;
window.handleSignup = handleSignup;
window.handleVerifyOtp = handleVerifyOtp;
window.setPendingOtpFlow = setPendingOtpFlow;
window.updateHeaderForAuth = updateHeaderForAuth;
window.validateStoredSession = validateStoredSession;
