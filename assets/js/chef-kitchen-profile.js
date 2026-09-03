/**
 * ============================================================
 * APNABITE V1 — CHEF KITCHEN PROFILE CONTROLLER
 * File: assets/js/chef-kitchen-profile.js
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CACHE_KEY = 'chef_kitchen_profile_draft';
  const CACHE_SECONDS = 86400;

  const state = {
    initialized: false,
    loading: false,
    submitting: false,
    mode: 'CREATE',
    kitchen: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cleanText(value) {
    return String(
      value === null || value === undefined
        ? ''
        : value
    ).replace(/\s+/g, ' ').trim();
  }

  function getElements() {
    elements.form = byId('kitchen-profile-form');
    elements.backButton = byId('kitchen-profile-back-button');
    elements.saveButton = byId('kitchen-profile-save-button');
    elements.saveStatus = byId('kitchen-profile-save-status');
    elements.statusCard = byId('kitchen-profile-status');
    elements.statusIcon = byId('kitchen-profile-status-icon');
    elements.statusTitle = byId('kitchen-profile-status-title');
    elements.statusMessage = byId('kitchen-profile-status-message');
    elements.name = byId('kitchen-name');
    elements.description = byId('kitchen-description');
    elements.descriptionCount = byId('kitchen-description-count');
    elements.foodType = byId('kitchen-food-type');
    elements.capacity = byId('kitchen-daily-capacity');
    elements.preparationTime = byId('kitchen-preparation-time');
    elements.minimumOrder = byId('kitchen-minimum-order');
    elements.serviceRadius = byId('kitchen-service-radius');
  }

  function setText(element, value) {
    if (element) element.textContent = cleanText(value);
  }

  function setStatus(type, icon, title, message) {
    if (elements.statusCard) {
      elements.statusCard.classList.remove(
        'chef-status-card--loading',
        'chef-status-card--pending',
        'chef-status-card--approved',
        'chef-status-card--rejected'
      );

      if (type) {
        elements.statusCard.classList.add(
          'chef-status-card--' + type
        );
      }
    }

    setText(elements.statusIcon, icon);
    setText(elements.statusTitle, title);
    setText(elements.statusMessage, message);
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);

    if (!elements.saveButton || state.submitting) return;

    elements.saveButton.disabled = state.loading;
    elements.saveButton.textContent = state.loading
      ? 'LOADING…'
      : state.mode === 'UPDATE'
        ? 'SAVE CHANGES'
        : 'SAVE & CONTINUE';
  }

  function setSubmitting(submitting) {
    state.submitting = Boolean(submitting);

    if (!elements.saveButton) return;

    if (state.submitting) {
      window.ApnaBiteUI.setButtonLoading(
        elements.saveButton,
        true,
        state.mode === 'UPDATE'
          ? 'SAVING CHANGES…'
          : 'SAVING…'
      );
    } else {
      window.ApnaBiteUI.setButtonLoading(
        elements.saveButton,
        false
      );

      elements.saveButton.disabled = false;
      elements.saveButton.textContent = state.mode === 'UPDATE'
        ? 'SAVE CHANGES'
        : 'SAVE & CONTINUE';
    }
  }

  function setFieldError(fieldId, message) {
    const field = byId(fieldId);
    const error = byId(fieldId + '-error');

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

  function clearErrors() {
    if (!elements.form) return;

    elements.form
      .querySelectorAll('.form-input--error')
      .forEach(function(field) {
        field.classList.remove('form-input--error');
        field.setAttribute('aria-invalid', 'false');
      });

    elements.form
      .querySelectorAll('.form-error')
      .forEach(function(error) {
        error.textContent = '';
        error.hidden = true;
      });
  }

  function updateDescriptionCount() {
    if (!elements.descriptionCount || !elements.description) return;

    elements.descriptionCount.textContent =
      elements.description.value.length + '/500';
  }

  function getFormData() {
    return {
      kitchenName: cleanText(elements.name.value),
      description: cleanText(elements.description.value),
      foodType: cleanText(elements.foodType.value).toUpperCase(),
      capacityPerDay: Number(elements.capacity.value),
      averagePreparationMinutes: Number(elements.preparationTime.value),
      minimumOrderValue: Number(elements.minimumOrder.value),
      requestedServiceRadiusKm: Number(elements.serviceRadius.value)
    };
  }

  function validateForm(data) {
    clearErrors();

    let valid = true;

    if (
      data.kitchenName.length < 2 ||
      data.kitchenName.length > 150
    ) {
      setFieldError(
        'kitchen-name',
        'Enter a Kitchen name between 2 and 150 characters.'
      );
      valid = false;
    }

    if (
      data.description.length < 10 ||
      data.description.length > 500
    ) {
      setFieldError(
        'kitchen-description',
        'Enter a description between 10 and 500 characters.'
      );
      valid = false;
    }

    if (!['VEG', 'NON_VEG', 'BOTH'].includes(data.foodType)) {
      setFieldError(
        'kitchen-food-type',
        'Select a valid food type.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(data.capacityPerDay) ||
      data.capacityPerDay < 1 ||
      data.capacityPerDay > 1000
    ) {
      setFieldError(
        'kitchen-daily-capacity',
        'Daily capacity must be between 1 and 1000.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(data.averagePreparationMinutes) ||
      data.averagePreparationMinutes < 5 ||
      data.averagePreparationMinutes > 240
    ) {
      setFieldError(
        'kitchen-preparation-time',
        'Preparation time must be between 5 and 240 minutes.'
      );
      valid = false;
    }

    if (
      !Number.isFinite(data.minimumOrderValue) ||
      data.minimumOrderValue < 0 ||
      data.minimumOrderValue > 100000
    ) {
      setFieldError(
        'kitchen-minimum-order',
        'Minimum order value must be between ₹0 and ₹1,00,000.'
      );
      valid = false;
    }

    if (
      !Number.isFinite(data.requestedServiceRadiusKm) ||
      data.requestedServiceRadiusKm < 0.5 ||
      data.requestedServiceRadiusKm > 50
    ) {
      setFieldError(
        'kitchen-service-radius',
        'Service radius must be between 0.5 and 50 KM.'
      );
      valid = false;
    }

    if (!valid) {
      const firstError = elements.form.querySelector(
        '.form-input--error'
      );

      if (firstError) firstError.focus();
    }

    return valid;
  }

  function populateForm(data) {
    const profile = data || {};

    if (elements.name) {
      elements.name.value = profile.kitchenName || '';
    }

    if (elements.description) {
      elements.description.value = profile.description || '';
    }

    if (elements.foodType) {
      elements.foodType.value = profile.foodType || '';
    }

    if (elements.capacity) {
      elements.capacity.value =
        profile.capacityPerDay === 0 ||
        profile.capacityPerDay
          ? profile.capacityPerDay
          : '';
    }

    if (elements.preparationTime) {
      elements.preparationTime.value =
        profile.averagePreparationMinutes || '';
    }

    if (elements.minimumOrder) {
      elements.minimumOrder.value =
        profile.minimumOrderValue === 0 ||
        profile.minimumOrderValue
          ? profile.minimumOrderValue
          : 0;
    }

    if (elements.serviceRadius) {
      elements.serviceRadius.value =
        profile.requestedServiceRadiusKm || 3;
    }

    updateDescriptionCount();
  }

  function getCachedDraft() {
    if (
      !window.ApnaBiteCore ||
      typeof window.ApnaBiteCore.getCache !== 'function'
    ) {
      return null;
    }

    const draft = window.ApnaBiteCore.getCache(CACHE_KEY);

    return draft && typeof draft === 'object'
      ? draft
      : null;
  }

  function saveCachedDraft(data) {
    window.ApnaBiteCore.setCache(
      CACHE_KEY,
      data,
      CACHE_SECONDS
    );
  }

  function clearCachedDraft() {
    window.ApnaBiteCore.removeCache(CACHE_KEY);
  }

  function showCreateMode() {
    state.mode = 'CREATE';
    state.kitchen = null;

    setStatus(
      '',
      '1',
      'Create your Kitchen profile',
      'Complete these details, then select your Kitchen address.'
    );

    if (elements.saveButton) {
      elements.saveButton.disabled = false;
      elements.saveButton.textContent = 'SAVE & CONTINUE';
    }

    setText(elements.saveStatus, 'Draft mode');
  }

  function showUpdateMode(kitchen) {
    state.mode = 'UPDATE';
    state.kitchen = kitchen;

    populateForm(kitchen);

    setStatus(
      'approved',
      '✓',
      'Kitchen profile loaded',
      'Update the allowed details and save your changes.'
    );

    if (elements.saveButton) {
      elements.saveButton.disabled = false;
      elements.saveButton.textContent = 'SAVE CHANGES';
    }

    setText(elements.saveStatus, 'Edit mode');
  }

  function renderCachedDraft() {
    const draft = getCachedDraft();

    if (!draft) return false;

    populateForm(draft);

    setStatus(
      '',
      '1',
      'Saved draft restored',
      'Your unsent Kitchen details are ready to continue.'
    );

    setText(elements.saveStatus, 'Draft restored');

    return true;
  }

  async function loadKitchen() {
    if (state.loading) return;

    setLoading(true);

    try {
      const response = await window.ApnaBiteAPI.request(
        'chef.kitchen.get',
        {},
        {
          retry: true,
          deduplicate: true
        }
      );

      const data =
        response &&
        response.data &&
        typeof response.data === 'object'
          ? response.data
          : {};

      if (data.exists && data.kitchen) {
        clearCachedDraft();
        showUpdateMode(data.kitchen);
      } else {
        showCreateMode();
      }
    } catch (error) {
      setStatus(
        'rejected',
        '!',
        'Unable to load Kitchen profile',
        'Check your connection and reload this page.'
      );

      setText(elements.saveStatus, '');

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );
    } finally {
      setLoading(false);
    }
  }

  async function updateExistingKitchen(data) {
    const response = await window.ApnaBiteAPI.request(
      'chef.kitchen.update',
      data,
      {
        retry: false,
        deduplicate: false
      }
    );

    if (
      response &&
      response.data &&
      response.data.kitchen
    ) {
      state.kitchen = response.data.kitchen;
    }

    clearCachedDraft();

    window.ApnaBiteUI.showToast(
      'Kitchen profile updated successfully.',
      'success'
    );

    setStatus(
      'approved',
      '✓',
      'Changes saved',
      'Your latest Kitchen profile details have been saved.'
    );

    setText(elements.saveStatus, 'Saved');
  }

  function saveNewKitchenDraft(data) {
    saveCachedDraft(data);

    window.ApnaBiteUI.showToast(
      'Kitchen profile saved. Now add your Kitchen address.',
      'success'
    );

    setStatus(
      'approved',
      '✓',
      'Profile draft saved',
      'Continue to select the exact location of your Kitchen.'
    );

    setText(elements.saveStatus, 'Draft saved');

    window.setTimeout(function() {
      window.location.href = 'kitchen-address.html';
    }, 350);
  }

  async function submitForm(event) {
    event.preventDefault();

    if (
      state.loading ||
      state.submitting
    ) {
      return;
    }

    const data = getFormData();

    if (!validateForm(data)) return;

    setSubmitting(true);

    try {
      if (state.mode === 'UPDATE') {
        await updateExistingKitchen(data);
      } else {
        saveNewKitchenDraft(data);
      }
    } catch (error) {
      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );

      setText(elements.saveStatus, 'Not saved');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    window.location.href = 'onboarding.html';
  }

  function bindEvents() {
    elements.form.addEventListener('submit', submitForm);

    if (elements.backButton) {
      elements.backButton.addEventListener('click', handleBack);
    }

    if (elements.description) {
      elements.description.addEventListener(
        'input',
        updateDescriptionCount
      );
    }

    elements.form.addEventListener('input', function(event) {
      const field = event.target;

      if (
        field &&
        field.id &&
        field.classList.contains('form-input--error')
      ) {
        setFieldError(field.id, '');
      }

      setText(elements.saveStatus, 'Unsaved');
    });

    window.addEventListener('pageshow', function(event) {
      if (event.persisted) {
        loadKitchen();
      }
    });
  }

  async function initialize() {
    if (
      !document.body.classList.contains(
        'chef-kitchen-profile-page'
      )
    ) {
      return;
    }

    if (state.initialized) return;
    state.initialized = true;

    getElements();

    if (
      !elements.form ||
      !elements.saveButton
    ) {
      return;
    }

    if (
      !window.ApnaBiteCore.requireLocalSession(
        ['CHEF']
      )
    ) {
      return;
    }

    renderCachedDraft();
    bindEvents();
    await loadKitchen();
  }

  window.ApnaBiteChefKitchenProfile = Object.freeze({
    initialize: initialize,
    loadKitchen: loadKitchen
  });

  window.ApnaBiteCore.ready(initialize);
})(window, document);
