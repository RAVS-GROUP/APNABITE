/**
 * ============================================================
 * APNABITE V1 — CUSTOMER KITCHEN DISCOVERY
 * File: assets/js/discovery.js
 * Complete replacement — Part 1 of 3
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    CACHE_PREFIX: 'apnabite_nearby_kitchens_',
    CACHE_MINUTES: 5,
    SEARCH_DELAY_MS: 300,
    DEFAULT_SORT: 'NEAREST',
    DEFAULT_CATEGORY: 'ALL'
  });

  const state = {
    initialized: false,
    eventsBound: false,
    location: null,
    locationKey: '',
    allKitchens: [],
    openKitchens: [],
    closedKitchens: [],
    radiusKm: 3,
    search: '',
    category: CONFIG.DEFAULT_CATEGORY,
    sortBy: CONFIG.DEFAULT_SORT,
    loading: false,
    searchTimer: null,
    requestNumber: 0
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.search = byId('kitchen-search');

    elements.categoryButtons = Array.from(
      document.querySelectorAll(
        '[data-kitchen-category]'
      )
    );

    elements.sort = byId('kitchen-sort');
    elements.radius = byId('discovery-radius');
    elements.status = byId('backend-status');
    elements.openList = byId('kitchen-list');
    elements.closedSection = byId('closed-kitchen-section');
    elements.closedList = byId('closed-kitchen-list');
    elements.openCount = byId('open-kitchen-count');
    elements.closedCount = byId('closed-kitchen-count');
    elements.refresh = byId('refresh-kitchens');
  }

  function requiredElementsAvailable() {
    return Boolean(
      elements.search &&
      elements.sort &&
      elements.radius &&
      elements.status &&
      elements.openList &&
      elements.closedSection &&
      elements.closedList &&
      elements.openCount &&
      elements.closedCount &&
      elements.refresh
    );
  }

  function clean(value) {
    return String(
      value === undefined || value === null
        ? ''
        : value
    ).replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return clean(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function numberOrZero(value) {
    const number = Number(value);
    return Number.isFinite(number)
      ? number
      : 0;
  }

  function normalizeKitchen(kitchen) {
    const input = kitchen || {};

    return {
      kitchenId:
        clean(input.kitchenId),

      chefUserId:
        clean(input.chefUserId),

      kitchenName:
        clean(input.kitchenName) ||
        'ApnaBite Kitchen',

      description:
        clean(input.description),

      foodType:
        normalize(input.foodType),

      thumbnailFileId:
        clean(input.thumbnailFileId),

      thumbnailUrl:
        clean(input.thumbnailUrl),

      distanceKm:
        numberOrZero(
          input.distanceKm
        ),

      availabilityStatus:
        normalize(
          input.availabilityStatus
        ),

      isOpen:
        input.isOpen === true,

      remainingCapacity:
        numberOrZero(
          input.remainingCapacity
        ),

      minimumOrderValue:
        numberOrZero(
          input.minimumOrderValue
        ),

      averagePreparationMinutes:
        numberOrZero(
          input.averagePreparationMinutes
        ),

      estimatedDeliveryMinutes:
        numberOrZero(
          input.estimatedDeliveryMinutes
        ),

      averageRating:
        numberOrZero(
          input.averageRating
        ),

      ratingCount:
        numberOrZero(
          input.ratingCount
        ),

      minimumProductPrice:
        input.minimumProductPrice === null ||
        input.minimumProductPrice === undefined
          ? null
          : numberOrZero(
              input.minimumProductPrice
            ),

      productCount:
        numberOrZero(
          input.productCount
        ),

      categories:
        Array.isArray(input.categories)
          ? input.categories.map(
              normalize
            )
          : [],

      productsPreview:
        Array.isArray(
          input.productsPreview
        )
          ? input.productsPreview
          : []
    };
  }

  function createLocationKey(location) {
    return (
      Number(location.latitude).toFixed(4) +
      '_' +
      Number(location.longitude).toFixed(4)
    );
  }

  function getCacheKey(location) {
    return (
      CONFIG.CACHE_PREFIX +
      createLocationKey(location)
    );
  }

  function readCache(location) {
    try {
      const key =
        getCacheKey(location);

      const raw =
        localStorage.getItem(key);

      if (!raw) return null;

      const cached =
        JSON.parse(raw);

      if (
        !cached ||
        !cached.savedAt ||
        !Array.isArray(
          cached.kitchens
        )
      ) {
        localStorage.removeItem(key);
        return null;
      }

      const maximumAge =
        CONFIG.CACHE_MINUTES *
        60 *
        1000;

      if (
        Date.now() -
        Number(cached.savedAt) >
        maximumAge
      ) {
        localStorage.removeItem(key);
        return null;
      }

      return cached;
    } catch (error) {
      return null;
    }
  }

  function writeCache(location, data) {
    try {
      localStorage.setItem(
        getCacheKey(location),
        JSON.stringify({
          savedAt: Date.now(),
          radiusKm:
            numberOrZero(
              data.radiusKm
            ) || 3,
          kitchens:
            Array.isArray(data.kitchens)
              ? data.kitchens
              : []
        })
      );
    } catch (error) {
      return;
    }
  }

  function setStatus(text, type) {
    if (!elements.status) return;

    elements.status.textContent = text;

    elements.status.className =
      type === 'success'
        ? 'badge badge--success'
        : type === 'error'
          ? 'badge badge--danger'
          : 'badge badge--warning';
  }

  function setLoading(loading) {
    state.loading =
      Boolean(loading);

    if (elements.refresh) {
      elements.refresh.disabled =
        state.loading;

      elements.refresh.textContent =
        state.loading
          ? 'Refreshing…'
          : 'Refresh';
    }
  }

  function setControlsEnabled(enabled) {
    elements.search.disabled =
      !enabled;

    elements.categoryButtons.forEach(
      function(button) {
        button.disabled = !enabled;
      }
    );

    elements.sort.disabled =
      !enabled;

    elements.refresh.disabled =
      !enabled || state.loading;
  }

  function showSkeletons() {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .showSkeletons === 'function'
    ) {
      window.ApnaBiteUI.showSkeletons(
        elements.openList,
        3
      );

      return;
    }

    elements.openList.innerHTML =
      '<div class="kitchen-loading">' +
        'Finding nearby Kitchens…' +
      '</div>';
  }

  function createEmptyState(title, message) {
    const container =
      document.createElement('div');

    container.className =
      'kitchen-empty-state';

    const icon =
      document.createElement('span');

    icon.className =
      'kitchen-empty-state__icon';

    icon.textContent = '⌂';

    const heading =
      document.createElement('strong');

    heading.textContent = title;

    const text =
      document.createElement('p');

    text.textContent = message;

    container.appendChild(icon);
    container.appendChild(heading);
    container.appendChild(text);

    return container;
  }

  function getThumbnailUrl(kitchen) {
    const directUrl =
      clean(kitchen.thumbnailUrl);

    if (
      /^https?:\/\//i.test(directUrl) ||
      /^data:/i.test(directUrl)
    ) {
      return directUrl;
    }

    const fileId =
      clean(kitchen.thumbnailFileId);

    if (!fileId) return '';

    return (
      'https://drive.google.com/thumbnail?id=' +
      encodeURIComponent(fileId) +
      '&sz=w600'
    );
  }

  function formatDistance(distanceKm) {
    const distance =
      Number(distanceKm);

    if (!Number.isFinite(distance)) {
      return '';
    }

    if (distance < 1) {
      return (
        Math.max(
          50,
          Math.round(
            distance * 1000 / 50
          ) * 50
        ) +
        ' m'
      );
    }

    return (
      distance.toFixed(1) +
      ' km'
    );
  }

  function formatPrice(value) {
    const price = Number(value);

    if (!Number.isFinite(price)) {
      return '';
    }

    return (
      '₹' +
      Math.round(price)
    );
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .showToast === 'function'
    ) {
      window.ApnaBiteUI.showToast(
        message,
        type || 'info'
      );
    }
  }

  /*
   * Continue directly with Part 2 below this line.
   */
   function createKitchenCard(kitchen) {
    const card =
      document.createElement('article');

    card.className =
      kitchen.isOpen
        ? 'kitchen-card'
        : 'kitchen-card kitchen-card--closed';

    card.tabIndex = 0;
    card.dataset.kitchenId =
      kitchen.kitchenId;

    const media =
      document.createElement('div');

    media.className =
      'kitchen-card__media';

    const fallback =
      document.createElement('span');

    fallback.className =
      'kitchen-card__fallback';

    fallback.textContent = '🍲';

    media.appendChild(fallback);

    const imageUrl =
      getThumbnailUrl(kitchen);

    if (imageUrl) {
      const image =
        document.createElement('img');

      image.className =
        'kitchen-card__image';

      image.src = imageUrl;
      image.alt = kitchen.kitchenName;
      image.loading = 'lazy';
      image.decoding = 'async';

      image.addEventListener(
        'load',
        function() {
          fallback.hidden = true;
        }
      );

      image.addEventListener(
        'error',
        function() {
          image.remove();
          fallback.hidden = false;
        }
      );

      media.appendChild(image);
    }

    if (!kitchen.isOpen) {
      const closedBadge =
        document.createElement('span');

      closedBadge.className =
        'kitchen-card__closed-badge';

      closedBadge.textContent =
        'CLOSED';

      media.appendChild(
        closedBadge
      );
    }

    const content =
      document.createElement('div');

    content.className =
      'kitchen-card__content';

    const top =
      document.createElement('div');

    top.className =
      'kitchen-card__top';

    const title =
      document.createElement('h3');

    title.className =
      'kitchen-card__title';

    title.textContent =
      kitchen.kitchenName;

    const rating =
      document.createElement('span');

    rating.className =
      'kitchen-card__rating';

    rating.textContent =
      kitchen.ratingCount > 0
        ? (
          '★ ' +
          kitchen.averageRating
            .toFixed(1)
        )
        : 'New';

    top.appendChild(title);
    top.appendChild(rating);

    const tags =
      document.createElement('div');

    tags.className =
      'kitchen-card__tags';

    if (kitchen.foodType) {
      const foodType =
        document.createElement('span');

      foodType.className =
        kitchen.foodType === 'VEG'
          ? 'food-tag food-tag--veg'
          : (
            kitchen.foodType ===
              'NON_VEG'
              ? 'food-tag food-tag--nonveg'
              : 'food-tag'
          );

      foodType.textContent =
        kitchen.foodType === 'VEG'
          ? 'Veg'
          : (
            kitchen.foodType ===
              'NON_VEG'
              ? 'Non-Veg'
              : kitchen.foodType
                .replace(/_/g, ' ')
          );

      tags.appendChild(foodType);
    }

    kitchen.categories
      .slice(0, 2)
      .forEach(function(category) {
        const tag =
          document.createElement('span');

        tag.className = 'food-tag';

        tag.textContent =
          category.replace(/_/g, ' ');

        tags.appendChild(tag);
      });

    const description =
      document.createElement('p');

    description.className =
      'kitchen-card__description';

    description.textContent =
      kitchen.description ||
      'Fresh homemade food prepared with care.';

    const meta =
      document.createElement('div');

    meta.className =
      'kitchen-card__meta';

    const distance =
      document.createElement('span');

    distance.textContent =
      formatDistance(
        kitchen.distanceKm
      );

    if (distance.textContent) {
      meta.appendChild(distance);
    }

    if (
      kitchen.estimatedDeliveryMinutes >
      0
    ) {
      const deliveryTime =
        document.createElement('span');

      deliveryTime.textContent =
        kitchen.estimatedDeliveryMinutes +
        ' min';

      meta.append

       async function loadFreshData(forceRefresh) {
    if (!state.location) {
      return;
    }

    if (state.loading) {
      state.reloadRequested = true;
      return;
    }

    state.loading = true;
    state.reloadRequested = false;

    const requestNumber =
      state.requestNumber + 1;

    state.requestNumber =
      requestNumber;

    const requestLocation = {
      latitude:
        state.location.latitude,
      longitude:
        state.location.longitude
    };

    const requestLocationKey =
      createLocationKey(
        requestLocation
      );

    setLoading(true);

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'discovery.nearbyKitchens',
          {
            latitude:
              requestLocation.latitude,

            longitude:
              requestLocation.longitude,

            search: '',
            category: 'ALL',
            sortBy: 'NEAREST',
            limit: 50,

            refreshToken:
              forceRefresh
                ? Date.now()
                : ''
          },
          {
            retry: false,
            deduplicate:
              !forceRefresh,
            timeoutMs: 12000
          }
        );

      /*
       * Ignore a response belonging to an
       * older location or older request.
       */
      if (
        requestNumber !==
          state.requestNumber ||
        requestLocationKey !==
          state.locationKey
      ) {
        return;
      }

      const data =
        response &&
        response.data
          ? response.data
          : {};

      applyDiscoveryData(data);

      writeCache(
        requestLocation,
        data
      );

      setStatus(
        'Updated',
        'success'
      );
    } catch (error) {
      if (
        requestNumber !==
          state.requestNumber ||
        requestLocationKey !==
          state.locationKey
      ) {
        return;
      }

      console.error(
        'Kitchen discovery failed:',
        error
      );

      if (!state.allKitchens.length) {
        elements.openList.innerHTML = '';

        elements.openList.appendChild(
          createEmptyState(
            'Unable to load Kitchens',
            'Check your connection and tap Refresh.'
          )
        );
      }

      setStatus(
        'Retry',
        'error'
      );

      showToast(
        clean(error && error.message) ||
        'Unable to load nearby Kitchens.',
        'error'
      );
    } finally {
      if (
        requestNumber ===
        state.requestNumber
      ) {
        state.loading = false;
        setLoading(false);
      }

      if (state.reloadRequested) {
        state.reloadRequested = false;

        window.setTimeout(
          function() {
            loadFreshData(false);
          },
          0
        );
      }
    }
  }

  function bindEvents() {
    if (state.eventsBound) {
      return;
    }

    state.eventsBound = true;

    elements.search.addEventListener(
      'input',
      handleSearch
    );

    elements.categoryButtons.forEach(
      function(button) {
        button.addEventListener(
          'click',
          handleCategory
        );
      }
    );

    elements.sort.addEventListener(
      'change',
      handleSort
    );

    elements.refresh.addEventListener(
      'click',
      function() {
        setStatus(
          'Refreshing',
          'warning'
        );

        loadFreshData(true);
      }
    );
  }

  function resetFilters() {
    state.search = '';
    state.category =
      CONFIG.DEFAULT_CATEGORY;
    state.sortBy =
      CONFIG.DEFAULT_SORT;

    if (elements.search) {
      elements.search.value = '';
    }

    if (elements.sort) {
      elements.sort.value =
        CONFIG.DEFAULT_SORT;
    }

    elements.categoryButtons.forEach(
      function(button) {
        const active =
          normalize(
            button.dataset
              .kitchenCategory
          ) ===
          CONFIG.DEFAULT_CATEGORY;

        button.classList.toggle(
          'chip--active',
          active
        );

        button.setAttribute(
          'aria-pressed',
          active
            ? 'true'
            : 'false'
        );
      }
    );
  }

  function setLocation(location) {
    const latitude =
      Number(
        location &&
        location.latitude
      );

    const longitude =
      Number(
        location &&
        location.longitude
      );

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      state.location = null;
      state.locationKey = '';
      state.allKitchens = [];

      elements.openList.innerHTML = '';

      elements.openList.appendChild(
        createEmptyState(
          'Select delivery location',
          'Choose a delivery address to view nearby Kitchens.'
        )
      );

      elements.closedSection.hidden =
        true;

      elements.openCount.textContent =
        '0';

      elements.closedCount.textContent =
        '0';

      setControlsEnabled(false);

      setStatus(
        'Location needed',
        'error'
      );

      return false;
    }

    const nextLocation = {
      latitude: latitude,
      longitude: longitude
    };

    const nextLocationKey =
      createLocationKey(
        nextLocation
      );

    const locationChanged =
      nextLocationKey !==
      state.locationKey;

    state.location =
      nextLocation;

    state.locationKey =
      nextLocationKey;

    setControlsEnabled(true);

    if (!locationChanged) {
      if (!state.allKitchens.length) {
        const cached =
          readCache(nextLocation);

        if (cached) {
          applyDiscoveryData(cached);

          setStatus(
            'Updated',
            'success'
          );
        } else {
          showSkeletons();

          setStatus(
            'Finding nearby',
            'warning'
          );

          loadFreshData(false);
        }
      }

      return true;
    }

    /*
     * Location changed: discard old visible
     * results before loading the new area.
     */
    state.requestNumber += 1;
    state.allKitchens = [];
    state.openKitchens = [];
    state.closedKitchens = [];

    resetFilters();

    const cached =
      readCache(nextLocation);

    if (cached) {
      applyDiscoveryData(cached);

      setStatus(
        'Updating',
        'warning'
      );
    } else {
      elements.closedSection.hidden =
        true;

      elements.openCount.textContent =
        '0';

      elements.closedCount.textContent =
        '0';

      showSkeletons();

      setStatus(
        'Finding nearby',
        'warning'
      );
    }

    loadFreshData(false);

    return true;
  }

  function setup(location) {
    if (!state.initialized) {
      getElements();

      if (
        !requiredElementsAvailable()
      ) {
        console.error(
          'Customer discovery page elements are incomplete.'
        );
        return false;
      }

      bindEvents();
      state.initialized = true;
    }

    return setLocation(location);
  }

  function refresh() {
    if (!state.location) {
      showToast(
        'Select a delivery location first.',
        'warning'
      );

      return;
    }

    setStatus(
      'Refreshing',
      'warning'
    );

    loadFreshData(true);
  }

  window.ApnaBiteDiscovery =
    Object.freeze({
      setup:
        setup,

      updateLocation:
        setLocation,

      refresh:
        refresh,

      getLocation:
        function() {
          return state.location
            ? {
                latitude:
                  state.location.latitude,
                longitude:
                  state.location.longitude
              }
            : null;
        }
    });
})(window, document);
