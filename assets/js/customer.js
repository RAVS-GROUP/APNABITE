/**
 * ============================================================
 * APNABITE V1 — CUSTOMER LOCATION CONTROLLER
 * File: assets/js/customer.js
 * Version: 14
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    map: null,
    selectedLocation: null,
    savedAddresses: [],
    searchResults: [],
    reverseTimer: null,
    searchBusy: false,
    locationBusy: false,
    locationConfirmed: false,
    skipNextMoveEnd: false,
    pendingSource: 'MAP_PIN',
    lastReverseKey: '',
    reverseCache: new Map()
  };

  const elements = {};

  function getElements() {
    [
      ['backButton', 'location-back-button'],
      ['searchForm', 'location-search-form'],
      ['searchInput', 'location-search-input'],
      ['searchButton', 'location-search-button'],
      ['searchMessage', 'location-search-message'],
      ['searchResults', 'location-search-results'],
      ['currentButton', 'use-current-location'],
      ['mapCurrentButton', 'map-current-location'],
      ['mapLoading', 'map-loading'],
      ['savedList', 'saved-address-list'],
      ['noSaved', 'no-saved-address'],
      ['selectedName', 'selected-location-name'],
      ['selectedAddress', 'selected-location-address'],
      ['receiverSection', 'receiver-details-section'],
      ['receiverName', 'receiver-name'],
      ['receiverMobile', 'receiver-mobile'],
      ['addressFlat', 'address-flat'],
      ['addressLandmark', 'address-landmark'],
      ['addressArea', 'address-area'],
      ['addressCity', 'address-city'],
      ['addressDistrict', 'address-district'],
      ['addressState', 'address-state'],
      ['useOnce', 'address-use-once'],
      ['saveFuture', 'address-save-future'],
      ['addressLabelGroup', 'address-label-group'],
      ['addressLabel', 'address-label'],
      ['confirmButton', 'confirm-location-button']
    ].forEach(function(item) {
      elements[item[0]] =
        document.getElementById(item[1]);
    });
  }

  function clean(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function digits(value) {
    return String(value || '')
      .replace(/\D/g, '');
  }

  function numberOrNull(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function setButtonLoading(
    button,
    loading,
    loadingText,
    normalText
  ) {
    if (!button) return;

    button.disabled = Boolean(loading);
    button.textContent =
      loading ? loadingText : normalText;
  }

  function setSearchMessage(message, error) {
    elements.searchMessage.textContent =
      message || '';

    elements.searchMessage.classList.toggle(
      'location-helper-text--error',
      Boolean(error)
    );
  }

  function setMapLoading(loading) {
    elements.mapLoading.hidden =
      !loading;
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
    }
  }

  function readSessionCache(key) {
    try {
      return JSON.parse(
        sessionStorage.getItem(key)
      );
    } catch (error) {
      return null;
    }
  }

  function writeSessionCache(key, value) {
    try {
      sessionStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      return;
    }
  }

  function locationCacheKey(query) {
    return (
      'apnabite_location_search_' +
      clean(query)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .slice(0, 120)
    );
  }

  function reverseCacheKey(latitude, longitude) {
    return (
      Number(latitude).toFixed(5) +
      '_' +
      Number(longitude).toFixed(5)
    );
  }

  function addUniquePart(parts, value) {
    const part = clean(value);

    if (!part) return;

    const exists =
      parts.some(function(item) {
        return (
          item.toLowerCase() ===
          part.toLowerCase()
        );
      });

    if (!exists) {
      parts.push(part);
    }
  }

  function buildFullAddress(address) {
    const parts = [];

    addUniquePart(
      parts,
      address.flatHouse ||
      address.addressLine1
    );

    addUniquePart(
      parts,
      address.addressLine2
    );

    addUniquePart(
      parts,
      address.landmark
    );

    addUniquePart(parts, address.area);
    addUniquePart(parts, address.city);
    addUniquePart(parts, address.district);
    addUniquePart(parts, address.state);
    addUniquePart(parts, address.postalCode);

    return parts.join(', ');
  }

  function normalizeLocation(location) {
    const input = location || {};

    const latitude =
      numberOrNull(input.latitude);

    const longitude =
      numberOrNull(input.longitude);

    if (
      latitude === null ||
      longitude === null
    ) {
      return null;
    }

    return {
      latitude: latitude,
      longitude: longitude,
      locationName:
        clean(input.locationName) ||
        clean(input.area) ||
        clean(input.city) ||
        'Selected location',
      fullAddress:
        clean(
          input.fullAddress ||
          input.providerAddress
        ),
      area: clean(input.area),
      city: clean(input.city),
      district: clean(input.district),
      state: clean(input.state),
      postalCode:
        clean(input.postalCode),
      country: clean(input.country),
      countryCode:
        clean(input.countryCode) || 'IN',
      source:
        clean(input.source) ||
        'MAP_PIN',
      addressId:
        clean(input.addressId)
    };
  }

  function fillLocationFields(location) {
    elements.addressArea.value =
      location.area || '';

    elements.addressCity.value =
      location.city || '';

    elements.addressDistrict.value =
      location.district || '';

    elements.addressState.value =
      location.state || '';
  }

  function resetConfirmation() {
    state.locationConfirmed = false;
    elements.receiverSection.hidden = true;
    elements.confirmButton.disabled = false;
    elements.confirmButton.textContent =
      'CONFIRM PIN LOCATION';
  }

  function setSelectedLocation(location) {
    const normalized =
      normalizeLocation(location);

    if (!normalized) return;

    state.selectedLocation = normalized;

    elements.selectedName.textContent =
      normalized.locationName;

    elements.selectedAddress.textContent =
      normalized.fullAddress ||
      'Location selected on map';

    fillLocationFields(normalized);
    resetConfirmation();
  }

  function clearSearchResults() {
    state.searchResults = [];
    elements.searchResults.innerHTML = '';
  }

  function renderSearchResults(results) {
    elements.searchResults.innerHTML = '';

    results.slice(0, 10)
      .forEach(function(result, index) {
        const button =
          document.createElement('button');

        button.type = 'button';
        button.className =
          'location-result-card';

        const icon =
          document.createElement('span');

        icon.className =
          'location-result-card__icon';

        icon.textContent = '⌖';

        const content =
          document.createElement('span');

        content.className =
          'location-result-card__content';

        const name =
          document.createElement('strong');

        name.className =
          'location-result-card__name';

        name.textContent =
          result.locationName ||
          'Matching location';

        const address =
          document.createElement('p');

        address.className =
          'location-result-card__address';

        address.textContent =
          result.fullAddress ||
          result.locationName;

        content.appendChild(name);
        content.appendChild(address);
        button.appendChild(icon);
        button.appendChild(content);

        button.addEventListener(
          'click',
          function() {
            selectSearchResult(index);
          }
        );

        elements.searchResults
          .appendChild(button);
      });
  }

  async function searchLocation(event) {
    event.preventDefault();

    if (state.searchBusy) return;

    const query =
      clean(elements.searchInput.value);

    if (query.length < 3) {
      setSearchMessage(
        'Enter at least 3 characters.',
        true
      );
      return;
    }

    state.searchBusy = true;
    clearSearchResults();

    setButtonLoading(
      elements.searchButton,
      true,
      'SEARCHING…',
      'SEARCH'
    );

    setSearchMessage(
      'Finding matching locations…',
      false
    );

    try {
      const cacheKey =
        locationCacheKey(query);

      let locations =
        readSessionCache(cacheKey);

      if (!Array.isArray(locations)) {
        const center =
          state.map
            ? state.map.getCenter()
            : null;

        const response =
          await window.ApnaBiteAPI.request(
            'location.search',
            {
              query: query,
              latitude:
                center ? center.lat : '',
              longitude:
                center ? center.lng : ''
            },
            {
              retry: false,
              deduplicate: false,
              timeoutMs: 12000
            }
          );

        const data =
          response && response.data
            ? response.data
            : {};

        locations =
          Array.isArray(data.locations)
            ? data.locations
            : [];

        writeSessionCache(
          cacheKey,
          locations
        );
      }

      state.searchResults =
        locations
          .map(normalizeLocation)
          .filter(Boolean)
          .slice(0, 10);

      if (!state.searchResults.length) {
        setSearchMessage(
          'No location found. Add society, sector, city or PIN code.',
          true
        );
        return;
      }

      renderSearchResults(
        state.searchResults
      );

      setSearchMessage(
        state.searchResults.length +
        ' matching location' +
        (
          state.searchResults.length === 1
            ? ''
            : 's'
        ) +
        ' found. Select the correct one.',
        false
      );
    } catch (error) {
      console.error(
        'Location search failed:',
        error
      );

      setSearchMessage(
        error && error.message
          ? error.message
          : 'Unable to search location.',
        true
      );

      showToast(
        'Unable to search location. Please try again.',
        'error'
      );
    } finally {
      state.searchBusy = false;

      setButtonLoading(
        elements.searchButton,
        false,
        'SEARCHING…',
        'SEARCH'
      );
    }
  }

  function selectSearchResult(index) {
    const result =
      state.searchResults[index];

    if (!result || !state.map) return;

    state.skipNextMoveEnd = true;
    state.pendingSource = 'SEARCH';

    setSelectedLocation(result);

    state.map.setView(
      [
        result.latitude,
        result.longitude
      ],
      18,
      {
        animate: true
      }
    );

    clearSearchResults();

    setSearchMessage(
      'Location selected. Adjust the map pin if required.',
      false
    );

    document
      .getElementById('location-map')
      .scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
  }

  function initializeMap() {
    if (!window.L) {
      setMapLoading(false);

      showToast(
        'Map could not be loaded.',
        'error'
      );

      return false;
    }

    const cachedLocation =
      window.ApnaBiteCore.getJsonStorage(
        window.ApnaBiteCore
          .storageKeys.LOCATION,
        null
      );

    const cached =
      normalizeLocation(cachedLocation);

    const latitude =
      cached
        ? cached.latitude
        : 28.6139;

    const longitude =
      cached
        ? cached.longitude
        : 77.209;

    state.map =
      window.L.map('location-map', {
        zoomControl: true,
        attributionControl: true,
        preferCanvas: true
      }).setView(
        [latitude, longitude],
        cached ? 17 : 11
      );

    const tiles =
      window.L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          updateWhenIdle: true,
          keepBuffer: 2,
          attribution:
            '&copy; OpenStreetMap contributors'
        }
      );

    tiles.addTo(state.map);

    tiles.once('load', function() {
      setMapLoading(false);
    });

    window.setTimeout(function() {
      setMapLoading(false);

      if (state.map) {
        state.map.invalidateSize();
      }
    }, 900);

    state.map.on(
      'dragstart zoomstart',
      function() {
        window.clearTimeout(
          state.reverseTimer
        );

        state.pendingSource =
          'MAP_PIN';

        state.locationConfirmed =
          false;

        elements.receiverSection.hidden =
          true;

        elements.confirmButton.disabled =
          true;

        elements.confirmButton.textContent =
          'FETCHING LOCATION…';
      }
    );

    state.map.on(
      'moveend',
      function() {
        if (state.skipNextMoveEnd) {
          state.skipNextMoveEnd = false;
          return;
        }

        scheduleReverseLocation();
      }
    );

    if (cached) {
      setSelectedLocation(cached);
    }

    return true;
  }

  function scheduleReverseLocation() {
    window.clearTimeout(
      state.reverseTimer
    );

    state.reverseTimer =
      window.setTimeout(function() {
        if (!state.map) return;

        const center =
          state.map.getCenter();

        reverseLocation(
          center.lat,
          center.lng,
          state.pendingSource ||
          'MAP_PIN'
        );

        state.pendingSource =
          'MAP_PIN';
      }, 650);
  }

  async function reverseLocation(
    latitude,
    longitude,
    source
  ) {
    const cacheKey =
      reverseCacheKey(
        latitude,
        longitude
      );

    if (
      cacheKey ===
      state.lastReverseKey &&
      state.selectedLocation
    ) {
      resetConfirmation();
      return;
    }

    state.lastReverseKey = cacheKey;

    const cached =
      state.reverseCache.get(cacheKey);

    if (cached) {
      setSelectedLocation(
        Object.assign({}, cached, {
          source:
            source || 'MAP_PIN'
        })
      );
      return;
    }

    elements.selectedName.textContent =
      'Fetching exact location…';

    elements.selectedAddress.textContent =
      'Please wait';

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'location.reverse',
          {
            latitude: latitude,
            longitude: longitude
          },
          {
            retry: false,
            deduplicate: true,
            timeoutMs: 12000
          }
        );

      const data =
        response && response.data
          ? response.data
          : null;

      const location =
        normalizeLocation(
          Object.assign({}, data || {}, {
            latitude: latitude,
            longitude: longitude,
            source:
              source || 'MAP_PIN'
          })
        );

      if (!location) {
        throw new Error(
          'Exact location could not be identified.'
        );
      }

      state.reverseCache.set(
        cacheKey,
        location
      );

      setSelectedLocation(location);
    } catch (error) {
      console.error(
        'Reverse location failed:',
        error
      );

      setSelectedLocation({
        latitude: latitude,
        longitude: longitude,
        locationName:
          'Selected map location',
        fullAddress:
          'Pin placed on the selected location',
        source:
          source || 'MAP_PIN'
      });

      showToast(
        'Address details could not be loaded. You can still continue using the selected pin.',
        'warning'
      );
    }
  }

  function useCurrentLocation() {
    if (state.locationBusy) return;

    if (!navigator.geolocation) {
      showToast(
        'GPS is not supported on this device.',
        'error'
      );
      return;
    }

    state.locationBusy = true;

    setButtonLoading(
      elements.currentButton,
      true,
      'DETECTING LOCATION…',
      'USE MY CURRENT LOCATION'
    );

    navigator.geolocation.getCurrentPosition(
      function(position) {
        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;

        state.skipNextMoveEnd = true;
        state.pendingSource =
          'CURRENT_GPS';

        state.map.setView(
          [latitude, longitude],
          18,
          {
            animate: false
          }
        );

        reverseLocation(
          latitude,
          longitude,
          'CURRENT_GPS'
        ).finally(function() {
          state.locationBusy = false;

          setButtonLoading(
            elements.currentButton,
            false,
            'DETECTING LOCATION…',
            'USE MY CURRENT LOCATION'
          );
        });
      },
      function(error) {
        state.locationBusy = false;

        setButtonLoading(
          elements.currentButton,
          false,
          'DETECTING LOCATION…',
          'USE MY CURRENT LOCATION'
        );

        if (
          error &&
          error.code ===
            error.PERMISSION_DENIED
        ) {
          showToast(
            'Please allow location permission.',
            'warning'
          );
          return;
        }

        showToast(
          'Current location could not be detected.',
          'error'
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 180000
      }
    );
  }

  function renderSavedAddresses() {
    elements.savedList.innerHTML = '';

    elements.noSaved.hidden =
      state.savedAddresses.length > 0;

    state.savedAddresses
      .forEach(function(address) {
        const button =
          document.createElement('button');

        button.type = 'button';
        button.className =
          'saved-address-card';

        const icon =
          document.createElement('span');

        icon.className =
          'saved-address-card__icon';

        icon.textContent =
          clean(address.addressType)
            .toUpperCase() === 'WORK'
            ? '▣'
            : '⌂';

        const content =
          document.createElement('span');

        content.className =
          'saved-address-card__content';

        const label =
          document.createElement('strong');

        label.className =
          'saved-address-card__label';

        label.textContent =
          clean(address.addressLabel) ||
          'Saved address';

        const text =
          document.createElement('p');

        text.className =
          'saved-address-card__address';

        text.textContent =
          buildFullAddress(address);

        content.appendChild(label);
        content.appendChild(text);
        button.appendChild(icon);
        button.appendChild(content);

        button.addEventListener(
          'click',
          function() {
            selectSavedAddress(address);
          }
        );

        elements.savedList
          .appendChild(button);
      });
  }

  async function loadSavedAddresses() {
    try {
      const response =
        await window.ApnaBiteAPI.request(
          'address.list',
          {},
          {
            retry: false,
            deduplicate: true,
            timeoutMs: 10000
          }
        );

      state.savedAddresses =
        response &&
        Array.isArray(response.data)
          ? response.data
          : [];
    } catch (error) {
      state.savedAddresses = [];
    }

    renderSavedAddresses();
  }

  function selectSavedAddress(address) {
    const location =
      normalizeLocation({
        addressId: address.addressId,
        latitude: address.latitude,
        longitude: address.longitude,
        locationName:
          address.addressLabel ||
          address.area ||
          address.city,
        fullAddress:
          buildFullAddress(address),
        area: address.area,
        city: address.city,
        district: address.district,
        state: address.state,
        postalCode:
          address.postalCode,
        country: 'India',
        countryCode: 'IN',
        source: 'SAVED_ADDRESS'
      });

    if (!location) {
      showToast(
        'Map location is missing for this address.',
        'warning'
      );
      return;
    }

    state.skipNextMoveEnd = true;
    setSelectedLocation(location);

    elements.receiverName.value =
      clean(address.receiverName);

    elements.receiverMobile.value =
      digits(
        address.receiverMobile
      ).slice(-10);

    elements.addressFlat.value =
      clean(
        address.flatHouse ||
        address.addressLine1
      );

    elements.addressLandmark.value =
      clean(address.landmark);

    state.locationConfirmed = true;
    elements.receiverSection.hidden = false;
    elements.useOnce.checked = true;
    elements.addressLabelGroup.hidden = true;
    elements.confirmButton.textContent =
      'USE THIS ADDRESS';

    state.map.setView(
      [
        location.latitude,
        location.longitude
      ],
      18,
      {
        animate: true
      }
    );

    elements.receiverSection
      .scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
  }

  function handleSaveChoice() {
    elements.addressLabelGroup.hidden =
      !elements.saveFuture.checked;

    if (
      elements.saveFuture.checked &&
      !clean(elements.addressLabel.value)
    ) {
      elements.addressLabel.value =
        'Home';
    }
  }

  function validateDetails() {
    const receiverName =
      clean(elements.receiverName.value);

    const receiverMobile =
      digits(
        elements.receiverMobile.value
      );

    const addressLine1 =
      clean(elements.addressFlat.value);

    if (receiverName.length < 2) {
      showToast(
        'Please enter receiver name.',
        'warning'
      );

      elements.receiverName.focus();
      return null;
    }

    if (
      receiverMobile.length !== 10 ||
      !/^[6-9]/.test(receiverMobile)
    ) {
      showToast(
        'Please enter a valid 10-digit mobile number.',
        'warning'
      );

      elements.receiverMobile.focus();
      return null;
    }

    if (!addressLine1) {
      showToast(
        'Please enter flat or house details.',
        'warning'
      );

      elements.addressFlat.focus();
      return null;
    }

    if (
      elements.saveFuture.checked &&
      clean(elements.addressLabel.value)
        .length < 2
    ) {
      showToast(
        'Please enter an address label.',
        'warning'
      );

      elements.addressLabel.focus();
      return null;
    }

    return {
      addressId:
        state.selectedLocation.addressId ||
        '',
      addressLabel:
        elements.saveFuture.checked
          ? clean(elements.addressLabel.value)
          : '',
      addressType:
        elements.saveFuture.checked
          ? clean(elements.addressLabel.value)
              .toUpperCase()
          : 'OTHER',
      receiverName: receiverName,
      receiverMobile: receiverMobile,
      addressLine1: addressLine1,
      addressLine2: '',
      landmark:
        clean(
          elements.addressLandmark.value
        ),
      area:
        state.selectedLocation.area ||
        elements.addressArea.value,
      city:
        state.selectedLocation.city ||
        elements.addressCity.value,
      district:
        state.selectedLocation.district ||
        elements.addressDistrict.value,
      state:
        state.selectedLocation.state ||
        elements.addressState.value,
      postalCode:
        state.selectedLocation.postalCode,
      latitude:
        state.selectedLocation.latitude,
      longitude:
        state.selectedLocation.longitude,
      locationName:
        state.selectedLocation.locationName,
      providerAddress:
        state.selectedLocation.fullAddress,
      country:
        state.selectedLocation.country ||
        'India',
      countryCode:
        state.selectedLocation.countryCode ||
        'IN',
      source:
        state.selectedLocation.source,
      saveForFuture:
        elements.saveFuture.checked,
      selectedAt:
        new Date().toISOString()
    };
  }

  async function confirmLocation() {
    if (!state.selectedLocation) {
      showToast(
        'Please select a delivery location.',
        'warning'
      );
      return;
    }

    if (!state.locationConfirmed) {
      state.locationConfirmed = true;
      elements.receiverSection.hidden = false;
      elements.confirmButton.textContent =
        'SAVE & CONTINUE';

      window.setTimeout(function() {
        elements.receiverSection
          .scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });

        if (
          !clean(
            elements.receiverName.value
          )
        ) {
          elements.receiverName.focus();
        } else {
          elements.addressFlat.focus();
        }
      }, 100);

      return;
    }

    const deliveryAddress =
      validateDetails();

    if (!deliveryAddress) return;

    setButtonLoading(
      elements.confirmButton,
      true,
      'SAVING…',
      'SAVE & CONTINUE'
    );

    try {
      if (
        deliveryAddress.saveForFuture &&
        !deliveryAddress.addressId
      ) {
        const response =
          await window.ApnaBiteAPI.request(
            'address.save',
            deliveryAddress,
            {
              retry: false,
              deduplicate: false,
              timeoutMs: 12000
            }
          );

        if (
          response &&
          response.data &&
          response.data.addressId
        ) {
          deliveryAddress.addressId =
            response.data.addressId;
        }
      }

      window.ApnaBiteCore.setJsonStorage(
        window.ApnaBiteCore
          .storageKeys.LOCATION,
        deliveryAddress
      );

      showToast(
        deliveryAddress.saveForFuture
          ? 'Address saved successfully.'
          : 'Delivery location selected.',
        'success'
      );

      window.setTimeout(function() {
        window.location.replace(
          'home.html?v=14'
        );
      }, 500);
    } catch (error) {
      console.error(
        'Address confirmation failed:',
        error
      );

      showToast(
        error && error.message
          ? error.message
          : 'Unable to save address.',
        'error'
      );

      setButtonLoading(
        elements.confirmButton,
        false,
        'SAVING…',
        'SAVE & CONTINUE'
      );
    }
  }

  function goBack() {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.replace(
      'home.html?v=14'
    );
  }

  function bindEvents() {
    elements.backButton.addEventListener(
      'click',
      goBack
    );

    elements.searchForm.addEventListener(
      'submit',
      searchLocation
    );

    elements.currentButton.addEventListener(
      'click',
      useCurrentLocation
    );

    elements.mapCurrentButton
      .addEventListener(
        'click',
        useCurrentLocation
      );

    elements.useOnce.addEventListener(
      'change',
      handleSaveChoice
    );

    elements.saveFuture.addEventListener(
      'change',
      handleSaveChoice
    );

    elements.receiverMobile
      .addEventListener(
        'input',
        function() {
          elements.receiverMobile.value =
            digits(
              elements.receiverMobile.value
            ).slice(0, 10);
        }
      );

    elements.confirmButton
      .addEventListener(
        'click',
        confirmLocation
      );
  }

  function initializeLocationPage() {
    if (
      !document.getElementById(
        'location-map'
      )
    ) {
      return;
    }

    if (
      !window.ApnaBiteCore
        .requireLocalSession(
          ['CUSTOMER']
        )
    ) {
      return;
    }

    getElements();
    bindEvents();

    state.savedAddresses = [];
    renderSavedAddresses();
    setMapLoading(true);

    if (!initializeMap()) return;

    loadSavedAddresses();

    if (!state.selectedLocation) {
      useCurrentLocation();
    }
  }

  window.ApnaBiteCustomer =
    Object.freeze({
      initializeLocationPage:
        initializeLocationPage,
      searchLocation:
        searchLocation,
      useCurrentLocation:
        useCurrentLocation,
      confirmLocation:
        confirmLocation
    });

  window.ApnaBiteCore.ready(
    initializeLocationPage
  );
})(window, document);
