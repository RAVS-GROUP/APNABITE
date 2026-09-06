/**
 * ============================================================
 * APNABITE V1 — CUSTOMER CART & CHECKOUT CONTROLLER
 * File: assets/js/customer/cart-checkout.js
 * Complete file — Part 1 of 2
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const CART_STORAGE_KEY = 'apnabite_cart_v1';

  const SELECTED_ADDRESS_KEYS = [
    'apnabite_selected_address',
    'apnabite_selected_address_v1',
    'SELECTED_ADDRESS'
  ];

  const state = {
    loading: false,
    quoteLoading: false,
    quoteTimer: null,
    user: null,
    cart: {
      version: 1,
      kitchenId: '',
      kitchenName: '',
      items: [],
      updatedAt: ''
    },
    addresses: [],
    selectedAddress: null,
    quote: null,
    paymentMethod: 'ONLINE'
  };

  const elements = {};

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
    elements.itemTemplate = byId('customer-cart-item-template');

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
    const required = [
      'refreshButton',
      'loading',
      'error',
      'retryButton',
      'empty',
      'content',
      'items',
      'clearButton',
      'changeAddress',
      'paymentOnline',
      'paymentCod',
      'itemTotal',
      'deliveryFee',
      'platformFee',
      'finalTotal',
      'checkoutBar',
      'footerTotal',
      'continueButton'
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

  function formatCurrency(value) {
    return '₹' + numberValue(value, 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
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
      cleanText(error && error.message) ||
      'Something went wrong.',
      'error'
    );
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
      const stored =
        window.localStorage.getItem(
          CART_STORAGE_KEY
        );

      if (!stored) {
        state.cart = createEmptyCart();
        return;
      }

      const parsed = JSON.parse(stored);

      if (
        !parsed ||
        !Array.isArray(parsed.items)
      ) {
        state.cart = createEmptyCart();
        return;
      }

      state.cart = {
        version: 1,
        kitchenId:
          cleanText(parsed.kitchenId),
        kitchenName:
          cleanText(parsed.kitchenName),
        items:
          parsed.items.filter(
            function(item) {
              return (
                item &&
                cleanText(item.productId) &&
                numberValue(
                  item.quantity,
                  0
                ) > 0
              );
            }
          ),
        updatedAt:
          cleanText(parsed.updatedAt)
      };
    } catch (error) {
      state.cart = createEmptyCart();

      window.localStorage.removeItem(
        CART_STORAGE_KEY
      );
    }
  }

  function saveCart() {
    if (!state.cart.items.length) {
      state.cart = createEmptyCart();

      window.localStorage.removeItem(
        CART_STORAGE_KEY
      );
    } else {
      state.cart.updatedAt =
        new Date().toISOString();

      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(state.cart)
      );
    }
  }

  function calculateLocalSummary() {
    return state.cart.items.reduce(
      function(summary, item) {
        summary.quantity += Math.max(
          0,
          Math.floor(
            numberValue(
              item.quantity,
              0
            )
          )
        );

        summary.total += Math.max(
          0,
          numberValue(
            item.itemTotal,
            0
          )
        );

        return summary;
      },
      {
        quantity: 0,
        total: 0
      }
    );
  }

  function recalculateCartItem(item) {
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

          return total +
            addon.total;
        },
        0
      );

    item.itemTotal =
      item.productSubtotal +
      item.addonTotal;

    return item;
  }

  function getVerifiedItem(cartItem) {
    if (
      !state.quote ||
      !Array.isArray(state.quote.items)
    ) {
      return null;
    }

    return state.quote.items.find(
      function(item) {
        return (
          cleanText(item.productId) ===
          cleanText(cartItem.productId) &&
          cleanText(
            item.selectedOptionCode
          ) ===
          cleanText(
            cartItem.selectedOptionCode
          )
        );
      }
    ) || null;
  }

  function renderCartItems() {
    elements.items.innerHTML = '';

    state.cart.items.forEach(
      function(item) {
        const verifiedItem =
          getVerifiedItem(item);

        const foodType =
          normalize(
            verifiedItem &&
            verifiedItem.foodType
          );

        const article =
          document.createElement(
            'article'
          );

        article.className =
          'customer-cart-item';

        article.dataset.cartItemId =
          cleanText(item.cartItemId);

        const optionLabel =
          normalize(
            item.quantityMode
          ) === 'COUNT'
            ? (
              cleanText(item.unitLabel) ||
              'Piece'
            )
            : cleanText(
              item.selectedOptionLabel
            );

        const addons =
          Array.isArray(item.addons)
            ? item.addons
            : [];

        article.innerHTML =
          '<div class="customer-cart-item__heading">' +
            '<span class="customer-cart-item__food-marker' +
              (
                foodType === 'NON_VEG'
                  ? ' customer-cart-item__food-marker--non-veg'
                  : ''
              ) +
              '" aria-hidden="true"></span>' +

            '<div>' +
              '<h3></h3>' +
              '<p></p>' +
            '</div>' +

            '<button class="customer-cart-item__remove"' +
              ' type="button" data-remove-item' +
              ' aria-label="Remove item">×</button>' +
          '</div>' +

          '<div class="customer-cart-item__addons"' +
            ' data-addon-list' +
            (
              addons.length
                ? ''
                : ' hidden'
            ) +
          '></div>' +

          '<div class="customer-cart-item__footer">' +
            '<div class="customer-cart-quantity">' +
              '<button type="button" data-item-minus' +
                ' aria-label="Decrease quantity">−</button>' +
              '<strong data-item-quantity></strong>' +
              '<button type="button" data-item-plus' +
                ' aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<strong data-item-total></strong>' +
          '</div>';

        setText(
          article.querySelector('h3'),
          item.productName
        );

        setText(
          article.querySelector(
            '.customer-cart-item__heading p'
          ),
          optionLabel
        );

        setText(
          article.querySelector(
            '[data-item-quantity]'
          ),
          item.quantity
        );

        setText(
          article.querySelector(
            '[data-item-total]'
          ),
          formatCurrency(
            item.itemTotal
          )
        );

        const addonList =
          article.querySelector(
            '[data-addon-list]'
          );

        if (addons.length) {
          addonList.innerHTML =
            addons.map(
              function(addon) {
                return (
                  '<div>' +
                    cleanText(
                      addon.addonName
                    ) +
                    ' × ' +
                    numberValue(
                      addon.quantity,
                      0
                    ) +
                    ' · ' +
                    formatCurrency(
                      addon.total
                    ) +
                  '</div>'
                );
              }
            ).join('');
        }

        const minimum = Math.max(
          1,
          Math.floor(
            numberValue(
              item.minimumQuantity,
              1
            )
          )
        );

        const maximum = Math.max(
          minimum,
          Math.floor(
            numberValue(
              item.maximumQuantity,
              minimum
            )
          )
        );

        article.querySelector(
          '[data-item-minus]'
        ).disabled =
          numberValue(
            item.quantity,
            0
          ) <= minimum;

        article.querySelector(
          '[data-item-plus]'
        ).disabled =
          numberValue(
            item.quantity,
            0
          ) >= maximum;

        elements.items.appendChild(
          article
        );
      }
    );

    const summary =
      calculateLocalSummary();

    setText(
      elements.itemSummary,
      summary.quantity +
      (
        summary.quantity === 1
          ? ' item in your cart'
          : ' items in your cart'
      )
    );

    setText(
      elements.kitchenName,
      state.cart.kitchenName ||
      'Kitchen'
    );

    if (elements.addMore) {
      elements.addMore.href =
        state.cart.kitchenId
          ? (
            'kitchen.html?kitchenId=' +
            encodeURIComponent(
              state.cart.kitchenId
            )
          )
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

    setText(
      elements.errorTitle,
      title ||
      'Cart could not be loaded'
    );

    setText(
      elements.errorMessage,
      message ||
      'Please try again.'
    );
  }

  function getCheckoutPayload() {
    return {
      kitchenId:
        state.cart.kitchenId,

      addressId:
        state.selectedAddress
          ? cleanText(
            state.selectedAddress.addressId ||
            state.selectedAddress.Address_ID
          )
          : '',

      items:
        state.cart.items.map(
          function(item) {
            return {
              productId:
                item.productId,

              selectedOptionCode:
                item.selectedOptionCode ||
                'DEFAULT',

              quantity:
                Math.max(
                  1,
                  Math.floor(
                    numberValue(
                      item.quantity,
                      1
                    )
                  )
                ),

              addons:
                (item.addons || [])
                  .map(
                    function(addon) {
                      return {
                        addonId:
                          addon.addonId,

                        quantity:
                          Math.max(
                            0,
                            Math.floor(
                              numberValue(
                                addon.quantity,
                                0
                              )
                            )
                          )
                      };
                    }
                  )
            };
          }
        ),

      cookingInstructions:
        cleanText(
          elements.instructionInput &&
          elements.instructionInput.value
        )
    };
  }

  /*
   * Continue directly with Part 2 below this line.
   */
