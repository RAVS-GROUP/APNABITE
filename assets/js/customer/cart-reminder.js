/**
 * ============================================================
 * APNABITE V1 — GLOBAL CUSTOMER CART REMINDER
 * File: assets/js/customer/cart-reminder.js
 * Requires: core.js, ui.js, customer/cart-sync.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CONFIG = Object.freeze({
    CART_KEY: 'apnabite_cart_v1',
    REMINDER_KEY: 'apnabite_cart_last_reminder_at',
    REMINDER_INTERVAL_MS: 60 * 60 * 1000,
    CHECK_INTERVAL_MS: 60 * 1000,
    CHECKOUT_PAGE: 'cart-checkout.html'
  });

  const state = {
    initialized: false,
    timer: null,
    bar: null,
    count: null,
    total: null
  };

  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function readCart() {
    try {
      const cart = JSON.parse(localStorage.getItem(CONFIG.CART_KEY) || 'null');
      return cart && Array.isArray(cart.items) ? cart : { items: [] };
    } catch (error) {
      return { items: [] };
    }
  }

  function cartSummary(cart) {
    return (cart.items || []).reduce(function(summary, item) {
      summary.count += Math.max(0, Math.floor(numberValue(item.quantity, 0)));
      summary.total += Math.max(0, numberValue(item.itemTotal, 0));
      return summary;
    }, { count: 0, total: 0 });
  }

  function formatCurrency(value) {
    return '₹' + numberValue(value, 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function pageExcluded() {
    return document.body.classList.contains('customer-cart-page') ||
      /\/(cart-checkout|payment|order-tracking)\.html$/i.test(window.location.pathname);
  }

  function createBar() {
    if (pageExcluded() || document.getElementById('customer-kitchen-cart-bar')) return;
    const button = document.createElement('button');
    button.id = 'customer-global-cart-bar';
    button.className = 'customer-global-cart-bar';
    button.type = 'button';
    button.hidden = true;
    button.setAttribute('aria-label', 'View saved cart');
    button.innerHTML =
      '<span class="customer-global-cart-bar__count"><strong data-cart-count>0</strong> item(s)</span>' +
      '<span class="customer-global-cart-bar__total"><small>Total</small><strong data-cart-total>₹0</strong></span>' +
      '<span class="customer-global-cart-bar__action">VIEW CART <span aria-hidden="true">›</span></span>';
    button.addEventListener('click', function() {
      window.location.href = CONFIG.CHECKOUT_PAGE;
    });
    document.body.appendChild(button);
    state.bar = button;
    state.count = button.querySelector('[data-cart-count]');
    state.total = button.querySelector('[data-cart-total]');
  }

  function render() {
    if (!state.bar) return;
    const summary = cartSummary(readCart());
    state.count.textContent = String(summary.count);
    state.total.textContent = formatCurrency(summary.total);
    state.bar.hidden = summary.count <= 0;
    document.body.classList.toggle('customer-has-global-cart', summary.count > 0);
  }

  function showReminder(force) {
    const summary = cartSummary(readCart());
    if (summary.count <= 0 || document.visibilityState === 'hidden') return;
    const lastReminder = numberValue(localStorage.getItem(CONFIG.REMINDER_KEY), 0);
    if (!force && Date.now() - lastReminder < CONFIG.REMINDER_INTERVAL_MS) return;
    localStorage.setItem(CONFIG.REMINDER_KEY, String(Date.now()));
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.showToast === 'function') {
      window.ApnaBiteUI.showToast(
        summary.count + (summary.count === 1 ? ' item is' : ' items are') + ' waiting in your cart.',
        'info'
      );
    }
  }

  async function restoreAndRender() {
    if (window.ApnaBiteCartSync && typeof window.ApnaBiteCartSync.restore === 'function') {
      await window.ApnaBiteCartSync.restore();
    }
    render();
    showReminder(false);
  }

  function bindEvents() {
    document.addEventListener('apnabite:cart:changed', render);
    document.addEventListener('apnabite:cart-restored', render);
    document.addEventListener('apnabite:cart-synced', render);
    window.addEventListener('storage', function(event) {
      if (event.key === CONFIG.CART_KEY) render();
    });
    window.addEventListener('pageshow', restoreAndRender);
    window.addEventListener('online', restoreAndRender);
    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible') restoreAndRender();
    });
    state.timer = window.setInterval(function() {
      render();
      showReminder(false);
    }, CONFIG.CHECK_INTERVAL_MS);
  }

  async function initialize() {
    if (state.initialized || !document.body.classList.contains('customer-page')) return;
    state.initialized = true;
    createBar();
    bindEvents();
    await restoreAndRender();
  }

  window.ApnaBiteCartReminder = Object.freeze({
    refresh: restoreAndRender,
    render: render,
    remind: function() { showReminder(true); }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(window, document);
