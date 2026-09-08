/**
 * ============================================================
 * APNABITE V1 — CUSTOMER CART & CHECKOUT CONTROLLER
 * File: assets/js/customer/cart-checkout.js
 * Complete replacement
 * Requires: core.js, api.js, ui.js, customer/cart-sync.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CART_STORAGE_KEY = 'apnabite_cart_v1';
  const ORDER_SUBMIT_KEY = 'apnabite_order_submit_key';
  const PENDING_ORDER_KEY = 'apnabite_pending_order';
  const SELECTED_ADDRESS_KEYS = [
    'apnabite_selected_address',
    'apnabite_selected_address_v1',
    'SELECTED_ADDRESS'
  ];

  const state = {
    loading: false,
    quoteLoading: false,
    placingOrder: false,
    quoteTimer: null,
    user: null,
    cart: emptyCart_(),
    addresses: [],
    selectedAddress: null,
    quote: null,
    paymentMethod: 'ONLINE'
  };
  const elements = {};

  function emptyCart_() {
    return {
      version: 1,
      cartId: '',
      kitchenId: '',
      kitchenName: '',
      items: [],
      updatedAt: ''
    };
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.refreshButton = byId('customer-cart-refresh-button');
    elements.loading = byId('customer-cart-loading');
    elements.error = byId('customer-cart-error');
    elements.errorTitle = byId('customer-cart-error-title');
    elements.errorMessage = byId('customer-cart-error-message');
    elements.retryButton = byId('customer-cart-error-retry');
    elements.empty = byId('customer-cart-empty');
    elements.content = byId('customer-cart-content');
    elements.kitchenName = byId('customer-cart-kitchen-name');
    elements.addMore = byId('customer-cart-add-more');
    elements.itemSummary = byId('customer-cart-item-summary');
    elements.clearButton = byId('customer-cart-clear-button');
    elements.items = byId('customer-cart-items');
    elements.changeAddress = byId('customer-cart-change-address');
    elements.addressCard = byId('customer-cart-address-card');
    elements.addressLabel = byId('customer-cart-address-label');
    elements.addressDistance = byId('customer-cart-address-distance');
    elements.addressLine = byId('customer-cart-address-line');
    elements.addressReceiver = byId('customer-cart-address-receiver');
    elements.addressWarning = byId('customer-cart-address-warning');
    elements.offerButton = byId('customer-cart-offer-button');
    elements.offerTitle = byId('customer-cart-offer-title');
    elements.offerMessage = byId('customer-cart-offer-message');
    elements.paymentMethods = byId('customer-cart-payment-methods');
    elements.paymentOnline = byId('customer-cart-payment-online');
    elements.paymentCod = byId('customer-cart-payment-cod');
    elements.paymentCodOption = byId('customer-cart-payment-cod-option');
    elements.paymentCodMessage = byId('customer-cart-payment-cod-message');
    elements.itemTotal = byId('customer-cart-item-total');
    elements.deliveryFee = byId('customer-cart-delivery-fee');
    elements.platformFee = byId('customer-cart-platform-fee');
    elements.discountRow = byId('customer-cart-discount-row');
    elements.discount = byId('customer-cart-discount');
    elements.rewardRow = byId('customer-cart-reward-row');
    elements.rewardDiscount = byId('customer-cart-reward-discount');
    elements.finalTotal = byId('customer-cart-final-total');
    elements.minimumWarning = byId('customer-cart-minimum-warning');
    elements.freeDeliveryMessage = byId('customer-cart-free-delivery-message');
    elements.instructionInput = byId('customer-cart-instruction-input');
    elements.checkoutBar = byId('customer-cart-checkout-bar');
    elements.footerTotal = byId('customer-cart-footer-total');
    elements.continueButton = byId('customer-cart-continue-button');
  }

  function requiredElementsAvailable() {
    return [
      'refreshButton', 'loading', 'error', 'retryButton', 'empty', 'content',
      'items', 'clearButton', 'changeAddress', 'addressCard', 'paymentMethods',
      'paymentOnline', 'paymentCod', 'itemTotal', 'deliveryFee', 'platformFee',
      'finalTotal', 'checkoutBar', 'footerTotal', 'continueButton'
    ].every(function(name) {
      return Boolean(elements[name]);
    });
  }

  function cleanText(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return cleanText(value).toUpperCase().replace(/\s+/g, '_');
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function setHidden(element, hidden) {
    if (element) element.hidden = Boolean(hidden);
  }

  function setText(element, value) {
    if (element) {
      element.textContent = String(value === undefined || value === null ? '' : value);
    }
  }

  function formatCurrency(value) {
    return '₹' + numberValue(value, 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function getResponseData(response) {
    return response && response.data && typeof response.data === 'object'
      ? response.data
      : {};
  }

  function showToast(message, type) {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.showToast === 'function') {
      window.ApnaBiteUI.showToast(message, type || 'info');
      return;
    }
    console.log(message);
  }

  function handleApiError(error) {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.handleApiError === 'function') {
      window.ApnaBiteUI.handleApiError(error, { redirectToLogin: true });
      return;
    }
    showToast(cleanText(error && error.message) || 'Something went wrong.', 'error');
  }

  function normalizeCart(cart) {
    const input = cart && typeof cart === 'object' ? cart : {};
    return {
      version: 1,
      cartId: cleanText(input.cartId),
      kitchenId: cleanText(input.kitchenId),
      kitchenName: cleanText(input.kitchenName),
      items: Array.isArray(input.items)
        ? input.items.filter(function(item) {
          return item && cleanText(item.productId) && numberValue(item.quantity, 0) > 0;
        })
        : [],
      updatedAt: cleanText(input.updatedAt)
    };
  }

  function loadCart() {
    try {
      if (window.ApnaBiteCartSync && typeof window.ApnaBiteCartSync.getCart === 'function') {
        state.cart = normalizeCart(window.ApnaBiteCartSync.getCart());
        return;
      }
      state.cart = normalizeCart(JSON.parse(
        window.localStorage.getItem(CART_STORAGE_KEY) || 'null'
      ));
    } catch (error) {
      state.cart = emptyCart_();
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  function saveCart() {
    if (!state.cart.items.length) {
      state.cart = emptyCart_();
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      state.cart.updatedAt = new Date().toISOString();
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    }
    if (window.ApnaBiteCore && typeof window.ApnaBiteCore.dispatch === 'function') {
      window.ApnaBiteCore.dispatch('cart:changed', state.cart);
    }
    if (window.ApnaBiteCartSync && typeof window.ApnaBiteCartSync.scheduleSync === 'function') {
      window.ApnaBiteCartSync.scheduleSync();
    }
  }

  function calculateLocalSummary() {
    return state.cart.items.reduce(function(summary, item) {
      summary.quantity += Math.max(0, Math.floor(numberValue(item.quantity, 0)));
      summary.total += Math.max(0, numberValue(item.itemTotal, 0));
      return summary;
    }, { quantity: 0, total: 0 });
  }

  function recalculateCartItem(item) {
    item.productSubtotal = numberValue(item.unitPrice, 0) * numberValue(item.quantity, 0);
    item.addonTotal = (item.addons || []).reduce(function(total, addon) {
      addon.total = numberValue(addon.unitPrice, 0) * numberValue(addon.quantity, 0);
      return total + addon.total;
    }, 0);
    item.itemTotal = item.productSubtotal + item.addonTotal;
    return item;
  }

  function getVerifiedItem(cartItem) {
    if (!state.quote || !Array.isArray(state.quote.items)) return null;
    return state.quote.items.find(function(item) {
      return cleanText(item.productId) === cleanText(cartItem.productId) &&
        cleanText(item.selectedOptionCode || 'DEFAULT') ===
          cleanText(cartItem.selectedOptionCode || 'DEFAULT');
    }) || null;
  }

  function createCartItemElement(item) {
    const verifiedItem = getVerifiedItem(item);
    const foodType = normalize(verifiedItem && verifiedItem.foodType);
    const article = document.createElement('article');
    article.className = 'customer-cart-item';
    article.dataset.cartItemId = cleanText(item.cartItemId);
    article.innerHTML =
      '<div class="customer-cart-item__heading">' +
        '<span class="customer-cart-item__food-marker' +
          (foodType === 'NON_VEG' ? ' customer-cart-item__food-marker--non-veg' : '') +
          '" aria-hidden="true"></span>' +
        '<div><h3></h3><p></p></div>' +
        '<button class="customer-cart-item__remove" type="button" data-remove-item aria-label="Remove item">×</button>' +
      '</div>' +
      '<div class="customer-cart-item__addons" data-addon-list></div>' +
      '<div class="customer-cart-item__footer">' +
        '<div class="customer-cart-quantity">' +
          '<button type="button" data-item-minus aria-label="Decrease quantity">−</button>' +
          '<strong data-item-quantity></strong>' +
          '<button type="button" data-item-plus aria-label="Increase quantity">+</button>' +
        '</div>' +
        '<strong data-item-total></strong>' +
      '</div>';

    const optionLabel = normalize(item.quantityMode) === 'COUNT'
      ? (cleanText(item.unitLabel) || 'Piece')
      : cleanText(item.selectedOptionLabel);
    setText(article.querySelector('h3'), item.productName);
    setText(article.querySelector('.customer-cart-item__heading p'), optionLabel);
    setText(article.querySelector('[data-item-quantity]'), item.quantity);
    setText(article.querySelector('[data-item-total]'), formatCurrency(item.itemTotal));

    const addonList = article.querySelector('[data-addon-list]');
    const addons = Array.isArray(item.addons) ? item.addons : [];
    addonList.hidden = addons.length === 0;
    addons.forEach(function(addon) {
      const row = document.createElement('div');
      row.textContent = cleanText(addon.addonName) + ' × ' +
        numberValue(addon.quantity, 0) + ' · ' + formatCurrency(addon.total);
      addonList.appendChild(row);
    });

    const minimum = Math.max(1, Math.floor(numberValue(item.minimumQuantity, 1)));
    const maximum = Math.max(minimum, Math.floor(numberValue(
      item.maximumQuantity,
      item.availableQuantity || minimum
    )));
    article.querySelector('[data-item-minus]').disabled =
      numberValue(item.quantity, 0) <= minimum;
    article.querySelector('[data-item-plus]').disabled =
      numberValue(item.quantity, 0) >= maximum;
    return article;
  }

  function renderCartItems() {
    elements.items.innerHTML = '';
    state.cart.items.forEach(function(item) {
      elements.items.appendChild(createCartItemElement(item));
    });
    const summary = calculateLocalSummary();
    setText(elements.itemSummary, summary.quantity +
      (summary.quantity === 1 ? ' item in your cart' : ' items in your cart'));
    setText(elements.kitchenName, state.cart.kitchenName || 'Kitchen');
    if (elements.addMore) {
      elements.addMore.href = state.cart.kitchenId
        ? 'kitchen.html?kitchenId=' + encodeURIComponent(state.cart.kitchenId)
        : 'home.html';
    }
  }

  function showEmptyCart() {
    state.quote = null;
    setHidden(elements.loading, true);
    setHidden(elements.error, true);
    setHidden(elements.content, true);
    setHidden(elements.empty, false);
    setHidden(elements.checkoutBar, true);
  }

  function showCheckoutContent() {
    setHidden(elements.loading, true);
    setHidden(elements.error, true);
    setHidden(elements.empty, true);
    setHidden(elements.content, false);
    setHidden(elements.checkoutBar, false);
  }

  function showPageError(title, message) {
    setHidden(elements.loading, true);
    setHidden(elements.empty, true);
    setHidden(elements.content, true);
    setHidden(elements.checkoutBar, true);
    setHidden(elements.error, false);
    setText(elements.errorTitle, title || 'Cart could not be loaded');
    setText(elements.errorMessage, message || 'Please try again.');
  }

  function getAddressId() {
    return state.selectedAddress
      ? cleanText(state.selectedAddress.addressId || state.selectedAddress.Address_ID)
      : '';
  }

  function getCheckoutPayload() {
    return {
      kitchenId: state.cart.kitchenId,
      addressId: getAddressId(),
      items: state.cart.items.map(function(item) {
        return {
          productId: item.productId,
          selectedOptionCode: item.selectedOptionCode || 'DEFAULT',
          quantity: Math.max(1, Math.floor(numberValue(item.quantity, 1))),
          addons: (item.addons || []).map(function(addon) {
            return {
              addonId: addon.addonId,
              quantity: Math.max(0, Math.floor(numberValue(addon.quantity, 0)))
            };
          })
        };
      }),
      cookingInstructions: cleanText(elements.instructionInput && elements.instructionInput.value)
    };
  }

  function normalizeAddress(address) {
    const item = address && typeof address === 'object' ? address : {};
    return {
      addressId: cleanText(item.addressId || item.Address_ID),
      label: cleanText(
        item.label || item.addressLabel || item.Address_Label ||
        item.addressType || item.Address_Type
      ) || 'Delivery address',
      receiverName: cleanText(item.receiverName || item.Receiver_Name),
      receiverMobile: cleanText(item.receiverMobile || item.Receiver_Mobile),
      addressLine: cleanText(item.addressLine || [
        item.addressLine1 || item.Address_Line_1,
        item.addressLine2 || item.Address_Line_2,
        item.landmark || item.Landmark,
        item.area || item.Area,
        item.city || item.City,
        item.state || item.State,
        item.postalCode || item.Postal_Code
      ].filter(Boolean).join(', ')),
      latitude: numberValue(item.latitude || item.Latitude, 0),
      longitude: numberValue(item.longitude || item.Longitude, 0),
      isDefault: item.isDefault === true || item.Is_Default === true ||
        normalize(item.isDefault || item.Is_Default) === 'TRUE',
      isActive: item.isActive === undefined && item.Is_Active === undefined
        ? true
        : item.isActive === true || item.Is_Active === true ||
          normalize(item.isActive || item.Is_Active) === 'TRUE'
    };
  }

  function getStoredAddressId() {
    for (let index = 0; index < SELECTED_ADDRESS_KEYS.length; index += 1) {
      const value = window.localStorage.getItem(SELECTED_ADDRESS_KEYS[index]);
      if (!value) continue;
      try {
        const parsed = JSON.parse(value);
        const addressId = cleanText(parsed && (parsed.addressId || parsed.Address_ID));
        if (addressId) return addressId;
      } catch (error) {
        const addressId = cleanText(value);
        if (addressId) return addressId;
      }
    }
    return '';
  }

  function saveSelectedAddress(address) {
    if (!address) return;
    window.localStorage.setItem(SELECTED_ADDRESS_KEYS[0], JSON.stringify({
      addressId: address.addressId,
      label: address.label,
      addressLine: address.addressLine,
      latitude: address.latitude,
      longitude: address.longitude
    }));
    if (window.ApnaBiteCartSync && typeof window.ApnaBiteCartSync.scheduleSync === 'function') {
      window.ApnaBiteCartSync.scheduleSync(0);
    }
  }

  async function loadAddresses() {
    const response = await window.ApnaBiteAPI.request('address.list', {}, {
      retry: false,
      deduplicate: true,
      timeoutMs: 15000
    });
    const data = getResponseData(response);
    const records = Array.isArray(data)
      ? data
      : (Array.isArray(data.items) ? data.items :
        (Array.isArray(data.addresses) ? data.addresses : []));
    state.addresses = records.map(normalizeAddress).filter(function(address) {
      return address.addressId && address.isActive;
    });
    const storedAddressId = getStoredAddressId();
    state.selectedAddress = state.addresses.find(function(address) {
      return address.addressId === storedAddressId;
    }) || state.addresses.find(function(address) {
      return address.isDefault;
    }) || state.addresses[0] || null;
    if (state.selectedAddress) saveSelectedAddress(state.selectedAddress);
    renderAddress();
  }

  function renderAddress() {
    const address = state.selectedAddress;
    if (!address) {
      setText(elements.addressLabel, 'No delivery address selected');
      setText(elements.addressLine, 'Select or add a delivery address.');
      setText(elements.addressReceiver, '');
      setText(elements.addressDistance, '');
      setHidden(elements.addressWarning, false);
      return;
    }
    setText(elements.addressLabel, address.label);
    setText(elements.addressLine, address.addressLine || 'Address details unavailable.');
    setText(elements.addressReceiver, [address.receiverName, address.receiverMobile]
      .filter(Boolean).join(' · '));
    setHidden(elements.addressWarning, true);
  }

  function validateCustomerSession() {
    if (!window.ApnaBiteCore || !window.ApnaBiteAPI || !window.ApnaBiteCartSync) {
      throw new Error('Required application files did not load.');
    }
    if (typeof window.ApnaBiteCore.requireLocalSession === 'function' &&
      !window.ApnaBiteCore.requireLocalSession(['CUSTOMER'])) {
      return null;
    }
    state.user = typeof window.ApnaBiteCore.getSessionUser === 'function'
      ? window.ApnaBiteCore.getSessionUser()
      : null;
    return state.user || { role: 'CUSTOMER' };
  }

  function setQuoteLoading(loading) {
    state.quoteLoading = Boolean(loading);
    elements.refreshButton.disabled = state.quoteLoading || state.placingOrder;
    elements.continueButton.disabled = true;
    if (state.quoteLoading) {
      setText(elements.deliveryFee, 'Calculating…');
      setText(elements.footerTotal, '—');
    }
  }

  async function loadCheckoutQuote() {
    if (state.quoteLoading || state.placingOrder || !state.cart.items.length) return;
    if (!state.selectedAddress) {
      state.quote = null;
      setHidden(elements.addressWarning, false);
      elements.continueButton.disabled = true;
      return;
    }
    setQuoteLoading(true);
    try {
      const response = await window.ApnaBiteAPI.request(
        'checkout.quote',
        getCheckoutPayload(),
        { retry: false, deduplicate: false, timeoutMs: 20000 }
      );
      const quote = getResponseData(response);
      if (!quote || !quote.totals) {
        throw new Error('Checkout pricing was not returned.');
      }
      state.quote = quote;
      renderQuote();
      renderCartItems();
    } catch (error) {
      state.quote = null;
      elements.continueButton.disabled = true;
      setText(elements.deliveryFee, 'Unavailable');
      handleApiError(error);
    } finally {
      setQuoteLoading(false);
      if (state.quote) updateContinueButton();
    }
  }

  function scheduleQuote() {
    window.clearTimeout(state.quoteTimer);
    state.quoteTimer = window.setTimeout(function() {
      state.quoteTimer = null;
      loadCheckoutQuote();
    }, 350);
  }

  function renderQuote() {
    const quote = state.quote;
    if (!quote) return;
    const totals = quote.totals || {};
    const delivery = quote.delivery || {};
    const minimumOrder = quote.minimumOrder || {};
    const payment = quote.payment || {};
    const offers = quote.offers || {};
    const rewards = quote.rewards || {};
    setText(elements.itemTotal, formatCurrency(totals.itemTotal));
    setText(elements.deliveryFee,
      numberValue(totals.deliveryFee, 0) <= 0 ? 'FREE' : formatCurrency(totals.deliveryFee));
    setText(elements.platformFee, formatCurrency(totals.platformFee));
    const discountAmount = Math.max(0, numberValue(totals.discountAmount, 0));
    setHidden(elements.discountRow, discountAmount <= 0);
    setText(elements.discount, '− ' + formatCurrency(discountAmount));
    const rewardDiscount = Math.max(0, numberValue(totals.rewardDiscount, 0));
    setHidden(elements.rewardRow, rewardDiscount <= 0);
    setText(elements.rewardDiscount, '− ' + formatCurrency(rewardDiscount));
    setText(elements.finalTotal, formatCurrency(totals.finalPayable));
    setText(elements.footerTotal, formatCurrency(totals.finalPayable));
    setText(elements.addressDistance,
      quote.address && numberValue(quote.address.distanceKm, 0) > 0
        ? numberValue(quote.address.distanceKm, 0).toFixed(2) + ' km'
        : '');

    if (minimumOrder.reached === false) {
      setText(elements.minimumWarning,
        'Add ' + formatCurrency(minimumOrder.shortBy) + ' more to reach the minimum order value.');
      setHidden(elements.minimumWarning, false);
    } else {
      setHidden(elements.minimumWarning, true);
    }

    if (delivery.freeDeliveryApplied) {
      setText(elements.freeDeliveryMessage, 'Free delivery applied.');
      setHidden(elements.freeDeliveryMessage, false);
    } else if (numberValue(delivery.amountForFreeDelivery, 0) > 0) {
      setText(elements.freeDeliveryMessage,
        'Add ' + formatCurrency(delivery.amountForFreeDelivery) + ' more for free delivery.');
      setHidden(elements.freeDeliveryMessage, false);
    } else {
      setHidden(elements.freeDeliveryMessage, true);
    }

    if (offers.applied) {
      setText(elements.offerTitle, offers.title || 'Offer applied');
      setText(elements.offerMessage, 'You saved ' + formatCurrency(offers.discountAmount) + '.');
    } else {
      setText(elements.offerTitle, 'Check available offers');
      setText(elements.offerMessage,
        offers.message || 'Eligible savings will be applied automatically.');
    }

    const codMethod = Array.isArray(payment.methods)
      ? payment.methods.find(function(method) { return normalize(method.code) === 'COD'; })
      : null;
    const codAvailable = Boolean(codMethod && codMethod.available);
    elements.paymentCod.disabled = !codAvailable;
    if (elements.paymentCodOption) {
      elements.paymentCodOption.classList.toggle(
        'customer-cart-payment-option--disabled',
        !codAvailable
      );
    }
    setText(elements.paymentCodMessage,
      cleanText(codMethod && codMethod.message) ||
      (codAvailable
        ? 'Pay by ApnaBite QR or cash when your order is delivered.'
        : 'Cash on Delivery is unavailable.'));
    if (state.paymentMethod === 'COD' && !codAvailable) {
      state.paymentMethod = 'ONLINE';
      elements.paymentOnline.checked = true;
      elements.paymentCod.checked = false;
    }
    updateContinueButton();
  }

  function updateContinueButton() {
    const methods = state.quote && state.quote.payment &&
      Array.isArray(state.quote.payment.methods)
      ? state.quote.payment.methods
      : [];
    const selectedMethod = methods.find(function(method) {
      return normalize(method.code) === state.paymentMethod;
    });
    elements.continueButton.disabled = !Boolean(
      state.quote && state.quote.valid && state.selectedAddress && selectedMethod &&
      selectedMethod.available && !state.quoteLoading && !state.placingOrder
    );
  }

  function changeItemQuantity(cartItemId, difference) {
    if (state.placingOrder) return;
    const item = state.cart.items.find(function(cartItem) {
      return cleanText(cartItem.cartItemId) === cleanText(cartItemId);
    });
    if (!item) return;
    const minimum = Math.max(1, Math.floor(numberValue(item.minimumQuantity, 1)));
    const maximum = Math.max(minimum, Math.floor(numberValue(
      item.maximumQuantity,
      item.availableQuantity || minimum
    )));
    const nextQuantity = Math.min(maximum, Math.max(
      minimum,
      Math.floor(numberValue(item.quantity, minimum) + difference)
    ));
    if (nextQuantity === item.quantity) return;
    item.quantity = nextQuantity;
    recalculateCartItem(item);
    saveCart();
    state.quote = null;
    renderCartItems();
    updateLocalTotal();
    scheduleQuote();
  }

  function removeCartItem(cartItemId) {
    if (state.placingOrder) return;
    state.cart.items = state.cart.items.filter(function(item) {
      return cleanText(item.cartItemId) !== cleanText(cartItemId);
    });
    saveCart();
    if (!state.cart.items.length) {
      showEmptyCart();
      return;
    }
    state.quote = null;
    renderCartItems();
    updateLocalTotal();
    scheduleQuote();
  }

  function updateLocalTotal() {
    const summary = calculateLocalSummary();
    setText(elements.itemTotal, formatCurrency(summary.total));
    setText(elements.footerTotal, formatCurrency(summary.total));
    setText(elements.deliveryFee, 'Calculating…');
    elements.continueButton.disabled = true;
  }

  function handleItemsClick(event) {
    const article = event.target.closest('[data-cart-item-id]');
    if (!article) return;
    const cartItemId = article.dataset.cartItemId;
    if (event.target.closest('[data-item-minus]')) {
      changeItemQuantity(cartItemId, -1);
    } else if (event.target.closest('[data-item-plus]')) {
      changeItemQuantity(cartItemId, 1);
    } else if (event.target.closest('[data-remove-item]')) {
      removeCartItem(cartItemId);
    }
  }

  async function clearCart() {
    if (!state.cart.items.length || state.placingOrder) return;
    if (!window.confirm('Remove all items from your cart?')) return;
    state.cart = emptyCart_();
    window.localStorage.removeItem(CART_STORAGE_KEY);
    window.sessionStorage.removeItem(ORDER_SUBMIT_KEY);
    showEmptyCart();
    if (window.ApnaBiteCartSync && typeof window.ApnaBiteCartSync.clear === 'function') {
      try {
        await window.ApnaBiteCartSync.clear();
      } catch (error) {
        showToast('Cart cleared on this device. Server update will retry later.', 'warning');
        return;
      }
    }
    showToast('Cart cleared.', 'success');
  }

  function handlePaymentChange(event) {
    const input = event.target.closest('input[name="customer-payment-method"]');
    if (!input || input.disabled || state.placingOrder) return;
    state.paymentMethod = normalize(input.value);
    window.sessionStorage.removeItem(ORDER_SUBMIT_KEY);
    updateContinueButton();
  }

  function getOrderSubmitKey() {
    const fingerprint = [
      state.cart.cartId,
      state.cart.kitchenId,
      state.cart.updatedAt,
      getAddressId(),
      state.paymentMethod
    ].join('|');
    try {
      const stored = JSON.parse(window.sessionStorage.getItem(ORDER_SUBMIT_KEY) || 'null');
      if (stored && stored.fingerprint === fingerprint && stored.key) return stored.key;
    } catch (error) {}
    const key = 'WEB_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
    window.sessionStorage.setItem(ORDER_SUBMIT_KEY, JSON.stringify({
      fingerprint: fingerprint,
      key: key
    }));
    return key;
  }

  function wait(milliseconds) {
    return new Promise(function(resolve) {
      window.setTimeout(resolve, milliseconds);
    });
  }

  async function syncCartBeforeOrder() {
    if (!window.ApnaBiteCartSync || typeof window.ApnaBiteCartSync.syncNow !== 'function') {
      throw new Error('Cart sync file did not load.');
    }
    let result = await window.ApnaBiteCartSync.syncNow();
    if (!result) {
      await wait(400);
      result = await window.ApnaBiteCartSync.syncNow();
    }
    if (!result) {
      throw new Error('Cart could not be synced. Check your connection and try again.');
    }
    if (result.cartId) state.cart.cartId = cleanText(result.cartId);
    return result;
  }

  function setPlacingOrder(placing) {
    state.placingOrder = Boolean(placing);
    elements.refreshButton.disabled = state.placingOrder || state.quoteLoading;
    elements.clearButton.disabled = state.placingOrder;
    elements.paymentOnline.disabled = state.placingOrder;
    if (state.placingOrder) {
      elements.paymentCod.disabled = true;
      elements.continueButton.disabled = true;
      setText(elements.continueButton, 'PLACING ORDER…');
    } else {
      setText(elements.continueButton, 'CONTINUE');
      if (state.quote) renderQuote();
      else updateContinueButton();
    }
  }

  async function continueCheckout() {
    if (elements.continueButton.disabled || !state.quote || state.placingOrder) return;
    setPlacingOrder(true);
    try {
      await syncCartBeforeOrder();
      const response = await window.ApnaBiteAPI.request('order.create', {
        cartType: 'NORMAL',
        addressId: getAddressId(),
        paymentMethod: state.paymentMethod,
        cookingInstructions: cleanText(
          elements.instructionInput && elements.instructionInput.value
        ),
        idempotencyKey: getOrderSubmitKey()
      }, {
        retry: false,
        deduplicate: false,
        timeoutMs: 30000
      });
      const data = getResponseData(response);
      const order = data.order || {};
      const payment = data.payment || {};
      if (!cleanText(order.orderId)) {
        throw new Error('Order was not created. Please try again.');
      }

      window.sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        paymentId: payment.paymentId || '',
        paymentMethod: state.paymentMethod,
        finalPayable: order.finalPayable,
        createdAt: new Date().toISOString()
      }));
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.sessionStorage.removeItem(ORDER_SUBMIT_KEY);
      if (window.ApnaBiteCore && typeof window.ApnaBiteCore.dispatch === 'function') {
        window.ApnaBiteCore.dispatch('cart:changed', emptyCart_());
      }

      if (state.paymentMethod === 'ONLINE') {
        window.location.href = 'payment.html?orderId=' + encodeURIComponent(order.orderId) +
          '&paymentId=' + encodeURIComponent(payment.paymentId || '');
      } else {
        window.location.href = 'order-tracking.html?orderId=' +
          encodeURIComponent(order.orderId);
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      handleApiError(error);
      setPlacingOrder(false);
    }
  }

  function bindEvents() {
    elements.refreshButton.addEventListener('click', loadCheckout);
    elements.retryButton.addEventListener('click', loadCheckout);
    elements.items.addEventListener('click', handleItemsClick);
    elements.clearButton.addEventListener('click', clearCart);
    elements.changeAddress.addEventListener('click', function() {
      window.location.href = 'location.html?return=' + encodeURIComponent('cart-checkout.html');
    });
    elements.addressCard.addEventListener('click', function(event) {
      if (event.target.closest('button, a')) return;
      elements.changeAddress.click();
    });
    if (elements.offerButton) {
      elements.offerButton.addEventListener('click', function() {
        showToast(
          state.quote && state.quote.offers && state.quote.offers.message
            ? state.quote.offers.message
            : 'Eligible offers are applied automatically.',
          'info'
        );
      });
    }
    elements.paymentMethods.addEventListener('change', handlePaymentChange);
    elements.continueButton.addEventListener('click', continueCheckout);
    window.addEventListener('storage', function(event) {
      if (event.key !== CART_STORAGE_KEY || state.placingOrder) return;
      loadCart();
      if (!state.cart.items.length) {
        showEmptyCart();
        return;
      }
      state.quote = null;
      renderCartItems();
      updateLocalTotal();
      scheduleQuote();
    });
    window.addEventListener('pageshow', function(event) {
      if (!event.persisted || state.placingOrder) return;
      loadCheckout();
    });
    document.addEventListener('apnabite:cart-restored', function() {
      if (state.loading || state.placingOrder) return;
      loadCart();
      if (state.cart.items.length) renderCartItems();
    });
  }

  async function loadCheckout() {
    if (state.loading || state.placingOrder) return;
    state.loading = true;
    setHidden(elements.loading, false);
    setHidden(elements.error, true);
    setHidden(elements.empty, true);
    setHidden(elements.content, true);
    setHidden(elements.checkoutBar, true);
    try {
      if (!validateCustomerSession()) return;
      await window.ApnaBiteCartSync.restore();
      loadCart();
      if (!state.cart.items.length) {
        showEmptyCart();
        return;
      }
      renderCartItems();
      updateLocalTotal();
      showCheckoutContent();
      await loadAddresses();
      if (!state.selectedAddress) {
        setHidden(elements.addressWarning, false);
        elements.continueButton.disabled = true;
        showToast('Select a delivery address to continue.', 'info');
        return;
      }
      await loadCheckoutQuote();
    } catch (error) {
      showPageError(
        'Cart could not be loaded',
        cleanText(error && error.message) || 'Please check your connection and try again.'
      );
      handleApiError(error);
    } finally {
      state.loading = false;
    }
  }

  async function initialize() {
    if (!document.body.classList.contains('customer-cart-page')) return;
    collectElements();
    if (!requiredElementsAvailable()) {
      console.error('Customer checkout page elements are incomplete.');
      return;
    }
    bindEvents();
    await loadCheckout();
  }

  window.ApnaBiteCustomerCheckout = {
    refresh: loadCheckout,
    placeOrder: continueCheckout,
    getCart: function() {
      return JSON.parse(JSON.stringify(state.cart));
    },
    getQuote: function() {
      return state.quote ? JSON.parse(JSON.stringify(state.quote)) : null;
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else {
    initialize();
  }
})(window, document);
