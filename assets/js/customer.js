/**
 * ============================================================
 * APNABITE V1 — CUSTOMER CONTROLLER
 * File: assets/js/customer.js
 * Requires: core.js, api.js, ui.js, Leaflet
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
    locationBusy: false,
    searchBusy: false,
    pendingSource: 'MAP_PIN',
    externalRequestAt: 0
  };

  const elements = {};

  function getElements() {
    elements.backButton =
      document.getElementById(
        'location-back-button'
      );

    elements.searchForm =
      document.getElementById(
        'location-search-form'
      );

    elements.searchInput =
      document.getElementById(
        'location-search-input'
      );

    elements.searchButton =
      document.getElementById(
        'location-search-button'
      );

    elements.searchMessage =
      document.getElementById(
        'location-search-message'
      );

    elements.currentLocationButton =
      document.getElementById(
        'use-current-location'
      );

    elements.mapCurrentButton =
      document.getElementById(
        'map-current-location'
      );

    elements.mapLoading =
      document.getElementById(
        'map-loading'
      );

    elements.savedAddressSection =
      document.getElementById(
        'saved-address-section'
      );

    elements.savedAddressList =
      document.getElementById(
        'saved-address-list'
      );

    elements.selectedName =
      document.getElementById(
        'selected-location-name'
      );

    elements.selectedAddress =
      document.getElementById(
        'selected-location-address'
      );

    elements.confirmButton =
      document.getElementById(
        'confirm-location-button'
      );
  }

  function setSearchMessage(
    message,
    isError
  ) {
    if (!elements.searchMessage) {
      return;
    }

    elements.searchMessage.textContent =
      message || '';

    elements.searchMessage.classList
      .toggle(
        'location-helper-text--error',
        Boolean(isError)
      );
  }

  function setMapLoading(loading) {
    if (!elements.mapLoading) {
      return;
    }

    elements.mapLoading.hidden =
      !loading;
  }

  function setButtonState(
    button,
    loading,
    loadingText,
    normalText
  ) {
    if (!button) return;

    button.disabled = Boolean(loading);

    button.textContent =
      loading
        ? loadingText
        : normalText;
  }

  function delay(milliseconds) {
    return new Promise(function(resolve) {
      window.setTimeout(
        resolve,
        milliseconds
      );
    });
  }

  async function waitForExternalRequest() {
    const elapsed =
      Date.now() -
      state.externalRequestAt;

    if (elapsed < 1100) {
      await delay(1100 - elapsed);
    }

    state.externalRequestAt =
      Date.now();
  }

  function numberOrNull(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function cleanPart(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function addUniquePart(
    parts,
    value
  ) {
    const part = cleanPart(value);

    if (!part) return;

    const exists =
      parts.some(function(item) {
        return item.toLowerCase() ===
          part.toLowerCase();
      });

    if (!exists) {
      parts.push(part);
    }
  }

  function buildCompactName(address) {
    const data = address || {};

    const primary =
      cleanPart(
        data.suburb ||
        data.neighbourhood ||
        data.quarter ||
        data.city_district ||
        data.village ||
        data.town ||
        data.city
      );

    const secondaryParts = [];

    if (
      data.neighbourhood &&
      cleanPart(data.neighbourhood)
        .toLowerCase() !==
      primary.toLowerCase()
    ) {
      addUniquePart(
        secondaryParts,
        data.neighbourhood
      );
    }

    if (
      data.quarter &&
      cleanPart(data.quarter)
        .toLowerCase() !==
      primary.toLowerCase()
    ) {
      addUniquePart(
        secondaryParts,
        data.quarter
      );
    }

    addUniquePart(
      secondaryParts,
      data.road
    );

    addUniquePart(
      secondaryParts,
      data.city ||
      data.town ||
      data.municipality ||
      data.county
    );

    if (
      primary &&
      secondaryParts.length
    ) {
      return (
        primary +
        ' • ' +
        secondaryParts.join(', ')
      );
    }

    if (primary) {
      return primary;
    }

    return cleanPart(
      data.state ||
      'Selected location'
    );
  }

  function buildSavedAddressName(address) {
    const primary =
      cleanPart(
        address.area ||
        address.addressLabel
      );

    const secondaryParts = [];

    addUniquePart(
      secondaryParts,
      address.addressLine1
    );

    addUniquePart(
      secondaryParts,
      address.city
    );

    if (
      primary &&
      secondaryParts.length
    ) {
      return (
        primary +
        ' • ' +
        secondaryParts.join(', ')
      );
    }

    return (
      primary ||
      secondaryParts.join(', ') ||
      'Saved address'
    );
  }

  function buildSavedFullAddress(address) {
    const parts = [];

    addUniquePart(
      parts,
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

    addUniquePart(
      parts,
      address.area
    );

    addUniquePart(
      parts,
      address.city
    );

    addUniquePart(
      parts,
      address.state
    );

    addUniquePart(
      parts,
      address.postalCode
    );

    return parts.join(', ');
  }

  function setSelectedLocation(location) {
    if (
      !location ||
      !Number.isFinite(
        Number(location.latitude)
      ) ||
      !Number.isFinite(
        Number(location.longitude)
      )
    ) {
      return;
    }

    state.selectedLocation = {
      latitude:
        Number(location.latitude),
      longitude:
        Number(location.longitude),
      locationName:
        cleanPart(
          location.locationName
        ) ||
        'Selected location',
      fullAddress:
        cleanPart(
          location.fullAddress
        ),
      source:
        cleanPart(
          location.source
        ) ||
        'MAP_PIN',
      addressId:
        cleanPart(
          location.addressId
        )
    };

    elements.selectedName.textContent =
      state.selectedLocation.locationName;

    elements.selectedAddress.textContent =
      state.selectedLocation.fullAddress ||
      'Location selected on map';

    elements.confirmButton.disabled =
      false;
  }

  function createSearchResultsContainer() {
    let container =
      document.getElementById(
        'location-search-results'
      );

    if (container) {
      return container;
    }

    container =
      document.createElement('div');

    container.id =
      'location-search-results';

    container.className =
      'saved-address-list';

    container.style.marginTop =
      '10px';

    elements.searchMessage
      .insertAdjacentElement(
        'afterend',
        container
      );

    return container;
  }

  function clearSearchResults() {
    const container =
      document.getElementById(
        'location-search-results'
      );

    if (container) {
      container.innerHTML = '';
    }

    state.searchResults = [];
  }

  function renderSearchResults(results) {
    const container =
      createSearchResultsContainer();

    container.innerHTML = '';

    results.forEach(
      function(result, index) {
        const button =
          document.createElement(
            'button'
          );

        button.type = 'button';

        button.className =
          'saved-address-card';

        const icon =
          document.createElement(
            'span'
          );

        icon.className =
          'saved-address-card__icon';

        icon.textContent = '⌖';

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
          result.locationName;

        const address =
          document.createElement('p');

        address.className =
          'saved-address-card__address';

        address.textContent =
          result.fullAddress;

        content.appendChild(label);
        content.appendChild(address);

        button.appendChild(icon);
        button.appendChild(content);

        button.addEventListener(
          'click',
          function() {
            selectSearchResult(index);
          }
        );

        container.appendChild(button);
      }
    );
  }

  function initializeMap() {
    if (!window.L) {
      setMapLoading(false);

      window.ApnaBiteUI.showToast(
        'Map could not be loaded.',
        'error'
      );

      return false;
    }

    const savedLocation =
      window.ApnaBiteCore
        .getJsonStorage(
          window.ApnaBiteCore
            .storageKeys.LOCATION,
          null
        );

    const initialLatitude =
      savedLocation &&
      numberOrNull(
        savedLocation.latitude
      ) !== null
        ? Number(
            savedLocation.latitude
          )
        : 28.6139;

    const initialLongitude =
      savedLocation &&
      numberOrNull(
        savedLocation.longitude
      ) !== null
        ? Number(
            savedLocation.longitude
          )
        : 77.2090;

    state.map = window.L
      .map(
        'location-map',
        {
          zoomControl: true,
          attributionControl: true
        }
      )
      .setView(
        [
          initialLatitude,
          initialLongitude
        ],
        savedLocation ? 17 : 11
      );

    window.L
      .tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; OpenStreetMap contributors'
        }
      )
      .addTo(state.map);

    state.map.on(
      'dragstart',
      function() {
        state.pendingSource =
          'MAP_PIN';
      }
    );

    state.map.on(
      'moveend',
      function() {
        scheduleMapSelection();
      }
    );

    setMapLoading(false);

    if (
      savedLocation &&
      savedLocation.locationName
    ) {
      setSelectedLocation({
        latitude:
          initialLatitude,
        longitude:
          initialLongitude,
        locationName:
          savedLocation.locationName,
        fullAddress:
          savedLocation.fullAddress ||
          savedLocation.locationName,
        source:
          savedLocation.source ||
          'CACHED',
        addressId:
          savedLocation.addressId || ''
      });
    }

    window.setTimeout(
      function() {
        state.map.invalidateSize();
      },
      200
    );

    return true;
  }

  function scheduleMapSelection() {
    window.clearTimeout(
      state.reverseTimer
    );

    state.reverseTimer =
      window.setTimeout(
        function() {
          if (!state.map) return;

          const center =
            state.map.getCenter();

          const source =
            state.pendingSource ||
            'MAP_PIN';

          state.pendingSource =
            'MAP_PIN';

          reverseGeocode(
            center.lat,
            center.lng,
            source
          );
        },
        900
      );
  }

  async function fetchJson(url) {
    await waitForExternalRequest();

    const response =
      await window.fetch(
        url,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Accept-Language': 'en-IN,en'
          }
        }
      );

    if (!response.ok) {
      throw new Error(
        'Location service unavailable.'
      );
    }

    return response.json();
  }

  async function reverseGeocode(
    latitude,
    longitude,
    source
  ) {
    try {
      const url =
        'https://nominatim.openstreetmap.org/reverse' +
        '?format=jsonv2' +
        '&addressdetails=1' +
        '&zoom=18' +
        '&lat=' +
        encodeURIComponent(latitude) +
        '&lon=' +
        encodeURIComponent(longitude);

      const result =
        await fetchJson(url);

      setSelectedLocation({
        latitude: latitude,
        longitude: longitude,
        locationName:
          buildCompactName(
            result.address
          ),
        fullAddress:
          result.display_name ||
          '',
        source:
          source ||
          'MAP_PIN'
      });
    } catch (error) {
      setSelectedLocation({
        latitude: latitude,
        longitude: longitude,
        locationName:
          'Selected location',
        fullAddress:
          'Location selected on map',
        source:
          source ||
          'MAP_PIN'
      });

      window.ApnaBiteUI.showToast(
        'Exact address name could not be loaded.',
        'warning'
      );
    }
  }

  async function searchLocation(event) {
    event.preventDefault();

    if (state.searchBusy) return;

    const query =
      cleanPart(
        elements.searchInput.value
      );

    if (query.length < 3) {
      setSearchMessage(
        'Enter at least 3 characters.',
        true
      );

      return;
    }

    state.searchBusy = true;

    setButtonState(
      elements.searchButton,
      true,
      'SEARCHING…',
      'Search'
    );

    setSearchMessage(
      'Searching locations…',
      false
    );

    clearSearchResults();

    try {
      const url =
        'https://nominatim.openstreetmap.org/search' +
        '?format=jsonv2' +
        '&addressdetails=1' +
        '&countrycodes=in' +
        '&limit=5' +
        '&q=' +
        encodeURIComponent(query);

      const response =
        await fetchJson(url);

      if (
        !Array.isArray(response) ||
        !response.length
      ) {
        setSearchMessage(
          'No matching location found. Try adding city or PIN code.',
          true
        );

        return;
      }

      state.searchResults =
        response.map(function(result) {
          return {
            latitude:
              Number(result.lat),
            longitude:
              Number(result.lon),
            locationName:
              buildCompactName(
                result.address
              ),
            fullAddress:
              result.display_name ||
              '',
            source: 'SEARCH'
          };
        });

      renderSearchResults(
        state.searchResults
      );

      setSearchMessage(
        'Select the correct location below.',
        false
      );
    } catch (error) {
      setSearchMessage(
        'Location search is temporarily unavailable.',
        true
      );

      window.ApnaBiteUI.showToast(
        'Unable to search location.',
        'error'
      );
    } finally {
      state.searchBusy = false;

      setButtonState(
        elements.searchButton,
        false,
        'SEARCHING…',
        'Search'
      );
    }
  }

  function selectSearchResult(index) {
    const result =
      state.searchResults[index];

    if (!result || !state.map) {
      return;
    }

    state.pendingSource = 'SEARCH';

    setSelectedLocation(result);

    state.map.setView(
      [
        result.latitude,
        result.longitude
      ],
      17
    );

    clearSearchResults();

    setSearchMessage(
      'Location selected. Move the map for exact position.',
      false
    );

    document
      .getElementById(
        'location-map'
      )
      .scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
  }

  function useCurrentLocation() {
    if (state.locationBusy) return;

    if (!navigator.geolocation) {
      window.ApnaBiteUI.showToast(
        'GPS location is not supported.',
        'error'
      );

      return;
    }

    state.locationBusy = true;

    window.ApnaBiteUI.setButtonLoading(
      elements.currentLocationButton,
      true,
      'DETECTING LOCATION…'
    );

    navigator.geolocation
      .getCurrentPosition(
        function(position) {
          const latitude =
            position.coords.latitude;

          const longitude =
            position.coords.longitude;

          state.pendingSource =
            'CURRENT_GPS';

          if (state.map) {
            state.map.setView(
              [
                latitude,
                longitude
              ],
              18
            );
          }

          reverseGeocode(
            latitude,
            longitude,
            'CURRENT_GPS'
          );

          state.locationBusy = false;

          window.ApnaBiteUI
            .setButtonLoading(
              elements.currentLocationButton,
              false
            );
        },
        function(error) {
          state.locationBusy = false;

          window.ApnaBiteUI
            .setButtonLoading(
              elements.currentLocationButton,
              false
            );

          if (
            error &&
            error.code ===
              error.PERMISSION_DENIED
          ) {
            window.ApnaBiteUI.showToast(
              'Please allow location permission from browser settings.',
              'warning'
            );

            return;
          }

          window.ApnaBiteUI.showToast(
            'Unable to detect current location.',
            'error'
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 30000
        }
      );
  }

  function renderSavedAddresses() {
    elements.savedAddressList.innerHTML =
      '';

    if (!state.savedAddresses.length) {
      elements.savedAddressSection.hidden =
        true;

      return;
    }

    elements.savedAddressSection.hidden =
      false;

    state.savedAddresses.forEach(
      function(address) {
        const button =
          document.createElement(
            'button'
          );

        button.type = 'button';

        button.className =
          'saved-address-card';

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
          address.addressType ||
          'Saved address';

        const addressText =
          document.createElement('p');

        addressText.className =
          'saved-address-card__address';

        addressText.textContent =
          buildSavedFullAddress(
            address
          );

        content.appendChild(label);
        content.appendChild(
          addressText
        );

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

        elements.savedAddressList
          .appendChild(button);
      }
    );
  }

  function selectSavedAddress(address) {
    const latitude =
      numberOrNull(
        address.latitude
      );

    const longitude =
      numberOrNull(
        address.longitude
      );

    if (
      latitude === null ||
      longitude === null
    ) {
      window.ApnaBiteUI.showToast(
        'This saved address has no map location.',
        'warning'
      );

      return;
    }

    const selected = {
      latitude: latitude,
      longitude: longitude,
      locationName:
        buildSavedAddressName(
          address
        ),
      fullAddress:
        buildSavedFullAddress(
          address
        ),
      source:
        'SAVED_ADDRESS',
      addressId:
        address.addressId
    };

    setSelectedLocation(selected);

    state.pendingSource =
      'SAVED_ADDRESS';

    if (state.map) {
      state.map.setView(
        [
          latitude,
          longitude
        ],
        18
      );
    }

    document
      .getElementById(
        'location-map'
      )
      .scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
  }

  async function loadSavedAddresses() {
    try {
      const response =
        await window.ApnaBiteAPI.request(
          'address.list',
          {},
          {
            retry: true,
            deduplicate: true
          }
        );

      const data =
        response && response.data
          ? response.data
          : [];

      if (Array.isArray(data)) {
        state.savedAddresses = data;
      } else if (
        Array.isArray(data.addresses)
      ) {
        state.savedAddresses =
          data.addresses;
      } else {
        state.savedAddresses = [];
      }

      renderSavedAddresses();
    } catch (error) {
      state.savedAddresses = [];
      renderSavedAddresses();
    }
  }

  async function confirmLocation() {
    if (!state.selectedLocation) {
      window.ApnaBiteUI.showToast(
        'Please select a delivery location.',
        'warning'
      );

      return;
    }

    window.ApnaBiteUI.setButtonLoading(
      elements.confirmButton,
      true,
      'CONFIRMING…'
    );

    try {
      const confirmedLocation = {
        latitude:
          state.selectedLocation.latitude,
        longitude:
          state.selectedLocation.longitude,
        locationName:
          state.selectedLocation.locationName,
        fullAddress:
          state.selectedLocation.fullAddress,
        source:
          state.selectedLocation.source,
        addressId:
          state.selectedLocation.addressId ||
          '',
        selectedAt:
          new Date().toISOString()
      };

      window.ApnaBiteCore
        .setJsonStorage(
          window.ApnaBiteCore
            .storageKeys.LOCATION,
          confirmedLocation
        );

      if (
        confirmedLocation.source ===
          'CURRENT_GPS'
      ) {
        try {
          const response =
            await window.ApnaBiteAPI.request(
              'user.updateLocation',
              {
                latitude:
                  confirmedLocation.latitude,
                longitude:
                  confirmedLocation.longitude,
                locationName:
                  confirmedLocation.locationName
              },
              {
                retry: false,
                deduplicate: false
              }
            );

          if (
            response &&
            response.data &&
            response.data.locationName
          ) {
            confirmedLocation.locationName =
              response.data.locationName;

            window.ApnaBiteCore
              .setJsonStorage(
                window.ApnaBiteCore
                  .storageKeys.LOCATION,
                confirmedLocation
              );
          }
        } catch (error) {
          console.warn(
            'Current location backend update failed.'
          );
        }
      }

      window.ApnaBiteUI.showToast(
        'Delivery location selected.',
        'success'
      );

      window.setTimeout(
        function() {
          window.location.replace(
            'home.html'
          );
        },
        250
      );
    } catch (error) {
      window.ApnaBiteUI.showToast(
        'Unable to confirm location.',
        'error'
      );

      window.ApnaBiteUI
        .setButtonLoading(
          elements.confirmButton,
          false
        );
    }
  }

  function goBack() {
    if (
      window.history.length > 1
    ) {
      window.history.back();
      return;
    }

    window.location.replace(
      'home.html'
    );
  }

  function bindEvents() {
    elements.backButton
      .addEventListener(
        'click',
        goBack
      );

    elements.searchForm
      .addEventListener(
        'submit',
        searchLocation
      );

    elements.currentLocationButton
      .addEventListener(
        'click',
        useCurrentLocation
      );

    elements.mapCurrentButton
      .addEventListener(
        'click',
        useCurrentLocation
      );

    elements.confirmButton
      .addEventListener(
        'click',
        confirmLocation
      );
  }

  async function initializeLocationPage() {
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

    setMapLoading(true);

    const mapReady =
      initializeMap();

    if (!mapReady) {
      return;
    }

    loadSavedAddresses();

    const savedLocation =
      window.ApnaBiteCore
        .getJsonStorage(
          window.ApnaBiteCore
            .storageKeys.LOCATION,
          null
        );

    if (!savedLocation) {
      useCurrentLocation();
    }
  }

  window.ApnaBiteCustomer =
    Object.freeze({
      initializeLocationPage:
        initializeLocationPage,
      useCurrentLocation:
        useCurrentLocation,
      confirmLocation:
        confirmLocation
    });

  window.ApnaBiteCore.ready(
    initializeLocationPage
  );
})(window, document);
