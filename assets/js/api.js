/**
 * ============================================================
 * APNABITE V1 — CENTRAL FRONTEND API CLIENT
 * File: assets/js/api.js
 * Complete replacement — security and performance update
 * ============================================================
 */

(function(window) {
  'use strict';

  const CONFIG = Object.freeze({
    API_URL: 'https://script.google.com/macros/s/AKfycbw1-6SqduHiP0zK2KvQF2cirYas3nXTDM2yaRGuERD9cVd3L6W-AH5laoWT0xBpSg4v/exec',
    TIMEOUT_MS: 15000,
    RETRY_COUNT: 1,
    RETRY_DELAY_MS: 450,
    SESSION_KEY: 'apnabite_session_token',
    DEVICE_KEY: 'apnabite_device_id'
  });

  const SAFE_RETRY_ACTIONS = Object.freeze([
    'health',
    'config',
    'auth.session',
    'address.list',
    'location.search',
    'location.reverse',
    'discovery.nearbyKitchens',
    'customer.kitchen.menu',
    'checkout.quote',
    'cart.get',
    'payment.get',
    'order.get',
    'order.list',
    'rider.cash.summary',
    'rider.cash.locations'
  ]);

  const pendingRequests = new Map();
  const responseCache = new Map();
  let sessionVersion = 0;

  function waitForDelay(milliseconds) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function createDeviceId() {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }
    return ['device', Date.now(), Math.random().toString(36).slice(2, 12)].join('_');
  }

  function getDeviceId() {
    let deviceId = window.localStorage.getItem(CONFIG.DEVICE_KEY);
    if (!deviceId) {
      deviceId = createDeviceId();
      window.localStorage.setItem(CONFIG.DEVICE_KEY, deviceId);
    }
    return deviceId;
  }

  function getSessionToken() {
    return window.localStorage.getItem(CONFIG.SESSION_KEY) || '';
  }

  function resetSessionRequests() {
    sessionVersion += 1;
    pendingRequests.clear();
    responseCache.clear();
  }

  function setSessionToken(token) {
    const nextToken = String(token || '');
    if (!nextToken) {
      clearSessionToken();
      return;
    }
    if (nextToken !== getSessionToken()) resetSessionRequests();
    window.localStorage.setItem(CONFIG.SESSION_KEY, nextToken);
  }

  function clearSessionToken() {
    window.localStorage.removeItem(CONFIG.SESSION_KEY);
    resetSessionRequests();
  }

  function createApiError(code, message, data) {
    const error = new Error(message || 'Something went wrong.');
    error.name = 'ApnaBiteApiError';
    error.code = code || 'REQUEST_FAILED';
    error.data = data || null;
    return error;
  }

  async function parseResponse(response) {
    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (error) {
      throw createApiError('INVALID_SERVER_RESPONSE', 'The server returned an invalid response.');
    }
    if (!result || typeof result.success !== 'boolean') {
      throw createApiError('INVALID_SERVER_RESPONSE', 'The server response is incomplete.');
    }
    if (!result.success) {
      const apiError = createApiError(
        result.code || 'REQUEST_FAILED',
        result.message || 'Unable to complete the request.',
        result.data || null
      );
      apiError.requestId = result.requestId || '';
      throw apiError;
    }
    return result;
  }

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    return '{' + Object.keys(value).sort().map(function(key) {
      return JSON.stringify(key) + ':' + stableStringify(value[key]);
    }).join(',') + '}';
  }

  function tokenFingerprint(token) {
    let hash = 0;
    const text = String(token || 'PUBLIC');
    for (let index = 0; index < text.length; index += 1) {
      hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
    }
    return String(hash);
  }

  function createRequestKey(action, payload, sessionToken) {
    return [action, tokenFingerprint(sessionToken), stableStringify(payload || {})].join('|');
  }

  function isSafeToRetry(action) {
    return SAFE_RETRY_ACTIONS.indexOf(action) !== -1;
  }

  function shouldRetry(action, error, attempt, retryCount) {
    if (!isSafeToRetry(action) || attempt >= retryCount) return false;
    return ['REQUEST_TIMEOUT', 'NETWORK_ERROR', 'INVALID_SERVER_RESPONSE'].indexOf(error.code) !== -1;
  }

  async function sendRequest(action, payload, options) {
    const settings = options || {};
    const requestPayload = payload || {};
    const timeoutMs = Math.max(3000, Number(settings.timeoutMs) || CONFIG.TIMEOUT_MS);
    const retryCount = settings.retry === false
      ? 0
      : (Number.isFinite(settings.retryCount)
        ? Math.max(0, settings.retryCount)
        : (isSafeToRetry(action) ? CONFIG.RETRY_COUNT : 0));
    const sessionToken = settings.sessionToken !== undefined
      ? String(settings.sessionToken || '')
      : getSessionToken();
    const requestSessionVersion = sessionVersion;
    const body = {
      action: action,
      payload: requestPayload,
      sessionToken: sessionToken,
      context: {
        deviceId: getDeviceId(),
        userAgent: window.navigator.userAgent
      }
    };
    let attempt = 0;

    while (true) {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(function() {
        controller.abort();
      }, timeoutMs);
      try {
        const response = await window.fetch(CONFIG.API_URL, {
          method: 'POST',
          redirect: 'follow',
          credentials: 'omit',
          cache: 'no-store',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        window.clearTimeout(timeoutId);
        if (!response.ok) {
          throw createApiError('HTTP_ERROR', 'Server connection failed.');
        }
        const result = await parseResponse(response);
        if (requestSessionVersion !== sessionVersion) {
          throw createApiError('SESSION_CHANGED', 'Your session changed. Please try again.');
        }
        return result;
      } catch (error) {
        window.clearTimeout(timeoutId);
        let normalizedError = error;
        if (error.name === 'AbortError') {
          normalizedError = createApiError('REQUEST_TIMEOUT', 'The request took too long. Please try again.');
        } else if (error.name !== 'ApnaBiteApiError') {
          normalizedError = createApiError(
            'NETWORK_ERROR',
            window.navigator.onLine ? 'Unable to connect to ApnaBite.' : 'You appear to be offline.'
          );
        }
        if (!shouldRetry(action, normalizedError, attempt, retryCount)) throw normalizedError;
        attempt += 1;
        await waitForDelay(CONFIG.RETRY_DELAY_MS * attempt);
      }
    }
  }

  function request(action, payload, options) {
    const settings = options || {};
    const sessionToken = settings.sessionToken !== undefined
      ? String(settings.sessionToken || '')
      : getSessionToken();
    const requestKey = createRequestKey(action, payload, sessionToken);
    if (settings.deduplicate !== false && pendingRequests.has(requestKey)) {
      return pendingRequests.get(requestKey);
    }
    const requestPromise = sendRequest(action, payload, settings).finally(function() {
      if (pendingRequests.get(requestKey) === requestPromise) pendingRequests.delete(requestKey);
    });
    pendingRequests.set(requestKey, requestPromise);
    return requestPromise;
  }

  function requestCached(action, payload, options) {
    const settings = options || {};
    const cacheMs = Math.max(0, Number(settings.cacheMs) || 0);
    const sessionToken = settings.sessionToken !== undefined
      ? String(settings.sessionToken || '')
      : getSessionToken();
    const key = createRequestKey(action, payload, sessionToken);
    const cached = responseCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.value);
    return request(action, payload, settings).then(function(result) {
      if (cacheMs > 0) responseCache.set(key, { value: result, expiresAt: Date.now() + cacheMs });
      return result;
    });
  }

  function invalidate(actionPrefix) {
    const prefix = String(actionPrefix || '');
    Array.from(responseCache.keys()).forEach(function(key) {
      if (!prefix || key.indexOf(prefix + '|') === 0) responseCache.delete(key);
    });
  }

  function health() {
    return requestCached('health', {}, { retry: true, deduplicate: true, cacheMs: 30000 });
  }

  function getPublicConfig() {
    return requestCached('config', {}, { retry: true, deduplicate: true, cacheMs: 300000 });
  }

  function requestOtp(data) {
    return request('auth.requestOtp', data, { retry: false, deduplicate: false });
  }

  function verifyOtp(data) {
    return request('auth.verifyOtp', data, { retry: false, deduplicate: false });
  }

  function register(data) {
    return request('auth.register', data, { retry: false, deduplicate: false });
  }

  function login(data) {
    return request('auth.login', data, { retry: false, deduplicate: false });
  }

  function validateSession() {
    return request('auth.session', {}, { retry: false, deduplicate: true });
  }

  async function logout() {
    try {
      return await request('auth.logout', {}, { retry: false, deduplicate: false });
    } finally {
      clearSessionToken();
    }
  }

  window.ApnaBiteAPI = Object.freeze({
    config: CONFIG,
    request: request,
    requestCached: requestCached,
    invalidate: invalidate,
    health: health,
    getPublicConfig: getPublicConfig,
    requestOtp: requestOtp,
    verifyOtp: verifyOtp,
    register: register,
    login: login,
    validateSession: validateSession,
    logout: logout,
    getSessionToken: getSessionToken,
    setSessionToken: setSessionToken,
    clearSessionToken: clearSessionToken,
    getDeviceId: getDeviceId
  });
})(window);
