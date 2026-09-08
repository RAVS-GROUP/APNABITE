/**
 * ============================================================
 * APNABITE V1 — CUSTOMER KITCHEN MENU CONTROLLER
 * File: assets/js/customer/kitchen.js
 * Complete replacement
 * Requires: core.js, api.js, ui.js, customer/cart-sync.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CART_STORAGE_KEY = 'apnabite_cart_v1';
  const state = {
    loading: false,
    kitchenId: '',
    kitchen: null,
    products: [],
    orderingAllowed: false,
    orderingReason: '',
    category: 'ALL',
    search: '',
    selectedProduct: null,
    selectedOption: null,
    productQuantity: 1,
    addonQuantities: {},
    cart: emptyCart()
  };
  const elements = {};

  function emptyCart() {
    return { version: 1, cartId: '', kitchenId: '', kitchenName: '', items: [], updatedAt: '' };
  }
  function byId(id) { return document.getElementById(id); }
  function clean(value) { return String(value == null ? '' : value).replace(/\s+/g, ' ').trim(); }
  function normalize(value) { return clean(value).toUpperCase().replace(/\s+/g, '_'); }
  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }
  function setHidden(element, hidden) { if (element) element.hidden = Boolean(hidden); }
  function setText(element, value) { if (element) element.textContent = String(value == null ? '' : value); }
  function currency(value) {
    return '₹' + numberValue(value, 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0, maximumFractionDigits: 2
    });
  }
  function humanize(value) {
    return normalize(value).toLowerCase().replace(/_/g, ' ')
      .replace(/\b\w/g, function(letter) { return letter.toUpperCase(); });
  }
  function toast(message, type) {
    if (window.ApnaBiteUI && typeof window.ApnaBiteUI.showToast === 'function') {
      window.ApnaBiteUI.showToast(message, type || 'info');
    }
  }
  function responseData(response) {
    return response && response.data && typeof response.data === 'object' ? response.data : {};
  }

  function collectElements() {
    const ids = {
      refresh: 'customer-kitchen-refresh-button', headerName: 'customer-kitchen-header-name',
      loading: 'customer-kitchen-loading', error: 'customer-kitchen-error',
      errorTitle: 'customer-kitchen-error-title', errorMessage: 'customer-kitchen-error-message',
      retry: 'customer-kitchen-retry-button', content: 'customer-kitchen-content',
      kitchenImage: 'customer-kitchen-image', kitchenStatus: 'customer-kitchen-status',
      kitchenFoodType: 'customer-kitchen-food-type', kitchenName: 'customer-kitchen-name',
      kitchenRating: 'customer-kitchen-rating', kitchenRatingCount: 'customer-kitchen-rating-count',
      kitchenDescription: 'customer-kitchen-description', kitchenPreparation: 'customer-kitchen-preparation',
      kitchenMinimumOrder: 'customer-kitchen-minimum-order', kitchenProductCount: 'customer-kitchen-product-count',
      closedNote: 'customer-kitchen-closed-note', orderingReason: 'customer-kitchen-ordering-reason',
      search: 'customer-kitchen-search-input', categories: 'customer-kitchen-categories',
      empty: 'customer-kitchen-empty', products: 'customer-kitchen-products',
      cartBar: 'customer-kitchen-cart-bar', cartCount: 'customer-kitchen-cart-count',
      cartTotal: 'customer-kitchen-cart-total', modal: 'customer-product-modal',
      modalClose: 'customer-product-modal-close', modalImage: 'customer-product-modal-image',
      modalFoodType: 'customer-product-modal-food-type', modalName: 'customer-product-modal-name',
      modalPrice: 'customer-product-modal-price', modalDescription: 'customer-product-modal-description',
      optionSection: 'customer-product-option-section', optionTitle: 'customer-product-option-title',
      options: 'customer-product-options', optionError: 'customer-product-option-error',
      addonSection: 'customer-product-addon-section', addons: 'customer-product-addons',
      quantityHelp: 'customer-product-quantity-help', quantityMinus: 'customer-product-quantity-minus',
      quantityValue: 'customer-product-quantity', quantityPlus: 'customer-product-quantity-plus',
      addButton: 'customer-product-add-button'
    };
    Object.keys(ids).forEach(function(key) { elements[key] = byId(ids[key]); });
  }

  function requiredElementsAvailable() {
    return ['refresh', 'loading', 'error', 'retry', 'content', 'search', 'categories',
      'empty', 'products', 'cartBar', 'cartCount', 'cartTotal', 'modal', 'modalClose',
      'options', 'addons', 'quantityMinus', 'quantityValue', 'quantityPlus', 'addButton']
      .every(function(key) { return Boolean(elements[key]); });
  }

  function showPageError(title, message) {
    setHidden(elements.loading, true);
    setHidden(elements.content, true);
    setHidden(elements.error, false);
    setText(elements.errorTitle, title || 'Kitchen could not be loaded');
    setText(elements.errorMessage, message || 'Please try again.');
  }

  function loadCart() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || 'null');
      if (!parsed || !Array.isArray(parsed.items)) return state.cart = emptyCart();
      state.cart = {
        version: 1,
        cartId: clean(parsed.cartId),
        kitchenId: clean(parsed.kitchenId),
        kitchenName: clean(parsed.kitchenName),
        items: parsed.items.filter(function(item) {
          return item && clean(item.productId) && numberValue(item.quantity, 0) > 0;
        }),
        updatedAt: clean(parsed.updatedAt)
      };
    } catch (error) {
      state.cart = emptyCart();
    }
    return state.cart;
  }

  function saveCart() {
    state.cart.updatedAt = new Date().toISOString();
    if (state.cart.items.length) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
    }
    if (window.ApnaBiteCore && typeof window.ApnaBiteCore.dispatch === 'function') {
      window.ApnaBiteCore.dispatch('cart:changed', state.cart);
    }
    if (window.ApnaBiteCartSync && typeof window.ApnaBiteCartSync.scheduleSync === 'function') {
      window.ApnaBiteCartSync.scheduleSync();
    }
    renderCartBar();
  }

  function cartSummary() {
    return state.cart.items.reduce(function(summary, item) {
      summary.count += Math.max(0, Math.floor(numberValue(item.quantity, 0)));
      summary.total += Math.max(0, numberValue(item.itemTotal, 0));
      return summary;
    }, { count: 0, total: 0 });
  }
  function productCartQuantity(productId) {
    return state.cart.items.reduce(function(total, item) {
      return clean(item.productId) === clean(productId)
        ? total + Math.max(0, Math.floor(numberValue(item.quantity, 0))) : total;
    }, 0);
  }
  function renderCartBar() {
    const summary = cartSummary();
    setText(elements.cartCount, summary.count);
    setText(elements.cartTotal, currency(summary.total));
    setHidden(elements.cartBar, summary.count <= 0);
  }

  function renderKitchen() {
    const kitchen = state.kitchen;
    if (!kitchen) return;
    setText(elements.headerName, kitchen.kitchenName);
    setText(elements.kitchenName, kitchen.kitchenName);
    setText(elements.kitchenFoodType, humanize(kitchen.foodType));
    setText(elements.kitchenDescription, clean(kitchen.description) || 'Fresh homemade food.');
    setText(elements.kitchenPreparation, Math.max(0, Math.floor(numberValue(kitchen.averagePreparationMinutes, 0))) + ' min');
    setText(elements.kitchenMinimumOrder, currency(kitchen.minimumOrderValue));
    setText(elements.kitchenProductCount, state.products.length);
    if (elements.kitchenImage) {
      elements.kitchenImage.src = clean(kitchen.thumbnailUrl) || '../assets/images/logo.png';
      elements.kitchenImage.alt = clean(kitchen.kitchenName) || 'Kitchen';
      elements.kitchenImage.onerror = function() { this.onerror = null; this.src = '../assets/images/logo.png'; };
    }
    const ratingCount = Math.max(0, Math.floor(numberValue(kitchen.ratingCount, 0)));
    setText(elements.kitchenRating, ratingCount ? '★ ' + numberValue(kitchen.averageRating, 0).toFixed(1) : 'New');
    setText(elements.kitchenRatingCount, ratingCount ? ratingCount + (ratingCount === 1 ? ' rating' : ' ratings') : 'No ratings');
    if (elements.kitchenStatus) {
      elements.kitchenStatus.classList.remove('customer-kitchen-status--open', 'customer-kitchen-status--closed');
      elements.kitchenStatus.classList.add(state.orderingAllowed ? 'customer-kitchen-status--open' : 'customer-kitchen-status--closed');
      setText(elements.kitchenStatus, state.orderingAllowed ? 'OPEN' : 'CLOSED');
    }
    setText(elements.orderingReason, state.orderingReason || 'This Kitchen is currently unavailable.');
    setHidden(elements.closedNote, state.orderingAllowed);
  }

  function renderCategories() {
    const categories = ['ALL'];
    state.products.forEach(function(product) {
      const category = normalize(product.category);
      if (category && categories.indexOf(category) === -1) categories.push(category);
    });
    if (categories.indexOf(state.category) === -1) state.category = 'ALL';
    elements.categories.innerHTML = categories.map(function(category) {
      const active = state.category === category;
      return '<button class="customer-kitchen-category' + (active ? ' customer-kitchen-category--active' : '') +
        '" type="button" data-category="' + escapeHtml(category) + '" aria-pressed="' + active + '">' +
        escapeHtml(category === 'ALL' ? 'All' : humanize(category)) + '</button>';
    }).join('');
  }

  function matchesProduct(product) {
    if (state.category !== 'ALL' && normalize(product.category) !== state.category) return false;
    if (!state.search) return true;
    return [product.productName, product.category, product.foodType, product.description, product.unitLabel]
      .join(' ').toLowerCase().indexOf(state.search) !== -1;
  }

  function productCard(product) {
    const mode = normalize(product.quantityMode) || 'COUNT';
    const quantity = productCartQuantity(product.productId);
    const image = clean(product.thumbnailUrl) || '../assets/images/logo.png';
    const price = numberValue(product.startingPrice, numberValue(product.basePrice, 0));
    const priceLabel = mode === 'COUNT' ? 'per ' + (clean(product.unitLabel) || 'Piece') : 'starting price';
    const foodClass = normalize(product.foodType) === 'NON_VEG' ? ' customer-product-card__food-marker--non-veg' : '';
    return '<article class="customer-product-card">' +
      '<div class="customer-product-card__image-wrap"><img class="customer-product-card__image" src="' +
      escapeHtml(image) + '" alt="' + escapeHtml(product.productName) + '" loading="lazy">' +
      '<span class="customer-product-card__food-marker' + foodClass + '" aria-hidden="true"></span></div>' +
      '<div class="customer-product-card__content"><span class="customer-product-card__category">' +
      escapeHtml(humanize(product.category)) + '</span><h3>' + escapeHtml(product.productName) + '</h3>' +
      '<p class="customer-product-card__description">' + escapeHtml(product.description) + '</p>' +
      '<div class="customer-product-card__price"><strong>' + currency(price) + '</strong><small>' +
      escapeHtml(priceLabel) + '</small></div><div class="customer-product-card__meta">' +
      escapeHtml(product.preparationMinutes) + ' min · ' + escapeHtml(product.availableQuantity) + ' available</div></div>' +
      '<div class="customer-product-card__actions">' + (quantity ? '<span class="customer-product-card__cart-quantity">' +
      quantity + ' in cart</span>' : '') + '<button class="button button--primary" type="button" data-product-id="' +
      escapeHtml(product.productId) + '"' + (state.orderingAllowed ? '' : ' disabled') + '>ADD</button></div></article>';
  }

  function renderProducts() {
    const visible = state.products.filter(matchesProduct);
    elements.products.innerHTML = visible.map(productCard).join('');
    setHidden(elements.empty, visible.length > 0);
  }
  function renderPage() { renderKitchen(); renderCategories(); renderProducts(); renderCartBar(); }

  async function loadKitchenMenu() {
    if (state.loading) return;
    state.loading = true;
    setHidden(elements.loading, false); setHidden(elements.error, true); setHidden(elements.content, true);
    elements.refresh.disabled = true;
    try {
      const response = await window.ApnaBiteAPI.request('customer.kitchen.menu', {
        kitchenId: state.kitchenId
      }, { retry: false, deduplicate: false, timeoutMs: 20000 });
      const data = responseData(response);
      if (!data.kitchen) throw new Error('Kitchen details were not returned.');
      state.kitchen = data.kitchen;
      state.products = Array.isArray(data.products) ? data.products : [];
      state.orderingAllowed = Boolean(data.ordering && data.ordering.allowed);
      state.orderingReason = clean(data.ordering && data.ordering.reason);
      setHidden(elements.loading, true); setHidden(elements.content, false);
      renderPage();
    } catch (error) {
      showPageError('Kitchen could not be loaded', clean(error && error.message) || 'Please check your connection and try again.');
      if (window.ApnaBiteUI && typeof window.ApnaBiteUI.handleApiError === 'function') {
        window.ApnaBiteUI.handleApiError(error, { redirectToLogin: true });
      }
    } finally {
      state.loading = false;
      elements.refresh.disabled = false;
    }
  }

  function maximumProductQuantity(product) {
    const minimum = Math.max(1, Math.floor(numberValue(product.minimumQuantity, 1)));
    const configured = Math.max(minimum, Math.floor(numberValue(product.maximumQuantity, minimum)));
    const available = Math.max(0, Math.floor(numberValue(product.availableQuantity, 0)));
    return Math.max(minimum, Math.min(configured, available));
  }
  function maximumAddonQuantity(addon) {
    const minimum = Math.max(0, Math.floor(numberValue(addon.minimumQuantity, 0)));
    return Math.max(minimum, Math.min(
      Math.max(minimum, Math.floor(numberValue(addon.maximumQuantity, minimum))),
      Math.max(0, Math.floor(numberValue(addon.availableQuantity, 0)))
    ));
  }

  function resetSelection(product) {
    state.selectedProduct = product;
    state.productQuantity = Math.min(maximumProductQuantity(product), Math.max(1, Math.floor(numberValue(product.minimumQuantity, 1))));
    state.addonQuantities = {};
    (product.addons || []).forEach(function(addon) {
      state.addonQuantities[addon.addonId] = Math.max(0, Math.floor(numberValue(addon.minimumQuantity, 0)));
    });
    if (normalize(product.quantityMode) === 'COUNT') {
      state.selectedOption = { code: 'DEFAULT', label: clean(product.unitLabel) || 'Piece', price: numberValue(product.basePrice, 0) };
    } else {
      const options = Array.isArray(product.quantityOptions) ? product.quantityOptions : [];
      state.selectedOption = options[0] || null;
    }
  }

  function renderOptions() {
    const product = state.selectedProduct;
    const mode = normalize(product.quantityMode);
    const options = Array.isArray(product.quantityOptions) ? product.quantityOptions : [];
    if (mode === 'COUNT') {
      elements.options.innerHTML = ''; setHidden(elements.optionSection, true); setHidden(elements.optionError, true); return;
    }
    setHidden(elements.optionSection, false);
    setText(elements.optionTitle, mode === 'VOLUME' ? 'Choose size' : 'Choose portion');
    if (!options.length) {
      state.selectedOption = null; elements.options.innerHTML = '';
      setText(elements.optionError, 'No quantity option is available.'); setHidden(elements.optionError, false); return;
    }
    setHidden(elements.optionError, true);
    elements.options.innerHTML = options.map(function(option) {
      const selected = state.selectedOption && clean(state.selectedOption.code) === clean(option.code);
      return '<label class="customer-product-option"><input type="radio" name="customer-product-option" value="' +
        escapeHtml(option.code) + '"' + (selected ? ' checked' : '') + '><span class="customer-product-option__content"><strong>' +
        escapeHtml(option.label) + '</strong><small>' + currency(option.price) + '</small></span></label>';
    }).join('');
  }

  function renderAddons() {
    const addons = state.selectedProduct && Array.isArray(state.selectedProduct.addons) ? state.selectedProduct.addons : [];
    elements.addons.innerHTML = '';
    setHidden(elements.addonSection, !addons.length);
    addons.forEach(function(addon) {
      const id = clean(addon.addonId);
      const quantity = Math.max(0, Math.floor(numberValue(state.addonQuantities[id], 0)));
      elements.addons.insertAdjacentHTML('beforeend', '<article class="customer-product-addon" data-addon-id="' +
        escapeHtml(id) + '"><div><strong>' + escapeHtml(addon.addonName) + '</strong><small>+ ' +
        currency(addon.unitPrice) + '</small></div><div class="customer-product-addon__quantity"><button type="button" data-addon-minus data-addon-id="' +
        escapeHtml(id) + '"' + (quantity <= Math.max(0, numberValue(addon.minimumQuantity, 0)) ? ' disabled' : '') +
        '>−</button><span data-addon-quantity>' + quantity + '</span><button type="button" data-addon-plus data-addon-id="' +
        escapeHtml(id) + '"' + (quantity >= maximumAddonQuantity(addon) ? ' disabled' : '') + '>+</button></div></article>');
    });
  }

  function selectedUnitPrice() {
    return state.selectedOption ? numberValue(state.selectedOption.price, 0) : 0;
  }
  function selectedAddonTotal() {
    return (state.selectedProduct.addons || []).reduce(function(total, addon) {
      return total + numberValue(addon.unitPrice, 0) * numberValue(state.addonQuantities[addon.addonId], 0);
    }, 0);
  }
  function updateModalTotal() {
    const product = state.selectedProduct;
    if (!product) return;
    const unitPrice = selectedUnitPrice();
    setText(elements.modalPrice, normalize(product.quantityMode) === 'COUNT'
      ? currency(unitPrice) + ' / ' + (clean(product.unitLabel) || 'Piece') : currency(unitPrice));
    const total = unitPrice * state.productQuantity + selectedAddonTotal();
    elements.addButton.disabled = !state.selectedOption || total <= 0;
    setText(elements.addButton, 'ADD TO CART · ' + currency(total));
  }
  function updateQuantity() {
    const product = state.selectedProduct;
    const minimum = Math.max(1, Math.floor(numberValue(product.minimumQuantity, 1)));
    const maximum = maximumProductQuantity(product);
    state.productQuantity = Math.min(maximum, Math.max(minimum, state.productQuantity));
    setText(elements.quantityValue, state.productQuantity);
    elements.quantityMinus.disabled = state.productQuantity <= minimum;
    elements.quantityPlus.disabled = state.productQuantity >= maximum;
    setText(elements.quantityHelp, 'Minimum ' + minimum + ' · Maximum ' + maximum);
  }

  function openModal(product) {
    if (!product || !state.orderingAllowed || numberValue(product.availableQuantity, 0) <= 0) {
      toast(state.orderingReason || 'This product is currently unavailable.', 'error'); return;
    }
    resetSelection(product);
    if (elements.modalImage) {
      elements.modalImage.src = clean(product.detailImageUrl || product.thumbnailUrl) || '../assets/images/logo.png';
      elements.modalImage.alt = clean(product.productName) || 'Product';
      elements.modalImage.onerror = function() { this.onerror = null; this.src = '../assets/images/logo.png'; };
    }
    setText(elements.modalFoodType, normalize(product.foodType) === 'NON_VEG' ? 'NON-VEG' : 'VEG');
    if (elements.modalFoodType) elements.modalFoodType.classList.toggle('customer-product-food-type--non-veg', normalize(product.foodType) === 'NON_VEG');
    setText(elements.modalName, product.productName);
    setText(elements.modalDescription, clean(product.description) || 'Fresh homemade food.');
    renderOptions(); renderAddons(); updateQuantity(); updateModalTotal();
    setHidden(elements.modal, false); elements.modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('customer-product-modal-open'); document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    setHidden(elements.modal, true); elements.modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('customer-product-modal-open'); document.body.style.overflow = '';
    state.selectedProduct = null; state.selectedOption = null; state.productQuantity = 1; state.addonQuantities = {};
  }

  function buildCartItem() {
    const product = state.selectedProduct;
    const option = state.selectedOption;
    if (!product || !option) return null;
    const addons = (product.addons || []).map(function(addon) {
      const quantity = Math.max(0, Math.floor(numberValue(state.addonQuantities[addon.addonId], 0)));
      if (!quantity) return null;
      const unitPrice = numberValue(addon.unitPrice, 0);
      return { addonId: clean(addon.addonId), addonName: clean(addon.addonName), unitPrice: unitPrice, quantity: quantity, total: unitPrice * quantity };
    }).filter(Boolean);
    const addonSignature = addons.map(function(addon) { return addon.addonId + ':' + addon.quantity; }).sort().join('|') || 'NO_ADDONS';
    const optionCode = clean(option.code) || 'DEFAULT';
    const unitPrice = numberValue(option.price, numberValue(product.basePrice, 0));
    const addonTotal = addons.reduce(function(total, addon) { return total + addon.total; }, 0);
    return {
      cartItemId: product.productId + '__' + optionCode + '__' + addonSignature,
      itemType: 'PRODUCT', kitchenId: clean(state.kitchen.kitchenId), kitchenName: clean(state.kitchen.kitchenName),
      productId: clean(product.productId), productName: clean(product.productName), thumbnailUrl: clean(product.thumbnailUrl),
      quantityMode: normalize(product.quantityMode), unitLabel: clean(product.unitLabel),
      selectedOptionCode: optionCode, selectedOptionLabel: clean(option.label), selectedOptionPrice: unitPrice,
      unitPrice: unitPrice, quantity: state.productQuantity,
      minimumQuantity: Math.max(1, numberValue(product.minimumQuantity, 1)),
      maximumQuantity: maximumProductQuantity(product), availableQuantity: Math.max(0, numberValue(product.availableQuantity, 0)),
      productSubtotal: unitPrice * state.productQuantity, addons: addons, addonTotal: addonTotal,
      itemTotal: unitPrice * state.productQuantity + addonTotal, itemConfig: {}
    };
  }

  function addToCart() {
    const item = buildCartItem();
    if (!item) return toast('Please select a quantity option.', 'error');
    if (state.cart.items.length && state.cart.kitchenId && state.cart.kitchenId !== item.kitchenId) {
      if (!window.confirm('Your cart contains items from another Kitchen. Replace the existing cart?')) return;
      state.cart = emptyCart();
    }
    state.cart.kitchenId = item.kitchenId;
    state.cart.kitchenName = item.kitchenName;
    const existing = state.cart.items.find(function(cartItem) { return clean(cartItem.cartItemId) === item.cartItemId; });
    if (existing) {
      const next = numberValue(existing.quantity, 0) + item.quantity;
      if (next > item.maximumQuantity) return toast('Maximum available quantity is ' + item.maximumQuantity + '.', 'error');
      existing.quantity = next;
      existing.productSubtotal = existing.unitPrice * next;
      existing.itemTotal = existing.productSubtotal + numberValue(existing.addonTotal, 0);
    } else {
      state.cart.items.push(item);
    }
    saveCart(); renderProducts(); closeModal(); toast(item.productName + ' added to cart.', 'success');
  }

  function bindEvents() {
    elements.refresh.addEventListener('click', loadKitchenMenu);
    elements.retry.addEventListener('click', loadKitchenMenu);
    elements.products.addEventListener('click', function(event) {
      const button = event.target.closest('[data-product-id]');
      if (!button || button.disabled) return;
      const product = state.products.find(function(item) { return clean(item.productId) === clean(button.dataset.productId); });
      if (product) openModal(product);
    });
    elements.categories.addEventListener('click', function(event) {
      const button = event.target.closest('[data-category]');
      if (!button) return;
      state.category = normalize(button.dataset.category) || 'ALL'; renderCategories(); renderProducts();
    });
    elements.search.addEventListener('input', function() { state.search = clean(elements.search.value).toLowerCase(); renderProducts(); });
    elements.modalClose.addEventListener('click', closeModal);
    document.querySelectorAll('[data-close-product-modal]').forEach(function(item) { item.addEventListener('click', closeModal); });
    elements.options.addEventListener('change', function(event) {
      const input = event.target.closest('input[name="customer-product-option"]');
      if (!input || !state.selectedProduct) return;
      state.selectedOption = (state.selectedProduct.quantityOptions || []).find(function(option) {
        return clean(option.code) === clean(input.value);
      }) || null;
      setHidden(elements.optionError, Boolean(state.selectedOption)); updateModalTotal();
    });
    elements.addons.addEventListener('click', function(event) {
      const button = event.target.closest('[data-addon-minus], [data-addon-plus]');
      if (!button || !state.selectedProduct) return;
      const addon = (state.selectedProduct.addons || []).find(function(item) { return clean(item.addonId) === clean(button.dataset.addonId); });
      if (!addon) return;
      const minimum = Math.max(0, Math.floor(numberValue(addon.minimumQuantity, 0)));
      const maximum = maximumAddonQuantity(addon);
      const difference = button.hasAttribute('data-addon-plus') ? 1 : -1;
      state.addonQuantities[addon.addonId] = Math.min(maximum, Math.max(minimum,
        numberValue(state.addonQuantities[addon.addonId], minimum) + difference));
      renderAddons(); updateModalTotal();
    });
    elements.quantityMinus.addEventListener('click', function() { state.productQuantity -= 1; updateQuantity(); updateModalTotal(); });
    elements.quantityPlus.addEventListener('click', function() { state.productQuantity += 1; updateQuantity(); updateModalTotal(); });
    elements.addButton.addEventListener('click', addToCart);
    elements.cartBar.addEventListener('click', function() { if (state.cart.items.length) window.location.href = 'cart-checkout.html'; });
    document.addEventListener('keydown', function(event) { if (event.key === 'Escape' && !elements.modal.hidden) closeModal(); });
    document.addEventListener('apnabite:cart-restored', function() { loadCart(); renderCartBar(); if (state.kitchen) renderProducts(); });
    window.addEventListener('storage', function(event) {
      if (event.key === CART_STORAGE_KEY) { loadCart(); renderCartBar(); if (state.kitchen) renderProducts(); }
    });
  }

  async function initialize() {
    if (!document.body.classList.contains('customer-kitchen-page')) return;
    collectElements();
    if (!requiredElementsAvailable()) return console.error('Customer Kitchen page elements are incomplete.');
    if (!window.ApnaBiteCore || !window.ApnaBiteAPI || !window.ApnaBiteCartSync) {
      return showPageError('Kitchen could not be loaded', 'Required application files did not load.');
    }
    if (!window.ApnaBiteCore.requireLocalSession(['CUSTOMER'])) return;
    state.kitchenId = clean(new URLSearchParams(window.location.search).get('kitchenId'));
    bindEvents();
    await window.ApnaBiteCartSync.restore();
    loadCart(); renderCartBar();
    if (!state.kitchenId) return showPageError('Kitchen not selected', 'Please return to Home and select a Kitchen.');
    await loadKitchenMenu();
  }

  window.ApnaBiteCustomerKitchen = Object.freeze({
    refresh: loadKitchenMenu,
    openProduct: function(productId) {
      const product = state.products.find(function(item) { return clean(item.productId) === clean(productId); });
      if (product) openModal(product);
    },
    closeProduct: closeModal,
    getCart: function() { return JSON.parse(JSON.stringify(state.cart)); }
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})(window, document);
