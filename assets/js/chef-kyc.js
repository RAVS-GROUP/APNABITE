/**
 * ============================================================
 * APNABITE V1 — CHEF KYC CONTROLLER
 * File: assets/js/chef-kyc.js
 * Part: 1 of 2
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const MAX_FILE_BYTES =
    5 * 1024 * 1024;

  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ];

  const DOCUMENTS =
    Object.freeze([
      {
        key: 'aadhaar',
        type: 'AADHAAR',
        label: 'Aadhaar',
        numberLength: 12
      },
      {
        key: 'pan',
        type: 'PAN',
        label: 'PAN',
        numberLength: 10
      },
      {
        key: 'fssai',
        type: 'FSSAI',
        label: 'FSSAI',
        numberLength: 14
      }
    ]);

  const state = {
    initialized: false,
    loading: false,
    uploading: false,
    user: null,
    summary: null,
    documents: {},
    selectedFiles: {}
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.backButton =
      byId('chef-kyc-back-button');

    elements.saveStatus =
      byId('chef-kyc-save-status');

    elements.statusCard =
      byId('chef-kyc-status-card');

    elements.statusIcon =
      byId('chef-kyc-status-icon');

    elements.statusTitle =
      byId('chef-kyc-status-title');

    elements.statusMessage =
      byId('chef-kyc-status-message');

    elements.progressText =
      byId('chef-kyc-progress-text');

    elements.continueButton =
      byId('chef-kyc-continue-button');

    DOCUMENTS.forEach(
      function(documentConfig) {
        const key =
          documentConfig.key;

        elements[key] = {
          card:
            byId(
              'chef-kyc-' +
              key +
              '-card'
            ),
          status:
            byId(
              'chef-kyc-' +
              key +
              '-status'
            ),
          number:
            byId(
              'chef-kyc-' +
              key +
              '-number'
            ),
          file:
            byId(
              'chef-kyc-' +
              key +
              '-file'
            ),
          fileName:
            byId(
              'chef-kyc-' +
              key +
              '-file-name'
            ),
          uploadLabel:
            byId(
              'chef-kyc-' +
              key +
              '-upload-label'
            ),
          existing:
            byId(
              'chef-kyc-' +
              key +
              '-existing'
            ),
          masked:
            byId(
              'chef-kyc-' +
              key +
              '-masked'
            ),
          error:
            byId(
              'chef-kyc-' +
              key +
              '-error'
            ),
          submit:
            byId(
              'chef-kyc-' +
              key +
              '-submit'
            ),
          issueDate:
            byId(
              'chef-kyc-' +
              key +
              '-issue-date'
            ),
          expiryDate:
            byId(
              'chef-kyc-' +
              key +
              '-expiry-date'
            )
        };
      }
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
      window.ApnaBiteUI
        .setButtonLoading(
          button,
          loading,
          text
        );

      return;
    }

    button.disabled =
      Boolean(loading);

    if (text) {
      button.textContent =
        text;
    }
  }

  function showFieldError(
    key,
    message
  ) {
    const group =
      elements[key];

    if (!group) {
      return;
    }

    setText(
      group.error,
      message
    );

    setHidden(
      group.error,
      !message
    );

    if (group.card) {
      group.card.classList.toggle(
        'chef-kyc-card--error',
        Boolean(message)
      );
    }
  }

  function clearFieldError(key) {
    showFieldError(key, '');
  }

  function normalizeDocumentNumber(
    type,
    value
  ) {
    let normalized =
      String(value || '')
        .replace(/\s+/g, '')
        .toUpperCase();

    if (
      type === 'AADHAAR' ||
      type === 'FSSAI'
    ) {
      normalized =
        normalized.replace(/\D/g, '');
    }

    if (type === 'PAN') {
      normalized =
        normalized.replace(
          /[^A-Z0-9]/g,
          ''
        );
    }

    return normalized;
  }

  function formatNumberInput(
    documentConfig
  ) {
    const group =
      elements[documentConfig.key];

    if (
      !group ||
      !group.number
    ) {
      return;
    }

    const normalized =
      normalizeDocumentNumber(
        documentConfig.type,
        group.number.value
      ).slice(
        0,
        documentConfig.numberLength
      );

    if (
      documentConfig.type ===
        'AADHAAR'
    ) {
      group.number.value =
        normalized.replace(
          /(\d{4})(?=\d)/g,
          '$1 '
        );

      return;
    }

    group.number.value =
      normalized;
  }

  function validateDocumentNumber(
    documentConfig,
    value
  ) {
    const normalized =
      normalizeDocumentNumber(
        documentConfig.type,
        value
      );

    if (
      documentConfig.type ===
        'AADHAAR' &&
      !/^\d{12}$/.test(normalized)
    ) {
      return {
        valid: false,
        message:
          'Enter a valid 12-digit Aadhaar number.'
      };
    }

    if (
      documentConfig.type ===
        'PAN' &&
      !/^[A-Z]{5}[0-9]{4}[A-Z]$/
        .test(normalized)
    ) {
      return {
        valid: false,
        message:
          'Enter a valid PAN number, for example ABCDE1234F.'
      };
    }

    if (
      documentConfig.type ===
        'FSSAI' &&
      !/^\d{14}$/.test(normalized)
    ) {
      return {
        valid: false,
        message:
          'Enter a valid 14-digit FSSAI number.'
      };
    }

    return {
      valid: true,
      value: normalized
    };
  }

  function validateSelectedFile(file) {
    if (!file) {
      return {
        valid: false,
        message:
          'Select a document file first.'
      };
    }

    if (
      ALLOWED_FILE_TYPES
        .indexOf(file.type) === -1
    ) {
      return {
        valid: false,
        message:
          'Only JPG, PNG, WebP or PDF files are allowed.'
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
          'Document size must be less than 5 MB.'
      };
    }

    return {
      valid: true
    };
  }

  function validateDocumentDates(
    documentConfig
  ) {
    const group =
      elements[documentConfig.key];

    if (
      documentConfig.type !==
        'FSSAI' ||
      !group
    ) {
      return {
        valid: true
      };
    }

    const issueDate =
      group.issueDate
        ? group.issueDate.value
        : '';

    const expiryDate =
      group.expiryDate
        ? group.expiryDate.value
        : '';

    if (
      issueDate &&
      expiryDate &&
      expiryDate < issueDate
    ) {
      return {
        valid: false,
        message:
          'Expiry date cannot be earlier than issue date.'
      };
    }

    return {
      valid: true,
      issueDate:
        issueDate,
      expiryDate:
        expiryDate
    };
  }

  function getDocumentByType(type) {
    return (
      state.documents[
        normalizeStatus(type)
      ] ||
      null
    );
  }

  function getDocumentStatus(
    documentConfig
  ) {
    const existing =
      getDocumentByType(
        documentConfig.type
      );

    if (!existing) {
      return 'NOT_SUBMITTED';
    }

    return (
      normalizeStatus(
        existing.verificationStatus
      ) ||
      'PENDING'
    );
  }

  function setStatusCardType(type) {
    if (!elements.statusCard) {
      return;
    }

    elements.statusCard.classList.remove(
      'chef-status-card--loading',
      'onboarding-status-card--pending',
      'onboarding-status-card--approved',
      'onboarding-status-card--rejected'
    );

    if (type === 'loading') {
      elements.statusCard.classList.add(
        'chef-status-card--loading'
      );
    }

    if (type === 'pending') {
      elements.statusCard.classList.add(
        'onboarding-status-card--pending'
      );
    }

    if (type === 'approved') {
      elements.statusCard.classList.add(
        'onboarding-status-card--approved'
      );
    }

    if (type === 'rejected') {
      elements.statusCard.classList.add(
        'onboarding-status-card--rejected'
      );
    }
  }

  function renderDocumentCard(
    documentConfig
  ) {
    const key =
      documentConfig.key;

    const group =
      elements[key];

    if (!group) {
      return;
    }

    const existing =
      getDocumentByType(
        documentConfig.type
      );

    const status =
      getDocumentStatus(
        documentConfig
      );

    const verified =
      status === 'VERIFIED';

    const rejected =
      status === 'REJECTED';

    const pending =
      status === 'PENDING';

    if (group.card) {
      group.card.classList.toggle(
        'chef-kyc-card--submitted',
        Boolean(existing)
      );

      group.card.classList.toggle(
        'chef-kyc-card--verified',
        verified
      );

      group.card.classList.toggle(
        'chef-kyc-card--rejected',
        rejected
      );
    }

    if (!existing) {
      setText(
        group.status,
        'PENDING'
      );

      setHidden(
        group.existing,
        true
      );

      if (group.number) {
        group.number.disabled =
          state.uploading;
      }

      if (group.file) {
        group.file.disabled =
          state.uploading;
      }

      if (group.submit) {
        group.submit.disabled =
          state.uploading;

        group.submit.textContent =
          'UPLOAD ' +
          documentConfig.label
            .toUpperCase();
      }

      return;
    }

    setHidden(
      group.existing,
      false
    );

    setText(
      group.masked,
      existing.documentNumberMasked ||
      'Document uploaded'
    );

    if (verified) {
      setText(
        group.status,
        'VERIFIED'
      );

      if (group.number) {
        group.number.disabled = true;
        group.number.value = '';
        group.number.placeholder =
          existing.documentNumberMasked ||
          'Verified';
      }

      if (group.file) {
        group.file.disabled = true;
      }

      if (group.submit) {
        group.submit.disabled = true;
        group.submit.textContent =
          'VERIFIED';
      }

      return;
    }

    if (rejected) {
      setText(
        group.status,
        'REJECTED'
      );

      showFieldError(
        key,
        existing.rejectionReason ||
        'Document was rejected. Upload a corrected document.'
      );
    } else if (pending) {
      setText(
        group.status,
        'UNDER REVIEW'
      );
    } else {
      setText(
        group.status,
        status
      );
    }

    if (group.number) {
      group.number.disabled =
        state.uploading;

      group.number.placeholder =
        'Re-enter number to replace';
    }

    if (group.file) {
      group.file.disabled =
        state.uploading;
    }

    if (group.submit) {
      group.submit.disabled =
        state.uploading;

      group.submit.textContent =
        rejected
          ? 'RESUBMIT ' +
            documentConfig.label
              .toUpperCase()
          : 'REPLACE ' +
            documentConfig.label
              .toUpperCase();
    }
  }

  function renderOverallStatus() {
    const requiredCount =
      DOCUMENTS.length;

    const submittedCount =
      DOCUMENTS.filter(
        function(documentConfig) {
          return Boolean(
            getDocumentByType(
              documentConfig.type
            )
          );
        }
      ).length;

    const rejectedCount =
      DOCUMENTS.filter(
        function(documentConfig) {
          return (
            getDocumentStatus(
              documentConfig
            ) === 'REJECTED'
          );
        }
      ).length;

    const verifiedCount =
      DOCUMENTS.filter(
        function(documentConfig) {
          return (
            getDocumentStatus(
              documentConfig
            ) === 'VERIFIED'
          );
        }
      ).length;

    setText(
      elements.progressText,
      submittedCount +
      ' of ' +
      requiredCount
    );

    if (verifiedCount === requiredCount) {
      setStatusCardType('approved');

      setText(
        elements.statusIcon,
        '✓'
      );

      setText(
        elements.statusTitle,
        'KYC verified'
      );

      setText(
        elements.statusMessage,
        'All required documents have been verified by ApnaBite.'
      );
    } else if (rejectedCount > 0) {
      setStatusCardType('rejected');

      setText(
        elements.statusIcon,
        '!'
      );

      setText(
        elements.statusTitle,
        'KYC changes required'
      );

      setText(
        elements.statusMessage,
        'Review the rejected document and upload a corrected copy.'
      );
    } else if (
      submittedCount ===
        requiredCount
    ) {
      setStatusCardType('pending');

      setText(
        elements.statusIcon,
        '◷'
      );

      setText(
        elements.statusTitle,
        'All documents submitted'
      );

      setText(
        elements.statusMessage,
        'Your documents are ready for Admin verification. You can continue onboarding.'
      );
    } else {
      setStatusCardType('');

      setText(
        elements.statusIcon,
        '●'
      );

      setText(
        elements.statusTitle,
        'Complete your KYC'
      );

      setText(
        elements.statusMessage,
        'Upload all three required documents to continue onboarding.'
      );
    }

    if (elements.continueButton) {
      elements.continueButton.disabled =
        state.uploading ||
        submittedCount !==
          requiredCount;

      elements.continueButton.textContent =
        submittedCount ===
          requiredCount
          ? 'CONTINUE TO PAYOUT DETAILS'
          : 'COMPLETE ALL KYC DOCUMENTS';
    }

    setText(
      elements.saveStatus,
      submittedCount ===
        requiredCount
        ? 'Submitted'
        : submittedCount +
          '/3 saved'
    );
  }

  function render() {
    DOCUMENTS.forEach(
      renderDocumentCard
    );

    renderOverallStatus();
  }

   function mapSummaryDocuments(summary) {
    state.documents = {};

    const documents =
      summary &&
      Array.isArray(
        summary.documents
      )
        ? summary.documents
        : [];

    documents.forEach(
      function(documentRecord) {
        const type =
          normalizeStatus(
            documentRecord &&
            documentRecord.documentType
          );

        if (type) {
          state.documents[type] =
            documentRecord;
        }
      }
    );
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
                  'Invalid file data.'
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
                'The selected file could not be read.'
              )
            );
          };

        reader.readAsDataURL(file);
      }
    );
  }

  function validateDocumentForm(
    documentConfig
  ) {
    const key =
      documentConfig.key;

    const group =
      elements[key];

    if (!group) {
      return {
        valid: false,
        message:
          'Document form is unavailable.'
      };
    }

    const status =
      getDocumentStatus(
        documentConfig
      );

    if (status === 'VERIFIED') {
      return {
        valid: false,
        message:
          'This document is already verified.'
      };
    }

    const numberResult =
      validateDocumentNumber(
        documentConfig,
        group.number
          ? group.number.value
          : ''
      );

    if (!numberResult.valid) {
      return numberResult;
    }

    const selectedFile =
      state.selectedFiles[key] ||
      (
        group.file &&
        group.file.files
          ? group.file.files[0]
          : null
      );

    const fileResult =
      validateSelectedFile(
        selectedFile
      );

    if (!fileResult.valid) {
      return fileResult;
    }

    const dateResult =
      validateDocumentDates(
        documentConfig
      );

    if (!dateResult.valid) {
      return dateResult;
    }

    return {
      valid: true,
      documentNumber:
        numberResult.value,
      file:
        selectedFile,
      issueDate:
        dateResult.issueDate || '',
      expiryDate:
        dateResult.expiryDate || ''
    };
  }

  async function uploadDriveFile(
    documentConfig,
    file
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
            'KYC_DOCUMENT',
          documentType:
            documentConfig.type,
          fileName:
            file.name,
          mimeType:
            file.type,
          base64Data:
            base64Data
        },
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 45000
        }
      );

    const fileData =
      getResponseData(response);

    const fileId =
      cleanText(
        fileData.fileId
      );

    if (!fileId) {
      throw new Error(
        'Uploaded file ID was not returned.'
      );
    }

    return fileData;
  }

  async function submitKycRecord(
    documentConfig,
    formData,
    fileData
  ) {
    const payload = {
      documentType:
        documentConfig.type,
      documentNumber:
        formData.documentNumber,
      documentFileId:
        fileData.fileId
    };

    if (formData.issueDate) {
      payload.documentIssueDate =
        formData.issueDate;
    }

    if (formData.expiryDate) {
      payload.documentExpiryDate =
        formData.expiryDate;
    }

    const response =
      await window.ApnaBiteAPI.request(
        'kyc.submit',
        payload,
        {
          retry: false,
          deduplicate: false,
          timeoutMs: 30000
        }
      );

    return getResponseData(
      response
    );
  }

  function resetDocumentForm(
    documentConfig
  ) {
    const key =
      documentConfig.key;

    const group =
      elements[key];

    state.selectedFiles[key] =
      null;

    if (!group) {
      return;
    }

    if (group.number) {
      group.number.value = '';
    }

    if (group.file) {
      group.file.value = '';
    }

    if (group.issueDate) {
      group.issueDate.value = '';
    }

    if (group.expiryDate) {
      group.expiryDate.value = '';
    }

    setText(
      group.fileName,
      'Select ' +
      documentConfig.label +
      ' file'
    );

    clearFieldError(key);
  }

  async function handleDocumentSubmit(
    documentConfig
  ) {
    if (
      state.uploading ||
      state.loading
    ) {
      return;
    }

    const key =
      documentConfig.key;

    const group =
      elements[key];

    clearFieldError(key);

    const formData =
      validateDocumentForm(
        documentConfig
      );

    if (!formData.valid) {
      showFieldError(
        key,
        formData.message
      );

      return;
    }

    state.uploading = true;

    render();

    setButtonLoading(
      group.submit,
      true,
      'UPLOADING…'
    );

    setText(
      elements.saveStatus,
      'Uploading…'
    );

    try {
      const fileData =
        await uploadDriveFile(
          documentConfig,
          formData.file
        );

      setButtonLoading(
        group.submit,
        true,
        'SAVING…'
      );

      const submission =
        await submitKycRecord(
          documentConfig,
          formData,
          fileData
        );

      if (
        submission.summary &&
        typeof submission.summary ===
          'object'
      ) {
        state.summary =
          submission.summary;

        mapSummaryDocuments(
          submission.summary
        );
      } else {
        await loadKycSummary(
          true
        );
      }

      resetDocumentForm(
        documentConfig
      );

      showToast(
        documentConfig.label +
        ' document submitted successfully.',
        'success'
      );
    } catch (error) {
      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Document could not be uploaded.';

      showFieldError(
        key,
        message
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
              redirectToLogin: true
            }
          );
      } else {
        showToast(
          message,
          'error'
        );
      }
    } finally {
      state.uploading = false;

      setButtonLoading(
        group.submit,
        false
      );

      render();
    }
  }

  function handleFileSelection(
    documentConfig
  ) {
    const key =
      documentConfig.key;

    const group =
      elements[key];

    if (!group || !group.file) {
      return;
    }

    clearFieldError(key);

    const file =
      group.file.files &&
      group.file.files[0]
        ? group.file.files[0]
        : null;

    if (!file) {
      state.selectedFiles[key] =
        null;

      setText(
        group.fileName,
        'Select ' +
        documentConfig.label +
        ' file'
      );

      return;
    }

    const validation =
      validateSelectedFile(file);

    if (!validation.valid) {
      state.selectedFiles[key] =
        null;

      group.file.value = '';

      setText(
        group.fileName,
        'Select ' +
        documentConfig.label +
        ' file'
      );

      showFieldError(
        key,
        validation.message
      );

      return;
    }

    state.selectedFiles[key] =
      file;

    const fileSizeMb =
      (
        file.size /
        (
          1024 * 1024
        )
      ).toFixed(2);

    setText(
      group.fileName,
      file.name +
      ' (' +
      fileSizeMb +
      ' MB)'
    );
  }

  async function loadKycSummary(silent) {
    if (
      state.loading &&
      !silent
    ) {
      return;
    }

    state.loading = true;

    if (!silent) {
      setStatusCardType('loading');

      setText(
        elements.statusIcon,
        '…'
      );

      setText(
        elements.statusTitle,
        'Checking KYC status'
      );

      setText(
        elements.statusMessage,
        'Please wait while we load your submitted documents.'
      );

      setText(
        elements.saveStatus,
        'Checking…'
      );
    }

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'kyc.summary',
          {},
          {
            retry: true,
            retryCount: 1,
            deduplicate: true,
            timeoutMs: 20000
          }
        );

      const summary =
        getResponseData(response);

      state.summary =
        summary;

      mapSummaryDocuments(
        summary
      );

      render();
    } catch (error) {
      setStatusCardType('rejected');

      setText(
        elements.statusIcon,
        '!'
      );

      setText(
        elements.statusTitle,
        'Unable to load KYC'
      );

      setText(
        elements.statusMessage,
        'Check your internet connection and reload this page.'
      );

      setText(
        elements.saveStatus,
        'Not loaded'
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
              redirectToLogin: true
            }
          );
      }
    } finally {
      state.loading = false;
    }
  }

  async function validateChefSession() {
    if (
      !window.ApnaBiteCore ||
      !window.ApnaBiteAPI
    ) {
      return null;
    }

    if (
      typeof window.ApnaBiteCore
        .requireLocalSession ===
        'function' &&
      !window.ApnaBiteCore
        .requireLocalSession(
          ['CHEF']
        )
    ) {
      return null;
    }

    try {
      const response =
        await window.ApnaBiteAPI
          .validateSession();

      const data =
        getResponseData(response);

      const user =
        data.user || null;

      if (
        !user ||
        normalizeStatus(
          user.role
        ) !== 'CHEF'
      ) {
        if (
          typeof window.ApnaBiteCore
            .redirectToRoleHome ===
            'function'
        ) {
          window.ApnaBiteCore
            .redirectToRoleHome(
              user
                ? user.role
                : '',
              true
            );
        }

        return null;
      }

      state.user = user;

      if (
        typeof window.ApnaBiteCore
          .saveSession ===
          'function'
      ) {
        window.ApnaBiteCore
          .saveSession({
            sessionToken:
              window.ApnaBiteCore
                .getSessionToken(),
            user:
              user
          });
      }

      return user;
    } catch (error) {
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
              redirectToLogin: true
            }
          );
      }

      return null;
    }
  }

  function bindEvents() {
    if (elements.backButton) {
      elements.backButton
        .addEventListener(
          'click',
          function() {
            window.location.href =
              'onboarding.html';
          }
        );
    }

    if (elements.continueButton) {
      elements.continueButton
        .addEventListener(
          'click',
          function() {
            if (
              elements.continueButton
                .disabled
            ) {
              return;
            }

            window.location.href =
              'payout.html';
          }
        );
    }

    DOCUMENTS.forEach(
      function(documentConfig) {
        const group =
          elements[
            documentConfig.key
          ];

        if (!group) {
          return;
        }

        if (group.number) {
          group.number.addEventListener(
            'input',
            function() {
              clearFieldError(
                documentConfig.key
              );

              formatNumberInput(
                documentConfig
              );
            }
          );
        }

        if (group.file) {
          group.file.addEventListener(
            'change',
            function() {
              handleFileSelection(
                documentConfig
              );
            }
          );
        }

        if (group.submit) {
          group.submit.addEventListener(
            'click',
            function() {
              handleDocumentSubmit(
                documentConfig
              );
            }
          );
        }

        if (group.issueDate) {
          group.issueDate
            .addEventListener(
              'change',
              function() {
                clearFieldError(
                  documentConfig.key
                );
              }
            );
        }

        if (group.expiryDate) {
          group.expiryDate
            .addEventListener(
              'change',
              function() {
                clearFieldError(
                  documentConfig.key
                );
              }
            );
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
          loadKycSummary(false);
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains('chef-kyc-page')
    ) {
      return;
    }

    getElements();

    const user =
      await validateChefSession();

    if (!user) {
      return;
    }

    bindEvents();

    state.initialized = true;

    await loadKycSummary(false);
  }

  window.ApnaBiteChefKyc =
    Object.freeze({
      initialize:
        initialize,
      loadKycSummary:
        loadKycSummary
    });

  if (
    window.ApnaBiteCore &&
    typeof window.ApnaBiteCore
      .ready === 'function'
  ) {
    window.ApnaBiteCore.ready(
      initialize
    );
  } else {
    document.addEventListener(
      'DOMContentLoaded',
      initialize
    );
  }
})(window, document);
