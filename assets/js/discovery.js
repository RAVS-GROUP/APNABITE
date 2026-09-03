/**
 * ============================================================
 * APNABITE V1 — CUSTOMER KITCHEN DISCOVERY
 * File: assets/js/discovery.js
 * Version: 15
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    CACHE_PREFIX:
      'apnabite_nearby_kitchens_',
    CACHE_MINUTES: 5,
    SEARCH_DELAY_MS: 250,
    DEFAULT_SORT: 'NEAREST',
    DEFAULT_CATEGORY: 'ALL'
  });

  const state = {
    location: null,
    allKitchens: [],
    openKitchens: [],
    closedKitchens: [],
    radiusKm: 3,
    search: '',
    category:
      CONFIG.DEFAULT_CATEGORY,
    sortBy:
      CONFIG.DEFAULT_SORT,
    loading: false,
    searchTimer: null
  };

  const elements = {};

  function getElements() {
    elements.search =
      document.getElementById(
        'kitchen-search'
      );

    elements.categoryButtons =
      Array.from(
        document.querySelectorAll(
          '[data-kitchen-category]'
        )
      );

    elements.sort =
      document.getElementById(
        'kitchen-sort'
      );

    elements.radius =
      document.getElementById(
        'discovery-radius'
      );

    elements.status =
      document.getElementById(
        'backend-status'
      );

    elements.openList =
      document.getElementById(
        'kitchen-list'
      );

    elements.closedSection =
      document.getElementById(
        'closed-kitchen-section'
      );

    elements.closedList =
      document.getElementById(
        'closed-kitchen-list'
      );

    elements.openCount =
      document.getElementById(
        'open-kitchen-count'
      );

    elements.closedCount =
      document.getElementById(
        'closed-kitchen-count'
      );

    elements.refresh =
      document.getElementById(
        'refresh-kitchens'
      );
  }

  function clean(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
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
        clean(input.foodType)
          .toUpperCase(),
      thumbnailFileId:
        clean(input.thumbnailFileId),
      distanceKm:
        numberOrZero(
          input.distanceKm
        ),
      availabilityStatus:
        clean(
          input.availabilityStatus
        ).toUpperCase(),
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
        input.minimumProductPrice ===
          null ||
        input.minimumProductPrice ===
          undefined
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
              function(category) {
                return clean(category)
                  .toUpperCase();
              }
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

  function getCacheKey(location) {
    const latitude =
      Number(location.latitude)
        .toFixed(3);

    const longitude =
      Number(location.longitude)
        .toFixed(3);

    return (
      CONFIG.CACHE_PREFIX +
      latitude +
      '_' +
      longitude
    );
  }

  function readCache(location) {
    try {
      const raw =
        localStorage.getItem(
          getCacheKey(location)
        );

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
        return null;
      }

      const age =
        Date.now() -
        Number(cached.savedAt);

      const maximumAge =
        CONFIG.CACHE_MINUTES *
        60 *
        1000;

      if (age > maximumAge) {
        localStorage.removeItem(
          getCacheKey(location)
        );

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

    elements.status.textContent =
      text;

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

  function createEmptyState(
    title,
    message
  ) {
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

  function getThumbnailUrl(fileId) {
    const id = clean(fileId);

    if (!id) return '';

    if (
      /^https?:\/\//i.test(id) ||
      /^data:/i.test(id)
    ) {
      return id;
    }

    return (
      'https://drive.google.com/thumbnail' +
      '?id=' +
      encodeURIComponent(id) +
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
    const price =
      Number(value);

    if (!Number.isFinite(price)) {
      return '';
    }

    return (
      '₹' +
      Math.round(price)
    );
  }

  function createKitchenCard(kitchen) {
    const card =
      document.createElement('article');

    card.className =
      kitchen.isOpen
        ? 'kitchen-card'
        : 'kitchen-card kitchen-card--closed';

    card.tabIndex = 0;

    const media =
      document.createElement('div');

    media.className =
      'kitchen-card__media';

    const imageUrl =
      getThumbnailUrl(
        kitchen.thumbnailFileId
      );

    const fallback =
      document.createElement('span');

    fallback.className =
      'kitchen-card__fallback';

    fallback.textContent = '🍲';

    media.appendChild(fallback);

    if (imageUrl) {
      const image =
        document.createElement('img');

      image.className =
        'kitchen-card__image';

      image.src = imageUrl;
      image.alt =
        kitchen.kitchenName;

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

      media.appendChild(closedBadge);
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
          kitchen.averageRating.toFixed(1)
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
          : 'food-tag food-tag--nonveg';

      foodType.textContent =
        kitchen.foodType === 'VEG'
          ? 'Veg'
          : kitchen.foodType ===
              'NON_VEG'
            ? 'Non-Veg'
            : kitchen.foodType;

      tags.appendChild(foodType);
    }

    kitchen.categories
      .slice(0, 2)
      .forEach(function(category) {
        const tag =
          document.createElement('span');

        tag.className =
          'food-tag';

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

    const deliveryTime =
      document.createElement('span');

    deliveryTime.textContent =
      kitchen.estimatedDeliveryMinutes > 0
        ? (
          kitchen
            .estimatedDeliveryMinutes +
          ' min'
        )
        : '';

    meta.appendChild(distance);

    if (deliveryTime.textContent) {
      meta.appendChild(deliveryTime);
    }

    if (
      kitchen.minimumProductPrice !==
      null
    ) {
      const price =
        document.createElement('span');

      price.textContent =
        'From ' +
        formatPrice(
          kitchen.minimumProductPrice
        );

      meta.appendChild(price);
    }

    content.appendChild(top);
    content.appendChild(tags);
    content.appendChild(description);
    content.appendChild(meta);

    card.appendChild(media);
    card.appendChild(content);

    function openKitchen() {
      if (!kitchen.isOpen) {
        if (
          window.ApnaBiteUI &&
          typeof window.ApnaBiteUI
            .showToast === 'function'
        ) {
          window.ApnaBiteUI.showToast(
            'This Kitchen is currently closed.',
            'warning'
          );
        }

        return;
      }

      window.location.href =
        'kitchen.html?kitchenId=' +
        encodeURIComponent(
          kitchen.kitchenId
        );
    }

    card.addEventListener(
      'click',
      openKitchen
    );

    card.addEventListener(
      'keydown',
      function(event) {
        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault();
          openKitchen();
        }
      }
    );

    return card;
  }

  function matchesSearch(kitchen) {
    if (!state.search) return true;

    const searchable =
      [
        kitchen.kitchenName,
        kitchen.description,
        kitchen.foodType
      ]
        .concat(kitchen.categories)
        .concat(
          kitchen.productsPreview.map(
            function(product) {
              return product.productName;
            }
          )
        )
        .join(' ')
        .toLowerCase();

    return (
      searchable.indexOf(
        state.search
      ) !== -1
    );
  }

  function matchesCategory(kitchen) {
    if (
      state.category === 'ALL'
    ) {
      return true;
    }

    if (
      state.category === 'VEG' ||
      state.category === 'NON_VEG'
    ) {
      return (
        kitchen.foodType ===
          state.category ||
        kitchen.productsPreview.some(
          function(product) {
            return (
              clean(product.foodType)
                .toUpperCase() ===
              state.category
            );
          }
        )
      );
    }

    return (
      kitchen.categories.indexOf(
        state.category
      ) !== -1
    );
  }

  function sortKitchens(kitchens) {
    kitchens.sort(
      function(first, second) {
        if (
          state.sortBy ===
          'TOP_RATED'
        ) {
          return (
            second.averageRating -
              first.averageRating ||
            first.distanceKm -
              second.distanceKm
          );
        }

        if (
          state.sortBy ===
          'PRICE_LOW_TO_HIGH'
        ) {
          const firstPrice =
            first.minimumProductPrice ===
              null
              ? Number.MAX_SAFE_INTEGER
              : first.minimumProductPrice;

          const secondPrice =
            second.minimumProductPrice ===
              null
              ? Number.MAX_SAFE_INTEGER
              : second.minimumProductPrice;

          return (
            firstPrice -
              secondPrice ||
            first.distanceKm -
              second.distanceKm
          );
        }

        if (
          state.sortBy === 'FASTEST'
        ) {
          return (
            first
              .estimatedDeliveryMinutes -
              second
                .estimatedDeliveryMinutes ||
            first.distanceKm -
              second.distanceKm
          );
        }

        return (
          first.distanceKm -
            second.distanceKm ||
          second.averageRating -
            first.averageRating
        );
      }
    );

    return kitchens;
  }

  function render() {
    const matching =
      state.allKitchens
        .filter(matchesSearch)
        .filter(matchesCategory);

    const open =
      sortKitchens(
        matching.filter(
          function(kitchen) {
            return kitchen.isOpen;
          }
        )
      );

    const closed =
      sortKitchens(
        matching.filter(
          function(kitchen) {
            return !kitchen.isOpen;
          }
        )
      );

    state.openKitchens = open;
    state.closedKitchens = closed;

    elements.openList.innerHTML = '';
    elements.closedList.innerHTML = '';

    elements.openCount.textContent =
      String(open.length);

    elements.closedCount.textContent =
      String(closed.length);

    elements.radius.textContent =
      'Within ' +
      state.radiusKm +
      ' km';

    if (!open.length) {
      elements.openList.appendChild(
        createEmptyState(
          matching.length
            ? 'No Kitchen is open right now'
            : 'No nearby Kitchens found',
          state.search ||
          state.category !== 'ALL'
            ? 'Try changing your search or food category.'
            : (
              'No active Kitchen is available within ' +
              state.radiusKm +
              ' km of this address.'
            )
        )
      );
    } else {
      open.forEach(function(kitchen) {
        elements.openList.appendChild(
          createKitchenCard(kitchen)
        );
      });
    }

    if (!closed.length) {
      elements.closedSection.hidden =
        true;
    } else {
      elements.closedSection.hidden =
        false;

      closed.forEach(function(kitchen) {
        elements.closedList.appendChild(
          createKitchenCard(kitchen)
        );
      });
    }
  }

  function applyDiscoveryData(data) {
    const input = data || {};

    state.radiusKm =
      numberOrZero(
        input.radiusKm
      ) || 3;

    const kitchens =
      Array.isArray(input.kitchens)
        ? input.kitchens
        : [];

    state.allKitchens =
      kitchens
        .map(normalizeKitchen)
        .filter(function(kitchen) {
          return Boolean(
            kitchen.kitchenId
          );
        });

    render();
  }

  async function loadFreshData() {
    if (
      state.loading ||
      !state.location
    ) {
      return;
    }

    state.loading = true;
    setLoading(true);

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'discovery.nearbyKitchens',
          {
            latitude:
              state.location.latitude,
            longitude:
              state.location.longitude,
            search: '',
            category: 'ALL',
            sortBy: 'NEAREST',
            limit: 50
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
          : {};

      applyDiscoveryData(data);

      writeCache(
        state.location,
        data
      );

      setStatus(
        'Updated',
        'success'
      );
    } catch (error) {
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

      if (
        window.ApnaBiteUI &&
        typeof window.ApnaBiteUI
          .showToast === 'function'
      ) {
        window.ApnaBiteUI.showToast(
          error && error.message
            ? error.message
            : 'Unable to load nearby Kitchens.',
          'error'
        );
      }
    } finally {
      state.loading = false;
      setLoading(false);
    }
  }

  function handleSearch() {
    window.clearTimeout(
      state.searchTimer
    );

    state.searchTimer =
      window.setTimeout(function() {
        state.search =
          clean(
            elements.search.value
          ).toLowerCase();

        render();
      }, CONFIG.SEARCH_DELAY_MS);
  }

  function handleCategory(event) {
    const button =
      event.currentTarget;

    const category =
      clean(
        button.dataset
          .kitchenCategory
      ).toUpperCase();

    state.category =
      category || 'ALL';

    elements.categoryButtons
      .forEach(function(item) {
        item.classList.toggle(
          'chip--active',
          item === button
        );
      });

    render();
  }

  function handleSort() {
    state.sortBy =
      clean(
        elements.sort.value
      ).toUpperCase() ||
      'NEAREST';

    render();
  }

  function bindEvents() {
    elements.search.addEventListener(
      'input',
      handleSearch
    );

    elements.categoryButtons
      .forEach(function(button) {
        button.addEventListener(
          'click',
          handleCategory
        );
      });

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

        loadFreshData();
      }
    );
  }

  function initialize(location) {
    const latitude =
      numberOrZero(
        location && location.latitude
      );

    const longitude =
      numberOrZero(
        location && location.longitude
      );

    if (!latitude || !longitude) {
      elements.openList.innerHTML = '';

      elements.openList.appendChild(
        createEmptyState(
          'Select delivery location',
          'Choose your delivery address to view nearby Kitchens.'
        )
      );

      setStatus(
        'Location needed',
        'error'
      );

      return;
    }

    state.location = {
      latitude: latitude,
      longitude: longitude
    };

    const cached =
      readCache(state.location);

    if (cached) {
      applyDiscoveryData(cached);

      setStatus(
        'Updating',
        'warning'
      );
    } else {
      showSkeletons();

      setStatus(
        'Finding nearby',
        'warning'
      );
    }

    loadFreshData();
  }

  function setup(location) {
    getElements();
    bindEvents();

    elements.search.disabled = false;

    elements.categoryButtons
      .forEach(function(button) {
        button.disabled = false;
      });

    elements.sort.disabled = false;
    elements.refresh.disabled = false;

    initialize(location);
  }

  window.ApnaBiteDiscovery =
    Object.freeze({
      setup: setup,
      refresh: loadFreshData
    });
})(window, document);
