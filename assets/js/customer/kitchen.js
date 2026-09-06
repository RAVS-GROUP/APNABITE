/**
 * ============================================================
 * APNABITE V1 — CUSTOMER KITCHEN MENU CONTROLLER
 * File: assets/js/customer/kitchen.js
 * Complete file — Part 1 of 3
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CART_STORAGE_KEY =
    'apnabite_cart_v1';

  const state = {
    initialized: false,
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

  function getElements() {
    elements.refreshButton =
      byId('customer-kitchen-refresh-button');
    elements.headerName =
      byId('customer-kitchen-header-name');
    elements.loading =
      byId('customer-kitchen-loading');
    elements.error =
      byId('customer-kitchen-error');
    elements.errorTitle =
      byId('customer-kitchen-error-title');
    elements.errorMessage =
      byId('customer-kitchen-error-message');
    elements.retryButton =
      byId('customer-kitchen-retry-button');
    elements.content =
      byId('customer-kitchen-content');

    elements.kitchenImage =
      byId('customer-kitchen-image');
    elements.kitchenStatus =
      byId('customer-kitchen-status');
    elements.kitchenFoodType =
      byId('customer-kitchen-food-type');
    elements.kitchenName =
      byId('customer-kitchen-name');
    elements.kitchenRating =
      byId('customer-kitchen-rating');
    elements.kitchenRatingCount =
      byId('customer-kitchen-rating-count');
    elements.kitchenDescription =
      byId('customer-kitchen-description');
    elements.kitchenPreparation =
      byId('customer-kitchen-preparation');
    elements.kitchenMinimumOrder =
      byId('customer-kitchen-minimum-order');
    elements.kitchenProductCount =
      byId('customer-kitchen-product-count');

    elements.closedNote =
      byId('customer-kitchen-closed-note');
    elements.orderingReason =
      byId('customer-kitchen-ordering-reason');
    elements.searchInput =
      byId('customer-kitchen-search-input');
    elements.categories =
      byId('customer-kitchen-categories');
    elements.empty =
      byId('customer-kitchen-empty');
    elements.products =
      byId('customer-kitchen-products');

    elements.cartBar =
      byId('customer-kitchen-cart-bar');
    elements.cartCount =
      byId('customer-kitchen-cart-count');
    elements.cartTotal =
      byId('customer-kitchen-cart-total');

    elements.productModal =
      byId('customer-product-modal');
    elements.productModalClose =
      byId('customer-product-modal-close');
    elements.productModalImage =
      byId('customer-product-modal-image');
    elements.productModalFoodType =
      byId('customer-product-modal-food-type');
    elements.productModalName =
      byId('customer-product-modal-name');
    elements.productModalPrice =
      byId('customer-product-modal-price');
    elements.productModalDescription =
      byId('customer-product-modal-description');

    elements.optionSection =
      byId('customer-product-option-section');
    elements.optionTitle =
      byId('customer-product-option-title');
    elements.options =
      byId('customer-product-options');
    elements.optionError =
      byId('customer-product-option-error');

    elements.addonSection =
      byId('customer-product-addon-section');
    elements.addons =
      byId('customer-product-addons');
    elements.addonTemplate =
      byId('customer-product-addon-template');

    elements.quantityHelp =
      byId('customer-product-quantity-help');
    elements.quantityMinus =
      byId('customer-product-quantity-minus');
    elements.quantityValue =
      byId('customer-product-quantity');
    elements.quantityPlus =
      byId('customer-product-quantity-plus');
    elements.addProductButton =
      byId('customer-product-add-button');
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalize(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function numberValue(value, fallback) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : fallback;
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

  function setHidden(element, hidden) {
    if (element) {
      element.hidden = Boolean(hidden);
    }
  }

  function setText(element, value) {
    if (element) {
      element.textContent = String(
        value === undefined ||
        value === null
          ? ''
          : value
      );
    }
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatCurrency(value) {
    return '₹' +
      numberValue(value, 0).toLocaleString(
        'en-IN',
        {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }
      );
  }

  function humanize(value) {
    return normalize(value)
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, function(letter) {
        return letter.toUpperCase();
      });
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI.showToast ===
        'function'
    ) {
      window.ApnaBiteUI.showToast(
        message,
        type || 'info'
      );
    }
  }

  function handleApiError(error) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI.handleApiError ===
        'function'
    ) {
      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );
      return;
    }

    showToast(
      cleanText(error && error.message) ||
      'Something went wrong.',
      'error'
    );
  }

  function getKitchenIdFromUrl() {
    const parameters =
      new URLSearchParams(
        window.location.search
      );

    return cleanText(
      parameters.get('kitchenId')
    );
  }

  function getProductById(productId) {
    return state.products.find(
      function(product) {
        return (
          product.productId === productId
        );
      }
    ) || null;
  }

  function getProductCartQuantity(productId) {
    return state.cart.items.reduce(
      function(total, item) {
        return item.productId === productId
          ? total + numberValue(
              item.quantity,
              0
            )
          : total;
      },
      0
    );
  }

  function loadCart() {
    try {
      const stored = window.localStorage
        .getItem(CART_STORAGE_KEY);

      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);

      if (
        parsed &&
        Array.isArray(parsed.items)
      ) {
        state.cart = {
          version: 1,
          kitchenId: cleanText(
            parsed.kitchenId
          ),
          kitchenName: cleanText(
            parsed.kitchenName
          ),
          items: parsed.items,
          updatedAt: cleanText(
            parsed.updatedAt
          )
        };
      }
    } catch (error) {
      window.localStorage.removeItem(
        CART_STORAGE_KEY
      );
    }
  }

  function saveCart() {
    state.cart.updatedAt =
      new Date().toISOString();

    window.localStorage.setItem(
      CART_STORAGE_KEY,
      JSON.stringify(state.cart)
    );

    renderCartBar();
  }

  function calculateCartSummary() {
    return state.cart.items.reduce(
      function(summary, item) {
        summary.count += numberValue(
          item.quantity,
          0
        );

        summary.total += numberValue(
          item.itemTotal,
          0
        );

        return summary;
      },
      {
        count: 0,
        total: 0
      }
    );
  }

  function renderCartBar() {
    const summary =
      calculateCartSummary();

    setText(
      elements.cartCount,
      summary.count
    );

    setText(
      elements.cartTotal,
      formatCurrency(summary.total)
    );

    setHidden(
      elements.cartBar,
      summary.count <= 0
    );
  }

  function productMatchesFilter(product) {
    if (
      state.category !== 'ALL' &&
      normalize(product.category) !==
        state.category
    ) {
      return false;
    }

    if (state.search) {
      const searchable = [
        product.productName,
        product.category,
        product.foodType,
        product.description,
        product.unitLabel
      ].join(' ').toLowerCase();

      if (
        searchable.indexOf(
          state.search
        ) === -1
      ) {
        return false;
      }
    }

    return true;
  }

  function renderKitchen() {
    const kitchen = state.kitchen;

    if (!kitchen) {
      return;
    }

    setText(
      elements.headerName,
      kitchen.kitchenName
    );

    setText(
      elements.kitchenName,
      kitchen.kitchenName
    );

    setText(
      elements.kitchenFoodType,
      humanize(kitchen.foodType)
    );

    setText(
      elements.kitchenDescription,
      kitchen.description
    );

    setText(
      elements.kitchenPreparation,
      kitchen.averagePreparationMinutes
    );

    setText(
      elements.kitchenMinimumOrder,
      formatCurrency(
        kitchen.minimumOrderValue
      )
    );

    setText(
      elements.kitchenProductCount,
      kitchen.productCount
    );

    if (kitchen.thumbnailUrl) {
      elements.kitchenImage.src =
        kitchen.thumbnailUrl;
      elements.kitchenImage.alt =
        kitchen.kitchenName;
    }

    if (
      numberValue(
        kitchen.ratingCount,
        0
      ) > 0
    ) {
      setText(
        elements.kitchenRating,
        '★ ' + kitchen.averageRating
      );

      setText(
        elements.kitchenRatingCount,
        kitchen.ratingCount + ' ratings'
      );
    } else {
      setText(
        elements.kitchenRating,
        'New'
      );

      setText(
        elements.kitchenRatingCount,
        'No ratings'
      );
    }

    elements.kitchenStatus.classList.remove(
      'customer-kitchen-status--open',
      'customer-kitchen-status--closed'
    );

    elements.kitchenStatus.classList.add(
      kitchen.isOpen
        ? 'customer-kitchen-status--open'
        : 'customer-kitchen-status--closed'
    );

    setText(
      elements.kitchenStatus,
      kitchen.isOpen ? 'OPEN' : 'CLOSED'
    );

    setHidden(
      elements.closedNote,
      state.orderingAllowed
    );

    setText(
      elements.orderingReason,
      state.orderingReason ||
      'Kitchen is currently unavailable.'
    );
  }

  function renderCategories() {
    const categories = ['ALL'];

    state.products.forEach(
      function(product) {
        const category = normalize(
          product.category
        );

        if (
          category &&
          categories.indexOf(
            category
          ) === -1
        ) {
          categories.push(category);
        }
      }
    );

    elements.categories.innerHTML =
      categories.map(function(category) {
        return (
          '<button class="customer-kitchen-category' +
          (
            state.category === category
              ? ' customer-kitchen-category--active'
              : ''
          ) +
          '" type="button" data-category="' +
          escapeHtml(category) +
          '">' +
          escapeHtml(
            category === 'ALL'
              ? 'All'
              : humanize(category)
          ) +
          '</button>'
        );
      }).join('');
  }

  function renderProductCard(product) {
    const quantityMode =
      normalize(product.quantityMode) ||
      'COUNT';

    const cartQuantity =
      getProductCartQuantity(
        product.productId
      );

    const priceText =
      quantityMode === 'COUNT'
        ? (
          'per ' +
          cleanText(
            product.unitLabel || 'Piece'
          )
        )
        : 'starting price';

    const foodClass =
      normalize(product.foodType) ===
      'NON_VEG'
        ? ' customer-product-card__food-marker--non-veg'
        : '';

    const imageUrl =
      product.thumbnailUrl ||
      '../assets/images/logo.png';

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
            escapeHtml(
              humanize(product.category)
            ) +
          '</span>' +

          '<h3>' +
            escapeHtml(product.productName) +
          '</h3>' +

          '<p class="customer-product-card__description">' +
            escapeHtml(product.description) +
          '</p>' +

          '<div class="customer-product-card__price">' +
            '<strong>' +
              escapeHtml(
                formatCurrency(
                  product.startingPrice ||
                  product.basePrice
                )
              ) +
            '</strong>' +

            '<small>' +
              escapeHtml(priceText) +
            '</small>' +
          '</div>' +

          '<div class="customer-product-card__meta">' +
            escapeHtml(
              product.preparationMinutes
            ) +
            ' min · ' +
            escapeHtml(
              product.availableQuantity
            ) +
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

          '<button class="button button--primary" type="button" data-product-id="' +
            escapeHtml(product.productId) +
            '"' +
            (
              state.orderingAllowed
                ? ''
                : ' disabled'
            ) +
          '>' +
            (
              quantityMode === 'COUNT' &&
              !(product.addons || []).length
                ? 'ADD'
                : 'CUSTOMISE'
            ) +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProducts() {
    const visibleProducts =
      state.products.filter(
        productMatchesFilter
      );

    setHidden(
      elements.empty,
      visibleProducts.length > 0
    );

    elements.products.innerHTML =
      visibleProducts.map(
        renderProductCard
      ).join('');
  }

  function renderPage() {
    renderKitchen();
    renderCategories();
    renderProducts();
    renderCartBar();
  }

  async function validateCustomerSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      throw new Error(
        'Required application files did not load.'
      );
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession === 'function' &&
      !window.ApnaBiteCore.requireLocalSession(
        ['CUSTOMER']
      )
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
        typeof window.ApnaBiteCore
          .redirectToRoleHome === 'function'
      ) {
        window.ApnaBiteCore
          .redirectToRoleHome(
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
    if (state.loading) {
      return;
    }

    state.loading = true;

    setHidden(elements.loading, false);
    setHidden(elements.error, true);
    setHidden(elements.content, true);

    if (elements.refreshButton) {
      elements.refreshButton.disabled = true;
    }

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

      state.orderingAllowed =
        Boolean(
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
      setHidden(elements.loading, true);
      setHidden(elements.content, true);
      setHidden(elements.error, false);

      setText(
        elements.errorMessage,
        cleanText(error && error.message) ||
        'Kitchen menu could not be loaded.'
      );

      handleApiError(error);
    } finally {
      state.loading = false;

      if (elements.refreshButton) {
        elements.refreshButton.disabled =
          false;
      }
    }
  }

  /*
   * Continue directly with Part 2 below this line.
   */
   function setProductModalImage(product) {
    const imageUrl =
      cleanText(
        product.detailImageUrl ||
        product.thumbnailUrl
      ) ||
      '../assets/images/logo.png';

    elements.modalImage.src =
      imageUrl;

    elements.modalImage.alt =
      cleanText(
        product.productName
      ) || 'Product';

    elements.modalImage.onerror =
      function() {
        this.onerror = null;
        this.src =
          '../assets/images/logo.png';
      };
  }

  function resetProductSelection(
    product
  ) {
    state.selectedProduct =
      product;

    state.productQuantity =
      Math.max(
        1,
        Math.floor(
          numberValue(
            product.minimumQuantity,
            1
          )
        )
      );

    state.addonQuantities = {};

    (product.addons || [])
      .forEach(function(addon) {
        state.addonQuantities[
          addon.addonId
        ] =
          Math.max(
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
      normalize(
        product.quantityMode
      ) === 'COUNT'
    ) {
      state.selectedOption = {
        code: 'DEFAULT',
        label:
          cleanText(
            product.unitLabel
          ) || 'Piece',
        price:
          numberValue(
            product.basePrice,
            0
          )
      };

      return;
    }

    const options =
      Array.isArray(
        product.quantityOptions
      )
        ? product.quantityOptions
        : [];

    state.selectedOption =
      options.length
        ? options[0]
        : null;
  }

  function openProductModal(
    product
  ) {
    if (!product) {
      showToast(
        'Product could not be found.',
        'error'
      );

      return;
    }

    if (
      !state.kitchen ||
      !state.kitchen.orderingAllowed
    ) {
      showToast(
        cleanText(
          state.kitchen &&
          state.kitchen.orderingReason
        ) ||
        'This Kitchen is not accepting orders right now.',
        'error'
      );

      return;
    }

    resetProductSelection(
      product
    );

    setProductModalImage(
      product
    );

    setText(
      elements.modalFoodType,
      normalize(
        product.foodType
      ) === 'NON_VEG'
        ? 'NON-VEG'
        : 'VEG'
    );

    elements.modalFoodType
      .classList.toggle(
        'customer-product-food-type--non-veg',
        normalize(
          product.foodType
        ) === 'NON_VEG'
      );

    setText(
      elements.modalName,
      cleanText(
        product.productName
      ) || 'Product'
    );

    setText(
      elements.modalDescription,
      cleanText(
        product.description
      ) ||
      'Fresh homemade food.'
    );

    renderProductOptions();
    renderProductAddons();
    updateProductQuantityDisplay();
    updateProductModalTotal();

    setHidden(
      elements.modal,
      false
    );

    elements.modal.setAttribute(
      'aria-hidden',
      'false'
    );

    document.body.classList.add(
      'customer-product-modal-open'
    );

    document.body.style.overflow =
      'hidden';
  }

  function closeProductModal() {
    setHidden(
      elements.modal,
      true
    );

    elements.modal.setAttribute(
      'aria-hidden',
      'true'
    );

    document.body.classList.remove(
      'customer-product-modal-open'
    );

    document.body.style.overflow =
      '';

    state.selectedProduct = null;
    state.selectedOption = null;
    state.productQuantity = 1;
    state.addonQuantities = {};
  }

  function renderProductOptions() {
    const product =
      state.selectedProduct;

    if (!product) return;

    const quantityMode =
      normalize(
        product.quantityMode
      );

    const options =
      Array.isArray(
        product.quantityOptions
      )
        ? product.quantityOptions
        : [];

    if (
      quantityMode === 'COUNT'
    ) {
      setHidden(
        elements.optionSection,
        true
      );

      elements.options.innerHTML =
        '';

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
      elements.options.innerHTML =
        '';

      setText(
        elements.optionError,
        'No quantity option is available.'
      );

      setHidden(
        elements.optionError,
        false
      );

      state.selectedOption = null;

      return;
    }

    setHidden(
      elements.optionError,
      true
    );

    elements.options.innerHTML =
      options.map(
        function(option, index) {
          const code =
            cleanText(
              option.code
            );

          const checked =
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
                (
                  checked
                    ? ' checked'
                    : ''
                ) +
              '>' +
              '<span class="customer-product-option__content">' +
                '<strong>' +
                  escapeHtml(
                    option.label
                  ) +
                '</strong>' +
                '<small>' +
                  formatCurrency(
                    option.price
                  ) +
                '</small>' +
              '</span>' +
            '</label>'
          );
        }
      ).join('');
  }

  function renderProductAddons() {
    const product =
      state.selectedProduct;

    if (!product) return;

    const addons =
      Array.isArray(
        product.addons
      )
        ? product.addons
        : [];

    if (!addons.length) {
      elements.addons.innerHTML =
        '';

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

    elements.addons.innerHTML = '';

    addons.forEach(function(addon) {
      const addonId =
        cleanText(
          addon.addonId
        );

      const quantity =
        Math.max(
          0,
          Math.floor(
            numberValue(
              state.addonQuantities[
                addonId
              ],
              0
            )
          )
        );

      let node = null;

      if (
        elements.addonTemplate &&
        elements.addonTemplate.content
      ) {
        const fragment =
          elements.addonTemplate
            .content
            .cloneNode(true);

        node =
          fragment.firstElementChild;

        if (node) {
          node.dataset.addonId =
            addonId;

          setText(
            node.querySelector(
              '[data-addon-name]'
            ),
            addon.addonName
          );

          setText(
            node.querySelector(
              '[data-addon-price]'
            ),
            '+ ' +
            formatCurrency(
              addon.unitPrice
            )
          );

          setText(
            node.querySelector(
              '[data-addon-quantity]'
            ),
            quantity
          );

          const minusButton =
            node.querySelector(
              '[data-addon-minus]'
            );

          const plusButton =
            node.querySelector(
              '[data-addon-plus]'
            );

          if (minusButton) {
            minusButton.dataset.addonId =
              addonId;
          }

          if (plusButton) {
            plusButton.dataset.addonId =
              addonId;
          }

          elements.addons.appendChild(
            fragment
          );
        }
      }

      if (node) return;

      elements.addons.insertAdjacentHTML(
        'beforeend',
        '<article class="customer-product-addon" data-addon-id="' +
          escapeHtml(addonId) +
        '">' +
          '<div>' +
            '<strong>' +
              escapeHtml(
                addon.addonName
              ) +
            '</strong>' +
            '<small>+ ' +
              formatCurrency(
                addon.unitPrice
              ) +
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

  function getSelectedUnitPrice() {
    if (!state.selectedProduct) {
      return 0;
    }

    if (
      state.selectedOption &&
      numberValue(
        state.selectedOption.price,
        0
      ) > 0
    ) {
      return numberValue(
        state.selectedOption.price,
        0
      );
    }

    return numberValue(
      state.selectedProduct.basePrice,
      0
    );
  }

  function calculateSelectedAddonTotal() {
    const product =
      state.selectedProduct;

    if (!product) return 0;

    return (
      product.addons || []
    ).reduce(
      function(total, addon) {
        const quantity =
          Math.max(
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

        return (
          total +
          (
            numberValue(
              addon.unitPrice,
              0
            ) *
            quantity
          )
        );
      },
      0
    );
  }

  function calculateCurrentItemTotal() {
    return (
      getSelectedUnitPrice() *
      state.productQuantity
    ) +
    calculateSelectedAddonTotal();
  }

  function updateProductQuantityDisplay() {
    const product =
      state.selectedProduct;

    if (!product) return;

    const minimum =
      Math.max(
        1,
        Math.floor(
          numberValue(
            product.minimumQuantity,
            1
          )
        )
      );

    const maximum =
      Math.max(
        minimum,
        Math.min(
          Math.floor(
            numberValue(
              product.maximumQuantity,
              minimum
            )
          ),
          Math.floor(
            numberValue(
              product.availableQuantity,
              minimum
            )
          )
        )
      );

    state.productQuantity =
      Math.min(
        maximum,
        Math.max(
          minimum,
          state.productQuantity
        )
      );

    setText(
      elements.quantity,
      state.productQuantity
    );

    elements.quantityMinus.disabled =
      state.productQuantity <=
      minimum;

    elements.quantityPlus.disabled =
      state.productQuantity >=
      maximum;

    setText(
      elements.quantityHelp,
      'Minimum ' +
      minimum +
      ' · Maximum ' +
      maximum
    );
  }

  function updateProductModalTotal() {
    if (!state.selectedProduct) {
      return;
    }

    const unitPrice =
      getSelectedUnitPrice();

    setText(
      elements.modalPrice,
      normalize(
        state.selectedProduct
          .quantityMode
      ) === 'COUNT'
        ? formatCurrency(unitPrice) +
          ' / ' +
          (
            cleanText(
              state.selectedProduct
                .unitLabel
            ) || 'Piece'
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

  function changeProductQuantity(
    difference
  ) {
    const product =
      state.selectedProduct;

    if (!product) return;

    const minimum =
      Math.max(
        1,
        Math.floor(
          numberValue(
            product.minimumQuantity,
            1
          )
        )
      );

    const maximum =
      Math.max(
        minimum,
        Math.min(
          Math.floor(
            numberValue(
              product.maximumQuantity,
              minimum
            )
          ),
          Math.floor(
            numberValue(
              product.availableQuantity,
              minimum
            )
          )
        )
      );

    state.productQuantity =
      Math.min(
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

  function findSelectedAddon(
    addonId
  ) {
    const product =
      state.selectedProduct;

    if (!product) return null;

    return (
      product.addons || []
    ).find(function(addon) {
      return (
        cleanText(
          addon.addonId
        ) ===
        cleanText(addonId)
      );
    }) || null;
  }

  function changeAddonQuantity(
    addonId,
    difference
  ) {
    const addon =
      findSelectedAddon(
        addonId
      );

    if (!addon) return;

    const minimum =
      Math.max(
        0,
        Math.floor(
          numberValue(
            addon.minimumQuantity,
            0
          )
        )
      );

    const maximum =
      Math.max(
        minimum,
        Math.min(
          Math.floor(
            numberValue(
              addon.maximumQuantity,
              minimum
            )
          ),
          Math.floor(
            numberValue(
              addon.availableQuantity,
              minimum
            )
          )
        )
      );

    const current =
      Math.max(
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
    ] =
      Math.min(
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

    if (
      !product ||
      !option
    ) {
      return null;
    }

    const selectedAddons =
      (product.addons || [])
        .map(function(addon) {
          const quantity =
            Math.max(
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
              cleanText(
                addon.addonId
              ),

            addonName:
              cleanText(
                addon.addonName
              ),

            unitPrice:
              unitPrice,

            quantity:
              quantity,

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
      cleanText(
        option.code
      ) || 'DEFAULT';

    const unitPrice =
      numberValue(
        option.price,
        product.basePrice
      );

    const productSubtotal =
      unitPrice *
      state.productQuantity;

    const addonTotal =
      selectedAddons.reduce(
        function(total, addon) {
          return (
            total +
            addon.total
          );
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
        cleanText(
          product.productId
        ),

      productName:
        cleanText(
          product.productName
        ),

      thumbnailUrl:
        cleanText(
          product.thumbnailUrl
        ),

      quantityMode:
        normalize(
          product.quantityMode
        ),

      unitLabel:
        cleanText(
          product.unitLabel
        ),

      selectedOptionCode:
        optionCode,

      selectedOptionLabel:
        cleanText(
          option.label
        ),

      selectedOptionPrice:
        unitPrice,

      unitPrice:
        unitPrice,

      quantity:
        state.productQuantity,

      minimumQuantity:
        numberValue(
          product.minimumQuantity,
          1
        ),

      maximumQuantity:
        numberValue(
          product.maximumQuantity,
          1
        ),

      availableQuantity:
        numberValue(
          product.availableQuantity,
          0
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

  function recalculateCartItem(
    item
  ) {
    item.productSubtotal =
      numberValue(
        item.unitPrice,
        0
      ) *
      numberValue(
        item.quantity,
        0
      );

    item.addonTotal =
      (item.addons || [])
        .reduce(
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

            return (
              total +
              addon.total
            );
          },
          0
        );

    item.itemTotal =
      item.productSubtotal +
      item.addonTotal;

    return item;
  }

  function addCurrentProductToCart() {
    if (
      !state.kitchen ||
      !state.kitchen.orderingAllowed
    ) {
      showToast(
        'This Kitchen is not accepting orders right now.',
        'error'
      );

      return;
    }

    const item =
      buildCartItem();

    if (!item) {
      showToast(
        'Please select a quantity option.',
        'error'
      );

      return;
    }

    const differentKitchenItem =
      state.cart.find(
        function(cartItem) {
          return (
            cleanText(
              cartItem.kitchenId
            ) !==
            item.kitchenId
          );
        }
      );

    if (differentKitchenItem) {
      const replaceCart =
        window.confirm(
          'Your cart contains items from another Kitchen. Replace the existing cart?'
        );

      if (!replaceCart) {
        return;
      }

      state.cart = [];
    }

    const existing =
      state.cart.find(
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
      const maximum =
        Math.max(
          1,
          Math.min(
            numberValue(
              item.maximumQuantity,
              1
            ),
            numberValue(
              item.availableQuantity,
              1
            )
          )
        );

      const nextQuantity =
        numberValue(
          existing.quantity,
          0
        ) +
        item.quantity;

      if (
        nextQuantity >
        maximum
      ) {
        showToast(
          'Maximum available quantity is ' +
          maximum +
          '.',
          'error'
        );

        return;
      }

      existing.quantity =
        nextQuantity;

      recalculateCartItem(
        existing
      );
    } else {
      state.cart.push(
        item
      );
    }

    saveCart();
    renderCartBar();
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
    const card =
      event.target.closest(
        '[data-product-id]'
      );

    if (!card) return;

    const productId =
      cleanText(
        card.dataset.productId
      );

    const product =
      findProduct(productId);

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
      Boolean(
        state.selectedOption
      )
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

    state.selectedCategory =
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
          ) ===
          state.selectedCategory;

        item.classList.toggle(
          'customer-kitchen-category--active',
          active
        );

        item.setAttribute(
          'aria-pressed',
          active
            ? 'true'
            : 'false'
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
    if (!state.cart.length) {
      return;
    }

    /*
     * Checkout frontend will be connected in
     * the next module. Cart remains safely
     * stored in localStorage meanwhile.
     */
    showToast(
      'Cart is saved. Checkout will be connected in the next module.',
      'success'
    );
  }

  function bindEvents() {
    elements.refreshButton
      .addEventListener(
        'click',
        function() {
          loadKitchenMenu(true);
        }
      );

    elements.retryButton
      .addEventListener(
        'click',
        function() {
          loadKitchenMenu(true);
        }
      );

    elements.products
      .addEventListener(
        'click',
        handleProductListClick
      );

    elements.categories
      .addEventListener(
        'click',
        handleCategoryClick
      );

    elements.searchInput
      .addEventListener(
        'input',
        handleSearchInput
      );

    elements.modalClose
      .addEventListener(
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

    elements.options
      .addEventListener(
        'change',
        handleOptionChange
      );

    elements.addons
      .addEventListener(
        'click',
        handleAddonClick
      );

    elements.quantityMinus
      .addEventListener(
        'click',
        function() {
          changeProductQuantity(-1);
        }
      );

    elements.quantityPlus
      .addEventListener(
        'click',
        function() {
          changeProductQuantity(1);
        }
      );

    elements.addButton
      .addEventListener(
        'click',
        addCurrentProductToCart
      );

    elements.cartBar
      .addEventListener(
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
        if (!event.persisted) {
          return;
        }

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
          event.key ===
          CART_STORAGE_KEY
        ) {
          loadCart();
          renderCartBar();

          if (state.kitchen) {
            renderProducts();
          }
        }
      }
    );
  }

  function collectElements() {
    elements.refreshButton =
      document.getElementById(
        'customer-kitchen-refresh-button'
      );

    elements.headerName =
      document.getElementById(
        'customer-kitchen-header-name'
      );

    elements.loading =
      document.getElementById(
        'customer-kitchen-loading'
      );

    elements.error =
      document.getElementById(
        'customer-kitchen-error'
      );

    elements.errorTitle =
      document.getElementById(
        'customer-kitchen-error-title'
      );

    elements.errorMessage =
      document.getElementById(
        'customer-kitchen-error-message'
      );

    elements.retryButton =
      document.getElementById(
        'customer-kitchen-retry-button'
      );

    elements.content =
      document.getElementById(
        'customer-kitchen-content'
      );

    elements.kitchenImage =
      document.getElementById(
        'customer-kitchen-image'
      );

    elements.kitchenStatus =
      document.getElementById(
        'customer-kitchen-status'
      );

    elements.kitchenFoodType =
      document.getElementById(
        'customer-kitchen-food-type'
      );

    elements.kitchenName =
      document.getElementById(
        'customer-kitchen-name'
      );

    elements.kitchenRating =
      document.getElementById(
        'customer-kitchen-rating'
      );

    elements.kitchenRatingCount =
      document.getElementById(
        'customer-kitchen-rating-count'
      );

    elements.kitchenDescription =
      document.getElementById(
        'customer-kitchen-description'
      );

    elements.kitchenPreparation =
      document.getElementById(
        'customer-kitchen-preparation'
      );

    elements.kitchenMinimumOrder =
      document.getElementById(
        'customer-kitchen-minimum-order'
      );

    elements.kitchenProductCount =
      document.getElementById(
        'customer-kitchen-product-count'
      );

    elements.closedNote =
      document.getElementById(
        'customer-kitchen-closed-note'
      );

    elements.orderingReason =
      document.getElementById(
        'customer-kitchen-ordering-reason'
      );

    elements.searchInput =
      document.getElementById(
        'customer-kitchen-search-input'
      );

    elements.categories =
      document.getElementById(
        'customer-kitchen-categories'
      );

    elements.empty =
      document.getElementById(
        'customer-kitchen-empty'
      );

    elements.products =
      document.getElementById(
        'customer-kitchen-products'
      );

    elements.cartBar =
      document.getElementById(
        'customer-kitchen-cart-bar'
      );

    elements.cartCount =
      document.getElementById(
        'customer-kitchen-cart-count'
      );

    elements.cartTotal =
      document.getElementById(
        'customer-kitchen-cart-total'
      );

    elements.modal =
      document.getElementById(
        'customer-product-modal'
      );

    elements.modalClose =
      document.getElementById(
        'customer-product-modal-close'
      );

    elements.modalImage =
      document.getElementById(
        'customer-product-modal-image'
      );

    elements.modalFoodType =
      document.getElementById(
        'customer-product-modal-food-type'
      );

    elements.modalName =
      document.getElementById(
        'customer-product-modal-name'
      );

    elements.modalPrice =
      document.getElementById(
        'customer-product-modal-price'
      );

    elements.modalDescription =
      document.getElementById(
        'customer-product-modal-description'
      );

    elements.optionSection =
      document.getElementById(
        'customer-product-option-section'
      );

    elements.optionTitle =
      document.getElementById(
        'customer-product-option-title'
      );

    elements.options =
      document.getElementById(
        'customer-product-options'
      );

    elements.optionError =
      document.getElementById(
        'customer-product-option-error'
      );

    elements.addonSection =
      document.getElementById(
        'customer-product-addon-section'
      );

    elements.addons =
      document.getElementById(
        'customer-product-addons'
      );

    elements.addonTemplate =
      document.getElementById(
        'customer-product-addon-template'
      );

    elements.quantityHelp =
      document.getElementById(
        'customer-product-quantity-help'
      );

    elements.quantityMinus =
      document.getElementById(
        'customer-product-quantity-minus'
      );

    elements.quantity =
      document.getElementById(
        'customer-product-quantity'
      );

    elements.quantityPlus =
      document.getElementById(
        'customer-product-quantity-plus'
      );

    elements.addButton =
      document.getElementById(
        'customer-product-add-button'
      );
  }

  function requiredElementsAvailable() {
    const required = [
      'refreshButton',
      'loading',
      'error',
      'retryButton',
      'content',
      'categories',
      'searchInput',
      'products',
      'empty',
      'cartBar',
      'modal',
      'modalClose',
      'options',
      'addons',
      'quantityMinus',
      'quantity',
      'quantityPlus',
      'addButton'
    ];

    return required.every(
      function(key) {
        return Boolean(
          elements[key]
        );
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains(
          'customer-kitchen-page'
        )
    ) {
      return;
    }

    collectElements();

    if (
      !requiredElementsAvailable()
    ) {
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

    const authenticated =
      await validateCustomerSession();

    if (!authenticated) {
      return;
    }

    await loadKitchenMenu(false);
  }

  window.ApnaBiteCustomerKitchen = {
    refresh:
      function() {
        return loadKitchenMenu(true);
      },

    openProduct:
      function(productId) {
        const product =
          findProduct(productId);

        if (product) {
          openProductModal(product);
        }
      },

    closeProduct:
      closeProductModal,

    getCart:
      function() {
        return state.cart.slice();
      }
  };

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );
  } else {
    initialize();
  }
})();

