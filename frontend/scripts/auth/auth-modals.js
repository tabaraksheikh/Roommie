(function injectSharedAuthModals() {
  if (document.getElementById('modal-login')) return;

  const host = document.createElement('div');
  host.id = 'shared-auth-modals';
  host.innerHTML = `
    <div class="modal-overlay" id="modal-login">
      <div class="modal">
        <button class="modal-close" data-modal-close="login" aria-label="Close dialog">&times;</button>
        <h2>Welcome back</h2>
        <p>Log in to your Roommie account</p>
        <div class="form-group"><label class="form-label">Email</label><div class="input-wrap"><input class="form-input no-icon" data-auth-field="login-email" type="email" placeholder="you@email.com"/></div></div>
        <div class="form-group"><label class="form-label">Password</label><div class="input-wrap"><input class="form-input no-icon" data-auth-field="login-password" type="password" placeholder="Enter your password"/></div></div>
        <p style="margin:0 0 16px;text-align:right"><a href="#" id="forgot-password-link" style="color:var(--teal);text-decoration:underline;font-size:13px">Forgot password?</a></p>
        <div class="modal-btns">
          <button class="btn-modal-primary">Log In</button>
          <button class="btn-modal-secondary">Sign Up Instead</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="modal-signup">
      <div class="modal">
        <button class="modal-close" data-modal-close="signup" aria-label="Close dialog">&times;</button>
        <h2>Create account</h2>
        <p>Join and find your perfect room</p>
        <div class="form-group"><label class="form-label">Full Name</label><div class="input-wrap"><input class="form-input no-icon" data-auth-field="signup-name" type="text" placeholder="Your name"/></div></div>
        <div class="form-group"><label class="form-label">Email</label><div class="input-wrap"><input class="form-input no-icon" data-auth-field="signup-email" type="email" placeholder="you@email.com"/></div></div>
        <div class="form-group"><label class="form-label">Password</label><div class="input-wrap"><input class="form-input no-icon" data-auth-field="signup-password" type="password" placeholder="Min. 8 characters"/></div></div>
        <div class="modal-btns">
          <button class="btn-modal-primary">Create Account</button>
          <button class="btn-modal-secondary">Log In Instead</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="modal-verify">
      <div class="modal">
        <button class="modal-close" data-modal-close="verify" aria-label="Close dialog">&times;</button>
        <h2 id="verify-title">Verify your email</h2>
        <p id="verify-subtitle">We sent a 6-digit code to your email address. Enter it below.</p>
        <div class="form-group" style="margin-top:8px">
          <label class="form-label">Verification Code</label>
          <div class="input-wrap">
            <input class="form-input no-icon" id="otp-input" type="text" inputmode="numeric" maxlength="6" placeholder="_ _ _ _ _ _" autocomplete="one-time-code" style="letter-spacing:6px;font-size:22px;text-align:center;font-weight:700"/>
          </div>
        </div>
        <div class="modal-btns">
          <button class="btn-modal-primary" id="verify-btn">Verify</button>
        </div>
        <p style="text-align:center;margin-top:14px;font-size:13px;color:var(--light)">
          Didn't receive the code?
          <button id="resend-btn" style="background:none;border:none;color:var(--teal);cursor:pointer;font-size:13px;padding:0;text-decoration:underline">Resend</button>
        </p>
      </div>
    </div>

    <div class="modal-overlay" id="modal-forgot-password">
      <div class="modal">
        <button class="modal-close" data-modal-close="forgot-password" aria-label="Close dialog">&times;</button>
        <h2>Forgot password</h2>
        <p>Enter your email and we will send you a 6-digit reset code.</p>
        <div class="form-group"><label class="form-label">Email</label><div class="input-wrap"><input class="form-input no-icon" id="forgot-email" type="email" placeholder="you@email.com"/></div></div>
        <div class="modal-btns">
          <button class="btn-modal-primary" id="forgot-password-btn">Send Code</button>
          <button class="btn-modal-secondary" data-modal-close="forgot-password">Cancel</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" id="modal-reset-password">
      <div class="modal">
        <button class="modal-close" data-modal-close="reset-password" aria-label="Close dialog">&times;</button>
        <h2>Reset password</h2>
        <p>Enter the code from your email and choose a new password.</p>
        <div class="form-group"><label class="form-label">Email</label><div class="input-wrap"><input class="form-input no-icon" id="reset-email" type="email" placeholder="you@email.com"/></div></div>
        <div class="form-group"><label class="form-label">Verification Code</label><div class="input-wrap"><input class="form-input no-icon" id="reset-code" type="text" maxlength="6" inputmode="numeric" placeholder="_ _ _ _ _ _"/></div></div>
        <div class="form-group"><label class="form-label">New Password</label><div class="input-wrap"><input class="form-input no-icon" id="reset-new-password" type="password" placeholder="Min. 8 characters"/></div></div>
        <div class="form-group"><label class="form-label">Confirm New Password</label><div class="input-wrap"><input class="form-input no-icon" id="reset-confirm-password" type="password" placeholder="Enter your password again"/></div></div>
        <div class="modal-btns">
          <button class="btn-modal-primary" id="reset-password-btn">Reset Password</button>
          <button class="btn-modal-secondary" data-modal-close="reset-password">Cancel</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(host);
})();
