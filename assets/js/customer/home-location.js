/**
 * ============================================================
 * APNABITE V1 — CUSTOMER HOME LOCATION
 * File: assets/js/customer/home-location.js
 * Complete replacement
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    NEARBY_ADDRESS_LIMIT_KM: 0.5,
    GPS_TIMEOUT_MS: 10000,
    GPS_MAXIMUM_AGE_MS: 60000,
    LOCATION_STORAGE_KEY:
      'apnabite_location',
    SELECTED_ADDRESS_KEY:
      'apnabite_selected_address'
  });

  const state = {
    initialized: false,
    detecting: false,
    savedAddresses: [],
    currentLocation: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.greeting =
      byId('customer-greeting');

    elements.headerLocation =
      byId('header-location');

    elements.changeLocationButton =
      byId('change-location-button');

    elements.locationHeaderButton =
      byId('location-header-button');

    elements.backendStatus =
      byId('backend-status');
  }

  function clean(value) {
    return String(
      value === undefined ||
      value === null
        ? ''
        : value
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return clean(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function numberOrNull(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function toBoolean(value, fallback) {
    const normalized =
      normalize(value);

    if (
      value === true ||
      value === 1 ||
      normalized === 'TRUE' ||
      normalized === 'YES' ||
      normalized === '1'
    ) {
      return true;
    }

    if (
      value === false ||
      value === 0 ||
      normalized === 'FALSE' ||
      normalized === 'NO' ||
      normalized === '0'
    ) {
      return false;
    }

    return Boolean(fallback);
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
      typeof window.ApnaBiteCore
        .getJsonStorage !== 'function'
    ) {
      return null;
    }

    return window.ApnaBiteCore
      .getJsonStorage(
        window.ApnaBiteCore
          .storageKeys.SESSION_USER,
        null
      );
  }

  function updateGreetingFromLocalSession() {
    if (!elements.greeting) return;

    const user =
      getCachedUser() || {};

    const fullName =
      clean(
        user.fullName ||
        user.Full_Name ||
        user.name
      );

    const firstName =
      fullName
        ? fullName.split(/\s+/)[0]
        : '';

    elements.greeting.textContent =
      firstName
        ? 'Hello, ' + firstName + '!'
        : 'Hello!';
  }

  function normalizeLocation(location) {
    const input = location || {};

    const latitude =
      numberOrNull(
        input.latitude !== undefined
          ? input.latitude
          : input.Latitude
      );

    const longitude =
      numberOrNull(
        input.longitude !== undefined
          ? input.longitude
          : input.Longitude
      );

    if (
      latitude === null ||
      longitude === null
    ) {
      return null;
    }

    return {
      addressId:
        clean(
          input.addressId ||
          input.Address_ID
        ),

      addressLabel:
        clean(
          input.addressLabel ||
          input.Address_Label
        ),

      addressType:
        clean(
          input.addressType ||
          input.Address_Type
        ),

      receiverName:
        clean(
          input.receiverName ||
          input.Receiver_Name
        ),

      receiverMobile:
        clean(
          input.receiverMobile ||
          input.Receiver_Mobile
        ),

      addressLine1:
        clean(
          input.addressLine1 ||
          input.flatHouse ||
          input.Address_Line_1
        ),

      addressLine2:
        clean(
          input.addressLine2 ||
          input.Address_Line_2
        ),

      landmark:
        clean(
          input.landmark ||
          input.Landmark
        ),

      area:
        clean(
          input.area ||
          input.Area
        ),

      city:
        clean(
          input.city ||
          input.City
        ),

      district:
        clean(
          input.district ||
          input.District
        ),

      state:
        clean(
          input.state ||
          input.State
        ),

      postalCode:
        clean(
          input.postalCode ||
          input.Postal_Code
        ),

      latitude: latitude,
      longitude: longitude,

      locationName:
        clean(
          input.locationName
        ) ||
        clean(
          input.addressLabel ||
          input.Address_Label
        ) ||
        clean(
          input.area ||
          input.Area
        ) ||
        clean(
          input.city ||
          input.City
        ) ||
        'Selected location',

      fullAddress:
        clean(
          input.fullAddress ||
          input.providerAddress
        ),

      country:
        clean(input.country) ||
        'India',

      countryCode:
        clean(input.countryCode) ||
        'IN',

      source:
        clean(input.source) ||
        'SAVED_LOCATION',

      isActive:
        input.isActive === undefined &&
        input.Is_Active === undefined
          ? true
          : toBoolean(
              input.isActive !== undefined
                ? input.isActive
                : input.Is_Active,
              true
            ),

      selectedAt:
        clean(input.selectedAt)
    };
  }

  function normalizeSavedAddress(address) {
    const normalized =
      normalizeLocation(address);

    if (!normalized) return null;

    if (!normalized.fullAddress) {
      normalized.fullAddress = [
        normalized.addressLine1,
        normalized.addressLine2,
        normalized.landmark,
        normalized.area,
        normalized.city,
        normalized.state,
        normalized.postalCode
      ]
        .filter(Boolean)
        .join(', ');
    }

    normalized.source =
      'SAVED_ADDRESS';

    return normalized;
  }

  function readLocalJson(key) {
    try {
      const value =
        window.localStorage.getItem(key);

      return value
        ? JSON.parse(value)
        : null;
    } catch (error) {
      return null;
    }
  }

  function writeLocalJson(key, value) {
    try {
      window.localStorage.setItem(
        key,
        JSON.stringify(value)
      );
    } catch (error) {
      console.warn(
        'Location could not be cached.'
      );
    }
  }

  function readCoreLocation() {
    if (
      window.ApnaBiteCore &&
      window.ApnaBiteCore.storageKeys &&
      typeof window.ApnaBiteCore
        .getJsonStorage === 'function'
    ) {
      const stored =
        window.ApnaBiteCore
          .getJsonStorage(
            window.ApnaBiteCore
              .storageKeys.LOCATION,
            null
          );

      const normalized =
        normalizeLocation(stored);

      if (normalized) {
        return normalized;
      }
    }

    return normalizeLocation(
      readLocalJson(
        CONFIG.LOCATION_STORAGE_KEY
      )
    );
  }

  function displayLocation(location) {
    if (!elements.headerLocation) return;

    elements.headerLocation.textContent =
      clean(location.addressLabel) ||
      clean(location.locationName) ||
      clean(location.area) ||
      clean(location.city) ||
      'Selected location';
  }

  function saveLocation(location) {
    const normalized =
      normalizeLocation(location);

    if (!normalized) return null;

    normalized.selectedAt =
      new Date().toISOString();

    state.currentLocation =
      normalized;

    writeLocalJson(
      CONFIG.LOCATION_STORAGE_KEY,
      normalized
    );

    if (normalized.addressId) {
      writeLocalJson(
        CONFIG.SELECTED_ADDRESS_KEY,
        normalized
      );
    }

    if (
      window.ApnaBiteCore &&
      window.ApnaBiteCore.storageKeys &&
      typeof window.ApnaBiteCore
        .setJsonStorage === 'function'
    ) {
      window.ApnaBiteCore
        .setJsonStorage(
          window.ApnaBiteCore
            .storageKeys.LOCATION,
          normalized
        );

      if (
        normalized.addressId &&
        window.ApnaBiteCore
          .storageKeys.SELECTED_ADDRESS
      ) {
        window.ApnaBiteCore
          .setJsonStorage(
            window.ApnaBiteCore
              .storageKeys.SELECTED_ADDRESS,
            normalized
          );
      }
    }

    displayLocation(normalized);

    return normalized;
  }

  function setLocationStatus(text, type) {
    if (!elements.backendStatus) return;

    elements.backendStatus.textContent =
      text;

    if (type === 'success') {
      elements.backendStatus.className =
        'badge badge--success';

      return;
    }

    if (
      type === 'danger' ||
      type === 'error'
    ) {
      elements.backendStatus.className =
        'badge badge--danger';

      return;
    }

    elements.backendStatus.className =
      'badge badge--warning';
  }

  function calculateDistanceKm(
    firstLatitude,
    firstLongitude,
    secondLatitude,
    secondLongitude
  ) {
    const earthRadiusKm = 6371;

    const toRadians =
      function(value) {
        return Number(value) *
          Math.PI / 180;
      };

    const latitudeDifference =
      toRadians(
        secondLatitude -
        firstLatitude
      );

    const longitudeDifference =
      toRadians(
        secondLongitude -
        firstLongitude
      );

    const firstLatitudeRadians =
      toRadians(firstLatitude);

    const secondLatitudeRadians =
      toRadians(secondLatitude);

    const value =
      Math.sin(
        latitudeDifference / 2
      ) ** 2 +
      Math.cos(
        firstLatitudeRadians
      ) *
      Math.cos(
        secondLatitudeRadians
      ) *
      Math.sin(
        longitudeDifference / 2
      ) ** 2;

    return earthRadiusKm *
      2 *
      Math.atan2(
        Math.sqrt(value),
        Math.sqrt(1 - value)
      );
  }

  function findNearestSavedAddress(
    latitude,
    longitude
  ) {
    let nearest = null;

    state.savedAddresses
      .forEach(function(address) {
        const distanceKm =
          calculateDistanceKm(
            latitude,
            longitude,
            address.latitude,
            address.longitude
          );

        if (
          distanceKm >
          CONFIG.NEARBY_ADDRESS_LIMIT_KM
        ) {
          return;
        }

        if (
          !nearest ||
          distanceKm <
          nearest.distanceKm
        ) {
          nearest = {
            address: address,
            distanceKm: distanceKm
          };
        }
      });

    return nearest;
  }

  async function loadSavedAddresses() {
    try {
      const response =
        await window.ApnaBiteAPI
          .request(
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
            return Boolean(
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
              'GPS is not supported.'
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

            function(error) {
              reject(error);
            },

            {
              enableHighAccuracy: true,
              timeout:
                CONFIG.GPS_TIMEOUT_MS,
              maximumAge:
                CONFIG
                  .GPS_MAXIMUM_AGE_MS
            }
          );
      }
    );
  }

  function startDiscovery(location) {
    if (
      !location ||
      !window.ApnaBiteDiscovery ||
      typeof window.ApnaBiteDiscovery
        .setup !== 'function'
    ) {
      return;
    }

    window.ApnaBiteDiscovery
      .setup(location);
  }

  async function reverseCurrentLocation(
    currentLocation
  ) {
    try {
      const response =
        await window.ApnaBiteAPI
          .request(
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

      const locationData =
        responseData.location ||
        responseData;

      const detailedLocation =
        normalizeLocation(
          Object.assign(
            {},
            locationData,
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

      if (!detailedLocation) return;

      /*
       * Only address text changes.
       * Discovery does not need another call.
       */
      saveLocation(detailedLocation);
    } catch (error) {
      console.warn(
        'Current address name could not be loaded.'
      );
    }
  }

  function cameFromLocationPage() {
    try {
      const referrer =
        clean(document.referrer);

      return (
        referrer.indexOf(
          '/customer/location.html'
        ) !== -1
      );
    } catch (error) {
      return false;
    }
  }

  async function detectAndSelectLocation() {
    if (state.detecting) return;

    state.detecting = true;

    const cachedLocation =
      readCoreLocation();

    /*
     * A saved address explicitly selected on
     * location.html must be used immediately.
     * GPS must not overwrite that selection.
     */
    if (
      cameFromLocationPage() &&
      cachedLocation &&
      cachedLocation.addressId
    ) {
      const selected =
        saveLocation(
          Object.assign(
            {},
            cachedLocation,
            {
              source:
                'MANUAL_SAVED_ADDRESS'
            }
          )
        );

      startDiscovery(selected);

      setLocationStatus(
        'Updated',
        'success'
      );

      state.detecting = false;

      return selected;
    }

    setLocationStatus(
      'Detecting location',
      'warning'
    );

    if (elements.headerLocation) {
      elements.headerLocation.textContent =
        'Detecting current location…';
    }

    try {
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
            saveLocation(
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
              )
            );

          startDiscovery(selected);

          setLocationStatus(
            'Updated',
            'success'
          );

          return selected;
        }

        const currentLocation =
          saveLocation({
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
          });

        startDiscovery(
          currentLocation
        );

        setLocationStatus(
          'Updated',
          'success'
        );

        reverseCurrentLocation(
          currentLocation
        );

        return currentLocation;
      }

      if (cachedLocation) {
        const selected =
          saveLocation(
            cachedLocation
          );

        startDiscovery(selected);

        setLocationStatus(
          'Using saved location',
          'warning'
        );

        showToast(
          'GPS unavailable. Using your previously selected location.',
          'warning'
        );

        return selected;
      }

      setLocationStatus(
        'Location required',
        'danger'
      );

      if (elements.headerLocation) {
        elements.headerLocation
          .textContent =
          'Select delivery location';
      }

      showToast(
        'Allow location permission or select a delivery address.',
        'warning'
      );

      return null;
    } catch (error) {
      console.error(
        'Home location detection failed:',
        error
      );

      if (cachedLocation) {
        const selected =
          saveLocation(
            cachedLocation
          );

        startDiscovery(selected);

        setLocationStatus(
          'Using saved location',
          'warning'
        );

        return selected;
      }

      if (elements.headerLocation) {
        elements.headerLocation
          .textContent =
          'Select delivery location';
      }

      setLocationStatus(
        'Location required',
        'danger'
      );

      return null;
    } finally {
      state.detecting = false;
    }
  }

  function openLocationPage() {
    window.location.href =
      'location.html?return=' +
      encodeURIComponent(
        'home.html'
      );
  }

  function bindEvents() {
    /*
     * Remove inline onclick added as temporary
     * fallback, then use the controller.
     */
    elements.changeLocationButton
      .removeAttribute('onclick');

    elements.locationHeaderButton
      .removeAttribute('onclick');

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
          event.persisted &&
          state.initialized
        ) {
          detectAndSelectLocation();
        }
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
        'Customer Home elements are incomplete.'
      );

      return;
    }

    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI ||
      !window.ApnaBiteDiscovery
    ) {
      setLocationStatus(
        'Loading error',
        'danger'
      );

      if (elements.headerLocation) {
        elements.headerLocation
          .textContent =
          'Select delivery location';
      }

      showToast(
        'Required application files did not load.',
        'error'
      );

      return;
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession ===
        'function' &&
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

  window.ApnaBiteCustomerHomeLocation =
    Object.freeze({
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
          return state.savedAddresses
            .map(function(address) {
              return Object.assign(
                {},
                address
              );
            });
        }
    });

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
