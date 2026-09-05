/**
 * ============================================================
 * APNABITE V1 — CHEF REVIEW CONTROLLER
 * File: assets/js/chef-review.js
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
    onboarding: null,
    addresses: []
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.backButton =
      byId('chef-review-back-button');

    elements.saveStatus =
      byId('chef-review-save-status');

    elements.statusCard =
      byId('chef-review-status-card');

    elements.statusIcon =
      byId('chef-review-status-icon');

    elements.statusTitle =
      byId('chef-review-status-title');

    elements.statusMessage =
      byId('chef-review-status-message');

    elements.content =
      byId('chef-review-content');

    elements.error =
      byId('chef-review-error');

    elements.kitchenImage =
      byId('chef-review-kitchen-image');

    elements.imagePlaceholder =
      byId(
        'chef-review-image-placeholder'
      );

    elements.kitchenName =
      byId('chef-review-kitchen-name');

    elements.description =
      byId('chef-review-description');

    elements.foodType =
      byId('chef-review-food-type');

    elements.capacity =
      byId('chef-review-capacity');

    elements.preparation =
      byId('chef-review-preparation');

    elements.addressTitle =
      byId('chef-review-address-title');

    elements.addressText =
      byId('chef-review-address-text');

    elements.coordinates =
      byId('chef-review-coordinates');

    elements.kycList =
      byId('chef-review-kyc-list');

    elements.payoutMethod =
      byId('chef-review-payout-method');

    elements.payoutDetails =
      byId('chef-review-payout-details');

    elements.payoutStatus =
      byId('chef-review-payout-status');

    elements.editProfile =
      byId('chef-review-edit-profile');

    elements.editAddress =
      byId('chef-review-edit-address');

    elements.editKyc =
      byId('chef-review-edit-kyc');

    elements.editPayout =
      byId('chef-review-edit-payout');

    elements.submitButton =
      byId('chef-review-submit-button');
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

  function handleError(error) {
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

      return;
    }

    showToast(
      cleanText(
        error &&
        error.message
      ) ||
      'Something went wrong.',
      'error'
    );
  }

  function setStatusType(type) {
    if (!elements.statusCard) {
      return;
    }

    elements.statusCard.classList.remove(
      'chef-status-card--loading',
      'chef-status-card--pending',
      'chef-status-card--approved',
      'chef-status-card--rejected'
    );

    if (type) {
      elements.statusCard.classList.add(
        'chef-status-card--' +
        type
      );
    }
  }

  function setLoadingStatus() {
    setStatusType('loading');

    setText(
      elements.statusIcon,
      '…'
    );

    setText(
      elements.statusTitle,
      'Checking onboarding details'
    );

    setText(
      elements.statusMessage,
      'Please wait while we prepare your Kitchen summary.'
    );

    setText(
      elements.saveStatus,
      'Checking…'
    );

    setHidden(
      elements.content,
      true
    );

    setHidden(
      elements.error,
      true
    );

    if (elements.submitButton) {
      elements.submitButton.disabled =
        true;

      elements.submitButton.textContent =
        'CHECKING DETAILS…';
    }
  }

  function getKitchen() {
    return (
      state.onboarding &&
      state.onboarding.kitchen
        ? state.onboarding.kitchen
        : null
    );
  }

  function getSteps() {
    return (
      state.onboarding &&
      state.onboarding.steps &&
      typeof state.onboarding.steps ===
        'object'
        ? state.onboarding.steps
        : {}
    );
  }

  function getKyc() {
    return (
      state.onboarding &&
      state.onboarding.kyc &&
      typeof state.onboarding.kyc ===
        'object'
        ? state.onboarding.kyc
        : {}
    );
  }

  function getPayoutAccount() {
    const payout =
      state.onboarding &&
      state.onboarding.payout
        ? state.onboarding.payout
        : {};

    return (
      payout.payoutAccount ||
      payout.account ||
      (
        payout.payoutAccountId
          ? payout
          : null
      )
    );
  }

  function isReviewReady() {
    const steps =
      getSteps();

    return Boolean(
      steps.kitchenProfileComplete ||
      steps.kitchen
    ) &&
    Boolean(
      steps.addressAdded ||
      steps.address
    ) &&
    Boolean(
      steps.kitchenImageUploaded ||
      steps.image
    ) &&
    Boolean(
      steps.kycSubmitted ||
      steps.kyc
    ) &&
    Boolean(
      steps.payoutAdded ||
      steps.payout
    );
  }

  function isAlreadySubmitted() {
    const kitchen =
      getKitchen();

    if (!kitchen) {
      return false;
    }

    const status =
      normalizeStatus(
        kitchen.kitchenStatus
      );

    return [
      'PENDING_APPROVAL',
      'ACTIVE',
      'REJECTED',
      'SUSPENDED'
    ].indexOf(status) !== -1;
  }

  function formatFoodType(value) {
    const foodType =
      normalizeStatus(value);

    if (foodType === 'NON_VEG') {
      return 'Non-Veg';
    }

    if (foodType === 'BOTH') {
      return 'Veg & Non-Veg';
    }

    if (foodType === 'VEG') {
      return 'Veg';
    }

    return foodType || '—';
  }

  function getKitchenAddress() {
    const kitchen =
      getKitchen();

    if (
      !kitchen ||
      !kitchen.addressId
    ) {
      return null;
    }

    return state.addresses.find(
      function(address) {
        return (
          cleanText(
            address.addressId
          ) ===
          cleanText(
            kitchen.addressId
          )
        );
      }
    ) || null;
  }

  function buildAddressText(address) {
    if (!address) {
      return 'Saved exact Kitchen location';
    }

    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.landmark,
      address.area,
      address.city,
      address.district,
      address.state,
      address.postalCode
    ]
      .map(cleanText)
      .filter(Boolean);

    return parts.length
      ? parts.join(', ')
      : 'Saved exact Kitchen location';
  }

  function renderKitchen() {
    const kitchen =
      getKitchen();

    if (!kitchen) {
      return;
    }

    setText(
      elements.kitchenName,
      kitchen.kitchenName || '—'
    );

    setText(
      elements.description,
      kitchen.description || '—'
    );

    setText(
      elements.foodType,
      formatFoodType(
        kitchen.foodType
      )
    );

    setText(
      elements.capacity,
      String(
        kitchen.capacityPerDay || 0
      ) +
      ' meals/day'
    );

    setText(
      elements.preparation,
      String(
        kitchen.averagePreparationMinutes ||
        0
      ) +
      ' min preparation'
    );

    const imageUrl =
      cleanText(
        kitchen.thumbnailUrl
      );

    if (
      imageUrl &&
      elements.kitchenImage
    ) {
      elements.kitchenImage.src =
        imageUrl;

      elements.kitchenImage.onload =
        function() {
          setHidden(
            elements.kitchenImage,
            false
          );

          setHidden(
            elements.imagePlaceholder,
            true
          );
        };

      elements.kitchenImage.onerror =
        function() {
          setHidden(
            elements.kitchenImage,
            true
          );

          setHidden(
            elements.imagePlaceholder,
            false
          );
        };
    } else {
      setHidden(
        elements.kitchenImage,
        true
      );

      setHidden(
        elements.imagePlaceholder,
        false
      );
    }
  }

  function renderAddress() {
    const kitchen =
      getKitchen();

    const address =
      getKitchenAddress();

    setText(
      elements.addressTitle,
      address
        ? (
          address.addressLabel ||
          'Kitchen address'
        )
        : 'Kitchen address'
    );

    setText(
      elements.addressText,
      buildAddressText(address)
    );

    const latitude =
      kitchen &&
      Number(
        kitchen.latitude
      );

    const longitude =
      kitchen &&
      Number(
        kitchen.longitude
      );

    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude)
    ) {
      setText(
        elements.coordinates,
        latitude.toFixed(6) +
        ', ' +
        longitude.toFixed(6)
      );
    } else {
      setText(
        elements.coordinates,
        'Location coordinates unavailable'
      );
    }
  }

  function createKycItem(
    documentType,
    document
  ) {
    const item =
      document.createElement('div');

    item.className =
      'chef-review-check-item';

    const icon =
      document.createElement('span');

    icon.className =
      'chef-review-check-item__icon';

    const content =
      document.createElement('div');

    const title =
      document.createElement('strong');

    const message =
      document.createElement('small');

    const status =
      normalizeStatus(
        documentType &&
        documentType.verificationStatus
      );

    title.textContent =
      cleanText(
        documentType &&
        documentType.documentType
      ) || 'Document';

    if (!documentType) {
      icon.textContent = '!';
      message.textContent =
        'Not submitted';

      item.classList.add(
        'chef-review-check-item--missing'
      );
    } else if (
      status === 'VERIFIED'
    ) {
      icon.textContent = '✓';
      message.textContent =
        'Verified';

      item.classList.add(
        'chef-review-check-item--complete'
      );
    } else if (
      status === 'REJECTED'
    ) {
      icon.textContent = '!';
      message.textContent =
        documentType.rejectionReason ||
        'Changes required';

      item.classList.add(
        'chef-review-check-item--missing'
      );
    } else {
      icon.textContent = '✓';
      message.textContent =
        'Submitted · Verification pending';

      item.classList.add(
        'chef-review-check-item--pending'
      );
    }

    content.appendChild(title);
    content.appendChild(message);

    item.appendChild(icon);
    item.appendChild(content);

    return item;
  }

  function renderKyc() {
    if (!elements.kycList) {
      return;
    }

    elements.kycList.innerHTML = '';

    const kyc =
      getKyc();

    const requiredDocuments =
      Array.isArray(
        kyc.requiredDocuments
      )
        ? kyc.requiredDocuments
        : [
          'AADHAAR',
          'PAN',
          'FSSAI'
        ];

    const documents =
      Array.isArray(kyc.documents)
        ? kyc.documents
        : [];

    requiredDocuments.forEach(
      function(documentType) {
        const matchingDocument =
          documents.find(
            function(item) {
              return (
                normalizeStatus(
                  item.documentType
                ) ===
                normalizeStatus(
                  documentType
                )
              );
            }
          ) || null;

        const displayDocument =
          matchingDocument || {
            documentType:
              documentType,
            verificationStatus:
              'NOT_SUBMITTED'
          };

        const item =
          createKycItem(
            displayDocument,
            document
          );

        if (!matchingDocument) {
          item.classList.add(
            'chef-review-check-item--missing'
          );

          const small =
            item.querySelector('small');

          if (small) {
            small.textContent =
              'Not submitted';
          }

          const icon =
            item.querySelector(
              '.chef-review-check-item__icon'
            );

          if (icon) {
            icon.textContent = '!';
          }
        }

        elements.kycList
          .appendChild(item);
      }
    );
  }

  function renderPayout() {
    const account =
      getPayoutAccount();

    if (!account) {
      setText(
        elements.payoutMethod,
        'Payout details missing'
      );

      setText(
        elements.payoutDetails,
        'Add Bank Account or UPI ID.'
      );

      setText(
        elements.payoutStatus,
        'Not submitted'
      );

      return;
    }

    const method =
      normalizeStatus(
        account.preferredPayoutMethod
      );

    const status =
      normalizeStatus(
        account.verificationStatus
      ) || 'PENDING';

    setText(
      elements.payoutMethod,
      method === 'BANK'
        ? 'Bank Account'
        : 'UPI ID'
    );

    if (method === 'BANK') {
      setText(
        elements.payoutDetails,
        (
          account.bankName ||
          'Bank'
        ) +
        ' · Account ending ' +
        (
          account.accountLast4 ||
          '—'
        ) +
        ' · ' +
        (
          account.ifsc ||
          '—'
        )
      );
    } else {
      setText(
        elements.payoutDetails,
        account.upiIdMasked ||
        'Saved UPI ID'
      );
    }

    if (status === 'VERIFIED') {
      setText(
        elements.payoutStatus,
        'Verified'
      );
    } else if (
      status === 'REJECTED'
    ) {
      setText(
        elements.payoutStatus,
        account.rejectionReason ||
        'Changes required'
      );
    } else {
      setText(
        elements.payoutStatus,
        'Submitted · Verification pending'
      );
    }
  }

  function renderStatus() {
    const ready =
      isReviewReady();

    const submitted =
      isAlreadySubmitted();

    if (submitted) {
      setStatusType('pending');

      setText(
        elements.statusIcon,
        '✓'
      );

      setText(
        elements.statusTitle,
        'Kitchen submitted'
      );

      setText(
        elements.statusMessage,
        'Your Kitchen is under verification. You will be notified after Admin review.'
      );

      setText(
        elements.saveStatus,
        'Submitted'
      );

      return;
    }

    if (ready) {
      setStatusType('approved');

      setText(
        elements.statusIcon,
        '✓'
      );

      setText(
        elements.statusTitle,
        'Ready for submission'
      );

      setText(
        elements.statusMessage,
        'All required onboarding details are complete.'
      );

      setText(
        elements.saveStatus,
        'Ready'
      );

      return;
    }

    setStatusType('rejected');

    setText(
      elements.statusIcon,
      '!'
    );

    setText(
      elements.statusTitle,
      'Onboarding incomplete'
    );

    setText(
      elements.statusMessage,
      'Complete the missing details before submitting your Kitchen.'
    );

    setText(
      elements.saveStatus,
      'Incomplete'
    );
  }

  function renderSubmitButton() {
    const button =
      elements.submitButton;

    if (!button) {
      return;
    }

    if (state.submitting) {
      button.disabled = true;
      button.textContent =
        'SUBMITTING KITCHEN…';

      return;
    }

    if (isAlreadySubmitted()) {
      button.disabled = false;
      button.textContent =
        'RETURN TO ONBOARDING';

      button.dataset.action =
        'return';

      return;
    }

    if (!isReviewReady()) {
      button.disabled = false;
      button.textContent =
        'COMPLETE MISSING DETAILS';

      button.dataset.action =
        'onboarding';

      return;
    }

    button.disabled = false;
    button.textContent =
      'SUBMIT KITCHEN FOR APPROVAL';

    button.dataset.action =
      'submit';
  }

  function render() {
    renderKitchen();
    renderAddress();
    renderKyc();
    renderPayout();
    renderStatus();
    renderSubmitButton();

    setHidden(
      elements.content,
      false
    );

    setHidden(
      elements.error,
      true
    );
  }

  function showLoadError(error) {
    const message =
      cleanText(
        error &&
        error.message
      ) ||
      'Review details could not be loaded.';

    setStatusType('rejected');

    setText(
      elements.statusIcon,
      '!'
    );

    setText(
      elements.statusTitle,
      'Unable to load review'
    );

    setText(
      elements.statusMessage,
      message
    );

    setText(
      elements.saveStatus,
      'Not loaded'
    );

    setText(
      elements.error,
      message
    );

    setHidden(
      elements.error,
      false
    );

    setHidden(
      elements.content,
      true
    );

    if (elements.submitButton) {
      elements.submitButton.disabled =
        false;

      elements.submitButton.textContent =
        'RETRY';

      elements.submitButton.dataset.action =
        'retry';
    }
  }

  async function loadReview() {
    if (state.loading) {
      return;
    }

    state.loading = true;
    setLoadingStatus();

    try {
      const responses =
        await Promise.all([
          window.ApnaBiteAPI.request(
            'chef.onboarding',
            {},
            {
              retry: false,
              deduplicate: false,
              timeoutMs: 20000
            }
          ),
          window.ApnaBiteAPI.request(
            'address.list',
            {},
            {
              retry: false,
              deduplicate: false,
              timeoutMs: 20000
            }
          )
        ]);

      state.onboarding =
        getResponseData(
          responses[0]
        );

      const addressData =
        getResponseData(
          responses[1]
        );

      state.addresses =
        Array.isArray(
          addressData.addresses
        )
          ? addressData.addresses
          : [];

      if (!getKitchen()) {
        throw new Error(
          'Kitchen profile could not be found.'
        );
      }

      render();
    } catch (error) {
      showLoadError(error);
      handleError(error);
    } finally {
      state.loading = false;
    }
  }

  async function submitKitchen() {
    if (
      state.submitting ||
      !isReviewReady()
    ) {
      return;
    }

    state.submitting = true;
    renderSubmitButton();

    setText(
      elements.saveStatus,
      'Submitting…'
    );

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.kitchen.submit',
          {},
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 30000
          }
        );

      const data =
        getResponseData(response);

      if (
        !data.submitted &&
        !data.kitchen
      ) {
        throw new Error(
          'Kitchen submission was not confirmed.'
        );
      }

      showToast(
        'Kitchen submitted for approval.',
        'success'
      );

      await loadReview();
    } catch (error) {
      handleError(error);

      showToast(
        cleanText(
          error &&
          error.message
        ) ||
        'Kitchen could not be submitted.',
        'error'
      );
    } finally {
      state.submitting = false;
      renderSubmitButton();
    }
  }

  function bindEvents() {
    if (elements.backButton) {
      elements.backButton.addEventListener(
        'click',
        function() {
          window.location.href =
            'onboarding.html';
        }
      );
    }

    if (elements.editProfile) {
      elements.editProfile.addEventListener(
        'click',
        function() {
          window.location.href =
            'kitchen-profile.html';
        }
      );
    }

    if (elements.editAddress) {
      elements.editAddress.addEventListener(
        'click',
        function() {
          window.location.href =
            'kitchen-address.html';
        }
      );
    }

    if (elements.editKyc) {
      elements.editKyc.addEventListener(
        'click',
        function() {
          window.location.href =
            'kyc.html';
        }
      );
    }

    if (elements.editPayout) {
      elements.editPayout.addEventListener(
        'click',
        function() {
          window.location.href =
            'payout.html';
        }
      );
    }

    if (elements.submitButton) {
      elements.submitButton.addEventListener(
        'click',
        function() {
          const action =
            elements.submitButton
              .dataset.action;

          if (action === 'retry') {
            loadReview();
            return;
          }

          if (
            action === 'return' ||
            action === 'onboarding'
          ) {
            window.location.href =
              'onboarding.html';

            return;
          }

          if (action === 'submit') {
            submitKitchen();
          }
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
          loadReview();
        }
      }
    );
  }

  function validateLocalSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      showLoadError(
        new Error(
          'Required application files did not load.'
        )
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
      window.ApnaBiteCore
        .getSessionToken &&
      window.ApnaBiteCore
        .getSessionToken()
    );
  }

  function initialize() {
    if (
      !document.body.classList
        .contains(
          'chef-review-page'
        ) ||
      state.initialized
    ) {
      return;
    }

    getElements();
    bindEvents();

    state.initialized = true;

    if (!validateLocalSession()) {
      return;
    }

    loadReview();
  }

  window.ApnaBiteChefReview =
    Object.freeze({
      initialize: initialize,
      loadReview: loadReview
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
