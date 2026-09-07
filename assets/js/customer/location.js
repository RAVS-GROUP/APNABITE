/**
 * ============================================================
 * APNABITE V1 — CUSTOMER LOCATION PAGE
 * File: assets/js/customer/location.js
 * Complete file — Part 1 of 3
 *
 * Rules:
 * - Saved address click selects it immediately.
 * - Saved address does not open editable mode.
 * - New GPS/search/map location requires confirmation.
 * - Return URL is preserved for Home or Checkout.
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const LOCATION_STORAGE_KEY = 'apnabite_location';
  const SELECTED_ADDRESS_KEY = 'apnabite_selected_address';
  const elements = {};

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
    reverseCache: new Map(),
    returnPage: 'home.html'
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    const elementMap = [
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
    ];

    elementMap.forEach(function(item) {
      elements[item[0]] = byId(item[1]);
    });
  }

  function requiredElementsAvailable() {
    const required = [
      'backButton',
      'searchForm',
      'searchInput',
      'searchButton',
      'searchResults',
      'currentButton',
      'mapLoading',
      'savedList',
      'noSaved',
      'selectedName',
      'selectedAddress',
      'receiverSection',
      'receiverName',
      'receiverMobile',
      'addressFlat',
      'addressLandmark',
      'addressArea',
      'addressCity',
      'addressDistrict',
      'addressState',
      'useOnce',
      'saveFuture',
      'addressLabelGroup',
      'addressLabel',
      'confirmButton'
    ];

    return required.every(function(name) {
      return Boolean(elements[name]);
    });
  }

  function clean(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return clean(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function digits(value) {
    return clean(value).replace(/\D/g, '');
  }

  function numberOrNull(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function toBoolean(value, fallback) {
    if (
      value === true ||
      value === 1 ||
      normalize(value) === 'TRUE' ||
      normalize(value) === 'YES' ||
      normalize(value) === '1'
    ) {
      return true;
    }

    if (
      value === false ||
      value === 0 ||
      normalize(value) === 'FALSE' ||
      normalize(value) === 'NO' ||
      normalize(value) === '0'
    ) {
      return false;
    }

    return Boolean(fallback);
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI.showToast === 'function'
    ) {
      window.ApnaBiteUI.showToast(message, type || 'info');
      return;
    }

    console.log(message);
  }

  function setButtonLoading(
    button,
    loading,
    loadingText,
    normalText
  ) {
    if (!button) return;

    button.disabled = Boolean(loading);
    button.textContent = loading
      ? loadingText
      : normalText;
  }

  function setSearchMessage(message, isError) {
    if (!elements.searchMessage) return;

    elements.searchMessage.textContent = message || '';

    elements.searchMessage.classList.toggle(
      'location-helper-text--error',
      Boolean(isError)
    );
  }

  function setMapLoading(loading) {
    if (elements.mapLoading) {
      elements.mapLoading.hidden = !loading;
    }
  }

  function getResponseData(response) {
    return (
      response &&
      response.data !== undefined
    )
      ? response.data
      : null;
  }

  function readSessionCache(key) {
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
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

  function writeLocalJson(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      return;
    }
  }

  function saveCoreLocation(location) {
    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore.setJsonStorage === 'function' &&
      window.ApnaBiteCore.storageKeys &&
      window.ApnaBiteCore.storageKeys.LOCATION
    ) {
      window.ApnaBiteCore.setJsonStorage(
        window.ApnaBiteCore.storageKeys.LOCATION,
        location
      );
    }

    writeLocalJson(
      LOCATION_STORAGE_KEY,
      location
    );
  }

  function saveSelectedAddress(address) {
    const selected = {
      addressId: clean(
        address.addressId
      ),
      addressLabel: clean(
        address.addressLabel
      ),
      addressType: clean(
        address.addressType
      ),
      receiverName: clean(
        address.receiverName
      ),
      receiverMobile: clean(
        address.receiverMobile
      ),
      addressLine1: clean(
        address.addressLine1
      ),
      addressLine2: clean(
        address.addressLine2
      ),
      landmark: clean(
        address.landmark
      ),
      area: clean(
        address.area
      ),
      city: clean(
        address.city
      ),
      district: clean(
        address.district
      ),
      state: clean(
        address.state
      ),
      postalCode: clean(
        address.postalCode
      ),
      latitude: Number(
        address.latitude
      ),
      longitude: Number(
        address.longitude
      ),
      fullAddress:
        buildFullAddress(address),
      source: 'SAVED_ADDRESS',
      selectedAt:
        new Date().toISOString()
    };

    writeLocalJson(
      SELECTED_ADDRESS_KEY,
      selected
    );

    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore.setJsonStorage === 'function' &&
      window.ApnaBiteCore.storageKeys &&
      window.ApnaBiteCore.storageKeys.SELECTED_ADDRESS
    ) {
      window.ApnaBiteCore.setJsonStorage(
        window.ApnaBiteCore.storageKeys.SELECTED_ADDRESS,
        selected
      );
    }

    saveCoreLocation(selected);

    return selected;
  }

  function getSafeReturnPage() {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    const requested =
      clean(parameters.get('return'));

    const allowed = [
      'home.html',
      'cart-checkout.html',
      'kitchen.html'
    ];

    return allowed.indexOf(requested) !== -1
      ? requested
      : 'home.html';
  }

  function redirectAfterSelection() {
    window.location.replace(
      state.returnPage
    );
  }

  function locationSearchCacheKey(query) {
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

    const exists = parts.some(function(item) {
      return item.toLowerCase() === part.toLowerCase();
    });

    if (!exists) {
      parts.push(part);
    }
  }

  function buildFullAddress(address) {
    const parts = [];

    addUniquePart(
      parts,
      address.addressLine1 ||
      address.flatHouse
    );
    addUniquePart(parts, address.addressLine2);
    addUniquePart(parts, address.landmark);
    addUniquePart(parts, address.area);
    addUniquePart(parts, address.city);
    addUniquePart(parts, address.district);
    addUniquePart(parts, address.state);
    addUniquePart(parts, address.postalCode);

    return parts.join(', ');
  }

  function normalizeLocation(location) {
    const input = location || {};
    const latitude = numberOrNull(
      input.latitude ||
      input.Latitude
    );
    const longitude = numberOrNull(
      input.longitude ||
      input.Longitude
    );

    if (
      latitude === null ||
      longitude === null
    ) {
      return null;
    }

    return {
      addressId: clean(
        input.addressId ||
        input.Address_ID
      ),
      latitude: latitude,
      longitude: longitude,
      locationName:
        clean(input.locationName) ||
        clean(input.addressLabel) ||
        clean(input.Address_Label) ||
        clean(input.area) ||
        clean(input.Area) ||
        clean(input.city) ||
        clean(input.City) ||
        'Selected location',
      fullAddress: clean(
        input.fullAddress ||
        input.providerAddress ||
        input.addressLine
      ),
      area: clean(
        input.area ||
        input.Area
      ),
      city: clean(
        input.city ||
        input.City
      ),
      district: clean(
        input.district ||
        input.District
      ),
      state: clean(
        input.state ||
        input.State
      ),
      postalCode: clean(
        input.postalCode ||
        input.Postal_Code
      ),
      country:
        clean(input.country) ||
        'India',
      countryCode:
        clean(input.countryCode) ||
        'IN',
      source:
        clean(input.source) ||
        'MAP_PIN'
    };
  }

  function normalizeSavedAddress(address) {
    const item = address || {};

    return {
      addressId: clean(
        item.addressId ||
        item.Address_ID
      ),
      addressLabel:
        clean(
          item.addressLabel ||
          item.Address_Label
        ) ||
        clean(
          item.addressType ||
          item.Address_Type
        ) ||
        'Saved address',
      addressType: normalize(
        item.addressType ||
        item.Address_Type ||
        'OTHER'
      ),
      receiverName: clean(
        item.receiverName ||
        item.Receiver_Name
      ),
      receiverMobile: clean(
        item.receiverMobile ||
        item.Receiver_Mobile
      ),
      addressLine1: clean(
        item.addressLine1 ||
        item.Address_Line_1
      ),
      addressLine2: clean(
        item.addressLine2 ||
        item.Address_Line_2
      ),
      landmark: clean(
        item.landmark ||
        item.Landmark
      ),
      area: clean(
        item.area ||
        item.Area
      ),
      city: clean(
        item.city ||
        item.City
      ),
      district: clean(
        item.district ||
        item.District
      ),
      state: clean(
        item.state ||
        item.State
      ),
      postalCode: clean(
        item.postalCode ||
        item.Postal_Code
      ),
      latitude: numberOrNull(
        item.latitude ||
        item.Latitude
      ),
      longitude: numberOrNull(
        item.longitude ||
        item.Longitude
      ),
      isDefault: toBoolean(
        item.isDefault !== undefined
          ? item.isDefault
          : item.Is_Default,
        false
      ),
      isActive: toBoolean(
        item.isActive !== undefined
          ? item.isActive
          : item.Is_Active,
        true
      )
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

  function resetNewLocationConfirmation() {
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
    resetNewLocationConfirmation();
  }

  /*
   * Continue directly with Part 2 below this line.
   */
   function clearSearchResults() {
    state.searchResults = [];
    elements.searchResults.innerHTML = '';
  }

  function renderSearchResults(results) {
    elements.searchResults.innerHTML = '';

    results.slice(0, 10).forEach(
      function(result, index) {
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
      }
    );
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
        locationSearchCacheKey(query);

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
          getResponseData(response) || {};

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
        ' found.',
        false
      );
    } catch (error) {
      console.error(
        'Location search failed:',
        error
      );

      setSearchMessage(
        clean(error && error.message) ||
        'Unable to search location.',
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

    if (!result || !state.map) {
      return;
    }

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

    const mapElement =
      byId('location-map');

    if (mapElement) {
      mapElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }

  function readCachedLocation() {
    let cached = null;

    if (
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore.getJsonStorage === 'function' &&
      window.ApnaBiteCore.storageKeys &&
      window.ApnaBiteCore.storageKeys.LOCATION
    ) {
      cached =
        window.ApnaBiteCore.getJsonStorage(
          window.ApnaBiteCore.storageKeys.LOCATION,
          null
        );
    }

    if (!cached) {
      try {
        const stored =
          localStorage.getItem(
            LOCATION_STORAGE_KEY
          );

        cached = stored
          ? JSON.parse(stored)
          : null;
      } catch (error) {
        cached = null;
      }
    }

    return normalizeLocation(cached);
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

    const cached =
      readCachedLocation();

    const latitude =
      cached ? cached.latitude : 28.6139;

    const longitude =
      cached ? cached.longitude : 77.209;

    state.map =
      window.L.map(
        'location-map',
        {
          zoomControl: true,
          attributionControl: true,
          preferCanvas: true
        }
      ).setView(
        [
          latitude,
          longitude
        ],
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

    tiles.once(
      'load',
      function() {
        setMapLoading(false);
      }
    );

    window.setTimeout(
      function() {
        setMapLoading(false);

        if (state.map) {
          state.map.invalidateSize();
        }
      },
      900
    );

    state.map.on(
      'dragstart zoomstart',
      function() {
        window.clearTimeout(
          state.reverseTimer
        );

        state.pendingSource = 'MAP_PIN';
        state.locationConfirmed = false;
        elements.receiverSection.hidden = true;
        elements.confirmButton.disabled = true;
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
      window.setTimeout(
        function() {
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
        },
        650
      );
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
      resetNewLocationConfirmation();
      return;
    }

    state.lastReverseKey = cacheKey;

    const cached =
      state.reverseCache.get(
        cacheKey
      );

    if (cached) {
      setSelectedLocation(
        Object.assign(
          {},
          cached,
          {
            source:
              source || 'MAP_PIN'
          }
        )
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
        getResponseData(response) || {};

      const location =
        normalizeLocation(
          Object.assign(
            {},
            data,
            {
              latitude: latitude,
              longitude: longitude,
              source:
                source || 'MAP_PIN'
            }
          )
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
        'Address details could not be loaded. You can still continue using this pin.',
        'warning'
      );
    }
  }

  function useCurrentLocation(options) {
    const config = options || {};

    if (state.locationBusy) {
      return Promise.resolve(null);
    }

    if (!navigator.geolocation) {
      showToast(
        'GPS is not supported on this device.',
        'error'
      );

      return Promise.resolve(null);
    }

    state.locationBusy = true;

    setButtonLoading(
      elements.currentButton,
      true,
      'DETECTING LOCATION…',
      'USE MY CURRENT LOCATION'
    );

    if (elements.mapCurrentButton) {
      elements.mapCurrentButton.disabled =
        true;
    }

    return new Promise(
      function(resolve) {
        navigator.geolocation
          .getCurrentPosition(
            function(position) {
              const latitude =
                position.coords.latitude;

              const longitude =
                position.coords.longitude;

              state.skipNextMoveEnd = true;
              state.pendingSource =
                'CURRENT_GPS';

              if (state.map) {
                state.map.setView(
                  [
                    latitude,
                    longitude
                  ],
                  18,
                  {
                    animate: false
                  }
                );
              }

              reverseLocation(
                latitude,
                longitude,
                'CURRENT_GPS'
              )
                .then(function() {
                  resolve({
                    latitude: latitude,
                    longitude: longitude
                  });
                })
                .finally(
                  finishCurrentLocation
                );
            },
            function(error) {
              finishCurrentLocation();

              if (
                error &&
                error.code ===
                  error.PERMISSION_DENIED
              ) {
                if (!config.silent) {
                  showToast(
                    'Please allow location permission.',
                    'warning'
                  );
                }

                resolve(null);
                return;
              }

              if (!config.silent) {
                showToast(
                  'Current location could not be detected.',
                  'error'
                );
              }

              resolve(null);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 120000
            }
          );
      }
    );
  }

  function finishCurrentLocation() {
    state.locationBusy = false;

    setButtonLoading(
      elements.currentButton,
      false,
      'DETECTING LOCATION…',
      'USE MY CURRENT LOCATION'
    );

    if (elements.mapCurrentButton) {
      elements.mapCurrentButton.disabled =
        false;
    }
  }

  /*
   * Continue directly with Part 3 below this line.
   */
   function renderSavedAddresses() {
    elements.savedList.innerHTML = '';

    elements.noSaved.hidden =
      state.savedAddresses.length > 0;

    state.savedAddresses.forEach(
      function(address) {
        const button =
          document.createElement(
            'button'
          );

        button.type = 'button';
        button.className =
          'saved-address-card';

        button.dataset.addressId =
          address.addressId;

        const icon =
          document.createElement(
            'span'
          );

        icon.className =
          'saved-address-card__icon';

        icon.textContent =
          address.addressType === 'WORK'
            ? '▣'
            : '⌂';

        const content =
          document.createElement(
            'span'
          );

        content.className =
          'saved-address-card__content';

        const label =
          document.createElement(
            'strong'
          );

        label.className =
          'saved-address-card__label';

        label.textContent =
          address.addressLabel ||
          'Saved address';

        const addressText =
          document.createElement('p');

        addressText.className =
          'saved-address-card__address';

        addressText.textContent =
          buildFullAddress(address);

        const action =
          document.createElement(
            'small'
          );

        action.className =
          'saved-address-card__action';

        action.textContent =
          'Tap to select';

        content.appendChild(label);
        content.appendChild(addressText);
        content.appendChild(action);

        button.appendChild(icon);
        button.appendChild(content);

        button.addEventListener(
          'click',
          function() {
            selectSavedAddress(
              address
            );
          }
        );

        elements.savedList
          .appendChild(button);
      }
    );
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

      const data =
        getResponseData(response);

      let records = [];

      if (Array.isArray(data)) {
        records = data;
      } else if (
        data &&
        Array.isArray(data.items)
      ) {
        records = data.items;
      } else if (
        data &&
        Array.isArray(data.addresses)
      ) {
        records = data.addresses;
      }

      state.savedAddresses =
        records
          .map(normalizeSavedAddress)
          .filter(function(address) {
            return (
              address.addressId &&
              address.isActive &&
              address.latitude !== null &&
              address.longitude !== null
            );
          });
    } catch (error) {
      console.error(
        'Saved addresses failed:',
        error
      );

      state.savedAddresses = [];
    }

    renderSavedAddresses();

    return state.savedAddresses;
  }

  function selectSavedAddress(address) {
    if (
      !address ||
      !address.addressId ||
      address.latitude === null ||
      address.longitude === null
    ) {
      showToast(
        'Location is missing for this saved address.',
        'warning'
      );
      return;
    }

    /*
     * Saved address is selected immediately.
     * It does not open receiver/edit fields.
     */
    saveSelectedAddress(address);

    showToast(
      (
        address.addressLabel ||
        'Saved address'
      ) +
      ' selected.',
      'success'
    );

    window.setTimeout(
      redirectAfterSelection,
      150
    );
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
      ).slice(-10);

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
      clean(
        elements.addressLabel.value
      ).length < 2
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
        clean(
          state.selectedLocation.addressId
        ),

      addressLabel:
        elements.saveFuture.checked
          ? clean(
              elements.addressLabel.value
            )
          : 'Current location',

      addressType:
        elements.saveFuture.checked
          ? normalize(
              elements.addressLabel.value
            )
          : 'OTHER',

      receiverName:
        receiverName,

      receiverMobile:
        receiverMobile,

      addressLine1:
        addressLine1,

      addressLine2:
        '',

      landmark:
        clean(
          elements.addressLandmark.value
        ),

      area:
        state.selectedLocation.area ||
        clean(elements.addressArea.value),

      city:
        state.selectedLocation.city ||
        clean(elements.addressCity.value),

      district:
        state.selectedLocation.district ||
        clean(elements.addressDistrict.value),

      state:
        state.selectedLocation.state ||
        clean(elements.addressState.value),

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

      fullAddress:
        '',

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

  function openNewLocationDetails() {
    state.locationConfirmed = true;
    elements.receiverSection.hidden = false;
    elements.confirmButton.textContent =
      'SAVE & CONTINUE';

    window.setTimeout(
      function() {
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
      },
      100
    );
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
      openNewLocationDetails();
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

        const data =
          getResponseData(response) || {};

        deliveryAddress.addressId =
          clean(
            data.addressId ||
            (
              data.address &&
              data.address.addressId
            )
          );
      }

      deliveryAddress.fullAddress =
        buildFullAddress(
          deliveryAddress
        ) ||
        deliveryAddress.providerAddress;

      if (deliveryAddress.addressId) {
        saveSelectedAddress(
          deliveryAddress
        );
      } else {
        /*
         * Use-once location is stored locally.
         * It is not added to Saved Addresses.
         */
        saveCoreLocation(
          deliveryAddress
        );

        writeLocalJson(
          SELECTED_ADDRESS_KEY,
          deliveryAddress
        );
      }

      showToast(
        deliveryAddress.saveForFuture
          ? 'Address saved and selected.'
          : 'Current location selected.',
        'success'
      );

      window.setTimeout(
        redirectAfterSelection,
        150
      );
    } catch (error) {
      console.error(
        'Location confirmation glace failed:',
        error
      );

      showToast(
        clean(error && error.message) ||
        'Location could not be saved.',
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
    if (
      state.returnPage &&
      state.returnPage !== 'home.html'
    ) {
      window.location.href =
        state.returnPage;
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href =
      'home.html';
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
      function() {
        useCurrentLocation({
          silent: false
        });
      }
    );

    if (elements.mapCurrentButton) {
      elements.mapCurrentButton
        .addEventListener(
          'click',
          function() {
            useCurrentLocation({
              silent: false
            });
          }
        );
    }

    elements.useOnce.addEventListener(
      'change',
      handleSaveChoice
    );

    elements.saveFuture.addEventListener(
      'change',
      handleSaveChoice
    );

    elements.receiverMobile.addEventListener(
      'input',
      function() {
        elements.receiverMobile.value =
          digits(
            elements.receiverMobile.value
          ).slice(-10);
      }
    );

    elements.confirmButton.addEventListener(
      'click',
      confirmLocation
    );
  }

  async function initialize() {
    if (!byId('location-map')) {
      return;
    }

    collectElements();

    if (!requiredElementsAvailable()) {
      console.error(
        'Customer location page elements are incomplete.'
      );
      return;
    }

    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      showToast(
        'Required application files did not load.',
        'error'
      );
      return;
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession === 'function' &&
      !window.ApnaBiteCore
        .requireLocalSession([
          'CUSTOMER'
        ])
    ) {
      return;
    }

    state.returnPage =
      getSafeReturnPage();

    bindEvents();
    setMapLoading(true);

    if (!initializeMap()) {
      return;
    }

    await loadSavedAddresses();

    /*
     * Saved addresses are displayed first.
     * GPS is requested automatically only when
     * no usable cached location is available.
     */
    if (!state.selectedLocation) {
      await useCurrentLocation({
        silent: true
      });
    }
  }

  window.ApnaBiteCustomerLocation = {
    refreshSavedAddresses:
      loadSavedAddresses,

    useCurrentLocation:
      useCurrentLocation,

    selectSavedAddress:
      function(addressId) {
        const address =
          state.savedAddresses.find(
            function(item) {
              return (
                item.addressId ===
                clean(addressId)
              );
            }
          );

        if (address) {
          selectSavedAddress(address);
        }
      }
  };

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );
  } else {
    initialize();
  }
})(window, document);
