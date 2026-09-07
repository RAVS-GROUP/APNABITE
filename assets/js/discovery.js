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
    radiusKm: 3,
    search: '',
    category: CONFIG.DEFAULT_CATEGORY,
    sortBy: CONFIG.DEFAULT_SORT,
    loading: false,
    reloadRequested: false,
    searchTimer: null,
    requestNumber: 0
  };

  const elements = {};
  const byId = id => document.getElementById(id);
  const clean = value => String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  const normalize = value => clean(value).toUpperCase().replace(/\s+/g, '_');
  const numberOrZero = value => Number.isFinite(Number(value)) ? Number(value) : 0;

  function getElements() {
    elements.search = byId('kitchen-search');
    elements.categoryButtons = Array.from(document.querySelectorAll('[data-kitchen-category]'));
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
    return Boolean(elements.search && elements.sort && elements.radius && elements.status &&
      elements.openList && elements.closedSection && elements.closedList &&
      elements.openCount && elements.closedCount && elements.refresh);
  }

  function normalizeKitchen(input) {
    input = input || {};
    return {
      kitchenId: clean(input.kitchenId),
      kitchenName: clean(input.kitchenName) || 'ApnaBite Kitchen',
      description: clean(input.description),
      foodType: normalize(input.foodType),
      thumbnailFileId: clean(input.thumbnailFileId),
      thumbnailUrl: clean(input.thumbnailUrl),
      distanceKm: numberOrZero(input.distanceKm),
      isOpen: input.isOpen === true,
      minimumProductPrice: input.minimumProductPrice == null ? null : numberOrZero(input.minimumProductPrice),
      estimatedDeliveryMinutes: numberOrZero(input.estimatedDeliveryMinutes),
      averageRating: numberOrZero(input.averageRating),
      ratingCount: numberOrZero(input.ratingCount),
      categories: Array.isArray(input.categories) ? input.categories.map(normalize) : [],
      productsPreview: Array.isArray(input.productsPreview) ? input.productsPreview : []
    };
  }

  function createLocationKey(location) {
    return Number(location.latitude).toFixed(4) + '_' + Number(location.longitude).toFixed(4);
  }

  function getCacheKey(location) {
    return CONFIG.CACHE_PREFIX + createLocationKey(location);
  }

  function readCache(location) {
    try {
      const key = getCacheKey(location);
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const cached = JSON.parse(raw);
      const maximumAge = CONFIG.CACHE_MINUTES * 60 * 1000;
      if (!cached || !cached.savedAt || !Array.isArray(cached.kitchens) || Date.now() - Number(cached.savedAt) > maximumAge) {
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
      localStorage.setItem(getCacheKey(location), JSON.stringify({
        savedAt: Date.now(),
        radiusKm: numberOrZero(data.radiusKm) || 3,
        kitchens: Array.isArray(data.kitchens) ? data.kitchens : []
      }));
    } catch (error) {}
  }

  function setStatus(text, type) {
    elements.status.textContent = text;
    elements.status.className = type === 'success' ? 'badge badge--success' :
      type === 'error' ? 'badge badge--danger' : 'badge badge--warning';
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);
    elements.refresh.disabled = state.loading || !state.location;
    elements.refresh.textContent = state.loading ? 'Refreshing…' : 'Refresh';
  }

  function setControlsEnabled(enabled) {
    elements.search.disabled = !enabled;
    elements.categoryButtons.forEach(button => { button.disabled = !enabled; });
    elements.sort.disabled = !enabled;
    elements.refresh.disabled = !enabled || state.loading;
  }

  function showToast(message, type) {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.showToast === 'function') {
      window.ApnaBiteUI.showToast(message, type || 'info');
    }
  }

  function showSkeletons() {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.showSkeletons === 'function') {
      window.ApnaBiteUI.showSkeletons(elements.openList, 3);
    } else {
      elements.openList.innerHTML = '<div class="kitchen-loading">Finding nearby Kitchens…</div>';
    }
  }

  function createEmptyState(title, message) {
    const container = document.createElement('div');
    container.className = 'kitchen-empty-state';
    const icon = document.createElement('span');
    icon.className = 'kitchen-empty-state__icon';
    icon.textContent = '⌂';
    const heading = document.createElement('strong');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = message;
    container.append(icon, heading, text);
    return container;
  }

  function getThumbnailUrl(kitchen) {
    const directUrl = clean(kitchen.thumbnailUrl);
    if (/^https?:\/\//i.test(directUrl) || /^data:/i.test(directUrl)) return directUrl;
    const fileId = clean(kitchen.thumbnailFileId);
    return fileId ? 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(fileId) + '&sz=w600' : '';
  }

  function formatDistance(distanceKm) {
    const distance = Number(distanceKm);
    if (!Number.isFinite(distance)) return '';
    if (distance < 1) return Math.max(50, Math.round(distance * 1000 / 50) * 50) + ' m';
    return distance.toFixed(1) + ' km';
  }

  function formatPrice(value) {
    const price = Number(value);
    return Number.isFinite(price) ? '₹' + Math.round(price) : '';
  }

  function createKitchenCard(kitchen) {
    const card = document.createElement('article');
    card.className = kitchen.isOpen ? 'kitchen-card' : 'kitchen-card kitchen-card--closed';
    card.tabIndex = 0;
    card.dataset.kitchenId = kitchen.kitchenId;

    const media = document.createElement('div');
    media.className = 'kitchen-card__media';
    const fallback = document.createElement('span');
    fallback.className = 'kitchen-card__fallback';
    fallback.textContent = '🍲';
    media.appendChild(fallback);

    const imageUrl = getThumbnailUrl(kitchen);
    if (imageUrl) {
      const image = document.createElement('img');
      image.className = 'kitchen-card__image';
      image.src = imageUrl;
      image.alt = kitchen.kitchenName;
      image.loading = 'lazy';
      image.decoding = 'async';
      image.addEventListener('load', () => { fallback.hidden = true; });
      image.addEventListener('error', () => { image.remove(); fallback.hidden = false; });
      media.appendChild(image);
    }

    if (!kitchen.isOpen) {
      const badge = document.createElement('span');
      badge.className = 'kitchen-card__closed-badge';
      badge.textContent = 'CLOSED';
      media.appendChild(badge);
    }

    const content = document.createElement('div');
    content.className = 'kitchen-card__content';
    const top = document.createElement('div');
    top.className = 'kitchen-card__top';
    const title = document.createElement('h3');
    title.className = 'kitchen-card__title';
    title.textContent = kitchen.kitchenName;
    const rating = document.createElement('span');
    rating.className = 'kitchen-card__rating';
    rating.textContent = kitchen.ratingCount > 0 ? '★ ' + kitchen.averageRating.toFixed(1) : 'New';
    top.append(title, rating);

    const tags = document.createElement('div');
    tags.className = 'kitchen-card__tags';
    if (kitchen.foodType) {
      const foodTag = document.createElement('span');
      foodTag.className = kitchen.foodType === 'VEG' ? 'food-tag food-tag--veg' :
        kitchen.foodType === 'NON_VEG' ? 'food-tag food-tag--nonveg' : 'food-tag';
      foodTag.textContent = kitchen.foodType === 'VEG' ? 'Veg' :
        kitchen.foodType === 'NON_VEG' ? 'Non-Veg' : kitchen.foodType.replace(/_/g, ' ');
      tags.appendChild(foodTag);
    }
    kitchen.categories.slice(0, 2).forEach(category => {
      const tag = document.createElement('span');
      tag.className = 'food-tag';
      tag.textContent = category.replace(/_/g, ' ');
      tags.appendChild(tag);
    });

    const description = document.createElement('p');
    description.className = 'kitchen-card__description';
    description.textContent = kitchen.description || 'Fresh homemade food prepared with care.';
    const meta = document.createElement('div');
    meta.className = 'kitchen-card__meta';
    const distance = formatDistance(kitchen.distanceKm);
    if (distance) {
      const item = document.createElement('span');
      item.textContent = distance;
      meta.appendChild(item);
    }
    if (kitchen.estimatedDeliveryMinutes > 0) {
      const item = document.createElement('span');
      item.textContent = kitchen.estimatedDeliveryMinutes + ' min';
      meta.appendChild(item);
    }
    if (kitchen.minimumProductPrice !== null) {
      const item = document.createElement('span');
      item.textContent = 'From ' + formatPrice(kitchen.minimumProductPrice);
      meta.appendChild(item);
    }
    content.append(top, tags, description, meta);
    card.append(media, content);

    function openKitchen() {
      if (!kitchen.isOpen) {
        showToast('This Kitchen is currently closed.', 'warning');
        return;
      }
      window.location.href = 'kitchen.html?kitchenId=' + encodeURIComponent(kitchen.kitchenId);
    }
    card.addEventListener('click', openKitchen);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openKitchen();
      }
    });
    return card;
  }

  function matchesSearch(kitchen) {
    if (!state.search) return true;
    return [kitchen.kitchenName, kitchen.description, kitchen.foodType]
      .concat(kitchen.categories)
      .concat(kitchen.productsPreview.map(product => clean(product.productName)))
      .join(' ').toLowerCase().includes(state.search);
  }

  function matchesCategory(kitchen) {
    if (state.category === 'ALL') return true;
    if (state.category === 'VEG' || state.category === 'NON_VEG') {
      return kitchen.foodType === state.category || kitchen.productsPreview.some(
        product => normalize(product.foodType) === state.category
      );
    }
    return kitchen.categories.includes(state.category);
  }

  function sortKitchens(kitchens) {
    return kitchens.sort((first, second) => {
      if (state.sortBy === 'TOP_RATED') {
        return second.averageRating - first.averageRating || first.distanceKm - second.distanceKm;
      }
      if (state.sortBy === 'PRICE_LOW_TO_HIGH') {
        const firstPrice = first.minimumProductPrice === null ? Number.MAX_SAFE_INTEGER : first.minimumProductPrice;
        const secondPrice = second.minimumProductPrice === null ? Number.MAX_SAFE_INTEGER : second.minimumProductPrice;
        return firstPrice - secondPrice || first.distanceKm - second.distanceKm;
      }
      if (state.sortBy === 'FASTEST') {
        return first.estimatedDeliveryMinutes - second.estimatedDeliveryMinutes || first.distanceKm - second.distanceKm;
      }
      return first.distanceKm - second.distanceKm || second.averageRating - first.averageRating;
    });
  }

  function render() {
    const matching = state.allKitchens.filter(matchesSearch).filter(matchesCategory);
    const open = sortKitchens(matching.filter(kitchen => kitchen.isOpen));
    const closed = sortKitchens(matching.filter(kitchen => !kitchen.isOpen));
    elements.openList.innerHTML = '';
    elements.closedList.innerHTML = '';
    elements.openCount.textContent = String(open.length);
    elements.closedCount.textContent = String(closed.length);
    elements.radius.textContent = 'Within ' + state.radiusKm + ' km';
    if (!open.length) {
      elements.openList.appendChild(createEmptyState(
        matching.length ? 'No Kitchen is open right now' : 'No nearby Kitchens found',
        state.search || state.category !== 'ALL' ? 'Try changing your search or food category.' :
          'No active Kitchen is available within ' + state.radiusKm + ' km of this address.'
      ));
    } else {
      open.forEach(kitchen => elements.openList.appendChild(createKitchenCard(kitchen)));
    }
    elements.closedSection.hidden = closed.length === 0;
    closed.forEach(kitchen => elements.closedList.appendChild(createKitchenCard(kitchen)));
  }

  function applyDiscoveryData(data) {
    data = data || {};
    state.radiusKm = numberOrZero(data.radiusKm) || 3;
    state.allKitchens = (Array.isArray(data.kitchens) ? data.kitchens : [])
      .map(normalizeKitchen).filter(kitchen => Boolean(kitchen.kitchenId));
    render();
  }

  async function loadFreshData(forceRefresh) {
    if (!state.location) return;
    if (state.loading) {
      state.reloadRequested = true;
      return;
    }
    state.loading = true;
    state.reloadRequested = false;
    const requestNumber = ++state.requestNumber;
    const requestLocation = Object.assign({}, state.location);
    const requestLocationKey = createLocationKey(requestLocation);
    setLoading(true);
    try {
      const response = await window.ApnaBiteAPI.request('discovery.nearbyKitchens', {
        latitude: requestLocation.latitude,
        longitude: requestLocation.longitude,
        search: '', category: 'ALL', sortBy: 'NEAREST', limit: 50,
        refreshToken: forceRefresh ? Date.now() : ''
      }, {
        retry: false,
        deduplicate: !forceRefresh,
        timeoutMs: 12000
      });
      if (requestNumber !== state.requestNumber || requestLocationKey !== state.locationKey) return;
      const data = response && response.data ? response.data : {};
      applyDiscoveryData(data);
      writeCache(requestLocation, data);
      setStatus('Updated', 'success');
    } catch (error) {
      if (requestNumber !== state.requestNumber || requestLocationKey !== state.locationKey) return;
      console.error('Kitchen discovery failed:', error);
      if (!state.allKitchens.length) {
        elements.openList.innerHTML = '';
        elements.openList.appendChild(createEmptyState('Unable to load Kitchens', 'Check your connection and tap Refresh.'));
      }
      setStatus('Retry', 'error');
      showToast(clean(error && error.message) || 'Unable to load nearby Kitchens.', 'error');
    } finally {
      if (requestNumber === state.requestNumber) {
        state.loading = false;
        setLoading(false);
      }
      if (state.reloadRequested) {
        state.reloadRequested = false;
        window.setTimeout(() => loadFreshData(false), 0);
      }
    }
  }

  function handleSearch() {
    window.clearTimeout(state.searchTimer);
    state.searchTimer = window.setTimeout(() => {
      state.search = clean(elements.search.value).toLowerCase();
      render();
    }, CONFIG.SEARCH_DELAY_MS);
  }

  function handleCategory(event) {
    state.category = normalize(event.currentTarget.dataset.kitchenCategory) || 'ALL';
    elements.categoryButtons.forEach(button => {
      const active = button === event.currentTarget;
      button.classList.toggle('chip--active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    render();
  }

  function handleSort() {
    state.sortBy = normalize(elements.sort.value) || 'NEAREST';
    render();
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;
    elements.search.addEventListener('input', handleSearch);
    elements.categoryButtons.forEach(button => button.addEventListener('click', handleCategory));
    elements.sort.addEventListener('change', handleSort);
    elements.refresh.addEventListener('click', () => {
      setStatus('Refreshing', 'warning');
      loadFreshData(true);
    });
  }

  function resetFilters() {
    state.search = '';
    state.category = CONFIG.DEFAULT_CATEGORY;
    state.sortBy = CONFIG.DEFAULT_SORT;
    elements.search.value = '';
    elements.sort.value = CONFIG.DEFAULT_SORT;
    elements.categoryButtons.forEach(button => {
      const active = normalize(button.dataset.kitchenCategory) === CONFIG.DEFAULT_CATEGORY;
      button.classList.toggle('chip--active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function setLocation(location) {
    const latitude = Number(location && location.latitude);
    const longitude = Number(location && location.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      state.location = null;
      state.locationKey = '';
      state.allKitchens = [];
      elements.openList.innerHTML = '';
      elements.openList.appendChild(createEmptyState('Select delivery location', 'Choose a delivery address to view nearby Kitchens.'));
      elements.closedSection.hidden = true;
      elements.openCount.textContent = '0';
      elements.closedCount.textContent = '0';
      setControlsEnabled(false);
      setStatus('Location needed', 'error');
      return false;
    }
    const nextLocation = { latitude, longitude };
    const nextLocationKey = createLocationKey(nextLocation);
    const locationChanged = nextLocationKey !== state.locationKey;
    state.location = nextLocation;
    state.locationKey = nextLocationKey;
    setControlsEnabled(true);
    if (!locationChanged) {
      if (!state.allKitchens.length && !state.loading) {
        const cached = readCache(nextLocation);
        if (cached) {
          applyDiscoveryData(cached);
          setStatus('Updated', 'success');
        } else {
          showSkeletons();
          setStatus('Finding nearby', 'warning');
          loadFreshData(false);
        }
      }
      return true;
    }
    state.requestNumber += 1;
    state.allKitchens = [];
    resetFilters();
    const cached = readCache(nextLocation);
    if (cached) {
      applyDiscoveryData(cached);
      setStatus('Updating', 'warning');
    } else {
      elements.closedSection.hidden = true;
      elements.openCount.textContent = '0';
      elements.closedCount.textContent = '0';
      showSkeletons();
      setStatus('Finding nearby', 'warning');
    }
    loadFreshData(false);
    return true;
  }

  function setup(location) {
    if (!state.initialized) {
      getElements();
      if (!requiredElementsAvailable()) {
        console.error('Customer discovery page elements are incomplete.');
        return false;
      }
      bindEvents();
      state.initialized = true;
    }
    return setLocation(location);
  }

  window.ApnaBiteDiscovery = Object.freeze({
    setup,
    updateLocation: setLocation,
    refresh: () => {
      if (!state.location) return showToast('Select a delivery location first.', 'warning');
      setStatus('Refreshing', 'warning');
      loadFreshData(true);
    },
    getLocation: () => state.location ? Object.assign({}, state.location) : null
  });
})(window, document);
