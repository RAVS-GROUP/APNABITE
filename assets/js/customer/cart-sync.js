/**
 * ============================================================
 * APNABITE V1 — CUSTOMER CART SYNC
 * File: assets/js/customer/cart-sync.js
 * Requires: core.js, api.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    STORAGE_KEY: 'apnabite_cart_v1',
    CART_TYPE: 'NORMAL',
    SYNC_DELAY_MS: 700,
    REQUEST_TIMEOUT_MS: 15000
  });

  const state = {
    initialized: false,
    initializing: false,
    syncing: false,
    pendingSync: false,
    syncTimer: null,
    lastSyncedJson: '',
    lastError: null
  };

  function clean(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function emptyCart() {
    return {
      version: 1,
      cartId: '',
      kitchenId: '',
      kitchenName: '',
      items: [],
      updatedAt: ''
    };
  }

  function normalizeAddon(addon) {
    const input = addon || {};
    return {
      addonId: clean(input.addonId),
      addonName: clean(input.addonName),
      unitPrice: Math.max(0, numberValue(input.unitPrice, 0)),
      quantity: Math.max(0, Math.floor(numberValue(input.quantity, 0))),
      total: Math.max(0, numberValue(
        input.total,
        numberValue(input.unitPrice, 0) * numberValue(input.quantity, 0)
      ))
    };
  }

  function normalizeItem(item) {
    const input = item || {};
    const addons = Array.isArray(input.addons)
      ? input.addons.map(normalizeAddon).filter(function(addon) {
          return addon.addonId && addon.quantity > 0;
        })
      : [];
    const quantity = Math.max(1, Math.floor(numberValue(input.quantity, 1)));
    const unitPrice = Math.max(0, numberValue(
      input.unitPrice !== undefined ? input.unitPrice : input.selectedOptionPrice,
      0
    ));
    const addonTotal = addons.reduce(function(total, addon) {
      return total + addon.total;
    }, 0);
    const optionCode = clean(input.selectedOptionCode) || 'DEFAULT';
    const addonSignature = addons.map(function(addon) {
      return addon.addonId + ':' + addon.quantity;
    }).sort().join('|') || 'NO_ADDONS';

    return {
      cartItemId: clean(input.cartItemId) ||
        clean(input.productId) + '__' + optionCode + '__' + addonSignature,
      itemType: clean(input.itemType) || 'PRODUCT',
      kitchenId: clean(input.kitchenId),
      kitchenName: clean(input.kitchenName),
      productId: clean(input.productId),
      productName: clean(input.productName),
      thumbnailUrl: clean(input.thumbnailUrl),
      quantityMode: clean(input.quantityMode) || 'COUNT',
      unitLabel: clean(input.unitLabel),
      selectedOptionCode: optionCode,
      selectedOptionLabel: clean(input.selectedOptionLabel),
      selectedOptionPrice: unitPrice,
      unitPrice: unitPrice,
      quantity: quantity,
      minimumQuantity: Math.max(1, Math.floor(numberValue(input.minimumQuantity, 1))),
      maximumQuantity: Math.max(1, Math.floor(numberValue(input.maximumQuantity, 1))),
      availableQuantity: Math.max(0, Math.floor(numberValue(input.availableQuantity, 0))),
      productSubtotal: Number((unitPrice * quantity).toFixed(2)),
      addons: addons,
      addonTotal: Number(addonTotal.toFixed(2)),
      itemTotal: Number((unitPrice * quantity + addonTotal).toFixed(2)),
      itemConfig: input.itemConfig && typeof input.itemConfig === 'object'
        ? input.itemConfig
        : {}
    };
  }

  function normalizeCart(cart) {
    const input = cart && typeof cart === 'object' ? cart : {};
    const items = Array.isArray(input.items)
      ? input.items.map(normalizeItem).filter(function(item) {
          return item.productId && item.quantity > 0;
        })
      : [];
    const firstItem = items[0] || {};
    return {
      version: 1,
      cartId: clean(input.cartId),
      kitchenId: clean(input.kitchenId) || clean(firstItem.kitchenId),
      kitchenName: clean(input.kitchenName) || clean(firstItem.kitchenName),
      items: items,
      updatedAt: clean(input.updatedAt)
    };
  }

  function readLocalCart() {
    try {
      return normalizeCart(JSON.parse(
        window.localStorage.getItem(CONFIG.STORAGE_KEY) || 'null'
      ));
    } catch (error) {
      return emptyCart();
    }
  }

  function writeLocalCart(cart, dispatchEvent) {
    const normalized = normalizeCart(cart);
    normalized.updatedAt = clean(cart && cart.updatedAt) || new Date().toISOString();
    if (normalized.items.length) {
      window.localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(normalized));
    } else {
      window.localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
    if (dispatchEvent && window.ApnaBiteCore && typeof window.ApnaBiteCore.dispatch === 'function') {
      window.ApnaBiteCore.dispatch('cart:changed', normalized);
    }
    document.dispatchEvent(new CustomEvent('apnabite:cart-restored', {
      detail: { cart: normalized }
    }));
    return normalized;
  }

  function getSelectedAddressId() {
    const keys = ['apnabite_selected_address', 'apnabite_location'];
    for (let index = 0; index < keys.length; index += 1) {
      try {
        const parsed = JSON.parse(window.localStorage.getItem(keys[index]) || 'null');
        const addressId = clean(parsed && (parsed.addressId || parsed.Address_ID));
        if (addressId) return addressId;
      } catch (error) {}
    }
    return '';
  }

  function buildSyncPayload(cart) {
    const itemTotal = cart.items.reduce(function(total, item) {
      return total + numberValue(item.itemTotal, 0);
    }, 0);
    return {
      cartType: CONFIG.CART_TYPE,
      kitchenId: cart.kitchenId,
      selectedAddressId: getSelectedAddressId(),
      estimatedTotal: Number(itemTotal.toFixed(2)),
      items: cart.items.map(function(item) {
        return {
          cartItemId: item.cartItemId,
          itemType: item.itemType || 'PRODUCT',
          productId: item.productId,
          productName: item.productName,
          quantityMode: item.quantityMode,
          selectedOptionCode: item.selectedOptionCode || 'DEFAULT',
          selectedOptionLabel: item.selectedOptionLabel,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          addons: item.addons,
          itemConfig: item.itemConfig || {}
        };
      })
    };
  }

  function canUseApi() {
    return Boolean(
      window.ApnaBiteAPI &&
      typeof window.ApnaBiteAPI.request === 'function' &&
      window.ApnaBiteCore &&
      typeof window.ApnaBiteCore.isAuthenticated === 'function' &&
      window.ApnaBiteCore.isAuthenticated() &&
      (!window.ApnaBiteCore.getCurrentRole || window.ApnaBiteCore.getCurrentRole() === 'CUSTOMER')
    );
  }

  async function getServerCart() {
    if (!canUseApi()) return emptyCart();
    const response = await window.ApnaBiteAPI.request('cart.get', {
      cartType: CONFIG.CART_TYPE
    }, {
      retry: false,
      deduplicate: true,
      timeoutMs: CONFIG.REQUEST_TIMEOUT_MS
    });
    return normalizeCart(response && response.data ? response.data : {});
  }

  async function syncNow() {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = null;
    if (!canUseApi()) return null;
    if (state.syncing) {
      state.pendingSync = true;
      return null;
    }

    const cart = readLocalCart();
    if (!cart.items.length) return null;
    const payload = buildSyncPayload(cart);
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === state.lastSyncedJson) return cart;

    state.syncing = true;
    state.pendingSync = false;
    try {
      const response = await window.ApnaBiteAPI.request('cart.sync', payload, {
        retry: false,
        deduplicate: false,
        timeoutMs: CONFIG.REQUEST_TIMEOUT_MS
      });
      const serverCart = normalizeCart(response && response.data ? response.data : {});
      state.lastSyncedJson = payloadJson;
      state.lastError = null;
      if (serverCart.cartId) {
        cart.cartId = serverCart.cartId;
        writeLocalCart(cart, false);
      }
      document.dispatchEvent(new CustomEvent('apnabite:cart-synced', {
        detail: { cart: serverCart }
      }));
      return serverCart;
    } catch (error) {
      state.lastError = error;
      console.warn('Cart background sync failed:', error);
      return null;
    } finally {
      state.syncing = false;
      if (state.pendingSync) {
        state.pendingSync = false;
        scheduleSync(250);
      }
    }
  }

  function scheduleSync(delay) {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = window.setTimeout(syncNow, Number(delay) >= 0
      ? Number(delay)
      : CONFIG.SYNC_DELAY_MS);
  }

  async function restore() {
    if (!canUseApi()) return readLocalCart();
    const localCart = readLocalCart();
    try {
      const serverCart = await getServerCart();
      if (localCart.items.length) {
        scheduleSync(0);
        return localCart;
      }
      if (serverCart.items.length) {
        return writeLocalCart(serverCart, false);
      }
      return localCart;
    } catch (error) {
      state.lastError = error;
      console.warn('Server cart could not be restored:', error);
      return localCart;
    }
  }

  async function clearServerCart() {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = null;
    state.lastSyncedJson = '';
    window.localStorage.removeItem(CONFIG.STORAGE_KEY);
    if (!canUseApi()) return emptyCart();
    try {
      const response = await window.ApnaBiteAPI.request('cart.clear', {
        cartType: CONFIG.CART_TYPE
      }, {
        retry: false,
        deduplicate: false,
        timeoutMs: CONFIG.REQUEST_TIMEOUT_MS
      });
      return normalizeCart(response && response.data ? response.data : {});
    } catch (error) {
      state.lastError = error;
      console.warn('Server cart could not be cleared:', error);
      throw error;
    }
  }

  function bindEvents() {
    document.addEventListener('apnabite:cart:changed', function() {
      scheduleSync();
    });
    window.addEventListener('storage', function(event) {
      if (event.key === CONFIG.STORAGE_KEY && event.newValue) scheduleSync();
    });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') restore();
      else if (readLocalCart().items.length) syncNow();
    });
    window.addEventListener('online', function() {
      if (readLocalCart().items.length) scheduleSync(0);
    });
  }

  async function initialize() {
    if (state.initialized || state.initializing) return;
    state.initializing = true;
    bindEvents();
    await restore();
    state.initialized = true;
    state.initializing = false;
  }

  window.ApnaBiteCartSync = Object.freeze({
    initialize: initialize,
    restore: restore,
    scheduleSync: scheduleSync,
    syncNow: syncNow,
    clear: clearServerCart,
    getCart: readLocalCart,
    storageKey: CONFIG.STORAGE_KEY
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(window, document);
