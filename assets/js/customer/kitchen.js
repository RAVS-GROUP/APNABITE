/**
 * ============================================================
 * APNABITE V1 — CUSTOMER KITCHEN MENU CONTROLLER
 * File: assets/js/customer/kitchen.js
 * Complete replacement — Part 1 of 3
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CART_STORAGE_KEY = 'apnabite_cart_v1';

  const state = {
    loading: false,
    user: null,
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
    cart: {
      version: 1,
      kitchenId: '',
      kitchenName: '',
      items: [],
      updatedAt: ''
    }
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function collectElements() {
    elements.refreshButton = byId('customer-kitchen-refresh-button');
    elements.headerName = byId('customer-kitchen-header-name');
    elements.loading = byId('customer-kitchen-loading');
    elements.error = byId('customer-kitchen-error');
    elements.errorTitle = byId('customer-kitchen-error-title');
    elements.errorMessage = byId('customer-kitchen-error-message');
    elements.retryButton = byId('customer-kitchen-retry-button');
    elements.content = byId('customer-kitchen-content');

    elements.kitchenImage = byId('customer-kitchen-image');
    elements.kitchenStatus = byId('customer-kitchen-status');
    elements.kitchenFoodType = byId('customer-kitchen-food-type');
    elements.kitchenName = byId('customer-kitchen-name');
    elements.kitchenRating = byId('customer-kitchen-rating');
    elements.kitchenRatingCount = byId('customer-kitchen-rating-count');
    elements.kitchenDescription = byId('customer-kitchen-description');
    elements.kitchenPreparation = byId('customer-kitchen-preparation');
    elements.kitchenMinimumOrder = byId('customer-kitchen-minimum-order');
    elements.kitchenProductCount = byId('customer-kitchen-product-count');
    elements.closedNote = byId('customer-kitchen-closed-note');
    elements.orderingReason = byId('customer-kitchen-ordering-reason');

    elements.searchInput = byId('customer-kitchen-search-input');
    elements.categories = byId('customer-kitchen-categories');
    elements.empty = byId('customer-kitchen-empty');
    elements.products = byId('customer-kitchen-products');

    elements.cartBar = byId('customer-kitchen-cart-bar');
    elements.cartCount = byId('customer-kitchen-cart-count');
    elements.cartTotal = byId('customer-kitchen-cart-total');

    elements.modal = byId('customer-product-modal');
    elements.modalClose = byId('customer-product-modal-close');
    elements.modalImage = byId('customer-product-modal-image');
    elements.modalFoodType = byId('customer-product-modal-food-type');
    elements.modalName = byId('customer-product-modal-name');
    elements.modalPrice = byId('customer-product-modal-price');
    elements.modalDescription = byId('customer-product-modal-description');

    elements.optionSection = byId('customer-product-option-section');
    elements.optionTitle = byId('customer-product-option-title');
    elements.options = byId('customer-product-options');
    elements.optionError = byId('customer-product-option-error');

    elements.addonSection = byId('customer-product-addon-section');
    elements.addons = byId('customer-product-addons');
    elements.addonTemplate = byId('customer-product-addon-template');

    elements.quantityHelp = byId('customer-product-quantity-help');
    elements.quantityMinus = byId('customer-product-quantity-minus');
    elements.quantityValue = byId('customer-product-quantity');
    elements.quantityPlus = byId('customer-product-quantity-plus');
    elements.addButton = byId('customer-product-add-button');
  }

  function requiredElementsAvailable() {
    const required = [
      'refreshButton',
      'loading',
      'error',
      'retryButton',
      'content',
      'searchInput',
      'categories',
      'empty',
      'products',
      'cartBar',
      'cartCount',
      'cartTotal',
      'modal',
      'modalClose',
      'options',
      'addons',
      'quantityMinus',
      'quantityValue',
      'quantityPlus',
      'addButton'
    ];

    return required.every(function(name) {
      return Boolean(elements[name]);
    });
  }

  function cleanText(value) {
    return String(
      value === undefined || value === null ? '' : value
    ).replace(/\s+/g, ' ').trim();
  }

  function normalize(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = Boolean(hidden);
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent = String(
        value === undefined || value === null ? '' : value
      );
    }
  }

  function escapeHtml(value) {
    return String(value === undefined || value === null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCurrency(value) {
    return '₹' + numberValue(value, 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function humanize(value) {
    return normalize(value)
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, function(letter) {
        return letter.toUpperCase();
      });
  }

  function getResponseData(response) {
    if (
      response &&
      response.data &&
      typeof response.data === 'object'
    ) {
      return response.data;
    }

    return {};
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI.showToast === 'function'
    ) {
      window.ApnaBiteUI.showToast(message, type || 'info');
      return;
    }

    console.log(message);
  }

  function handleApiError(error) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI.handleApiError === 'function'
    ) {
      window.ApnaBiteUI.handleApiError(error, {
        redirectToLogin: true
      });
      return;
    }

    showToast(
      cleanText(error && error.message) || 'Something went wrong.',
      'error'
    );
  }

  function showPageError(title, message) {
    setHidden(elements.loading, true);
    setHidden(elements.content, true);
    setHidden(elements.error, false);

    setText(
      elements.errorTitle,
      title || 'Kitchen could not be loaded'
    );

    setText(
      elements.errorMessage,
      message || 'Please try again.'
    );
  }

  function getKitchenIdFromUrl() {
    const parameters = new URLSearchParams(window.location.search);
    return cleanText(parameters.get('kitchenId'));
  }

  function getProductById(productId) {
    const cleanProductId = cleanText(productId);

    return state.products.find(function(product) {
      return cleanText(product.productId) === cleanProductId;
    }) || null;
  }

  function createEmptyCart() {
    return {
      version: 1,
      kitchenId: '',
      kitchenName: '',
      items: [],
      updatedAt: ''
    };
  }

  function loadCart() {
    try {
      const stored = window.localStorage.getItem(CART_STORAGE_KEY);

      if (!stored) {
        state.cart = createEmptyCart();
        return;
      }

      const parsed = JSON.parse(stored);

      if (!parsed || !Array.isArray(parsed.items)) {
        state.cart = createEmptyCart();
        return;
      }

      state.cart = {
        version: 1,
        kitchenId: cleanText(parsed.kitchenId),
        kitchenName: cleanText(parsed.kitchenName),
        items: parsed.items.filter(function(item) {
          return (
            item &&
            cleanText(item.productId) &&
            numberValue(item.quantity, 0) > 0
          );
        }),
        updatedAt: cleanText(parsed.updatedAt)
      };
    } catch (error) {
      state.cart = createEmptyCart();
      window.localStorage.removeItem(CART_STORAGE_KEY);
    }
  }

  function saveCart() {
    if (!state.cart.items.length) {
      state.cart = createEmptyCart();
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } else {
      state.cart.updatedAt = new Date().toISOString();

      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(state.cart)
      );
    }

    renderCartBar();
  }

  function calculateCartSummary() {
    return state.cart.items.reduce(function(summary, item) {
      summary.count += Math.max(
        0,
        Math.floor(numberValue(item.quantity, 0))
      );

      summary.total += Math.max(
        0,
        numberValue(item.itemTotal, 0)
      );

      return summary;
    }, {
      count: 0,
      total: 0
    });
  }

  function getProductCartQuantity(productId) {
    const cleanProductId = cleanText(productId);

    return state.cart.items.reduce(function(total, item) {
      if (cleanText(item.productId) !== cleanProductId) {
        return total;
      }

      return total + Math.max(
        0,
        Math.floor(numberValue(item.quantity, 0))
      );
    }, 0);
  }

  function renderCartBar() {
    const summary = calculateCartSummary();

    setText(elements.cartCount, summary.count);
    setText(elements.cartTotal, formatCurrency(summary.total));
    setHidden(elements.cartBar, summary.count <= 0);
  }

  function productMatchesFilter(product) {
    if (
      state.category !== 'ALL' &&
      normalize(product.category) !== state.category
    ) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    const searchable = [
      product.productName,
      product.category,
      product.foodType,
      product.description,
      product.unitLabel
    ].join(' ').toLowerCase();

    return searchable.indexOf(state.search) !== -1;
  }

  function renderKitchen() {
    const kitchen = state.kitchen;

    if (!kitchen) return;

    setText(elements.headerName, kitchen.kitchenName);
    setText(elements.kitchenName, kitchen.kitchenName);
    setText(elements.kitchenFoodType, humanize(kitchen.foodType));
    setText(
      elements.kitchenDescription,
      cleanText(kitchen.description) || 'Fresh homemade food.'
    );
    setText(
      elements.kitchenPreparation,
      Math.max(
        0,
        Math.floor(numberValue(kitchen.averagePreparationMinutes, 0))
      ) + ' min'
    );
    setText(
      elements.kitchenMinimumOrder,
      formatCurrency(kitchen.minimumOrderValue)
    );
    setText(
      elements.kitchenProductCount,
      state.products.length
    );

    const kitchenImageUrl =
      cleanText(kitchen.thumbnailUrl) ||
      '../assets/images/logo.png';

    if (elements.kitchenImage) {
      elements.kitchenImage.src = kitchenImageUrl;
      elements.kitchenImage.alt =
        cleanText(kitchen.kitchenName) || 'Kitchen';

      elements.kitchenImage.onerror = function() {
        this.onerror = null;
        this.src = '../assets/images/logo.png';
      };
    }

    const ratingCount = Math.max(
      0,
      Math.floor(numberValue(kitchen.ratingCount, 0))
    );

    if (ratingCount > 0) {
      setText(
        elements.kitchenRating,
        '★ ' + numberValue(kitchen.averageRating, 0).toFixed(1)
      );
      setText(
        elements.kitchenRatingCount,
        ratingCount + (ratingCount === 1 ? ' rating' : ' ratings')
      );
    } else {
      setText(elements.kitchenRating, 'New');
      setText(elements.kitchenRatingCount, 'No ratings');
    }

    if (elements.kitchenStatus) {
      elements.kitchenStatus.classList.remove(
        'customer-kitchen-status--open',
        'customer-kitchen-status--closed'
      );

      elements.kitchenStatus.classList.add(
        state.orderingAllowed
          ? 'customer-kitchen-status--open'
          : 'customer-kitchen-status--closed'
      );

      setText(
        elements.kitchenStatus,
        state.orderingAllowed ? 'OPEN' : 'CLOSED'
      );
    }

    setText(
      elements.orderingReason,
      state.orderingReason ||
      'This Kitchen is currently unavailable.'
    );

    setHidden(
      elements.closedNote,
      state.orderingAllowed
    );
  }

  function renderCategories() {
    const categories = ['ALL'];

    state.products.forEach(function(product) {
      const category = normalize(product.category);

      if (
        category &&
        categories.indexOf(category) === -1
      ) {
        categories.push(category);
      }
    });

    if (
      state.category !== 'ALL' &&
      categories.indexOf(state.category) === -1
    ) {
      state.category = 'ALL';
    }

    elements.categories.innerHTML = categories.map(function(category) {
      const active = state.category === category;

      return (
        '<button class="customer-kitchen-category' +
          (active ? ' customer-kitchen-category--active' : '') +
          '" type="button" data-category="' +
          escapeHtml(category) +
          '" aria-pressed="' +
          (active ? 'true' : 'false') +
          '">' +
          escapeHtml(category === 'ALL' ? 'All' : humanize(category)) +
        '</button>'
      );
    }).join('');
  }

  function renderProductCard(product) {
    const quantityMode =
      normalize(product.quantityMode) || 'COUNT';

    const cartQuantity =
      getProductCartQuantity(product.productId);

    const imageUrl =
      cleanText(product.thumbnailUrl) ||
      '../assets/images/logo.png';

    const startingPrice = numberValue(
      product.startingPrice,
      numberValue(product.basePrice, 0)
    );

    const priceLabel =
      quantityMode === 'COUNT'
        ? 'per ' + (
          cleanText(product.unitLabel) || 'Piece'
        )
        : 'starting price';

    const foodClass =
      normalize(product.foodType) === 'NON_VEG'
        ? ' customer-product-card__food-marker--non-veg'
        : '';

const buttonText = 'ADD';
    

    return (
      '<article class="customer-product-card">' +
        '<div class="customer-product-card__image-wrap">' +
          '<img class="customer-product-card__image" src="' +
            escapeHtml(imageUrl) +
            '" alt="' +
            escapeHtml(product.productName) +
            '" loading="lazy">' +
          '<span class="customer-product-card__food-marker' +
            foodClass +
            '" aria-hidden="true"></span>' +
        '</div>' +

        '<div class="customer-product-card__content">' +
          '<span class="customer-product-card__category">' +
            escapeHtml(humanize(product.category)) +
          '</span>' +
          '<h3>' +
            escapeHtml(product.productName) +
          '</h3>' +
          '<p class="customer-product-card__description">' +
            escapeHtml(product.description) +
          '</p>' +
          '<div class="customer-product-card__price">' +
            '<strong>' +
              escapeHtml(formatCurrency(startingPrice)) +
            '</strong>' +
            '<small>' +
              escapeHtml(priceLabel) +
            '</small>' +
          '</div>' +
          '<div class="customer-product-card__meta">' +
            escapeHtml(product.preparationMinutes) +
            ' min · ' +
            escapeHtml(product.availableQuantity) +
            ' available' +
          '</div>' +
        '</div>' +

        '<div class="customer-product-card__actions">' +
          (
            cartQuantity > 0
              ? '<span class="customer-product-card__cart-quantity">' +
                  escapeHtml(cartQuantity) +
                  ' in cart</span>'
              : ''
          ) +
          '<button class="button button--primary" type="button"' +
            ' data-product-id="' +
            escapeHtml(product.productId) +
            '"' +
            (state.orderingAllowed ? '' : ' disabled') +
            '>' +
            buttonText +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProducts() {
    const visibleProducts =
      state.products.filter(productMatchesFilter);

    elements.products.innerHTML =
      visibleProducts.map(renderProductCard).join('');

    setHidden(
      elements.empty,
      visibleProducts.length > 0
    );
  }

  function renderPage() {
    renderKitchen();
    renderCategories();
    renderProducts();
    renderCartBar();
  }

  async function validateCustomerSession() {
    if (!window.ApnaBiteCore || !window.ApnaBiteAPI) {
      throw new Error(
        'Required application files did not load.'
      );
    }

    if (
      typeof window.ApnaBiteCore.requireLocalSession === 'function' &&
      !window.ApnaBiteCore.requireLocalSession(['CUSTOMER'])
    ) {
      return null;
    }

    const response =
      await window.ApnaBiteAPI.validateSession();

    const data = getResponseData(response);
    const user = data.user || null;

    if (
      !user ||
      normalize(user.role) !== 'CUSTOMER'
    ) {
      if (
        typeof window.ApnaBiteCore.redirectToRoleHome === 'function'
      ) {
        window.ApnaBiteCore.redirectToRoleHome(
          user ? user.role : '',
          true
        );
      }

      return null;
    }

    state.user = user;
    return user;
  }

  async function loadKitchenMenu() {
    if (state.loading) return;

    state.loading = true;

    setHidden(elements.loading, false);
    setHidden(elements.error, true);
    setHidden(elements.content, true);

    elements.refreshButton.disabled = true;

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'customer.kitchen.menu',
          {
            kitchenId: state.kitchenId
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const data = getResponseData(response);

      if (!data.kitchen) {
        throw new Error(
          'Kitchen details were not returned.'
        );
      }

      state.kitchen = data.kitchen;

      state.products =
        Array.isArray(data.products)
          ? data.products
          : [];

      state.orderingAllowed = Boolean(
        data.ordering &&
        data.ordering.allowed
      );

      state.orderingReason = cleanText(
        data.ordering &&
        data.ordering.reason
      );

      setHidden(elements.loading, true);
      setHidden(elements.error, true);
      setHidden(elements.content, false);

      renderPage();
    } catch (error) {
      showPageError(
        'Kitchen could not be loaded',
        cleanText(error && error.message) ||
        'Please check your connection and try again.'
      );

      handleApiError(error);
    } finally {
      state.loading = false;
      elements.refreshButton.disabled = false;
    }
  }

  /*
   * Continue directly with Part 2 below this line.
   */
   function setProductModalImage(product) {
    if (!elements.modalImage) return;

    elements.modalImage.src =
      cleanText(
        product.detailImageUrl ||
        product.thumbnailUrl
      ) ||
      '../assets/images/logo.png';

    elements.modalImage.alt =
      cleanText(product.productName) ||
      'Product';

    elements.modalImage.onerror = function() {
      this.onerror = null;
      this.src = '../assets/images/logo.png';
    };
  }

  function resetProductSelection(product) {
    state.selectedProduct = product;

    const minimumQuantity = Math.max(
      1,
      Math.floor(
        numberValue(
          product.minimumQuantity,
          1
        )
      )
    );

    const availableQuantity = Math.max(
      0,
      Math.floor(
        numberValue(
          product.availableQuantity,
          0
        )
      )
    );

    state.productQuantity =
      availableQuantity > 0
        ? Math.min(
          minimumQuantity,
          availableQuantity
        )
        : minimumQuantity;

    state.addonQuantities = {};

    (product.addons || []).forEach(function(addon) {
      state.addonQuantities[addon.addonId] = Math.max(
        0,
        Math.floor(
          numberValue(
            addon.minimumQuantity,
            0
          )
        )
      );
    });

    if (
      normalize(product.quantityMode) === 'COUNT'
    ) {
      state.selectedOption = {
        code: 'DEFAULT',
        label:
          cleanText(product.unitLabel) ||
          'Piece',
        price:
          numberValue(
            product.basePrice,
            0
          )
      };

      return;
    }

    const options =
      Array.isArray(product.quantityOptions)
        ? product.quantityOptions
        : [];

    state.selectedOption =
      options.length > 0
        ? options[0]
        : null;
  }

  function openProductModal(product) {
    if (!product) {
      showToast(
        'Product could not be found.',
        'error'
      );
      return;
    }

    if (!state.orderingAllowed) {
      showToast(
        state.orderingReason ||
        'This Kitchen is not accepting orders right now.',
        'error'
      );
      return;
    }

    if (
      numberValue(
        product.availableQuantity,
        0
      ) <= 0
    ) {
      showToast(
        'This Product is currently out of stock.',
        'error'
      );
      return;
    }

    resetProductSelection(product);
    setProductModalImage(product);

    setText(
      elements.modalFoodType,
      normalize(product.foodType) === 'NON_VEG'
        ? 'NON-VEG'
        : 'VEG'
    );

    if (elements.modalFoodType) {
      elements.modalFoodType.classList.toggle(
        'customer-product-food-type--non-veg',
        normalize(product.foodType) === 'NON_VEG'
      );
    }

    setText(
      elements.modalName,
      cleanText(product.productName) ||
      'Product'
    );

    setText(
      elements.modalDescription,
      cleanText(product.description) ||
      'Fresh homemade food.'
    );

    renderProductOptions();
    renderProductAddons();
    updateProductQuantityDisplay();
    updateProductModalTotal();

    setHidden(elements.modal, false);
    elements.modal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.classList.add(
      'customer-product-modal-open'
    );

    document.body.style.overflow = 'hidden';
  }

  function closeProductModal() {
    setHidden(elements.modal, true);

    elements.modal.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.classList.remove(
      'customer-product-modal-open'
    );

    document.body.style.overflow = '';

    state.selectedProduct = null;
    state.selectedOption = null;
    state.productQuantity = 1;
    state.addonQuantities = {};
  }

  function renderProductOptions() {
    const product = state.selectedProduct;

    if (!product) return;

    const quantityMode =
      normalize(product.quantityMode);

    const options =
      Array.isArray(product.quantityOptions)
        ? product.quantityOptions
        : [];

    if (quantityMode === 'COUNT') {
      elements.options.innerHTML = '';

      setHidden(
        elements.optionSection,
        true
      );

      setHidden(
        elements.optionError,
        true
      );

      return;
    }

    setHidden(
      elements.optionSection,
      false
    );

    setText(
      elements.optionTitle,
      quantityMode === 'VOLUME'
        ? 'Choose size'
        : 'Choose portion'
    );

    if (!options.length) {
      elements.options.innerHTML = '';
      state.selectedOption = null;

      setText(
        elements.optionError,
        'No quantity option is available.'
      );

      setHidden(
        elements.optionError,
        false
      );

      return;
    }

    setHidden(
      elements.optionError,
      true
    );

    elements.options.innerHTML =
      options.map(function(option) {
        const code =
          cleanText(option.code);

        const selected =
          state.selectedOption &&
          cleanText(
            state.selectedOption.code
          ) === code;

        return (
          '<label class="customer-product-option">' +
            '<input type="radio"' +
              ' name="customer-product-option"' +
              ' value="' +
              escapeHtml(code) +
              '"' +
              (selected ? ' checked' : '') +
            '>' +
            '<span class="customer-product-option__content">' +
              '<strong>' +
                escapeHtml(option.label) +
              '</strong>' +
              '<small>' +
                formatCurrency(option.price) +
              '</small>' +
            '</span>' +
          '</label>'
        );
      }).join('');
  }

  function renderProductAddons() {
    const product = state.selectedProduct;

    if (!product) return;

    const addons =
      Array.isArray(product.addons)
        ? product.addons
        : [];

    elements.addons.innerHTML = '';

    if (!addons.length) {
      setHidden(
        elements.addonSection,
        true
      );
      return;
    }

    setHidden(
      elements.addonSection,
      false
    );

    addons.forEach(function(addon) {
      const addonId =
        cleanText(addon.addonId);

      const quantity = Math.max(
        0,
        Math.floor(
          numberValue(
            state.addonQuantities[addonId],
            0
          )
        )
      );

      if (
        elements.addonTemplate &&
        elements.addonTemplate.content
      ) {
        const fragment =
          elements.addonTemplate.content
            .cloneNode(true);

        const row =
          fragment.firstElementChild;

        if (row) {
          row.dataset.addonId = addonId;

          setText(
            row.querySelector(
              '[data-addon-name]'
            ),
            addon.addonName
          );

          setText(
            row.querySelector(
              '[data-addon-price]'
            ),
            '+ ' +
            formatCurrency(addon.unitPrice)
          );

          setText(
            row.querySelector(
              '[data-addon-quantity]'
            ),
            quantity
          );

          const minusButton =
            row.querySelector(
              '[data-addon-minus]'
            );

          const plusButton =
            row.querySelector(
              '[data-addon-plus]'
            );

          if (minusButton) {
            minusButton.dataset.addonId =
              addonId;

            minusButton.disabled =
              quantity <= Math.max(
                0,
                numberValue(
                  addon.minimumQuantity,
                  0
                )
              );
          }

          if (plusButton) {
            plusButton.dataset.addonId =
              addonId;

            plusButton.disabled =
              quantity >= getAddonMaximum(
                addon
              );
          }

          elements.addons.appendChild(
            fragment
          );

          return;
        }
      }

      elements.addons.insertAdjacentHTML(
        'beforeend',
        '<article class="customer-product-addon" data-addon-id="' +
          escapeHtml(addonId) +
        '">' +
          '<div>' +
            '<strong>' +
              escapeHtml(addon.addonName) +
            '</strong>' +
            '<small>+ ' +
              formatCurrency(addon.unitPrice) +
            '</small>' +
          '</div>' +
          '<div class="customer-product-addon__quantity">' +
            '<button type="button" data-addon-minus data-addon-id="' +
              escapeHtml(addonId) +
            '">−</button>' +
            '<span data-addon-quantity>' +
              quantity +
            '</span>' +
            '<button type="button" data-addon-plus data-addon-id="' +
              escapeHtml(addonId) +
            '">+</button>' +
          '</div>' +
        '</article>'
      );
    });
  }

  function getProductMaximum(product) {
    const minimum = Math.max(
      1,
      Math.floor(
        numberValue(
          product.minimumQuantity,
          1
        )
      )
    );

    const configuredMaximum = Math.max(
      minimum,
      Math.floor(
        numberValue(
          product.maximumQuantity,
          minimum
        )
      )
    );

    const available = Math.max(
      0,
      Math.floor(
        numberValue(
          product.availableQuantity,
          0
        )
      )
    );

    return Math.max(
      minimum,
      Math.min(
        configuredMaximum,
        available
      )
    );
  }

  function getAddonMaximum(addon) {
    const minimum = Math.max(
      0,
      Math.floor(
        numberValue(
          addon.minimumQuantity,
          0
        )
      )
    );

    const configuredMaximum = Math.max(
      minimum,
      Math.floor(
        numberValue(
          addon.maximumQuantity,
          minimum
        )
      )
    );

    const available = Math.max(
      0,
      Math.floor(
        numberValue(
          addon.availableQuantity,
          0
        )
      )
    );

    return Math.max(
      minimum,
      Math.min(
        configuredMaximum,
        available
      )
    );
  }

  function getSelectedUnitPrice() {
    if (!state.selectedProduct) {
      return 0;
    }

    if (state.selectedOption) {
      return numberValue(
        state.selectedOption.price,
        numberValue(
          state.selectedProduct.basePrice,
          0
        )
      );
    }

    return numberValue(
      state.selectedProduct.basePrice,
      0
    );
  }

  function calculateSelectedAddonTotal() {
    if (!state.selectedProduct) {
      return 0;
    }

    return (
      state.selectedProduct.addons || []
    ).reduce(function(total, addon) {
      const quantity = Math.max(
        0,
        Math.floor(
          numberValue(
            state.addonQuantities[
              addon.addonId
            ],
            0
          )
        )
      );

      return total + (
        numberValue(
          addon.unitPrice,
          0
        ) * quantity
      );
    }, 0);
  }

  function calculateCurrentItemTotal() {
    return (
      getSelectedUnitPrice() *
      state.productQuantity
    ) + calculateSelectedAddonTotal();
  }

  function updateProductQuantityDisplay() {
    const product = state.selectedProduct;

    if (!product) return;

    const minimum = Math.max(
      1,
      Math.floor(
        numberValue(
          product.minimumQuantity,
          1
        )
      )
    );

    const maximum =
      getProductMaximum(product);

    state.productQuantity = Math.min(
      maximum,
      Math.max(
        minimum,
        state.productQuantity
      )
    );

    setText(
      elements.quantityValue,
      state.productQuantity
    );

    elements.quantityMinus.disabled =
      state.productQuantity <= minimum;

    elements.quantityPlus.disabled =
      state.productQuantity >= maximum;

    setText(
      elements.quantityHelp,
      'Minimum ' +
      minimum +
      ' · Maximum ' +
      maximum
    );
  }

  function updateProductModalTotal() {
    const product = state.selectedProduct;

    if (!product) return;

    const unitPrice =
      getSelectedUnitPrice();

    const quantityMode =
      normalize(product.quantityMode);

    setText(
      elements.modalPrice,
      quantityMode === 'COUNT'
        ? formatCurrency(unitPrice) +
          ' / ' +
          (
            cleanText(product.unitLabel) ||
            'Piece'
          )
        : formatCurrency(unitPrice)
    );

    const total =
      calculateCurrentItemTotal();

    elements.addButton.disabled =
      !state.selectedOption ||
      total <= 0;

    setText(
      elements.addButton,
      'ADD TO CART · ' +
      formatCurrency(total)
    );
  }

  function changeProductQuantity(difference) {
    const product = state.selectedProduct;

    if (!product) return;

    const minimum = Math.max(
      1,
      Math.floor(
        numberValue(
          product.minimumQuantity,
          1
        )
      )
    );

    const maximum =
      getProductMaximum(product);

    state.productQuantity = Math.min(
      maximum,
      Math.max(
        minimum,
        state.productQuantity +
        difference
      )
    );

    updateProductQuantityDisplay();
    updateProductModalTotal();
  }

  function getSelectedAddon(addonId) {
    if (!state.selectedProduct) {
      return null;
    }

    const cleanAddonId =
      cleanText(addonId);

    return (
      state.selectedProduct.addons || []
    ).find(function(addon) {
      return (
        cleanText(addon.addonId) ===
        cleanAddonId
      );
    }) || null;
  }

  function changeAddonQuantity(
    addonId,
    difference
  ) {
    const addon =
      getSelectedAddon(addonId);

    if (!addon) return;

    const minimum = Math.max(
      0,
      Math.floor(
        numberValue(
          addon.minimumQuantity,
          0
        )
      )
    );

    const maximum =
      getAddonMaximum(addon);

    const current = Math.max(
      minimum,
      Math.floor(
        numberValue(
          state.addonQuantities[
            addon.addonId
          ],
          minimum
        )
      )
    );

    state.addonQuantities[
      addon.addonId
    ] = Math.min(
      maximum,
      Math.max(
        minimum,
        current + difference
      )
    );

    renderProductAddons();
    updateProductModalTotal();
  }

  function buildCartItem() {
    const product =
      state.selectedProduct;

    const option =
      state.selectedOption;

    if (!product || !option) {
      return null;
    }

    const selectedAddons =
      (product.addons || [])
        .map(function(addon) {
          const quantity = Math.max(
            0,
            Math.floor(
              numberValue(
                state.addonQuantities[
                  addon.addonId
                ],
                0
              )
            )
          );

          if (quantity <= 0) {
            return null;
          }

          const unitPrice =
            numberValue(
              addon.unitPrice,
              0
            );

          return {
            addonId:
              cleanText(addon.addonId),
            addonName:
              cleanText(addon.addonName),
            unitPrice: unitPrice,
            quantity: quantity,
            total:
              unitPrice * quantity
          };
        })
        .filter(Boolean);

    const addonSignature =
      selectedAddons
        .map(function(addon) {
          return (
            addon.addonId +
            ':' +
            addon.quantity
          );
        })
        .sort()
        .join('|');

    const optionCode =
      cleanText(option.code) ||
      'DEFAULT';

    const unitPrice =
      numberValue(
        option.price,
        numberValue(
          product.basePrice,
          0
        )
      );

    const productSubtotal =
      unitPrice *
      state.productQuantity;

    const addonTotal =
      selectedAddons.reduce(
        function(total, addon) {
          return total + addon.total;
        },
        0
      );

    return {
      cartItemId:
        product.productId +
        '__' +
        optionCode +
        '__' +
        (
          addonSignature ||
          'NO_ADDONS'
        ),

      kitchenId:
        cleanText(
          state.kitchen.kitchenId
        ),

      kitchenName:
        cleanText(
          state.kitchen.kitchenName
        ),

      productId:
        cleanText(product.productId),

      productName:
        cleanText(product.productName),

      thumbnailUrl:
        cleanText(product.thumbnailUrl),

      quantityMode:
        normalize(product.quantityMode),

      unitLabel:
        cleanText(product.unitLabel),

      selectedOptionCode:
        optionCode,

      selectedOptionLabel:
        cleanText(option.label),

      selectedOptionPrice:
        unitPrice,

      unitPrice:
        unitPrice,

      quantity:
        state.productQuantity,

      minimumQuantity:
        Math.max(
          1,
          numberValue(
            product.minimumQuantity,
            1
          )
        ),

      maximumQuantity:
        getProductMaximum(product),

      availableQuantity:
        Math.max(
          0,
          numberValue(
            product.availableQuantity,
            0
          )
        ),

      productSubtotal:
        productSubtotal,

      addons:
        selectedAddons,

      addonTotal:
        addonTotal,

      itemTotal:
        productSubtotal +
        addonTotal
    };
  }

  function recalculateCartItem(item) {
    item.productSubtotal =
      numberValue(item.unitPrice, 0) *
      numberValue(item.quantity, 0);

    item.addonTotal =
      (item.addons || []).reduce(
        function(total, addon) {
          addon.total =
            numberValue(
              addon.unitPrice,
              0
            ) *
            numberValue(
              addon.quantity,
              0
            );

          return total + addon.total;
        },
        0
      );

    item.itemTotal =
      item.productSubtotal +
      item.addonTotal;

    return item;
  }

  function addCurrentProductToCart() {
    if (!state.orderingAllowed) {
      showToast(
        state.orderingReason ||
        'This Kitchen is not accepting orders right now.',
        'error'
      );
      return;
    }

    const item = buildCartItem();

    if (!item) {
      showToast(
        'Please select a quantity option.',
        'error'
      );
      return;
    }

    if (
      state.cart.items.length > 0 &&
      state.cart.kitchenId &&
      state.cart.kitchenId !==
        item.kitchenId
    ) {
      const replaceCart =
        window.confirm(
          'Your cart contains items from another Kitchen. Replace the existing cart?'
        );

      if (!replaceCart) return;

      state.cart =
        createEmptyCart();
    }

    state.cart.kitchenId =
      item.kitchenId;

    state.cart.kitchenName =
      item.kitchenName;

    const existing =
      state.cart.items.find(
        function(cartItem) {
          return (
            cleanText(
              cartItem.cartItemId
            ) ===
            item.cartItemId
          );
        }
      );

    if (existing) {
      const nextQuantity =
        Math.floor(
          numberValue(
            existing.quantity,
            0
          ) +
          item.quantity
        );

      if (
        nextQuantity >
        item.maximumQuantity
      ) {
        showToast(
          'Maximum available quantity is ' +
          item.maximumQuantity +
          '.',
          'error'
        );
        return;
      }

      existing.quantity =
        nextQuantity;

      recalculateCartItem(existing);
    } else {
      state.cart.items.push(item);
    }

    saveCart();
    renderProducts();
    closeProductModal();

    showToast(
      item.productName +
      ' added to cart.',
      'success'
    );
  }

  /*
   * Continue directly with Part 3 below this line.
   */
   function handleProductListClick(event) {
    const button =
      event.target.closest(
        '[data-product-id]'
      );

    if (!button || button.disabled) {
      return;
    }

    const product =
      getProductById(
        button.dataset.productId
      );

    if (product) {
      openProductModal(product);
    }
  }

  function handleOptionChange(event) {
    const input =
      event.target.closest(
        'input[name="customer-product-option"]'
      );

    if (
      !input ||
      !state.selectedProduct
    ) {
      return;
    }

    const selectedCode =
      cleanText(input.value);

    state.selectedOption =
      (
        state.selectedProduct
          .quantityOptions || []
      ).find(function(option) {
        return (
          cleanText(option.code) ===
          selectedCode
        );
      }) || null;

    setHidden(
      elements.optionError,
      Boolean(state.selectedOption)
    );

    updateProductModalTotal();
  }

  function handleAddonClick(event) {
    const minusButton =
      event.target.closest(
        '[data-addon-minus]'
      );

    if (minusButton) {
      changeAddonQuantity(
        minusButton.dataset.addonId,
        -1
      );
      return;
    }

    const plusButton =
      event.target.closest(
        '[data-addon-plus]'
      );

    if (plusButton) {
      changeAddonQuantity(
        plusButton.dataset.addonId,
        1
      );
    }
  }

  function handleCategoryClick(event) {
    const button =
      event.target.closest(
        '[data-category]'
      );

    if (!button) return;

    state.category =
      normalize(
        button.dataset.category
      ) || 'ALL';

    elements.categories
      .querySelectorAll(
        '[data-category]'
      )
      .forEach(function(item) {
        const active =
          normalize(
            item.dataset.category
          ) === state.category;

        item.classList.toggle(
          'customer-kitchen-category--active',
          active
        );

        item.setAttribute(
          'aria-pressed',
          active ? 'true' : 'false'
        );
      });

    renderProducts();
  }

  function handleSearchInput() {
    state.search =
      cleanText(
        elements.searchInput.value
      ).toLowerCase();

    renderProducts();
  }

  function handleCartBarClick() {
    if (!state.cart.items.length) {
      return;
    }

    /*
     * cart-checkout.html will be connected
     * in the next module.
     */
    showToast(
      'Cart is saved. Checkout will be connected next.',
      'success'
    );
  }

  function bindEvents() {
    elements.refreshButton.addEventListener(
      'click',
      function() {
        loadKitchenMenu();
      }
    );

    elements.retryButton.addEventListener(
      'click',
      function() {
        loadKitchenMenu();
      }
    );

    elements.products.addEventListener(
      'click',
      handleProductListClick
    );

    elements.categories.addEventListener(
      'click',
      handleCategoryClick
    );

    elements.searchInput.addEventListener(
      'input',
      handleSearchInput
    );

    elements.modalClose.addEventListener(
      'click',
      closeProductModal
    );

    document
      .querySelectorAll(
        '[data-close-product-modal]'
      )
      .forEach(function(item) {
        item.addEventListener(
          'click',
          closeProductModal
        );
      });

    elements.options.addEventListener(
      'change',
      handleOptionChange
    );

    elements.addons.addEventListener(
      'click',
      handleAddonClick
    );

    elements.quantityMinus.addEventListener(
      'click',
      function() {
        changeProductQuantity(-1);
      }
    );

    elements.quantityPlus.addEventListener(
      'click',
      function() {
        changeProductQuantity(1);
      }
    );

    elements.addButton.addEventListener(
      'click',
      addCurrentProductToCart
    );

    elements.cartBar.addEventListener(
      'click',
      handleCartBarClick
    );

    document.addEventListener(
      'keydown',
      function(event) {
        if (
          event.key === 'Escape' &&
          !elements.modal.hidden
        ) {
          closeProductModal();
        }
      }
    );

    window.addEventListener(
      'pageshow',
      function(event) {
        if (!event.persisted) return;

        loadCart();
        renderCartBar();

        if (state.kitchen) {
          renderProducts();
        }
      }
    );

    window.addEventListener(
      'storage',
      function(event) {
        if (
          event.key !== CART_STORAGE_KEY
        ) {
          return;
        }

        loadCart();
        renderCartBar();

        if (state.kitchen) {
          renderProducts();
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList.contains(
        'customer-kitchen-page'
      )
    ) {
      return;
    }

    collectElements();

    if (!requiredElementsAvailable()) {
      console.error(
        'Customer Kitchen page elements are incomplete.'
      );
      return;
    }

    state.kitchenId =
      getKitchenIdFromUrl();

    loadCart();
    renderCartBar();
    bindEvents();

    if (!state.kitchenId) {
      showPageError(
        'Kitchen not selected',
        'Please return to Home and select a Kitchen.'
      );
      return;
    }

    try {
      const authenticated =
        await validateCustomerSession();

      if (!authenticated) {
        return;
      }

      await loadKitchenMenu();
    } catch (error) {
      showPageError(
        'Kitchen could not be loaded',
        cleanText(error && error.message) ||
        'Please check your connection and try again.'
      );

      handleApiError(error);
    }
  }

  window.ApnaBiteCustomerKitchen = {
    refresh: function() {
      return loadKitchenMenu();
    },

    openProduct: function(productId) {
      const product =
        getProductById(productId);

      if (product) {
        openProductModal(product);
      }
    },

    closeProduct:
      closeProductModal,

    getCart: function() {
      return JSON.parse(
        JSON.stringify(state.cart)
      );
    }
  };

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );
  } else {
    initialize();
  }
})(window, document);
