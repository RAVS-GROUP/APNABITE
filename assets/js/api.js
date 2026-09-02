/**
 * ============================================================
 * APNABITE V1 — CENTRAL FRONTEND API CLIENT
 * File: assets/js/api.js
 * ============================================================
 */

(function(window) {
  'use strict';

  const CONFIG = Object.freeze({
    API_URL: 'https://script.google.com/macros/s/AKfycbw1-6SqduHiP0zK2KvQF2cirYas3nXTDM2yaRGuERD9cVd3L6W-AH5laoWT0xBpSg4v/exec',
    TIMEOUT_MS: 15000,
    RETRY_COUNT: 1,
    RETRY_DELAY_MS: 700,
    SESSION_KEY: 'apnabite_session_token',
    DEVICE_KEY: 'apnabite_device_id'
  });

  const pendingRequests = new Map();

  function waitForDelay(milliseconds) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  function createDeviceId() {
    if (
      window.crypto &&
      typeof window.crypto.randomUUID === 'function'
    ) {
      return window.crypto.randomUUID();
    }

    return [
      'device',
      Date.now(),
      Math.random().toString(36).slice(2, 12)
    ].join('_');
  }

  function getDeviceId() {
    let deviceId = localStorage.getItem(
      CONFIG.DEVICE_KEY
    );

    if (!deviceId) {
      deviceId = createDeviceId();

      localStorage.setItem(
        CONFIG.DEVICE_KEY,
        deviceId
      );
    }

    return deviceId;
  }

  function getSessionToken() {
    return localStorage.getItem(
      CONFIG.SESSION_KEY
    ) || '';
  }

  function setSessionToken(token) {
    if (!token) {
      clearSessionToken();
      return;
    }

    localStorage.setItem(
      CONFIG.SESSION_KEY,
      String(token)
    );
  }

  function clearSessionToken() {
    localStorage.removeItem(
      CONFIG.SESSION_KEY
    );
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

    if (
      !result ||
      typeof result.success !== 'boolean'
    ) {
      throw createApiError(
        'INVALID_SERVER_RESPONSE',
        'The server response is incomplete.'
      );
    }

    if (!result.success) {
      const apiError = createApiError(
        result.code || 'REQUEST_FAILED',
        result.message ||
          'Unable to complete the request.',
        result.data || null
      );

      apiError.requestId =
        result.requestId || '';

      throw apiError;
    }

    return result;
  }

  function shouldRetry(error, attempt, retryCount) {
    if (attempt >= retryCount) {
      return false;
    }

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
      CONFIG.TIMEOUT_MS;

    const retryCount =
      settings.retry === false
        ? 0
        : Number.isFinite(settings.retryCount)
          ? settings.retryCount
          : CONFIG.RETRY_COUNT;

    const sessionToken =
      settings.sessionToken !== undefined
        ? settings.sessionToken
        : getSessionToken();

    const body = {
      action: action,
      payload: requestPayload,
      sessionToken: sessionToken,
      context: {
        deviceId: getDeviceId(),
        userAgent: navigator.userAgent
      }
    };

    let attempt = 0;

    while (true) {
      const controller = new AbortController();

      const timeoutId = window.setTimeout(
        function() {
          controller.abort();
        },
        timeoutMs
      );

      try {
        const response = await fetch(
          CONFIG.API_URL,
          {
            method: 'POST',
            redirect: 'follow',
            credentials: 'omit',
            headers: {
              'Content-Type':
                'text/plain;charset=utf-8'
            },
            body: JSON.stringify(body),
            signal: controller.signal
          }
        );

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

        await waitForDelay(
          CONFIG.RETRY_DELAY_MS * attempt
        );
      }
    }
  }

  function createRequestKey(action, payload) {
    return action + '|' +
      JSON.stringify(payload || {});
  }

  function request(action, payload, options) {
    const settings = options || {};

    const requestKey = createRequestKey(
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
    ).finally(function() {
      pendingRequests.delete(requestKey);
    });

    pendingRequests.set(
      requestKey,
      requestPromise
    );

    return requestPromise;
  }

  function health() {
    return request(
      'health',
      {},
      {
        retry: true,
        deduplicate: true
      }
    );
  }

  function getPublicConfig() {
    return request(
      'config',
      {},
      {
        retry: true,
        deduplicate: true
      }
    );
  }

  function requestOtp(data) {
    return request(
      'auth.requestOtp',
      data,
      {
        retry: false,
        deduplicate: false
      }
    );
  }

  function verifyOtp(data) {
    return request(
      'auth.verifyOtp',
      data,
      {
        retry: false,
        deduplicate: false
      }
    );
  }

  function register(data) {
    return request(
      'auth.register',
      data,
      {
        retry: false,
        deduplicate: false
      }
    );
  }

  function login(data) {
    return request(
      'auth.login',
      data,
      {
        retry: false,
        deduplicate: false
      }
    );
  }

  function validateSession() {
    return request(
      'auth.session',
      {},
      {
        retry: false
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
    config: CONFIG,
    request: request,
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
