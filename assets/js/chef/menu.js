/**
 * ============================================================
 * APNABITE V1 — CHEF MENU CONTROLLER
 * File: assets/js/chef/menu.js
 * Complete replacement — Part 1 of 3
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const MAX_FILE_BYTES = 5 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  const state = {
    initialized: false,
    loading: false,
    saving: false,
    publishing: false,
    uploading: false,
    user: null,
    kitchenId: '',
    kitchenName: '',
    products: [],
    counts: {},
    filter: 'ALL',
    category: '',
    search: '',
    currentProduct: null,
    currentAddon: null,
    thumbnailFile: null,
    detailFile: null,
    quantityMode: 'COUNT'
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.refreshButton =
      byId('chef-menu-refresh-button');
    elements.addButton =
      byId('chef-menu-add-button');
    elements.emptyAddButton =
      byId('chef-menu-empty-add-button');
    elements.kitchenName =
      byId('chef-menu-kitchen-name');
    elements.loading =
      byId('chef-menu-loading');
    elements.error =
      byId('chef-menu-error');
    elements.errorMessage =
      byId('chef-menu-error-message');
    elements.retryButton =
      byId('chef-menu-retry-button');
    elements.content =
      byId('chef-menu-content');
    elements.empty =
      byId('chef-menu-empty');
    elements.productList =
      byId('chef-menu-product-list');
    elements.searchInput =
      byId('chef-menu-search-input');
    elements.categoryFilter =
      byId('chef-menu-category-filter');

    elements.countAll =
      byId('chef-menu-count-all');
    elements.countActive =
      byId('chef-menu-count-active');
    elements.countOnline =
      byId('chef-menu-count-online');
    elements.countDraft =
      byId('chef-menu-count-draft');
    elements.countOutOfStock =
      byId('chef-menu-count-out-of-stock');

    elements.productEditor =
      byId('chef-product-editor');
    elements.productEditorTitle =
      byId('chef-product-editor-title');
    elements.productEditorClose =
      byId('chef-product-editor-close');
    elements.productForm =
      byId('chef-product-form');
    elements.productId =
      byId('chef-product-id');
    elements.productName =
      byId('chef-product-name');
    elements.category =
      byId('chef-product-category');
    elements.foodType =
      byId('chef-product-food-type');
    elements.description =
      byId('chef-product-description');
    elements.descriptionCount =
      byId('chef-product-description-count');

    elements.countFields =
      byId('chef-product-count-fields');
    elements.optionFields =
      byId('chef-product-option-fields');
    elements.basePrice =
      byId('chef-product-base-price');
    elements.unitLabel =
      byId('chef-product-unit-label');
    elements.optionUnitLabel =
      byId('chef-product-option-unit-label');
    elements.optionsTitle =
      byId('chef-product-options-title');
    elements.optionsContainer =
      byId('chef-product-quantity-options');
    elements.optionTemplate =
      byId('chef-product-quantity-option-template');
    elements.addOptionButton =
      byId('chef-product-add-option-button');

    elements.availableQuantity =
      byId('chef-product-available-quantity');
    elements.preparationMinutes =
      byId('chef-product-preparation-minutes');
    elements.minimumQuantity =
      byId('chef-product-minimum-quantity');
    elements.maximumQuantity =
      byId('chef-product-maximum-quantity');
    elements.displayOrder =
      byId('chef-product-display-order');

    elements.thumbnailFile =
      byId('chef-product-thumbnail-file');
    elements.thumbnailPreview =
      byId('chef-product-thumbnail-preview');
    elements.thumbnailFileName =
      byId('chef-product-thumbnail-file-name');
    elements.detailFile =
      byId('chef-product-detail-file');
    elements.detailPreview =
      byId('chef-product-detail-preview');
    elements.detailFileName =
      byId('chef-product-detail-file-name');

    elements.addonSection =
      byId('chef-product-existing-addons');
    elements.addonList =
      byId('chef-product-addon-list');
    elements.addAddonButton =
      byId('chef-product-add-addon-button');

    elements.saveButton =
      byId('chef-product-save-button');
    elements.publishButton =
      byId('chef-product-publish-button');
    elements.formMessage =
      byId('chef-product-form-message');

    elements.addonEditor =
      byId('chef-addon-editor');
    elements.addonEditorTitle =
      byId('chef-addon-editor-title');
    elements.addonEditorClose =
      byId('chef-addon-editor-close');
    elements.addonForm =
      byId('chef-addon-form');
    elements.addonId =
      byId('chef-addon-id');
    elements.addonName =
      byId('chef-addon-name');
    elements.addonDescription =
      byId('chef-addon-description');
    elements.addonPrice =
      byId('chef-addon-price');
    elements.addonAvailableQuantity =
      byId('chef-addon-available-quantity');
    elements.addonMinimumQuantity =
      byId('chef-addon-minimum-quantity');
    elements.addonMaximumQuantity =
      byId('chef-addon-maximum-quantity');
    elements.addonDisplayOrder =
      byId('chef-addon-display-order');
    elements.addonSaveButton =
      byId('chef-addon-save-button');
    elements.addonFormError =
      byId('chef-addon-form-error');

    elements.errors = {
      productName:
        byId('chef-product-name-error'),
      category:
        byId('chef-product-category-error'),
      foodType:
        byId('chef-product-food-type-error'),
      description:
        byId('chef-product-description-error'),
      quantityMode:
        byId('chef-product-quantity-mode-error'),
      basePrice:
        byId('chef-product-base-price-error'),
      unitLabel:
        byId('chef-product-unit-label-error'),
      optionUnitLabel:
        byId('chef-product-option-unit-label-error'),
      quantityOptions:
        byId('chef-product-quantity-options-error'),
      availableQuantity:
        byId('chef-product-available-quantity-error'),
      preparationMinutes:
        byId('chef-product-preparation-error'),
      minimumQuantity:
        byId('chef-product-minimum-quantity-error'),
      maximumQuantity:
        byId('chef-product-maximum-quantity-error'),
      thumbnail:
        byId('chef-product-thumbnail-error'),
      detailImage:
        byId('chef-product-detail-image-error'),
      addonName:
        byId('chef-addon-name-error'),
      addonPrice:
        byId('chef-addon-price-error')
    };
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

  function setError(element, message) {
    setText(element, message);
    setHidden(element, !message);
  }

  function clearErrors() {
    Object.keys(elements.errors || {})
      .forEach(function(key) {
        setError(elements.errors[key], '');
      });

    setError(elements.addonFormError, '');
    setText(elements.formMessage, '');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
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

  function setButtonLoading(
    button,
    loading,
    text
  ) {
    if (!button) {
      return;
    }

    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .setButtonLoading === 'function'
    ) {
      window.ApnaBiteUI.setButtonLoading(
        button,
        loading,
        text
      );
      return;
    }

    if (!button.dataset.defaultText) {
      button.dataset.defaultText =
        button.textContent;
    }

    button.disabled = Boolean(loading);
    button.textContent = loading
      ? text
      : button.dataset.defaultText;
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

  function getProductById(productId) {
    return state.products.find(
      function(product) {
        return product.productId === productId;
      }
    ) || null;
  }

  function getAddonById(addonId) {
    const product = state.currentProduct;

    if (!product) {
      return null;
    }

    return (product.addons || []).find(
      function(addon) {
        return addon.addonId === addonId;
      }
    ) || null;
  }

  function renderCounts() {
    const counts = state.counts || {};

    setText(elements.countAll, counts.all || 0);
    setText(
      elements.countActive,
      counts.active || 0
    );
    setText(
      elements.countOnline,
      counts.online || 0
    );
    setText(
      elements.countDraft,
      counts.draft || 0
    );
    setText(
      elements.countOutOfStock,
      counts.outOfStock || 0
    );

    document.querySelectorAll(
      '.chef-menu-count'
    ).forEach(function(button) {
      button.classList.toggle(
        'chef-menu-count--active',
        button.dataset.filter ===
          state.filter
      );
    });
  }

  function productMatchesLocalFilter(product) {
    const filter = state.filter;

    if (
      filter === 'ACTIVE' &&
      normalize(product.productStatus) !==
        'ACTIVE'
    ) {
      return false;
    }

    if (
      filter === 'DRAFT' &&
      normalize(product.productStatus) !==
        'DRAFT'
    ) {
      return false;
    }

    if (
      filter === 'ONLINE' &&
      normalize(product.availabilityStatus) !==
        'ONLINE'
    ) {
      return false;
    }

    if (
      filter === 'OUT_OF_STOCK' &&
      normalize(product.availabilityStatus) !==
        'OUT_OF_STOCK'
    ) {
      return false;
    }

    if (
      state.category &&
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
        product.quantityMode,
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

  function renderProductCard(product) {
    const productStatus =
      normalize(product.productStatus);
    const availabilityStatus =
      normalize(product.availabilityStatus);
    const moderationStatus =
      normalize(product.moderationStatus);
    const quantityMode =
      normalize(product.quantityMode) ||
      'COUNT';

    const rejected =
      moderationStatus === 'REJECTED';

    const online =
      availabilityStatus === 'ONLINE';

    const published =
      productStatus === 'ACTIVE';

    const options = Array.isArray(
      product.quantityOptions
    )
      ? product.quantityOptions
      : [];

    const optionHtml = options
      .slice(0, 3)
      .map(function(option) {
        return (
          '<span>' +
          escapeHtml(option.label) +
          ' · ' +
          escapeHtml(
            formatCurrency(option.price)
          ) +
          '</span>'
        );
      })
      .join('');

    const imageHtml = product.thumbnailUrl
      ? (
        '<img src="' +
        escapeHtml(product.thumbnailUrl) +
        '" alt="' +
        escapeHtml(product.productName) +
        '" loading="lazy">'
      )
      : (
        '<div class="chef-menu-product-card__placeholder" aria-hidden="true">🍽️</div>'
      );

    let actionHtml = '';

    if (!published) {
      actionHtml +=
        '<button class="button button--primary" type="button" data-action="publish" data-product-id="' +
        escapeHtml(product.productId) +
        '">PUBLISH</button>';
    } else if (online) {
      actionHtml +=
        '<button class="button button--secondary" type="button" data-action="offline" data-product-id="' +
        escapeHtml(product.productId) +
        '">TURN OFFLINE</button>';
    } else {
      actionHtml +=
        '<button class="button button--primary" type="button" data-action="online" data-product-id="' +
        escapeHtml(product.productId) +
        '">TURN ONLINE</button>';
    }

    actionHtml +=
      '<button class="button button--secondary" type="button" data-action="edit" data-product-id="' +
      escapeHtml(product.productId) +
      '">EDIT</button>';

    const statusLabel = rejected
      ? 'AUDIT REJECTED'
      : online
        ? 'ONLINE'
        : availabilityStatus ===
            'OUT_OF_STOCK'
          ? 'OUT OF STOCK'
          : published
            ? 'PUBLISHED'
            : 'DRAFT';

    const statusClass = rejected
      ? 'rejected'
      : online
        ? 'online'
        : availabilityStatus ===
            'OUT_OF_STOCK'
          ? 'out-of-stock'
          : published
            ? 'active'
            : 'draft';

    const unitText = quantityMode === 'COUNT'
      ? (
        'per ' +
        cleanText(product.unitLabel || 'Piece')
      )
      : 'starting price';

    return (
      '<article class="chef-menu-product-card' +
      (rejected
        ? ' chef-menu-product-card--rejected'
        : '') +
      '">' +
        '<div class="chef-menu-product-card__image">' +
          imageHtml +
        '</div>' +

        '<div class="chef-menu-product-card__body">' +
          '<div class="chef-menu-product-card__top">' +
            '<div style="min-width:0">' +
              '<span class="chef-menu-product-card__food">' +
                escapeHtml(
                  humanize(product.foodType)
                ) +
                ' · ' +
                escapeHtml(
                  humanize(product.category)
                ) +
              '</span>' +
              '<h3>' +
                escapeHtml(product.productName) +
              '</h3>' +
            '</div>' +

            '<span class="chef-menu-product-status chef-menu-product-status--' +
              statusClass +
            '">' +
              statusLabel +
            '</span>' +
          '</div>' +

          '<div class="chef-menu-product-card__price">' +
            '<strong>' +
              escapeHtml(
                formatCurrency(
                  product.startingPrice ||
                  product.basePrice
                )
              ) +
            '</strong>' +
            '<small>' +
              escapeHtml(unitText) +
            '</small>' +
          '</div>' +

          (
            optionHtml
              ? '<div class="chef-menu-product-card__options">' +
                  optionHtml +
                '</div>'
              : ''
          ) +

          '<div class="chef-menu-product-card__meta">' +
            '<span>Stock: ' +
              escapeHtml(
                product.availableQuantity
              ) +
            '</span>' +
            '<span>Prep: ' +
              escapeHtml(
                product.preparationMinutes
              ) +
              ' min</span>' +
            '<span>Extras: ' +
              escapeHtml(
                (product.addons || []).length
              ) +
            '</span>' +
          '</div>' +
        '</div>' +

        (
          rejected
            ? '<p class="chef-menu-product-remark">' +
                escapeHtml(
                  product.adminRemark ||
                  'Changes required after Admin audit.'
                ) +
              '</p>'
            : ''
        ) +

        '<div class="chef-menu-product-card__actions">' +
          actionHtml +
        '</div>' +
      '</article>'
    );
  }

  function renderProducts() {
    const visibleProducts =
      state.products.filter(
        productMatchesLocalFilter
      );

    setHidden(
      elements.empty,
      visibleProducts.length > 0
    );

    if (!elements.productList) {
      return;
    }

    elements.productList.innerHTML =
      visibleProducts.map(
        renderProductCard
      ).join('');
  }

  function renderPage() {
    renderCounts();
    renderProducts();

    setText(
      elements.kitchenName,
      state.kitchenName || 'Your Products'
    );

    if (elements.addButton) {
      elements.addButton.disabled =
        state.loading || !state.kitchenId;
    }
  }

  async function validateChefSession() {
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
        ['CHEF']
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
      normalize(user.role) !== 'CHEF'
    ) {
      if (
        typeof window.ApnaBiteCore
          .redirectToRoleHome === 'function'
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

  async function loadProducts() {
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
          'chef.product.list',
          {
            page: 1,
            pageSize: 50
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const data = getResponseData(response);

      state.kitchenId =
        cleanText(data.kitchenId);
      state.kitchenName =
        cleanText(data.kitchenName);
      state.products =
        Array.isArray(data.items)
          ? data.items
          : [];
      state.counts =
        data.counts || {};

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
        'Menu could not be loaded.'
      );

      handleApiError(error);
    } finally {
      state.loading = false;

      if (elements.refreshButton) {
        elements.refreshButton.disabled = false;
      }
    }
  }

  /*
   * Continue directly with Part 2 below this line.
   */
   function getSelectedQuantityMode() {
    const selected = document.querySelector(
      'input[name="quantityMode"]:checked'
    );

    return selected
      ? normalize(selected.value)
      : 'COUNT';
  }

  function addQuantityOption(option) {
    if (
      !elements.optionTemplate ||
      !elements.optionsContainer
    ) {
      return;
    }

    if (
      elements.optionsContainer.children
        .length >= 10
    ) {
      showToast(
        'Maximum 10 quantity options are allowed.',
        'info'
      );
      return;
    }

    const fragment =
      elements.optionTemplate.content
        .cloneNode(true);

    const row = fragment.querySelector(
      '.chef-product-option-row'
    );

    const labelInput = fragment.querySelector(
      '[data-option-label]'
    );

    const priceInput = fragment.querySelector(
      '[data-option-price]'
    );

    if (row && option && option.code) {
      row.dataset.optionCode =
        cleanText(option.code);
    }

    if (labelInput) {
      labelInput.value =
        cleanText(option && option.label);
    }

    if (priceInput) {
      priceInput.value =
        option &&
        Number(option.price) > 0
          ? Number(option.price)
          : '';
    }

    elements.optionsContainer
      .appendChild(fragment);
  }

  function resetQuantityOptions(mode) {
    if (!elements.optionsContainer) {
      return;
    }

    elements.optionsContainer.innerHTML = '';

    if (mode === 'PORTION') {
      addQuantityOption({
        code: 'HALF',
        label: 'Half',
        price: ''
      });

      addQuantityOption({
        code: 'FULL',
        label: 'Full',
        price: ''
      });
    } else if (mode === 'VOLUME') {
      addQuantityOption({
        code: '250_ML',
        label: '250 ml',
        price: ''
      });

      addQuantityOption({
        code: '500_ML',
        label: '500 ml',
        price: ''
      });
    }
  }

  function renderQuantityMode(
    resetOptions
  ) {
    const mode =
      getSelectedQuantityMode();

    state.quantityMode = mode;

    setHidden(
      elements.countFields,
      mode !== 'COUNT'
    );

    setHidden(
      elements.optionFields,
      mode === 'COUNT'
    );

    if (mode === 'PORTION') {
      setText(
        elements.optionsTitle,
        'Portion options'
      );

      if (
        elements.optionUnitLabel &&
        (
          resetOptions ||
          !elements.optionUnitLabel.value
        )
      ) {
        elements.optionUnitLabel.value =
          'Portion';
      }
    } else if (mode === 'VOLUME') {
      setText(
        elements.optionsTitle,
        'Volume options'
      );

      if (
        elements.optionUnitLabel &&
        (
          resetOptions ||
          !elements.optionUnitLabel.value
        )
      ) {
        elements.optionUnitLabel.value =
          'Volume';
      }
    }

    if (
      resetOptions &&
      mode !== 'COUNT'
    ) {
      resetQuantityOptions(mode);
    }
  }

  function renderAddonList() {
    if (!elements.addonList) {
      return;
    }

    const addons =
      state.currentProduct &&
      Array.isArray(
        state.currentProduct.addons
      )
        ? state.currentProduct.addons
        : [];

    if (!addons.length) {
      elements.addonList.innerHTML =
        '<div class="chef-dashboard-empty-note">No extras added yet.</div>';
      return;
    }

    elements.addonList.innerHTML =
      addons.map(function(addon) {
        const status =
          normalize(addon.addonStatus);

        return (
          '<article class="chef-product-addon-item">' +
            '<div class="chef-product-addon-item__content">' +
              '<strong>' +
                escapeHtml(addon.addonName) +
              '</strong>' +
              '<small>' +
                escapeHtml(
                  formatCurrency(
                    addon.unitPrice
                  )
                ) +
                ' · Stock ' +
                escapeHtml(
                  addon.availableQuantity
                ) +
                ' · ' +
                escapeHtml(
                  humanize(status)
                ) +
              '</small>' +
            '</div>' +

            '<div class="chef-product-addon-item__actions">' +
              '<button type="button" data-addon-action="edit" data-addon-id="' +
                escapeHtml(addon.addonId) +
              '">EDIT</button>' +

              '<button type="button" data-addon-action="' +
                (
                  status === 'ACTIVE'
                    ? 'disable'
                    : 'enable'
                ) +
                '" data-addon-id="' +
                escapeHtml(addon.addonId) +
              '">' +
                (
                  status === 'ACTIVE'
                    ? 'OFF'
                    : 'ON'
                ) +
              '</button>' +
            '</div>' +
          '</article>'
        );
      }).join('');
  }

  function setPreview(
    imageElement,
    url,
    alt
  ) {
    if (!imageElement) {
      return;
    }

    if (!url) {
      imageElement.removeAttribute('src');
      imageElement.alt = '';
      setHidden(imageElement, true);
      return;
    }

    imageElement.src = url;
    imageElement.alt = alt || 'Product image';
    setHidden(imageElement, false);
  }

  function resetProductEditor() {
    if (elements.productForm) {
      elements.productForm.reset();
    }

    state.currentProduct = null;
    state.currentAddon = null;
    state.thumbnailFile = null;
    state.detailFile = null;
    state.quantityMode = 'COUNT';

    clearErrors();

    setText(
      elements.productEditorTitle,
      'Add Product'
    );

    if (elements.productId) {
      elements.productId.value = '';
    }

    if (elements.unitLabel) {
      elements.unitLabel.value = 'Piece';
    }

    if (elements.availableQuantity) {
      elements.availableQuantity.value = '10';
    }

    if (elements.preparationMinutes) {
      elements.preparationMinutes.value = '30';
    }

    if (elements.minimumQuantity) {
      elements.minimumQuantity.value = '1';
    }

    if (elements.maximumQuantity) {
      elements.maximumQuantity.value = '10';
    }

    if (elements.displayOrder) {
      elements.displayOrder.value = '0';
    }

    setText(
      elements.descriptionCount,
      '0/700'
    );

    setText(
      elements.thumbnailFileName,
      'Select thumbnail'
    );

    setText(
      elements.detailFileName,
      'Select detail image'
    );

    setPreview(
      elements.thumbnailPreview,
      '',
      ''
    );

    setPreview(
      elements.detailPreview,
      '',
      ''
    );

    setHidden(elements.addonSection, true);
    setHidden(elements.publishButton, true);

    const countRadio = byId(
      'chef-product-quantity-count'
    );

    if (countRadio) {
      countRadio.checked = true;
    }

    if (elements.optionsContainer) {
      elements.optionsContainer.innerHTML = '';
    }

    renderQuantityMode(false);
  }

  function fillProductEditor(product) {
    resetProductEditor();

    state.currentProduct = product;
    state.quantityMode =
      normalize(product.quantityMode) ||
      'COUNT';

    setText(
      elements.productEditorTitle,
      'Edit Product'
    );

    elements.productId.value =
      product.productId || '';
    elements.productName.value =
      product.productName || '';
    elements.category.value =
      product.category || '';
    elements.foodType.value =
      product.foodType || '';
    elements.description.value =
      product.description || '';
    elements.availableQuantity.value =
      product.availableQuantity;
    elements.preparationMinutes.value =
      product.preparationMinutes;
    elements.minimumQuantity.value =
      product.minimumQuantity;
    elements.maximumQuantity.value =
      product.maximumQuantity;
    elements.displayOrder.value =
      product.displayOrder || 0;

    setText(
      elements.descriptionCount,
      String(
        (product.description || '').length
      ) + '/700'
    );

    const modeRadio = document.querySelector(
      'input[name="quantityMode"][value="' +
      state.quantityMode +
      '"]'
    );

    if (modeRadio) {
      modeRadio.checked = true;
    }

    if (state.quantityMode === 'COUNT') {
      elements.basePrice.value =
        product.basePrice || '';
      elements.unitLabel.value =
        product.unitLabel || 'Piece';
    } else {
      elements.optionUnitLabel.value =
        product.unitLabel ||
        (
          state.quantityMode === 'PORTION'
            ? 'Portion'
            : 'Volume'
        );

      elements.optionsContainer.innerHTML = '';

      (product.quantityOptions || [])
        .forEach(addQuantityOption);
    }

    renderQuantityMode(false);

    if (
      state.quantityMode !== 'COUNT' &&
      !elements.optionsContainer.children.length
    ) {
      resetQuantityOptions(
        state.quantityMode
      );
    }

    setPreview(
      elements.thumbnailPreview,
      product.thumbnailUrl,
      product.productName
    );

    setPreview(
      elements.detailPreview,
      product.detailImageUrl,
      product.productName
    );

    setText(
      elements.thumbnailFileName,
      product.thumbnailFileId
        ? 'Thumbnail saved'
        : 'Select thumbnail'
    );

    setText(
      elements.detailFileName,
      product.detailImageFileId
        ? 'Detail image saved'
        : 'Select detail image'
    );

    setHidden(elements.addonSection, false);

    setHidden(
      elements.publishButton,
      normalize(product.productStatus) ===
        'ACTIVE'
    );

    renderAddonList();
  }

  function openProductEditor(product) {
    if (state.saving || state.publishing) {
      return;
    }

    if (product) {
      fillProductEditor(product);
    } else {
      resetProductEditor();
    }

    setHidden(elements.productEditor, false);
    document.body.style.overflow = 'hidden';

    window.setTimeout(function() {
      if (elements.productName) {
        elements.productName.focus();
      }
    }, 80);
  }

  function closeProductEditor() {
    if (
      state.saving ||
      state.publishing ||
      state.uploading
    ) {
      return;
    }

    setHidden(elements.productEditor, true);

    if (
      !elements.addonEditor ||
      elements.addonEditor.hidden
    ) {
      document.body.style.overflow = '';
    }
  }

  function collectQuantityOptions() {
    if (!elements.optionsContainer) {
      return [];
    }

    return Array.from(
      elements.optionsContainer.querySelectorAll(
        '.chef-product-option-row'
      )
    ).map(function(row) {
      const labelInput = row.querySelector(
        '[data-option-label]'
      );

      const priceInput = row.querySelector(
        '[data-option-price]'
      );

      return {
        code: cleanText(
          row.dataset.optionCode
        ),
        label: cleanText(
          labelInput && labelInput.value
        ),
        price: numberValue(
          priceInput && priceInput.value,
          NaN
        )
      };
    });
  }

  function validateProductForm() {
    clearErrors();

    let valid = true;
    const quantityMode =
      getSelectedQuantityMode();

    const productName = cleanText(
      elements.productName.value
    );
    const category = normalize(
      elements.category.value
    );
    const foodType = normalize(
      elements.foodType.value
    );
    const description = cleanText(
      elements.description.value
    );

    if (!productName) {
      setError(
        elements.errors.productName,
        'Product name is required.'
      );
      valid = false;
    }

    if (!category) {
      setError(
        elements.errors.category,
        'Select a Product category.'
      );
      valid = false;
    }

    if (!foodType) {
      setError(
        elements.errors.foodType,
        'Select VEG or NON-VEG.'
      );
      valid = false;
    }

    if (!description) {
      setError(
        elements.errors.description,
        'Product description is required.'
      );
      valid = false;
    }

    const availableQuantity = numberValue(
      elements.availableQuantity.value,
      NaN
    );

    const preparationMinutes = numberValue(
      elements.preparationMinutes.value,
      NaN
    );

    const minimumQuantity = numberValue(
      elements.minimumQuantity.value,
      NaN
    );

    const maximumQuantity = numberValue(
      elements.maximumQuantity.value,
      NaN
    );

    if (
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0 ||
      availableQuantity > 10000
    ) {
      setError(
        elements.errors.availableQuantity,
        'Enter stock between 0 and 10,000.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(preparationMinutes) ||
      preparationMinutes < 5 ||
      preparationMinutes > 240
    ) {
      setError(
        elements.errors.preparationMinutes,
        'Enter preparation time between 5 and 240 minutes.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(minimumQuantity) ||
      minimumQuantity < 1 ||
      minimumQuantity > 100
    ) {
      setError(
        elements.errors.minimumQuantity,
        'Minimum quantity must be between 1 and 100.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(maximumQuantity) ||
      maximumQuantity < minimumQuantity ||
      maximumQuantity > 100
    ) {
      setError(
        elements.errors.maximumQuantity,
        'Maximum quantity must be equal to or greater than minimum quantity.'
      );
      valid = false;
    }

    const payload = {
      productName: productName,
      category: category,
      foodType: foodType,
      description: description,
      quantityMode: quantityMode,
      availableQuantity: availableQuantity,
      minimumQuantity: minimumQuantity,
      maximumQuantity: maximumQuantity,
      preparationMinutes:
        preparationMinutes,
      displayOrder: Math.max(
        0,
        Math.floor(
          numberValue(
            elements.displayOrder.value,
            0
          )
        )
      )
    };

    if (quantityMode === 'COUNT') {
      const basePrice = numberValue(
        elements.basePrice.value,
        NaN
      );

      const unitLabel = cleanText(
        elements.unitLabel.value
      );

      if (
        !Number.isFinite(basePrice) ||
        basePrice < 1 ||
        basePrice > 100000
      ) {
        setError(
          elements.errors.basePrice,
          'Enter a valid price.'
        );
        valid = false;
      }

      if (!unitLabel) {
        setError(
          elements.errors.unitLabel,
          'Enter a unit name.'
        );
        valid = false;
      }

      payload.basePrice = basePrice;
      payload.unitLabel = unitLabel;
      payload.quantityOptions = [];
    } else {
      const unitLabel = cleanText(
        elements.optionUnitLabel.value
      );

      const quantityOptions =
        collectQuantityOptions();

      if (!unitLabel) {
        setError(
          elements.errors.optionUnitLabel,
          'Enter an option group name.'
        );
        valid = false;
      }

      if (
        quantityOptions.length < 2 ||
        quantityOptions.length > 10
      ) {
        setError(
          elements.errors.quantityOptions,
          'Add between 2 and 10 quantity options.'
        );
        valid = false;
      }

      const usedLabels = {};

      quantityOptions.forEach(
        function(option, index) {
          const key = normalize(option.label);

          if (!option.label) {
            setError(
              elements.errors.quantityOptions,
              'Option ' +
              (index + 1) +
              ' requires a name.'
            );
            valid = false;
          } else if (usedLabels[key]) {
            setError(
              elements.errors.quantityOptions,
              'Quantity option names must be unique.'
            );
            valid = false;
          }

          usedLabels[key] = true;

          if (
            !Number.isFinite(option.price) ||
            option.price < 1 ||
            option.price > 100000
          ) {
            setError(
              elements.errors.quantityOptions,
              'Enter a valid price for every option.'
            );
            valid = false;
          }
        }
      );

      payload.unitLabel = unitLabel;
      payload.quantityOptions =
        quantityOptions;
    }

    return {
      valid: valid,
      payload: payload
    };
  }

  function validateImage(file) {
    if (!file) {
      return {
        valid: true
      };
    }

    if (
      ALLOWED_IMAGE_TYPES.indexOf(
        file.type
      ) === -1
    ) {
      return {
        valid: false,
        message:
          'Only JPG, PNG or WebP images are allowed.'
      };
    }

    if (
      !file.size ||
      file.size > MAX_FILE_BYTES
    ) {
      return {
        valid: false,
        message:
          'Image must be smaller than 5 MB.'
      };
    }

    return {
      valid: true
    };
  }

  function handleImageSelection(
    type
  ) {
    const isThumbnail =
      type === 'thumbnail';

    const input = isThumbnail
      ? elements.thumbnailFile
      : elements.detailFile;

    const file =
      input &&
      input.files &&
      input.files[0]
        ? input.files[0]
        : null;

    const validation =
      validateImage(file);

    if (!validation.valid) {
      input.value = '';

      setError(
        isThumbnail
          ? elements.errors.thumbnail
          : elements.errors.detailImage,
        validation.message
      );

      return;
    }

    setError(
      isThumbnail
        ? elements.errors.thumbnail
        : elements.errors.detailImage,
      ''
    );

    if (isThumbnail) {
      state.thumbnailFile = file;
    } else {
      state.detailFile = file;
    }

    if (!file) {
      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    setPreview(
      isThumbnail
        ? elements.thumbnailPreview
        : elements.detailPreview,
      previewUrl,
      file.name
    );

    setText(
      isThumbnail
        ? elements.thumbnailFileName
        : elements.detailFileName,
      file.name
    );
  }

  function readFileAsBase64(file) {
    return new Promise(
      function(resolve, reject) {
        const reader = new FileReader();

        reader.onload = function() {
          const result = String(
            reader.result || ''
          );

          const separatorIndex =
            result.indexOf(',');

          if (separatorIndex === -1) {
            reject(
              new Error(
                'Invalid image data.'
              )
            );
            return;
          }

          resolve(
            result.slice(separatorIndex + 1)
          );
        };

        reader.onerror = function() {
          reject(
            new Error(
              'Selected image could not be read.'
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  }

  async function uploadProductImage(
    productId,
    file,
    purpose
  ) {
    const base64Data =
      await readFileAsBase64(file);

    const response =
      await window.ApnaBiteAPI.request(
        'drive.upload',
        {
          purpose: purpose,
          kitchenId: state.kitchenId,
          productId: productId,
          imageSlot:
            purpose ===
            'PRODUCT_DETAIL_IMAGE'
              ? 'DETAIL'
              : 'THUMBNAIL',
          fileName: file.name,
          mimeType: file.type,
          base64Data: base64Data
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 45000
        }
      );

    const data = getResponseData(response);

    if (!cleanText(data.fileId)) {
      throw new Error(
        'Uploaded image File ID was not returned.'
      );
    }

    return data;
  }

  async function refreshSingleProduct(productId) {
    const response =
      await window.ApnaBiteAPI.request(
        'chef.product.get',
        {
          productId: productId
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 15000
        }
      );

    const data = getResponseData(response);
    return data.product || null;
  }

  function replaceProductLocally(product) {
    if (!product || !product.productId) {
      return;
    }

    const index = state.products.findIndex(
      function(item) {
        return (
          item.productId ===
          product.productId
        );
      }
    );

    if (index === -1) {
      state.products.unshift(product);
    } else {
      state.products[index] = product;
    }

    state.currentProduct = product;
  }

  async function handleProductSave(event) {
    event.preventDefault();

    if (state.saving || state.publishing) {
      return;
    }

    const result = validateProductForm();

    if (!result.valid) {
      showToast(
        'Check the highlighted Product details.',
        'error'
      );
      return;
    }

    const existingProductId =
      cleanText(elements.productId.value);

    state.saving = true;

    setButtonLoading(
      elements.saveButton,
      true,
      'SAVING…'
    );

    setText(
      elements.formMessage,
      'Saving Product details…'
    );

    try {
      const action = existingProductId
        ? 'chef.product.update'
        : 'chef.product.create';

      const payload =
        Object.assign(
          {},
          result.payload
        );

      if (existingProductId) {
        payload.productId =
          existingProductId;
      }

      const response =
        await window.ApnaBiteAPI.request(
          action,
          payload,
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 25000
          }
        );

      const data = getResponseData(response);
      let product = data.product || null;

      if (!product || !product.productId) {
        throw new Error(
          'Saved Product was not returned.'
        );
      }

      const productId = product.productId;

      if (
        state.thumbnailFile ||
        state.detailFile
      ) {
        state.uploading = true;

        setButtonLoading(
          elements.saveButton,
          true,
          'UPLOADING IMAGE…'
        );

        setText(
          elements.formMessage,
          'Uploading Product images…'
        );

        if (state.thumbnailFile) {
          await uploadProductImage(
            productId,
            state.thumbnailFile,
            'PRODUCT_THUMBNAIL'
          );
        }

        if (state.detailFile) {
          await uploadProductImage(
            productId,
            state.detailFile,
            'PRODUCT_DETAIL_IMAGE'
          );
        }

        product =
          await refreshSingleProduct(
            productId
          ) || product;
      }

      state.thumbnailFile = null;
      state.detailFile = null;

      replaceProductLocally(product);
      fillProductEditor(product);
      renderProducts();

      setText(
        elements.formMessage,
        'Product saved successfully.'
      );

      showToast(
        'Product saved successfully.',
        'success'
      );

      /*
       * Counts may change after editing, so only
       * one background list refresh is performed.
       */
      await loadProductsAfterMutation(
        product.productId
      );
    } catch (error) {
      setText(
        elements.formMessage,
        cleanText(error && error.message) ||
        'Product could not be saved.'
      );

      handleApiError(error);
    } finally {
      state.uploading = false;
      state.saving = false;

      setButtonLoading(
        elements.saveButton,
        false
      );
    }
  }

  async function loadProductsAfterMutation(
    selectedProductId
  ) {
    const response =
      await window.ApnaBiteAPI.request(
        'chef.product.list',
        {
          page: 1,
          pageSize: 50
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 20000
        }
      );

    const data = getResponseData(response);

    state.products =
      Array.isArray(data.items)
        ? data.items
        : state.products;

    state.counts =
      data.counts || state.counts;

    if (selectedProductId) {
      const refreshed =
        getProductById(selectedProductId);

      if (refreshed) {
        state.currentProduct = refreshed;
      }
    }

    renderPage();
  }

  async function publishProduct(productId) {
    if (state.saving || state.publishing) {
      return;
    }

    const cleanProductId = cleanText(
      productId ||
      (
        state.currentProduct &&
        state.currentProduct.productId
      )
    );

    if (!cleanProductId) {
      showToast(
        'Save the Product before publishing.',
        'info'
      );
      return;
    }

    state.publishing = true;

    setButtonLoading(
      elements.publishButton,
      true,
      'PUBLISHING…'
    );

    setText(
      elements.formMessage,
      'Publishing Product…'
    );

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.product.publish',
          {
            productId: cleanProductId
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 20000
          }
        );

      const data = getResponseData(response);
      const product = data.product || null;

      if (product) {
        replaceProductLocally(product);

        if (
          !elements.productEditor.hidden
        ) {
          fillProductEditor(product);
        }
      }

      await loadProductsAfterMutation(
        cleanProductId
      );

      setText(
        elements.formMessage,
        'Product published successfully.'
      );

      showToast(
        'Product published. Turn it online when ready.',
        'success'
      );
    } catch (error) {
      setText(
        elements.formMessage,
        cleanText(error && error.message) ||
        'Product could not be published.'
      );

      handleApiError(error);
    } finally {
      state.publishing = false;

      setButtonLoading(
        elements.publishButton,
        false
      );
    }
  }

  async function changeProductAvailability(
    productId,
    availabilityStatus
  ) {
    if (state.saving || state.publishing) {
      return;
    }

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.product.availability',
          {
            productId: productId,
            availabilityStatus:
              availabilityStatus
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 15000
          }
        );

      const data = getResponseData(response);

      if (data.product) {
        replaceProductLocally(
          data.product
        );
      }

      await loadProductsAfterMutation(
        productId
      );

      showToast(
        availabilityStatus === 'ONLINE'
          ? 'Product is now online.'
          : 'Product is now offline.',
        'success'
      );
    } catch (error) {
      handleApiError(error);
    }
  }

  /*
   * Continue directly with Part 3 below this line.
   */
   function resetAddonEditor() {
    if (elements.addonForm) {
      elements.addonForm.reset();
    }

    state.currentAddon = null;
    clearErrors();

    setText(
      elements.addonEditorTitle,
      'Add extra'
    );

    elements.addonId.value = '';
    elements.addonAvailableQuantity.value =
      '10';
    elements.addonMinimumQuantity.value =
      '0';
    elements.addonMaximumQuantity.value =
      '5';
    elements.addonDisplayOrder.value =
      '0';
  }

  function openAddonEditor(addon) {
    if (!state.currentProduct) {
      showToast(
        'Save the Product before adding extras.',
        'info'
      );
      return;
    }

    resetAddonEditor();

    if (addon) {
      state.currentAddon = addon;

      setText(
        elements.addonEditorTitle,
        'Edit extra'
      );

      elements.addonId.value =
        addon.addonId || '';
      elements.addonName.value =
        addon.addonName || '';
      elements.addonDescription.value =
        addon.addonDescription || '';
      elements.addonPrice.value =
        addon.unitPrice;
      elements.addonAvailableQuantity.value =
        addon.availableQuantity;
      elements.addonMinimumQuantity.value =
        addon.minimumQuantity;
      elements.addonMaximumQuantity.value =
        addon.maximumQuantity;
      elements.addonDisplayOrder.value =
        addon.displayOrder || 0;
    }

    setHidden(elements.addonEditor, false);
    document.body.style.overflow = 'hidden';

    window.setTimeout(function() {
      elements.addonName.focus();
    }, 80);
  }

  function closeAddonEditor() {
    if (state.saving) {
      return;
    }

    setHidden(elements.addonEditor, true);

    if (
      !elements.productEditor ||
      elements.productEditor.hidden
    ) {
      document.body.style.overflow = '';
    }
  }

  function validateAddonForm() {
    clearErrors();

    let valid = true;

    const addonName = cleanText(
      elements.addonName.value
    );

    const addonDescription = cleanText(
      elements.addonDescription.value
    );

    const unitPrice = numberValue(
      elements.addonPrice.value,
      NaN
    );

    const availableQuantity = numberValue(
      elements.addonAvailableQuantity.value,
      NaN
    );

    const minimumQuantity = numberValue(
      elements.addonMinimumQuantity.value,
      NaN
    );

    const maximumQuantity = numberValue(
      elements.addonMaximumQuantity.value,
      NaN
    );

    if (!addonName) {
      setError(
        elements.errors.addonName,
        'Add-on name is required.'
      );
      valid = false;
    }

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      unitPrice > 10000
    ) {
      setError(
        elements.errors.addonPrice,
        'Enter a valid Add-on price.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(availableQuantity) ||
      availableQuantity < 0 ||
      availableQuantity > 10000
    ) {
      setError(
        elements.addonFormError,
        'Available stock must be between 0 and 10,000.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(minimumQuantity) ||
      minimumQuantity < 0 ||
      minimumQuantity > 100
    ) {
      setError(
        elements.addonFormError,
        'Minimum Add-on quantity must be between 0 and 100.'
      );
      valid = false;
    }

    if (
      !Number.isInteger(maximumQuantity) ||
      maximumQuantity < minimumQuantity ||
      maximumQuantity > 100
    ) {
      setError(
        elements.addonFormError,
        'Maximum Add-on quantity must be equal to or greater than minimum quantity.'
      );
      valid = false;
    }

    return {
      valid: valid,
      payload: {
        addonName: addonName,
        addonDescription:
          addonDescription,
        unitPrice: unitPrice,
        availableQuantity:
          availableQuantity,
        minimumQuantity:
          minimumQuantity,
        maximumQuantity:
          maximumQuantity,
        displayOrder: Math.max(
          0,
          Math.floor(
            numberValue(
              elements.addonDisplayOrder.value,
              0
            )
          )
        )
      }
    };
  }

  async function handleAddonSave(event) {
    event.preventDefault();

    if (
      state.saving ||
      !state.currentProduct
    ) {
      return;
    }

    const result = validateAddonForm();

    if (!result.valid) {
      showToast(
        'Check the Add-on details.',
        'error'
      );
      return;
    }

    const addonId = cleanText(
      elements.addonId.value
    );

    const payload = Object.assign(
      {},
      result.payload
    );

    const action = addonId
      ? 'chef.product.addon.update'
      : 'chef.product.addon.create';

    if (addonId) {
      payload.addonId = addonId;
    } else {
      payload.productId =
        state.currentProduct.productId;
    }

    state.saving = true;

    setButtonLoading(
      elements.addonSaveButton,
      true,
      'SAVING…'
    );

    try {
      await window.ApnaBiteAPI.request(
        action,
        payload,
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 15000
        }
      );

      const refreshed =
        await refreshSingleProduct(
          state.currentProduct.productId
        );

      if (refreshed) {
        replaceProductLocally(refreshed);
        renderAddonList();
        renderProducts();
      }

      closeAddonEditor();

      showToast(
        addonId
          ? 'Extra updated successfully.'
          : 'Extra added successfully.',
        'success'
      );
    } catch (error) {
      setError(
        elements.addonFormError,
        cleanText(error && error.message) ||
        'Add-on could not be saved.'
      );

      handleApiError(error);
    } finally {
      state.saving = false;

      setButtonLoading(
        elements.addonSaveButton,
        false
      );
    }
  }

  async function changeAddonStatus(
    addonId,
    addonStatus
  ) {
    if (
      state.saving ||
      !state.currentProduct
    ) {
      return;
    }

    state.saving = true;

    try {
      await window.ApnaBiteAPI.request(
        'chef.product.addon.status',
        {
          addonId: addonId,
          addonStatus: addonStatus
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 15000
        }
      );

      const refreshed =
        await refreshSingleProduct(
          state.currentProduct.productId
        );

      if (refreshed) {
        replaceProductLocally(refreshed);
        renderAddonList();
        renderProducts();
      }

      showToast(
        addonStatus === 'ACTIVE'
          ? 'Extra activated.'
          : 'Extra disabled.',
        'success'
      );
    } catch (error) {
      handleApiError(error);
    } finally {
      state.saving = false;
    }
  }

  function handleProductListClick(event) {
    const button = event.target.closest(
      '[data-product-id][data-action]'
    );

    if (!button) {
      return;
    }

    const productId =
      cleanText(button.dataset.productId);

    const action =
      cleanText(button.dataset.action);

    const product =
      getProductById(productId);

    if (action === 'edit') {
      openProductEditor(product);
      return;
    }

    if (action === 'publish') {
      publishProduct(productId);
      return;
    }

    if (action === 'online') {
      changeProductAvailability(
        productId,
        'ONLINE'
      );
      return;
    }

    if (action === 'offline') {
      changeProductAvailability(
        productId,
        'OFFLINE'
      );
    }
  }

  function handleAddonListClick(event) {
    const button = event.target.closest(
      '[data-addon-id][data-addon-action]'
    );

    if (!button) {
      return;
    }

    const addonId =
      cleanText(button.dataset.addonId);

    const action =
      cleanText(
        button.dataset.addonAction
      );

    if (action === 'edit') {
      openAddonEditor(
        getAddonById(addonId)
      );
      return;
    }

    changeAddonStatus(
      addonId,
      action === 'enable'
        ? 'ACTIVE'
        : 'INACTIVE'
    );
  }

  function bindEvents() {
    if (elements.refreshButton) {
      elements.refreshButton.addEventListener(
        'click',
        loadProducts
      );
    }

    if (elements.retryButton) {
      elements.retryButton.addEventListener(
        'click',
        loadProducts
      );
    }

    if (elements.addButton) {
      elements.addButton.addEventListener(
        'click',
        function() {
          openProductEditor(null);
        }
      );
    }

    if (elements.emptyAddButton) {
      elements.emptyAddButton.addEventListener(
        'click',
        function() {
          openProductEditor(null);
        }
      );
    }

    document.querySelectorAll(
      '.chef-menu-count'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        function() {
          state.filter =
            button.dataset.filter || 'ALL';

          renderPage();
        }
      );
    });

    if (elements.searchInput) {
      elements.searchInput.addEventListener(
        'input',
        function() {
          /*
           * Search is local. No API call is made
           * for every typed character.
           */
          state.search = cleanText(
            elements.searchInput.value
          ).toLowerCase();

          renderProducts();
        }
      );
    }

    if (elements.categoryFilter) {
      elements.categoryFilter.addEventListener(
        'change',
        function() {
          state.category = normalize(
            elements.categoryFilter.value
          );

          renderProducts();
        }
      );
    }

    if (elements.productList) {
      elements.productList.addEventListener(
        'click',
        handleProductListClick
      );
    }

    if (elements.productEditorClose) {
      elements.productEditorClose
        .addEventListener(
          'click',
          closeProductEditor
        );
    }

    document.querySelectorAll(
      '[data-close-product-editor]'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        closeProductEditor
      );
    });

    document.querySelectorAll(
      'input[name="quantityMode"]'
    ).forEach(function(radio) {
      radio.addEventListener(
        'change',
        function() {
          renderQuantityMode(true);
          clearErrors();
        }
      );
    });

    if (elements.addOptionButton) {
      elements.addOptionButton.addEventListener(
        'click',
        function() {
          addQuantityOption({
            label: '',
            price: ''
          });
        }
      );
    }

    if (elements.optionsContainer) {
      elements.optionsContainer
        .addEventListener(
          'click',
          function(event) {
            const button = event.target.closest(
              '[data-remove-option]'
            );

            if (!button) {
              return;
            }

            const rows =
              elements.optionsContainer
                .querySelectorAll(
                  '.chef-product-option-row'
                );

            if (rows.length <= 2) {
              showToast(
                'At least 2 quantity options are required.',
                'info'
              );
              return;
            }

            const row = button.closest(
              '.chef-product-option-row'
            );

            if (row) {
              row.remove();
            }
          }
        );
    }

    if (elements.description) {
      elements.description.addEventListener(
        'input',
        function() {
          setText(
            elements.descriptionCount,
            String(
              elements.description.value.length
            ) + '/700'
          );

          setError(
            elements.errors.description,
            ''
          );
        }
      );
    }

    [
      ['productName', elements.productName],
      ['category', elements.category],
      ['foodType', elements.foodType],
      ['basePrice', elements.basePrice],
      ['unitLabel', elements.unitLabel],
      [
        'optionUnitLabel',
        elements.optionUnitLabel
      ],
      [
        'availableQuantity',
        elements.availableQuantity
      ],
      [
        'preparationMinutes',
        elements.preparationMinutes
      ],
      [
        'minimumQuantity',
        elements.minimumQuantity
      ],
      [
        'maximumQuantity',
        elements.maximumQuantity
      ]
    ].forEach(function(entry) {
      const errorKey = entry[0];
      const input = entry[1];

      if (!input) {
        return;
      }

      input.addEventListener(
        'input',
        function() {
          setError(
            elements.errors[errorKey],
            ''
          );
        }
      );

      input.addEventListener(
        'change',
        function() {
          setError(
            elements.errors[errorKey],
            ''
          );
        }
      );
    });

    if (elements.thumbnailFile) {
      elements.thumbnailFile.addEventListener(
        'change',
        function() {
          handleImageSelection('thumbnail');
        }
      );
    }

    if (elements.detailFile) {
      elements.detailFile.addEventListener(
        'change',
        function() {
          handleImageSelection('detail');
        }
      );
    }

    if (elements.productForm) {
      elements.productForm.addEventListener(
        'submit',
        handleProductSave
      );
    }

    if (elements.publishButton) {
      elements.publishButton.addEventListener(
        'click',
        function() {
          publishProduct(
            state.currentProduct
              ? state.currentProduct.productId
              : ''
          );
        }
      );
    }

    if (elements.addAddonButton) {
      elements.addAddonButton.addEventListener(
        'click',
        function() {
          openAddonEditor(null);
        }
      );
    }

    if (elements.addonList) {
      elements.addonList.addEventListener(
        'click',
        handleAddonListClick
      );
    }

    if (elements.addonEditorClose) {
      elements.addonEditorClose
        .addEventListener(
          'click',
          closeAddonEditor
        );
    }

    document.querySelectorAll(
      '[data-close-addon-editor]'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        closeAddonEditor
      );
    });

    if (elements.addonForm) {
      elements.addonForm.addEventListener(
        'submit',
        handleAddonSave
      );
    }

    if (elements.addonName) {
      elements.addonName.addEventListener(
        'input',
        function() {
          setError(
            elements.errors.addonName,
            ''
          );
        }
      );
    }

    if (elements.addonPrice) {
      elements.addonPrice.addEventListener(
        'input',
        function() {
          setError(
            elements.errors.addonPrice,
            ''
          );
        }
      );
    }

    document.addEventListener(
      'keydown',
      function(event) {
        if (event.key !== 'Escape') {
          return;
        }

        if (
          elements.addonEditor &&
          !elements.addonEditor.hidden
        ) {
          closeAddonEditor();
          return;
        }

        if (
          elements.productEditor &&
          !elements.productEditor.hidden
        ) {
          closeProductEditor();
        }
      }
    );

    window.addEventListener(
      'pageshow',
      function(event) {
        /*
         * Browser back/forward cache should render
         * existing data without another API load.
         */
        if (
          event.persisted &&
          state.initialized
        ) {
          renderPage();
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList.contains(
        'chef-menu-page'
      ) ||
      state.initialized
    ) {
      return;
    }

    getElements();
    bindEvents();
    resetProductEditor();

    state.initialized = true;

    try {
      const user =
        await validateChefSession();

      if (!user) {
        return;
      }

      await loadProducts();
    } catch (error) {
      setHidden(elements.loading, true);
      setHidden(elements.content, true);
      setHidden(elements.error, false);

      setText(
        elements.errorMessage,
        cleanText(error && error.message) ||
        'Chef session could not be verified.'
      );

      handleApiError(error);
    }
  }

  window.ApnaBiteChefMenu =
    Object.freeze({
      initialize: initialize,
      loadProducts: loadProducts,
      openProductEditor:
        openProductEditor
    });

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );
  } else {
    initialize();
  }
})(window, document);
