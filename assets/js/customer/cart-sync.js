/**
 * ============================================================
 * APNABITE V1 — CUSTOMER CART SYNC
 * File: assets/js/customer/cart-sync.js
 * Complete replacement — performance and multi-device update
 * Requires: core.js, api.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    STORAGE_KEY: 'apnabite_cart_v1',
    CART_TYPE: 'NORMAL',
    SYNC_DELAY_MS: 650,
    REQUEST_TIMEOUT_MS: 15000,
    RESTORE_COOLDOWN_MS: 30000
  });

  const state = {
    initialized: false,
    initializePromise: null,
    restorePromise: null,
    syncPromise: null,
    pendingSync: false,
    syncTimer: null,
    lastSyncedJson: '',
    lastRestoreAt: 0,
    lastError: null,
    eventsBound: false
  };

  function clean(value) {
    return String(value === undefined || value === null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function emptyCart() {
    return { version: 1, cartId: '', kitchenId: '', kitchenName: '', items: [], updatedAt: '' };
  }

  function normalizeAddon(addon) {
    const input = addon || {};
    const unitPrice = Math.max(0, numberValue(input.unitPrice, 0));
    const quantity = Math.max(0, Math.floor(numberValue(input.quantity, 0)));
    return {
      addonId: clean(input.addonId),
      addonName: clean(input.addonName),
      unitPrice: unitPrice,
      quantity: quantity,
      total: Number(Math.max(0, numberValue(input.total, unitPrice * quantity)).toFixed(2))
    };
  }

  function normalizeItem(item) {
    const input = item || {};
    const addons = (Array.isArray(input.addons) ? input.addons : [])
      .map(normalizeAddon)
      .filter(function(addon) { return addon.addonId && addon.quantity > 0; });
    const quantity = Math.max(1, Math.floor(numberValue(input.quantity, 1)));
    const unitPrice = Math.max(0, numberValue(
      input.unitPrice !== undefined ? input.unitPrice : input.selectedOptionPrice,
      0
    ));
    const addonTotal = addons.reduce(function(total, addon) { return total + addon.total; }, 0);
    const optionCode = clean(input.selectedOptionCode) || 'DEFAULT';
    const addonSignature = addons.map(function(addon) {
      return addon.addonId + ':' + addon.quantity;
    }).sort().join('|') || 'NO_ADDONS';
    return {
      cartItemId: clean(input.cartItemId) || clean(input.productId) + '__' + optionCode + '__' + addonSignature,
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
      itemConfig: input.itemConfig && typeof input.itemConfig === 'object' ? input.itemConfig : {}
    };
  }

  function normalizeCart(cart) {
    const input = cart && typeof cart === 'object' ? cart : {};
    const items = (Array.isArray(input.items) ? input.items : [])
      .map(normalizeItem)
      .filter(function(item) { return item.productId && item.quantity > 0; });
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
      return normalizeCart(JSON.parse(window.localStorage.getItem(CONFIG.STORAGE_KEY) || 'null'));
    } catch (error) {
      window.localStorage.removeItem(CONFIG.STORAGE_KEY);
      return emptyCart();
    }
  }

  function dispatchCartEvent(name, cart) {
    document.dispatchEvent(new CustomEvent(name, { detail: { cart: normalizeCart(cart) } }));
  }

  function writeLocalCart(cart, options) {
    const settings = options || {};
    const normalized = normalizeCart(cart);
    normalized.updatedAt = clean(cart && cart.updatedAt) || new Date().toISOString();
    if (normalized.items.length) {
      window.localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(normalized));
    } else {
      window.localStorage.removeItem(CONFIG.STORAGE_KEY);
    }
    if (settings.changed) dispatchCartEvent('apnabite:cart:changed', normalized);
    if (settings.restored) dispatchCartEvent('apnabite:cart-restored', normalized);
    return normalized;
  }

  function cartTimestamp(cart) {
    const timestamp = Date.parse(clean(cart && cart.updatedAt));
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function cartContentSignature(cart) {
    const normalized = normalizeCart(cart);
    return JSON.stringify({
      kitchenId: normalized.kitchenId,
      items: normalized.items.map(function(item) {
        return {
          cartItemId: item.cartItemId,
          productId: item.productId,
          option: item.selectedOptionCode,
          quantity: item.quantity,
          addons: item.addons.map(function(addon) {
            return { addonId: addon.addonId, quantity: addon.quantity };
          })
        };
      })
    });
  }

  function getSelectedAddressId() {
    const keys = ['apnabite_selected_address', 'apnabite_selected_address_v1', 'SELECTED_ADDRESS', 'apnabite_location'];
    for (let index = 0; index < keys.length; index += 1) {
      const raw = window.localStorage.getItem(keys[index]);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const addressId = clean(parsed && (parsed.addressId || parsed.Address_ID));
        if (addressId) return addressId;
      } catch (error) {
        const addressId = clean(raw);
        if (addressId) return addressId;
      }
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
      clientUpdatedAt: cart.updatedAt,
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
      window.ApnaBiteAPI && typeof window.ApnaBiteAPI.request === 'function' &&
      window.ApnaBiteCore && typeof window.ApnaBiteCore.isAuthenticated === 'function' &&
      window.ApnaBiteCore.isAuthenticated() &&
      (!window.ApnaBiteCore.getCurrentRole || window.ApnaBiteCore.getCurrentRole() === 'CUSTOMER')
    );
  }

  async function getServerCart() {
    if (!canUseApi()) return emptyCart();
    const response = await window.ApnaBiteAPI.request('cart.get', { cartType: CONFIG.CART_TYPE }, {
      retry: false,
      deduplicate: true,
      timeoutMs: CONFIG.REQUEST_TIMEOUT_MS
    });
    return normalizeCart(response && response.data ? response.data : {});
  }

  async function performSync() {
    const cartAtStart = readLocalCart();
    if (!cartAtStart.items.length || !canUseApi()) return cartAtStart;
    const payload = buildSyncPayload(cartAtStart);
    const payloadJson = JSON.stringify(payload);
    if (payloadJson === state.lastSyncedJson) return cartAtStart;
    try {
      const response = await window.ApnaBiteAPI.request('cart.sync', payload, {
        retry: false,
        deduplicate: false,
        timeoutMs: CONFIG.REQUEST_TIMEOUT_MS
      });
      const serverCart = normalizeCart(response && response.data ? response.data : {});
      state.lastSyncedJson = payloadJson;
      state.lastError = null;
      const currentCart = readLocalCart();
      if (cartContentSignature(currentCart) === cartContentSignature(cartAtStart) && serverCart.cartId) {
        currentCart.cartId = serverCart.cartId;
        currentCart.updatedAt = serverCart.updatedAt || currentCart.updatedAt;
        writeLocalCart(currentCart);
      } else {
        state.pendingSync = true;
      }
      dispatchCartEvent('apnabite:cart-synced', serverCart);
      return serverCart;
    } catch (error) {
      state.lastError = error;
      console.warn('Cart background sync failed:', error);
      return null;
    }
  }

  function syncNow() {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = null;
    if (!canUseApi()) return Promise.resolve(readLocalCart());
    if (state.syncPromise) {
      state.pendingSync = true;
      return state.syncPromise;
    }
    state.pendingSync = false;
    state.syncPromise = performSync().finally(function() {
      state.syncPromise = null;
      if (state.pendingSync) {
        state.pendingSync = false;
        scheduleSync(150);
      }
    });
    return state.syncPromise;
  }

  function scheduleSync(delay) {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = window.setTimeout(syncNow, Number(delay) >= 0 ? Number(delay) : CONFIG.SYNC_DELAY_MS);
  }

  function restore(options) {
    const settings = options || {};
    if (!canUseApi()) return Promise.resolve(readLocalCart());
    if (state.restorePromise) return state.restorePromise;
    if (!settings.force && Date.now() - state.lastRestoreAt < CONFIG.RESTORE_COOLDOWN_MS) {
      return Promise.resolve(readLocalCart());
    }
    state.restorePromise = (async function() {
      const localCart = readLocalCart();
      try {
        const serverCart = await getServerCart();
        state.lastRestoreAt = Date.now();
        state.lastError = null;
        if (!localCart.items.length && serverCart.items.length) {
          state.lastSyncedJson = JSON.stringify(buildSyncPayload(serverCart));
          return writeLocalCart(serverCart, { restored: true });
        }
        if (localCart.items.length && !serverCart.items.length) {
          scheduleSync(0);
          return localCart;
        }
        if (localCart.items.length && serverCart.items.length) {
          const localTime = cartTimestamp(localCart);
          const serverTime = cartTimestamp(serverCart);
          if (serverTime > localTime) {
            state.lastSyncedJson = JSON.stringify(buildSyncPayload(serverCart));
            return writeLocalCart(serverCart, { restored: true });
          }
          if (cartContentSignature(localCart) !== cartContentSignature(serverCart)) scheduleSync(0);
        }
        return localCart;
      } catch (error) {
        state.lastError = error;
        console.warn('Server cart could not be restored:', error);
        return localCart;
      }
    })().finally(function() {
      state.restorePromise = null;
    });
    return state.restorePromise;
  }

  async function ensureSynced() {
    await initialize();
    if (state.syncTimer || state.pendingSync || !state.lastSyncedJson) await syncNow();
    if (state.syncPromise) await state.syncPromise;
    if (state.lastError) throw state.lastError;
    return readLocalCart();
  }

  async function clearServerCart() {
    window.clearTimeout(state.syncTimer);
    state.syncTimer = null;
    state.lastSyncedJson = '';
    state.pendingSync = false;
    window.localStorage.removeItem(CONFIG.STORAGE_KEY);
    dispatchCartEvent('apnabite:cart:changed', emptyCart());
    if (!canUseApi()) return emptyCart();
    try {
      const response = await window.ApnaBiteAPI.request('cart.clear', { cartType: CONFIG.CART_TYPE }, {
        retry: false,
        deduplicate: false,
        timeoutMs: CONFIG.REQUEST_TIMEOUT_MS
      });
      state.lastError = null;
      return normalizeCart(response && response.data ? response.data : {});
    } catch (error) {
      state.lastError = error;
      console.warn('Server cart could not be cleared:', error);
      throw error;
    }
  }

  function bindEvents() {
    if (state.eventsBound) return;
    state.eventsBound = true;
    document.addEventListener('apnabite:cart:changed', function() { scheduleSync(); });
    window.addEventListener('storage', function(event) {
      if (event.key === CONFIG.STORAGE_KEY) dispatchCartEvent('apnabite:cart-external-change', readLocalCart());
    });
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') restore();
      else if (readLocalCart().items.length) syncNow();
    });
    window.addEventListener('online', function() {
      if (readLocalCart().items.length) scheduleSync(0);
    });
  }

  function initialize() {
    if (state.initializePromise) return state.initializePromise;
    bindEvents();
    state.initializePromise = restore({ force: true }).then(function(cart) {
      state.initialized = true;
      return cart;
    }).catch(function(error) {
      state.initialized = true;
      state.lastError = error;
      return readLocalCart();
    });
    return state.initializePromise;
  }

  window.ApnaBiteCartSync = Object.freeze({
    initialize: initialize,
    restore: restore,
    scheduleSync: scheduleSync,
    syncNow: syncNow,
    ensureSynced: ensureSynced,
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
