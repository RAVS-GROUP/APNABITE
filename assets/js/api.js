/**
 * ============================================================
 * APNABITE V1 — CENTRAL FRONTEND API CLIENT
 * File: assets/js/api.js
 * ============================================================
 */

(function(window) {
  'use strict';

  const API_CONFIG = Object.freeze({
    URL: 'https://script.google.com/macros/s/AKfycbw1-6SqduHiP0zK2KvQF2cirYas3nXTDM2yaRGuERD9cVd3L6Wpolis-AH5laoWT0xBpSg4v/exec',
    TIMEOUT_MS: 15000,
    RETRY_COUNT: 1,
    RETRY_DELAY_MS: 700,
    SESSION_KEY: 'apnabite_session_token',
    DEVICE_KEY: 'apnabite_device_id'
  });

  const pendingRequests = new Map();

  function getWait(ms) {
    return new Promise(resolve => {
      window.setTimeout(resolve, ms);
    });
  }

  function createDeviceId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }

    return (
      'device_' +
      Date.now() +
      '_' +
      Math.random().toString(36).slice(2, 12)
    );
  }

  function getDeviceId() {
    let deviceId = localStorage.getItem(
      API_CONFIG.DEVICE_KEY
    );

    if (!deviceId) {
      deviceId = createDeviceId();

      localStorage.setItem(
        API_CONFIG.DEVICE_KEY,
        deviceId
      );
    }

    return deviceId;
  }

  function getSessionToken() {
    return localStorage.getItem(
      API_CONFIG.SESSION_KEY
    ) || '';
  }

  function setSessionToken(token) {
    if (!token) {
      clearSessionToken();
      return;
    }

    localStorage.setItem(
      API_CONFIG.SESSION_KEY,
      String(token)
    );
  }

  function clearSessionToken() {
    localStorage.removeItem(
      API_CONFIG.SESSION_KEY
    );
  }

  function buildRequestKey(action, payload) {
    return action + '|' + JSON.stringify(payload || {});
  }

  async function parseResponse(response) {
    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch (error) {
      throw createApiError(
        'INVALID_SERVER_RESPONSE',
        'The server returned an invalid response.'
      );
    }

    if (!result || typeof result.success !== 'boolean') {
      throw createApiError(
        'INVALID_SERVER_RESPONSE',
        'The server response is incomplete.'
      );
    }

    if (!result.success) {
      const error = createApiError(
        result.code || 'REQUEST_FAILED',
        result.message ||
          'Unable to complete the request.',
        result.data || null
      );

      error.requestId = result.requestId || '';
      throw error;
    }

    return result;
  }

  function createApiError(code, message, data) {
    const error = new Error(
      message || 'Something went wrong.'
    );

    error.name = 'ApnaBiteApiError';
    error.code = code || 'REQUEST_FAILED';
    error.data = data || null;

    return error;
  }

  function shouldRetry(error, attempt, retryCount) {
    if (attempt >= retryCount) return false;

    return [
      'REQUEST_TIMEOUT',
      'NETWORK_ERROR',
      'INVALID_SERVER_RESPONSE'
    ].includes(error.code);
  }

  async function sendRequest(action, payload, options) {
    const settings = options || {};
    const requestPayload = payload || {};

    const timeoutMs =
      Number(settings.timeoutMs) ||
      API_CONFIG.TIMEOUT_MS;

    const retryCount =
      settings.retry === false
        ? 0
        : Number.isFinite(settings.retryCount)
          ? settings.retryCount
          : API_CONFIG.RETRY_COUNT;

    const sessionToken =
      settings.sessionToken !== undefined
        ? settings.sessionToken
        : getSessionToken();

    const body = {
      action,
      payload: requestPayload,
      sessionToken,
      context: {
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent
      }
    };

    let attempt = 0;

    while (true) {
      const controller = new AbortController();

      const timeoutId = window.setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      try {
        const response = await fetch(API_CONFIG.URL, {
          method: 'POST',
          redirect: 'follow',
          credentials: 'omit',
          headers: {
            'Content-Type':
              'text/plain;charset=utf-8'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });

        window.clearTimeout(timeoutId);

        if (!response.ok) {
          throw createApiError(
            'HTTP_ERROR',
            'Server connection failed.'
          );
        }

        return await parseResponse(response);
      } catch (error) {
        window.clearTimeout(timeoutId);

        let normalizedError = error;

        if (error.name === 'AbortError') {
          normalizedError = createApiError(
            'REQUEST_TIMEOUT',
            'The request took too long. Please try again.'
          );
        } else if (
          error.name !== 'ApnaBiteApiError'
        ) {
          normalizedError = createApiError(
            'NETWORK_ERROR',
            navigator.onLine
              ? 'Unable to connect to ApnaBite.'
              : 'You appear to be offline.'
          );
        }

        if (
          !shouldRetry(
            normalizedError,
            attempt,
            retryCount
          )
        ) {
          throw normalizedError;
        }

        attempt += 1;

        await wait(
          API_CONFIG.RETRY_DELAY_MS * attempt
        );
      }
    }
  }

  function request(action, payload, options) {
    const settings = options || {};
    const requestKey = buildRequestKey(
      action,
      payload
    );

    if (
      settings.deduplicate !== false &&
      pendingRequests.has(requestKey)
    ) {
      return pendingRequests.get(requestKey);
    }

    const requestPromise = sendRequest(
      action,
      payload,
      settings
    ).finally(() => {
      pendingRequests.delete(requestKey);
    });

    pendingRequests.set(
      requestKey,
      requestPromise
    );

    return requestPromise;
  }

  async function health() {
    return request(
      'health',
      {},
      {
        retry: true,
        deduplicate: true
      }
    );
  }

  async function getPublicConfig() {
    return request(
      'config',
      {},
      {
        retry: true,
        deduplicate: true
      }
    );
  }

  async function logout() {
    try {
      return await request(
        'auth.logout',
        {},
        {
          retry: false,
          deduplicate: false
        }
      );
    } finally {
      clearSessionToken();
    }
  }

  window.ApnaBiteAPI = Object.freeze({
    config: API_CONFIG,
    request,
    health,
    getPublicConfig,
    getSessionToken,
    setSessionToken,
    clearSessionToken,
    getDeviceId,
    logout
  });
})(window);
