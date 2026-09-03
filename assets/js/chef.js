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
    {
      key: 'kitchen',
      label: 'Kitchen Profile',
      page: 'kitchen-profile.html'
    },
    {
      key: 'address',
      label: 'Kitchen Address',
      page: 'kitchen-address.html'
    },
    {
      key: 'image',
      label: 'Kitchen Image',
      page: 'kitchen-image.html'
    },
    {
      key: 'kyc',
      label: 'KYC Documents',
      page: 'kyc.html'
    },
    {
      key: 'payout',
      label: 'Payout Details',
      page: 'payout.html'
    },
    {
      key: 'review',
      label: 'Review & Submit',
      page: 'review.html'
    }
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
    totalRequiredSteps: 5,
    canSubmit: false,
    submitted: false,
    approved: false,
    rejected: false
  };

  const elements = {};

  function byId() {
    for (
      let index = 0;
      index < arguments.length;
      index++
    ) {
      const element =
        document.getElementById(
          arguments[index]
        );

      if (element) {
        return element;
      }
    }

    return null;
  }

  function getElements() {
    elements.logoutButton = byId(
      'chef-logout-button',
      'logout-button'
    );

    elements.chefName = byId(
      'chef-name',
      'chef-welcome-name'
    );

    elements.progressBar = byId(
      'onboarding-progress-bar',
      'chef-progress-bar'
    );

    elements.progressValue = byId(
      'onboarding-progress-value',
      'chef-progress-value'
    );

    elements.progressLabel = byId(
      'onboarding-progress-label',
      'chef-progress-label'
    );

    elements.statusCard = byId(
      'onboarding-status-card',
      'chef-status-card'
    );

    elements.statusIcon = byId(
      'onboarding-status-icon',
      'chef-status-icon'
    );

    elements.statusTitle = byId(
      'onboarding-status-title',
      'chef-status-title'
    );

    elements.statusText = byId(
      'onboarding-status-text',
      'chef-status-text'
    );

    elements.approvalSection = byId(
      'chef-approval-section',
      'onboarding-approval-section',
      'approval-section'
    );

    elements.approvalTitle = byId(
      'chef-approval-title',
      'onboarding-approval-title'
    );

    elements.approvalText = byId(
      'chef-approval-text',
      'onboarding-approval-text'
    );

    elements.primaryButton = byId(
      'chef-primary-button',
      'onboarding-primary-button',
      'continue-onboarding-button'
    );

    elements.loading = byId(
      'chef-onboarding-loading',
      'onboarding-loading'
    );

    elements.content = byId(
      'chef-onboarding-content',
      'onboarding-content'
    );

    STEP_CONFIG.forEach(function(step) {
      const card =
        byId(
          'onboarding-step-' + step.key,
          'chef-step-' + step.key,
          step.key + '-step'
        ) ||
        document.querySelector(
          '[data-onboarding-step="' +
          step.key +
          '"]'
        ) ||
        document.querySelector(
          '[data-step="' +
          step.key +
          '"]'
        );

      elements[
        'step_' + step.key
      ] = card;
    });
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function booleanValue() {
    for (
      let index = 0;
      index < arguments.length;
      index++
    ) {
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
        value === 'NO'
      ) {
        return false;
      }
    }

    return false;
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = Boolean(hidden);
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent =
        cleanText(value);
    }
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);

    setHidden(
      elements.loading,
      !state.loading
    );

    if (elements.content) {
      elements.content.hidden =
        state.loading;
    }

    if (
      elements.primaryButton &&
      !state.submitting
    ) {
      elements.primaryButton.disabled =
        state.loading;
    }
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

  function getLocalUser() {
    if (
      !window.ApnaBiteCore ||
      typeof window.ApnaBiteCore
        .getCurrentUser !== 'function'
    ) {
      return null;
    }

    return window.ApnaBiteCore
      .getCurrentUser();
  }

  function updateChefName(user) {
    const fullName =
      cleanText(
        user &&
        (
          user.fullName ||
          user.name
        )
      );

    const firstName =
      fullName
        ? fullName.split(/\s+/)[0]
        : 'Chef';

    if (elements.chefName) {
      elements.chefName.textContent =
        firstName;
    }

    document
      .querySelectorAll(
        '[data-chef-name]'
      )
      .forEach(function(element) {
        element.textContent =
          firstName;
      });
  }

  function normalizeStatus(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function getKitchen(data) {
    if (
      data.kitchen &&
      typeof data.kitchen === 'object'
    ) {
      return data.kitchen;
    }

    if (
      data.chefKitchen &&
      typeof data.chefKitchen === 'object'
    ) {
      return data.chefKitchen;
    }

    return null;
  }

  function hasKitchenProfile(
    data,
    kitchen
  ) {
    return booleanValue(
      data.kitchenProfileComplete,
      data.hasKitchenProfile,
      data.steps &&
        data.steps.kitchen,
      kitchen &&
        (
          kitchen.kitchenId ||
          kitchen.Kitchen_ID
        )
    );
  }

  function hasKitchenAddress(
    data,
    kitchen
  ) {
    return booleanValue(
      data.kitchenAddressComplete,
      data.hasKitchenAddress,
      data.addressComplete,
      data.steps &&
        data.steps.address,
      kitchen &&
        (
          kitchen.addressId ||
          kitchen.Address_ID
        )
    );
  }

  function hasKitchenImage(
    data,
    kitchen
  ) {
    return booleanValue(
      data.kitchenImageComplete,
      data.hasKitchenImage,
      data.imageComplete,
      data.steps &&
        data.steps.image,
      kitchen &&
        (
          kitchen.thumbnailFileId ||
          kitchen.kitchenThumbnailFileId ||
          kitchen.Kitchen_Thumbnail_File_ID
        )
    );
  }

  function hasKyc(data) {
    const kyc =
      data.kyc ||
      data.kycSummary ||
      {};

    const status = normalizeStatus(
      data.kycStatus ||
      kyc.overallStatus ||
      kyc.status
    );

    return booleanValue(
      data.kycComplete,
      data.hasRequiredKyc,
      data.steps &&
        data.steps.kyc,
      status === 'COMPLETE',
      status === 'SUBMITTED',
      status === 'PENDING',
      status === 'VERIFIED',
      status === 'APPROVED'
    );
  }

  function hasPayout(data) {
    const payout =
      data.payout ||
      data.payoutAccount ||
      {};

    return booleanValue(
      data.payoutComplete,
      data.hasPayoutAccount,
      data.steps &&
        data.steps.payout,
      payout &&
        (
          payout.payoutAccountId ||
          payout.Payout_Account_ID
        )
    );
  }

  function buildSteps(data, kitchen) {
    const kitchenComplete =
      hasKitchenProfile(
        data,
        kitchen
      );

    const addressComplete =
      hasKitchenAddress(
        data,
        kitchen
      );

    const imageComplete =
      hasKitchenImage(
        data,
        kitchen
      );

    const kycComplete =
      hasKyc(data);

    const payoutComplete =
      hasPayout(data);

    const requiredComplete =
      kitchenComplete &&
      addressComplete &&
      imageComplete &&
      kycComplete &&
      payoutComplete;

    return {
      kitchen: kitchenComplete,
      address: addressComplete,
      image: imageComplete,
      kyc: kycComplete,
      payout: payoutComplete,
      review: requiredComplete
    };
  }

  function getSubmissionStatus(
    data,
    kitchen
  ) {
    return normalizeStatus(
      data.onboardingStatus ||
      data.submissionStatus ||
      data.adminApprovalStatus ||
      (
        kitchen &&
        (
          kitchen.adminApprovalStatus ||
          kitchen.kitchenStatus
        )
      )
    );
  }

  function normalizeOnboarding(data) {
    const kitchen =
      getKitchen(data);

    const steps =
      buildSteps(
        data,
        kitchen
      );

    const requiredKeys = [
      'kitchen',
      'address',
      'image',
      'kyc',
      'payout'
    ];

    const completedCount =
      requiredKeys.filter(
        function(key) {
          return steps[key];
        }
      ).length;

    const status =
      getSubmissionStatus(
        data,
        kitchen
      );

    const submitted = [
      'PENDING',
      'PENDING_APPROVAL',
      'SUBMITTED',
      'UNDER_REVIEW',
      'APPROVED',
      'VERIFIED',
      'ACTIVE'
    ].includes(status);

    const approved = [
      'APPROVED',
      'VERIFIED',
      'ACTIVE'
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
        completedCount ===
          requiredKeys.length &&
        !submitted,
      submitted: submitted,
      approved: approved,
      rejected: rejected,
      rejectionReason:
        cleanText(
          data.rejectionReason ||
          (
            kitchen &&
            kitchen.rejectionReason
          ) ||
          (
            kitchen &&
            kitchen.suspensionReason
          )
        )
    };
  }

  function getStepStatusElement(card) {
    if (!card) return null;

    return (
      card.querySelector(
        '[data-step-status]'
      ) ||
      card.querySelector(
        '.onboarding-step__status'
      ) ||
      card.querySelector(
        '.onboarding-step-card__status'
      )
    );
  }

  function getStepNumberElement(card) {
    if (!card) return null;

    return (
      card.querySelector(
        '.onboarding-step__number'
      ) ||
      card.querySelector(
        '.onboarding-step-card__number'
      ) ||
      card.querySelector(
        '.onboarding-step__icon'
      ) ||
      card.querySelector(
        '.onboarding-step-card__icon'
      )
    );
  }

  function updateStepCard(
    step,
    complete,
    isCurrent,
    locked
  ) {
    const card =
      elements[
        'step_' + step.key
      ];

    if (!card) return;

    card.classList.toggle(
      'onboarding-step--complete',
      complete
    );

    card.classList.toggle(
      'onboarding-step-card--complete',
      complete
    );

    card.classList.toggle(
      'onboarding-step--current',
      isCurrent
    );

    card.classList.toggle(
      'onboarding-step-card--current',
      isCurrent
    );

    const statusElement =
      getStepStatusElement(card);

    const numberElement =
      getStepNumberElement(card);

    if (complete) {
      setText(
        statusElement,
        'COMPLETED'
      );

      setText(
        numberElement,
        '✓'
      );
    } else if (locked) {
      setText(
        statusElement,
        'LOCKED'
      );
    } else if (isCurrent) {
      setText(
        statusElement,
        'CONTINUE'
      );
    } else {
      setText(
        statusElement,
        'PENDING'
      );
    }

    if ('disabled' in card) {
      card.disabled =
        state.submitted ||
        state.approved ||
        locked;
    }

    card.setAttribute(
      'aria-disabled',
      (
        state.submitted ||
        state.approved ||
        locked
      )
        ? 'true'
        : 'false'
    );
  }

  function renderSteps() {
    let firstIncompleteFound =
      false;

    STEP_CONFIG.forEach(
      function(step, index) {
        const complete =
          Boolean(
            state.steps[step.key]
          );

        let current = false;
        let locked = false;

        if (
          !complete &&
          !firstIncompleteFound
        ) {
          current = true;
          firstIncompleteFound = true;
        }

        if (
          step.key === 'review' &&
          !state.steps.review
        ) {
          locked = true;
          current = false;
        }

        if (
          index > 0 &&
          step.key !== 'review' &&
          !state.steps[
            STEP_CONFIG[index - 1].key
          ]
        ) {
          locked = true;
          current = false;
        }

        updateStepCard(
          step,
          complete,
          current,
          locked
        );
      }
    );
  }

  function renderProgress() {
    const percentage = Math.round(
      (
        state.completedCount /
        state.totalRequiredSteps
      ) * 100
    );

    if (elements.progressBar) {
      elements.progressBar.style.width =
        percentage + '%';

      elements.progressBar.setAttribute(
        'aria-valuenow',
        String(percentage)
      );
    }

    setText(
      elements.progressValue,
      percentage + '%'
    );

    setText(
      elements.progressLabel,
      state.completedCount +
      ' of ' +
      state.totalRequiredSteps +
      ' requirements completed'
    );
  }

  function setStatusCardClass(type) {
    if (!elements.statusCard) return;

    elements.statusCard.classList.remove(
      'onboarding-status-card--pending',
      'onboarding-status-card--approved',
      'onboarding-status-card--rejected'
    );

    if (type) {
      elements.statusCard.classList.add(
        'onboarding-status-card--' +
        type
      );
    }
  }

  function renderStatus() {
    if (state.approved) {
      setStatusCardClass('approved');

      setText(
        elements.statusIcon,
        '✓'
      );

      setText(
        elements.statusTitle,
        'Kitchen approved'
      );

      setText(
        elements.statusText,
        'Your Kitchen onboarding is approved. You can now manage your menu and availability.'
      );

      return;
    }

    if (state.rejected) {
      setStatusCardClass('rejected');

      setText(
        elements.statusIcon,
        '!'
      );

      setText(
        elements.statusTitle,
        'Changes required'
      );

      setText(
        elements.statusText,
        state.onboarding
          .rejectionReason ||
        'Please review the required details and submit your Kitchen again.'
      );

      return;
    }

    if (state.submitted) {
      setStatusCardClass('pending');

      setText(
        elements.statusIcon,
        '◷'
      );

      setText(
        elements.statusTitle,
        'Approval pending'
      );

      setText(
        elements.statusText,
        'Your Kitchen details have been submitted. ApnaBite Admin will review them before activation.'
      );

      return;
    }

    if (
      state.completedCount ===
      state.totalRequiredSteps
    ) {
      setStatusCardClass('');

      setText(
        elements.statusIcon,
        '✓'
      );

      setText(
        elements.statusTitle'
      );

      setText(
        elements.statusTitle,
        'Ready to submit'
      );

      setText(
        elements.statusText,
        'All required onboarding details are complete. Submit your Kitchen for approval.'
      );

      return;
    }

    setStatusCardClass('');

    setText(
      elements.statusIcon,
      '●'
    );

    setText(
      elements.statusTitle,
      'Complete your onboarding'
    );

    setText(
      elements.statusText,
      'Complete the remaining requirements to submit your Kitchen for approval.'
    );
  }

  function renderApprovalSection() {
    if (!elements.approvalSection) {
      return;
    }

    const visible =
      state.submitted ||
      state.approved ||
      state.rejected;

    elements.approvalSection.hidden =
      !visible;

    if (!visible) return;

    if (state.approved) {
      setText(
        elements.approvalTitle,
        'Approved by ApnaBite'
      );

      setText(
        elements.approvalText,
        'Your Kitchen can now be activated and shown to nearby Customers.'
      );
    } else if (state.rejected) {
      setText(
        elements.approvalTitle,
        'Update required'
      );

      setText(
        elements.approvalText,
        state.onboarding
          .rejectionReason ||
        'Correct the requested details and submit again.'
      );
    } else {
      setText(
        elements.approvalTitle,
        'Verification in progress'
      );

      setText(
        elements.approvalText,
        'You will be able to start receiving Orders after Admin approval.'
      );
    }
  }

  function getFirstIncompleteStep() {
    const requiredSteps =
      STEP_CONFIG.filter(
        function(step) {
          return step.key !== 'review';
        }
      );

    return requiredSteps.find(
      function(step) {
        return !state.steps[step.key];
      }
    ) || null;
  }

  function renderPrimaryButton() {
    const button =
      elements.primaryButton;

    if (!button) return;

    if (state.approved) {
      button.disabled = false;
      button.textContent =
        'GO TO CHEF DASHBOARD';

      button.dataset.action =
        'dashboard';

      return;
    }

    if (state.submitted) {
      button.disabled = true;
      button.textContent =
        'APPROVAL PENDING';

      button.dataset.action =
        'pending';

      return;
    }

    if (state.canSubmit) {
      button.disabled = false;
      button.textContent =
        state.rejected
          ? 'RESUBMIT FOR APPROVAL'
          : 'SUBMIT FOR APPROVAL';

      button.dataset.action =
        'submit';

      return;
    }

    const nextStep =
      getFirstIncompleteStep();

    button.disabled =
      !nextStep;

    button.textContent =
      nextStep
        ? 'CONTINUE: ' +
          nextStep.label.toUpperCase()
        : 'CONTINUE ONBOARDING';

    button.dataset.action =
      'continue';

    button.dataset.step =
      nextStep
        ? nextStep.key
        : '';
  }

  function render() {
    renderProgress();
    renderSteps();
    renderStatus();
    renderApprovalSection();
    renderPrimaryButton();
  }

  function openStep(stepKey) {
    if (
      state.submitted ||
      state.approved
    ) {
      return;
    }

    const step =
      STEP_CONFIG.find(
        function(item) {
          return item.key === stepKey;
        }
      );

    if (!step) return;

    if (
      step.key === 'review' &&
      !state.steps.review
    ) {
      window.ApnaBiteUI.showToast(
        'Complete all required steps first.',
        'warning'
      );

      return;
    }

    window.location.href =
      step.page;
  }

  function bindStepEvents() {
    STEP_CONFIG.forEach(
      function(step) {
        const card =
          elements[
            'step_' + step.key
          ];

        if (!card) return;

        card.addEventListener(
          'click',
          function() {
            if (
              card.getAttribute(
                'aria-disabled'
              ) === 'true'
            ) {
              return;
            }

            openStep(step.key);
          }
        );
      }
    );
  }

  async function submitForApproval() {
    if (
      state.submitting ||
      !state.canSubmit
    ) {
      return;
    }

    if (
      !state.kitchen ||
      !(
        state.kitchen.kitchenId ||
        state.kitchen.Kitchen_ID
      )
    ) {
      window.ApnaBiteUI.showToast(
        'Kitchen profile could not be found.',
        'error'
      );

      return;
    }

    const kitchenId =
      state.kitchen.kitchenId ||
      state.kitchen.Kitchen_ID;

    state.submitting = true;

    window.ApnaBiteUI.setButtonLoading(
      elements.primaryButton,
      true,
      'SUBMITTING…'
    );

    try {
      await window.ApnaBiteAPI.request(
        'chef.kitchen.submit',
        {
          kitchenId: kitchenId
        },
        {
          retry: false,
          deduplicate: false
        }
      );

      window.ApnaBiteUI.showToast(
        'Kitchen submitted for approval.',
        'success'
      );

      await loadOnboarding();
    } catch (error) {
      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
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
    if (!elements.primaryButton) {
      return;
    }

    const action =
      elements.primaryButton
        .dataset.action;

    if (action === 'dashboard') {
      window.location.href =
        'dashboard.html';

      return;
    }

    if (action === 'submit') {
      submitForApproval();
      return;
    }

    if (action === 'continue') {
      openStep(
        elements.primaryButton
          .dataset.step
      );
    }
  }

  async function logout() {
    if (!elements.logoutButton) {
      return;
    }

    window.ApnaBiteUI.setButtonLoading(
      elements.logoutButton,
      true,
      'WAIT…'
    );

    try {
      await window.ApnaBiteAPI.logout();
    } catch (error) {
      window.ApnaBiteAPI
        .clearSessionToken();
    }

    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore
        .clearSession === 'function'
    ) {
      window.ApnaBiteCore
        .clearSession();
    }

    window.location.replace(
      '../login.html'
    );
  }

  async function validateChefSession() {
    if (
      !window.ApnaBiteCore
        .requireLocalSession(
          ['CHEF']
        )
    ) {
      return null;
    }

    try {
      const response =
        await window.ApnaBiteAPI
          .validateSession();

      const user =
        response &&
        response.data
          ? response.data.user
          : null;

      if (
        !user ||
        normalizeStatus(user.role) !==
          'CHEF'
      ) {
        window.ApnaBiteCore
          .redirectToRoleHome(
            user ? user.role : '',
            true
          );

        return null;
      }

      window.ApnaBiteCore.saveSession({
        sessionToken:
          window.ApnaBiteCore
            .getSessionToken(),
        user: user
      });

      state.user = user;
      updateChefName(user);

      return user;
    } catch (error) {
      window.ApnaBiteUI
        .handleApiError(
          error,
          {
            redirectToLogin: true
          }
        );

      return null;
    }
  }

  async function loadOnboarding() {
    if (state.loading) {
      return;
    }

    setLoading(true);

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.onboarding',
          {},
          {
            retry: true,
            deduplicate: true
          }
        );

      const data =
        getResponseData(response);

      const normalized =
        normalizeOnboarding(data);

      state.onboarding =
        normalized;

      state.kitchen =
        normalized.kitchen;

      state.steps =
        normalized.steps;

      state.completedCount =
        normalized.completedCount;

      state.canSubmit =
        normalized.canSubmit;

      state.submitted =
        normalized.submitted;

      state.approved =
        normalized.approved;

      state.rejected =
        normalized.rejected;

      render();
    } catch (error) {
      window.ApnaBiteUI
        .handleApiError(
          error,
          {
            redirectToLogin: true
          }
        );

      setText(
        elements.statusTitle,
        'Unable to load onboarding'
      );

      setText(
        elements.statusText,
        'Check your internet connection and reload this page.'
      );
    } finally {
      setLoading(false);
    }
  }

  function bindEvents() {
    if (elements.logoutButton) {
      elements.logoutButton
        .addEventListener(
          'click',
          logout
        );
    }

    if (elements.primaryButton) {
      elements.primaryButton
        .addEventListener(
          'click',
          handlePrimaryAction
        );
    }

    bindStepEvents();

    window.addEventListener(
      'pageshow',
      function(event) {
        if (
          event.persisted &&
          state.initialized
        ) {
          loadOnboarding();
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains('chef-page') &&
      !document.getElementById(
        'onboarding-progress-bar'
      )
    ) {
      return;
    }

    getElements();

    const user =
      await validateChefSession();

    if (!user) {
      return;
    }

    bindEvents();

    state.initialized = true;

    const localUser =
      getLocalUser();

    updateChefName(
      localUser || user
    );

    await loadOnboarding();
  }

  window.ApnaBiteChef =
    Object.freeze({
      initialize: initialize,
      loadOnboarding:
        loadOnboarding,
      openStep: openStep,
      submitForApproval:
        submitForApproval
    });

  window.ApnaBiteCore.ready(
    initialize
  );
})(window, document);
