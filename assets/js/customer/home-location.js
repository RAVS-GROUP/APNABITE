/**
 * ============================================================
 * APNABITE V1 — CUSTOMER HOME LOCATION
 * File: assets/js/customer/home-location.js
 * Complete file — Part 1 of 2
 *
 * Rules:
 * - Request current GPS whenever Customer Home opens.
 * - If nearest saved address is within 500 metres, select it.
 * - Otherwise use exact current GPS coordinates.
 * - Start discovery only after a usable location is available.
 * - Avoid separate session-validation API call.
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const NEARBY_ADDRESS_LIMIT_KM = 0.5;
  const LOCATION_STORAGE_KEY = 'apnabite_location';
  const SELECTED_ADDRESS_KEY = 'apnabite_selected_address';

  const state = {
    initialized: false,
    discoveryStarted: false,
    savedAddresses: [],
    currentLocation: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.greeting = byId('customer-greeting');
    elements.headerLocation = byId('header-location');
    elements.changeLocationButton = byId('change-location-button');
    elements.locationHeaderButton = byId('location-header-button');
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

  function getResponseData(response) {
    return (
      response &&
      response.data !== undefined
    )
      ? response.data
      : null;
  }

  function getCachedUser() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteCore.storageKeys ||
      typeof window.ApnaBiteCore.getJsonStorage !== 'function'
    ) {
      return null;
    }

    return window.ApnaBiteCore.getJsonStorage(
      window.ApnaBiteCore.storageKeys.SESSION_USER,
      null
    );
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
              address &&
              address.addressId &&
              address.isActive
            );
          });
    } catch (error) {
      console.error(
        'Saved addresses could not be loaded:',
        error
      );

      state.savedAddresses = [];
    }

    return state.savedAddresses;
  }

  function requestCurrentPosition() {
    return new Promise(
      function(resolve, reject) {
        if (!navigator.geolocation) {
          reject(
            new Error(
              'GPS is not supported on this device.'
            )
          );
          return;
        }

        navigator.geolocation
          .getCurrentPosition(
            function(position) {
              resolve({
                latitude:
                  position.coords.latitude,
                longitude:
                  position.coords.longitude,
                accuracy:
                  numberOrNull(
                    position.coords.accuracy
                  ),
                source:
                  'CURRENT_GPS'
              });
            },
            reject,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            }
          );
      }
    );
  }

  function startDiscovery(location) {
    if (
      state.discoveryStarted ||
      !location ||
      !window.ApnaBiteDiscovery ||
      typeof window.ApnaBiteDiscovery
        .setup !== 'function'
    ) {
      return;
    }

    state.discoveryStarted = true;

    window.ApnaBiteDiscovery.setup(
      location
    );
  }

  async function reverseCurrentLocation(
    currentLocation
  ) {
    try {
      const response =
        await window.ApnaBiteAPI.request(
          'location.reverse',
          {
            latitude:
              currentLocation.latitude,
            longitude:
              currentLocation.longitude
          },
          {
            retry: false,
            deduplicate: true,
            timeoutMs: 12000
          }
        );

      const responseData =
        getResponseData(response) || {};

      const data =
        responseData.location ||
        responseData;

      const detailedLocation =
        normalizeLocation(
          Object.assign(
            {},
            data,
            {
              latitude:
                currentLocation.latitude,
              longitude:
                currentLocation.longitude,
              source:
                'CURRENT_GPS'
            }
          )
        );

      if (!detailedLocation) {
        return;
      }

      /*
       * Coordinates remain unchanged, therefore
       * discovery API is not called again.
       */
      saveLocation(
        detailedLocation
      );
    } catch (error) {
      console.warn(
        'Current address name could not be loaded.'
      );
    }
  }

  async function detectAndSelectLocation() {
    setLocationStatus(
      'Detecting location',
      'warning'
    );

    if (elements.headerLocation) {
      elements.headerLocation.textContent =
        'Detecting current location…';
    }

    const cachedLocation =
      readCoreLocation();

    const results =
      await Promise.allSettled([
        loadSavedAddresses(),
        requestCurrentPosition()
      ]);

    const positionResult =
      results[1];

    if (
      positionResult.status ===
      'fulfilled'
    ) {
      const position =
        positionResult.value;

      const nearbySavedAddress =
        findNearestSavedAddress(
          position.latitude,
          position.longitude
        );

      if (nearbySavedAddress) {
        const selected =
          Object.assign(
            {},
            nearbySavedAddress.address,
            {
              source:
                'AUTO_NEARBY_SAVED',
              detectedDistanceMetres:
                Math.round(
                  nearbySavedAddress
                    .distanceKm *
                  1000
                )
            }
          );

        saveLocation(selected);
        startDiscovery(selected);

        setLocationStatus(
          'Updated',
          'success'
        );

        return selected;
      }

      /*
       * No saved address exists within 500 m.
       * Use exact GPS immediately so Kitchens
       * load without waiting for reverse lookup.
       */
      const currentLocation = {
        addressId: '',
        addressLabel: '',
        latitude:
          position.latitude,
        longitude:
          position.longitude,
        locationName:
          'Current location',
        fullAddress:
          'Using your current GPS location',
        area: '',
        city: '',
        district: '',
        state: '',
        postalCode: '',
        country: 'India',
        countryCode: 'IN',
        source: 'CURRENT_GPS',
        accuracyMetres:
          position.accuracy
      };

      saveLocation(currentLocation);
      startDiscovery(currentLocation);

      setLocationStatus(
        'Updated',
        'success'
      );

      /*
       * Address name loads in background.
       * Customer does not wait for this call.
       */
      reverseCurrentLocation(
        currentLocation
      );

      return currentLocation;
    }

    /*
     * Permission denied, timeout or GPS error:
     * use previously selected location so Home
     * remains usable and fast.
     */
    if (cachedLocation) {
      saveLocation(cachedLocation);
      startDiscovery(cachedLocation);

      setLocationStatus(
        'Using saved location',
        'warning'
      );

      showToast(
        'Current location was unavailable. Using your previously selected location.',
        'warning'
      );

      return cachedLocation;
    }

    setLocationStatus(
      'Location required',
      'danger'
    );

    if (elements.headerLocation) {
      elements.headerLocation.textContent =
        'Select delivery location';
    }

    showToast(
      'Allow location permission or select a delivery address.',
      'warning'
    );

    return null;
  }

  function openLocationPage() {
    window.location.href =
      'location.html?return=' +
      encodeURIComponent(
        'home.html'
      );
  }

  function bindEvents() {
    elements.changeLocationButton
      .addEventListener(
        'click',
        openLocationPage
      );

    elements.locationHeaderButton
      .addEventListener(
        'click',
        openLocationPage
      );

    window.addEventListener(
      'pageshow',
      function(event) {
        if (
          !event.persisted ||
          !state.initialized
        ) {
          return;
        }

        /*
         * Page restored from browser memory.
         * Re-check GPS, but Discovery setup is
         * protected from duplicate initialization.
         */
        detectAndSelectLocation();
      }
    );
  }

  async function initialize() {
    if (state.initialized) return;

    collectElements();

    if (
      !elements.greeting ||
      !elements.headerLocation ||
      !elements.changeLocationButton ||
      !elements.locationHeaderButton
    ) {
      console.error(
        'Customer Home location elements are incomplete.'
      );
      return;
    }

    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI ||
      !window.ApnaBiteDiscovery
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

    state.initialized = true;

    updateGreetingFromLocalSession();
    bindEvents();

    await detectAndSelectLocation();
  }

  window.ApnaBiteCustomerHomeLocation = {
    refresh:
      detectAndSelectLocation,

    getCurrentLocation:
      function() {
        return state.currentLocation
          ? Object.assign(
              {},
              state.currentLocation
            )
          : null;
      },

    getSavedAddresses:
      function() {
        return state.savedAddresses.map(
          function(address) {
            return Object.assign(
              {},
              address
            );
          }
        );
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
