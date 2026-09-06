/**
 * ============================================================
 * APNABITE V1 — CHEF MENU CONTROLLER
 * File: assets/js/chef/menu.js
 * Part 1 of 3
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const MAX_FILE_BYTES =
    5 * 1024 * 1024;

  const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

  const state = {
    initialized: false,
    loading: false,
    saving: false,
    detailLoading: false,
    currentPage: 1,
    pageSize: 20,
    totalPages: 1,
    selectedStatus: 'ALL',
    selectedCategory: 'ALL',
    search: '',
    searchTimer: null,
    kitchenId: '',
    kitchenName: '',
    products: [],
    counts: {},
    selectedProduct: null,
    selectedThumbnail: null,
    selectedDetailImage: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.refreshButton =
      byId('chef-menu-refresh-button');

    elements.addProductButton =
      byId('chef-menu-add-product-button');

    elements.kitchenName =
      byId('chef-menu-kitchen-name');

    elements.loading =
      byId('chef-menu-loading');

    elements.error =
      byId('chef-menu-error');

    elements.errorTitle =
      byId('chef-menu-error-title');

    elements.errorMessage =
      byId('chef-menu-error-message');

    elements.retryButton =
      byId('chef-menu-retry-button');

    elements.content =
      byId('chef-menu-content');

    elements.countAll =
      byId('chef-menu-count-all');

    elements.countActive =
      byId('chef-menu-count-active');

    elements.countDraft =
      byId('chef-menu-count-draft');

    elements.countPending =
      byId('chef-menu-count-pending');

    elements.searchInput =
      byId('chef-menu-search-input');

    elements.searchClear =
      byId('chef-menu-search-clear');

    elements.categoryFilter =
      byId('chef-menu-category-filter');

    elements.productList =
      byId('chef-menu-product-list');

    elements.empty =
      byId('chef-menu-empty');

    elements.emptyTitle =
      byId('chef-menu-empty-title');

    elements.emptyMessage =
      byId('chef-menu-empty-message');

    elements.emptyAddButton =
      byId('chef-menu-empty-add-button');

    elements.pagination =
      byId('chef-menu-pagination');

    elements.previousPage =
      byId('chef-menu-previous-page');

    elements.nextPage =
      byId('chef-menu-next-page');

    elements.pageStatus =
      byId('chef-menu-page-status');

    elements.productModal =
      byId('chef-product-modal');

    elements.productModalEyebrow =
      byId('chef-product-modal-eyebrow');

    elements.productModalTitle =
      byId('chef-product-modal-title');

    elements.productForm =
      byId('chef-product-form');

    elements.productId =
      byId('chef-product-id');

    elements.productName =
      byId('chef-product-name');

    elements.productCategory =
      byId('chef-product-category');

    elements.productFoodType =
      byId('chef-product-food-type');

    elements.productDescription =
      byId('chef-product-description');

    elements.productDescriptionCount =
      byId('chef-product-description-count');

    elements.productPrice =
      byId('chef-product-price');

    elements.productStock =
      byId('chef-product-stock');

    elements.productMinimum =
      byId('chef-product-minimum-quantity');

    elements.productMaximum =
      byId('chef-product-maximum-quantity');

    elements.productPreparation =
      byId('chef-product-preparation');

    elements.productDisplayOrder =
      byId('chef-product-display-order');

    elements.thumbnailFile =
      byId('chef-product-thumbnail-file');

    elements.thumbnailPreview =
      byId('chef-product-thumbnail-preview');

    elements.thumbnailName =
      byId('chef-product-thumbnail-name');

    elements.detailFile =
      byId('chef-product-detail-file');

    elements.detailPreview =
      byId('chef-product-detail-preview');

    elements.detailName =
      byId('chef-product-detail-file-name');
    
    elements.existingStatus =
      byId('chef-product-existing-status');

    elements.currentModeration =
      byId('chef-product-current-moderation');

    elements.adminRemark =
      byId('chef-product-admin-remark');

    elements.productGeneralError =
      byId('chef-product-form-general-error');

    elements.productSaveButton =
      byId('chef-product-save-button');

    elements.productNameError =
      byId('chef-product-name-error');

    elements.productCategoryError =
      byId('chef-product-category-error');

    elements.productFoodTypeError =
      byId('chef-product-food-type-error');

    elements.productDescriptionError =
      byId('chef-product-description-error');

    elements.productPriceError =
      byId('chef-product-price-error');

    elements.productStockError =
      byId('chef-product-stock-error');

    elements.productMinimumError =
      byId('chef-product-minimum-error');

    elements.productMaximumError =
      byId('chef-product-maximum-error');

    elements.productPreparationError =
      byId('chef-product-preparation-error');

    elements.thumbnailError =
      byId('chef-product-thumbnail-error');

    elements.detailError =
      byId('chef-product-detail-error');

    elements.detailModal =
      byId('chef-product-detail-modal');

    elements.detailModalTitle =
      byId('chef-product-detail-title');

    elements.detailLoading =
      byId('chef-product-detail-loading');

    elements.detailContent =
      byId('chef-product-detail-content');

    elements.detailImage =
      byId('chef-product-detail-image');

    elements.detailFoodType =
      byId('chef-product-detail-food-type');

    elements.detailModeration =
      byId('chef-product-detail-moderation');

    elements.detailNameText =
      byId('chef-product-detail-name');

    elements.detailDescription =
      byId('chef-product-detail-description');

    elements.detailPrice =
      byId('chef-product-detail-price');

    elements.detailStatusMessage =
      byId('chef-product-detail-status-message');

    elements.editProductButton =
      byId('chef-product-edit-button');

    elements.submitApprovalButton =
      byId('chef-product-submit-approval-button');

    elements.onlineToggle =
      byId('chef-product-online-toggle');

    elements.addAddonButton =
      byId('chef-product-add-addon-button');

    elements.addonList =
      byId('chef-product-addon-list');

    elements.addonEmpty =
      byId('chef-product-addon-empty');

    elements.addonModal =
      byId('chef-addon-modal');

    elements.addonModalTitle =
      byId('chef-addon-modal-title');

    elements.addonForm =
      byId('chef-addon-form');

    elements.addonId =
      byId('chef-addon-id');

    elements.addonProductId =
      byId('chef-addon-product-id');

    elements.addonName =
      byId('chef-addon-name');

    elements.addonDescription =
      byId('chef-addon-description');

    elements.addonPrice =
      byId('chef-addon-price');

    elements.addonStock =
      byId('chef-addon-stock');

    elements.addonMinimum =
      byId('chef-addon-minimum');

    elements.addonMaximum =
      byId('chef-addon-maximum');

    elements.addonDisplayOrder =
      byId('chef-addon-display-order');

    elements.addonNameError =
      byId('chef-addon-name-error');

    elements.addonPriceError =
      byId('chef-addon-price-error');

    elements.addonStockError =
      byId('chef-addon-stock-error');

    elements.addonQuantityError =
      byId('chef-addon-quantity-error');

    elements.addonFormError =
      byId('chef-addon-form-error');

    elements.addonSaveButton =
      byId('chef-addon-save-button');
  }

  function cleanText(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    )
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeStatus(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  function toNumber(value, fallback) {
    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : (
        fallback === undefined
          ? 0
          : fallback
      );
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

  function setText(element, value) {
    if (element) {
      element.textContent =
        cleanText(value);
    }
  }

  function setHidden(element, hidden) {
    if (element) {
      element.hidden =
        Boolean(hidden);
    }
  }

  function setError(element, message) {
    setText(
      element,
      message
    );

    setHidden(
      element,
      !message
    );
  }

  function showToast(message, type) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .showToast === 'function'
    ) {
      window.ApnaBiteUI.showToast(
        message,
        type || 'info'
      );
    }
  }

  function formatMoney(value) {
    const amount =
      toNumber(value, 0);

    try {
      return new Intl.NumberFormat(
        'en-IN',
        {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits:
            amount % 1 === 0
              ? 0
              : 2
        }
      ).format(amount);
    } catch (error) {
      return '₹' + amount;
    }
  }

  function formatLabel(value) {
    const text =
      normalizeStatus(value)
        .replace(/_/g, ' ')
        .toLowerCase();

    return text.replace(
      /\b\w/g,
      function(character) {
        return character.toUpperCase();
      }
    );
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function setPageLoading(loading) {
    state.loading =
      Boolean(loading);

    setHidden(
      elements.loading,
      !state.loading
    );

    if (elements.refreshButton) {
      elements.refreshButton.disabled =
        state.loading;

      elements.refreshButton.textContent =
        state.loading
          ? 'Loading…'
          : 'Refresh';
    }
  }

  function showPageError(message) {
    setText(
      elements.errorTitle,
      'Menu could not be loaded'
    );

    setText(
      elements.errorMessage,
      message ||
      'Please check your connection and try again.'
    );

    setHidden(
      elements.error,
      false
    );

    setHidden(
      elements.content,
      true
    );
  }

  function clearPageError() {
    setHidden(
      elements.error,
      true
    );
  }

  function requireChefSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      showPageError(
        'Required application files did not load.'
      );

      return false;
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession ===
        'function'
    ) {
      return Boolean(
        window.ApnaBiteCore
          .requireLocalSession(
            ['CHEF']
          )
      );
    }

    return Boolean(
      typeof window.ApnaBiteCore
        .getSessionToken ===
        'function' &&
      window.ApnaBiteCore
        .getSessionToken()
    );
  }

  function getStatusClass(status) {
    const normalized =
      normalizeStatus(status);

    if (normalized === 'APPROVED') {
      return 'chef-menu-product-status--approved';
    }

    if (normalized === 'PENDING') {
      return 'chef-menu-product-status--pending';
    }

    if (normalized === 'REJECTED') {
      return 'chef-menu-product-status--rejected';
    }

    if (normalized === 'ONLINE') {
      return 'chef-menu-product-status--online';
    }

    if (normalized === 'OUT_OF_STOCK') {
      return 'chef-menu-product-status--out';
    }

    if (normalized === 'DRAFT') {
      return 'chef-menu-product-status--draft';
    }

    return 'chef-menu-product-status--offline';
  }

  function getProductById(productId) {
    return state.products.find(
      function(product) {
        return (
          cleanText(product.productId) ===
          cleanText(productId)
        );
      }
    ) || null;
  }

  function renderCounts() {
    const counts =
      state.counts || {};

    setText(
      elements.countAll,
      toNumber(counts.all, 0)
    );

    setText(
      elements.countActive,
      toNumber(counts.active, 0)
    );

    setText(
      elements.countDraft,
      toNumber(counts.draft, 0)
    );

    setText(
      elements.countPending,
      toNumber(
        counts.pendingModeration,
        0
      )
    );
  }

  function productMatchesLocalCategory(
    product
  ) {
    if (
      state.selectedCategory === 'ALL'
    ) {
      return true;
    }

    return (
      normalizeStatus(
        product.category
      ) === state.selectedCategory
    );
  }

  function createProductCardHtml(product) {
    const productId =
      escapeHtml(product.productId);

    const foodType =
      normalizeStatus(product.foodType);

    const moderation =
      normalizeStatus(
        product.moderationStatus
      ) || 'NOT_SUBMITTED';

    const availability =
      normalizeStatus(
        product.availabilityStatus
      ) || 'OFFLINE';

    const imageUrl =
      cleanText(product.thumbnailUrl) ||
      '../assets/images/logo.png';

    const addonCount =
      Array.isArray(product.addons)
        ? product.addons.length
        : 0;

    return (
      '<article class="chef-menu-product-card">' +

        '<div class="chef-menu-product-card__image-wrap">' +
          '<img class="chef-menu-product-card__image"' +
          ' src="' + escapeHtml(imageUrl) + '"' +
          ' alt="' +
          escapeHtml(product.productName) +
          '"' +
          ' onerror="this.onerror=null;this.src=\'../assets/images/logo.png\';">' +

          '<span class="chef-menu-product-card__food-mark ' +
          (
            foodType === 'NON_VEG'
              ? 'chef-menu-product-card__food-mark--non-veg'
              : ''
          ) +
          '" aria-label="' +
          (
            foodType === 'NON_VEG'
              ? 'Non-Veg'
              : 'Veg'
          ) +
          '"></span>' +
        '</div>' +

        '<div class="chef-menu-product-card__content">' +
          '<div class="chef-menu-product-card__top">' +
            '<div class="chef-menu-product-card__title-wrap">' +
              '<small class="chef-menu-product-card__category">' +
                escapeHtml(
                  formatLabel(product.category)
                ) +
              '</small>' +

              '<h2 class="chef-menu-product-card__title">' +
                escapeHtml(product.productName) +
              '</h2>' +
            '</div>' +

            '<strong class="chef-menu-product-card__price">' +
              escapeHtml(
                formatMoney(product.basePrice)
              ) +
            '</strong>' +
          '</div>' +

          '<p class="chef-menu-product-card__description">' +
            escapeHtml(product.description) +
          '</p>' +

          '<div class="chef-menu-product-card__meta">' +
            '<span>Stock: ' +
              escapeHtml(product.availableQuantity) +
            '</span>' +

            '<span>' +
              escapeHtml(product.preparationMinutes) +
              ' min' +
            '</span>' +

            '<span>' +
              escapeHtml(addonCount) +
              (
                addonCount === 1
                  ? ' Add-on'
                  : ' Add-ons'
              ) +
            '</span>' +
          '</div>' +

          '<div class="chef-menu-product-card__footer">' +
            '<div class="chef-menu-product-card__statuses">' +
              '<span class="chef-menu-product-status ' +
                getStatusClass(moderation) +
              '">' +
                escapeHtml(
                  formatLabel(moderation)
                ) +
              '</span>' +

              '<span class="chef-menu-product-status ' +
                getStatusClass(availability) +
              '">' +
                escapeHtml(
                  formatLabel(availability)
                ) +
              '</span>' +
            '</div>' +

            '<button class="chef-menu-product-card__manage"' +
              ' type="button"' +
              ' data-manage-product="' +
              productId +
              '">' +
              'Manage' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</article>'
    );
  }

  function renderProductList() {
    if (!elements.productList) {
      return;
    }

    const visibleProducts =
      state.products.filter(
        productMatchesLocalCategory
      );

    if (!visibleProducts.length) {
      elements.productList.innerHTML =
        '';

      setHidden(
        elements.empty,
        false
      );

      if (
        state.search ||
        state.selectedStatus !== 'ALL' ||
        state.selectedCategory !== 'ALL'
      ) {
        setText(
          elements.emptyTitle,
          'No matching products'
        );

        setText(
          elements.emptyMessage,
          'Try changing your search or selected filter.'
        );
      } else {
        setText(
          elements.emptyTitle,
          'No products added'
        );

        setText(
          elements.emptyMessage,
          'Add your first homemade food item to start building your menu.'
        );
      }

      return;
    }

    setHidden(
      elements.empty,
      true
    );

    elements.productList.innerHTML =
      visibleProducts
        .map(createProductCardHtml)
        .join('');
  }

  function renderPagination() {
    const totalPages =
      Math.max(
        1,
        state.totalPages
      );

    setHidden(
      elements.pagination,
      totalPages <= 1
    );

    setText(
      elements.pageStatus,
      'Page ' +
      state.currentPage +
      ' of ' +
      totalPages
    );

    if (elements.previousPage) {
      elements.previousPage.disabled =
        state.currentPage <= 1;
    }

    if (elements.nextPage) {
      elements.nextPage.disabled =
        state.currentPage >= totalPages;
    }
  }

  function renderMenu() {
    setText(
      elements.kitchenName,
      state.kitchenName ||
      'Your food items'
    );

    renderCounts();
    renderProductList();
    renderPagination();

    setHidden(
      elements.content,
      false
    );
  }

  /*
   * Continue directly with Part 2 below this line.
   */
    function clearProductErrors() {
    [
      elements.productNameError,
      elements.productCategoryError,
      elements.productFoodTypeError,
      elements.productDescriptionError,
      elements.productPriceError,
      elements.productStockError,
      elements.productMinimumError,
      elements.productMaximumError,
      elements.productPreparationError,
      elements.thumbnailError,
      elements.detailError
    ].forEach(function(element) {
      setError(element, '');
    });

    setHidden(
      elements.productGeneralError,
      true
    );
  }

  function clearAddonErrors() {
    [
      elements.addonNameError,
      elements.addonPriceError,
      elements.addonStockError,
      elements.addonQuantityError
    ].forEach(function(element) {
      setError(element, '');
    });

    setHidden(
      elements.addonFormError,
      true
    );
  }

  function setBodyModalState() {
    const modalOpen =
      (
        elements.productModal &&
        !elements.productModal.hidden
      ) ||
      (
        elements.detailModal &&
        !elements.detailModal.hidden
      ) ||
      (
        elements.addonModal &&
        !elements.addonModal.hidden
      );

    document.body.classList.toggle(
      'chef-menu-modal-open',
      Boolean(modalOpen)
    );
  }

  function resetImagePreview(
    preview,
    fileNameElement,
    icon,
    label
  ) {
    if (preview) {
      preview.innerHTML =
        icon;
    }

    setText(
      fileNameElement,
      label
    );
  }

  function setImagePreview(
    file,
    preview,
    fileNameElement
  ) {
    if (!file) {
      return;
    }

    setText(
      fileNameElement,
      file.name
    );

    if (
      !preview ||
      typeof FileReader ===
        'undefined'
    ) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload =
      function() {
        const image =
          document.createElement(
            'img'
          );

        image.src =
          String(
            reader.result || ''
          );

        image.alt =
          'Selected image preview';

        preview.innerHTML =
          '';

        preview.appendChild(
          image
        );
      };

    reader.readAsDataURL(
      file
    );
  }

  function validateImageFile(file) {
    if (!file) {
      return {
        valid: true
      };
    }

    if (
      ALLOWED_IMAGE_TYPES
        .indexOf(file.type) === -1
    ) {
      return {
        valid: false,
        message:
          'Only JPG, PNG or WebP images are allowed.'
      };
    }

    if (
      !file.size ||
      file.size >
        MAX_FILE_BYTES
    ) {
      return {
        valid: false,
        message:
          'Image must be less than 5 MB.'
      };
    }

    return {
      valid: true
    };
  }

  function resetProductForm() {
    if (elements.productForm) {
      elements.productForm.reset();
    }

    if (elements.productId) {
      elements.productId.value =
        '';
    }

    if (elements.productStock) {
      elements.productStock.value =
        '0';
    }

    if (elements.productMinimum) {
      elements.productMinimum.value =
        '1';
    }

    if (elements.productMaximum) {
      elements.productMaximum.value =
        '10';
    }

    if (elements.productPreparation) {
      elements.productPreparation.value =
        '30';
    }

    if (elements.productDisplayOrder) {
      elements.productDisplayOrder.value =
        '0';
    }

    state.selectedThumbnail =
      null;

    state.selectedDetailImage =
      null;

    resetImagePreview(
      elements.thumbnailPreview,
      elements.thumbnailName,
      '📷',
      'Select thumbnail'
    );

    resetImagePreview(
      elements.detailPreview,
      elements.detailName,
      '🖼️',
      'Select detail image'
    );

    setText(
      elements.productDescriptionCount,
      '0/700'
    );

    setHidden(
      elements.existingStatus,
      true
    );

    setText(
      elements.adminRemark,
      ''
    );

    clearProductErrors();
  }

  function openCreateProductModal() {
    resetProductForm();

    state.selectedProduct =
      null;

    setText(
      elements.productModalEyebrow,
      'NEW PRODUCT'
    );

    setText(
      elements.productModalTitle,
      'Add Product'
    );

    setText(
      elements.productSaveButton,
      'Save Product'
    );

    setHidden(
      elements.productModal,
      false
    );

    setBodyModalState();

    window.setTimeout(
      function() {
        if (elements.productName) {
          elements.productName.focus();
        }
      },
      100
    );
  }

  function populateProductForm(product) {
    resetProductForm();

    state.selectedProduct =
      product;

    if (elements.productId) {
      elements.productId.value =
        product.productId || '';
    }

    if (elements.productName) {
      elements.productName.value =
        product.productName || '';
    }

    if (elements.productCategory) {
      elements.productCategory.value =
        normalizeStatus(
          product.category
        );
    }

    if (elements.productFoodType) {
      elements.productFoodType.value =
        normalizeStatus(
          product.foodType
        );
    }

    if (elements.productDescription) {
      elements.productDescription.value =
        product.description || '';
    }

    if (elements.productPrice) {
      elements.productPrice.value =
        toNumber(
          product.basePrice,
          0
        );
    }

    if (elements.productStock) {
      elements.productStock.value =
        toNumber(
          product.availableQuantity,
          0
        );
    }

    if (elements.productMinimum) {
      elements.productMinimum.value =
        toNumber(
          product.minimumQuantity,
          1
        );
    }

    if (elements.productMaximum) {
      elements.productMaximum.value =
        toNumber(
          product.maximumQuantity,
          1
        );
    }

    if (elements.productPreparation) {
      elements.productPreparation.value =
        toNumber(
          product.preparationMinutes,
          30
        );
    }

    if (elements.productDisplayOrder) {
      elements.productDisplayOrder.value =
        toNumber(
          product.displayOrder,
          0
        );
    }

    const descriptionLength =
      String(
        product.description || ''
      ).length;

    setText(
      elements.productDescriptionCount,
      descriptionLength + '/700'
    );

    if (
      product.thumbnailUrl &&
      elements.thumbnailPreview
    ) {
      elements.thumbnailPreview.innerHTML =
        '<img src="' +
        escapeHtml(
          product.thumbnailUrl
        ) +
        '" alt="Current Product thumbnail">';

      setText(
        elements.thumbnailName,
        'Current thumbnail saved'
      );
    }

    if (
      product.detailImageUrl &&
      elements.detailPreview
    ) {
      elements.detailPreview.innerHTML =
        '<img src="' +
        escapeHtml(
          product.detailImageUrl
        ) +
        '" alt="Current Product detail image">';

      setText(
        elements.detailName,
        'Current detail image saved'
      );
    }

    setHidden(
      elements.existingStatus,
      false
    );

    setText(
      elements.currentModeration,
      formatLabel(
        product.moderationStatus ||
        'NOT_SUBMITTED'
      )
    );

    setText(
      elements.adminRemark,
      product.adminRemark || ''
    );
  }

  function openEditProductModal(product) {
    if (!product) {
      return;
    }

    populateProductForm(
      product
    );

    setText(
      elements.productModalEyebrow,
      'EDIT PRODUCT'
    );

    setText(
      elements.productModalTitle,
      'Edit Product'
    );

    setText(
      elements.productSaveButton,
      'Save Changes'
    );

    setHidden(
      elements.detailModal,
      true
    );

    setHidden(
      elements.productModal,
      false
    );

    setBodyModalState();
  }

  function closeProductModal() {
    if (state.saving) {
      return;
    }

    setHidden(
      elements.productModal,
      true
    );

    resetProductForm();
    setBodyModalState();
  }

  function handleImageSelection(
    fileInput,
    imageType
  ) {
    clearProductErrors();

    const file =
      fileInput &&
      fileInput.files &&
      fileInput.files[0]
        ? fileInput.files[0]
        : null;

    const isThumbnail =
      imageType === 'THUMBNAIL';

    const validation =
      validateImageFile(file);

    if (!validation.valid) {
      if (fileInput) {
        fileInput.value =
          '';
      }

      if (isThumbnail) {
        state.selectedThumbnail =
          null;

        resetImagePreview(
          elements.thumbnailPreview,
          elements.thumbnailName,
          '📷',
          'Select thumbnail'
        );

        setError(
          elements.thumbnailError,
          validation.message
        );
      } else {
        state.selectedDetailImage =
          null;

        resetImagePreview(
          elements.detailPreview,
          elements.detailName,
          '🖼️',
          'Select detail image'
        );

        setError(
          elements.detailError,
          validation.message
        );
      }

      return;
    }

    if (!file) {
      return;
    }

    if (isThumbnail) {
      state.selectedThumbnail =
        file;

      setImagePreview(
        file,
        elements.thumbnailPreview,
        elements.thumbnailName
      );
    } else {
      state.selectedDetailImage =
        file;

      setImagePreview(
        file,
        elements.detailPreview,
        elements.detailName
      );
    }
  }

  function validateProductForm() {
    clearProductErrors();

    let valid =
      true;

    const productName =
      cleanText(
        elements.productName &&
        elements.productName.value
      );

    const category =
      normalizeStatus(
        elements.productCategory &&
        elements.productCategory.value
      );

    const foodType =
      normalizeStatus(
        elements.productFoodType &&
        elements.productFoodType.value
      );

    const description =
      cleanText(
        elements.productDescription &&
        elements.productDescription.value
      );

    const basePrice =
      toNumber(
        elements.productPrice &&
        elements.productPrice.value,
        NaN
      );

    const availableQuantity =
      Math.floor(
        toNumber(
          elements.productStock &&
          elements.productStock.value,
          NaN
        )
      );

    const minimumQuantity =
      Math.floor(
        toNumber(
          elements.productMinimum &&
          elements.productMinimum.value,
          NaN
        )
      );

    const maximumQuantity =
      Math.floor(
        toNumber(
          elements.productMaximum &&
          elements.productMaximum.value,
          NaN
        )
      );

    const preparationMinutes =
      Math.floor(
        toNumber(
          elements.productPreparation &&
          elements.productPreparation.value,
          NaN
        )
      );

    const displayOrder =
      Math.floor(
        toNumber(
          elements.productDisplayOrder &&
          elements.productDisplayOrder.value,
          0
        )
      );

    if (!productName) {
      setError(
        elements.productNameError,
        'Product name is required.'
      );

      valid = false;
    }

    if (!category) {
      setError(
        elements.productCategoryError,
        'Select a Product category.'
      );

      valid = false;
    }

    if (
      foodType !== 'VEG' &&
      foodType !== 'NON_VEG'
    ) {
      setError(
        elements.productFoodTypeError,
        'Select Veg or Non-Veg.'
      );

      valid = false;
    }

    if (!description) {
      setError(
        elements.productDescriptionError,
        'Product description is required.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(basePrice) ||
      basePrice < 1 ||
      basePrice > 100000
    ) {
      setError(
        elements.productPriceError,
        'Price must be between ₹1 and ₹1,00,000.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(availableQuantity) ||
      availableQuantity < 0 ||
      availableQuantity > 10000
    ) {
      setError(
        elements.productStockError,
        'Stock must be between 0 and 10,000.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(minimumQuantity) ||
      minimumQuantity < 1 ||
      minimumQuantity > 100
    ) {
      setError(
        elements.productMinimumError,
        'Minimum quantity must be between 1 and 100.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(maximumQuantity) ||
      maximumQuantity <
        minimumQuantity ||
      maximumQuantity > 100
    ) {
      setError(
        elements.productMaximumError,
        'Maximum quantity must be at least the minimum quantity.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(preparationMinutes) ||
      preparationMinutes < 5 ||
      preparationMinutes > 240
    ) {
      setError(
        elements.productPreparationError,
        'Preparation time must be between 5 and 240 minutes.'
      );

      valid = false;
    }

    const editingProduct =
      state.selectedProduct;

    if (
      !state.selectedThumbnail &&
      !(
        editingProduct &&
        editingProduct.thumbnailFileId
      )
    ) {
      setError(
        elements.thumbnailError,
        'Select a Product thumbnail.'
      );

      valid = false;
    }

    const thumbnailValidation =
      validateImageFile(
        state.selectedThumbnail
      );

    if (!thumbnailValidation.valid) {
      setError(
        elements.thumbnailError,
        thumbnailValidation.message
      );

      valid = false;
    }

    const detailValidation =
      validateImageFile(
        state.selectedDetailImage
      );

    if (!detailValidation.valid) {
      setError(
        elements.detailError,
        detailValidation.message
      );

      valid = false;
    }

    return {
      valid:
        valid,

      productId:
        cleanText(
          elements.productId &&
          elements.productId.value
        ),

      payload: {
        productName:
          productName,

        category:
          category,

        foodType:
          foodType,

        description:
          description,

        basePrice:
          basePrice,

        availableQuantity:
          availableQuantity,

        minimumQuantity:
          minimumQuantity,

        maximumQuantity:
          maximumQuantity,

        preparationMinutes:
          preparationMinutes,

        displayOrder:
          Math.max(
            0,
            displayOrder
          )
      }
    };
  }

  function readFileAsBase64(file) {
    return new Promise(
      function(resolve, reject) {
        const reader =
          new FileReader();

        reader.onload =
          function() {
            const result =
              String(
                reader.result || ''
              );

            const separatorIndex =
              result.indexOf(',');

            if (
              separatorIndex === -1
            ) {
              reject(
                new Error(
                  'Invalid image data.'
                )
              );

              return;
            }

            resolve(
              result.slice(
                separatorIndex + 1
              )
            );
          };

        reader.onerror =
          function() {
            reject(
              new Error(
                'Selected image could not be read.'
              )
            );
          };

        reader.readAsDataURL(
          file
        );
      }
    );
  }

  async function uploadProductImage(
    productId,
    file,
    purpose
  ) {
    const base64Data =
      await readFileAsBase64(
        file
      );

    const response =
      await window.ApnaBiteAPI.request(
        'drive.upload',
        {
          purpose:
            purpose,

          productId:
            productId,

          kitchenId:
            state.kitchenId,

          imageSlot:
            purpose ===
              'PRODUCT_DETAIL_IMAGE'
              ? 'DETAIL'
              : 'THUMBNAIL',

          fileName:
            file.name,

          mimeType:
            file.type,

          base64Data:
            base64Data
        },
        {
          retry:
            false,

          deduplicate:
            false,

          timeoutMs:
            45000
        }
      );

    const data =
      getResponseData(
        response
      );

    if (!cleanText(data.fileId)) {
      throw new Error(
        'Uploaded image File ID was not returned.'
      );
    }

    return data;
  }

  function setProductFormSaving(
    saving,
    text
  ) {
    state.saving =
      Boolean(saving);

    if (elements.productSaveButton) {
      elements.productSaveButton.disabled =
        state.saving;

      elements.productSaveButton.textContent =
        text ||
        (
          state.saving
            ? 'Saving…'
            : (
              state.selectedProduct
                ? 'Save Changes'
                : 'Save Product'
            )
        );
    }

    if (elements.productForm) {
      Array.prototype.forEach.call(
        elements.productForm.elements,
        function(field) {
          if (
            field !==
            elements.productSaveButton
          ) {
            field.disabled =
              state.saving;
          }
        }
      );
    }
  }

  async function saveProductForm(event) {
    event.preventDefault();

    if (state.saving) {
      return;
    }

    const formResult =
      validateProductForm();

    if (!formResult.valid) {
      showToast(
        'Check the highlighted Product details.',
        'error'
      );

      return;
    }

    setProductFormSaving(
      true,
      formResult.productId
        ? 'Saving changes…'
        : 'Creating Product…'
    );

    let savedProductId =
      formResult.productId;

    try {
      const action =
        savedProductId
          ? 'chef.product.update'
          : 'chef.product.create';

      const payload =
        Object.assign(
          {},
          formResult.payload
        );

      if (savedProductId) {
        payload.productId =
          savedProductId;
      }

      const saveResponse =
        await window.ApnaBiteAPI.request(
          action,
          payload,
          {
            retry:
              false,

            deduplicate:
              false,

            timeoutMs:
              30000
          }
        );

      const saveData =
        getResponseData(
          saveResponse
        );

      const savedProduct =
        saveData.product ||
        null;

      savedProductId =
        cleanText(
          savedProduct &&
          savedProduct.productId
        ) ||
        savedProductId;

      if (!savedProductId) {
        throw new Error(
          'Saved Product ID was not returned.'
        );
      }

      if (state.selectedThumbnail) {
        setProductFormSaving(
          true,
          'Uploading thumbnail…'
        );

        await uploadProductImage(
          savedProductId,
          state.selectedThumbnail,
          'PRODUCT_THUMBNAIL'
        );
      }

      if (state.selectedDetailImage) {
        setProductFormSaving(
          true,
          'Uploading detail image…'
        );

        await uploadProductImage(
          savedProductId,
          state.selectedDetailImage,
          'PRODUCT_DETAIL_IMAGE'
        );
      }

      showToast(
        'Product saved successfully.',
        'success'
      );

      setProductFormSaving(
        false
      );

      closeProductModal();

      state.currentPage =
        1;

      await loadProducts();
    } catch (error) {
      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Product could not be saved.';

      setText(
        elements.productGeneralError,
        message
      );

      setHidden(
        elements.productGeneralError,
        false
      );

      showToast(
        message,
        'error'
      );

      if (
        window.ApnaBiteUI &&
        typeof window.ApnaBiteUI
          .handleApiError ===
          'function'
      ) {
        window.ApnaBiteUI
          .handleApiError(
            error,
            {
              redirectToLogin:
                true
            }
          );
      }
    } finally {
      setProductFormSaving(
        false
      );
    }
  }

  /*
   * Continue directly with Part 3 below this line.
   */
    function closeDetailModal() {
    if (
      state.saving ||
      state.detailLoading
    ) {
      return;
    }

    setHidden(
      elements.detailModal,
      true
    );

    setHidden(
      elements.detailContent,
      true
    );

    state.selectedProduct =
      null;

    setBodyModalState();
  }

  function getDetailStatusMessage(product) {
    const moderation =
      normalizeStatus(
        product.moderationStatus
      );

    const productStatus =
      normalizeStatus(
        product.productStatus
      );

    const availability =
      normalizeStatus(
        product.availabilityStatus
      );

    if (moderation === 'REJECTED') {
      return (
        product.adminRemark ||
        'Admin requested changes. Edit and submit the Product again.'
      );
    }

    if (moderation === 'PENDING') {
      return (
        'Product is waiting for Admin approval.'
      );
    }

    if (
      moderation === 'APPROVED' &&
      productStatus === 'ACTIVE' &&
      availability === 'ONLINE'
    ) {
      return (
        'Product is approved and visible to Customers.'
      );
    }

    if (
      moderation === 'APPROVED' &&
      productStatus === 'ACTIVE' &&
      availability === 'OUT_OF_STOCK'
    ) {
      return (
        'Product is approved but out of stock.'
      );
    }

    if (
      moderation === 'APPROVED' &&
      productStatus === 'ACTIVE'
    ) {
      return (
        'Product is approved. Turn it online when you are ready to sell.'
      );
    }

    if (!product.thumbnailFileId) {
      return (
        'Add a Product thumbnail before submitting for approval.'
      );
    }

    return (
      'Review the details and submit this Product for Admin approval.'
    );
  }

  function createAddonCardHtml(addon) {
    const addonId =
      escapeHtml(
        addon.addonId
      );

    const status =
      normalizeStatus(
        addon.addonStatus
      ) || 'INACTIVE';

    const nextStatus =
      status === 'ACTIVE'
        ? 'INACTIVE'
        : 'ACTIVE';

    return (
      '<article class="chef-product-addon-card">' +

        '<div class="chef-product-addon-card__content">' +
          '<strong>' +
            escapeHtml(
              addon.addonName
            ) +
          '</strong>' +

          '<p>' +
            escapeHtml(
              addon.addonDescription ||
              'Optional Product extra'
            ) +
          '</p>' +

          '<div class="chef-product-addon-card__meta">' +
            '<span>' +
              escapeHtml(
                formatMoney(
                  addon.unitPrice
                )
              ) +
            '</span>' +

            '<span>Stock: ' +
              escapeHtml(
                addon.availableQuantity
              ) +
            '</span>' +

            '<span>' +
              escapeHtml(
                formatLabel(status)
              ) +
            '</span>' +
          '</div>' +
        '</div>' +

        '<div class="chef-product-addon-card__actions">' +
          '<button type="button"' +
            ' data-edit-addon="' +
            addonId +
          '">' +
            'Edit' +
          '</button>' +

          '<button type="button"' +
            ' data-addon-status-id="' +
            addonId +
            '"' +
            ' data-addon-next-status="' +
            nextStatus +
            '"' +
            (
              status === 'ACTIVE'
                ? ' class="chef-addon-status-button--inactive"'
                : ''
            ) +
          '>' +
            (
              status === 'ACTIVE'
                ? 'Disable'
                : 'Enable'
            ) +
          '</button>' +
        '</div>' +
      '</article>'
    );
  }

  function renderAddons(product) {
    const addons =
      Array.isArray(product.addons)
        ? product.addons
        : [];

    if (elements.addonList) {
      elements.addonList.innerHTML =
        addons
          .map(createAddonCardHtml)
          .join('');
    }

    setHidden(
      elements.addonEmpty,
      addons.length > 0
    );
  }

  function renderProductDetail(product) {
    state.selectedProduct =
      product;

    const moderation =
      normalizeStatus(
        product.moderationStatus
      ) || 'NOT_SUBMITTED';

    const productStatus =
      normalizeStatus(
        product.productStatus
      ) || 'DRAFT';

    const availability =
      normalizeStatus(
        product.availabilityStatus
      ) || 'OFFLINE';

    const imageUrl =
      cleanText(
        product.thumbnailUrl
      ) ||
      '../assets/images/logo.png';

    setText(
      elements.detailModalTitle,
      product.productName
    );

    if (elements.detailImage) {
      elements.detailImage.onerror =
        function() {
          elements.detailImage.onerror =
            null;

          elements.detailImage.src =
            '../assets/images/logo.png';
        };

      elements.detailImage.src =
        imageUrl;

      elements.detailImage.alt =
        (
          product.productName ||
          'Product'
        ) +
        ' image';
    }

    setText(
      elements.detailFoodType,
      formatLabel(
        product.foodType
      )
    );

    setText(
      elements.detailModeration,
      formatLabel(
        moderation
      )
    );

    setText(
      elements.detailNameText,
      product.productName
    );

    setText(
      elements.detailDescription,
      product.description
    );

    setText(
      elements.detailPrice,
      formatMoney(
        product.basePrice
      )
    );

    setText(
      elements.detailStatusMessage,
      getDetailStatusMessage(
        product
      )
    );

    const canSubmit =
      moderation !== 'PENDING' &&
      moderation !== 'APPROVED' &&
      Boolean(
        product.thumbnailFileId
      );

    if (elements.submitApprovalButton) {
      elements.submitApprovalButton.disabled =
        !canSubmit;

      if (moderation === 'PENDING') {
        elements.submitApprovalButton
          .textContent =
          'Approval Pending';
      } else if (
        moderation === 'APPROVED'
      ) {
        elements.submitApprovalButton
          .textContent =
          'Approved';
      } else if (
        !product.thumbnailFileId
      ) {
        elements.submitApprovalButton
          .textContent =
          'Thumbnail Required';
      } else {
        elements.submitApprovalButton
          .textContent =
          moderation === 'REJECTED'
            ? 'Submit Again'
            : 'Submit for Approval';
      }
    }

    const canToggleOnline =
      moderation === 'APPROVED' &&
      productStatus === 'ACTIVE' &&
      toNumber(
        product.availableQuantity,
        0
      ) > 0;

    if (elements.onlineToggle) {
      elements.onlineToggle.checked =
        availability === 'ONLINE';

      elements.onlineToggle.disabled =
        !canToggleOnline ||
        state.saving;
    }

    renderAddons(
      product
    );

    setHidden(
      elements.detailLoading,
      true
    );

    setHidden(
      elements.detailContent,
      false
    );
  }

  async function loadProductDetail(productId) {
    if (
      state.detailLoading ||
      !productId
    ) {
      return;
    }

    state.detailLoading =
      true;

    setHidden(
      elements.detailModal,
      false
    );

    setHidden(
      elements.detailLoading,
      false
    );

    setHidden(
      elements.detailContent,
      true
    );

    setBodyModalState();

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.product.get',
          {
            productId:
              productId
          },
          {
            retry:
              true,

            retryCount:
              1,

            deduplicate:
              true,

            timeoutMs:
              20000
          }
        );

      const data =
        getResponseData(
          response
        );

      if (!data.product) {
        throw new Error(
          'Product details were not returned.'
        );
      }

      renderProductDetail(
        data.product
      );
    } catch (error) {
      closeDetailModal();

      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Product details could not be loaded.';

      showToast(
        message,
        'error'
      );

      if (
        window.ApnaBiteUI &&
        typeof window.ApnaBiteUI
          .handleApiError ===
          'function'
      ) {
        window.ApnaBiteUI
          .handleApiError(
            error,
            {
              redirectToLogin:
                true
            }
          );
      }
    } finally {
      state.detailLoading =
        false;
    }
  }

  async function submitProductForApproval() {
    const product =
      state.selectedProduct;

    if (
      !product ||
      state.saving
    ) {
      return;
    }

    if (
      !window.confirm(
        'Submit this Product for Admin approval?'
      )
    ) {
      return;
    }

    state.saving =
      true;

    if (elements.submitApprovalButton) {
      elements.submitApprovalButton.disabled =
        true;

      elements.submitApprovalButton
        .textContent =
        'Submitting…';
    }

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.product.submit',
          {
            productId:
              product.productId
          },
          {
            retry:
              false,

            deduplicate:
              false,

            timeoutMs:
              20000
          }
        );

      const data =
        getResponseData(
          response
        );

      if (!data.product) {
        throw new Error(
          'Updated Product was not returned.'
        );
      }

      renderProductDetail(
        data.product
      );

      showToast(
        'Product submitted for approval.',
        'success'
      );

      await loadProducts(
        true
      );
    } catch (error) {
      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Product could not be submitted.';

      showToast(
        message,
        'error'
      );
    } finally {
      state.saving =
        false;

      if (
        state.selectedProduct
      ) {
        renderProductDetail(
          state.selectedProduct
        );
      }
    }
  }

  async function changeProductAvailability() {
    const product =
      state.selectedProduct;

    if (
      !product ||
      state.saving ||
      !elements.onlineToggle
    ) {
      return;
    }

    const previousStatus =
      normalizeStatus(
        product.availabilityStatus
      ) || 'OFFLINE';

    const requestedStatus =
      elements.onlineToggle.checked
        ? 'ONLINE'
        : 'OFFLINE';

    state.saving =
      true;

    elements.onlineToggle.disabled =
      true;

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'chef.product.availability',
          {
            productId:
              product.productId,

            availabilityStatus:
              requestedStatus
          },
          {
            retry:
              false,

            deduplicate:
              false,

            timeoutMs:
              20000
          }
        );

      const data =
        getResponseData(
          response
        );

      if (data.product) {
        renderProductDetail(
          data.product
        );
      }

      showToast(
        requestedStatus === 'ONLINE'
          ? 'Product is now visible to Customers.'
          : 'Product is now offline.',
        'success'
      );

      await loadProducts(
        true
      );
    } catch (error) {
      elements.onlineToggle.checked =
        previousStatus === 'ONLINE';

      showToast(
        cleanText(
          error &&
          error.message
        ) ||
        'Product availability could not be updated.',
        'error'
      );
    } finally {
      state.saving =
        false;

      if (
        state.selectedProduct
      ) {
        renderProductDetail(
          state.selectedProduct
        );
      }
    }
  }

  function resetAddonForm() {
    if (elements.addonForm) {
      elements.addonForm.reset();
    }

    if (elements.addonId) {
      elements.addonId.value =
        '';
    }

    if (elements.addonProductId) {
      elements.addonProductId.value =
        state.selectedProduct
          ? state.selectedProduct.productId
          : '';
    }

    if (elements.addonStock) {
      elements.addonStock.value =
        '0';
    }

    if (elements.addonMinimum) {
      elements.addonMinimum.value =
        '0';
    }

    if (elements.addonMaximum) {
      elements.addonMaximum.value =
        '5';
    }

    if (elements.addonDisplayOrder) {
      elements.addonDisplayOrder.value =
        '0';
    }

    clearAddonErrors();
  }

  function openCreateAddonModal() {
    if (!state.selectedProduct) {
      return;
    }

    resetAddonForm();

    setText(
      elements.addonModalTitle,
      'Add Add-on'
    );

    setText(
      elements.addonSaveButton,
      'Save Add-on'
    );

    setHidden(
      elements.addonModal,
      false
    );

    setBodyModalState();

    window.setTimeout(
      function() {
        if (elements.addonName) {
          elements.addonName.focus();
        }
      },
      100
    );
  }

  function getSelectedAddon(addonId) {
    if (
      !state.selectedProduct ||
      !Array.isArray(
        state.selectedProduct.addons
      )
    ) {
      return null;
    }

    return (
      state.selectedProduct.addons.find(
        function(addon) {
          return (
            cleanText(addon.addonId) ===
            cleanText(addonId)
          );
        }
      ) || null
    );
  }

  function openEditAddonModal(addon) {
    if (!addon) {
      return;
    }

    resetAddonForm();

    if (elements.addonId) {
      elements.addonId.value =
        addon.addonId || '';
    }

    if (elements.addonProductId) {
      elements.addonProductId.value =
        addon.productId || '';
    }

    if (elements.addonName) {
      elements.addonName.value =
        addon.addonName || '';
    }

    if (elements.addonDescription) {
      elements.addonDescription.value =
        addon.addonDescription || '';
    }

    if (elements.addonPrice) {
      elements.addonPrice.value =
        toNumber(
          addon.unitPrice,
          0
        );
    }

    if (elements.addonStock) {
      elements.addonStock.value =
        toNumber(
          addon.availableQuantity,
          0
        );
    }

    if (elements.addonMinimum) {
      elements.addonMinimum.value =
        toNumber(
          addon.minimumQuantity,
          0
        );
    }

    if (elements.addonMaximum) {
      elements.addonMaximum.value =
        toNumber(
          addon.maximumQuantity,
          1
        );
    }

    if (elements.addonDisplayOrder) {
      elements.addonDisplayOrder.value =
        toNumber(
          addon.displayOrder,
          0
        );
    }

    setText(
      elements.addonModalTitle,
      'Edit Add-on'
    );

    setText(
      elements.addonSaveButton,
      'Save Changes'
    );

    setHidden(
      elements.addonModal,
      false
    );

    setBodyModalState();
  }

  function closeAddonModal() {
    if (state.saving) {
      return;
    }

    setHidden(
      elements.addonModal,
      true
    );

    resetAddonForm();
    setBodyModalState();
  }

  function validateAddonForm() {
    clearAddonErrors();

    let valid =
      true;

    const addonId =
      cleanText(
        elements.addonId &&
        elements.addonId.value
      );

    const productId =
      cleanText(
        elements.addonProductId &&
        elements.addonProductId.value
      );

    const addonName =
      cleanText(
        elements.addonName &&
        elements.addonName.value
      );

    const addonDescription =
      cleanText(
        elements.addonDescription &&
        elements.addonDescription.value
      );

    const unitPrice =
      toNumber(
        elements.addonPrice &&
        elements.addonPrice.value,
        NaN
      );

    const availableQuantity =
      Math.floor(
        toNumber(
          elements.addonStock &&
          elements.addonStock.value,
          NaN
        )
      );

    const minimumQuantity =
      Math.floor(
        toNumber(
          elements.addonMinimum &&
          elements.addonMinimum.value,
          0
        )
      );

    const maximumQuantity =
      Math.floor(
        toNumber(
          elements.addonMaximum &&
          elements.addonMaximum.value,
          NaN
        )
      );

    const displayOrder =
      Math.floor(
        toNumber(
          elements.addonDisplayOrder &&
          elements.addonDisplayOrder.value,
          0
        )
      );

    if (!addonName) {
      setError(
        elements.addonNameError,
        'Add-on name is required.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(unitPrice) ||
      unitPrice < 0 ||
      unitPrice > 100000
    ) {
      setError(
        elements.addonPriceError,
        'Enter a valid Add-on price.'
      );

      valid = false;
    }

    if (
      !Number.isFinite(availableQuantity) ||
      availableQuantity < 0 ||
      availableQuantity > 10000
    ) {
      setError(
        elements.addonStockError,
        'Stock must be between 0 and 10,000.'
      );

      valid = false;
    }

    if (
      minimumQuantity < 0 ||
      minimumQuantity > 100 ||
      !Number.isFinite(maximumQuantity) ||
      maximumQuantity <
        minimumQuantity ||
      maximumQuantity > 100
    ) {
      setError(
        elements.addonQuantityError,
        'Check minimum and maximum quantities.'
      );

      valid = false;
    }

    return {
      valid:
        valid,

      addonId:
        addonId,

      payload: {
        productId:
          productId,

        addonName:
          addonName,

        addonDescription:
          addonDescription,

        unitPrice:
          unitPrice,

        availableQuantity:
          availableQuantity,

        minimumQuantity:
          minimumQuantity,

        maximumQuantity:
          maximumQuantity,

        displayOrder:
          Math.max(
            0,
            displayOrder
          )
      }
    };
  }

  function setAddonSaving(saving) {
    state.saving =
      Boolean(saving);

    if (elements.addonSaveButton) {
      elements.addonSaveButton.disabled =
        state.saving;

      elements.addonSaveButton.textContent =
        state.saving
          ? 'Saving…'
          : (
            elements.addonId &&
            elements.addonId.value
              ? 'Save Changes'
              : 'Save Add-on'
          );
    }
  }

  async function saveAddonForm(event) {
    event.preventDefault();

    if (state.saving) {
      return;
    }

    const result =
      validateAddonForm();

    if (!result.valid) {
      showToast(
        'Check the highlighted Add-on details.',
        'error'
      );

      return;
    }

    setAddonSaving(
      true
    );

    try {
      const action =
        result.addonId
          ? 'chef.product.addon.update'
          : 'chef.product.addon.create';

      const payload =
        Object.assign(
          {},
          result.payload
        );

      if (result.addonId) {
        payload.addonId =
          result.addonId;
      }

      await window.ApnaBiteAPI.request(
        action,
        payload,
        {
          retry:
            false,

          deduplicate:
            false,

          timeoutMs:
            20000
        }
      );

      showToast(
        result.addonId
          ? 'Add-on updated successfully.'
          : 'Add-on created successfully.',
        'success'
      );

      setAddonSaving(
        false
      );

      closeAddonModal();

      await loadProductDetail(
        result.payload.productId
      );

      await loadProducts(
        true
      );
    } catch (error) {
      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Add-on could not be saved.';

      setText(
        elements.addonFormError,
        message
      );

      setHidden(
        elements.addonFormError,
        false
      );

      showToast(
        message,
        'error'
      );
    } finally {
      setAddonSaving(
        false
      );
    }
  }

  async function changeAddonStatus(
    addonId,
    nextStatus
  ) {
    if (
      state.saving ||
      !addonId
    ) {
      return;
    }

    state.saving =
      true;

    try {
      await window.ApnaBiteAPI.request(
        'chef.product.addon.status',
        {
          addonId:
            addonId,

          addonStatus:
            nextStatus
        },
        {
          retry:
            false,

          deduplicate:
            false,

          timeoutMs:
            20000
        }
      );

      showToast(
        nextStatus === 'ACTIVE'
          ? 'Add-on activated.'
          : 'Add-on disabled.',
        'success'
      );

      if (state.selectedProduct) {
        await loadProductDetail(
          state.selectedProduct.productId
        );
      }
    } catch (error) {
      showToast(
        cleanText(
          error &&
          error.message
        ) ||
        'Add-on status could not be changed.',
        'error'
      );
    } finally {
      state.saving =
        false;
    }
  }

  async function loadProducts(
    preserveDetail
  ) {
    if (state.loading) {
      return;
    }

    clearPageError();
    setPageLoading(true);

    const selectedProductId =
      preserveDetail &&
      state.selectedProduct
        ? state.selectedProduct.productId
        : '';

    try {
      const payload = {
        page:
          state.currentPage,

        pageSize:
          50,

        search:
          state.search
      };

      if (
        state.selectedStatus ===
          'ACTIVE' ||
        state.selectedStatus ===
          'DRAFT' ||
        state.selectedStatus ===
          'INACTIVE'
      ) {
        payload.status =
          state.selectedStatus;
      }

      if (
        state.selectedStatus ===
        'PENDING'
      ) {
        payload.moderationStatus =
          'PENDING';
      }

      const response =
        await window.ApnaBiteAPI.request(
          'chef.product.list',
          payload,
          {
            retry:
              true,

            retryCount:
              1,

            deduplicate:
              true,

            timeoutMs:
              20000
          }
        );

      const data =
        getResponseData(
          response
        );

      state.kitchenId =
        cleanText(
          data.kitchenId
        );

      state.kitchenName =
        cleanText(
          data.kitchenName
        );

      state.products =
        Array.isArray(data.items)
          ? data.items
          : [];

      state.counts =
        data.counts || {};

      const pagination =
        data.pagination || {};

      state.currentPage =
        toNumber(
          pagination.page,
          1
        );

      state.totalPages =
        toNumber(
          pagination.totalPages,
          1
        );

      renderMenu();

      if (selectedProductId) {
        const updatedProduct =
          getProductById(
            selectedProductId
          );

        if (updatedProduct) {
          state.selectedProduct =
            updatedProduct;
        }
      }
    } catch (error) {
      showPageError(
        cleanText(
          error &&
          error.message
        ) ||
        'Menu products could not be loaded.'
      );

      if (
        window.ApnaBiteUI &&
        typeof window.ApnaBiteUI
          .handleApiError ===
          'function'
      ) {
        window.ApnaBiteUI
          .handleApiError(
            error,
            {
              redirectToLogin:
                true
            }
          );
      }
    } finally {
      setPageLoading(
        false
      );
    }
  }

  function selectStatusFilter(status) {
    state.selectedStatus =
      normalizeStatus(status) ||
      'ALL';

    state.currentPage =
      1;

    document.querySelectorAll(
      '[data-menu-filter]'
    ).forEach(function(button) {
      button.classList.toggle(
        'chef-menu-stat--selected',
        normalizeStatus(
          button.dataset.menuFilter
        ) === state.selectedStatus
      );
    });

    loadProducts();
  }

  function bindEvents() {
    if (elements.refreshButton) {
      elements.refreshButton
        .addEventListener(
          'click',
          function() {
            loadProducts();
          }
        );
    }

    if (elements.retryButton) {
      elements.retryButton
        .addEventListener(
          'click',
          function() {
            loadProducts();
          }
        );
    }

    [
      elements.addProductButton,
      elements.emptyAddButton
    ].forEach(function(button) {
      if (button) {
        button.addEventListener(
          'click',
          openCreateProductModal
        );
      }
    });

    document.querySelectorAll(
      '[data-close-product-modal]'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        closeProductModal
      );
    });

    document.querySelectorAll(
      '[data-close-detail-modal]'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        closeDetailModal
      );
    });

    document.querySelectorAll(
      '[data-close-addon-modal]'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        closeAddonModal
      );
    });

    document.querySelectorAll(
      '[data-menu-filter]'
    ).forEach(function(button) {
      button.addEventListener(
        'click',
        function() {
          selectStatusFilter(
            button.dataset.menuFilter
          );
        }
      );
    });

    if (elements.searchInput) {
      elements.searchInput
        .addEventListener(
          'input',
          function() {
            state.search =
              cleanText(
                elements.searchInput.value
              );

            setHidden(
              elements.searchClear,
              !state.search
            );

            if (state.searchTimer) {
              window.clearTimeout(
                state.searchTimer
              );
            }

            state.searchTimer =
              window.setTimeout(
                function() {
                  state.currentPage =
                    1;

                  loadProducts();
                },
                400
              );
          }
        );
    }

    if (elements.searchClear) {
      elements.searchClear
        .addEventListener(
          'click',
          function() {
            elements.searchInput.value =
              '';

            state.search =
              '';

            state.currentPage =
              1;

            setHidden(
              elements.searchClear,
              true
            );

            loadProducts();
          }
        );
    }

    if (elements.categoryFilter) {
      elements.categoryFilter
        .addEventListener(
          'change',
          function() {
            state.selectedCategory =
              normalizeStatus(
                elements
                  .categoryFilter
                  .value
              ) || 'ALL';

            renderProductList();
          }
        );
    }

    if (elements.previousPage) {
      elements.previousPage
        .addEventListener(
          'click',
          function() {
            if (
              state.currentPage > 1
            ) {
              state.currentPage -= 1;
              loadProducts();
            }
          }
        );
    }

    if (elements.nextPage) {
      elements.nextPage
        .addEventListener(
          'click',
          function() {
            if (
              state.currentPage <
              state.totalPages
            ) {
              state.currentPage += 1;
              loadProducts();
            }
          }
        );
    }

    if (elements.productList) {
      elements.productList
        .addEventListener(
          'click',
          function(event) {
            const button =
              event.target.closest(
                '[data-manage-product]'
              );

            if (!button) {
              return;
            }

            loadProductDetail(
              button.dataset
                .manageProduct
            );
          }
        );
    }

    if (elements.productForm) {
      elements.productForm
        .addEventListener(
          'submit',
          saveProductForm
        );
    }

    if (elements.thumbnailFile) {
      elements.thumbnailFile
        .addEventListener(
          'change',
          function() {
            handleImageSelection(
              elements.thumbnailFile,
              'THUMBNAIL'
            );
          }
        );
    }

    if (elements.detailFile) {
      elements.detailFile
        .addEventListener(
          'change',
          function() {
            handleImageSelection(
              elements.detailFile,
              'DETAIL'
            );
          }
        );
    }

    if (elements.productDescription) {
      elements.productDescription
        .addEventListener(
          'input',
          function() {
            setText(
              elements
                .productDescriptionCount,
              elements
                .productDescription
                .value.length +
              '/700'
            );

            setError(
              elements
                .productDescriptionError,
              ''
            );
          }
        );
    }

    if (elements.editProductButton) {
      elements.editProductButton
        .addEventListener(
          'click',
          function() {
            openEditProductModal(
              state.selectedProduct
            );
          }
        );
    }

    if (
      elements.submitApprovalButton
    ) {
      elements.submitApprovalButton
        .addEventListener(
          'click',
          submitProductForApproval
        );
    }

    if (elements.onlineToggle) {
      elements.onlineToggle
        .addEventListener(
          'change',
          changeProductAvailability
        );
    }

    if (elements.addAddonButton) {
      elements.addAddonButton
        .addEventListener(
          'click',
          openCreateAddonModal
        );
    }

    if (elements.addonForm) {
      elements.addonForm
        .addEventListener(
          'submit',
          saveAddonForm
        );
    }

    if (elements.addonList) {
      elements.addonList
        .addEventListener(
          'click',
          function(event) {
            const editButton =
              event.target.closest(
                '[data-edit-addon]'
              );

            if (editButton) {
              openEditAddonModal(
                getSelectedAddon(
                  editButton.dataset
                    .editAddon
                )
              );

              return;
            }

            const statusButton =
              event.target.closest(
                '[data-addon-status-id]'
              );

            if (statusButton) {
              changeAddonStatus(
                statusButton.dataset
                  .addonStatusId,
                statusButton.dataset
                  .addonNextStatus
              );
            }
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
          elements.addonModal &&
          !elements.addonModal.hidden
        ) {
          closeAddonModal();
        } else if (
          elements.productModal &&
          !elements.productModal.hidden
        ) {
          closeProductModal();
        } else if (
          elements.detailModal &&
          !elements.detailModal.hidden
        ) {
          closeDetailModal();
        }
      }
    );

    window.addEventListener(
      'pageshow',
      function(event) {
        if (
          event.persisted &&
          state.initialized
        ) {
          loadProducts();
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains(
          'chef-menu-page'
        )
    ) {
      return;
    }

    if (state.initialized) {
      return;
    }

    state.initialized =
      true;

    getElements();
    bindEvents();

    if (!requireChefSession()) {
      return;
    }

    await loadProducts();
  }

  window.ApnaBiteChefMenu =
    Object.freeze({
      initialize:
        initialize,

      refresh:
        loadProducts,

      openAddProduct:
        openCreateProductModal
    });

  if (
    document.readyState ===
    'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once:
          true
      }
    );
  } else {
    initialize();
  }
})(window, document);
 
