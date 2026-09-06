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
  function normalizeAddress(address) {
    const item =
      address &&
      typeof address === 'object'
        ? address
        : {};

    return {
      addressId:
        cleanText(
          item.addressId ||
          item.Address_ID
        ),

      label:
        cleanText(
          item.label ||
          item.addressLabel ||
          item.Address_Label ||
          item.addressType ||
          item.Address_Type
        ) || 'Delivery address',

      receiverName:
        cleanText(
          item.receiverName ||
          item.Receiver_Name
        ),

      receiverMobile:
        cleanText(
          item.receiverMobile ||
          item.Receiver_Mobile
        ),

      addressLine:
        cleanText(
          item.addressLine ||
          [
            item.addressLine1 ||
              item.Address_Line_1,
            item.addressLine2 ||
              item.Address_Line_2,
            item.landmark ||
              item.Landmark,
            item.area ||
              item.Area,
            item.city ||
              item.City,
            item.state ||
              item.State,
            item.postalCode ||
              item.Postal_Code
          ].filter(Boolean).join(', ')
        ),

      latitude:
        numberValue(
          item.latitude ||
          item.Latitude,
          0
        ),

      longitude:
        numberValue(
          item.longitude ||
          item.Longitude,
          0
        ),

      isDefault:
        item.isDefault === true ||
        item.Is_Default === true ||
        normalize(
          item.isDefault ||
          item.Is_Default
        ) === 'TRUE',

      isActive:
        item.isActive === undefined &&
        item.Is_Active === undefined
          ? true
          : (
            item.isActive === true ||
            item.Is_Active === true ||
            normalize(
              item.isActive ||
              item.Is_Active
            ) === 'TRUE'
          )
    };
  }

  function getStoredAddressId() {
    for (
      let index = 0;
      index <
        SELECTED_ADDRESS_KEYS.length;
      index += 1
    ) {
      const key =
        SELECTED_ADDRESS_KEYS[index];

      const value =
        window.localStorage.getItem(key);

      if (!value) continue;

      try {
        const parsed =
          JSON.parse(value);

        if (
          parsed &&
          typeof parsed === 'object'
        ) {
          const addressId =
            cleanText(
              parsed.addressId ||
              parsed.Address_ID
            );

          if (addressId) {
            return addressId;
          }
        }
      } catch (error) {
        const addressId =
          cleanText(value);

        if (addressId) {
          return addressId;
        }
      }
    }

    return '';
  }

  function saveSelectedAddress(
    address
  ) {
    if (!address) return;

    const storedValue =
      JSON.stringify({
        addressId:
          address.addressId,
        label:
          address.label,
        addressLine:
          address.addressLine,
        latitude:
          address.latitude,
        longitude:
          address.longitude
      });

    window.localStorage.setItem(
      SELECTED_ADDRESS_KEYS[0],
      storedValue
    );
  }

  async function loadAddresses() {
    const response =
      await window.ApnaBiteAPI.request(
        'address.list',
        {},
        {
          retry: false,
          deduplicate: true,
          timeoutMs: 20000
        }
      );

    const data =
      getResponseData(response);

    let records = [];

    if (Array.isArray(data)) {
      records = data;
    } else if (
      Array.isArray(data.items)
    ) {
      records = data.items;
    } else if (
      Array.isArray(data.addresses)
    ) {
      records = data.addresses;
    }

    state.addresses =
      records
        .map(normalizeAddress)
        .filter(
          function(address) {
            return (
              address.addressId &&
              address.isActive
            );
          }
        );

    const storedAddressId =
      getStoredAddressId();

    state.selectedAddress =
      state.addresses.find(
        function(address) {
          return (
            address.addressId ===
            storedAddressId
          );
        }
      ) ||
      state.addresses.find(
        function(address) {
          return address.isDefault;
        }
      ) ||
      state.addresses[0] ||
      null;

    if (state.selectedAddress) {
      saveSelectedAddress(
        state.selectedAddress
      );
    }

    renderAddress();
  }

  function renderAddress() {
    const address =
      state.selectedAddress;

    if (!address) {
      setText(
        elements.addressLabel,
        'No delivery address selected'
      );

      setText(
        elements.addressLine,
        'Select or add a delivery address.'
      );

      setText(
        elements.addressReceiver,
        ''
      );

      setText(
        elements.addressDistance,
        ''
      );

      setHidden(
        elements.addressWarning,
        false
      );

      return;
    }

    setText(
      elements.addressLabel,
      address.label
    );

    setText(
      elements.addressLine,
      address.addressLine ||
      'Address details unavailable.'
    );

    const receiverParts = [];

    if (address.receiverName) {
      receiverParts.push(
        address.receiverName
      );
    }

    if (address.receiverMobile) {
      receiverParts.push(
        address.receiverMobile
      );
    }

    setText(
      elements.addressReceiver,
      receiverParts.join(' · ')
    );

    setHidden(
      elements.addressWarning,
      true
    );
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
        .requireLocalSession ===
        'function' &&
      !window.ApnaBiteCore
        .requireLocalSession([
          'CUSTOMER'
        ])
    ) {
      return null;
    }

    const response =
      await window.ApnaBiteAPI
        .validateSession();

    const data =
      getResponseData(response);

    const user =
      data.user || null;

    if (
      !user ||
      normalize(user.role) !==
        'CUSTOMER'
    ) {
      if (
        typeof window.ApnaBiteCore
          .redirectToRoleHome ===
          'function'
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

  function setQuoteLoading(
    loading
  ) {
    state.quoteLoading =
      Boolean(loading);

    elements.refreshButton.disabled =
      state.quoteLoading;

    elements.continueButton.disabled =
      true;

    if (state.quoteLoading) {
      setText(
        elements.deliveryFee,
        'Calculating…'
      );

      setText(
        elements.footerTotal,
        '—'
      );
    }
  }

  async function loadCheckoutQuote() {
    if (
      state.quoteLoading ||
      !state.cart.items.length
    ) {
      return;
    }

    if (!state.selectedAddress) {
      state.quote = null;

      setHidden(
        elements.addressWarning,
        false
      );

      elements.continueButton.disabled =
        true;

      return;
    }

    setQuoteLoading(true);

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'checkout.quote',
          getCheckoutPayload(),
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const quote =
        getResponseData(response);

      if (
        !quote ||
        !quote.totals
      ) {
        throw new Error(
          'Checkout pricing was not returned.'
        );
      }

      state.quote = quote;

      renderQuote();
      renderCartItems();
    } catch (error) {
      state.quote = null;

      elements.continueButton.disabled =
        true;

      setText(
        elements.deliveryFee,
        'Unavailable'
      );

      showToast(
        cleanText(
          error && error.message
        ) ||
        'Checkout price could not be calculated.',
        'error'
      );

      handleApiError(error);
    } finally {
      setQuoteLoading(false);

      if (state.quote) {
        updateContinueButton();
      }
    }
  }

  function scheduleQuote() {
    if (state.quoteTimer) {
      window.clearTimeout(
        state.quoteTimer
      );
    }

    state.quoteTimer =
      window.setTimeout(
        function() {
          state.quoteTimer = null;
          loadCheckoutQuote();
        },
        350
      );
  }

  function renderQuote() {
    const quote =
      state.quote;

    if (!quote) return;

    const totals =
      quote.totals || {};

    const delivery =
      quote.delivery || {};

    const minimumOrder =
      quote.minimumOrder || {};

    const payment =
      quote.payment || {};

    const offers =
      quote.offers || {};

    const rewards =
      quote.rewards || {};

    setText(
      elements.itemTotal,
      formatCurrency(
        totals.itemTotal
      )
    );

    setText(
      elements.deliveryFee,
      numberValue(
        totals.deliveryFee,
        0
      ) <= 0
        ? 'FREE'
        : formatCurrency(
            totals.deliveryFee
          )
    );

    setText(
      elements.platformFee,
      formatCurrency(
        totals.platformFee
      )
    );

    const discountAmount =
      Math.max(
        0,
        numberValue(
          totals.discountAmount,
          0
        )
      );

    setHidden(
      elements.discountRow,
      discountAmount <= 0
    );

    setText(
      elements.discount,
      '− ' +
      formatCurrency(
        discountAmount
      )
    );

    const rewardDiscount =
      Math.max(
        0,
        numberValue(
          totals.rewardDiscount,
          0
        )
      );

    setHidden(
      elements.rewardRow,
      rewardDiscount <= 0
    );

    setText(
      elements.rewardDiscount,
      '− ' +
      formatCurrency(
        rewardDiscount
      )
    );

    setText(
      elements.finalTotal,
      formatCurrency(
        totals.finalPayable
      )
    );

    setText(
      elements.footerTotal,
      formatCurrency(
        totals.finalPayable
      )
    );

    if (
      quote.address &&
      numberValue(
        quote.address.distanceKm,
        0
      ) > 0
    ) {
      setText(
        elements.addressDistance,
        numberValue(
          quote.address.distanceKm,
          0
        ).toFixed(2) +
        ' km'
      );
    } else {
      setText(
        elements.addressDistance,
        ''
      );
    }

    if (
      minimumOrder.reached ===
        false
    ) {
      setText(
        elements.minimumWarning,
        'Add ' +
        formatCurrency(
          minimumOrder.shortBy
        ) +
        ' more to reach the minimum order value.'
      );

      setHidden(
        elements.minimumWarning,
        false
      );
    } else {
      setHidden(
        elements.minimumWarning,
        true
      );
    }

    if (
      delivery.freeDeliveryApplied
    ) {
      setText(
        elements.freeDeliveryMessage,
        'Free delivery applied.'
      );

      setHidden(
        elements.freeDeliveryMessage,
        false
      );
    } else if (
      numberValue(
        delivery.amountForFreeDelivery,
        0
      ) > 0
    ) {
      setText(
        elements.freeDeliveryMessage,
        'Add ' +
        formatCurrency(
          delivery.amountForFreeDelivery
        ) +
        ' more for free delivery.'
      );

      setHidden(
        elements.freeDeliveryMessage,
        false
      );
    } else {
      setHidden(
        elements.freeDeliveryMessage,
        true
      );
    }

    if (offers.applied) {
      setText(
        elements.offerTitle,
        offers.title ||
        'Offer applied'
      );

      setText(
        elements.offerMessage,
        'You saved ' +
        formatCurrency(
          offers.discountAmount
        ) +
        '.'
      );
    } else {
      setText(
        elements.offerTitle,
        'Check available offers'
      );

      setText(
        elements.offerMessage,
        offers.message ||
        'Eligible savings will be applied automatically.'
      );
    }

    const codMethod =
      Array.isArray(
        payment.methods
      )
        ? payment.methods.find(
            function(method) {
              return (
                normalize(
                  method.code
                ) === 'COD'
              );
            }
          )
        : null;

    const codAvailable =
      Boolean(
        codMethod &&
        codMethod.available
      );

    elements.paymentCod.disabled =
      !codAvailable;

    if (elements.paymentCodOption) {
      elements.paymentCodOption
        .classList.toggle(
          'customer-cart-payment-option--disabled',
          !codAvailable
        );
    }

    setText(
      elements.paymentCodMessage,
      cleanText(
        codMethod &&
        codMethod.message
      ) ||
      (
        codAvailable
          ? 'Pay in cash when your order is delivered.'
          : 'Cash on Delivery is unavailable.'
      )
    );

    if (
      state.paymentMethod === 'COD' &&
      !codAvailable
    ) {
      state.paymentMethod =
        'ONLINE';

      elements.paymentOnline.checked =
        true;

      elements.paymentCod.checked =
        false;
    }

    updateContinueButton();
  }

  function updateContinueButton() {
    const quote =
      state.quote;

    const payment =
      quote &&
      quote.payment
        ? quote.payment
        : {};

    const methods =
      Array.isArray(payment.methods)
        ? payment.methods
        : [];

    const selectedMethod =
      methods.find(
        function(method) {
          return (
            normalize(method.code) ===
            state.paymentMethod
          );
        }
      );

    const enabled =
      Boolean(
        quote &&
        quote.valid &&
        state.selectedAddress &&
        selectedMethod &&
        selectedMethod.available &&
        !state.quoteLoading
      );

    elements.continueButton.disabled =
      !enabled;
  }

  function changeItemQuantity(
    cartItemId,
    difference
  ) {
    const item =
      state.cart.items.find(
        function(cartItem) {
          return (
            cleanText(
              cartItem.cartItemId
            ) ===
            cleanText(cartItemId)
          );
        }
      );

    if (!item) return;

    const minimum =
      Math.max(
        1,
        Math.floor(
          numberValue(
            item.minimumQuantity,
            1
          )
        )
      );

    const maximum =
      Math.max(
        minimum,
        Math.floor(
          numberValue(
            item.maximumQuantity,
            minimum
          )
        )
      );

    const nextQuantity =
      Math.min(
        maximum,
        Math.max(
          minimum,
          Math.floor(
            numberValue(
              item.quantity,
              minimum
            ) +
            difference
          )
        )
      );

    if (
      nextQuantity ===
      item.quantity
    ) {
      return;
    }

    item.quantity =
      nextQuantity;

    recalculateCartItem(item);
    saveCart();

    state.quote = null;

    renderCartItems();
    updateLocalTotal();
    scheduleQuote();
  }

  function removeCartItem(
    cartItemId
  ) {
    state.cart.items =
      state.cart.items.filter(
        function(item) {
          return (
            cleanText(
              item.cartItemId
            ) !==
            cleanText(cartItemId)
          );
        }
      );

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
    const summary =
      calculateLocalSummary();

    setText(
      elements.itemTotal,
      formatCurrency(
        summary.total
      )
    );

    setText(
      elements.footerTotal,
      formatCurrency(
        summary.total
      )
    );

    setText(
      elements.deliveryFee,
      'Calculating…'
    );

    elements.continueButton.disabled =
      true;
  }

  function handleItemsClick(event) {
    const article =
      event.target.closest(
        '[data-cart-item-id]'
      );

    if (!article) return;

    const cartItemId =
      article.dataset.cartItemId;

    if (
      event.target.closest(
        '[data-item-minus]'
      )
    ) {
      changeItemQuantity(
        cartItemId,
        -1
      );
      return;
    }

    if (
      event.target.closest(
        '[data-item-plus]'
      )
    ) {
      changeItemQuantity(
        cartItemId,
        1
      );
      return;
    }

    if (
      event.target.closest(
        '[data-remove-item]'
      )
    ) {
      removeCartItem(
        cartItemId
      );
    }
  }

  function clearCart() {
    if (!state.cart.items.length) {
      return;
    }

    const confirmed =
      window.confirm(
        'Remove all items from your cart?'
      );

    if (!confirmed) return;

    state.cart =
      createEmptyCart();

    saveCart();
    showEmptyCart();

    showToast(
      'Cart cleared.',
      'success'
    );
  }

  function handlePaymentChange(
    event
  ) {
    const input =
      event.target.closest(
        'input[name="customer-payment-method"]'
      );

    if (
      !input ||
      input.disabled
    ) {
      return;
    }

    state.paymentMethod =
      normalize(input.value);

    updateContinueButton();
  }

  function continueCheckout() {
    if (
      elements.continueButton.disabled ||
      !state.quote
    ) {
      return;
    }

    /*
     * Order creation will be connected
     * in the next backend module.
     */
    showToast(
      state.paymentMethod === 'COD'
        ? 'Cash on Delivery selected. Order placement will be connected next.'
        : 'Online payment selected. Order placement will be connected next.',
      'success'
    );
  }

  function bindEvents() {
    elements.refreshButton
      .addEventListener(
        'click',
        loadCheckout
      );

    elements.retryButton
      .addEventListener(
        'click',
        loadCheckout
      );

    elements.items
      .addEventListener(
        'click',
        handleItemsClick
      );

    elements.clearButton
      .addEventListener(
        'click',
        clearCart
      );

    elements.changeAddress
      .addEventListener(
        'click',
        function() {
          window.location.href =
            'location.html?return=' +
            encodeURIComponent(
              'cart-checkout.html'
            );
        }
      );

    elements.addressCard
      .addEventListener(
        'click',
        function() {
          elements.changeAddress.click();
        }
      );

    elements.offerButton
      .addEventListener(
        'click',
        function() {
          showToast(
            state.quote &&
            state.quote.offers &&
            state.quote.offers.message
              ? state.quote.offers.message
              : 'Eligible offers will be applied automatically.',
            'info'
          );
        }
      );

    elements.paymentMethods
      .addEventListener(
        'change',
        handlePaymentChange
      );

    elements.continueButton
      .addEventListener(
        'click',
        continueCheckout
      );

    window.addEventListener(
      'storage',
      function(event) {
        if (
          event.key !==
          CART_STORAGE_KEY
        ) {
          return;
        }

        loadCart();

        if (!state.cart.items.length) {
          showEmptyCart();
          return;
        }

        state.quote = null;

        renderCartItems();
        updateLocalTotal();
        scheduleQuote();
      }
    );

    window.addEventListener(
      'pageshow',
      function(event) {
        if (!event.persisted) return;

        loadCart();

        if (!state.cart.items.length) {
          showEmptyCart();
          return;
        }

        renderCartItems();
        loadAddresses()
          .then(loadCheckoutQuote)
          .catch(handleApiError);
      }
    );
  }

  async function loadCheckout() {
    if (state.loading) return;

    state.loading = true;

    setHidden(
      elements.loading,
      false
    );

    setHidden(
      elements.error,
      true
    );

    setHidden(
      elements.empty,
      true
    );

    setHidden(
      elements.content,
      true
    );

    setHidden(
      elements.checkoutBar,
      true
    );

    try {
      loadCart();

      if (!state.cart.items.length) {
        showEmptyCart();
        return;
      }

      const authenticated =
        await validateCustomerSession();

      if (!authenticated) return;

      renderCartItems();
      updateLocalTotal();
      showCheckoutContent();

      await loadAddresses();

      if (!state.selectedAddress) {
        setHidden(
          elements.addressWarning,
          false
        );

        elements.continueButton.disabled =
          true;

        showToast(
          'Select a delivery address to continue.',
          'info'
        );

        return;
      }

      await loadCheckoutQuote();
    } catch (error) {
      showPageError(
        'Cart could not be loaded',
        cleanText(
          error && error.message
        ) ||
        'Please check your connection and try again.'
      );

      handleApiError(error);
    } finally {
      state.loading = false;
    }
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains(
          'customer-cart-page'
        )
    ) {
      return;
    }

    collectElements();

    if (
      !requiredElementsAvailable()
    ) {
      console.error(
        'Customer checkout page elements are incomplete.'
      );
      return;
    }

    bindEvents();
    await loadCheckout();
  }

  window.ApnaBiteCustomerCheckout = {
    refresh:
      loadCheckout,

    getCart:
      function() {
        return JSON.parse(
          JSON.stringify(
            state.cart
          )
        );
      },

    getQuote:
      function() {
        return state.quote
          ? JSON.parse(
              JSON.stringify(
                state.quote
              )
            )
          : null;
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
})(window, document);
