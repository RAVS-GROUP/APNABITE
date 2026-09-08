/**
 * ============================================================
 * APNABITE V1 — CUSTOMER PAYMENT CONTROLLER
 * File: assets/js/customer/payment.js
 * Complete file
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const PENDING_ORDER_KEY = 'apnabite_pending_order';
  const POLL_INTERVAL_MS = 8000;
  const MAX_AUTOMATIC_POLLS = 15;

  const state = {
    initialized: false,
    loading: false,
    submitting: false,
    checking: false,
    paymentLaunched: false,
    orderId: '',
    paymentId: '',
    payment: null,
    pollTimer: null,
    pollCount: 0
  };
  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.refresh = byId('customer-payment-refresh');
    elements.loading = byId('customer-payment-loading');
    elements.error = byId('customer-payment-error');
    elements.errorTitle = byId('customer-payment-error-title');
    elements.errorMessage = byId('customer-payment-error-message');
    elements.retry = byId('customer-payment-retry');
    elements.content = byId('customer-payment-content');
    elements.statusBadge = byId('customer-payment-status-badge');
    elements.orderNumber = byId('customer-payment-order-number');
    elements.amount = byId('customer-payment-amount');
    elements.ready = byId('customer-payment-ready');
    elements.payeeName = byId('customer-payment-payee-name');
    elements.payNow = byId('customer-payment-pay-now');
    elements.completed = byId('customer-payment-completed');
    elements.confirming = byId('customer-payment-confirming');
    elements.checkStatus = byId('customer-payment-check-status');
    elements.success = byId('customer-payment-success');
    elements.trackOrder = byId('customer-payment-track-order');
    elements.rejected = byId('customer-payment-rejected');
    elements.rejectionMessage = byId('customer-payment-rejection-message');
    elements.tryAgain = byId('customer-payment-try-again');
  }

  function requiredElementsAvailable() {
    return [
      'refresh', 'loading', 'error', 'retry', 'content', 'statusBadge',
      'orderNumber', 'amount', 'ready', 'payeeName', 'payNow', 'completed',
      'confirming', 'checkStatus', 'success', 'trackOrder', 'rejected',
      'rejectionMessage', 'tryAgain'
    ].every(function(name) {
      return Boolean(elements[name]);
    });
  }

  function clean(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return clean(value).toUpperCase().replace(/\s+/g, '_');
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function setHidden(element, hidden) {
    if (element) element.hidden = Boolean(hidden);
  }

  function setText(element, value) {
    if (element) element.textContent = clean(value);
  }

  function formatCurrency(value) {
    return '₹' + numberValue(value, 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function getResponseData(response) {
    return response && response.data && typeof response.data === 'object'
      ? response.data
      : {};
  }

  function showToast(message, type) {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.showToast === 'function') {
      window.ApnaBiteUI.showToast(message, type || 'info');
      return;
    }
    console.log(message);
  }

  function handleApiError(error) {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.handleApiError === 'function') {
      window.ApnaBiteUI.handleApiError(error, { redirectToLogin: true });
      return;
    }
    showToast(clean(error && error.message) || 'Something went wrong.', 'error');
  }

  function readPendingOrder() {
    try {
      const parsed = JSON.parse(window.sessionStorage.getItem(PENDING_ORDER_KEY) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function readPageIdentifiers() {
    const parameters = new URLSearchParams(window.location.search);
    const pending = readPendingOrder();
    state.orderId = clean(parameters.get('orderId') || pending.orderId);
    state.paymentId = clean(parameters.get('paymentId') || pending.paymentId);
  }

  function validateLocalSession() {
    if (!window.ApnaBiteCore || !window.ApnaBiteAPI) {
      throw new Error('Required application files did not load.');
    }
    if (typeof window.ApnaBiteCore.requireLocalSession === 'function' &&
      !window.ApnaBiteCore.requireLocalSession(['CUSTOMER'])) {
      return false;
    }
    return true;
  }

  function showLoading() {
    setHidden(elements.loading, false);
    setHidden(elements.error, true);
    setHidden(elements.content, true);
  }

  function showError(title, message) {
    stopPolling();
    setHidden(elements.loading, true);
    setHidden(elements.content, true);
    setHidden(elements.error, false);
    setText(elements.errorTitle, title || 'Payment could not be loaded');
    setText(elements.errorMessage, message || 'Please try again.');
  }

  function setButtonLoading(button, loading, loadingText, normalText) {
    if (!button) return;
    button.disabled = Boolean(loading);
    setText(button, loading ? loadingText : normalText);
  }

  function setStatusBadge(text, type) {
    elements.statusBadge.className = 'customer-payment-badge';
    if (type) elements.statusBadge.classList.add('customer-payment-badge--' + type);
    setText(elements.statusBadge, text);
  }

  function renderPayment() {
    const payment = state.payment || {};
    const status = normalize(payment.paymentStatus);
    setHidden(elements.loading, true);
    setHidden(elements.error, true);
    setHidden(elements.content, false);
    setText(elements.amount, formatCurrency(payment.expectedAmount));
    setText(elements.payeeName, payment.payeeName || 'ApnaBite');
    setText(elements.orderNumber, 'Order ' + clean(payment.orderId || state.orderId).slice(-12));

    setHidden(elements.ready, true);
    setHidden(elements.confirming, true);
    setHidden(elements.success, true);
    setHidden(elements.rejected, true);

    if (status === 'CONFIRMED') {
      setStatusBadge('PAYMENT RECEIVED', 'success');
      setHidden(elements.success, false);
      stopPolling();
      return;
    }

    if (status === 'PENDING_VERIFICATION') {
      setStatusBadge('CONFIRMING PAYMENT', 'pending');
      setHidden(elements.confirming, false);
      startPolling();
      return;
    }

    if (status === 'REJECTED' || status === 'FAILED') {
      setStatusBadge('PAYMENT NOT CONFIRMED', 'rejected');
      setText(
        elements.rejectionMessage,
        payment.rejectionReason || 'Please try the payment again.'
      );
      setHidden(elements.rejected, false);
      stopPolling();
      return;
    }

    setStatusBadge('PAYMENT READY', '');
    setHidden(elements.ready, false);
    elements.payNow.disabled = !clean(payment.paymentIntentUrl);
    elements.completed.disabled = false;
    stopPolling();
  }

  async function fetchPayment(silent) {
    if (state.checking) return null;
    state.checking = true;
    if (!silent) elements.refresh.disabled = true;
    try {
      const response = await window.ApnaBiteAPI.request('payment.get', {
        paymentId: state.paymentId,
        orderId: state.orderId
      }, {
        retry: false,
        deduplicate: true,
        timeoutMs: 15000
      });
      const payment = getResponseData(response);
      if (!clean(payment.paymentId)) {
        throw new Error('Payment details were not returned.');
      }
      state.payment = payment;
      state.paymentId = clean(payment.paymentId);
      state.orderId = clean(payment.orderId || state.orderId);
      renderPayment();
      return payment;
    } catch (error) {
      if (!silent) {
        showError('Payment could not be loaded', clean(error && error.message) || 'Please try again.');
        handleApiError(error);
      }
      return null;
    } finally {
      state.checking = false;
      elements.refresh.disabled = false;
    }
  }

  function openPaymentApp() {
    const paymentIntentUrl = clean(state.payment && state.payment.paymentIntentUrl);
    if (!paymentIntentUrl) {
      showToast('Payment app could not be opened. Tap Refresh and try again.', 'error');
      return;
    }
    state.paymentLaunched = true;
    window.location.href = paymentIntentUrl;
  }

  async function declareCompleted() {
    if (state.submitting || !state.paymentId) return;
    state.submitting = true;
    setButtonLoading(elements.completed, true, 'SUBMITTING…', 'I’VE COMPLETED PAYMENT');
    try {
      const response = await window.ApnaBiteAPI.request('payment.completed', {
        paymentId: state.paymentId
      }, {
        retry: false,
        deduplicate: false,
        timeoutMs: 20000
      });
      const result = getResponseData(response);
      state.payment.paymentStatus = result.paymentStatus || 'PENDING_VERIFICATION';
      state.payment.message = result.message || 'Payment is being confirmed.';
      renderPayment();
      showToast('Payment submitted for confirmation.', 'success');
    } catch (error) {
      handleApiError(error);
    } finally {
      state.submitting = false;
      setButtonLoading(elements.completed, false, 'SUBMITTING…', 'I’VE COMPLETED PAYMENT');
    }
  }

  async function createRetryPayment() {
    if (state.submitting || !state.orderId) return;
    state.submitting = true;
    setButtonLoading(elements.tryAgain, true, 'PREPARING…', 'TRY AGAIN');
    try {
      const response = await window.ApnaBiteAPI.request('payment.create', {
        orderId: state.orderId,
        paymentMethod: 'ONLINE',
        idempotencyKey: 'RETRY_' + state.orderId + '_' + Date.now()
      }, {
        retry: false,
        deduplicate: false,
        timeoutMs: 20000
      });
      const payment = getResponseData(response);
      if (!clean(payment.paymentId)) throw new Error('New payment could not be created.');
      state.payment = payment;
      state.paymentId = clean(payment.paymentId);
      window.history.replaceState({}, '', 'payment.html?orderId=' +
        encodeURIComponent(state.orderId) + '&paymentId=' + encodeURIComponent(state.paymentId));
      renderPayment();
    } catch (error) {
      handleApiError(error);
    } finally {
      state.submitting = false;
      setButtonLoading(elements.tryAgain, false, 'PREPARING…', 'TRY AGAIN');
    }
  }

  function trackOrder() {
    if (!state.orderId) return;
    window.location.href = 'order-tracking.html?orderId=' + encodeURIComponent(state.orderId);
  }

  function stopPolling() {
    window.clearTimeout(state.pollTimer);
    state.pollTimer = null;
  }

  function startPolling() {
    stopPolling();
    if (state.pollCount >= MAX_AUTOMATIC_POLLS || document.visibilityState !== 'visible') return;
    state.pollTimer = window.setTimeout(async function() {
      state.pollTimer = null;
      state.pollCount += 1;
      const payment = await fetchPayment(true);
      if (payment && normalize(payment.paymentStatus) === 'PENDING_VERIFICATION') {
        startPolling();
      }
    }, POLL_INTERVAL_MS);
  }

  function bindEvents() {
    elements.refresh.addEventListener('click', function() { fetchPayment(false); });
    elements.retry.addEventListener('click', initializePayment);
    elements.payNow.addEventListener('click', openPaymentApp);
    elements.completed.addEventListener('click', declareCompleted);
    elements.checkStatus.addEventListener('click', function() { fetchPayment(false); });
    elements.trackOrder.addEventListener('click', trackOrder);
    elements.tryAgain.addEventListener('click', createRetryPayment);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible' && state.paymentId) {
        if (state.paymentLaunched) state.paymentLaunched = false;
        fetchPayment(true);
      } else {
        stopPolling();
      }
    });
    window.addEventListener('pageshow', function(event) {
      if (event.persisted && state.paymentId) fetchPayment(true);
    });
    window.addEventListener('pagehide', stopPolling);
  }

  async function initializePayment() {
    if (state.loading) return;
    state.loading = true;
    showLoading();
    try {
      if (!validateLocalSession()) return;
      readPageIdentifiers();
      if (!state.paymentId && !state.orderId) {
        throw new Error('Payment link is incomplete. Open the order again from My Orders.');
      }
      const payment = await fetchPayment(true);
      if (!payment) {
        showError('Payment could not be loaded', 'Please check your connection and try again.');
      }
    } catch (error) {
      showError('Payment could not be loaded', clean(error && error.message) || 'Please try again.');
    } finally {
      state.loading = false;
    }
  }

  function initialize() {
    if (state.initialized || !document.body.classList.contains('customer-payment-page')) return;
    collectElements();
    if (!requiredElementsAvailable()) {
      console.error('Customer payment page elements are incomplete.');
      return;
    }
    state.initialized = true;
    bindEvents();
    initializePayment();
  }

  window.ApnaBiteCustomerPayment = Object.freeze({
    refresh: function() { return fetchPayment(false); },
    getPayment: function() {
      return state.payment ? JSON.parse(JSON.stringify(state.payment)) : null;
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(window, document);
