/**
 * ============================================================
 * APNABITE V1 — CHEF PAYOUT CONTROLLER
 * File: assets/js/chef-payout.js
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

  const state = {
    initialized: false,
    loading: false,
    saving: false,
    editing: false,
    user: null,
    payoutAccount: null,
    selectedMethod: '',
    selectedProof: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function getElements() {
    elements.backButton =
      byId('chef-payout-back-button');

    elements.saveStatus =
      byId('chef-payout-save-status');

    elements.statusCard =
      byId('chef-payout-status-card');

    elements.statusIcon =
      byId('chef-payout-status-icon');

    elements.statusTitle =
      byId('chef-payout-status-title');

    elements.statusMessage =
      byId('chef-payout-status-message');

    elements.form =
      byId('chef-payout-form');

    elements.bankOption =
      byId('chef-payout-bank-option');

    elements.upiOption =
      byId('chef-payout-upi-option');

    elements.bankRadio =
      byId('chef-payout-method-bank');

    elements.upiRadio =
      byId('chef-payout-method-upi');

    elements.methodError =
      byId('chef-payout-method-error');

    elements.commonSection =
      byId('chef-payout-common-section');

    elements.bankSection =
      byId('chef-payout-bank-section');

    elements.upiSection =
      byId('chef-payout-upi-section');

    elements.proofSection =
      byId('chef-payout-proof-section');

    elements.holderName =
      byId('chef-payout-holder-name');

    elements.holderNameError =
      byId(
        'chef-payout-holder-name-error'
      );

    elements.bankName =
      byId('chef-payout-bank-name');

    elements.bankNameError =
      byId('chef-payout-bank-name-error');

    elements.accountNumber =
      byId(
        'chef-payout-account-number'
      );

    elements.accountNumberError =
      byId(
        'chef-payout-account-number-error'
      );

    elements.confirmAccountNumber =
      byId(
        'chef-payout-confirm-account-number'
      );

    elements.confirmAccountError =
      byId(
        'chef-payout-confirm-account-error'
      );

    elements.ifsc =
      byId('chef-payout-ifsc');

    elements.ifscError =
      byId('chef-payout-ifsc-error');

    elements.upiId =
      byId('chef-payout-upi-id');

    elements.upiIdError =
      byId('chef-payout-upi-id-error');

    elements.confirmUpiId =
      byId('chef-payout-confirm-upi-id');

    elements.confirmUpiError =
      byId(
        'chef-payout-confirm-upi-error'
      );

    elements.proofDescription =
      byId(
        'chef-payout-proof-description'
      );

    elements.proofFile =
      byId('chef-payout-proof-file');

    elements.proofFileName =
      byId(
        'chef-payout-proof-file-name'
      );

    elements.proofFileHelp =
      byId(
        'chef-payout-proof-file-help'
      );

    elements.proofError =
      byId('chef-payout-proof-error');

    elements.existingProof =
      byId(
        'chef-payout-existing-proof'
      );

    elements.existingProofText =
      byId(
        'chef-payout-existing-proof-text'
      );

    elements.savedSummary =
      byId('chef-payout-saved-summary');

    elements.summaryStatus =
      byId('chef-payout-summary-status');

    elements.summaryMethod =
      byId('chef-payout-summary-method');

    elements.summaryHolder =
      byId('chef-payout-summary-holder');

    elements.summaryBankRow =
      byId(
        'chef-payout-summary-bank-row'
      );

    elements.summaryBank =
      byId('chef-payout-summary-bank');

    elements.summaryUpiRow =
      byId(
        'chef-payout-summary-upi-row'
      );

    elements.summaryUpi =
      byId('chef-payout-summary-upi');

    elements.submitButton =
      byId('chef-payout-submit-button');
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

  function setError(
    element,
    message
  ) {
    setText(
      element,
      message
    );

    setHidden(
      element,
      !message
    );
  }

  function clearErrors() {
    [
      elements.methodError,
      elements.holderNameError,
      elements.bankNameError,
      elements.accountNumberError,
      elements.confirmAccountError,
      elements.ifscError,
      elements.upiIdError,
      elements.confirmUpiError,
      elements.proofError
    ].forEach(
      function(element) {
        setError(element, '');
      }
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

  function setButtonLoading(
    loading,
    text
  ) {
    const button =
      elements.submitButton;

    if (!button) {
      return;
    }

    if (
      window.ApnaBiteUI &&
      typeof window.ApnaBiteUI
        .setButtonLoading ===
        'function'
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

  function setStatusType(type) {
    if (!elements.statusCard) {
      return;
    }

    elements.statusCard.classList.remove(
      'chef-status-card--loading',
      'chef-status-card--pending',
      'chef-status-card--approved',
      'chef-status-card--rejected',
      'onboarding-status-card--pending',
      'onboarding-status-card--approved',
      'onboarding-status-card--rejected'
    );

    if (type) {
      elements.statusCard.classList.add(
        'chef-status-card--' +
        type
      );
    }
  }

  function hasSavedPayout() {
    return Boolean(
      state.payoutAccount &&
      state.payoutAccount
        .payoutAccountId &&
      state.payoutAccount.isActive ===
        true
    );
  }

  function isSavedPayoutComplete() {
    if (!hasSavedPayout()) {
      return false;
    }

    const account =
      state.payoutAccount;

    const method =
      normalizeStatus(
        account.preferredPayoutMethod
      );

    const status =
      normalizeStatus(
        account.verificationStatus
      );

    if (
      status === 'REJECTED' ||
      !account.accountHolderName ||
      !account.proofFileId
    ) {
      return false;
    }

    if (method === 'BANK') {
      return Boolean(
        account.bankName &&
        account.accountLast4 &&
        account.ifsc
      );
    }

    if (method === 'UPI') {
      return Boolean(
        account.upiIdMasked
      );
    }

    return false;
  }

  function selectMethod(
    method,
    startEditing
  ) {
    const normalized =
      normalizeStatus(method);

    if (
      normalized !== 'BANK' &&
      normalized !== 'UPI'
    ) {
      return;
    }

    state.selectedMethod =
      normalized;

    if (startEditing) {
      state.editing = true;
    }

    if (elements.bankRadio) {
      elements.bankRadio.checked =
        normalized === 'BANK';
    }

    if (elements.upiRadio) {
      elements.upiRadio.checked =
        normalized === 'UPI';
    }

    clearErrors();
    render();
  }

  function renderMethodOptions() {
    const isBank =
      state.selectedMethod === 'BANK';

    const isUpi =
      state.selectedMethod === 'UPI';

    if (elements.bankOption) {
      elements.bankOption.classList.toggle(
        'chef-payout-method--selected',
        isBank
      );
    }

    if (elements.upiOption) {
      elements.upiOption.classList.toggle(
        'chef-payout-method--selected',
        isUpi
      );
    }

    if (elements.bankRadio) {
      elements.bankRadio.checked =
        isBank;

      elements.bankRadio.disabled =
        state.saving;
    }

    if (elements.upiRadio) {
      elements.upiRadio.checked =
        isUpi;

      elements.upiRadio.disabled =
        state.saving;
    }
  }

  function renderFormSections() {
    const showForm =
      state.editing &&
      Boolean(state.selectedMethod);

    setHidden(
      elements.commonSection,
      !showForm
    );

    setHidden(
      elements.bankSection,
      !(
        showForm &&
        state.selectedMethod === 'BANK'
      )
    );

    setHidden(
      elements.upiSection,
      !(
        showForm &&
        state.selectedMethod === 'UPI'
      )
    );

    setHidden(
      elements.proofSection,
      !showForm
    );

    if (!showForm) {
      return;
    }

    if (elements.proofDescription) {
      setText(
        elements.proofDescription,
        state.selectedMethod === 'BANK'
          ? 'Upload a cancelled cheque, passbook page or Bank statement showing account ownership.'
          : 'Upload a clear screenshot showing your UPI ID and account-holder name.'
      );
    }

    if (elements.holderName) {
      elements.holderName.disabled =
        state.saving;
    }

    [
      elements.bankName,
      elements.accountNumber,
      elements.confirmAccountNumber,
      elements.ifsc,
      elements.upiId,
      elements.confirmUpiId,
      elements.proofFile
    ].forEach(
      function(element) {
        if (element) {
          element.disabled =
            state.saving;
        }
      }
    );
  }

  function renderSavedSummary() {
    const saved =
      hasSavedPayout();

    setHidden(
      elements.savedSummary,
      !saved
    );

    setHidden(
      elements.existingProof,
      !saved
    );

    if (!saved) {
      return;
    }

    const account =
      state.payoutAccount;

    const method =
      normalizeStatus(
        account.preferredPayoutMethod
      );

    const status =
      normalizeStatus(
        account.verificationStatus
      ) || 'PENDING';

    setText(
      elements.summaryMethod,
      method === 'BANK'
        ? 'Bank Account'
        : 'UPI ID'
    );

    setText(
      elements.summaryHolder,
      account.accountHolderName ||
      '—'
    );

    setHidden(
      elements.summaryBankRow,
      method !== 'BANK'
    );

    setHidden(
      elements.summaryUpiRow,
      method !== 'UPI'
    );

    setText(
      elements.summaryBank,
      method === 'BANK'
        ? (
          (
            account.bankName ||
            'Bank'
          ) +
          ' · Account ending ' +
          (
            account.accountLast4 ||
            '—'
          ) +
          ' · ' +
          (
            account.ifsc ||
            '—'
          )
        )
        : '—'
    );

    setText(
      elements.summaryUpi,
      method === 'UPI'
        ? (
          account.upiIdMasked ||
          '—'
        )
        : '—'
    );

    if (status === 'VERIFIED') {
      setText(
        elements.summaryStatus,
        'Verified'
      );
    } else if (
      status === 'REJECTED'
    ) {
      setText(
        elements.summaryStatus,
        'Changes required'
      );
    } else {
      setText(
        elements.summaryStatus,
        'Verification pending'
      );
    }

    setText(
      elements.existingProofText,
      'A private ' +
      method +
      ' verification proof is saved.'
    );
  }

  function renderStatus() {
    if (!hasSavedPayout()) {
      setStatusType('');

      setText(
        elements.statusIcon,
        '₹'
      );

      setText(
        elements.statusTitle,
        'Add payout details'
      );

      setText(
        elements.statusMessage,
        'Choose Bank Account or UPI. Only one complete method is required.'
      );

      setText(
        elements.saveStatus,
        'Not saved'
      );

      return;
    }

    const status =
      normalizeStatus(
        state.payoutAccount
          .verificationStatus
      );

    if (status === 'VERIFIED') {
      setStatusType('approved');

      setText(
        elements.statusIcon,
        '✓'
      );

      setText(
        elements.statusTitle,
        'Payout details verified'
      );

      setText(
        elements.statusMessage,
        'Your settlement method has been verified. Selecting it again allows you to replace the details.'
      );

      setText(
        elements.saveStatus,
        'Verified'
      );

      return;
    }

    if (status === 'REJECTED') {
      setStatusType('rejected');

      setText(
        elements.statusIcon,
        '!'
      );

      setText(
        elements.statusTitle,
        'Payout changes required'
      );

      setText(
        elements.statusMessage,
        state.payoutAccount
          .rejectionReason ||
        'Select a payout method and submit corrected details.'
      );

      setText(
        elements.saveStatus,
        'Rejected'
      );

      return;
    }

    setStatusType('pending');

    setText(
      elements.statusIcon,
      '◷'
    );

    setText(
      elements.statusTitle,
      'Payout verification pending'
    );

    setText(
      elements.statusMessage,
      'Your payout details are saved. Selecting the method again allows you to replace them.'
    );

    setText(
      elements.saveStatus,
      'Saved'
    );
  }

  function renderSubmitButton() {
    const button =
      elements.submitButton;

    if (!button) {
      return;
    }

    if (state.saving) {
      button.disabled = true;
      return;
    }

    if (
      isSavedPayoutComplete() &&
      !state.editing
    ) {
      button.disabled = false;
      button.textContent =
        'CONTINUE TO REVIEW';

      button.dataset.action =
        'continue';

      return;
    }

    if (!state.selectedMethod) {
      button.disabled = true;
      button.textContent =
        'SELECT BANK OR UPI';

      button.dataset.action =
        'select';

      return;
    }

    button.disabled = false;

    button.textContent =
      hasSavedPayout()
        ? 'SAVE UPDATED PAYOUT DETAILS'
        : 'SAVE PAYOUT DETAILS';

    button.dataset.action =
      'save';
  }

  function render() {
    renderMethodOptions();
    renderFormSections();
    renderSavedSummary();
    renderStatus();
    renderSubmitButton();
  }

  function validateFile(file) {
    if (!file) {
      return {
        valid: false,
        message:
          'Upload payout verification proof.'
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
          'Proof file must be less than 5 MB.'
      };
    }

    return {
      valid: true
    };
  }

  function validateForm() {
    clearErrors();

    let valid = true;

    const holderName =
      cleanText(
        elements.holderName &&
        elements.holderName.value
      );

    if (!state.selectedMethod) {
      setError(
        elements.methodError,
        'Select Bank Account or UPI.'
      );

      valid = false;
    }

    if (!holderName) {
      setError(
        elements.holderNameError,
        'Account-holder name is required.'
      );

      valid = false;
    }

    const payload = {
      preferredPayoutMethod:
        state.selectedMethod,
      accountHolderName:
        holderName
    };

    if (
      state.selectedMethod ===
        'BANK'
    ) {
      const bankName =
        cleanText(
          elements.bankName &&
          elements.bankName.value
        );

      const accountNumber =
        String(
          elements.accountNumber &&
          elements.accountNumber.value ||
          ''
        ).replace(/\D/g, '');

      const confirmAccountNumber =
        String(
          elements
            .confirmAccountNumber &&
          elements
            .confirmAccountNumber
            .value ||
          ''
        ).replace(/\D/g, '');

      const ifsc =
        cleanText(
          elements.ifsc &&
          elements.ifsc.value
        )
          .replace(/\s+/g, '')
          .toUpperCase();

      if (!bankName) {
        setError(
          elements.bankNameError,
          'Bank name is required.'
        );

        valid = false;
      }

      if (
        accountNumber.length < 6 ||
        accountNumber.length > 30
      ) {
        setError(
          elements.accountNumberError,
          'Enter a valid Bank Account number.'
        );

        valid = false;
      }

      if (
        accountNumber !==
        confirmAccountNumber
      ) {
        setError(
          elements.confirmAccountError,
          'Account numbers do not match.'
        );

        valid = false;
      }

      if (
        !/^[A-Z]{4}0[A-Z0-9]{6}$/
          .test(ifsc)
      ) {
        setError(
          elements.ifscError,
          'Enter a valid 11-character IFSC code.'
        );

        valid = false;
      }

      payload.bankName =
        bankName;

      payload.accountNumber =
        accountNumber;

      payload.confirmAccountNumber =
        confirmAccountNumber;

      payload.ifsc =
        ifsc;
    }

    if (
      state.selectedMethod ===
        'UPI'
    ) {
      const upiId =
        cleanText(
          elements.upiId &&
          elements.upiId.value
        ).toLowerCase();

      const confirmUpiId =
        cleanText(
          elements.confirmUpiId &&
          elements.confirmUpiId.value
        ).toLowerCase();

      if (
        !/^[a-z0-9._-]{2,80}@[a-z0-9.-]{2,30}$/
          .test(upiId)
      ) {
        setError(
          elements.upiIdError,
          'Enter a valid UPI ID.'
        );

        valid = false;
      }

      if (upiId !== confirmUpiId) {
        setError(
          elements.confirmUpiError,
          'UPI IDs do not match.'
        );

        valid = false;
      }

      payload.upiId =
        upiId;

      payload.confirmUpiId =
        confirmUpiId;
    }

    const fileResult =
      validateFile(
        state.selectedProof
      );

    if (!fileResult.valid) {
      setError(
        elements.proofError,
        fileResult.message
      );

      valid = false;
    }

    return {
      valid:
        valid,
      payload:
        payload,
      file:
        state.selectedProof
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
                  'Invalid proof file data.'
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
                'The selected proof file could not be read.'
              )
            );
          };

        reader.readAsDataURL(file);
      }
    );
  }

  async function uploadProof(
    method,
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
            'PAYOUT_DOCUMENT',
          payoutMethod:
            method,
          documentType:
            method,
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

    const fileData =
      getResponseData(response);

    if (
      !cleanText(
        fileData.fileId
      )
    ) {
      throw new Error(
        'Uploaded proof file ID was not returned.'
      );
    }

    return fileData;
  }

  async function savePayout(
    formResult
  ) {
    const fileData =
      await uploadProof(
        state.selectedMethod,
        formResult.file
      );

    formResult.payload.proofFileId =
      fileData.fileId;

    const response =
      await window.ApnaBiteAPI.request(
        'payout.save',
        formResult.payload,
        {
          retry:
            false,
          deduplicate:
            false,
          timeoutMs:
            30000
        }
      );

    return getResponseData(
      response
    );
  }

  function resetSensitiveFields() {
    if (elements.accountNumber) {
      elements.accountNumber.value =
        '';
    }

    if (
      elements.confirmAccountNumber
    ) {
      elements
        .confirmAccountNumber
        .value = '';
    }

    if (elements.upiId) {
      elements.upiId.value =
        '';
    }

    if (elements.confirmUpiId) {
      elements.confirmUpiId.value =
        '';
    }

    if (elements.proofFile) {
      elements.proofFile.value =
        '';
    }

    state.selectedProof =
      null;

    setText(
      elements.proofFileName,
      'Select verification proof'
    );
  }

  function applySavedAccount(
    payoutAccount
  ) {
    state.payoutAccount =
      payoutAccount || null;

    if (!payoutAccount) {
      state.selectedMethod = '';
      state.editing = false;
      return;
    }

    state.selectedMethod =
      normalizeStatus(
        payoutAccount
          .preferredPayoutMethod
      );

    state.editing =
      normalizeStatus(
        payoutAccount
          .verificationStatus
      ) === 'REJECTED';

    if (elements.holderName) {
      elements.holderName.value =
        payoutAccount
          .accountHolderName || '';
    }

    if (elements.bankName) {
      elements.bankName.value =
        payoutAccount.bankName || '';
    }

    if (elements.ifsc) {
      elements.ifsc.value =
        payoutAccount.ifsc || '';
    }

    /*
     * Full Account Number and UPI ID are never
     * returned to the Chef frontend.
     */
    resetSensitiveFields();
  }

  async function handleFormSubmit(
    event
  ) {
    event.preventDefault();

    if (
      state.saving ||
      state.loading
    ) {
      return;
    }

    const action =
      elements.submitButton
        ? elements.submitButton
          .dataset.action
        : '';

    if (
      action === 'continue' &&
      isSavedPayoutComplete()
    ) {
      window.location.href =
        'review.html';

      return;
    }

    if (!state.editing) {
      if (state.selectedMethod) {
        state.editing = true;
        render();
      }

      return;
    }

    const formResult =
      validateForm();

    if (!formResult.valid) {
      showToast(
        'Check the highlighted payout details.',
        'error'
      );

      return;
    }

    state.saving = true;

    render();

    setButtonLoading(
      true,
      'UPLOADING PROOF…'
    );

    setText(
      elements.saveStatus,
      'Uploading…'
    );

    try {
      const result =
        await savePayout(
          formResult
        );

      const payoutAccount =
        result.payoutAccount ||
        null;

      if (!payoutAccount) {
        throw new Error(
          'Saved payout details were not returned.'
        );
      }

      applySavedAccount(
        payoutAccount
      );

      state.editing = false;

      showToast(
        'Payout details saved successfully.',
        'success'
      );

      setText(
        elements.saveStatus,
        'Saved'
      );
    } catch (error) {
      const message =
        cleanText(
          error &&
          error.message
        ) ||
        'Payout details could not be saved.';

      setError(
        elements.proofError,
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
              redirectToLogin:
                true
            }
          );
      } else {
        showToast(
          message,
          'error'
        );
      }
    } finally {
      state.saving = false;

      setButtonLoading(
        false
      );

      render();
    }
  }

  function handleProofSelection() {
    clearErrors();

    const file =
      elements.proofFile &&
      elements.proofFile.files &&
      elements.proofFile.files[0]
        ? elements
          .proofFile
          .files[0]
        : null;

    if (!file) {
      state.selectedProof =
        null;

      setText(
        elements.proofFileName,
        'Select verification proof'
      );

      return;
    }

    const validation =
      validateFile(file);

    if (!validation.valid) {
      state.selectedProof =
        null;

      elements.proofFile.value =
        '';

      setText(
        elements.proofFileName,
        'Select verification proof'
      );

      setError(
        elements.proofError,
        validation.message
      );

      return;
    }

    state.selectedProof =
      file;

    const sizeMb =
      (
        file.size /
        (
          1024 * 1024
        )
      ).toFixed(2);

    setText(
      elements.proofFileName,
      file.name +
      ' (' +
      sizeMb +
      ' MB)'
    );
  }

  async function loadPayout() {
    if (state.loading) {
      return;
    }

    state.loading = true;

    setStatusType('loading');

    setText(
      elements.statusIcon,
      '…'
    );

    setText(
      elements.statusTitle,
      'Checking payout details'
    );

    setText(
      elements.statusMessage,
      'Please wait while we load your saved payout method.'
    );

    setText(
      elements.saveStatus,
      'Checking…'
    );

    if (elements.submitButton) {
      elements.submitButton.disabled =
        true;

      elements.submitButton.textContent =
        'LOADING…';
    }

    try {
      const response =
        await window.ApnaBiteAPI.request(
          'payout.get',
          {},
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
        getResponseData(response);

      applySavedAccount(
        data.payoutAccount || null
      );
    } catch (error) {
      setStatusType('rejected');

      setText(
        elements.statusIcon,
        '!'
      );

      setText(
        elements.statusTitle,
        'Unable to load payout details'
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
              redirectToLogin:
                true
            }
          );
      }
    } finally {
      state.loading = false;
      render();
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

      if (
        elements.holderName &&
        !elements.holderName.value
      ) {
        elements.holderName.value =
          user.fullName ||
          user.name ||
          '';
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
              redirectToLogin:
                true
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

    if (elements.bankOption) {
      elements.bankOption
        .addEventListener(
          'click',
          function() {
            selectMethod(
              'BANK',
              true
            );
          }
        );
    }

    if (elements.upiOption) {
      elements.upiOption
        .addEventListener(
          'click',
          function() {
            selectMethod(
              'UPI',
              true
            );
          }
        );
    }

    if (elements.bankRadio) {
      elements.bankRadio
        .addEventListener(
          'change',
          function() {
            if (
              elements.bankRadio
                .checked
            ) {
              selectMethod(
                'BANK',
                true
              );
            }
          }
        );
    }

    if (elements.upiRadio) {
      elements.upiRadio
        .addEventListener(
          'change',
          function() {
            if (
              elements.upiRadio
                .checked
            ) {
              selectMethod(
                'UPI',
                true
              );
            }
          }
        );
    }

    if (elements.proofFile) {
      elements.proofFile
        .addEventListener(
          'change',
          handleProofSelection
        );
    }

    if (elements.accountNumber) {
      elements.accountNumber
        .addEventListener(
          'input',
          function() {
            elements.accountNumber.value =
              elements.accountNumber
                .value
                .replace(/\D/g, '')
                .slice(0, 30);

            setError(
              elements.accountNumberError,
              ''
            );
          }
        );
    }

    if (
      elements.confirmAccountNumber
    ) {
      elements
        .confirmAccountNumber
        .addEventListener(
          'input',
          function() {
            elements
              .confirmAccountNumber
              .value =
              elements
                .confirmAccountNumber
                .value
                .replace(/\D/g, '')
                .slice(0, 30);

            setError(
              elements.confirmAccountError,
              ''
            );
          }
        );
    }

    if (elements.ifsc) {
      elements.ifsc
        .addEventListener(
          'input',
          function() {
            elements.ifsc.value =
              elements.ifsc.value
                .replace(/\s+/g, '')
                .replace(
                  /[^A-Za-z0-9]/g,
                  ''
                )
                .toUpperCase()
                .slice(0, 11);

            setError(
              elements.ifscError,
              ''
            );
          }
        );
    }

    if (elements.upiId) {
      elements.upiId
        .addEventListener(
          'input',
          function() {
            elements.upiId.value =
              elements.upiId.value
                .replace(/\s+/g, '')
                .toLowerCase();

            setError(
              elements.upiIdError,
              ''
            );
          }
        );
    }

    if (elements.confirmUpiId) {
      elements.confirmUpiId
        .addEventListener(
          'input',
          function() {
            elements.confirmUpiId.value =
              elements
                .confirmUpiId
                .value
                .replace(/\s+/g, '')
                .toLowerCase();

            setError(
              elements.confirmUpiError,
              ''
            );
          }
        );
    }

    if (elements.holderName) {
      elements.holderName
        .addEventListener(
          'input',
          function() {
            setError(
              elements.holderNameError,
              ''
            );
          }
        );
    }

    if (elements.bankName) {
      elements.bankName
        .addEventListener(
          'input',
          function() {
            setError(
              elements.bankNameError,
              ''
            );
          }
        );
    }

    if (elements.form) {
      elements.form.addEventListener(
        'submit',
        handleFormSubmit
      );
    }

    window.addEventListener(
      'pageshow',
      function(event) {
        if (
          event.persisted &&
          state.initialized
        ) {
          loadPayout();
        }
      }
    );
  }

  async function initialize() {
    if (
      !document.body.classList
        .contains(
          'chef-payout-page'
        )
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

    await loadPayout();
  }

  window.ApnaBiteChefPayout =
    Object.freeze({
      initialize:
        initialize,
      loadPayout:
        loadPayout
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
