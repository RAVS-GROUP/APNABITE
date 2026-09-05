/**
 * ============================================================
 * APNABITE V1 — ADMIN CHEF VERIFICATION CONTROLLER
 * File: assets/js/admin-chef-verification-v1.js
 * Complete file — Part 1 of 3
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const state = {
    initialized: false,
    loadingQueue: false,
    loadingDetail: false,
    processing: false,
    filter: 'ALL',
    search: '',
    page: 1,
    pageSize: 20,
    queue: [],
    pagination: null,
    counts: null,
    selectedUserId: '',
    detail: null,
    decision: {
      type: '',
      documentId: '',
      title: '',
      message: ''
    }
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.backButton =
      byId('admin-chef-back-button');

    elements.refreshButton =
      byId('admin-chef-refresh-button');

    elements.logoutButton =
      byId('admin-logout-button');

    elements.pageStatus =
      byId('admin-chef-page-status');

    elements.countAll =
      byId('admin-chef-count-all');

    elements.countAction =
      byId('admin-chef-count-action');

    elements.countPending =
      byId('admin-chef-count-pending');

    elements.countApproved =
      byId('admin-chef-count-approved');

    elements.countRejected =
      byId('admin-chef-count-rejected');

    elements.statCards =
      Array.prototype.slice.call(
        document.querySelectorAll(
          '[data-filter]'
        )
      );

    elements.searchInput =
      byId('admin-chef-search');

    elements.searchButton =
      byId('admin-chef-search-button');

    elements.filter =
      byId('admin-chef-filter');

    elements.resultCount =
      byId('admin-chef-result-count');

    elements.listLoading =
      byId('admin-chef-list-loading');

    elements.listEmpty =
      byId('admin-chef-list-empty');

    elements.listError =
      byId('admin-chef-list-error');

    elements.list =
      byId('admin-chef-list');

    elements.pagination =
      byId('admin-chef-pagination');

    elements.previousButton =
      byId('admin-chef-previous-button');

    elements.nextButton =
      byId('admin-chef-next-button');

    elements.pageInformation =
      byId('admin-chef-page-information');

    elements.detailPanel =
      byId('admin-chef-detail-panel');

    elements.detailEmpty =
      byId('admin-chef-detail-empty');

    elements.detailLoading =
      byId('admin-chef-detail-loading');

    elements.detailError =
      byId('admin-chef-detail-error');

    elements.detailContent =
      byId('admin-chef-detail-content');

    elements.profilePhoto =
      byId('admin-chef-profile-photo');

    elements.profilePlaceholder =
      byId(
        'admin-chef-profile-placeholder'
      );

    elements.queueStatus =
      byId('admin-chef-queue-status');

    elements.chefName =
      byId('admin-chef-name');

    elements.chefContact =
      byId('admin-chef-contact');

    elements.chefUserId =
      byId('admin-chef-user-id');

    elements.kitchenStatus =
      byId('admin-kitchen-status');

    elements.kitchenImage =
      byId('admin-kitchen-image');

    elements.kitchenImagePlaceholder =
      byId(
        'admin-kitchen-image-placeholder'
      );

    elements.kitchenName =
      byId('admin-kitchen-name');

    elements.kitchenDescription =
      byId(
        'admin-kitchen-description'
      );

    elements.kitchenFoodType =
      byId('admin-kitchen-food-type');

    elements.kitchenCapacity =
      byId('admin-kitchen-capacity');

    elements.kitchenPreparation =
      byId(
        'admin-kitchen-preparation'
      );

    elements.addressLabel =
      byId(
        'admin-kitchen-address-label'
      );

    elements.address =
      byId('admin-kitchen-address');

    elements.coordinates =
      byId('admin-kitchen-coordinates');

    elements.mapLink =
      byId('admin-kitchen-map-link');

    elements.kycOverallStatus =
      byId(
        'admin-kyc-overall-status'
      );

    elements.kycList =
      byId('admin-kyc-document-list');

    elements.payoutStatus =
      byId('admin-payout-status');

    elements.payoutMissing =
      byId('admin-payout-missing');

    elements.payoutContent =
      byId('admin-payout-content');

    elements.payoutMethod =
      byId('admin-payout-method');

    elements.payoutHolder =
      byId('admin-payout-holder');

    elements.payoutDetails =
      byId('admin-payout-details');

    elements.payoutProofLink =
      byId('admin-payout-proof-link');

    elements.payoutVerifyButton =
      byId(
        'admin-payout-verify-button'
      );

    elements.payoutRejectButton =
      byId(
        'admin-payout-reject-button'
      );

    elements.approvedRadius =
      byId('admin-approved-radius');

    elements.approvalMessage =
      byId(
        'admin-kitchen-approval-message'
      );

    elements.kitchenApproveButton =
      byId(
        'admin-kitchen-approve-button'
      );

    elements.kitchenRejectButton =
      byId(
        'admin-kitchen-reject-button'
      );

    elements.kitchenSuspendButton =
      byId(
        'admin-kitchen-suspend-button'
      );

    elements.dialog =
      byId('admin-decision-dialog');

    elements.dialogBackdrop =
      byId('admin-decision-backdrop');

    elements.dialogTitle =
      byId('admin-decision-title');

    elements.dialogMessage =
      byId('admin-decision-message');

    elements.dialogCloseButton =
      byId(
        'admin-decision-close-button'
      );

    elements.dialogReason =
      byId('admin-decision-reason');

    elements.dialogError =
      byId('admin-decision-error');

    elements.dialogCancelButton =
      byId(
        'admin-decision-cancel-button'
      );

    elements.dialogConfirmButton =
      byId(
        'admin-decision-confirm-button'
      );
  }

  function cleanText(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function normalizeStatus(value) {
    return cleanText(value)
      .toUpperCase()
      .replace(/\s+/g, '_');
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
    setText(element, message);
    setHidden(element, !message);
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

  function handleApiError(error) {
    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .handleApiError === 'function'
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
      cleanText(
        error &&
        error.message
      ) ||
      'Request could not be completed.',
      'error'
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

  function formatStatus(value) {
    const status =
      normalizeStatus(value);

    if (!status) {
      return 'Not available';
    }

    return status
      .split('_')
      .map(function(part) {
        return (
          part.charAt(0) +
          part.slice(1).toLowerCase()
        );
      })
      .join(' ');
  }

  function formatFoodType(value) {
    const foodType =
      normalizeStatus(value);

    if (foodType === 'NON_VEG') {
      return 'Non-Veg';
    }

    if (foodType === 'BOTH') {
      return 'Veg & Non-Veg';
    }

    if (foodType === 'VEG') {
      return 'Veg';
    }

    return formatStatus(foodType);
  }

  function getStatusClass(value) {
    const status =
      normalizeStatus(value);

    if (
      status === 'APPROVED' ||
      status === 'VERIFIED' ||
      status === 'ACTIVE'
    ) {
      return 'admin-status-badge--success';
    }

    if (
      status === 'REJECTED' ||
      status === 'SUSPENDED' ||
      status === 'FAILED'
    ) {
      return 'admin-status-badge--danger';
    }

    if (
      status === 'ACTION_REQUIRED' ||
      status === 'PENDING' ||
      status === 'PENDING_APPROVAL'
    ) {
      return 'admin-status-badge--warning';
    }

    return '';
  }

  function applyStatusBadge(
    element,
    status
  ) {
    if (!element) {
      return;
    }

    element.classList.remove(
      'admin-status-badge--success',
      'admin-status-badge--warning',
      'admin-status-badge--danger'
    );

    const statusClass =
      getStatusClass(status);

    if (statusClass) {
      element.classList.add(
        statusClass
      );
    }

    setText(
      element,
      formatStatus(status)
    );
  }

  function setPageStatus(value) {
    setText(
      elements.pageStatus,
      value
    );
  }

  function renderCounts() {
    const counts =
      state.counts || {};

    setText(
      elements.countAll,
      counts.all || 0
    );

    setText(
      elements.countAction,
      counts.actionRequired || 0
    );

    setText(
      elements.countPending,
      counts.pending || 0
    );

    setText(
      elements.countApproved,
      counts.approved || 0
    );

    setText(
      elements.countRejected,
      counts.rejected || 0
    );

    elements.statCards.forEach(
      function(card) {
        card.classList.toggle(
          'admin-stat-card--active',
          normalizeStatus(
            card.dataset.filter
          ) === state.filter
        );
      }
    );

    if (elements.filter) {
      elements.filter.value =
        state.filter;
    }
  }

  function buildQueueCard(item) {
    const button =
      document.createElement('button');

    button.type = 'button';

    button.className =
      'admin-chef-card';

    if (
      cleanText(item.userId) ===
      state.selectedUserId
    ) {
      button.classList.add(
        'admin-chef-card--selected'
      );
    }

    button.dataset.userId =
      cleanText(item.userId);

    const status =
      normalizeStatus(
        item.queueStatus
      );

    const progressItems = [
      {
        label: 'Profile',
        complete:
          item.profileComplete
      },
      {
        label: 'Address',
        complete:
          item.addressComplete
      },
      {
        label: 'Image',
        complete:
          item.imageComplete
      },
      {
        label: 'KYC',
        complete:
          item.kycSubmitted
      },
      {
        label: 'Payout',
        complete:
          item.payoutSubmitted
      }
    ];

    const progressHtml =
      progressItems.map(
        function(progress) {
          return (
            '<span class="' +
            (
              progress.complete
                ? 'is-complete'
                : 'is-missing'
            ) +
            '">' +
            (
              progress.complete
                ? '✓ '
                : '! '
            ) +
            escapeHtml(
              progress.label
            ) +
            '</span>'
          );
        }
      ).join('');

    button.innerHTML =
      '<div class="admin-chef-card__header">' +
        '<div>' +
          '<strong>' +
            escapeHtml(
              item.fullName ||
              'Unnamed Chef'
            ) +
          '</strong>' +
          '<span>' +
            escapeHtml(
              item.kitchenName ||
              'Kitchen profile incomplete'
            ) +
          '</span>' +
        '</div>' +
        '<small class="admin-status-badge ' +
          escapeHtml(
            getStatusClass(status)
          ) +
        '">' +
          escapeHtml(
            formatStatus(status)
          ) +
        '</small>' +
      '</div>' +
      '<div class="admin-chef-card__contact">' +
        '<span>' +
          escapeHtml(
            item.mobile || '—'
          ) +
        '</span>' +
        '<span>' +
          escapeHtml(
            item.email || '—'
          ) +
        '</span>' +
      '</div>' +
      '<div class="admin-chef-card__progress">' +
        progressHtml +
      '</div>';

    button.addEventListener(
      'click',
      function() {
        selectChef(
          item.userId
        );
      }
    );

    return button;
  }

  function renderQueue() {
    if (!elements.list) {
      return;
    }

    elements.list.innerHTML = '';

    setHidden(
      elements.listLoading,
      true
    );

    setHidden(
      elements.listError,
      true
    );

    const items =
      Array.isArray(state.queue)
        ? state.queue
        : [];

    setHidden(
      elements.listEmpty,
      items.length > 0
    );

    items.forEach(function(item) {
      elements.list.appendChild(
        buildQueueCard(item)
      );
    });

    const pagination =
      state.pagination || {};

    setText(
      elements.resultCount,
      String(
        pagination.totalItems || 0
      ) +
      ' Chef record(s)'
    );

    const totalPages =
      pagination.totalPages || 1;

    setHidden(
      elements.pagination,
      totalPages <= 1
    );

    setText(
      elements.pageInformation,
      'Page ' +
      String(
        pagination.page || 1
      ) +
      ' of ' +
      String(totalPages)
    );

    if (elements.previousButton) {
      elements.previousButton.disabled =
        !pagination.hasPrevious;
    }

    if (elements.nextButton) {
      elements.nextButton.disabled =
        !pagination.hasNext;
    }
  }

  function renderQueueLoading() {
    setHidden(
      elements.listLoading,
      false
    );

    setHidden(
      elements.listEmpty,
      true
    );

    setHidden(
      elements.listError,
      true
    );

    if (elements.list) {
      elements.list.innerHTML = '';
    }

    setText(
      elements.resultCount,
      'Loading records…'
    );

    setPageStatus(
      'Loading…'
    );
  }

  function renderQueueError(error) {
    const message =
      cleanText(
        error &&
        error.message
      ) ||
      'Chef queue could not be loaded.';

    setError(
      elements.listError,
      message
    );

    setHidden(
      elements.listLoading,
      true
    );

    setHidden(
      elements.listEmpty,
      true
    );

    setPageStatus(
      'Load failed'
    );
  }

  function renderDetailLoading() {
    setHidden(
      elements.detailEmpty,
      true
    );

    setHidden(
      elements.detailLoading,
      false
    );

    setHidden(
      elements.detailError,
      true
    );

    setHidden(
      elements.detailContent,
      true
    );
  }

  function renderDetailError(error) {
    const message =
      cleanText(
        error &&
        error.message
      ) ||
      'Chef details could not be loaded.';

    setHidden(
      elements.detailEmpty,
      true
    );

    setHidden(
      elements.detailLoading,
      true
    );

    setHidden(
      elements.detailContent,
      true
    );

    setError(
      elements.detailError,
      message
    );
  }

  function buildAddressText(address) {
    if (!address) {
      return 'Kitchen address not available.';
    }

    const parts = [
      address.addressLine1,
      address.addressLine2,
      address.landmark,
      address.area,
      address.city,
      address.district,
      address.state,
      address.postalCode
    ]
      .map(cleanText)
      .filter(Boolean);

    return parts.length
      ? parts.join(', ')
      : 'Kitchen address not available.';
  }

  function renderChefIdentity() {
    const detail =
      state.detail || {};

    const chef =
      detail.chef || {};

    applyStatusBadge(
      elements.queueStatus,
      detail.queueStatus ||
      chef.verificationStatus
    );

    setText(
      elements.chefName,
      chef.fullName || '—'
    );

    setText(
      elements.chefContact,
      [
        chef.mobile,
        chef.email
      ]
        .map(cleanText)
        .filter(Boolean)
        .join(' · ') || '—'
    );

    setText(
      elements.chefUserId,
      chef.userId || '—'
    );

    const profilePhotoUrl =
      cleanText(
        chef.profilePhotoUrl
      );

    if (
      profilePhotoUrl &&
      elements.profilePhoto
    ) {
      elements.profilePhoto.src =
        profilePhotoUrl;

      elements.profilePhoto.onload =
        function() {
          setHidden(
            elements.profilePhoto,
            false
          );

          setHidden(
            elements.profilePlaceholder,
            true
          );
        };

      elements.profilePhoto.onerror =
        function() {
          setHidden(
            elements.profilePhoto,
            true
          );

          setHidden(
            elements.profilePlaceholder,
            false
          );
        };
    } else {
      setHidden(
        elements.profilePhoto,
        true
      );

      setHidden(
        elements.profilePlaceholder,
        false
      );
    }
  }

  function renderKitchenProfile() {
    const kitchen =
      state.detail &&
      state.detail.kitchen
        ? state.detail.kitchen
        : null;

    if (!kitchen) {
      applyStatusBadge(
        elements.kitchenStatus,
        'PENDING'
      );

      setText(
        elements.kitchenName,
        'Kitchen profile missing'
      );

      setText(
        elements.kitchenDescription,
        'The Chef has not created a Kitchen profile.'
      );

      setText(
        elements.kitchenFoodType,
        '—'
      );

      setText(
        elements.kitchenCapacity,
        '—'
      );

      setText(
        elements.kitchenPreparation,
        '—'
      );

      setHidden(
        elements.kitchenImage,
        true
      );

      setHidden(
        elements.kitchenImagePlaceholder,
        false
      );

      return;
    }

    applyStatusBadge(
      elements.kitchenStatus,
      kitchen.adminApprovalStatus ||
      kitchen.kitchenStatus
    );

    setText(
      elements.kitchenName,
      kitchen.kitchenName || '—'
    );

    setText(
      elements.kitchenDescription,
      kitchen.description || '—'
    );

    setText(
      elements.kitchenFoodType,
      formatFoodType(
        kitchen.foodType
      )
    );

    setText(
      elements.kitchenCapacity,
      String(
        kitchen.capacityPerDay || 0
      ) +
      ' meals/day'
    );

    setText(
      elements.kitchenPreparation,
      String(
        kitchen
          .averagePreparationMinutes ||
        0
      ) +
      ' min'
    );

    const imageUrl =
      cleanText(
        kitchen.thumbnailUrl
      );

    if (
      imageUrl &&
      elements.kitchenImage
    ) {
      elements.kitchenImage.src =
        imageUrl;

      elements.kitchenImage.onload =
        function() {
          setHidden(
            elements.kitchenImage,
            false
          );

          setHidden(
            elements.kitchenImagePlaceholder,
            true
          );
        };

      elements.kitchenImage.onerror =
        function() {
          setHidden(
            elements.kitchenImage,
            true
          );

          setHidden(
            elements.kitchenImagePlaceholder,
            false
          );
        };
    } else {
      setHidden(
        elements.kitchenImage,
        true
      );

      setHidden(
        elements.kitchenImagePlaceholder,
        false
      );
    }
  }

  function renderAddress() {
    const address =
      state.detail &&
      state.detail.address
        ? state.detail.address
        : null;

    setText(
      elements.addressLabel,
      address
        ? (
          address.addressLabel ||
          'Kitchen address'
        )
        : 'Address missing'
    );

    setText(
      elements.address,
      buildAddressText(address)
    );

    const latitude =
      address
        ? Number(address.latitude)
        : NaN;

    const longitude =
      address
        ? Number(address.longitude)
        : NaN;

    if (
      isFinite(latitude) &&
      isFinite(longitude)
    ) {
      setText(
        elements.coordinates,
        latitude.toFixed(6) +
        ', ' +
        longitude.toFixed(6)
      );

      if (elements.mapLink) {
        elements.mapLink.href =
          'https://www.google.com/maps?q=' +
          encodeURIComponent(
            latitude +
            ',' +
            longitude
          );

        setHidden(
          elements.mapLink,
          false
        );
      }
    } else {
      setText(
        elements.coordinates,
        'Coordinates unavailable'
      );

      setHidden(
        elements.mapLink,
        true
      );
    }
  }

  /*
   * Continue directly with Part 2 below this line.
   */
   function buildKycDocumentCard(
    documentType,
    documentRecord
  ) {
    const card =
      document.createElement('article');

    card.className =
      'admin-document-card';

    const record =
      documentRecord || null;

    const status =
      record
        ? normalizeStatus(
            record.verificationStatus
          )
        : 'NOT_SUBMITTED';

    const documentUrl =
      record
        ? cleanText(
            record.documentViewUrl
          )
        : '';

    const maskedNumber =
      record
        ? cleanText(
            record.documentNumberMasked
          )
        : '';

    card.innerHTML =
      '<div class="admin-document-card__header">' +
        '<div>' +
          '<strong>' +
            escapeHtml(
              formatStatus(
                documentType
              )
            ) +
          '</strong>' +
          '<small>' +
            escapeHtml(
              maskedNumber ||
              'Document not submitted'
            ) +
          '</small>' +
        '</div>' +
        '<span class="admin-status-badge ' +
          escapeHtml(
            getStatusClass(status)
          ) +
        '">' +
          escapeHtml(
            formatStatus(status)
          ) +
        '</span>' +
      '</div>' +
      (
        record &&
        record.documentIssueDate
          ? (
            '<p class="admin-document-card__date">' +
              'Issue date: ' +
              escapeHtml(
                record.documentIssueDate
              ) +
            '</p>'
          )
          : ''
      ) +
      (
        record &&
        record.documentExpiryDate
          ? (
            '<p class="admin-document-card__date">' +
              'Expiry date: ' +
              escapeHtml(
                record.documentExpiryDate
              ) +
            '</p>'
          )
          : ''
      ) +
      (
        status === 'REJECTED' &&
        record &&
        record.rejectionReason
          ? (
            '<p class="admin-document-card__reason">' +
              escapeHtml(
                record.rejectionReason
              ) +
            '</p>'
          )
          : ''
      );

    const linkArea =
      document.createElement('div');

    linkArea.className =
      'admin-document-card__links';

    if (documentUrl) {
      const link =
        document.createElement('a');

      link.className =
        'admin-document-link';

      link.href =
        documentUrl;

      link.target =
        '_blank';

      link.rel =
        'noopener noreferrer';

      link.textContent =
        'OPEN DOCUMENT';

      linkArea.appendChild(link);
    }

    card.appendChild(linkArea);

    if (record) {
      const actionArea =
        document.createElement('div');

      actionArea.className =
        'admin-verification-actions';

      const verifyButton =
        document.createElement('button');

      verifyButton.type =
        'button';

      verifyButton.className =
        'admin-button admin-button--success';

      verifyButton.textContent =
        status === 'VERIFIED'
          ? 'VERIFIED'
          : 'VERIFY';

      verifyButton.disabled =
        status === 'VERIFIED' ||
        state.processing;

      verifyButton.dataset.action =
        'verify-kyc';

      verifyButton.dataset.kycId =
        cleanText(
          record.kycId
        );

      const rejectButton =
        document.createElement('button');

      rejectButton.type =
        'button';

      rejectButton.className =
        'admin-button admin-button--danger';

      rejectButton.textContent =
        status === 'REJECTED'
          ? 'REJECTED'
          : 'REJECT';

      rejectButton.disabled =
        state.processing;

      rejectButton.dataset.action =
        'reject-kyc';

      rejectButton.dataset.kycId =
        cleanText(
          record.kycId
        );

      rejectButton.dataset.documentType =
        cleanText(
          documentType
        );

      actionArea.appendChild(
        verifyButton
      );

      actionArea.appendChild(
        rejectButton
      );

      card.appendChild(
        actionArea
      );
    }

    return card;
  }

  function renderKyc() {
    if (!elements.kycList) {
      return;
    }

    elements.kycList.innerHTML = '';

    const kyc =
      state.detail &&
      state.detail.kyc
        ? state.detail.kyc
        : {};

    const requiredDocuments =
      Array.isArray(
        kyc.requiredDocuments
      )
        ? kyc.requiredDocuments
        : [
          'AADHAAR',
          'PAN',
          'FSSAI'
        ];

    const documents =
      Array.isArray(kyc.documents)
        ? kyc.documents
        : [];

    requiredDocuments.forEach(
      function(documentType) {
        const record =
          documents.find(
            function(documentRecord) {
              return (
                normalizeStatus(
                  documentRecord
                    .documentType
                ) ===
                normalizeStatus(
                  documentType
                )
              );
            }
          ) || null;

        elements.kycList.appendChild(
          buildKycDocumentCard(
            documentType,
            record
          )
        );
      }
    );

    let overallStatus =
      'PENDING';

    if (kyc.verified) {
      overallStatus =
        'VERIFIED';
    } else if (
      documents.some(
        function(record) {
          return (
            normalizeStatus(
              record.verificationStatus
            ) === 'REJECTED'
          );
        }
      )
    ) {
      overallStatus =
        'REJECTED';
    } else if (!kyc.complete) {
      overallStatus =
        'NOT_SUBMITTED';
    }

    applyStatusBadge(
      elements.kycOverallStatus,
      overallStatus
    );
  }

  function renderPayout() {
    const payout =
      state.detail &&
      state.detail.payout
        ? state.detail.payout
        : null;

    setHidden(
      elements.payoutMissing,
      Boolean(payout)
    );

    setHidden(
      elements.payoutContent,
      !payout
    );

    if (!payout) {
      applyStatusBadge(
        elements.payoutStatus,
        'NOT_SUBMITTED'
      );

      return;
    }

    const method =
      normalizeStatus(
        payout.preferredPayoutMethod
      );

    const status =
      normalizeStatus(
        payout.verificationStatus
      ) || 'PENDING';

    applyStatusBadge(
      elements.payoutStatus,
      status
    );

    setText(
      elements.payoutMethod,
      method === 'BANK'
        ? 'Bank Account'
        : 'UPI ID'
    );

    setText(
      elements.payoutHolder,
      payout.accountHolderName ||
      '—'
    );

    if (method === 'BANK') {
      setText(
        elements.payoutDetails,
        (
          payout.bankName ||
          'Bank'
        ) +
        ' · Account ending ' +
        (
          payout.accountLast4 ||
          '—'
        ) +
        ' · IFSC ' +
        (
          payout.ifsc ||
          '—'
        )
      );
    } else {
      setText(
        elements.payoutDetails,
        payout.upiIdMasked ||
        'Saved UPI ID'
      );
    }

    const proofUrl =
      cleanText(
        payout.proofViewUrl
      );

    if (
      proofUrl &&
      elements.payoutProofLink
    ) {
      elements.payoutProofLink.href =
        proofUrl;

      setHidden(
        elements.payoutProofLink,
        false
      );
    } else {
      setHidden(
        elements.payoutProofLink,
        true
      );
    }

    if (elements.payoutVerifyButton) {
      elements
        .payoutVerifyButton
        .disabled =
        status === 'VERIFIED' ||
        state.processing;

      elements
        .payoutVerifyButton
        .textContent =
        status === 'VERIFIED'
          ? 'PAYOUT VERIFIED'
          : 'VERIFY PAYOUT';
    }

    if (elements.payoutRejectButton) {
      elements
        .payoutRejectButton
        .disabled =
        state.processing;

      elements
        .payoutRejectButton
        .textContent =
        status === 'REJECTED'
          ? 'REJECTED'
          : 'REJECT PAYOUT';
    }
  }

  function renderKitchenDecision() {
    const detail =
      state.detail || {};

    const kitchen =
      detail.kitchen || null;

    const readiness =
      detail.readiness || {};

    if (
      kitchen &&
      elements.approvedRadius
    ) {
      elements.approvedRadius.value =
        kitchen
          .approvedServiceRadiusKm ||
        kitchen
          .requestedServiceRadiusKm ||
        3;
    }

    const kitchenStatus =
      kitchen
        ? normalizeStatus(
            kitchen.kitchenStatus
          )
        : '';

    const approvalStatus =
      kitchen
        ? normalizeStatus(
            kitchen.adminApprovalStatus
          )
        : '';

    const approved =
      kitchenStatus === 'ACTIVE' &&
      approvalStatus === 'APPROVED';

    const suspended =
      kitchenStatus === 'SUSPENDED';

    const ready =
      Boolean(
        readiness
          .readyForKitchenApproval
      );

    if (approved) {
      setText(
        elements.approvalMessage,
        'This Kitchen is approved and active. It remains closed until the Chef opens availability.'
      );
    } else if (suspended) {
      setText(
        elements.approvalMessage,
        'This Kitchen is currently suspended.'
      );
    } else if (
      !readiness.submittedForApproval
    ) {
      setText(
        elements.approvalMessage,
        'The Chef has not submitted the Kitchen for final approval.'
      );
    } else if (
      !readiness.kycVerified
    ) {
      setText(
        elements.approvalMessage,
        'Verify Aadhaar, PAN and FSSAI before approving the Kitchen.'
      );
    } else if (
      !readiness.payoutVerified
    ) {
      setText(
        elements.approvalMessage,
        'Verify the payout method before approving the Kitchen.'
      );
    } else if (ready) {
      setText(
        elements.approvalMessage,
        'All checks are complete. This Kitchen is ready for approval.'
      );
    } else {
      setText(
        elements.approvalMessage,
        'Complete all required checks before approving the Kitchen.'
      );
    }

    if (elements.kitchenApproveButton) {
      elements
        .kitchenApproveButton
        .disabled =
        !ready ||
        approved ||
        state.processing;

      elements
        .kitchenApproveButton
        .textContent =
        approved
          ? 'KITCHEN APPROVED'
          : 'APPROVE KITCHEN';
    }

    if (elements.kitchenRejectButton) {
      elements
        .kitchenRejectButton
        .disabled =
        !kitchen ||
        state.processing;
    }

    if (elements.kitchenSuspendButton) {
      setHidden(
        elements.kitchenSuspendButton,
        !approved
      );

      elements
        .kitchenSuspendButton
        .disabled =
        state.processing;
    }

    if (elements.approvedRadius) {
      elements.approvedRadius.disabled =
        approved ||
        state.processing;
    }
  }

  function renderDetail() {
    if (!state.detail) {
      return;
    }

    setHidden(
      elements.detailEmpty,
      true
    );

    setHidden(
      elements.detailLoading,
      true
    );

    setHidden(
      elements.detailError,
      true
    );

    setHidden(
      elements.detailContent,
      false
    );

    renderChefIdentity();
    renderKitchenProfile();
    renderAddress();
    renderKyc();
    renderPayout();
    renderKitchenDecision();
  }

  async function loadQueue(
    preserveSelection
  ) {
    if (state.loadingQueue) {
      return;
    }

    state.loadingQueue = true;
    renderQueueLoading();

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'admin.chef.queue',
          {
            status:
              state.filter,
            search:
              state.search,
            page:
              state.page,
            pageSize:
              state.pageSize
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 30000
          }
        );

      const data =
        getResponseData(response);

      state.queue =
        Array.isArray(data.items)
          ? data.items
          : [];

      state.pagination =
        data.pagination || null;

      state.counts =
        data.counts || null;

      if (
        state.pagination &&
        state.pagination.page
      ) {
        state.page =
          Number(
            state.pagination.page
          ) || 1;
      }

      renderCounts();
      renderQueue();

      setPageStatus(
        'Updated'
      );

      if (
        preserveSelection &&
        state.selectedUserId
      ) {
        const selectedStillVisible =
          state.queue.some(
            function(item) {
              return (
                cleanText(item.userId) ===
                state.selectedUserId
              );
            }
          );

        if (!selectedStillVisible) {
          state.selectedUserId = '';
          state.detail = null;

          setHidden(
            elements.detailEmpty,
            false
          );

          setHidden(
            elements.detailContent,
            true
          );
        }
      }
    } catch (error) {
      renderQueueError(error);
      handleApiError(error);
    } finally {
      state.loadingQueue = false;
    }
  }

  async function selectChef(userId) {
    const cleanUserId =
      cleanText(userId);

    if (
      !cleanUserId ||
      state.loadingDetail
    ) {
      return;
    }

    state.selectedUserId =
      cleanUserId;

    state.detail = null;
    state.loadingDetail = true;

    renderQueue();
    renderDetailLoading();

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'admin.chef.detail',
          {
            userId:
              cleanUserId
          },
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 30000
          }
        );

      const detail =
        getResponseData(response);

      if (
        !detail.chef ||
        !detail.chef.userId
      ) {
        throw new Error(
          'Chef verification details were not returned.'
        );
      }

      state.detail =
        detail;

      renderDetail();

      if (
        window.innerWidth <= 900 &&
        elements.detailPanel
      ) {
        elements.detailPanel
          .scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
      }
    } catch (error) {
      renderDetailError(error);
      handleApiError(error);
    } finally {
      state.loadingDetail = false;
    }
  }

  async function refreshSelectedChef() {
    const userId =
      state.selectedUserId;

    await loadQueue(true);

    if (userId) {
      await selectChef(userId);
    }
  }

  /*
   * Continue directly with Part 3 below this line.
   */
   function setProcessing(processing) {
    state.processing =
      Boolean(processing);

    if (elements.refreshButton) {
      elements.refreshButton.disabled =
        state.processing;
    }

    if (elements.logoutButton) {
      elements.logoutButton.disabled =
        state.processing;
    }

    renderKyc();
    renderPayout();
    renderKitchenDecision();
  }

  function openDecisionDialog(
    type,
    options
  ) {
    const input =
      options || {};

    state.decision = {
      type:
        cleanText(type),
      documentId:
        cleanText(
          input.documentId
        ),
      title:
        cleanText(
          input.title
        ),
      message:
        cleanText(
          input.message
        )
    };

    setText(
      elements.dialogTitle,
      state.decision.title ||
      'Confirm decision'
    );

    setText(
      elements.dialogMessage,
      state.decision.message ||
      'Enter a clear reason.'
    );

    if (elements.dialogReason) {
      elements.dialogReason.value =
        '';

      elements.dialogReason.disabled =
        false;
    }

    setError(
      elements.dialogError,
      ''
    );

    setHidden(
      elements.dialog,
      false
    );

    document.body.classList.add(
      'admin-dialog-open'
    );

    window.setTimeout(
      function() {
        if (elements.dialogReason) {
          elements.dialogReason.focus();
        }
      },
      50
    );
  }

  function closeDecisionDialog() {
    if (state.processing) {
      return;
    }

    setHidden(
      elements.dialog,
      true
    );

    document.body.classList.remove(
      'admin-dialog-open'
    );

    state.decision = {
      type: '',
      documentId: '',
      title: '',
      message: ''
    };

    setError(
      elements.dialogError,
      ''
    );
  }

  async function callAdminAction(
    action,
    payload,
    successMessage
  ) {
    if (state.processing) {
      return null;
    }

    setProcessing(true);
    setPageStatus('Saving…');

    try {
      const response =
        await window.ApnaBiteAPI.request(
          action,
          payload || {},
          {
            retry: false,
            deduplicate: false,
            timeoutMs: 30000
          }
        );

      const data =
        getResponseData(response);

      showToast(
        successMessage ||
        'Admin action completed.',
        'success'
      );

      setPageStatus('Saved');

      return data;
    } catch (error) {
      setPageStatus('Action failed');
      handleApiError(error);

      showToast(
        cleanText(
          error &&
          error.message
        ) ||
        'Admin action could not be completed.',
        'error'
      );

      return null;
    } finally {
      setProcessing(false);
    }
  }

  async function verifyKyc(kycId) {
    const cleanKycId =
      cleanText(kycId);

    if (!cleanKycId) {
      showToast(
        'KYC document ID is missing.',
        'error'
      );

      return;
    }

    const result =
      await callAdminAction(
        'admin.kyc.verify',
        {
          kycId:
            cleanKycId
        },
        'KYC document verified.'
      );

    if (result) {
      await refreshSelectedChef();
    }
  }

  async function verifyPayout() {
    const payout =
      state.detail &&
      state.detail.payout
        ? state.detail.payout
        : null;

    if (
      !payout ||
      !payout.payoutAccountId
    ) {
      showToast(
        'Payout account could not be found.',
        'error'
      );

      return;
    }

    const result =
      await callAdminAction(
        'admin.payout.verify',
        {
          payoutAccountId:
            payout.payoutAccountId
        },
        'Payout method verified.'
      );

    if (result) {
      await refreshSelectedChef();
    }
  }

  function getSelectedKitchen() {
    return (
      state.detail &&
      state.detail.kitchen
        ? state.detail.kitchen
        : null
    );
  }

  async function approveKitchen() {
    const kitchen =
      getSelectedKitchen();

    if (
      !kitchen ||
      !kitchen.kitchenId
    ) {
      showToast(
        'Kitchen record could not be found.',
        'error'
      );

      return;
    }

    const radius =
      Number(
        elements.approvedRadius
          ? elements.approvedRadius.value
          : 0
      );

    if (
      !isFinite(radius) ||
      radius < 0.5 ||
      radius > 50
    ) {
      showToast(
        'Approved service radius must be between 0.5 and 50 KM.',
        'error'
      );

      if (elements.approvedRadius) {
        elements.approvedRadius.focus();
      }

      return;
    }

    const confirmed =
      window.confirm(
        'Approve this Kitchen with a ' +
        radius +
        ' KM service radius?'
      );

    if (!confirmed) {
      return;
    }

    const result =
      await callAdminAction(
        'admin.chef.kitchen.approve',
        {
          kitchenId:
            kitchen.kitchenId,
          approvedServiceRadiusKm:
            radius
        },
        'Kitchen approved successfully.'
      );

    if (result) {
      await refreshSelectedChef();
    }
  }

  async function confirmDecision() {
    if (state.processing) {
      return;
    }

    const reason =
      cleanText(
        elements.dialogReason &&
        elements.dialogReason.value
      );

    if (!reason) {
      setError(
        elements.dialogError,
        'Please enter a clear reason.'
      );

      if (elements.dialogReason) {
        elements.dialogReason.focus();
      }

      return;
    }

    if (reason.length < 5) {
      setError(
        elements.dialogError,
        'Reason must contain at least 5 characters.'
      );

      return;
    }

    const decision =
      state.decision;

    const kitchen =
      getSelectedKitchen();

    const payout =
      state.detail &&
      state.detail.payout
        ? state.detail.payout
        : null;

    let action = '';
    let payload = {};
    let successMessage = '';

    if (
      decision.type ===
      'reject-kyc'
    ) {
      if (!decision.documentId) {
        setError(
          elements.dialogError,
          'KYC document ID is missing.'
        );

        return;
      }

      action =
        'admin.kyc.reject';

      payload = {
        kycId:
          decision.documentId,
        reason:
          reason
      };

      successMessage =
        'KYC document rejected.';
    } else if (
      decision.type ===
      'reject-payout'
    ) {
      if (
        !payout ||
        !payout.payoutAccountId
      ) {
        setError(
          elements.dialogError,
          'Payout account could not be found.'
        );

        return;
      }

      action =
        'admin.payout.reject';

      payload = {
        payoutAccountId:
          payout.payoutAccountId,
        reason:
          reason
      };

      successMessage =
        'Payout method rejected.';
    } else if (
      decision.type ===
      'reject-kitchen'
    ) {
      if (
        !kitchen ||
        !kitchen.kitchenId
      ) {
        setError(
          elements.dialogError,
          'Kitchen record could not be found.'
        );

        return;
      }

      action =
        'admin.chef.kitchen.reject';

      payload = {
        kitchenId:
          kitchen.kitchenId,
        reason:
          reason
      };

      successMessage =
        'Kitchen rejected.';
    } else if (
      decision.type ===
      'suspend-kitchen'
    ) {
      if (
        !kitchen ||
        !kitchen.kitchenId
      ) {
        setError(
          elements.dialogError,
          'Kitchen record could not be found.'
        );

        return;
      }

      action =
        'admin.chef.kitchen.suspend';

      payload = {
        kitchenId:
          kitchen.kitchenId,
        reason:
          reason
      };

      successMessage =
        'Kitchen suspended.';
    } else {
      setError(
        elements.dialogError,
        'Admin decision is invalid.'
      );

      return;
    }

    if (elements.dialogConfirmButton) {
      elements
        .dialogConfirmButton
        .disabled = true;

      elements
        .dialogConfirmButton
        .textContent =
        'SAVING…';
    }

    if (elements.dialogReason) {
      elements.dialogReason.disabled =
        true;
    }

    const result =
      await callAdminAction(
        action,
        payload,
        successMessage
      );

    if (elements.dialogConfirmButton) {
      elements
        .dialogConfirmButton
        .disabled = false;

      elements
        .dialogConfirmButton
        .textContent =
        'CONFIRM';
    }

    if (elements.dialogReason) {
      elements.dialogReason.disabled =
        false;
    }

    if (result) {
      /*
       * Reset processing before closing,
       * because close is blocked while processing.
       */
      state.processing = false;
      closeDecisionDialog();

      await refreshSelectedChef();
    }
  }

  function handleKycAction(event) {
    const target =
      event.target.closest(
        '[data-action]'
      );

    if (
      !target ||
      !elements.kycList.contains(
        target
      )
    ) {
      return;
    }

    const action =
      cleanText(
        target.dataset.action
      );

    const kycId =
      cleanText(
        target.dataset.kycId
      );

    if (action === 'verify-kyc') {
      const confirmed =
        window.confirm(
          'Verify this KYC document?'
        );

      if (confirmed) {
        verifyKyc(kycId);
      }

      return;
    }

    if (action === 'reject-kyc') {
      openDecisionDialog(
        'reject-kyc',
        {
          documentId:
            kycId,
          title:
            'Reject ' +
            formatStatus(
              target.dataset
                .documentType
            ),
          message:
            'Enter the reason that will be shown to the Chef.'
        }
      );
    }
  }

  async function logoutAdmin() {
    if (state.processing) {
      return;
    }

    const confirmed =
      window.confirm(
        'Log out from the Admin account?'
      );

    if (!confirmed) {
      return;
    }

    state.processing = true;

    if (elements.logoutButton) {
      elements.logoutButton.disabled =
        true;

      elements.logoutButton.textContent =
        'LOGGING OUT…';
    }

    try {
      await window.ApnaBiteAPI.request(
        'auth.logout',
        {},
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 15000
        }
      );
    } catch (error) {
      /*
       * Local logout must still complete if
       * the server request is unavailable.
       */
    } finally {
      if (
        window.ApnaBiteCore &&
        typeof window.ApnaBiteCore
          .clearSession === 'function'
      ) {
        window.ApnaBiteCore
          .clearSession();
      }

      window.location.href =
        'login.html';
    }
  }

  function applyFilter(filter) {
    const normalized =
      normalizeStatus(filter);

    if (!normalized) {
      return;
    }

    state.filter =
      normalized;

    state.page = 1;
    state.selectedUserId = '';
    state.detail = null;

    setHidden(
      elements.detailEmpty,
      false
    );

    setHidden(
      elements.detailContent,
      true
    );

    renderCounts();
    loadQueue(false);
  }

  function applySearch() {
    state.search =
      cleanText(
        elements.searchInput &&
        elements.searchInput.value
      );

    state.page = 1;
    loadQueue(true);
  }

  function bindEvents() {
    if (elements.backButton) {
      elements.backButton.addEventListener(
        'click',
        function() {
          window.location.href =
            'dashboard.html';
        }
      );
    }

    if (elements.refreshButton) {
      elements.refreshButton.addEventListener(
        'click',
        function() {
          refreshSelectedChef();
        }
      );
    }

    if (elements.logoutButton) {
      elements.logoutButton.addEventListener(
        'click',
        logoutAdmin
      );
    }

    elements.statCards.forEach(
      function(card) {
        card.addEventListener(
          'click',
          function() {
            applyFilter(
              card.dataset.filter
            );
          }
        );
      }
    );

    if (elements.filter) {
      elements.filter.addEventListener(
        'change',
        function() {
          applyFilter(
            elements.filter.value
          );
        }
      );
    }

    if (elements.searchButton) {
      elements.searchButton.addEventListener(
        'click',
        applySearch
      );
    }

    if (elements.searchInput) {
      elements.searchInput.addEventListener(
        'keydown',
        function(event) {
          if (event.key === 'Enter') {
            event.preventDefault();
            applySearch();
          }
        }
      );
    }

    if (elements.previousButton) {
      elements.previousButton.addEventListener(
        'click',
        function() {
          if (
            state.pagination &&
            state.pagination.hasPrevious
          ) {
            state.page -= 1;
            loadQueue(true);
          }
        }
      );
    }

    if (elements.nextButton) {
      elements.nextButton.addEventListener(
        'click',
        function() {
          if (
            state.pagination &&
            state.pagination.hasNext
          ) {
            state.page += 1;
            loadQueue(true);
          }
        }
      );
    }

    if (elements.kycList) {
      elements.kycList.addEventListener(
        'click',
        handleKycAction
      );
    }

    if (elements.payoutVerifyButton) {
      elements
        .payoutVerifyButton
        .addEventListener(
          'click',
          function() {
            const confirmed =
              window.confirm(
                'Verify this payout method?'
              );

            if (confirmed) {
              verifyPayout();
            }
          }
        );
    }

    if (elements.payoutRejectButton) {
      elements
        .payoutRejectButton
        .addEventListener(
          'click',
          function() {
            openDecisionDialog(
              'reject-payout',
              {
                title:
                  'Reject payout method',
                message:
                  'Enter the payout rejection reason that will be shown to the Chef.'
              }
            );
          }
        );
    }

    if (elements.kitchenApproveButton) {
      elements
        .kitchenApproveButton
        .addEventListener(
          'click',
          approveKitchen
        );
    }

    if (elements.kitchenRejectButton) {
      elements
        .kitchenRejectButton
        .addEventListener(
          'click',
          function() {
            openDecisionDialog(
              'reject-kitchen',
              {
                title:
                  'Reject Kitchen',
                message:
                  'Enter the changes required before the Chef can resubmit.'
              }
            );
          }
        );
    }

    if (elements.kitchenSuspendButton) {
      elements
        .kitchenSuspendButton
        .addEventListener(
          'click',
          function() {
            openDecisionDialog(
              'suspend-kitchen',
              {
                title:
                  'Suspend Kitchen',
                message:
                  'Enter the reason for suspending this Kitchen.'
              }
            );
          }
        );
    }

    if (elements.dialogConfirmButton) {
      elements
        .dialogConfirmButton
        .addEventListener(
          'click',
          confirmDecision
        );
    }

    [
      elements.dialogCloseButton,
      elements.dialogCancelButton,
      elements.dialogBackdrop
    ].forEach(function(element) {
      if (element) {
        element.addEventListener(
          'click',
          closeDecisionDialog
        );
      }
    });

    if (elements.dialogReason) {
      elements.dialogReason.addEventListener(
        'input',
        function() {
          setError(
            elements.dialogError,
            ''
          );
        }
      );
    }

    document.addEventListener(
      'keydown',
      function(event) {
        if (
          event.key === 'Escape' &&
          elements.dialog &&
          !elements.dialog.hidden
        ) {
          closeDecisionDialog();
        }
      }
    );
  }

  function validateAdminSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      renderQueueError(
        new Error(
          'Required application files did not load.'
        )
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
            ['ADMIN']
          )
      );
    }

    return Boolean(
      window.ApnaBiteCore
        .getSessionToken &&
      window.ApnaBiteCore
        .getSessionToken()
    );
  }

  function initialize() {
    if (
      !document.body.classList
        .contains(
          'admin-chef-verification-page'
        ) ||
      state.initialized
    ) {
      return;
    }

    getElements();
    bindEvents();

    state.initialized = true;

    if (!validateAdminSession()) {
      return;
    }

    loadQueue(false);
  }

  window.ApnaBiteAdminChefVerification =
    Object.freeze({
      initialize:
        initialize,
      loadQueue:
        loadQueue,
      selectChef:
        selectChef,
      refresh:
        refreshSelectedChef
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
