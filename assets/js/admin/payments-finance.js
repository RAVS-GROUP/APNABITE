/**
 * ============================================================
 * APNABITE V1 — ADMIN PAYMENTS & FINANCE CONTROLLER
 * File: assets/js/admin/payments-finance.js
 * Complete file
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    initialized: false,
    loading: false,
    submitting: false,
    environment: 'PRODUCTION',
    payments: [],
    selectedPayment: null,
    search: '',
    limit: 20
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.refresh =
      byId('admin-payments-refresh');

    elements.developmentBanner =
      byId(
        'admin-payments-development-banner'
      );

    elements.pendingCount =
      byId(
        'admin-payments-pending-count'
      );

    elements.pendingAmount =
      byId(
        'admin-payments-pending-amount'
      );

    elements.oldestAge =
      byId(
        'admin-payments-oldest-age'
      );

    elements.search =
      byId('admin-payments-search');

    elements.limit =
      byId('admin-payments-limit');

    elements.loading =
      byId('admin-payments-loading');

    elements.error =
      byId('admin-payments-error');

    elements.errorTitle =
      byId(
        'admin-payments-error-title'
      );

    elements.errorMessage =
      byId(
        'admin-payments-error-message'
      );

    elements.retry =
      byId('admin-payments-retry');

    elements.empty =
      byId('admin-payments-empty');

    elements.content =
      byId('admin-payments-content');

    elements.resultCount =
      byId(
        'admin-payments-result-count'
      );

    elements.list =
      byId('admin-payments-list');

    elements.cardTemplate =
      byId(
        'admin-payment-card-template'
      );

    elements.modal =
      byId('admin-payment-modal');

    elements.modalClose =
      byId(
        'admin-payment-modal-close'
      );

    elements.detailPaymentId =
      byId(
        'admin-payment-detail-payment-id'
      );

    elements.detailOrderId =
      byId(
        'admin-payment-detail-order-id'
      );

    elements.detailCustomerId =
      byId(
        'admin-payment-detail-customer-id'
      );

    elements.detailAmount =
      byId(
        'admin-payment-detail-amount'
      );

    elements.detailDeclaredAt =
      byId(
        'admin-payment-detail-declared-at'
      );

    elements.detailWaitingTime =
      byId(
        'admin-payment-detail-waiting-time'
      );

    elements.testNote =
      byId('admin-payment-test-note');

    elements.confirmedAmount =
      byId(
        'admin-payment-confirmed-amount'
      );

    elements.providerReference =
      byId(
        'admin-payment-provider-reference'
      );

    elements.confirmCheckbox =
      byId(
        'admin-payment-confirm-checkbox'
      );

    elements.confirmText =
      byId(
        'admin-payment-confirm-text'
      );

    elements.modalError =
      byId(
        'admin-payment-modal-error'
      );

    elements.rejectButton =
      byId(
        'admin-payment-reject-button'
      );

    elements.verifyButton =
      byId(
        'admin-payment-verify-button'
      );

    elements.rejectModal =
      byId(
        'admin-payment-reject-modal'
      );

    elements.rejectClose =
      byId(
        'admin-payment-reject-close'
      );

    elements.rejectionReason =
      byId(
        'admin-payment-rejection-reason'
      );

    elements.rejectError =
      byId(
        'admin-payment-reject-error'
      );

    elements.rejectCancel =
      byId(
        'admin-payment-reject-cancel'
      );

    elements.rejectConfirm =
      byId(
        'admin-payment-reject-confirm'
      );
  }

  function requiredElementsAvailable() {
    return [
      'refresh',
      'pendingCount',
      'pendingAmount',
      'oldestAge',
      'search',
      'limit',
      'loading',
      'error',
      'retry',
      'empty',
      'content',
      'resultCount',
      'list',
      'cardTemplate',
      'modal',
      'modalClose',
      'confirmedAmount',
      'providerReference',
      'confirmCheckbox',
      'modalError',
      'rejectButton',
      'verifyButton',
      'rejectModal',
      'rejectClose',
      'rejectionReason',
      'rejectError',
      'rejectCancel',
      'rejectConfirm'
    ].every(function(name) {
      return Boolean(elements[name]);
    });
  }

  function clean(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return clean(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden =
        Boolean(hidden);
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent =
        clean(value);
    }
  }

  function formatCurrency(value) {
    return '₹' +
      numberValue(value, 0)
        .toLocaleString('en-IN', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        });
  }

  function formatDate(value) {
    const date =
      new Date(value);

    if (
      !Number.isFinite(
        date.getTime()
      )
    ) {
      return '—';
    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    );
  }

  function ageText(value) {
    const date =
      new Date(value);

    if (
      !Number.isFinite(
        date.getTime()
      )
    ) {
      return '—';
    }

    const seconds =
      Math.max(
        0,
        Math.floor(
          (
            Date.now() -
            date.getTime()
          ) /
          1000
        )
      );

    if (seconds < 60) {
      return 'Just now';
    }

    const minutes =
      Math.floor(
        seconds / 60
      );

    if (minutes < 60) {
      return minutes + ' min';
    }

    const hours =
      Math.floor(
        minutes / 60
      );

    if (hours < 24) {
      return (
        hours +
        ' hr ' +
        (minutes % 60) +
        ' min'
      );
    }

    return (
      Math.floor(
        hours / 24
      ) +
      ' day'
    );
  }

  function responseData(response) {
    return (
      response &&
      response.data !== undefined
    )
      ? response.data
      : null;
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
    } else {
      console.log(message);
    }
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
          redirectToLogin: true
        }
      );
    } else {
      showToast(
        clean(
          error &&
          error.message
        ) ||
        'Something went wrong.',
        'error'
      );
    }
  }

  function isDevelopment() {
    return (
      normalize(
        state.environment
      ) ===
      'DEVELOPMENT'
    );
  }

  function validateAdminSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      throw new Error(
        'Required application files did not load.'
      );
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession ===
        'function' &&
      !window.ApnaBiteCore
        .requireLocalSession([
          'ADMIN'
        ])
    ) {
      return false;
    }

    const user =
      typeof window.ApnaBiteCore
        .getSessionUser ===
        'function'
        ? window.ApnaBiteCore
            .getSessionUser()
        : null;

    if (
      user &&
      normalize(
        user.role ||
        user.Role
      ) !== 'ADMIN'
    ) {
      if (
        typeof window.ApnaBiteCore
          .redirectToRoleHome ===
          'function'
      ) {
        window.ApnaBiteCore
          .redirectToRoleHome(
            user.role ||
            user.Role ||
            '',
            true
          );
      }

      return false;
    }

    return true;
  }

  async function loadEnvironment() {
    try {
      const response =
        await window.ApnaBiteAPI
          .getPublicConfig();

      const config =
        responseData(response) ||
        {};

      state.environment =
        normalize(
          config.environment
        ) ||
        'PRODUCTION';
    } catch (error) {
      state.environment =
        'PRODUCTION';
    }

    setHidden(
      elements.developmentBanner,
      !isDevelopment()
    );
  }

  function showLoading() {
    setHidden(
      elements.loading,
      false
    );

    setHidden(
      elements.error,
      true
    );

    setHidden(
      elements.empty,
      true
    );

    setHidden(
      elements.content,
      true
    );
  }

  function showError(title, message) {
    setHidden(
      elements.loading,
      true
    );

    setHidden(
      elements.empty,
      true
    );

    setHidden(
      elements.content,
      true
    );

    setHidden(
      elements.error,
      false
    );

    setText(
      elements.errorTitle,
      title ||
      'Payments could not be loaded'
    );

    setText(
      elements.errorMessage,
      message ||
      'Please try again.'
    );
  }

  function normalizePayment(payment) {
    const item =
      payment &&
      typeof payment === 'object'
        ? payment
        : {};

    return {
      paymentId:
        clean(
          item.paymentId ||
          item.Payment_ID
        ),

      orderId:
        clean(
          item.orderId ||
          item.Order_ID
        ),

      customerUserId:
        clean(
          item.customerUserId ||
          item.Customer_User_ID
        ),

      expectedAmount:
        numberValue(
          item.expectedAmount ||
          item.Expected_Amount,
          0
        ),

      paymentStatus:
        normalize(
          item.paymentStatus ||
          item.Payment_Status
        ),

      declaredAt:
        clean(
          item.customerDeclaredCompletedAt ||
          item.Customer_Declared_Completed_At
        ),

      providerReference:
        clean(
          item.providerReference ||
          item.Provider_Reference
        )
    };
  }

  function filteredPayments() {
    if (!state.search) {
      return state.payments.slice();
    }

    return state.payments.filter(
      function(payment) {
        return [
          payment.paymentId,
          payment.orderId,
          payment.customerUserId
        ]
          .join(' ')
          .toLowerCase()
          .indexOf(
            state.search
          ) !== -1;
      }
    );
  }

  function renderSummary() {
    const amount =
      state.payments.reduce(
        function(total, payment) {
          return (
            total +
            payment.expectedAmount
          );
        },
        0
      );

    setText(
      elements.pendingCount,
      state.payments.length
    );

    setText(
      elements.pendingAmount,
      formatCurrency(amount)
    );

    setText(
      elements.oldestAge,
      state.payments.length
        ? ageText(
            state.payments[0]
              .declaredAt
          )
        : '—'
    );
  }

  function createPaymentCard(payment) {
    const fragment =
      elements.cardTemplate
        .content
        .cloneNode(true);

    const card =
      fragment.firstElementChild;

    setText(
      card.querySelector(
        '[data-payment-waiting-time]'
      ),
      ageText(
        payment.declaredAt
      )
    );

    setText(
      card.querySelector(
        '[data-payment-amount]'
      ),
      formatCurrency(
        payment.expectedAmount
      )
    );

    setText(
      card.querySelector(
        '[data-payment-order-id]'
      ),
      payment.orderId
    );

    setText(
      card.querySelector(
        '[data-payment-id]'
      ),
      payment.paymentId
    );

    setText(
      card.querySelector(
        '[data-payment-customer-id]'
      ),
      payment.customerUserId
    );

    setText(
      card.querySelector(
        '[data-payment-declared-at]'
      ),
      formatDate(
        payment.declaredAt
      )
    );

    card.querySelector(
      '[data-review-payment]'
    ).dataset.paymentId =
      payment.paymentId;

    return fragment;
  }

  function renderPayments() {
    const records =
      filteredPayments();

    elements.list.innerHTML = '';

    records.forEach(
      function(payment) {
        elements.list.appendChild(
          createPaymentCard(payment)
        );
      }
    );

    setText(
      elements.resultCount,
      records.length +
      (
        records.length === 1
          ? ' record'
          : ' records'
      )
    );

    setHidden(
      elements.loading,
      true
    );

    setHidden(
      elements.error,
      true
    );

    setHidden(
      elements.empty,
      state.payments.length > 0
    );

    setHidden(
      elements.content,
      state.payments.length === 0
    );

    if (
      state.payments.length &&
      !records.length
    ) {
      elements.list.innerHTML =
        '<p class="admin-payments-no-result">' +
        'No matching payment found.' +
        '</p>';
    }

    renderSummary();
  }

  async function loadPayments() {
    if (state.loading) return;

    state.loading = true;
    elements.refresh.disabled = true;

    showLoading();

    try {
      /*
       * Continue directly with Part 2.
       */
          const response = await window.ApnaBiteAPI.request('admin.payment.pending', {
        limit: state.limit
      }, {
        retry: false,
        deduplicate: true,
        timeoutMs: 20000
      });

      const data = responseData(response);

      const records = Array.isArray(data)
        ? data
        : (
          data && Array.isArray(data.items)
            ? data.items
            : []
        );

      state.payments = records
        .map(normalizePayment)
        .filter(function(payment) {
          return (
            payment.paymentId &&
            payment.paymentStatus === 'PENDING_VERIFICATION'
          );
        });

      renderPayments();
    } catch (error) {
      showError(
        'Payments could not be loaded',
        clean(error && error.message) ||
        'Please try again.'
      );

      handleApiError(error);
    } finally {
      state.loading = false;
      elements.refresh.disabled = false;
    }
  }

  function setModalOpen(modal, open) {
    setHidden(modal, !open);

    modal.setAttribute(
      'aria-hidden',
      open ? 'false' : 'true'
    );

    document.body.classList.toggle(
      'admin-payment-modal-open',
      open
    );
  }

  function updateVerifyButton() {
    const payment = state.selectedPayment;

    const amountCorrect =
      payment &&
      Number(
        numberValue(
          elements.confirmedAmount.value,
          0
        ).toFixed(2)
      ) ===
      Number(
        payment.expectedAmount.toFixed(2)
      );

    const referenceValid =
      isDevelopment() ||
      clean(
        elements.providerReference.value
      ).length >= 3;

    elements.verifyButton.disabled = !Boolean(
      payment &&
      amountCorrect &&
      elements.confirmCheckbox.checked &&
      referenceValid &&
      !state.submitting
    );
  }

  function openReview(paymentId) {
    const payment = state.payments.find(
      function(item) {
        return (
          item.paymentId ===
          clean(paymentId)
        );
      }
    );

    if (!payment) return;

    state.selectedPayment = payment;

    setText(
      elements.detailPaymentId,
      payment.paymentId
    );

    setText(
      elements.detailOrderId,
      payment.orderId
    );

    setText(
      elements.detailCustomerId,
      payment.customerUserId
    );

    setText(
      elements.detailAmount,
      formatCurrency(
        payment.expectedAmount
      )
    );

    setText(
      elements.detailDeclaredAt,
      formatDate(payment.declaredAt)
    );

    setText(
      elements.detailWaitingTime,
      ageText(payment.declaredAt)
    );

    elements.confirmedAmount.value =
      payment.expectedAmount.toFixed(2);

    elements.providerReference.value = '';
    elements.confirmCheckbox.checked = false;

    setHidden(elements.modalError, true);
    setHidden(elements.testNote, !isDevelopment());

    setText(
      elements.confirmText,
      isDevelopment()
        ? 'I understand this is a Development test verification and no real payment was received.'
        : 'I have checked that the payment amount has been received.'
    );

    updateVerifyButton();
    setModalOpen(elements.modal, true);
  }

  function closeReview() {
    if (state.submitting) return;

    setModalOpen(elements.modal, false);
    state.selectedPayment = null;
  }

  function openReject() {
    if (
      !state.selectedPayment ||
      state.submitting
    ) {
      return;
    }

    elements.rejectionReason.value = '';

    setHidden(elements.rejectError, true);
    setModalOpen(elements.modal, false);
    setModalOpen(elements.rejectModal, true);
  }

  function closeReject(returnToReview) {
    if (state.submitting) return;

    setModalOpen(
      elements.rejectModal,
      false
    );

    if (
      returnToReview &&
      state.selectedPayment
    ) {
      setModalOpen(
        elements.modal,
        true
      );
    } else {
      state.selectedPayment = null;
    }
  }

  function setSubmitting(submitting) {
    state.submitting = Boolean(submitting);

    elements.verifyButton.disabled =
      state.submitting;

    elements.rejectButton.disabled =
      state.submitting;

    elements.rejectConfirm.disabled =
      state.submitting;

    setText(
      elements.verifyButton,
      state.submitting
        ? 'VERIFYING…'
        : 'VERIFY PAYMENT'
    );

    setText(
      elements.rejectConfirm,
      state.submitting
        ? 'REJECTING…'
        : 'CONFIRM REJECTION'
    );
  }

  async function verifyPayment() {
    if (
      !state.selectedPayment ||
      elements.verifyButton.disabled ||
      state.submitting
    ) {
      return;
    }

    setSubmitting(true);
    setHidden(elements.modalError, true);

    try {
      await window.ApnaBiteAPI.request(
        'admin.payment.verify',
        {
          paymentId:
            state.selectedPayment.paymentId,

          confirmedAmount:
            numberValue(
              elements.confirmedAmount.value,
              0
            ),

          providerReference:
            clean(
              elements.providerReference.value
            ) ||
            (
              isDevelopment()
                ? 'DEV_TEST_' + Date.now()
                : ''
            )
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 25000
        }
      );

      showToast(
        'Payment verified. Order sent to the Chef.',
        'success'
      );

      setModalOpen(elements.modal, false);
      state.selectedPayment = null;

      await loadPayments();
    } catch (error) {
      setText(
        elements.modalError,
        clean(error && error.message) ||
        'Payment could not be verified.'
      );

      setHidden(
        elements.modalError,
        false
      );

      handleApiError(error);
    } finally {
      setSubmitting(false);
      updateVerifyButton();
    }
  }

  async function rejectPayment() {
    if (
      !state.selectedPayment ||
      state.submitting
    ) {
      return;
    }

    const reason = clean(
      elements.rejectionReason.value
    );

    if (reason.length < 5) {
      setText(
        elements.rejectError,
        'Enter a clear rejection reason.'
      );

      setHidden(
        elements.rejectError,
        false
      );

      return;
    }

    setSubmitting(true);
    setHidden(elements.rejectError, true);

    try {
      await window.ApnaBiteAPI.request(
        'admin.payment.reject',
        {
          paymentId:
            state.selectedPayment.paymentId,

          reason: reason,
          rejectionReason: reason
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 25000
        }
      );

      showToast(
        'Payment rejected.',
        'success'
      );

      setModalOpen(
        elements.rejectModal,
        false
      );

      state.selectedPayment = null;

      await loadPayments();
    } catch (error) {
      setText(
        elements.rejectError,
        clean(error && error.message) ||
        'Payment could not be rejected.'
      );

      setHidden(
        elements.rejectError,
        false
      );

      handleApiError(error);
    } finally {
      setSubmitting(false);
    }
  }

  function bindEvents() {
    elements.refresh.addEventListener(
      'click',
      loadPayments
    );

    elements.retry.addEventListener(
      'click',
      loadPayments
    );

    elements.search.addEventListener(
      'input',
      function() {
        state.search = clean(
          elements.search.value
        ).toLowerCase();

        renderPayments();
      }
    );

    elements.limit.addEventListener(
      'change',
      function() {
        state.limit = Math.min(
          50,
          Math.max(
            1,
            Math.floor(
              numberValue(
                elements.limit.value,
                20
              )
            )
          )
        );

        loadPayments();
      }
    );

    elements.list.addEventListener(
      'click',
      function(event) {
        const button = event.target.closest(
          '[data-review-payment]'
        );

        if (button) {
          openReview(
            button.dataset.paymentId
          );
        }
      }
    );

    elements.modalClose.addEventListener(
      'click',
      closeReview
    );

    document
      .querySelectorAll(
        '[data-close-payment-modal]'
      )
      .forEach(function(button) {
        button.addEventListener(
          'click',
          closeReview
        );
      });

    elements.confirmedAmount.addEventListener(
      'input',
      updateVerifyButton
    );

    elements.providerReference.addEventListener(
      'input',
      updateVerifyButton
    );

    elements.confirmCheckbox.addEventListener(
      'change',
      updateVerifyButton
    );

    elements.verifyButton.addEventListener(
      'click',
      verifyPayment
    );

    elements.rejectButton.addEventListener(
      'click',
      openReject
    );

    elements.rejectClose.addEventListener(
      'click',
      function() {
        closeReject(true);
      }
    );

    elements.rejectCancel.addEventListener(
      'click',
      function() {
        closeReject(true);
      }
    );

    document
      .querySelectorAll(
        '[data-close-reject-modal]'
      )
      .forEach(function(button) {
        button.addEventListener(
          'click',
          function() {
            closeReject(true);
          }
        );
      });

    elements.rejectConfirm.addEventListener(
      'click',
      rejectPayment
    );

    document.addEventListener(
      'keydown',
      function(event) {
        if (
          event.key !== 'Escape' ||
          state.submitting
        ) {
          return;
        }

        if (!elements.rejectModal.hidden) {
          closeReject(true);
        } else if (!elements.modal.hidden) {
          closeReview();
        }
      }
    );
  }

  async function initialize() {
    if (
      state.initialized ||
      !document.body.classList.contains(
        'admin-payments-page'
      )
    ) {
      return;
    }

    state.initialized = true;

    collectElements();

    if (!requiredElementsAvailable()) {
      console.error(
        'Admin Payments page elements are incomplete.'
      );
      return;
    }

    if (!validateAdminSession()) {
      return;
    }

    state.limit = numberValue(
      elements.limit.value,
      20
    );

    bindEvents();

    await Promise.all([
      loadEnvironment(),
      loadPayments()
    ]);
  }

  window.ApnaBiteAdminPayments =
    Object.freeze({
      refresh: loadPayments,

      getPayments: function() {
        return JSON.parse(
          JSON.stringify(
            state.payments
          )
        );
      }
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
