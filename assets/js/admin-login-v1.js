/**
 * ============================================================
 * APNABITE V1 — ADMIN LOGIN CONTROLLER
 * File: assets/js/admin-login-v1.js
 * Complete file
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    initialized: false,
    requesting: false,
    verifying: false,
    mobile: '',
    otpRequestId: '',
    verificationToken: '',
    resendSeconds: 0,
    resendTimer: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.status =
      byId('admin-login-status');

    elements.statusIcon =
      byId('admin-login-status-icon');

    elements.statusTitle =
      byId('admin-login-status-title');

    elements.statusMessage =
      byId('admin-login-status-message');

    elements.mobileForm =
      byId('admin-login-mobile-form');

    elements.mobile =
      byId('admin-login-mobile');

    elements.mobileError =
      byId('admin-login-mobile-error');

    elements.requestButton =
      byId('admin-login-request-button');

    elements.otpForm =
      byId('admin-login-otp-form');

    elements.otp =
      byId('admin-login-otp');

    elements.otpError =
      byId('admin-login-otp-error');

    elements.testOtp =
      byId('admin-login-test-otp');

    elements.testOtpValue =
      byId('admin-login-test-otp-value');

    elements.verifyButton =
      byId('admin-login-verify-button');

    elements.resendButton =
      byId('admin-login-resend-button');

    elements.changeMobile =
      byId('admin-login-change-mobile');
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeStatus(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function getResponseData(response) {
    if (
      response &&
      response.data &&
      typeof response.data === 'object'
    ) {
      return response.data;
    }

    return {};
  }

  function setText(element, value) {
    if (element) {
      element.textContent =
        cleanText(value);
    }
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden =
        Boolean(hidden);
    }
  }

  function setError(element, message) {
    setText(element, message);
    setHidden(element, !message);
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .showToast === 'function'
    ) {
      window.ApnaBiteUI.showToast(
        message,
        type || 'info'
      );
    }
  }

  function getErrorMessage(
    error,
    fallback
  ) {
    return (
      cleanText(
        error &&
        error.message
      ) ||
      fallback ||
      'Request could not be completed.'
    );
  }

  function handleApiError(error) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .handleApiError === 'function'
    ) {
      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: false
        }
      );
    }
  }

  function setStatus(
    type,
    icon,
    title,
    message
  ) {
    if (elements.status) {
      elements.status.classList.remove(
        'admin-login-status--loading',
        'admin-login-status--success',
        'admin-login-status--error'
      );

      if (type) {
        elements.status.classList.add(
          'admin-login-status--' +
          type
        );
      }
    }

    setText(
      elements.statusIcon,
      icon
    );

    setText(
      elements.statusTitle,
      title
    );

    setText(
      elements.statusMessage,
      message
    );
  }

  function normalizeMobile(value) {
    let mobile =
      String(value || '')
        .replace(/\D/g, '');

    if (
      mobile.length === 12 &&
      mobile.indexOf('91') === 0
    ) {
      mobile =
        mobile.slice(2);
    }

    return mobile.slice(0, 10);
  }

  function isValidMobile(mobile) {
    return /^[6-9]\d{9}$/.test(
      mobile
    );
  }

  function isValidOtp(otp) {
    return /^\d{6}$/.test(
      otp
    );
  }

  function setRequestLoading(loading) {
    state.requesting =
      Boolean(loading);

    if (elements.requestButton) {
      elements.requestButton.disabled =
        state.requesting;

      elements.requestButton.textContent =
        state.requesting
          ? 'SENDING OTP…'
          : 'SEND OTP';
    }

    if (elements.mobile) {
      elements.mobile.disabled =
        state.requesting;
    }
  }

  function setVerifyLoading(loading) {
    state.verifying =
      Boolean(loading);

    if (elements.verifyButton) {
      elements.verifyButton.disabled =
        state.verifying;

      elements.verifyButton.textContent =
        state.verifying
          ? 'VERIFYING…'
          : 'VERIFY & LOGIN';
    }

    if (elements.otp) {
      elements.otp.disabled =
        state.verifying;
    }

    if (elements.changeMobile) {
      elements.changeMobile.disabled =
        state.verifying;
    }

    renderResendButton();
  }

  function clearResendTimer() {
    if (state.resendTimer) {
      window.clearInterval(
        state.resendTimer
      );

      state.resendTimer = null;
    }
  }

  function renderResendButton() {
    if (!elements.resendButton) {
      return;
    }

    if (
      state.requesting ||
      state.verifying
    ) {
      elements.resendButton.disabled =
        true;

      return;
    }

    if (state.resendSeconds > 0) {
      elements.resendButton.disabled =
        true;

      elements.resendButton.textContent =
        'Resend OTP in ' +
        state.resendSeconds +
        's';

      return;
    }

    elements.resendButton.disabled =
      false;

    elements.resendButton.textContent =
      'Resend OTP';
  }

  function startResendTimer(seconds) {
    clearResendTimer();

    state.resendSeconds =
      Math.max(
        1,
        Number(seconds) || 60
      );

    renderResendButton();

    state.resendTimer =
      window.setInterval(
        function() {
          state.resendSeconds -= 1;

          if (
            state.resendSeconds <= 0
          ) {
            state.resendSeconds = 0;
            clearResendTimer();
          }

          renderResendButton();
        },
        1000
      );
  }

  function showOtpStep() {
    setHidden(
      elements.mobileForm,
      true
    );

    setHidden(
      elements.otpForm,
      false
    );

    setStatus(
      'success',
      '✓',
      'OTP sent',
      'Enter the 6-digit OTP sent for Admin login.'
    );

    if (elements.otp) {
      elements.otp.value = '';

      window.setTimeout(
        function() {
          elements.otp.focus();
        },
        50
      );
    }
  }

  function showMobileStep() {
    clearResendTimer();

    state.mobile = '';
    state.otpRequestId = '';
    state.verificationToken = '';
    state.resendSeconds = 0;

    setHidden(
      elements.mobileForm,
      false
    );

    setHidden(
      elements.otpForm,
      true
    );

    setHidden(
      elements.testOtp,
      true
    );

    setError(
      elements.mobileError,
      ''
    );

    setError(
      elements.otpError,
      ''
    );

    setStatus(
      '',
      '🔒',
      'Secure Admin access',
      'Enter your registered Admin mobile number.'
    );

    if (elements.mobile) {
      elements.mobile.disabled = false;
      elements.mobile.focus();
    }
  }

  function extractTestOtp(data) {
    return cleanText(
      data.testOtp ||
      data.otp ||
      (
        data.debug &&
        data.debug.otp
      ) ||
      ''
    );
  }

  function extractOtpRequestId(data) {
    return cleanText(
      data.otpRequestId ||
      data.requestId ||
      data.verificationId ||
      data.challengeId ||
      ''
    );
  }

  function extractVerificationToken(data) {
    return cleanText(
      data.verificationToken ||
      data.token ||
      ''
    );
  }

  async function requestOtp() {
    if (
      state.requesting ||
      state.verifying
    ) {
      return;
    }

    const mobile =
      normalizeMobile(
        elements.mobile &&
        elements.mobile.value
      );

    if (elements.mobile) {
      elements.mobile.value =
        mobile;
    }

    setError(
      elements.mobileError,
      ''
    );

    if (!isValidMobile(mobile)) {
      setError(
        elements.mobileError,
        'Enter a valid 10-digit Indian mobile number.'
      );

      if (elements.mobile) {
        elements.mobile.focus();
      }

      return;
    }

    state.mobile = mobile;

    setRequestLoading(true);

    setStatus(
      'loading',
      '…',
      'Sending OTP',
      'Please wait while we verify the Admin mobile number.'
    );

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'auth.requestOtp',
          {
            mobile:
              mobile,
            role:
              'ADMIN',
            purpose:
              'LOGIN'
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const data =
        getResponseData(response);

      state.otpRequestId =
        extractOtpRequestId(data);

      const testOtp =
        extractTestOtp(data);

      if (testOtp) {
        setText(
          elements.testOtpValue,
          testOtp
        );

        setHidden(
          elements.testOtp,
          false
        );
      } else {
        setHidden(
          elements.testOtp,
          true
        );
      }

      showOtpStep();

      startResendTimer(
        data.resendAfterSeconds ||
        data.resendSeconds ||
        60
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          'OTP could not be sent.'
        );

      setError(
        elements.mobileError,
        message
      );

      setStatus(
        'error',
        '!',
        'OTP could not be sent',
        message
      );

      handleApiError(error);
    } finally {
      setRequestLoading(false);
    }
  }

  async function verifyOtpAndLogin() {
    if (
      state.verifying ||
      state.requesting
    ) {
      return;
    }

    const otp =
      String(
        (
          elements.otp &&
          elements.otp.value
        ) ||
        ''
      ).replace(/\D/g, '');

    setError(
      elements.otpError,
      ''
    );

    if (!isValidOtp(otp)) {
      setError(
        elements.otpError,
        'Enter the complete 6-digit OTP.'
      );

      if (elements.otp) {
        elements.otp.focus();
      }

      return;
    }

    if (!state.mobile) {
      showMobileStep();
      return;
    }

    setVerifyLoading(true);

    setStatus(
      'loading',
      '…',
      'Verifying Admin',
      'Please wait while we securely verify your OTP.'
    );

    try {
      const verifyResponse =
        await window.ApnaBiteAPI.request(
          'auth.verifyOtp',
          {
            mobile:
              state.mobile,
            role:
              'ADMIN',
            purpose:
              'LOGIN',
            otp:
              otp,
            otpRequestId:
              state.otpRequestId,
            requestId:
              state.otpRequestId
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const verificationData =
        getResponseData(
          verifyResponse
        );

      state.verificationToken =
        extractVerificationToken(
          verificationData
        );

      if (!state.verificationToken) {
        throw new Error(
          'OTP verification token was not returned.'
        );
      }

      const loginResponse =
        await window.ApnaBiteAPI.request(
          'auth.login',
          {
            mobile:
              state.mobile,
            role:
              'ADMIN',
            verificationToken:
              state.verificationToken
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const loginData =
        getResponseData(
          loginResponse
        );

      const sessionToken =
        cleanText(
          loginData.sessionToken ||
          loginData.token ||
          (
            loginData.session &&
            loginData.session.sessionToken
          )
        );

      const user =
        loginData.user ||
        (
          loginData.session &&
          loginData.session.user
        ) ||
        null;

      if (
        !sessionToken ||
        !user
      ) {
        throw new Error(
          'Admin session was not returned.'
        );
      }

      if (
        normalizeStatus(
          user.role
        ) !== 'ADMIN'
      ) {
        throw new Error(
          'This account does not have Admin access.'
        );
      }

      if (
        window.ApnaBiteCore &&
        typeof window.ApnaBiteCore
          .saveSession === 'function'
      ) {
        window.ApnaBiteCore.saveSession({
          sessionToken:
            sessionToken,
          user:
            user
        });
      } else {
        throw new Error(
          'Admin session could not be saved.'
        );
      }

      clearResendTimer();

      setStatus(
        'success',
        '✓',
        'Admin verified',
        'Opening the Chef verification queue.'
      );

      showToast(
        'Admin login successful.',
        'success'
      );

      window.setTimeout(
        function() {
          window.location.href =
            'chef-verification.html';
        },
        300
      );
    } catch (error) {
      const message =
        getErrorMessage(
          error,
          'OTP verification failed.'
        );

      setError(
        elements.otpError,
        message
      );

      setStatus(
        'error',
        '!',
        'Admin login failed',
        message
      );

      handleApiError(error);
    } finally {
      setVerifyLoading(false);
    }
  }

  function checkExistingAdminSession() {
    if (
      !window.ApnaBiteCore ||
      typeof window.ApnaBiteCore
        .getStoredSession !==
        'function'
    ) {
      return false;
    }

    const session =
      window.ApnaBiteCore
        .getStoredSession();

    const user =
      session &&
      session.user
        ? session.user
        : null;

    const sessionToken =
      session
        ? cleanText(
            session.sessionToken
          )
        : '';

    if (
      sessionToken &&
      user &&
      normalizeStatus(
        user.role
      ) === 'ADMIN'
    ) {
      window.location.href =
        'chef-verification.html';

      return true;
    }

    return false;
  }

  function bindEvents() {
    if (elements.mobileForm) {
      elements.mobileForm.addEventListener(
        'submit',
        function(event) {
          event.preventDefault();
          requestOtp();
        }
      );
    }

    if (elements.otpForm) {
      elements.otpForm.addEventListener(
        'submit',
        function(event) {
          event.preventDefault();
          verifyOtpAndLogin();
        }
      );
    }

    if (elements.mobile) {
      elements.mobile.addEventListener(
        'input',
        function() {
          elements.mobile.value =
            normalizeMobile(
              elements.mobile.value
            );

          setError(
            elements.mobileError,
            ''
          );
        }
      );
    }

    if (elements.otp) {
      elements.otp.addEventListener(
        'input',
        function() {
          elements.otp.value =
            String(
              elements.otp.value ||
              ''
            )
              .replace(/\D/g, '')
              .slice(0, 6);

          setError(
            elements.otpError,
            ''
          );

          if (
            elements.otp.value
              .length === 6 &&
            !state.verifying
          ) {
            verifyOtpAndLogin();
          }
        }
      );
    }

    if (elements.resendButton) {
      elements.resendButton.addEventListener(
        'click',
        function() {
          if (
            state.resendSeconds <= 0
          ) {
            if (elements.mobile) {
              elements.mobile.value =
                state.mobile;
            }

            requestOtp();
          }
        }
      );
    }

    if (elements.changeMobile) {
      elements.changeMobile.addEventListener(
        'click',
        showMobileStep
      );
    }
  }

  function initialize() {
    if (
      !document.body.classList
        .contains(
          'admin-login-page'
        ) ||
      state.initialized
    ) {
      return;
    }

    getElements();
    bindEvents();

    state.initialized = true;

    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      setStatus(
        'error',
        '!',
        'Application unavailable',
        'Required application files did not load.'
      );

      return;
    }

    if (checkExistingAdminSession()) {
      return;
    }

    showMobileStep();
  }

  window.ApnaBiteAdminLogin =
    Object.freeze({
      initialize:
        initialize,
      requestOtp:
        requestOtp
    });

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }
})(window, document);
