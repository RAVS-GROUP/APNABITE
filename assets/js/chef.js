/**
 * ============================================================
 * APNABITE V1 — CHEF ONBOARDING CONTROLLER
 * File: assets/js/chef.js
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const STEP_CONFIG = Object.freeze([
    { key: 'kitchen', label: 'Kitchen Profile', page: 'kitchen-profile.html' },
    { key: 'address', label: 'Kitchen Address', page: 'kitchen-address.html' },
    { key: 'image', label: 'Kitchen Image', page: 'kitchen-image.html' },
    { key: 'kyc', label: 'KYC Documents', page: 'kyc.html' },
    { key: 'payout', label: 'Payout Details', page: 'payout.html' },
    { key: 'review', label: 'Review & Submit', page: 'review.html' }
  ]);

  const REQUIRED_STEPS = Object.freeze([
    'kitchen',
    'address',
    'image',
    'kyc',
    'payout'
  ]);

  const state = {
    initialized: false,
    loading: false,
    submitting: false,
    user: null,
    onboarding: null,
    kitchen: null,
    steps: {},
    completedCount: 0,
    totalRequiredSteps: REQUIRED_STEPS.length,
    canSubmit: false,
    submitted: false,
    approved: false,
    rejected: false
  };

  const elements = {};

  function byId() {
    for (let index = 0; index < arguments.length; index++) {
      const element = document.getElementById(arguments[index]);
      if (element) return element;
    }
    return null;
  }

  function cleanText(value) {
    return String(value === null || value === undefined ? '' : value)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeStatus(value) {
    return cleanText(value).toUpperCase().replace(/\s+/g, '_');
  }

  function booleanValue() {
    for (let index = 0; index < arguments.length; index++) {
      const value = arguments[index];

      if (
        value === true ||
        value === 'true' ||
        value === 'TRUE' ||
        value === 1 ||
        value === '1' ||
        value === 'YES'
      ) {
        return true;
      }

      if (
        value === false ||
        value === 'false' ||
        value === 'FALSE' ||
        value === 0 ||
        value === '0' ||
        value === 'NO' ||
        value === null ||
        value === undefined ||
        value === ''
      ) {
        continue;
      }

      if (typeof value === 'string' && value.trim()) return true;
    }

    return false;
  }

  function setText(element, value) {
    if (element) element.textContent = cleanText(value);
  }

  function getElements() {
    elements.logoutButton = byId('chef-logout-button', 'logout-button');
    elements.welcomeTitle = byId('chef-welcome-title');
    elements.progressText = byId(
      'chef-progress-text',
      'chef-progress-value',
      'onboarding-progress-value'
    );
    elements.progressBar = byId(
      'chef-progress-bar',
      'onboarding-progress-bar'
    );
    elements.progressTrack = elements.progressBar
      ? elements.progressBar.parentElement
      : null;
    elements.statusCard = byId(
      'chef-status-card',
      'onboarding-status-card'
    );
    elements.statusIcon = byId(
      'chef-status-icon',
      'onboarding-status-icon'
    );
    elements.statusTitle = byId(
      'chef-status-title',
      'onboarding-status-title'
    );
    elements.statusMessage = byId(
      'chef-status-message',
      'chef-status-text',
      'onboarding-status-text'
    );
    elements.approvalSection = byId(
      'chef-approval-section',
      'onboarding-approval-section'
    );
    elements.approvalIcon = byId('chef-approval-icon');
    elements.approvalTitle = byId(
      'chef-approval-title',
      'onboarding-approval-title'
    );
    elements.approvalMessage = byId(
      'chef-approval-message',
      'chef-approval-text',
      'onboarding-approval-text'
    );
    elements.primaryButton = byId(
      'chef-continue-button',
      'chef-primary-button',
      'onboarding-primary-button',
      'continue-onboarding-button'
    );

    STEP_CONFIG.forEach(function(step) {
      elements['step_' + step.key] =
        byId('chef-step-' + step.key, 'onboarding-step-' + step.key) ||
        document.querySelector('[data-step="' + step.key + '"]') ||
        document.querySelector('[data-onboarding-step="' + step.key + '"]');
    });
  }

  function getResponseData(response) {
    return response && response.data && typeof response.data === 'object'
      ? response.data
      : {};
  }

  function getLocalUser() {
    if (!window.ApnaBiteCore) return null;

    if (typeof window.ApnaBiteCore.getCurrentUser === 'function') {
      return window.ApnaBiteCore.getCurrentUser();
    }

    if (typeof window.ApnaBiteCore.getSessionUser === 'function') {
      return window.ApnaBiteCore.getSessionUser();
    }

    return null;
  }

  function updateChefName(user) {
    const fullName = cleanText(
      user && (user.fullName || user.name || user.Full_Name)
    );
    const firstName = fullName ? fullName.split(/\s+/)[0] : 'Chef';

    if (elements.welcomeTitle) {
      elements.welcomeTitle.textContent = 'Welcome, ' + firstName + '!';
    }

    document.querySelectorAll('[data-chef-name]').forEach(function(element) {
      element.textContent = firstName;
    });
  }

  function getKitchen(data) {
    if (data.kitchen && typeof data.kitchen === 'object') {
      return data.kitchen;
    }

    if (data.chefKitchen && typeof data.chefKitchen === 'object') {
      return data.chefKitchen;
    }

    return null;
  }

  function hasKitchenProfile(data, kitchen) {
    return booleanValue(
      data.kitchenProfileComplete,
      data.hasKitchenProfile,
      data.steps && data.steps.kitchen,
      kitchen && (kitchen.kitchenId || kitchen.Kitchen_ID)
    );
  }

  function hasKitchenAddress(data, kitchen) {
    return booleanValue(
      data.kitchenAddressComplete,
      data.hasKitchenAddress,
      data.addressComplete,
      data.steps && data.steps.address,
      kitchen && (kitchen.addressId || kitchen.Address_ID)
    );
  }

  function hasKitchenImage(data, kitchen) {
    return booleanValue(
      data.kitchenImageComplete,
      data.hasKitchenImage,
      data.imageComplete,
      data.steps && data.steps.image,
      kitchen && (
        kitchen.thumbnailFileId ||
        kitchen.kitchenThumbnailFileId ||
        kitchen.Kitchen_Thumbnail_File_ID
      )
    );
  }

  function hasKyc(data) {
    const kyc = data.kyc || data.kycSummary || {};
    const status = normalizeStatus(
      data.kycStatus || kyc.overallStatus || kyc.status
    );

    return booleanValue(
      data.kycComplete,
      data.hasRequiredKyc,
      data.steps && data.steps.kyc,
      ['COMPLETE', 'SUBMITTED', 'PENDING', 'VERIFIED', 'APPROVED']
        .includes(status)
    );
  }

  function hasPayout(data) {
    const payout = data.payout || data.payoutAccount || {};

    return booleanValue(
      data.payoutComplete,
      data.hasPayoutAccount,
      data.steps && data.steps.payout,
      payout.payoutAccountId || payout.Payout_Account_ID
    );
  }

  function buildSteps(data, kitchen) {
    const steps = {
      kitchen: hasKitchenProfile(data, kitchen),
      address: hasKitchenAddress(data, kitchen),
      image: hasKitchenImage(data, kitchen),
      kyc: hasKyc(data),
      payout: hasPayout(data)
    };

    steps.review = REQUIRED_STEPS.every(function(key) {
      return steps[key];
    });

    return steps;
  }

  function getSubmissionStatus(data, kitchen) {
    return normalizeStatus(
      data.onboardingStatus ||
      data.submissionStatus ||
      data.adminApprovalStatus ||
      (kitchen && (
        kitchen.adminApprovalStatus ||
        kitchen.kitchenStatus ||
        kitchen.Admin_Approval_Status ||
        kitchen.Kitchen_Status
      ))
    );
  }

  function normalizeOnboarding(data) {
    const kitchen = getKitchen(data);
    const steps = buildSteps(data, kitchen);
    const completedCount = REQUIRED_STEPS.filter(function(key) {
      return steps[key];
    }).length;
    const status = getSubmissionStatus(data, kitchen);

    const approved = [
      'APPROVED',
      'VERIFIED',
      'ACTIVE'
    ].includes(status);

    const submitted = approved || [
      'PENDING_APPROVAL',
      'SUBMITTED',
      'UNDER_REVIEW'
    ].includes(status);

    const rejected = [
      'REJECTED',
      'CHANGES_REQUIRED'
    ].includes(status);

    return {
      raw: data,
      kitchen: kitchen,
      steps: steps,
      completedCount: completedCount,
      status: status,
      canSubmit:
        completedCount === REQUIRED_STEPS.length &&
        !submitted &&
        !approved,
      submitted: submitted,
      approved: approved,
      rejected: rejected,
      rejectionReason: cleanText(
        data.rejectionReason ||
        (kitchen && (
          kitchen.rejectionReason ||
          kitchen.suspensionReason ||
          kitchen.Rejection_Reason
        ))
      )
    };
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);

    if (elements.primaryButton && !state.submitting) {
      elements.primaryButton.disabled = state.loading;

      if (state.loading) {
        elements.primaryButton.textContent = 'LOADING…';
      }
    }
  }

  function getStepStatusElement(card) {
    if (!card) return null;

    return (
      card.querySelector('[data-step-status]') ||
      card.querySelector('.chef-step-status') ||
      card.querySelector('.onboarding-step__status') ||
      card.querySelector('.onboarding-step-card__status')
    );
  }

  function getStepNumberElement(card) {
    if (!card) return null;

    return (
      card.querySelector('.chef-step-card__number') ||
      card.querySelector('.onboarding-step__number') ||
      card.querySelector('.onboarding-step-card__number') ||
      card.querySelector('.onboarding-step__icon')
    );
  }

  function updateStepCard(step, complete, current, locked) {
    const card = elements['step_' + step.key];
    if (!card) return;

    card.classList.toggle('chef-step-card--complete', complete);
    card.classList.toggle('chef-step-card--current', current);
    card.classList.toggle('chef-step-card--locked', locked);
    card.classList.toggle('onboarding-step--complete', complete);
    card.classList.toggle('onboarding-step--current', current);

    const statusElement = getStepStatusElement(card);
    const numberElement = getStepNumberElement(card);
    const unavailable = state.submitted || state.approved || locked;

    if (complete) {
      setText(statusElement, 'Completed');
      setText(numberElement, '✓');
    } else if (locked) {
      setText(statusElement, 'Locked');
      setText(numberElement, step.key === 'review' ? '6' : numberElement.textContent);
    } else if (current) {
      setText(statusElement, 'Continue');
    } else {
      setText(statusElement, 'Pending');
    }

    card.setAttribute('aria-disabled', unavailable ? 'true' : 'false');

    const button = card.querySelector('button');
    if (button) button.disabled = unavailable;
  }

  function renderSteps() {
    let firstIncompleteFound = false;

    STEP_CONFIG.forEach(function(step, index) {
      const complete = Boolean(state.steps[step.key]);
      let current = false;
      let locked = false;

      if (step.key === 'review') {
        locked = !state.steps.review;
      } else if (
        index > 0 &&
        !state.steps[STEP_CONFIG[index - 1].key]
      ) {
        locked = true;
      }

      if (!complete && !locked && !firstIncompleteFound) {
        current = true;
        firstIncompleteFound = true;
      }

      updateStepCard(step, complete, current, locked);
    });
  }

  function renderProgress() {
    const percentage = Math.round(
      (state.completedCount / state.totalRequiredSteps) * 100
    );

    if (elements.progressBar) {
      elements.progressBar.style.width = percentage + '%';
    }

    if (elements.progressTrack) {
      elements.progressTrack.setAttribute(
        'aria-valuenow',
        String(percentage)
      );
    }

    setText(elements.progressText, percentage + '%');
  }

  function setStatusType(type) {
    if (!elements.statusCard) return;

    elements.statusCard.classList.remove(
      'chef-status-card--loading',
      'chef-status-card--pending',
      'chef-status-card--approved',
      'chef-status-card--rejected'
    );

    if (type) {
      elements.statusCard.classList.add('chef-status-card--' + type);
    }
  }

  function renderStatus() {
    if (state.approved) {
      setStatusType('approved');
      setText(elements.statusIcon, '✓');
      setText(elements.statusTitle, 'Kitchen approved');
      setText(
        elements.statusMessage,
        'Your Kitchen is approved. You can now manage your menu and availability.'
      );
      return;
    }

    if (state.rejected) {
      setStatusType('rejected');
      setText(elements.statusIcon, '!');
      setText(elements.statusTitle, 'Changes required');
      setText(
        elements.statusMessage,
        state.onboarding.rejectionReason ||
        'Review the requested changes and submit your Kitchen again.'
      );
      return;
    }

    if (state.submitted) {
      setStatusType('pending');
      setText(elements.statusIcon, '◷');
      setText(elements.statusTitle, 'Approval pending');
      setText(
        elements.statusMessage,
        'Your Kitchen details are being reviewed by ApnaBite Admin.'
      );
      return;
    }

    setStatusType('');

    if (state.completedCount === state.totalRequiredSteps) {
      setText(elements.statusIcon, '✓');
      setText(elements.statusTitle, 'Ready to submit');
      setText(
        elements.statusMessage,
        'All required onboarding details are complete.'
      );
      return;
    }

    setText(elements.statusIcon, '●');
    setText(elements.statusTitle, 'Complete your onboarding');
    setText(
      elements.statusMessage,
      'Complete the remaining requirements to submit your Kitchen for approval.'
    );
  }

  function renderApprovalSection() {
    if (!elements.approvalSection) return;

    const visible = state.submitted || state.approved || state.rejected;
    elements.approvalSection.hidden = !visible;

    if (!visible) return;

    if (state.approved) {
      setText(elements.approvalIcon, '✓');
      setText(elements.approvalTitle, 'Approved by ApnaBite');
      setText(
        elements.approvalMessage,
        'Your Kitchen can now be activated and shown to nearby Customers.'
      );
    } else if (state.rejected) {
      setText(elements.approvalIcon, '!');
      setText(elements.approvalTitle, 'Update required');
      setText(
        elements.approvalMessage,
        state.onboarding.rejectionReason ||
        'Correct the requested details and submit again.'
      );
    } else {
      setText(elements.approvalIcon, '⏳');
      setText(elements.approvalTitle, 'Verification in progress');
      setText(
        elements.approvalMessage,
        'You can start receiving Orders after Admin approval.'
      );
    }
  }

  function getFirstIncompleteStep() {
    return STEP_CONFIG.find(function(step) {
      return step.key !== 'review' && !state.steps[step.key];
    }) || null;
  }

  function renderPrimaryButton() {
    const button = elements.primaryButton;
    if (!button) return;

    delete button.dataset.step;

    if (state.approved) {
      button.disabled = false;
      button.textContent = 'GO TO CHEF DASHBOARD';
      button.dataset.action = 'dashboard';
      return;
    }

    if (state.submitted) {
      button.disabled = true;
      button.textContent = 'APPROVAL PENDING';
      button.dataset.action = 'pending';
      return;
    }

    if (state.canSubmit) {
      button.disabled = false;
      button.textContent = state.rejected
        ? 'RESUBMIT FOR APPROVAL'
        : 'REVIEW & SUBMIT';
      button.dataset.action = 'review';
      return;
    }

    const nextStep = getFirstIncompleteStep();

    button.disabled = !nextStep;
    button.textContent = nextStep
      ? 'CONTINUE: ' + nextStep.label.toUpperCase()
      : 'CONTINUE ONBOARDING';
    button.dataset.action = 'continue';
    button.dataset.step = nextStep ? nextStep.key : '';
  }

  function render() {
    renderProgress();
    renderSteps();
    renderStatus();
    renderApprovalSection();
    renderPrimaryButton();
  }

  function openStep(stepKey) {
    if (state.submitted || state.approved) return;

    const step = STEP_CONFIG.find(function(item) {
      return item.key === stepKey;
    });

    if (!step) return;

    const card = elements['step_' + step.key];

    if (
      card &&
      card.getAttribute('aria-disabled') === 'true'
    ) {
      window.ApnaBiteUI.showToast(
        'Complete the previous step first.',
        'warning'
      );
      return;
    }

    window.location.href = step.page;
  }

  async function submitForApproval() {
    if (state.submitting || !state.canSubmit) return;

    const kitchenId = state.kitchen && (
      state.kitchen.kitchenId ||
      state.kitchen.Kitchen_ID
    );

    if (!kitchenId) {
      window.ApnaBiteUI.showToast(
        'Kitchen profile could not be found.',
        'error'
      );
      return;
    }

    state.submitting = true;

    window.ApnaBiteUI.setButtonLoading(
      elements.primaryButton,
      true,
      'SUBMITTING…'
    );

    try {
      await window.ApnaBiteAPI.request(
        'chef.kitchen.submit',
        { kitchenId: kitchenId },
        { retry: false, deduplicate: false }
      );

      window.ApnaBiteUI.showToast(
        'Kitchen submitted for approval.',
        'success'
      );

      await loadOnboarding();
    } catch (error) {
      window.ApnaBiteUI.handleApiError(
        error,
        { redirectToLogin: true }
      );
    } finally {
      state.submitting = false;

      window.ApnaBiteUI.setButtonLoading(
        elements.primaryButton,
        false
      );

      renderPrimaryButton();
    }
  }

  function handlePrimaryAction() {
    const button = elements.primaryButton;
    if (!button || button.disabled) return;

    const action = button.dataset.action;

    if (action === 'dashboard') {
      window.location.href = 'dashboard.html';
    } else if (action === 'review') {
      openStep('review');
    } else if (action === 'submit') {
      submitForApproval();
    } else if (action === 'continue') {
      openStep(button.dataset.step);
    }
  }

  function bindStepEvents() {
    STEP_CONFIG.forEach(function(step) {
      const card = elements['step_' + step.key];
      if (!card) return;

      card.addEventListener('click', function(event) {
        if (
          event.target.closest('button') &&
          event.target.closest('button').disabled
        ) {
          return;
        }

        if (card.getAttribute('aria-disabled') === 'true') return;
        openStep(step.key);
      });
    });
  }

  async function logout() {
    if (!elements.logoutButton) return;

    window.ApnaBiteUI.setButtonLoading(
      elements.logoutButton,
      true,
      'WAIT…'
    );

    try {
      await window.ApnaBiteAPI.logout();
    } catch (error) {
      window.ApnaBiteAPI.clearSessionToken();
    }

    window.ApnaBiteCore.clearSession();
    window.location.replace('../login.html');
  }

  async function validateChefSession() {
    if (!window.ApnaBiteCore.requireLocalSession(['CHEF'])) {
      return null;
    }

    try {
      const response = await window.ApnaBiteAPI.validateSession();
      const user = response && response.data
        ? response.data.user
        : null;

      if (!user || normalizeStatus(user.role) !== 'CHEF') {
        window.ApnaBiteCore.clearSession();
        window.ApnaBiteCore.navigate('login.html', true);
        return null;
      }

      window.ApnaBiteCore.saveSession({
        sessionToken: window.ApnaBiteCore.getSessionToken(),
        user: user
      });

      state.user = user;
      updateChefName(user);
      return user;
    } catch (error) {
      window.ApnaBiteUI.handleApiError(
        error,
        { redirectToLogin: true }
      );
      return null;
    }
  }

  async function loadOnboarding() {
    if (state.loading) return;

    setLoading(true);

    try {
      const response = await window.ApnaBiteAPI.request(
        'chef.onboarding',
        {},
        { retry: true, deduplicate: true }
      );

      const normalized = normalizeOnboarding(
        getResponseData(response)
      );

      state.onboarding = normalized;
      state.kitchen = normalized.kitchen;
      state.steps = normalized.steps;
      state.completedCount = normalized.completedCount;
      state.canSubmit = normalized.canSubmit;
      state.submitted = normalized.submitted;
      state.approved = normalized.approved;
      state.rejected = normalized.rejected;

      render();
    } catch (error) {
      setStatusType('rejected');
      setText(elements.statusIcon, '!');
      setText(elements.statusTitle, 'Unable to load onboarding');
      setText(
        elements.statusMessage,
        'Check your internet connection and try again.'
      );

      if (elements.primaryButton) {
        elements.primaryButton.disabled = false;
        elements.primaryButton.textContent = 'RETRY';
        elements.primaryButton.dataset.action = 'retry';
      }

      window.ApnaBiteUI.handleApiError(
        error,
        { redirectToLogin: true }
      );
    } finally {
      setLoading(false);
    }
  }

  function bindEvents() {
    if (elements.logoutButton) {
      elements.logoutButton.addEventListener('click', logout);
    }

    if (elements.primaryButton) {
      elements.primaryButton.addEventListener('click', function() {
        if (elements.primaryButton.dataset.action === 'retry') {
          loadOnboarding();
          return;
        }

        handlePrimaryAction();
      });
    }

    bindStepEvents();

    window.addEventListener('pageshow', function(event) {
      if (event.persisted && state.initialized) {
        loadOnboarding();
      }
    });
  }

  async function initialize() {
    if (!document.body.classList.contains('chef-onboarding-page')) {
      return;
    }

    if (state.initialized) return;
    state.initialized = true;

    getElements();

    const localUser = getLocalUser();
    if (localUser) updateChefName(localUser);

    const user = await validateChefSession();
    if (!user) return;

    bindEvents();
    await loadOnboarding();
  }

  window.ApnaBiteChef = Object.freeze({
    initialize: initialize,
    loadOnboarding: loadOnboarding,
    openStep: openStep,
    submitForApproval: submitForApproval
  });

  window.ApnaBiteCore.ready(initialize);
})(window, document);
