/**
 * ============================================================
 * APNABITE V1 — CHEF KITCHEN ADDRESS CONTROLLER
 * File: assets/js/chef-kitchen-address.js
 * Complete replacement — Part 1 of 2
 * Requires: Leaflet, core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const DEFAULT_LOCATION = Object.freeze({
    latitude: 28.6139,
    longitude: 77.2090
  });

  const GPS_CONFIG = Object.freeze({
    TARGET_ACCURACY_METERS: 80,
    ACCEPTABLE_ACCURACY_METERS: 250,
    MAX_WAIT_MS: 12000
  });

  const state = {
    initialized: false,
    loading: false,
    submitting: false,
    map: null,
    marker: null,
    selectedAddress: null,
    selectedLocation: null,
    addresses: [],
    kitchen: null,
    searchSequence: 0,
    reverseTimer: null,
    gpsWatchId: null,
    gpsTimer: null,
    bestGpsPosition: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cleanText(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).replace(/\s+/g, ' ').trim();
  }

  function normalizeMobile(value) {
    let digits = String(
      value || ''
    ).replace(/\D/g, '');

    if (
      digits.length === 12 &&
      digits.indexOf('91') === 0
    ) {
      digits = digits.substring(2);
    }

    if (
      digits.length === 11 &&
      digits.charAt(0) === '0'
    ) {
      digits = digits.substring(1);
    }

    return digits;
  }

  function getElements() {
    elements.form =
      byId('kitchen-address-form');

    elements.backButton =
      byId('kitchen-address-back-button');

    elements.saveButton =
      byId('kitchen-address-save-button');

    elements.saveStatus =
      byId('kitchen-address-save-status');

    elements.statusCard =
      byId('kitchen-address-status');

    elements.statusIcon =
      byId('kitchen-address-status-icon');

    elements.statusTitle =
      byId('kitchen-address-status-title');

    elements.statusMessage =
      byId('kitchen-address-status-message');

    elements.savedSection =
      byId('saved-kitchen-address-section');

    elements.savedList =
      byId('saved-kitchen-address-list');

    elements.addNewButton =
      byId('add-new-kitchen-address-button');

    elements.newSection =
      byId('new-kitchen-address-section');

    elements.searchInput =
      byId('kitchen-location-search');

    elements.searchButton =
      byId('kitchen-location-search-button');

    elements.searchError =
      byId('kitchen-location-search-error');

    elements.searchResults =
      byId('kitchen-location-results');

    elements.currentLocationButton =
      byId(
        'kitchen-use-current-location-button'
      );

    elements.recenterButton =
      byId('kitchen-recenter-map-button');

    elements.locationName =
      byId('kitchen-selected-location-name');

    elements.locationAddress =
      byId(
        'kitchen-selected-location-address'
      );

    elements.addressId =
      byId('kitchen-address-id');

    elements.latitude =
      byId('kitchen-address-latitude');

    elements.longitude =
      byId('kitchen-address-longitude');

    elements.addressLabel =
      byId('kitchen-address-label');

    elements.receiverName =
      byId('kitchen-receiver-name');

    elements.receiverMobile =
      byId('kitchen-receiver-mobile');

    elements.addressLine1 =
      byId('kitchen-address-line-1');

    elements.addressLine2 =
      byId('kitchen-address-line-2');

    elements.area =
      byId('kitchen-address-area');

    elements.city =
      byId('kitchen-address-city');

    elements.district =
      byId('kitchen-address-district');

    elements.state =
      byId('kitchen-address-state');

    elements.postalCode =
      byId('kitchen-address-postal-code');

    elements.landmark =
      byId('kitchen-address-landmark');
  }

  function setText(element, value) {
    if (element) {
      element.textContent =
        cleanText(value);
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

  function setLoading(loading) {
    state.loading = Boolean(loading);

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
        : state.selectedAddress
          ? 'USE THIS ADDRESS & CONTINUE'
          : 'SAVE ADDRESS & CONTINUE';
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
      elements.saveButton.disabled = false;

      elements.saveButton.textContent =
        state.selectedAddress
          ? 'USE THIS ADDRESS & CONTINUE'
          : 'SAVE ADDRESS & CONTINUE';
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
      error.textContent =
        message || '';

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

    if (elements.searchError) {
      elements.searchError.textContent = '';
      elements.searchError.hidden = true;
    }
  }

  function getLocalUser() {
    return (
      window.ApnaBiteCore
        .getSessionUser() ||
      {}
    );
  }

  function prefillContact() {
    const user = getLocalUser();

    const name = cleanText(
      user.fullName ||
      user.name
    );

    const mobile = normalizeMobile(
      user.mobile
    );

    if (
      elements.receiverName &&
      !elements.receiverName.value
    ) {
      elements.receiverName.value =
        name;
    }

    if (
      elements.receiverMobile &&
      !elements.receiverMobile.value &&
      /^[6-9]\d{9}$/.test(mobile)
    ) {
      elements.receiverMobile.value =
        mobile;
    }
  }

  function initializeMap() {
    if (
      state.map ||
      !window.L ||
      !byId('kitchen-address-map')
    ) {
      return;
    }

    state.map = window.L.map(
      'kitchen-address-map',
      {
        zoomControl: true,
        attributionControl: true
      }
    ).setView(
      [
        DEFAULT_LOCATION.latitude,
        DEFAULT_LOCATION.longitude
      ],
      12
    );

    window.L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        minZoom: 3,
        maxZoom: 19,
        updateWhenIdle: true,
        keepBuffer: 3,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(state.map);

    state.marker = window.L.marker(
      [
        DEFAULT_LOCATION.latitude,
        DEFAULT_LOCATION.longitude
      ],
      {
        draggable: true,
        autoPan: true
      }
    ).addTo(state.map);

    state.marker.on(
      'dragend',
      function() {
        const coordinates =
          state.marker.getLatLng();

        selectCoordinates(
          coordinates.lat,
          coordinates.lng,
          null,
          true,
          null
        );
      }
    );

    window.setTimeout(function() {
      if (state.map) {
        state.map.invalidateSize(true);
      }
    }, 150);
  }

  function setMapPosition(
    latitude,
    longitude,
    zoom
  ) {
    initializeMap();

    if (
      !state.map ||
      !state.marker
    ) {
      return;
    }

    const position = [
      Number(latitude),
      Number(longitude)
    ];

    state.marker.setLatLng(position);

    state.map.setView(
      position,
      zoom || 17,
      {
        animate: false
      }
    );

    window.setTimeout(function() {
      if (state.map) {
        state.map.invalidateSize(true);
      }
    }, 80);
  }

  function applyLocationDetails(location) {
    if (!location) return;

    if (
      elements.area &&
      location.area
    ) {
      elements.area.value =
        location.area;
    }

    if (
      elements.city &&
      location.city
    ) {
      elements.city.value =
        location.city;
    }

    if (
      elements.district &&
      location.district
    ) {
      elements.district.value =
        location.district;
    }

    if (
      elements.state &&
      location.state
    ) {
      elements.state.value =
        location.state;
    }

    if (
      elements.postalCode &&
      location.postalCode
    ) {
      elements.postalCode.value =
        location.postalCode;
    }

    setText(
      elements.locationName,
      location.locationName ||
      location.area ||
      location.city ||
      'Selected location'
    );

    setText(
      elements.locationAddress,
      location.fullAddress ||
      [
        location.area,
        location.city,
        location.state
      ].filter(Boolean).join(', ')
    );
  }

  function getReverseCacheKey(
    latitude,
    longitude
  ) {
    return (
      'chef_reverse_' +
      Number(latitude).toFixed(5) +
      '_' +
      Number(longitude).toFixed(5)
    );
  }

  async function reverseCoordinates(
    latitude,
    longitude
  ) {
    const cacheKey =
      getReverseCacheKey(
        latitude,
        longitude
      );

    const cached =
      window.ApnaBiteCore.getCache(
        cacheKey
      );

    if (cached) {
      applyLocationDetails(cached);
      return cached;
    }

    const response =
      await window.ApnaBiteAPI.request(
        'location.reverse',
        {
          latitude: latitude,
          longitude: longitude
        },
        {
          retry: true,
          deduplicate: true
        }
      );

    const location =
      response.data || {};

    window.ApnaBiteCore.setCache(
      cacheKey,
      location,
      21600
    );

    applyLocationDetails(location);

    return location;
  }

  function selectCoordinates(
    latitude,
    longitude,
    location,
    reverse,
    accuracy
  ) {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return;
    }

    state.selectedAddress = null;

    state.selectedLocation = {
      latitude: lat,
      longitude: lng,
      accuracy:
        Number.isFinite(
          Number(accuracy)
        )
          ? Number(accuracy)
          : null
    };

    elements.addressId.value = '';
    elements.latitude.value =
      String(lat);
    elements.longitude.value =
      String(lng);

    setMapPosition(
      lat,
      lng,
      accuracy &&
      accuracy >
        GPS_CONFIG.ACCEPTABLE_ACCURACY_METERS
        ? 15
        : 17
    );

    if (location) {
      applyLocationDetails(location);
    } else {
      setText(
        elements.locationName,
        accuracy
          ? 'Current location'
          : 'Selected location'
      );

      setText(
        elements.locationAddress,
        accuracy
          ? 'Location accuracy: approximately ' +
            Math.round(accuracy) +
            ' metres. Adjust the pin if required.'
          : lat.toFixed(6) +
            ', ' +
            lng.toFixed(6)
      );
    }

    if (reverse) {
      window.clearTimeout(
        state.reverseTimer
      );

      state.reverseTimer =
        window.setTimeout(
          function() {
            reverseCoordinates(
              lat,
              lng
            ).catch(function(error) {
              window.ApnaBiteUI
                .handleApiError(
                  error,
                  {
                    redirectToLogin:
                      true
                  }
                );
            });
          },
          400
        );
    }
  }

  function stopGpsWatch() {
    if (
      state.gpsWatchId !== null &&
      navigator.geolocation
    ) {
      navigator.geolocation.clearWatch(
        state.gpsWatchId
      );
    }

    state.gpsWatchId = null;

    window.clearTimeout(
      state.gpsTimer
    );

    state.gpsTimer = null;

    window.ApnaBiteUI.setButtonLoading(
      elements.currentLocationButton,
      false
    );
  }

  function finishGpsSelection() {
    const position =
      state.bestGpsPosition;

    stopGpsWatch();

    if (!position) {
      window.ApnaBiteUI.showToast(
        'Current location could not be detected. Search your area and adjust the pin.',
        'warning'
      );

      return;
    }

    const accuracy = Number(
      position.coords.accuracy
    );

    selectCoordinates(
      position.coords.latitude,
      position.coords.longitude,
      null,
      true,
      accuracy
    );

    if (
      accuracy >
      GPS_CONFIG.ACCEPTABLE_ACCURACY_METERS
    ) {
      window.ApnaBiteUI.showToast(
        'Only an approximate location was available. Please verify and adjust the map pin.',
        'warning'
      );
    } else {
      window.ApnaBiteUI.showToast(
        'Current location detected. Verify the pin before saving.',
        'success'
      );
    }
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      window.ApnaBiteUI.showToast(
        'GPS is not supported on this device.',
        'error'
      );

      return;
    }

    if (state.gpsWatchId !== null) {
      return;
    }

    state.bestGpsPosition = null;

    window.ApnaBiteUI.setButtonLoading(
      elements.currentLocationButton,
      true,
      'FINDING BEST LOCATION…'
    );

    state.gpsWatchId =
      navigator.geolocation.watchPosition(
        function(position) {
          const accuracy = Number(
            position.coords.accuracy
          );

          if (
            !state.bestGpsPosition ||
            accuracy <
              Number(
                state.bestGpsPosition
                  .coords.accuracy
              )
          ) {
            state.bestGpsPosition =
              position;
          }

          if (
            accuracy <=
            GPS_CONFIG
              .TARGET_ACCURACY_METERS
          ) {
            finishGpsSelection();
          }
        },
        function(error) {
          stopGpsWatch();

          let message =
            'Current location is unavailable. Search your area instead.';

          if (error && error.code === 1) {
            message =
              'Location permission is blocked. Allow location access in browser settings and try again.';
          }

          window.ApnaBiteUI.showToast(
            message,
            'warning'
          );
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout:
            GPS_CONFIG.MAX_WAIT_MS
        }
      );

    state.gpsTimer =
      window.setTimeout(
        finishGpsSelection,
        GPS_CONFIG.MAX_WAIT_MS
      );
  }

  function renderSearchResults(
    locations
  ) {
    elements.searchResults.textContent =
      '';

    if (!locations.length) {
      elements.searchResults.hidden =
        true;

      elements.searchError.textContent =
        'No matching locations were found.';

      elements.searchError.hidden =
        false;

      return;
    }

    const fragment =
      document.createDocumentFragment();

    locations.forEach(
      function(location) {
        const button =
          document.createElement(
            'button'
          );

        const title =
          document.createElement(
            'strong'
          );

        const address =
          document.createElement(
            'span'
          );

        button.type = 'button';

        button.className =
          'chef-location-result';

        button.setAttribute(
          'role',
          'option'
        );

        title.textContent =
          location.locationName ||
          'Location';

        address.textContent =
          location.fullAddress ||
          [
            location.area,
            location.city,
            location.state
          ].filter(Boolean).join(', ');

        button.appendChild(title);
        button.appendChild(address);

        button.addEventListener(
          'click',
          function() {
            elements.searchResults.hidden =
              true;

            elements.searchInput.value =
              location.locationName ||
              '';

            selectCoordinates(
              location.latitude,
              location.longitude,
              location,
              false,
              null
            );
          }
        );

        fragment.appendChild(button);
      }
    );

    elements.searchResults.appendChild(
      fragment
    );

    elements.searchResults.hidden =
      false;
  }

  async function searchLocation() {
    const query = cleanText(
      elements.searchInput.value
    );

    elements.searchError.textContent =
      '';

    elements.searchError.hidden = true;

    if (query.length < 3) {
      elements.searchError.textContent =
        'Enter at least 3 characters.';

      elements.searchError.hidden =
        false;

      return;
    }

    const sequence =
      ++state.searchSequence;

    window.ApnaBiteUI.setButtonLoading(
      elements.searchButton,
      true,
      'SEARCHING…'
    );

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'location.search',
          {
            query: query,
            latitude:
              state.selectedLocation &&
              state.selectedLocation
                .latitude,
            longitude:
              state.selectedLocation &&
              state.selectedLocation
                .longitude
          },
          {
            retry: true,
            deduplicate: true
          }
        );

      if (
        sequence !==
        state.searchSequence
      ) {
        return;
      }

      const locations =
        response.data &&
        Array.isArray(
          response.data.locations
        )
          ? response.data.locations
          : [];

      renderSearchResults(locations);
    } catch (error) {
      if (
        sequence ===
        state.searchSequence
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
      if (
        sequence ===
        state.searchSequence
      ) {
        window.ApnaBiteUI
          .setButtonLoading(
            elements.searchButton,
            false
          );
      }
    }
  }

   function createAddressCard(address) {
    const button =
      document.createElement('button');

    const title =
      document.createElement('strong');

    const text =
      document.createElement('span');

    const badge =
      document.createElement('small');

    button.type = 'button';

    button.className =
      'chef-saved-address-card';

    button.dataset.addressId =
      address.addressId;

    title.textContent =
      address.addressLabel ||
      'Saved address';

    text.textContent = [
      address.addressLine1,
      address.addressLine2,
      address.area,
      address.city,
      address.state
    ].filter(Boolean).join(', ');

    badge.textContent =
      address.isDefault
        ? 'DEFAULT'
        : 'SELECT';

    button.appendChild(title);
    button.appendChild(text);
    button.appendChild(badge);

    button.addEventListener(
      'click',
      function() {
        selectSavedAddress(address);
      }
    );

    return button;
  }

  function renderSavedAddresses() {
    elements.savedList.textContent = '';

    if (!state.addresses.length) {
      elements.savedSection.hidden =
        true;

      elements.newSection.hidden =
        false;

      return;
    }

    const fragment =
      document.createDocumentFragment();

    state.addresses.forEach(
      function(address) {
        fragment.appendChild(
          createAddressCard(address)
        );
      }
    );

    elements.savedList.appendChild(
      fragment
    );

    elements.savedSection.hidden =
      false;
  }

  function selectSavedAddress(address) {
    state.selectedAddress = address;

    state.selectedLocation = {
      latitude:
        Number(address.latitude),
      longitude:
        Number(address.longitude),
      accuracy: null
    };

    elements.addressId.value =
      address.addressId;

    elements.latitude.value =
      address.latitude;

    elements.longitude.value =
      address.longitude;

    elements.savedList
      .querySelectorAll(
        '.chef-saved-address-card'
      )
      .forEach(function(card) {
        card.classList.toggle(
          'chef-saved-address-card--selected',
          card.dataset.addressId ===
            address.addressId
        );
      });

    setMapPosition(
      Number(address.latitude),
      Number(address.longitude),
      17
    );

    applyLocationDetails({
      locationName:
        address.addressLabel,
      fullAddress: [
        address.addressLine1,
        address.addressLine2,
        address.area,
        address.city,
        address.state,
        address.postalCode
      ].filter(Boolean).join(', '),
      area: address.area,
      city: address.city,
      district: address.district,
      state: address.state,
      postalCode:
        address.postalCode
    });

    elements.newSection.hidden = true;

    elements.saveButton.disabled =
      false;

    elements.saveButton.textContent =
      'USE THIS ADDRESS & CONTINUE';

    setStatus(
      'approved',
      '✓',
      'Saved address selected',
      'Continue to use this location for your Kitchen.'
    );
  }

  function showNewAddress() {
    state.selectedAddress = null;

    elements.addressId.value = '';

    elements.newSection.hidden =
      false;

    elements.saveButton.textContent =
      'SAVE ADDRESS & CONTINUE';

    initializeMap();

    window.setTimeout(function() {
      if (state.map) {
        state.map.invalidateSize(true);
      }
    }, 100);

    elements.newSection.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function getNewAddressData() {
    return {
      addressLabel:
        cleanText(
          elements.addressLabel.value
        ),
      addressType: 'OTHER',
      receiverName:
        cleanText(
          elements.receiverName.value
        ),
      receiverMobile:
        normalizeMobile(
          elements.receiverMobile.value
        ),
      addressLine1:
        cleanText(
          elements.addressLine1.value
        ),
      addressLine2:
        cleanText(
          elements.addressLine2.value
        ),
      landmark:
        cleanText(
          elements.landmark.value
        ),
      area:
        cleanText(
          elements.area.value
        ),
      city:
        cleanText(
          elements.city.value
        ),
      district:
        cleanText(
          elements.district.value
        ),
      state:
        cleanText(
          elements.state.value
        ),
      postalCode:
        cleanText(
          elements.postalCode.value
        ),
      latitude:
        Number(
          elements.latitude.value
        ),
      longitude:
        Number(
          elements.longitude.value
        ),
      isDefault:
        state.addresses.length === 0
    };
  }

  function validateNewAddress(data) {
    clearErrors();

    let valid = true;

    const requiredFields = [
      {
        id: 'kitchen-address-label',
        value: data.addressLabel,
        message:
          'Enter an address label.'
      },
      {
        id: 'kitchen-receiver-name',
        value: data.receiverName,
        message:
          'Enter the contact person name.'
      },
      {
        id: 'kitchen-address-line-1',
        value: data.addressLine1,
        message:
          'Enter the house, flat or building.'
      },
      {
        id: 'kitchen-address-area',
        value: data.area,
        message:
          'Enter the area or locality.'
      },
      {
        id: 'kitchen-address-city',
        value: data.city,
        message:
          'Enter the city.'
      },
      {
        id: 'kitchen-address-state',
        value: data.state,
        message:
          'Enter the state.'
      }
    ];

    requiredFields.forEach(
      function(field) {
        if (!field.value) {
          setFieldError(
            field.id,
            field.message
          );

          valid = false;
        }
      }
    );

    if (
      !/^[6-9]\d{9}$/.test(
        data.receiverMobile
      )
    ) {
      setFieldError(
        'kitchen-receiver-mobile',
        'Enter a valid 10-digit mobile number.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(
        data.latitude
      ) ||
      !Number.isFinite(
        data.longitude
      ) ||
      !state.selectedLocation
    ) {
      window.ApnaBiteUI.showToast(
        'Select and verify the exact Kitchen location on the map.',
        'warning'
      );

      valid = false;
    }

    if (
      data.postalCode &&
      !/^\d{6}$/.test(
        data.postalCode
      )
    ) {
      setFieldError(
        'kitchen-address-postal-code',
        'Enter a valid 6-digit PIN code.'
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

  async function attachAddressToKitchen(
    addressId
  ) {
    if (
      !state.kitchen ||
      !state.kitchen.kitchenId
    ) {
      throw new Error(
        'KITCHEN_PROFILE_REQUIRED'
      );
    }

    const response =
      await window.ApnaBiteAPI.request(
        'chef.kitchen.update',
        {
          addressId: addressId
        },
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
      state.kitchen =
        response.data.kitchen;
    }

    window.ApnaBiteCore.removeCache(
      'chef_kitchen_profile'
    );

    window.ApnaBiteCore.removeCache(
      'chef_onboarding'
    );
  }

  async function submitAddress(event) {
    event.preventDefault();

    if (
      state.loading ||
      state.submitting
    ) {
      return;
    }

    if (
      !state.kitchen ||
      !state.kitchen.kitchenId
    ) {
      window.ApnaBiteUI.showToast(
        'Complete the Kitchen Profile step first.',
        'warning'
      );

      window.setTimeout(function() {
        window.location.href =
          'kitchen-profile.html';
      }, 500);

      return;
    }

    setSubmitting(
      true,
      state.selectedAddress
        ? 'CONNECTING ADDRESS…'
        : 'SAVING ADDRESS…'
    );

    try {
      let addressId = '';

      if (state.selectedAddress) {
        addressId =
          state.selectedAddress.addressId;
      } else {
        const addressData =
          getNewAddressData();

        if (
          !validateNewAddress(
            addressData
          )
        ) {
          return;
        }

        const response =
          await window.ApnaBiteAPI.request(
            'address.create',
            addressData,
            {
              retry: false,
              deduplicate: false
            }
          );

        addressId =
          response &&
          response.data
            ? response.data.addressId
            : '';
      }

      if (!addressId) {
        throw new Error(
          'ADDRESS_ID_MISSING'
        );
      }

      await attachAddressToKitchen(
        addressId
      );

      window.ApnaBiteUI.showToast(
        'Kitchen address saved successfully.',
        'success'
      );

      setText(
        elements.saveStatus,
        'Saved'
      );

      setStatus(
        'approved',
        '✓',
        'Kitchen address saved',
        'Your exact location is securely connected to your Kitchen.'
      );

      window.setTimeout(function() {
        window.location.href =
          'onboarding.html';
      }, 450);
    } catch (error) {
      if (
        error &&
        error.message ===
          'KITCHEN_PROFILE_REQUIRED'
      ) {
        window.ApnaBiteUI.showToast(
          'Complete the Kitchen Profile step first.',
          'warning'
        );

        window.setTimeout(function() {
          window.location.href =
            'kitchen-profile.html';
        }, 500);
      } else if (
        error &&
        error.message ===
          'ADDRESS_ID_MISSING'
      ) {
        window.ApnaBiteUI.showToast(
          'Address was not saved correctly. Please try again.',
          'error'
        );
      } else {
        window.ApnaBiteUI.handleApiError(
          error,
          {
            redirectToLogin: true
          }
        );
      }

      setText(
        elements.saveStatus,
        'Not saved'
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function loadPageData() {
    if (state.loading) return;

    setLoading(true);
    initializeMap();

    try {
      const results =
        await Promise.all([
          window.ApnaBiteAPI.request(
            'address.list',
            {},
            {
              retry: true,
              deduplicate: true
            }
          ),
          window.ApnaBiteAPI.request(
            'chef.kitchen.get',
            {},
            {
              retry: true,
              deduplicate: true
            }
          )
        ]);

      state.addresses =
        Array.isArray(
          results[0].data
        )
          ? results[0].data
          : [];

      state.kitchen =
        results[1].data &&
        results[1].data.exists
          ? results[1].data.kitchen
          : null;

      renderSavedAddresses();
      prefillContact();

      if (
        !state.kitchen ||
        !state.kitchen.kitchenId
      ) {
        setStatus(
          'pending',
          '!',
          'Kitchen Profile required',
          'Complete Step 1 before saving the Kitchen address.'
        );

        elements.saveButton.disabled =
          true;

        elements.saveButton.textContent =
          'COMPLETE KITCHEN PROFILE FIRST';

        return;
      }

      if (state.kitchen.addressId) {
        const currentAddress =
          state.addresses.find(
            function(address) {
              return (
                address.addressId ===
                state.kitchen.addressId
              );
            }
          );

        if (currentAddress) {
          selectSavedAddress(
            currentAddress
          );

          return;
        }
      }

      setStatus(
        '',
        '2',
        'Choose the exact Kitchen address',
        'Select a saved address or add a new location.'
      );

      elements.saveButton.disabled =
        false;

      elements.saveButton.textContent =
        'SAVE ADDRESS & CONTINUE';
    } catch (error) {
      setStatus(
        'rejected',
        '!',
        'Unable to load addresses',
        'Check your connection and reload this page.'
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );
    } finally {
      setLoading(false);

      window.setTimeout(function() {
        if (state.map) {
          state.map.invalidateSize(true);
        }
      }, 100);
    }
  }

  function bindEvents() {
    elements.form.addEventListener(
      'submit',
      submitAddress
    );

    elements.backButton.addEventListener(
      'click',
      function() {
        window.location.href =
          'kitchen-profile.html';
      }
    );

    elements.addNewButton.addEventListener(
      'click',
      showNewAddress
    );

    elements.searchButton.addEventListener(
      'click',
      searchLocation
    );

    elements.searchInput.addEventListener(
      'keydown',
      function(event) {
        if (event.key === 'Enter') {
          event.preventDefault();
          searchLocation();
        }
      }
    );

    elements.currentLocationButton
      .addEventListener(
        'click',
        useCurrentLocation
      );

    elements.recenterButton.addEventListener(
      'click',
      function() {
        if (!state.selectedLocation) {
          useCurrentLocation();
          return;
        }

        setMapPosition(
          state.selectedLocation.latitude,
          state.selectedLocation.longitude,
          17
        );
      }
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

    window.addEventListener(
      'pagehide',
      stopGpsWatch
    );
  }

  async function initialize() {
    if (
      !document.body.classList.contains(
        'chef-kitchen-address-page'
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

    bindEvents();
    await loadPageData();
  }

  window.ApnaBiteChefKitchenAddress =
    Object.freeze({
      initialize: initialize,
      loadPageData: loadPageData,
      useCurrentLocation:
        useCurrentLocation
    });

  window.ApnaBiteCore.ready(
    initialize
  );
})(window, document);
