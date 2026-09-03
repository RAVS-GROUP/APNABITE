/**
 * ============================================================
 * APNABITE V1 — FRONTEND AUTHENTICATION
 * File: assets/js/auth.js
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    loginOtpRequested: false,
    registerOtpRequested: false,
    loginMobile: '',
    loginRole: '',
    registerMobile: '',
    registerRole: '',
    countdownTimer: null
  };

  function normalizeMobile(value) {
    let digits = String(value || '')
      .replace(/\D/g, '');

    if (
      digits.length === 12 &&
      digits.indexOf('91') === 0
    ) {
      digits = digits.substring(2);
    }

    if (
      digits.length === 11 &&
      digits.charAt(0) === '0'
    ) {
      digits = digits.substring(1);
    }

    return digits;
  }

  function isValidMobile(mobile) {
    return /^[6-9]\d{9}$/.test(
      normalizeMobile(mobile)
    );
  }

  function getValue(id) {
    const element =
      document.getElementById(id);

    return element
      ? element.value.trim()
      : '';
  }

  function getChecked(id) {
    const element =
      document.getElementById(id);

    return Boolean(
      element && element.checked
    );
  }

  function setText(id, value) {
    const element =
      document.getElementById(id);

    if (element) {
      element.textContent =
        value || '';
    }
  }

  function showElement(id) {
    const element =
      document.getElementById(id);

    if (element) {
      element.hidden = false;
    }
  }

  function hideElement(id) {
    const element =
      document.getElementById(id);

    if (element) {
      element.hidden = true;
    }
  }

  function setFieldError(
    fieldId,
    message
  ) {
    const field =
      document.getElementById(fieldId);

    const error =
      document.getElementById(
        fieldId + '-error'
      );

    if (field) {
      field.classList.toggle(
        'form-input--error',
        Boolean(message)
      );

      field.setAttribute(
        'aria-invalid',
        message ? 'true' : 'false'
      );
    }

    if (error) {
      error.textContent = message || '';
      error.hidden = !message;
    }
  }

  function clearFormErrors(form) {
    if (!form) return;

    form.querySelectorAll(
      '.form-input--error'
    ).forEach(function(field) {
      field.classList.remove(
        'form-input--error'
      );

      field.setAttribute(
        'aria-invalid',
        'false'
      );
    });

    form.querySelectorAll(
      '.form-error'
    ).forEach(function(error) {
      error.textContent = '';
      error.hidden = true;
    });
  }

  function validateRole(role) {
    return [
      'CUSTOMER',
      'CHEF',
      'RIDER'
    ].includes(
      String(role || '').toUpperCase()
    );
  }

  function startCountdown(
    button,
    seconds
  ) {
    if (!button) return;

    window.clearInterval(
      state.countdownTimer
    );

    let remaining =
      Number(seconds || 300);

    button.disabled = true;

    function updateButton() {
      const minutes = Math.floor(
        remaining / 60
      );

      const secondsPart = String(
        remaining % 60
      ).padStart(2, '0');

      button.textContent =
        'RESEND IN ' +
        minutes +
        ':' +
        secondsPart;

      if (remaining <= 0) {
        window.clearInterval(
          state.countdownTimer
        );

        button.disabled = false;
        button.textContent =
          'RESEND OTP';

        return;
      }

      remaining -= 1;
    }

    updateButton();

    state.countdownTimer =
      window.setInterval(
        updateButton,
        1000
      );
  }

  async function requestLoginOtp(
    button
  ) {
    const mobile = normalizeMobile(
      getValue('login-mobile')
    );

    const role = getValue(
      'login-role'
    ).toUpperCase();

    setFieldError(
      'login-mobile',
      ''
    );

    setFieldError(
      'login-role',
      ''
    );

    if (!isValidMobile(mobile)) {
      setFieldError(
        'login-mobile',
        'Enter a valid 10-digit mobile number.'
      );

      return;
    }

    if (!validateRole(role)) {
      setFieldError(
        'login-role',
        'Select your account role.'
      );

      return;
    }

    window.ApnaBiteUI.setButtonLoading(
      button,
      true,
      'SENDING OTP…'
    );

    try {
      const response =
        await window.ApnaBiteAPI.requestOtp({
          mobile: mobile,
          role: role,
          purpose: 'LOGIN'
        });

      state.loginOtpRequested = true;
      state.loginMobile = mobile;
      state.loginRole = role;

      showElement('login-otp-group');

      const otpInput =
        document.getElementById(
          'login-otp'
        );

      if (otpInput) {
        otpInput.focus();
      }

      if (
        response.data &&
        response.data.testOtp
      ) {
        setText(
          'login-otp-help',
          'Testing OTP: ' +
          response.data.testOtp
        );
      } else {
        setText(
          'login-otp-help',
          'OTP sent to your mobile number.'
        );
      }

      window.ApnaBiteUI.showToast(
        'OTP sent successfully.',
        'success'
      );

      window.ApnaBiteUI.setButtonLoading(
        button,
        false
      );

      startCountdown(
        button,
        response.data.resendAfterSeconds
      );
    } catch (error) {
      window.ApnaBiteUI.setButtonLoading(
        button,
        false
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: false
        }
      );
    }
  }

  async function submitLogin(
    form,
    submitButton
  ) {
    clearFormErrors(form);

    const mobile = normalizeMobile(
      getValue('login-mobile')
    );

    const role = getValue(
      'login-role'
    ).toUpperCase();

    const otp = getValue(
      'login-otp'
    );

    if (!isValidMobile(mobile)) {
      setFieldError(
        'login-mobile',
        'Enter a valid 10-digit mobile number.'
      );

      return;
    }

    if (!validateRole(role)) {
      setFieldError(
        'login-role',
        'Select your account role.'
      );

      return;
    }

    if (
      !state.loginOtpRequested ||
      mobile !== state.loginMobile ||
      role !== state.loginRole
    ) {
      window.ApnaBiteUI.showToast(
        'Request a new OTP for these details.',
        'warning'
      );

      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setFieldError(
        'login-otp',
        'Enter the 6-digit OTP.'
      );

      return;
    }

    window.ApnaBiteUI.setButtonLoading(
      submitButton,
      true,
      'LOGGING IN…'
    );

    try {
      const verification =
        await window.ApnaBiteAPI.verifyOtp({
          mobile: mobile,
          role: role,
          purpose: 'LOGIN',
          otp: otp
        });

      const loginResponse =
        await window.ApnaBiteAPI.login({
          mobile: mobile,
          role: role,
          verificationToken:
            verification.data.verificationToken
        });

      const session =
        loginResponse.data.session;

      window.ApnaBiteCore.saveSession(
        session
      );

      window.ApnaBiteUI.showToast(
        'Login successful.',
        'success'
      );

      window.setTimeout(function() {
        window.ApnaBiteCore.redirectToRoleHome(
          loginResponse.data.user.role,
          true
        );
      }, 300);
    } catch (error) {
      window.ApnaBiteUI.setButtonLoading(
        submitButton,
        false
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: false
        }
      );
    }
  }

  async function requestRegisterOtp(
    button
  ) {
    const mobile = normalizeMobile(
      getValue('register-mobile')
    );

    const role = getValue(
      'register-role'
    ).toUpperCase();

    setFieldError(
      'register-mobile',
      ''
    );

    setFieldError(
      'register-role',
      ''
    );

    if (!isValidMobile(mobile)) {
      setFieldError(
        'register-mobile',
        'Enter a valid 10-digit mobile number.'
      );

      return;
    }

    if (!validateRole(role)) {
      setFieldError(
        'register-role',
        'Select an account role.'
      );

      return;
    }

    window.ApnaBiteUI.setButtonLoading(
      button,
      true,
      'SENDING OTP…'
    );

    try {
      const response =
        await window.ApnaBiteAPI.requestOtp({
          mobile: mobile,
          role: role,
          purpose: 'REGISTER'
        });

      state.registerOtpRequested = true;
      state.registerMobile = mobile;
      state.registerRole = role;

      showElement(
        'register-otp-group'
      );

      const otpInput =
        document.getElementById(
          'register-otp'
        );

      if (otpInput) {
        otpInput.focus();
      }

      if (
        response.data &&
        response.data.testOtp
      ) {
        setText(
          'register-otp-help',
          'Testing OTP: ' +
          response.data.testOtp
        );
      } else {
        setText(
          'register-otp-help',
          'OTP sent to your mobile number.'
        );
      }

      window.ApnaBiteUI.showToast(
        'OTP sent successfully.',
        'success'
      );

      window.ApnaBiteUI.setButtonLoading(
        button,
        false
      );

      startCountdown(
        button,
        response.data.resendAfterSeconds
      );
    } catch (error) {
      window.ApnaBiteUI.setButtonLoading(
        button,
        false
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: false
        }
      );
    }
  }

  async function submitRegistration(
    form,
    submitButton
  ) {
    clearFormErrors(form);

    const fullName = getValue(
      'register-name'
    );

    const mobile = normalizeMobile(
      getValue('register-mobile')
    );

    const email = getValue(
      'register-email'
    );

    const role = getValue(
      'register-role'
    ).toUpperCase();

    const otp = getValue(
      'register-otp'
    );

    const referralCode = getValue(
      'register-referral'
    );

    const consentAccepted =
      getChecked('register-consent');

    let valid = true;

    if (fullName.length < 2) {
      setFieldError(
        'register-name',
        'Enter your full name.'
      );

      valid = false;
    }

    if (!isValidMobile(mobile)) {
      setFieldError(
        'register-mobile',
        'Enter a valid 10-digit mobile number.'
      );

      valid = false;
    }

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setFieldError(
        'register-email',
        'Enter a valid email address.'
      );

      valid = false;
    }

    if (!validateRole(role)) {
      setFieldError(
        'register-role',
        'Select an account role.'
      );

      valid = false;
    }

    if (!/^\d{6}$/.test(otp)) {
      setFieldError(
        'register-otp',
        'Enter the 6-digit OTP.'
      );

      valid = false;
    }

    if (!consentAccepted) {
      setFieldError(
        'register-consent',
        'Consent is required to continue.'
      );

      valid = false;
    }

    if (!valid) return;

    if (
      !state.registerOtpRequested ||
      mobile !== state.registerMobile ||
      role !== state.registerRole
    ) {
      window.ApnaBiteUI.showToast(
        'Request a new OTP for these details.',
        'warning'
      );

      return;
    }

    window.ApnaBiteUI.setButtonLoading(
      submitButton,
      true,
      'CREATING ACCOUNT…'
    );

    try {
      const verification =
        await window.ApnaBiteAPI.verifyOtp({
          mobile: mobile,
          role: role,
          purpose: 'REGISTER',
          otp: otp
        });

      const registration =
        await window.ApnaBiteAPI.register({
          fullName: fullName,
          mobile: mobile,
          email: email,
          role: role,
          referralCode: referralCode,
          verificationToken:
            verification.data.verificationToken,
          consentAccepted: true,
          consentType:
            'MANDATORY_SERVICE_CONSENT',
          consentVersion: '1.0',
          termsVersion: '1.0',
          privacyVersion: '1.0',
          preferredLanguage: 'EN'
        });

      window.ApnaBiteCore.saveSession(
        registration.data.session
      );

      window.ApnaBiteUI.showToast(
        'Account created successfully.',
        'success'
      );

      window.setTimeout(function() {
        window.ApnaBiteCore.redirectToRoleHome(
          registration.data.user.role,
          true
        );
      }, 300);
    } catch (error) {
      window.ApnaBiteUI.setButtonLoading(
        submitButton,
        false
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: false
        }
      );
    }
  }

  function watchOtpIdentityChanges(
    mobileId,
    roleId,
    statePrefix,
    otpGroupId
  ) {
    const mobile =
      document.getElementById(mobileId);

    const role =
      document.getElementById(roleId);

    function resetOtp() {
      if (statePrefix === 'login') {
        state.loginOtpRequested = false;
      } else {
        state.registerOtpRequested = false;
      }

      hideElement(otpGroupId);
    }

    if (mobile) {
      mobile.addEventListener(
        'input',
        resetOtp
      );
    }

    if (role) {
      role.addEventListener(
        'change',
        resetOtp
      );
    }
  }

  function initializeLoginForm() {
    const form =
      document.getElementById(
        'login-form'
      );

    if (!form) return;

    const otpButton =
      document.getElementById(
        'login-request-otp'
      );

    const submitButton =
      document.getElementById(
        'login-submit'
      );

    hideElement('login-otp-group');

    if (otpButton) {
      otpButton.addEventListener(
        'click',
        function() {
          requestLoginOtp(otpButton);
        }
      );
    }

    form.addEventListener(
      'submit',
      function(event) {
        event.preventDefault();

        submitLogin(
          form,
          submitButton
        );
      }
    );

    watchOtpIdentityChanges(
      'login-mobile',
      'login-role',
      'login',
      'login-otp-group'
    );
  }

  function initializeRegisterForm() {
    const form =
      document.getElementById(
        'register-form'
      );

    if (!form) return;

    const otpButton =
      document.getElementById(
        'register-request-otp'
      );

    const submitButton =
      document.getElementById(
        'register-submit'
      );

    hideElement(
      'register-otp-group'
    );

    if (otpButton) {
      otpButton.addEventListener(
        'click',
        function() {
          requestRegisterOtp(
            otpButton
          );
        }
      );
    }

    form.addEventListener(
      'submit',
      function(event) {
        event.preventDefault();

        submitRegistration(
          form,
          submitButton
        );
      }
    );

    watchOtpIdentityChanges(
      'register-mobile',
      'register-role',
      'register',
      'register-otp-group'
    );
  }

  function redirectAuthenticatedUser() {
    if (
      window.ApnaBiteCore.isAuthenticated()
    ) {
      window.ApnaBiteCore.redirectToRoleHome(
        window.ApnaBiteCore.getCurrentRole(),
        true
      );

      return true;
    }

    return false;
  }

  function initialize() {
    if (redirectAuthenticatedUser()) {
      return;
    }

    initializeLoginForm();
    initializeRegisterForm();
  }

  window.ApnaBiteAuth = Object.freeze({
    initialize: initialize,
    requestLoginOtp:
      requestLoginOtp,
    requestRegisterOtp:
      requestRegisterOtp,
    submitLogin: submitLogin,
    submitRegistration:
      submitRegistration
  });

  window.ApnaBiteCore.ready(
    initialize
  );
})(window, document);
