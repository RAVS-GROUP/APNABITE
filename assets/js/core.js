/**
 * ============================================================
 * APNABITE V1 — FRONTEND CORE
 * File: assets/js/core.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const STORAGE_KEYS = Object.freeze({
    SESSION_TOKEN: 'apnabite_session_token',
    SESSION_USER: 'apnabite_session_user',
    DEVICE_ID: 'apnabite_device_id',
    CART: 'apnabite_cart',
    SELECTED_ADDRESS: 'apnabite_selected_address',
    LOCATION: 'apnabite_location',
    LANGUAGE: 'apnabite_language',
    CACHE_PREFIX: 'apnabite_cache_'
  });

  const ROLE_HOME_PAGES = Object.freeze({
    CUSTOMER: 'customer/home.html',
    CHEF: 'chef/dashboard.html',
    RIDER: 'rider/dashboard.html',
    ADMIN: 'admin/dashboard.html'
  });

  function ready(callback) {
    if (typeof callback !== 'function') return;

    if (document.readyState === 'loading') {
      document.addEventListener(
        'DOMContentLoaded',
        callback,
        { once: true }
      );
    } else {
      callback();
    }
  }

  function getAppRootUrl() {
    const scripts = Array.from(
      document.getElementsByTagName('script')
    );

    const coreScript = scripts.find(function(script) {
      return script.src &&
        script.src.indexOf(
          '/assets/js/core.js'
        ) !== -1;
    });

    if (coreScript) {
      return coreScript.src.split(
        '/assets/js/core.js'
      )[0] + '/';
    }

    const path = window.location.pathname;
    const roleFolders = [
      '/customer/',
      '/chef/',
      '/rider/',
      '/admin/'
    ];

    for (
      let index = 0;
      index < roleFolders.length;
      index++
    ) {
      const folder = roleFolders[index];
      const position = path.indexOf(folder);

      if (position !== -1) {
        return (
          window.location.origin +
          path.substring(0, position + 1)
        );
      }
    }

    return new URL(
      './',
      window.location.href
    ).href;
  }

  function getPageUrl(relativePath) {
    const cleanPath = String(
      relativePath || ''
    ).replace(/^\/+/, '');

    return new URL(
      cleanPath,
      getAppRootUrl()
    ).href;
  }

  function navigate(relativePath, replace) {
    const targetUrl = getPageUrl(
      relativePath
    );

    if (replace) {
      window.location.replace(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  }

  function getJsonStorage(key, fallbackValue) {
    try {
      const stored = localStorage.getItem(key);

      if (!stored) return fallbackValue;

      return JSON.parse(stored);
    } catch (error) {
      return fallbackValue;
    }
  }

  function setJsonStorage(key, value) {
    try {
      localStorage.setItem(
        key,
        JSON.stringify(value)
      );

      return true;
    } catch (error) {
      return false;
    }
  }

  function removeStorage(key) {
    localStorage.removeItem(key);
  }

  function getSessionToken() {
    return localStorage.getItem(
      STORAGE_KEYS.SESSION_TOKEN
    ) || '';
  }

  function getSessionUser() {
    return getJsonStorage(
      STORAGE_KEYS.SESSION_USER,
      null
    );
  }

  function saveSession(sessionData) {
    const session = sessionData || {};

    if (!session.sessionToken) {
      throw new Error(
        'Session token is missing.'
      );
    }

    localStorage.setItem(
      STORAGE_KEYS.SESSION_TOKEN,
      session.sessionToken
    );

    if (session.user) {
      setJsonStorage(
        STORAGE_KEYS.SESSION_USER,
        session.user
      );
    }

    dispatch('session:changed', {
      authenticated: true,
      user: session.user || null
    });

    return true;
  }

  function clearSession() {
    removeStorage(
      STORAGE_KEYS.SESSION_TOKEN
    );

    removeStorage(
      STORAGE_KEYS.SESSION_USER
    );

    dispatch('session:changed', {
      authenticated: false,
      user: null
    });
  }

  function isAuthenticated() {
    return Boolean(getSessionToken());
  }

  function getCurrentRole() {
    const user = getSessionUser();

    return user && user.role
      ? String(user.role).toUpperCase()
      : '';
  }

  function redirectToRoleHome(role, replace) {
    const normalizedRole = String(
      role || getCurrentRole()
    ).toUpperCase();

    const target =
      ROLE_HOME_PAGES[normalizedRole];

    if (!target) {
      navigate('login.html', true);
      return;
    }

    navigate(
      target,
      replace !== false
    );
  }

  function requireLocalSession(allowedRoles) {
    if (!isAuthenticated()) {
      navigate('login.html', true);
      return false;
    }

    if (
      allowedRoles &&
      allowedRoles.length
    ) {
      const role = getCurrentRole();

      const normalizedRoles =
        allowedRoles.map(function(item) {
          return String(item).toUpperCase();
        });

      if (
        normalizedRoles.indexOf(role) === -1
      ) {
        redirectToRoleHome(role, true);
        return false;
      }
    }

    return true;
  }

  function getCart() {
    return getJsonStorage(
      STORAGE_KEYS.CART,
      {
        kitchenId: '',
        items: [],
        updatedAt: ''
      }
    );
  }

  function saveCart(cart) {
    const value = cart || {
      kitchenId: '',
      items: []
    };

    value.updatedAt =
      new Date().toISOString();

    setJsonStorage(
      STORAGE_KEYS.CART,
      value
    );

    dispatch('cart:changed', value);

    return value;
  }

  function clearCart() {
    removeStorage(STORAGE_KEYS.CART);

    const emptyCart = {
      kitchenId: '',
      items: [],
      updatedAt:
        new Date().toISOString()
    };

    dispatch(
      'cart:changed',
      emptyCart
    );

    return emptyCart;
  }

  function getCartQuantity() {
    const cart = getCart();

    return (cart.items || []).reduce(
      function(total, item) {
        return total +
          Number(item.quantity || 0);
      },
      0
    );
  }

  function setCache(key, value, seconds) {
    const expiresAt =
      Date.now() +
      Number(seconds || 300) * 1000;

    return setJsonStorage(
      STORAGE_KEYS.CACHE_PREFIX + key,
      {
        value: value,
        expiresAt: expiresAt,
        cachedAt:
          new Date().toISOString()
      }
    );
  }

  function getCache(key) {
    const storageKey =
      STORAGE_KEYS.CACHE_PREFIX + key;

    const cached = getJsonStorage(
      storageKey,
      null
    );

    if (!cached) return null;

    if (
      !cached.expiresAt ||
      cached.expiresAt < Date.now()
    ) {
      removeStorage(storageKey);
      return null;
    }

    return cached.value;
  }

  function removeCache(key) {
    removeStorage(
      STORAGE_KEYS.CACHE_PREFIX + key
    );
  }

  function formatCurrency(value) {
    return new Intl.NumberFormat(
      'en-IN',
      {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }
    ).format(Number(value || 0));
  }

  function formatDateTime(value) {
    if (!value) return '';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'en-IN',
      {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata'
      }
    ).format(date);
  }

  function formatDistance(value) {
    const distance = Number(value || 0);

    if (distance < 1) {
      return Math.round(
        distance * 1000
      ) + ' m';
    }

    return distance.toFixed(1) + ' km';
  }

  function cleanText(value, maximumLength) {
    let text = String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).trim();

    if (
      maximumLength &&
      text.length > maximumLength
    ) {
      text = text.substring(
        0,
        maximumLength
      );
    }

    return text;
  }

  function escapeHtml(value) {
    const element =
      document.createElement('div');

    element.textContent = String(
      value === null ||
      value === undefined
        ? ''
        : value
    );

    return element.innerHTML;
  }

  function debounce(callback, delay) {
    let timeoutId;

    return function() {
      const context = this;
      const args = arguments;

      window.clearTimeout(timeoutId);

      timeoutId = window.setTimeout(
        function() {
          callback.apply(context, args);
        },
        Number(delay || 400)
      );
    };
  }

  function throttle(callback, delay) {
    let lastRun = 0;
    let timeoutId;

    return function() {
      const context = this;
      const args = arguments;
      const now = Date.now();
      const remaining =
        Number(delay || 500) -
        (now - lastRun);

      if (remaining <= 0) {
        window.clearTimeout(timeoutId);
        lastRun = now;
        callback.apply(context, args);
      } else {
        window.clearTimeout(timeoutId);

        timeoutId = window.setTimeout(
          function() {
            lastRun = Date.now();
            callback.apply(
              context,
              args
            );
          },
          remaining
        );
      }
    };
  }

  function dispatch(eventName, detail) {
    document.dispatchEvent(
      new CustomEvent(
        'apnabite:' + eventName,
        {
          detail: detail || {}
        }
      )
    );
  }

  function on(eventName, callback) {
    document.addEventListener(
      'apnabite:' + eventName,
      callback
    );
  }

  function isOnline() {
    return navigator.onLine;
  }

  function getQueryParameter(name) {
    return new URLSearchParams(
      window.location.search
    ).get(name);
  }

  function setupNetworkEvents() {
    window.addEventListener(
      'online',
      function() {
        dispatch('network:changed', {
          online: true
        });
      }
    );

    window.addEventListener(
      'offline',
      function() {
        dispatch('network:changed', {
          online: false
        });
      }
    );
  }

  setupNetworkEvents();

  window.ApnaBiteCore = Object.freeze({
    storageKeys: STORAGE_KEYS,
    roleHomePages: ROLE_HOME_PAGES,
    ready: ready,
    getAppRootUrl: getAppRootUrl,
    getPageUrl: getPageUrl,
    navigate: navigate,
    getJsonStorage: getJsonStorage,
    setJsonStorage: setJsonStorage,
    removeStorage: removeStorage,
    getSessionToken: getSessionToken,
    getSessionUser: getSessionUser,
    saveSession: saveSession,
    clearSession: clearSession,
    isAuthenticated: isAuthenticated,
    getCurrentRole: getCurrentRole,
    redirectToRoleHome:
      redirectToRoleHome,
    requireLocalSession:
      requireLocalSession,
    getCart: getCart,
    saveCart: saveCart,
    clearCart: clearCart,
    getCartQuantity:
      getCartQuantity,
    setCache: setCache,
    getCache: getCache,
    removeCache: removeCache,
    formatCurrency:
      formatCurrency,
    formatDateTime:
      formatDateTime,
    formatDistance:
      formatDistance,
    cleanText: cleanText,
    escapeHtml: escapeHtml,
    debounce: debounce,
    throttle: throttle,
    dispatch: dispatch,
    on: on,
    isOnline: isOnline,
    getQueryParameter:
      getQueryParameter
  });
})(window, document);
