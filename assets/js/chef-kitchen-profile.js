/**
 * ============================================================
 * APNABITE V1 — CHEF KITCHEN PROFILE CONTROLLER
 * File: assets/js/chef-kitchen-profile.js
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CACHE_KEY = 'chef_kitchen_profile';
  const CACHE_SECONDS = 3600;

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
    elements.backButton = byId(
      'kitchen-profile-back-button'
    );
    elements.saveButton = byId(
      'kitchen-profile-save-button'
    );
    elements.saveStatus = byId(
      'kitchen-profile-save-status'
    );
    elements.statusCard = byId(
      'kitchen-profile-status'
    );
    elements.statusIcon = byId(
      'kitchen-profile-status-icon'
    );
    elements.statusTitle = byId(
      'kitchen-profile-status-title'
    );
    elements.statusMessage = byId(
      'kitchen-profile-status-message'
    );
    elements.name = byId('kitchen-name');
    elements.description = byId(
      'kitchen-description'
    );
    elements.descriptionCount = byId(
      'kitchen-description-count'
    );
    elements.foodType = byId(
      'kitchen-food-type'
    );
    elements.capacity = byId(
      'kitchen-daily-capacity'
    );
    elements.preparationTime = byId(
      'kitchen-preparation-time'
    );
    elements.minimumOrder = byId(
      'kitchen-minimum-order'
    );
    elements.serviceRadius = byId(
      'kitchen-service-radius'
    );
  }

  function setText(element, value) {
    if (element) {
      element.textContent = cleanText(value);
    }
  }

  function setStatus(
    type,
    icon,
    title,
    message
  ) {
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

  function updateButton() {
    if (
      !elements.saveButton ||
      state.submitting
    ) {
      return;
    }

    elements.saveButton.disabled =
      state.loading;

    elements.saveButton.textContent =
      state.loading
        ? 'LOADING…'
        : state.mode === 'UPDATE'
          ? 'SAVE CHANGES'
          : 'SAVE & CONTINUE';
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);
    updateButton();
  }

  function setSubmitting(
    submitting,
    loadingText
  ) {
    state.submitting =
      Boolean(submitting);

    window.ApnaBiteUI.setButtonLoading(
      elements.saveButton,
      state.submitting,
      loadingText || 'SAVING…'
    );

    if (!state.submitting) {
      updateButton();
    }
  }

  function setFieldError(
    fieldId,
    message
  ) {
    const field = byId(fieldId);
    const error = byId(
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

  function clearErrors() {
    if (!elements.form) return;

    elements.form
      .querySelectorAll(
        '.form-input--error'
      )
      .forEach(function(field) {
        field.classList.remove(
          'form-input--error'
        );

        field.setAttribute(
          'aria-invalid',
          'false'
        );
      });

    elements.form
      .querySelectorAll('.form-error')
      .forEach(function(error) {
        error.textContent = '';
        error.hidden = true;
      });
  }

  function updateDescriptionCount() {
    if (
      !elements.description ||
      !elements.descriptionCount
    ) {
      return;
    }

    elements.descriptionCount.textContent =
      elements.description.value.length +
      '/500';
  }

  function getFormData() {
    return {
      kitchenName:
        cleanText(elements.name.value),
      description:
        cleanText(
          elements.description.value
        ),
      foodType:
        cleanText(
          elements.foodType.value
        ).toUpperCase(),
      capacityPerDay:
        Number(elements.capacity.value),
      averagePreparationMinutes:
        Number(
          elements.preparationTime.value
        ),
      minimumOrderValue:
        Number(
          elements.minimumOrder.value
        ),
      requestedServiceRadiusKm:
        Number(
          elements.serviceRadius.value
        )
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

    if (
      [
        'VEG',
        'NON_VEG',
        'BOTH'
      ].indexOf(data.foodType) === -1
    ) {
      setFieldError(
        'kitchen-food-type',
        'Select a valid food type.'
      );

      valid = false;
    }

    if (
      !Number.isInteger(
        data.capacityPerDay
      ) ||
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
      !Number.isInteger(
        data.averagePreparationMinutes
      ) ||
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
      !Number.isFinite(
        data.minimumOrderValue
      ) ||
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
      !Number.isFinite(
        data.requestedServiceRadiusKm
      ) ||
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
      const firstError =
        elements.form.querySelector(
          '.form-input--error'
        );

      if (firstError) {
        firstError.focus();
      }
    }

    return valid;
  }

  function populateForm(kitchen) {
    const data = kitchen || {};

    elements.name.value =
      data.kitchenName || '';

    elements.description.value =
      data.description || '';

    elements.foodType.value =
      data.foodType || '';

    elements.capacity.value =
      data.capacityPerDay || '';

    elements.preparationTime.value =
      data.averagePreparationMinutes || '';

    elements.minimumOrder.value =
      data.minimumOrderValue === 0
        ? 0
        : data.minimumOrderValue || 0;

    elements.serviceRadius.value =
      data.requestedServiceRadiusKm || 3;

    updateDescriptionCount();
  }

  function readCachedKitchen() {
    const cached =
      window.ApnaBiteCore.getCache(
        CACHE_KEY
      );

    if (
      !cached ||
      typeof cached !== 'object'
    ) {
      return false;
    }

    populateForm(cached);

    setStatus(
      '',
      '●',
      'Loading latest Kitchen profile',
      'Showing your saved details while we refresh them.'
    );

    return true;
  }

  function cacheKitchen(kitchen) {
    window.ApnaBiteCore.setCache(
      CACHE_KEY,
      kitchen,
      CACHE_SECONDS
    );
  }

  function showCreateMode() {
    state.mode = 'CREATE';
    state.kitchen = null;

    setStatus(
      '',
      '1',
      'Create your Kitchen profile',
      'These details will save permanently before you continue.'
    );

    setText(
      elements.saveStatus,
      'New profile'
    );

    updateButton();
  }

  function showUpdateMode(kitchen) {
    state.mode = 'UPDATE';
    state.kitchen = kitchen;

    populateForm(kitchen);
    cacheKitchen(kitchen);

    setStatus(
      'approved',
      '✓',
      'Kitchen profile loaded',
      'You can edit the allowed details and save your changes.'
    );

    setText(
      elements.saveStatus,
      'Edit mode'
    );

    updateButton();
  }

  async function loadKitchen() {
    if (state.loading) return;

    setLoading(true);

    try {
      const response =
        await window.ApnaBiteAPI.request(
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

      if (
        data.exists &&
        data.kitchen
      ) {
        showUpdateMode(data.kitchen);
      } else {
        window.ApnaBiteCore.removeCache(
          CACHE_KEY
        );

        showCreateMode();
      }
    } catch (error) {
      setStatus(
        'rejected',
        '!',
        'Unable to load Kitchen profile',
        'Check your connection and reload this page.'
      );

      setText(
        elements.saveStatus,
        'Load failed'
      );

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

  async function saveKitchen(data) {
    const action =
      state.mode === 'UPDATE'
        ? 'chef.kitchen.update'
        : 'chef.kitchen.create';

    const response =
      await window.ApnaBiteAPI.request(
        action,
        data,
        {
          retry: false,
          deduplicate: false
        }
      );

    const result =
      response &&
      response.data &&
      typeof response.data === 'object'
        ? response.data
        : {};

    if (!result.kitchen) {
      throw new Error(
        'Saved Kitchen data was not returned.'
      );
    }

    state.kitchen = result.kitchen;
    state.mode = 'UPDATE';

    cacheKitchen(result.kitchen);

    return result.kitchen;
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

    if (!validateForm(data)) {
      return;
    }

    const wasCreate =
      state.mode === 'CREATE';

    setSubmitting(
      true,
      wasCreate
        ? 'CREATING KITCHEN…'
        : 'SAVING CHANGES…'
    );

    try {
      await saveKitchen(data);

      window.ApnaBiteCore.removeCache(
        'chef_kitchen_profile_draft'
      );

      window.ApnaBiteCore.removeCache(
        'chef_onboarding'
      );

      window.ApnaBiteUI.showToast(
        wasCreate
          ? 'Kitchen profile saved successfully.'
          : 'Kitchen profile updated successfully.',
        'success'
      );

      setText(
        elements.saveStatus,
        'Saved'
      );

      setStatus(
        'approved',
        '✓',
        'Kitchen profile saved',
        'Your progress is saved. Continue to the Kitchen Address step.'
      );

      window.setTimeout(function() {
        window.location.href =
          'kitchen-address.html';
      }, 400);
    } catch (error) {
      setText(
        elements.saveStatus,
        'Not saved'
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );
    } finally {
      setSubmitting(false);
    }
  }

  function bindEvents() {
    elements.form.addEventListener(
      'submit',
      submitForm
    );

    elements.backButton.addEventListener(
      'click',
      function() {
        window.location.href =
          'onboarding.html';
      }
    );

    elements.description.addEventListener(
      'input',
      updateDescriptionCount
    );

    elements.form.addEventListener(
      'input',
      function(event) {
        const field = event.target;

        if (
          field &&
          field.id &&
          field.classList.contains(
            'form-input--error'
          )
        ) {
          setFieldError(
            field.id,
            ''
          );
        }

        setText(
          elements.saveStatus,
          'Unsaved'
        );
      }
    );
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
      !window.ApnaBiteCore
        .requireLocalSession(
          ['CHEF']
        )
    ) {
      return;
    }

    readCachedKitchen();
    bindEvents();
    await loadKitchen();
  }

  window.ApnaBiteChefKitchenProfile =
    Object.freeze({
      initialize: initialize,
      loadKitchen: loadKitchen
    });

  window.ApnaBiteCore.ready(
    initialize
  );
})(window, document);
