/**
 * ============================================================
 * APNABITE V1 — CUSTOMER LOCATION CONTROLLER
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
    requestAt: 0,
    searchBusy: false,
    locationBusy: false,
    skipNextMoveEnd: false,
    pendingSource: 'MAP_PIN',
    locationConfirmed: false
  };

  const elements = {};

  function getElements() {
    elements.backButton =
      document.getElementById('location-back-button');

    elements.searchForm =
      document.getElementById('location-search-form');

    elements.searchInput =
      document.getElementById('location-search-input');

    elements.searchButton =
      document.getElementById('location-search-button');

    elements.searchMessage =
      document.getElementById('location-search-message');

    elements.searchResults =
      document.getElementById('location-search-results');

    elements.currentLocationButton =
      document.getElementById('use-current-location');

    elements.mapCurrentButton =
      document.getElementById('map-current-location');

    elements.mapLoading =
      document.getElementById('map-loading');

    elements.savedAddressList =
      document.getElementById('saved-address-list');

    elements.noSavedAddress =
      document.getElementById('no-saved-address');

    elements.selectedName =
      document.getElementById('selected-location-name');

    elements.selectedAddress =
      document.getElementById('selected-location-address');

    elements.receiverSection =
      document.getElementById('receiver-details-section');

    elements.receiverName =
      document.getElementById('receiver-name');

    elements.receiverMobile =
      document.getElementById('receiver-mobile');

    elements.addressFlat =
      document.getElementById('address-flat');

    elements.addressLandmark =
      document.getElementById('address-landmark');

    elements.addressArea =
      document.getElementById('address-area');

    elements.addressCity =
      document.getElementById('address-city');

    elements.addressDistrict =
      document.getElementById('address-district');

    elements.addressState =
      document.getElementById('address-state');

    elements.useOnce =
      document.getElementById('address-use-once');

    elements.saveFuture =
      document.getElementById('address-save-future');

    elements.addressLabelGroup =
      document.getElementById('address-label-group');

    elements.addressLabel =
      document.getElementById('address-label');

    elements.confirmButton =
      document.getElementById('confirm-location-button');
  }

  function clean(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function numberOrNull(value) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  function digitsOnly(value) {
    return String(value || '')
      .replace(/\D/g, '');
  }

  function delay(milliseconds) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  async function waitForLocationRequest() {
    const elapsed =
      Date.now() - state.requestAt;

    if (elapsed < 1100) {
      await delay(1100 - elapsed);
    }

    state.requestAt = Date.now();
  }

  async function fetchLocationJson(url) {
    await waitForLocationRequest();

    const response =
      await window.fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'en-IN,en'
        }
      });

    if (!response.ok) {
      throw new Error(
        'Location service unavailable.'
      );
    }

    return response.json();
  }

  function setSearchMessage(message, isError) {
    if (!elements.searchMessage) return;

    elements.searchMessage.textContent =
      message || '';

    elements.searchMessage.classList.toggle(
      'location-helper-text--error',
      Boolean(isError)
    );
  }

  function setMapLoading(loading) {
    if (!elements.mapLoading) return;

    elements.mapLoading.hidden =
      !loading;
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
      loading
        ? loadingText
        : normalText;
  }

  function addUniquePart(parts, value) {
    const part = clean(value);

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

  function parseAddress(address) {
    const data = address || {};

    return {
      area: clean(
        data.suburb ||
        data.neighbourhood ||
        data.quarter ||
        data.residential ||
        data.village ||
        data.road
      ),
      city: clean(
        data.city ||
        data.town ||
        data.municipality ||
        data.village
      ),
      district: clean(
        data.city_district ||
        data.state_district ||
        data.county
      ),
      state: clean(data.state),
      postalCode: clean(data.postcode),
      country: clean(data.country),
      countryCode:
        clean(data.country_code)
          .toUpperCase()
    };
  }

  function buildLocationName(address) {
    const data = address || {};

    const primary = clean(
      data.building ||
      data.amenity ||
      data.shop ||
      data.office ||
      data.tourism ||
      data.residential ||
      data.neighbourhood ||
      data.suburb ||
      data.quarter ||
      data.road ||
      data.village ||
      data.town ||
      data.city
    );

    const secondary = [];

    addUniquePart(
      secondary,
      data.neighbourhood
    );

    addUniquePart(
      secondary,
      data.suburb
    );

    addUniquePart(
      secondary,
      data.city || data.town
    );

    const filtered =
      secondary.filter(function(item) {
        return (
          item.toLowerCase() !==
          primary.toLowerCase()
        );
      });

    if (primary && filtered.length) {
      return (
        primary +
        ' • ' +
        filtered.slice(0, 2).join(', ')
      );
    }

    return (
      primary ||
      clean(data.state) ||
      'Selected location'
    );
  }

  function buildSavedFullAddress(address) {
    const parts = [];

    addUniquePart(parts, address.flatHouse);
    addUniquePart(parts, address.addressLine1);
    addUniquePart(parts, address.addressLine2);
    addUniquePart(parts, address.landmark);
    addUniquePart(parts, address.area);
    addUniquePart(parts, address.city);
    addUniquePart(parts, address.district);
    addUniquePart(parts, address.state);
    addUniquePart(parts, address.postalCode);

    return parts.join(', ');
  }

  function fillAddressFields(location) {
    elements.addressArea.value =
      clean(location.area);

    elements.addressCity.value =
      clean(location.city);

    elements.addressDistrict.value =
      clean(location.district);

    elements.addressState.value =
      clean(location.state);
  }

  function fillSavedReceiverDetails(address) {
    elements.receiverName.value =
      clean(
        address.receiverName ||
        address.fullName
      );

    elements.receiverMobile.value =
      digitsOnly(
        address.receiverMobile ||
        address.mobile
      ).slice(-10);

    elements.addressFlat.value =
      clean(
        address.flatHouse ||
        address.addressLine1
      );

    elements.addressLandmark.value =
      clean(address.landmark);
  }

  function resetLocationConfirmation() {
    state.locationConfirmed = false;

    elements.receiverSection.hidden =
      true;

    elements.confirmButton.disabled =
      false;

    elements.confirmButton.textContent =
      'CONFIRM PIN LOCATION';
  }

  function setSelectedLocation(location) {
    const latitude =
      numberOrNull(location.latitude);

    const longitude =
      numberOrNull(location.longitude);

    if (
      latitude === null ||
      longitude === null
    ) {
      return;
    }

    state.selectedLocation = {
      latitude: latitude,
      longitude: longitude,
      locationName:
        clean(location.locationName) ||
        'Selected location',
      fullAddress:
        clean(location.fullAddress),
      area:
        clean(location.area),
      city:
        clean(location.city),
      district:
        clean(location.district),
      state:
        clean(location.state),
      postalCode:
        clean(location.postalCode),
      country:
        clean(location.country),
      countryCode:
        clean(location.countryCode),
      source:
        clean(location.source) ||
        'MAP_PIN',
      addressId:
        clean(location.addressId)
    };

    elements.selectedName.textContent =
      state.selectedLocation.locationName;

    elements.selectedAddress.textContent =
      state.selectedLocation.fullAddress ||
      'Location selected on map';

    fillAddressFields(
      state.selectedLocation
    );

    resetLocationConfirmation();
  }

  function clearSearchResults() {
    elements.searchResults.innerHTML = '';
    state.searchResults = [];
  }

  function renderSearchResults(results) {
    elements.searchResults.innerHTML = '';

    results.forEach(function(result, index) {
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
        result.locationName;

      const address =
        document.createElement('p');

      address.className =
        'location-result-card__address';

      address.textContent =
        result.fullAddress;

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

  async function requestLocationSearch(query) {
    const mapCenter =
      state.map
        ? state.map.getCenter()
        : null;

    let url =
      'https://nominatim.openstreetmap.org/search' +
      '?format=jsonv2' +
      '&addressdetails=1' +
      '&countrycodes=in' +
      '&limit=10' +
      '&dedupe=1' +
      '&accept-language=en' +
      '&q=' +
      encodeURIComponent(query);

    if (mapCenter) {
      const longitudeSpan = 0.75;
      const latitudeSpan = 0.55;

      url +=
        '&viewbox=' +
        encodeURIComponent(
          (mapCenter.lng - longitudeSpan) +
          ',' +
          (mapCenter.lat + latitudeSpan) +
          ',' +
          (mapCenter.lng + longitudeSpan) +
          ',' +
          (mapCenter.lat - latitudeSpan)
        );
    }

    const result =
      await fetchLocationJson(url);

    return Array.isArray(result)
      ? result
      : [];
  }

  function buildFallbackSearchQuery(query) {
    const parts =
      clean(query)
        .split(/\s+/)
        .filter(Boolean);

    if (parts.length <= 2) {
      return query;
    }

    const locationWords = [];

    parts.forEach(function(part, index) {
      if (
        part.toLowerCase() === 'sector' &&
        parts[index + 1]
      ) {
        locationWords.push(part);
        locationWords.push(
          parts[index + 1]
        );
      }
    });

    parts.slice(-2).forEach(function(part) {
      const exists =
        locationWords.some(
          function(existing) {
            return (
              existing.toLowerCase() ===
              part.toLowerCase()
            );
          }
        );

      if (!exists) {
        locationWords.push(part);
      }
    });

    return locationWords.join(' ');
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

    setButtonLoading(
      elements.searchButton,
      true,
      'SEARCHING…',
      'SEARCH'
    );

    setSearchMessage(
      'Searching matching locations…',
      false
    );

    clearSearchResults();

    try {
      let response =
        await requestLocationSearch(query);

      let fallbackUsed = false;

      if (!response.length) {
        const fallbackQuery =
          buildFallbackSearchQuery(query);

        if (
          fallbackQuery &&
          fallbackQuery.toLowerCase() !==
            query.toLowerCase()
        ) {
          response =
            await requestLocationSearch(
              fallbackQuery
            );

          fallbackUsed = true;
        }
      }

      if (!response.length) {
        setSearchMessage(
          'Location not found. Search using area, sector, city or nearby landmark.',
          true
        );
        return;
      }

      state.searchResults =
        response
          .map(function(result) {
            const parsed =
              parseAddress(result.address);

            return {
              latitude:
                Number(result.lat),
              longitude:
                Number(result.lon),
              locationName:
                buildLocationName(
                  result.address
                ),
              fullAddress:
                clean(result.display_name),
              area: parsed.area,
              city: parsed.city,
              district:
                parsed.district,
              state: parsed.state,
              postalCode:
                parsed.postalCode,
              country: parsed.country,
              countryCode:
                parsed.countryCode,
              source: 'SEARCH'
            };
          })
          .filter(function(result) {
            return (
              Number.isFinite(
                result.latitude
              ) &&
              Number.isFinite(
                result.longitude
              )
            );
          })
          .slice(0, 10);

      renderSearchResults(
        state.searchResults
      );

      setSearchMessage(
        fallbackUsed
          ? 'Exact listing was not found. Select a nearby location and adjust the map pin.'
          : state.searchResults.length +
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
      setSearchMessage(
        'Location search is temporarily unavailable. Please try again.',
        true
      );

      window.ApnaBiteUI.showToast(
        'Unable to search location.',
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
      18
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

      window.ApnaBiteUI.showToast(
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

    const cachedLatitude =
      cachedLocation
        ? numberOrNull(
            cachedLocation.latitude
          )
        : null;

    const cachedLongitude =
      cachedLocation
        ? numberOrNull(
            cachedLocation.longitude
          )
        : null;

    const latitude =
      cachedLatitude !== null
        ? cachedLatitude
        : 28.6139;

    const longitude =
      cachedLongitude !== null
        ? cachedLongitude
        : 77.209;

    state.map =
      window.L.map('location-map', {
        zoomControl: true,
        attributionControl: true
      }).setView(
        [latitude, longitude],
        cachedLocation ? 17 : 11
      );

    const tileLayer =
      window.L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; OpenStreetMap contributors'
        }
      );

    tileLayer.addTo(state.map);

    tileLayer.once('load', function() {
      setMapLoading(false);
    });

    window.setTimeout(function() {
      setMapLoading(false);

      if (state.map) {
        state.map.invalidateSize();
      }
    }, 1200);

    state.map.on('dragstart', function() {
      state.pendingSource = 'MAP_PIN';
      state.locationConfirmed = false;
      elements.receiverSection.hidden = true;
      elements.confirmButton.disabled = true;
      elements.confirmButton.textContent =
        'FETCHING LOCATION…';
    });

    state.map.on('moveend', function() {
      if (state.skipNextMoveEnd) {
        state.skipNextMoveEnd = false;
        return;
      }

      scheduleMapSelection();
    });

    if (
      cachedLocation &&
      cachedLatitude !== null &&
      cachedLongitude !== null
    ) {
      setSelectedLocation(
        cachedLocation
      );
    }

    return true;
  }

  function scheduleMapSelection() {
    window.clearTimeout(
      state.reverseTimer
    );

    state.reverseTimer =
      window.setTimeout(function() {
        if (!state.map) return;

        const center =
          state.map.getCenter();

        reverseGeocode(
          center.lat,
          center.lng,
          state.pendingSource ||
          'MAP_PIN'
        );

        state.pendingSource =
          'MAP_PIN';
      }, 850);
  }

  async function reverseGeocode(
    latitude,
    longitude,
    source
  ) {
    elements.selectedName.textContent =
      'Fetching location…';

    elements.selectedAddress.textContent =
      'Please wait';

    try {
      const url =
        'https://nominatim.openstreetmap.org/reverse' +
        '?format=jsonv2' +
        '&addressdetails=1' +
        '&zoom=18' +
        '&accept-language=en' +
        '&lat=' +
        encodeURIComponent(latitude) +
        '&lon=' +
        encodeURIComponent(longitude);

      const result =
        await fetchLocationJson(url);

      const parsed =
        parseAddress(result.address);

      setSelectedLocation({
        latitude: latitude,
        longitude: longitude,
        locationName:
          buildLocationName(
            result.address
          ),
        fullAddress:
          clean(result.display_name),
        area: parsed.area,
        city: parsed.city,
        district: parsed.district,
        state: parsed.state,
        postalCode:
          parsed.postalCode,
        country: parsed.country,
        countryCode:
          parsed.countryCode,
        source: source || 'MAP_PIN'
      });
    } catch (error) {
      setSelectedLocation({
        latitude: latitude,
        longitude: longitude,
        locationName:
          'Selected location',
        fullAddress:
          'Location selected on map',
        source: source || 'MAP_PIN'
      });

      window.ApnaBiteUI.showToast(
        'Exact address name could not be loaded.',
        'warning'
      );
    }
  }

  function useCurrentLocation() {
    if (state.locationBusy) return;

    if (!navigator.geolocation) {
      window.ApnaBiteUI.showToast(
        'GPS is not supported on this device.',
        'error'
      );
      return;
    }

    state.locationBusy = true;

    setButtonLoading(
      elements.currentLocationButton,
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
          18
        );

        reverseGeocode(
          latitude,
          longitude,
          'CURRENT_GPS'
        ).finally(function() {
          state.locationBusy = false;

          setButtonLoading(
            elements.currentLocationButton,
            false,
            'DETECTING LOCATION…',
            'USE MY CURRENT LOCATION'
          );
        });
      },
      function(error) {
        state.locationBusy = false;

        setButtonLoading(
          elements.currentLocationButton,
          false,
          'DETECTING LOCATION…',
          'USE MY CURRENT LOCATION'
        );

        if (
          error &&
          error.code ===
            error.PERMISSION_DENIED
        ) {
          window.ApnaBiteUI.showToast(
            'Please allow location permission.',
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
        timeout: 12000,
        maximumAge: 120000
      }
    );
  }

  function renderSavedAddresses() {
    elements.savedAddressList.innerHTML =
      '';

    elements.noSavedAddress.hidden =
      state.savedAddresses.length > 0;

    state.savedAddresses.forEach(
      function(address) {
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
          clean(address.addressLabel)
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
          clean(
            address.addressLabel ||
            address.addressType
          ) ||
          'Saved address';

        const text =
          document.createElement('p');

        text.className =
          'saved-address-card__address';

        text.textContent =
          buildSavedFullAddress(address);

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

        elements.savedAddressList
          .appendChild(button);
      }
    );
  }

  function selectSavedAddress(address) {
    const latitude =
      numberOrNull(address.latitude);

    const longitude =
      numberOrNull(address.longitude);

    if (
      latitude === null ||
      longitude === null
    ) {
      window.ApnaBiteUI.showToast(
        'Map location is missing for this address.',
        'warning'
      );
      return;
    }

    state.skipNextMoveEnd = true;

    setSelectedLocation({
      latitude: latitude,
      longitude: longitude,
      locationName:
        clean(
          address.locationName ||
          address.area ||
          address.addressLabel
        ) ||
        'Saved address',
      fullAddress:
        buildSavedFullAddress(address),
      area: address.area,
      city: address.city,
      district: address.district,
      state: address.state,
      postalCode:
        address.postalCode,
      country: address.country,
      countryCode:
        address.countryCode,
      source: 'SAVED_ADDRESS',
      addressId: address.addressId
    });

    fillSavedReceiverDetails(address);

    state.locationConfirmed = true;
    elements.receiverSection.hidden = false;
    elements.useOnce.checked = true;
    elements.addressLabelGroup.hidden = true;
    elements.confirmButton.textContent =
      'SAVE & CONTINUE';

    state.map.setView(
      [latitude, longitude],
      18
    );

    elements.receiverSection
      .scrollIntoView({
        behavior: 'smooth',
        block: 'start'
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
    } catch (error) {
      state.savedAddresses = [];
    }

    renderSavedAddresses();
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

  function validateDeliveryDetails() {
    const receiverName =
      clean(elements.receiverName.value);

    const receiverMobile =
      digitsOnly(
        elements.receiverMobile.value
      );

    const flatHouse =
      clean(elements.addressFlat.value);

    if (!state.selectedLocation) {
      window.ApnaBiteUI.showToast(
        'Please select a location.',
        'warning'
      );
      return null;
    }

    if (receiverName.length < 2) {
      window.ApnaBiteUI.showToast(
        'Enter receiver name.',
        'warning'
      );

      elements.receiverName.focus();
      return null;
    }

    if (
      receiverMobile.length !== 10 ||
      !/^[6-9]/.test(receiverMobile)
    ) {
      window.ApnaBiteUI.showToast(
        'Enter a valid 10-digit mobile number.',
        'warning'
      );

      elements.receiverMobile.focus();
      return null;
    }

    if (!flatHouse) {
      window.ApnaBiteUI.showToast(
        'Enter flat or house details.',
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
      window.ApnaBiteUI.showToast(
        'Enter an address label.',
        'warning'
      );

      elements.addressLabel.focus();
      return null;
    }

    return {
      addressId:
        state.selectedLocation.addressId ||
        '',
      receiverName: receiverName,
      receiverMobile: receiverMobile,
      flatHouse: flatHouse,
      landmark:
        clean(
          elements.addressLandmark.value
        ),
      area:
        state.selectedLocation.area,
      city:
        state.selectedLocation.city,
      district:
        state.selectedLocation.district,
      state:
        state.selectedLocation.state,
      postalCode:
        state.selectedLocation.postalCode,
      country:
        state.selectedLocation.country,
      countryCode:
        state.selectedLocation.countryCode,
      latitude:
        state.selectedLocation.latitude,
      longitude:
        state.selectedLocation.longitude,
      locationName:
        state.selectedLocation.locationName,
      providerAddress:
        state.selectedLocation.fullAddress,
      source:
        state.selectedLocation.source,
      saveForFuture:
        elements.saveFuture.checked,
      addressLabel:
        elements.saveFuture.checked
          ? clean(
              elements.addressLabel.value
            )
          : '',
      selectedAt:
        new Date().toISOString()
    };
  }

  async function confirmLocation() {
    if (!state.selectedLocation) {
      window.ApnaBiteUI.showToast(
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
      validateDeliveryDetails();

    if (!deliveryAddress) return;

    setButtonLoading(
      elements.confirmButton,
      true,
      'SAVING…',
      'SAVE & CONTINUE'
    );

    try {
      if (deliveryAddress.saveForFuture) {
        const response =
          await window.ApnaBiteAPI.request(
            'address.save',
            deliveryAddress,
            {
              retry: false,
              deduplicate: false
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

      window.location.replace(
        'home.html?v=12'
      );
    } catch (error) {
      window.ApnaBiteUI.showToast(
        deliveryAddress.saveForFuture
          ? 'Saved-address service is not ready. Select “Use for this order only”.'
          : 'Unable to continue. Please try again.',
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
      'home.html?v=12'
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
            digitsOnly(
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

  function prefillReceiverDetails() {
    const user =
      window.ApnaBiteCore.getJsonStorage(
        window.ApnaBiteCore
          .storageKeys.USER,
        null
      );

    if (!user) return;

    elements.receiverName.value =
      clean(
        user.fullName ||
        user.name
      );

    elements.receiverMobile.value =
      digitsOnly(
        user.mobile ||
        user.phone
      ).slice(-10);
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
    prefillReceiverDetails();

    state.savedAddresses = [];
    renderSavedAddresses();

    setMapLoading(true);

    const mapReady =
      initializeMap();

    if (!mapReady) return;

    loadSavedAddresses();

    const cachedLocation =
      window.ApnaBiteCore.getJsonStorage(
        window.ApnaBiteCore
          .storageKeys.LOCATION,
        null
      );

    if (!cachedLocation) {
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
