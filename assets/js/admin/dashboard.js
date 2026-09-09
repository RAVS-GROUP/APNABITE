/**
 * ============================================================
 * APNABITE V1 — ADMIN DASHBOARD CONTROLLER
 * File: assets/js/admin/dashboard.js
 * Complete file
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    initialized: false,
    loading: false,
    payments: [],
    chefs: []
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.refresh = byId(
      'admin-dashboard-refresh'
    );

    elements.logout = byId(
      'admin-dashboard-logout'
    );

    elements.userName = byId(
      'admin-dashboard-user-name'
    );

    elements.loading = byId(
      'admin-dashboard-loading'
    );

    elements.error = byId(
      'admin-dashboard-error'
    );

    elements.errorTitle = byId(
      'admin-dashboard-error-title'
    );

    elements.errorMessage = byId(
      'admin-dashboard-error-message'
    );

    elements.retry = byId(
      'admin-dashboard-retry'
    );

    elements.content = byId(
      'admin-dashboard-content'
    );

    elements.paymentCount = byId(
      'admin-dashboard-payment-count'
    );

    elements.chefCount = byId(
      'admin-dashboard-chef-count'
    );

    elements.orderCount = byId(
      'admin-dashboard-order-count'
    );

    elements.riderCount = byId(
      'admin-dashboard-rider-count'
    );

    elements.paymentBadge = byId(
      'admin-dashboard-payment-badge'
    );

    elements.chefBadge = byId(
      'admin-dashboard-chef-badge'
    );
  }

  function requiredElementsAvailable() {
    const required = [
      'refresh',
      'logout',
      'loading',
      'error',
      'retry',
      'content',
      'paymentCount',
      'chefCount',
      'orderCount',
      'riderCount',
      'paymentBadge',
      'chefBadge'
    ];

    return required.every(function(name) {
      return Boolean(elements[name]);
    });
  }

  function clean(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    ).replace(/\s+/g, ' ').trim();
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

  function setText(element, value) {
    if (!element) return;

    element.textContent = String(
      value === undefined ||
      value === null
        ? ''
        : value
    );
  }

  function setHidden(element, hidden) {
    if (!element) return;

    element.hidden = Boolean(hidden);
  }

  function responseData(response) {
    if (
      response &&
      response.data !== undefined
    ) {
      return response.data;
    }

    return response || null;
  }

  function extractRecords(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (
      !data ||
      typeof data !== 'object'
    ) {
      return [];
    }

    const possibleLists = [
      data.items,
      data.records,
      data.payments,
      data.chefs,
      data.queue,
      data.results
    ];

    for (
      let index = 0;
      index < possibleLists.length;
      index += 1
    ) {
      if (
        Array.isArray(
          possibleLists[index]
        )
      ) {
        return possibleLists[index];
      }
    }

    return [];
  }

  function extractCount(data, records) {
    if (
      data &&
      !Array.isArray(data) &&
      typeof data === 'object'
    ) {
      const possibleCounts = [
        data.total,
        data.totalCount,
        data.count,
        data.pendingCount
      ];

      for (
        let index = 0;
        index < possibleCounts.length;
        index += 1
      ) {
        const count = Number(
          possibleCounts[index]
        );

        if (
          Number.isFinite(count) &&
          count >= 0
        ) {
          return Math.floor(count);
        }
      }
    }

    return records.length;
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI.showToast ===
        'function'
    ) {
      window.ApnaBiteUI.showToast(
        message,
        type || 'info'
      );

      return;
    }

    console.log(message);
  }

  function showLoading() {
    setHidden(elements.loading, false);
    setHidden(elements.error, true);
    setHidden(elements.content, true);
  }

  function showContent() {
    setHidden(elements.loading, true);
    setHidden(elements.error, true);
    setHidden(elements.content, false);
  }

  function showError(title, message) {
    setHidden(elements.loading, true);
    setHidden(elements.content, true);
    setHidden(elements.error, false);

    setText(
      elements.errorTitle,
      title ||
      'Dashboard could not be loaded'
    );

    setText(
      elements.errorMessage,
      message ||
      'Please try again.'
    );
  }

  function getStoredUser() {
    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore.getSessionUser ===
        'function'
    ) {
      return (
        window.ApnaBiteCore.getSessionUser() ||
        null
      );
    }

    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore.getStoredUser ===
        'function'
    ) {
      return (
        window.ApnaBiteCore.getStoredUser() ||
        null
      );
    }

    const keys = [
      'apnabite_session_user',
      'apnabite_user',
      'SESSION_USER'
    ];

    for (
      let index = 0;
      index < keys.length;
      index += 1
    ) {
      const stored =
        window.localStorage.getItem(
          keys[index]
        );

      if (!stored) continue;

      try {
        const user = JSON.parse(stored);

        if (
          user &&
          typeof user === 'object'
        ) {
          return user;
        }
      } catch (error) {
        /*
         * Ignore malformed legacy value.
         */
      }
    }

    return null;
  }

  function validateAdminSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      showError(
        'Application files are missing',
        'Required Admin files did not load.'
      );

      return false;
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession ===
        'function'
    ) {
      const allowed =
        window.ApnaBiteCore
          .requireLocalSession([
            'ADMIN'
          ]);

      if (!allowed) {
        return false;
      }
    } else if (
      !window.ApnaBiteAPI
        .getSessionToken()
    ) {
      window.location.replace(
        'login.html'
      );

      return false;
    }

    const user = getStoredUser();

    if (user) {
      const role = normalize(
        user.role ||
        user.Role
      );

      if (
        role &&
        role !== 'ADMIN'
      ) {
        if (
          typeof window.ApnaBiteCore
            .redirectToRoleHome ===
            'function'
        ) {
          window.ApnaBiteCore
            .redirectToRoleHome(
              role,
              true
            );
        } else {
          window.location.replace(
            '../login.html'
          );
        }

        return false;
      }

      setText(
        elements.userName,
        clean(
          user.fullName ||
          user.Full_Name ||
          user.name ||
          user.Name
        ) ||
        'Admin'
      );
    }

    return true;
  }

  function renderBadge(
    element,
    count
  ) {
    setText(element, count);
    setHidden(element, count <= 0);
  }

  function renderDashboard(
    paymentCount,
    chefCount
  ) {
    setText(
      elements.paymentCount,
      paymentCount
    );

    setText(
      elements.chefCount,
      chefCount
    );

    /*
     * Order and Rider dashboard APIs
     * will be connected with their modules.
     */
    setText(elements.orderCount, '—');
    setText(elements.riderCount, '—');

    renderBadge(
      elements.paymentBadge,
      paymentCount
    );

    renderBadge(
      elements.chefBadge,
      chefCount
    );

    showContent();
  }

  async function loadPaymentSummary() {
    const response =
      await window.ApnaBiteAPI.request(
        'admin.payment.pending',
        {
          limit: 50
        },
        {
          retry: false,
          deduplicate: true,
          timeoutMs: 20000
        }
      );

    const data = responseData(response);
    const records = extractRecords(data);

    state.payments = records;

    return extractCount(
      data,
      records
    );
  }

  async function loadChefSummary() {
    const response =
      await window.ApnaBiteAPI.request(
        'admin.chef.queue',
        {
          page: 1,
          pageSize: 50,
          limit: 50
        },
        {
          retry: false,
          deduplicate: true,
          timeoutMs: 20000
        }
      );

    const data = responseData(response);
    const records = extractRecords(data);

    state.chefs = records;

    return extractCount(
      data,
      records
    );
  }

  async function loadDashboard() {
    if (state.loading) return;

    state.loading = true;
    elements.refresh.disabled = true;

    showLoading();

    try {
      /*
       * Both independent queues load together
       * for faster dashboard rendering.
       */
      const results =
        await Promise.allSettled([
          loadPaymentSummary(),
          loadChefSummary()
        ]);

      const paymentResult =
        results[0];

      const chefResult =
        results[1];

      const paymentSucceeded =
        paymentResult.status ===
        'fulfilled';

      const chefSucceeded =
        chefResult.status ===
        'fulfilled';

      if (
        !paymentSucceeded &&
        !chefSucceeded
      ) {
        const paymentError =
          paymentResult.reason;

        const chefError =
          chefResult.reason;

        throw (
          paymentError ||
          chefError ||
          new Error(
            'Dashboard data could not be loaded.'
          )
        );
      }

      const paymentCount =
        paymentSucceeded
          ? numberValue(
              paymentResult.value,
              0
            )
          : 0;

      const chefCount =
        chefSucceeded
          ? numberValue(
              chefResult.value,
              0
            )
          : 0;

      renderDashboard(
        paymentCount,
        chefCount
      );

      if (
        !paymentSucceeded ||
        !chefSucceeded
      ) {
        showToast(
          'Some dashboard information could not be loaded. You can still open the available modules.',
          'warning'
        );
      }
    } catch (error) {
      showError(
        'Dashboard could not be loaded',
        clean(error && error.message) ||
        'Please check your connection and try again.'
      );

      if (
        window.ApnaBiteUI &&
        typeof window.ApnaBiteUI
          .handleApiError ===
          'function'
      ) {
        window.ApnaBiteUI
          .handleApiError(
            error,
            {
              redirectToLogin: true
            }
          );
      }
    } finally {
      state.loading = false;
      elements.refresh.disabled = false;
    }
  }

  function clearLocalSession() {
    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore
        .clearSession ===
        'function'
    ) {
      window.ApnaBiteCore.clearSession();
      return;
    }

    [
      'apnabite_session_token',
      'apnabite_session_user',
      'apnabite_user',
      'SESSION_USER'
    ].forEach(function(key) {
      window.localStorage.removeItem(key);
    });
  }

  async function logoutAdmin() {
    if (elements.logout.disabled) {
      return;
    }

    const confirmed = window.confirm(
      'Logout from Admin account?'
    );

    if (!confirmed) return;

    elements.logout.disabled = true;
    setText(elements.logout, 'Logging out…');

    try {
      if (
        window.ApnaBiteAPI &&
        typeof window.ApnaBiteAPI.logout ===
          'function'
      ) {
        await window.ApnaBiteAPI.logout();
      }
    } catch (error) {
      /*
       * Local session must still be cleared
       * if server logout is unavailable.
       */
    } finally {
      clearLocalSession();

      window.location.replace(
        'login.html'
      );
    }
  }

  function bindEvents() {
    elements.refresh.addEventListener(
      'click',
      loadDashboard
    );

    elements.retry.addEventListener(
      'click',
      loadDashboard
    );

    elements.logout.addEventListener(
      'click',
      logoutAdmin
    );

    window.addEventListener(
      'pageshow',
      function(event) {
        if (event.persisted) {
          loadDashboard();
        }
      }
    );
  }

  async function initialize() {
    if (
      state.initialized ||
      !document.body.classList.contains(
        'admin-dashboard-page'
      )
    ) {
      return;
    }

    state.initialized = true;

    collectElements();

    if (!requiredElementsAvailable()) {
      console.error(
        'Admin dashboard page elements are incomplete.'
      );

      return;
    }

    if (!validateAdminSession()) {
      return;
    }

    bindEvents();
    await loadDashboard();
  }

  window.ApnaBiteAdminDashboard =
    Object.freeze({
      refresh: loadDashboard,

      getSummary: function() {
        return {
          pendingPayments:
            state.payments.length,

          pendingChefs:
            state.chefs.length
        };
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
