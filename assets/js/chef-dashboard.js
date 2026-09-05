/**
 * ============================================================
 * APNABITE V1 — CHEF DASHBOARD CONTROLLER
 * File: assets/js/chef-dashboard.js
 * Complete file
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    initialized: false,
    loading: false,
    updatingAvailability: false,
    user: null,
    kitchen: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.kitchenName =
      byId(
        'chef-dashboard-kitchen-name'
      );

    elements.syncStatus =
      byId(
        'chef-dashboard-sync-status'
      );

    elements.refreshButton =
      byId(
        'chef-dashboard-refresh-button'
      );

    elements.logoutButton =
      byId(
        'chef-dashboard-logout-button'
      );

    elements.chefName =
      byId(
        'chef-dashboard-chef-name'
      );

    elements.welcomeMessage =
      byId(
        'chef-dashboard-welcome-message'
      );

    elements.accountBadge =
      byId(
        'chef-dashboard-account-badge'
      );

    elements.loading =
      byId(
        'chef-dashboard-loading'
      );

    elements.error =
      byId(
        'chef-dashboard-error'
      );

    elements.errorTitle =
      byId(
        'chef-dashboard-error-title'
      );

    elements.errorMessage =
      byId(
        'chef-dashboard-error-message'
      );

    elements.errorRetry =
      byId(
        'chef-dashboard-error-retry'
      );

    elements.content =
      byId(
        'chef-dashboard-content'
      );

    elements.kitchenStatusCard =
      byId(
        'chef-dashboard-kitchen-status-card'
      );

    elements.kitchenImage =
      byId(
        'chef-dashboard-kitchen-image'
      );

    elements.approvalStatus =
      byId(
        'chef-dashboard-approval-status'
      );

    elements.kitchenTitle =
      byId(
        'chef-dashboard-kitchen-title'
      );

    elements.foodType =
      byId(
        'chef-dashboard-kitchen-food-type'
      );

    elements.availabilityToggle =
      byId(
        'chef-dashboard-availability-toggle'
      );

    elements.availabilityText =
      byId(
        'chef-dashboard-availability-text'
      );

    elements.serviceRadius =
      byId(
        'chef-dashboard-service-radius'
      );

    elements.preparationTime =
      byId(
        'chef-dashboard-preparation-time'
      );

    elements.minimumOrder =
      byId(
        'chef-dashboard-minimum-order'
      );

    elements.kitchenStatusMessage =
      byId(
        'chef-dashboard-kitchen-status-message'
      );

    elements.dailyCapacity =
      byId(
        'chef-dashboard-daily-capacity'
      );

    elements.mealsBooked =
      byId(
        'chef-dashboard-meals-booked'
      );

    elements.remainingCapacity =
      byId(
        'chef-dashboard-remaining-capacity'
      );

    elements.averageRating =
      byId(
        'chef-dashboard-average-rating'
      );

    elements.ratingCount =
      byId(
        'chef-dashboard-rating-count'
      );

    elements.pendingOrdersBadge =
      byId(
        'chef-dashboard-pending-orders-badge'
      );

    elements.awaitingOrders =
      byId(
        'chef-dashboard-awaiting-orders'
      );

    elements.preparingOrders =
      byId(
        'chef-dashboard-preparing-orders'
      );

    elements.readyOrders =
      byId(
        'chef-dashboard-ready-orders'
      );

    elements.completedOrders =
      byId(
        'chef-dashboard-completed-orders'
      );

    elements.ordersNote =
      byId(
        'chef-dashboard-orders-note'
      );

    elements.acceptanceRate =
      byId(
        'chef-dashboard-acceptance-rate'
      );

    elements.acceptanceProgress =
      byId(
        'chef-dashboard-acceptance-progress'
      );

    elements.cancellationRate =
      byId(
        'chef-dashboard-cancellation-rate'
      );

    elements.cancellationProgress =
      byId(
        'chef-dashboard-cancellation-progress'
      );
  }

  function cleanText(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeStatus(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function toNumber(value, fallback) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : (
        fallback === undefined
          ? 0
          : fallback
      );
  }

  function clampPercent(value) {
    return Math.min(
      100,
      Math.max(
        0,
        toNumber(value, 0)
      )
    );
  }

  function getResponseData(response) {
    if (
      response &&
      response.data &&
      typeof response.data === 'object'
    ) {
      return response.data;
    }

    if (
      response &&
      typeof response === 'object' &&
      !response.success &&
      !response.error
    ) {
      return response;
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

  function formatMoney(value) {
    const amount =
      toNumber(value, 0);

    try {
      return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits:
            amount % 1 === 0
              ? 0
              : 2
        }
      ).format(amount);
    } catch (error) {
      return (
        '₹' +
        amount.toFixed(
          amount % 1 === 0
            ? 0
            : 2
        )
      );
    }
  }

  function buildDriveThumbnailUrl(fileId) {
    const cleanFileId =
      cleanText(fileId);

    if (!cleanFileId) {
      return '';
    }

    return (
      'https://' +
      'drive.google.com/thumbnail?id=' +
      encodeURIComponent(
        cleanFileId
      ) +
      '&sz=w1200'
    );
  }

  function setPageLoading(loading) {
    state.loading =
      Boolean(loading);

    setHidden(
      elements.loading,
      !state.loading
    );

    if (elements.refreshButton) {
      elements.refreshButton.disabled =
        state.loading ||
        state.updatingAvailability;

      elements.refreshButton.textContent =
        state.loading
          ? 'LOADING…'
          : 'REFRESH';
    }

    if (state.loading) {
      setText(
        elements.syncStatus,
        'Loading…'
      );
    }
  }

  function showError(
    title,
    message
  ) {
    setText(
      elements.errorTitle,
      title ||
      'Dashboard could not be loaded'
    );

    setText(
      elements.errorMessage,
      message ||
      'Please check your internet connection and try again.'
    );

    setHidden(
      elements.error,
      false
    );

    setHidden(
      elements.content,
      true
    );

    setText(
      elements.syncStatus,
      'Not loaded'
    );
  }

  function clearError() {
    setHidden(
      elements.error,
      true
    );
  }

  function getLocalUser() {
    if (!window.ApnaBiteCore) {
      return null;
    }

    if (
      typeof window.ApnaBiteCore
        .getSession === 'function'
    ) {
      const session =
        window.ApnaBiteCore
          .getSession();

      if (
        session &&
        session.user
      ) {
        return session.user;
      }
    }

    if (
      typeof window.ApnaBiteCore
        .getCurrentUser === 'function'
    ) {
      return window.ApnaBiteCore
        .getCurrentUser();
    }

    return null;
  }

  function requireChefSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      showError(
        'Required files did not load',
        'Refresh the page and try again.'
      );

      return false;
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession ===
        'function'
    ) {
      return Boolean(
        window.ApnaBiteCore
          .requireLocalSession(
            ['CHEF']
          )
      );
    }

    return Boolean(
      typeof window.ApnaBiteCore
        .getSessionToken ===
        'function' &&
      window.ApnaBiteCore
        .getSessionToken()
    );
  }

  function renderAccount(user) {
    const accountStatus =
      normalizeStatus(
        user &&
        (
          user.accountStatus ||
          user.Account_Status
        )
      );

    const verificationStatus =
      normalizeStatus(
        user &&
        (
          user.verificationStatus ||
          user.Verification_Status
        )
      );

    const fullName =
      cleanText(
        user &&
        (
          user.fullName ||
          user.name ||
          user.Full_Name
        )
      ) || 'Chef';

    setText(
      elements.chefName,
      fullName
    );

    if (
      accountStatus === 'ACTIVE' &&
      verificationStatus === 'VERIFIED'
    ) {
      setText(
        elements.accountBadge,
        'ACTIVE CHEF'
      );

      if (elements.accountBadge) {
        elements.accountBadge.className =
          'chef-dashboard-account-badge chef-dashboard-account-badge--active';
      }

      setText(
        elements.welcomeMessage,
        'Your Kitchen is approved and ready to receive orders.'
      );

      return;
    }

    setText(
      elements.accountBadge,
      accountStatus ||
      'PENDING'
    );

    if (elements.accountBadge) {
      elements.accountBadge.className =
        'chef-dashboard-account-badge chef-dashboard-account-badge--pending';
    }

    setText(
      elements.welcomeMessage,
      'Manage your Kitchen information and approval status.'
    );
  }

  function renderKitchenImage(kitchen) {
    if (!elements.kitchenImage) {
      return;
    }

    const imageUrl =
      cleanText(
        kitchen.thumbnailUrl
      ) ||
      buildDriveThumbnailUrl(
        kitchen.thumbnailFileId
      );

    if (!imageUrl) {
      elements.kitchenImage.src =
        '../assets/images/logo.png';

      return;
    }

    elements.kitchenImage.onerror =
      function() {
        elements.kitchenImage.onerror =
          null;

        elements.kitchenImage.src =
          '../assets/images/logo.png';
      };

    elements.kitchenImage.src =
      imageUrl;

    elements.kitchenImage.alt =
      (
        cleanText(
          kitchen.kitchenName
        ) ||
        'Kitchen'
      ) +
      ' image';
  }

  function renderKitchenStatus(kitchen) {
    const kitchenStatus =
      normalizeStatus(
        kitchen.kitchenStatus
      );

    const approvalStatus =
      normalizeStatus(
        kitchen.adminApprovalStatus
      );

    const availabilityStatus =
      normalizeStatus(
        kitchen.availabilityStatus
      ) || 'CLOSED';

    setText(
      elements.approvalStatus,
      approvalStatus ||
      kitchenStatus ||
      'PENDING'
    );

    if (elements.approvalStatus) {
      elements.approvalStatus.className =
        'chef-dashboard-status-pill';

      if (
        kitchenStatus === 'ACTIVE' &&
        approvalStatus === 'APPROVED'
      ) {
        elements.approvalStatus
          .classList.add(
            'chef-dashboard-status-pill--approved'
          );
      } else if (
        kitchenStatus === 'REJECTED' ||
        approvalStatus === 'REJECTED'
      ) {
        elements.approvalStatus
          .classList.add(
            'chef-dashboard-status-pill--rejected'
          );
      } else {
        elements.approvalStatus
          .classList.add(
            'chef-dashboard-status-pill--pending'
          );
      }
    }

    const canChangeAvailability =
      kitchenStatus === 'ACTIVE' &&
      approvalStatus === 'APPROVED';

    if (elements.availabilityToggle) {
      elements.availabilityToggle.checked =
        availabilityStatus === 'OPEN';

      elements.availabilityToggle.disabled =
        !canChangeAvailability ||
        state.updatingAvailability;
    }

    setText(
      elements.availabilityText,
      availabilityStatus
    );

    if (
      kitchenStatus === 'ACTIVE' &&
      approvalStatus === 'APPROVED'
    ) {
      if (
        availabilityStatus === 'OPEN'
      ) {
        setText(
          elements.kitchenStatusMessage,
          'Your Kitchen is visible to nearby Customers and can receive orders.'
        );
      } else {
        setText(
          elements.kitchenStatusMessage,
          'Your Kitchen is approved but currently closed. Open it when you are ready to receive orders.'
        );
      }

      return;
    }

    if (
      kitchenStatus === 'REJECTED' ||
      approvalStatus === 'REJECTED'
    ) {
      setText(
        elements.kitchenStatusMessage,
        kitchen.suspensionReason ||
        'Kitchen changes are required before approval.'
      );

      return;
    }

    if (
      kitchenStatus === 'SUSPENDED' ||
      approvalStatus === 'SUSPENDED'
    ) {
      setText(
        elements.kitchenStatusMessage,
        kitchen.suspensionReason ||
        'Your Kitchen is currently suspended.'
      );

      return;
    }

    setText(
      elements.kitchenStatusMessage,
      'Your Kitchen is waiting for Admin approval.'
    );
  }

  function renderCapacity(kitchen) {
    const capacity =
      Math.max(
        0,
        Math.floor(
          toNumber(
            kitchen.capacityPerDay,
            0
          )
        )
      );

    const booked =
      Math.max(
        0,
        Math.floor(
          toNumber(
            kitchen.mealsBookedToday,
            0
          )
        )
      );

    const remaining =
      Math.max(
        0,
        Math.floor(
          toNumber(
            kitchen.remainingCapacity,
            capacity - booked
          )
        )
      );

    setText(
      elements.dailyCapacity,
      capacity
    );

    setText(
      elements.mealsBooked,
      booked
    );

    setText(
      elements.remainingCapacity,
      remaining
    );
  }

  function renderRating(kitchen) {
    const rating =
      toNumber(
        kitchen.averageRating,
        0
      );

    const count =
      Math.max(
        0,
        Math.floor(
          toNumber(
            kitchen.ratingCount,
            0
          )
        )
      );

    setText(
      elements.averageRating,
      count > 0
        ? rating.toFixed(1)
        : 'New'
    );

    setText(
      elements.ratingCount,
      count > 0
        ? (
          count +
          (
            count === 1
              ? ' rating'
              : ' ratings'
          )
        )
        : 'No ratings'
    );
  }

  function renderPerformance(kitchen) {
    const acceptanceRate =
      clampPercent(
        kitchen.acceptanceRate
      );

    const cancellationRate =
      clampPercent(
        kitchen.cancellationRate
      );

    setText(
      elements.acceptanceRate,
      acceptanceRate.toFixed(
        acceptanceRate % 1 === 0
          ? 0
          : 1
      ) + '%'
    );

    setText(
      elements.cancellationRate,
      cancellationRate.toFixed(
        cancellationRate % 1 === 0
          ? 0
          : 1
      ) + '%'
    );

    if (elements.acceptanceProgress) {
      elements.acceptanceProgress
        .style.width =
        acceptanceRate + '%';
    }

    if (elements.cancellationProgress) {
      elements.cancellationProgress
        .style.width =
        cancellationRate + '%';
    }
  }

  function renderOrderPlaceholders() {
    /*
     * Orders backend will be connected in
     * the Chef Orders module.
     * No unnecessary API request is made here.
     */
    setText(
      elements.awaitingOrders,
      '0'
    );

    setText(
      elements.preparingOrders,
      '0'
    );

    setText(
      elements.readyOrders,
      '0'
    );

    setText(
      elements.completedOrders,
      '0'
    );

    setHidden(
      elements.pendingOrdersBadge,
      true
    );

    setText(
      elements.ordersNote,
      'Order activity will appear after the Chef Orders module is connected.'
    );
  }

  function renderKitchen(kitchen) {
    const kitchenName =
      cleanText(
        kitchen.kitchenName
      ) || 'My Kitchen';

    const foodType =
      normalizeStatus(
        kitchen.foodType
      );

    const approvedRadius =
      toNumber(
        kitchen.approvedServiceRadiusKm,
        NaN
      );

    const requestedRadius =
      toNumber(
        kitchen.requestedServiceRadiusKm,
        0
      );

    const serviceRadius =
      Number.isFinite(
        approvedRadius
      )
        ? approvedRadius
        : requestedRadius;

    setText(
      elements.kitchenName,
      kitchenName
    );

    setText(
      elements.kitchenTitle,
      kitchenName
    );

    setText(
      elements.foodType,
      foodType === 'BOTH'
        ? 'Veg & Non-Veg'
        : (
          foodType === 'NON_VEG'
            ? 'Non-Veg'
            : (
              foodType === 'VEG'
                ? 'Veg'
                : 'Food type not set'
            )
        )
    );

    setText(
      elements.serviceRadius,
      serviceRadius > 0
        ? serviceRadius + ' km'
        : '—'
    );

    const preparationMinutes =
      Math.max(
        0,
        Math.floor(
          toNumber(
            kitchen
              .averagePreparationMinutes,
            0
          )
        )
      );

    setText(
      elements.preparationTime,
      preparationMinutes > 0
        ? preparationMinutes + ' min'
        : '—'
    );

    setText(
      elements.minimumOrder,
      formatMoney(
        kitchen.minimumOrderValue
      )
    );

    renderKitchenImage(
      kitchen
    );

    renderKitchenStatus(
      kitchen
    );

    renderCapacity(
      kitchen
    );

    renderRating(
      kitchen
    );

    renderPerformance(
      kitchen
    );

    renderOrderPlaceholders();
  }

  function renderDashboard(data) {
    const user =
      data.user || null;

    const kitchen =
      data.kitchen || null;

    if (!user) {
      throw new Error(
        'Chef account details were not returned.'
      );
    }

    if (!kitchen) {
      window.location.href =
        'onboarding.html';

      return;
    }

    state.user =
      user;

    state.kitchen =
      kitchen;

    renderAccount(
      user
    );

    renderKitchen(
      kitchen
    );

    clearError();

    setHidden(
      elements.content,
      false
    );

    setText(
      elements.syncStatus,
      'Updated'
    );
  }

  async function loadDashboard() {
    if (state.loading) {
      return;
    }

    clearError();
    setPageLoading(true);

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.onboarding',
          {},
          {
            retry: true,
            retryCount: 1,
            deduplicate: true,
            timeoutMs: 20000
          }
        );

      const data =
        getResponseData(
          response
        );

      renderDashboard(
        data
      );
    } catch (error) {
      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Dashboard could not be loaded.';

      showError(
        'Unable to load Chef Dashboard',
        message
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
      setPageLoading(false);
    }
  }

  async function updateAvailability(
    requestedStatus
  ) {
    if (
      state.updatingAvailability ||
      !state.kitchen
    ) {
      return;
    }

    const previousStatus =
      normalizeStatus(
        state.kitchen
          .availabilityStatus
      ) || 'CLOSED';

    state.updatingAvailability =
      true;

    if (elements.availabilityToggle) {
      elements.availabilityToggle.disabled =
        true;
    }

    if (elements.refreshButton) {
      elements.refreshButton.disabled =
        true;
    }

    setText(
      elements.availabilityText,
      requestedStatus
    );

    setText(
      elements.syncStatus,
      'Saving…'
    );

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.kitchen.availability',
          {
            availabilityStatus:
              requestedStatus
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const data =
        getResponseData(
          response
        );

      const updatedKitchen =
        data.kitchen || null;

      if (updatedKitchen) {
        state.kitchen =
          updatedKitchen;
      } else {
        state.kitchen
          .availabilityStatus =
          requestedStatus;
      }

      renderKitchenStatus(
        state.kitchen
      );

      setText(
        elements.syncStatus,
        'Saved'
      );

      showToast(
        requestedStatus === 'OPEN'
          ? 'Kitchen is now open for orders.'
          : 'Kitchen is now closed.',
        'success'
      );
    } catch (error) {
      state.kitchen
        .availabilityStatus =
        previousStatus;

      if (elements.availabilityToggle) {
        elements.availabilityToggle.checked =
          previousStatus === 'OPEN';
      }

      renderKitchenStatus(
        state.kitchen
      );

      setText(
        elements.syncStatus,
        'Not saved'
      );

      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Kitchen availability could not be updated.';

      showToast(
        message,
        'error'
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
      state.updatingAvailability =
        false;

      if (elements.refreshButton) {
        elements.refreshButton.disabled =
          false;
      }

      renderKitchenStatus(
        state.kitchen
      );
    }
  }

  function clearLocalSession() {
    if (!window.ApnaBiteCore) {
      return;
    }

    if (
      typeof window.ApnaBiteCore
        .clearSession === 'function'
    ) {
      window.ApnaBiteCore
        .clearSession();

      return;
    }

    if (
      typeof window.ApnaBiteCore
        .removeSession === 'function'
    ) {
      window.ApnaBiteCore
        .removeSession();
    }
  }

  async function logout() {
    if (elements.logoutButton) {
      elements.logoutButton.disabled =
        true;

      elements.logoutButton.textContent =
        'LOGGING OUT…';
    }

    try {
      if (
        window.ApnaBiteAPI &&
        typeof window.ApnaBiteAPI
          .request === 'function'
      ) {
        await window.ApnaBiteAPI.request(
          'auth.logout',
          {},
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 10000
          }
        );
      }
    } catch (error) {
      /*
       * Local session is still removed if the
       * server logout request fails.
       */
    } finally {
      clearLocalSession();

      window.location.href =
        '../login.html';
    }
  }

  function bindEvents() {
    if (elements.refreshButton) {
      elements.refreshButton
        .addEventListener(
          'click',
          loadDashboard
        );
    }

    if (elements.errorRetry) {
      elements.errorRetry
        .addEventListener(
          'click',
          loadDashboard
        );
    }

    if (elements.logoutButton) {
      elements.logoutButton
        .addEventListener(
          'click',
          logout
        );
    }

    if (elements.availabilityToggle) {
      elements.availabilityToggle
        .addEventListener(
          'change',
          function() {
            const requestedStatus =
              elements
                .availabilityToggle
                .checked
                ? 'OPEN'
                : 'CLOSED';

            updateAvailability(
              requestedStatus
            );
          }
        );
    }

    window.addEventListener(
      'pageshow',
      function(event) {
        if (
          event.persisted &&
          state.initialized
        ) {
          loadDashboard();
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains(
          'chef-dashboard-page'
        )
    ) {
      return;
    }

    if (state.initialized) {
      return;
    }

    state.initialized = true;

    getElements();
    bindEvents();

    if (!requireChefSession()) {
      return;
    }

    const localUser =
      getLocalUser();

    if (localUser) {
      renderAccount(
        localUser
      );
    }

    await loadDashboard();
  }

  window.ApnaBiteChefDashboard =
    Object.freeze({
      initialize:
        initialize,

      refresh:
        loadDashboard,

      updateAvailability:
        updateAvailability
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
