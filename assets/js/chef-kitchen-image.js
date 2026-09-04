/**
 * ============================================================
 * APNABITE V1 — CHEF KITCHEN IMAGE CONTROLLER
 * File: assets/js/chef-kitchen-image.js
 * Requires: core.js, api.js, ui.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  const MAX_FILE_BYTES =
    5 * 1024 * 1024;

  const ALLOWED_TYPES = Object.freeze([
    'image/jpeg',
    'image/png',
    'image/webp'
  ]);

  const CURRENT_IMAGE_CACHE =
    'chef_current_kitchen_image';

  const state = {
    initialized: false,
    loading: false,
    uploading: false,
    kitchen: null,
    selectedFile: null,
    selectedDataUrl: '',
    previewObjectUrl: '',
    currentImage: null
  };

  const elements = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function cleanText(value) {
    return String(
      value === null ||
      value === undefined
        ? ''
        : value
    ).replace(/\s+/g, ' ').trim();
  }

  function getElements() {
    elements.backButton =
      byId('kitchen-image-back-button');

    elements.saveStatus =
      byId('kitchen-image-save-status');

    elements.statusCard =
      byId('kitchen-image-status');

    elements.statusIcon =
      byId('kitchen-image-status-icon');

    elements.statusTitle =
      byId('kitchen-image-status-title');

    elements.statusMessage =
      byId('kitchen-image-status-message');

    elements.currentSection =
      byId(
        'current-kitchen-image-section'
      );

    elements.currentImage =
      byId('current-kitchen-image');

    elements.currentLink =
      byId('current-kitchen-image-link');

    elements.uploadHeading =
      byId('kitchen-image-upload-heading');

    elements.form =
      byId('kitchen-image-form');

    elements.fileInput =
      byId('kitchen-image-file');

    elements.dropZone =
      byId('kitchen-image-drop-zone');

    elements.fileError =
      byId('kitchen-image-file-error');

    elements.previewSection =
      byId(
        'kitchen-image-preview-section'
      );

    elements.previewImage =
      byId('kitchen-image-preview');

    elements.fileName =
      byId('kitchen-image-file-name');

    elements.fileSize =
      byId('kitchen-image-file-size');

    elements.changeButton =
      byId('kitchen-image-change-button');

    elements.saveButton =
      byId('kitchen-image-save-button');
  }

  function setText(element, value) {
    if (element) {
      element.textContent =
        cleanText(value);
    }
  }

  function setStatus(
    type,
    icon,
    title,
    message
  ) {
    if (elements.statusCard) {
      elements.statusCard.classList.remove(
        'chef-status-card--loading',
        'chef-status-card--pending',
        'chef-status-card--approved',
        'chef-status-card--rejected'
      );

      if (type) {
        elements.statusCard.classList.add(
          'chef-status-card--' + type
        );
      }
    }

    setText(elements.statusIcon, icon);
    setText(elements.statusTitle, title);
    setText(elements.statusMessage, message);
  }

  function setLoading(loading) {
    state.loading = Boolean(loading);

    if (
      !elements.saveButton ||
      state.uploading
    ) {
      return;
    }

    elements.saveButton.disabled =
      state.loading ||
      !state.selectedFile;

    elements.saveButton.textContent =
      state.loading
        ? 'LOADING…'
        : state.selectedFile
          ? 'UPLOAD & CONTINUE'
          : 'SELECT AN IMAGE';
  }

  function setUploading(uploading) {
    state.uploading =
      Boolean(uploading);

    window.ApnaBiteUI.setButtonLoading(
      elements.saveButton,
      state.uploading,
      'UPLOADING IMAGE…'
    );

    elements.fileInput.disabled =
      state.uploading;

    elements.dropZone.disabled =
      state.uploading;

    elements.changeButton.disabled =
      state.uploading;

    if (!state.uploading) {
      setLoading(false);
    }
  }

  function showFileError(message) {
    elements.fileError.textContent =
      message || '';

    elements.fileError.hidden =
      !message;
  }

  function formatFileSize(bytes) {
    const size = Number(bytes || 0);

    if (size < 1024) {
      return size + ' B';
    }

    if (size < 1024 * 1024) {
      return (
        (size / 1024).toFixed(1) +
        ' KB'
      );
    }

    return (
      (
        size /
        (1024 * 1024)
      ).toFixed(2) +
      ' MB'
    );
  }

  function clearPreviewUrl() {
    if (state.previewObjectUrl) {
      URL.revokeObjectURL(
        state.previewObjectUrl
      );

      state.previewObjectUrl = '';
    }
  }

  function validateFile(file) {
    if (!file) {
      return 'Select an image first.';
    }

    if (
      ALLOWED_TYPES.indexOf(
        file.type
      ) === -1
    ) {
      return (
        'Only JPG, PNG and WEBP images are allowed.'
      );
    }

    if (!file.size) {
      return 'The selected image is empty.';
    }

    if (
      file.size >
      MAX_FILE_BYTES
    ) {
      return (
        'Image must be smaller than 5 MB.'
      );
    }

    return '';
  }

  function showSelectedFile(file) {
    clearPreviewUrl();

    state.selectedFile = file;
    state.selectedDataUrl = '';

    state.previewObjectUrl =
      URL.createObjectURL(file);

    elements.previewImage.src =
      state.previewObjectUrl;

    elements.previewSection.hidden =
      false;

    elements.dropZone.hidden = true;

    setText(
      elements.fileName,
      file.name
    );

    setText(
      elements.fileSize,
      formatFileSize(file.size)
    );

    setText(
      elements.saveStatus,
      'Not uploaded'
    );

    showFileError('');

    elements.saveButton.disabled =
      false;

    elements.saveButton.textContent =
      state.currentImage
        ? 'UPLOAD NEW IMAGE'
        : 'UPLOAD & CONTINUE';
  }

  function handleSelectedFile(file) {
    const error =
      validateFile(file);

    if (error) {
      showFileError(error);

      window.ApnaBiteUI.showToast(
        error,
        'warning'
      );

      return;
    }

    showSelectedFile(file);
  }

  function openFilePicker() {
    if (!state.uploading) {
      elements.fileInput.click();
    }
  }

  function resetSelection() {
    clearPreviewUrl();

    state.selectedFile = null;
    state.selectedDataUrl = '';

    elements.fileInput.value = '';
    elements.previewImage.src = '';
    elements.previewSection.hidden =
      true;
    elements.dropZone.hidden = false;

    showFileError('');

    elements.saveButton.disabled =
      true;
    elements.saveButton.textContent =
      'SELECT AN IMAGE';

    setText(elements.saveStatus, '');
  }

  function readFileAsDataUrl(file) {
    return new Promise(
      function(resolve, reject) {
        const reader =
          new FileReader();

        reader.onload = function() {
          resolve(
            String(reader.result || '')
          );
        };

        reader.onerror = function() {
          reject(
            new Error(
              'Image could not be read.'
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  }

  function loadImageElement(
    objectUrl
  ) {
    return new Promise(
      function(resolve, reject) {
        const image = new Image();

        image.onload = function() {
          resolve(image);
        };

        image.onerror = function() {
          reject(
            new Error(
              'Selected image is invalid.'
            )
          );
        };

        image.src = objectUrl;
      }
    );
  }

  function canvasToBlob(
    canvas,
    mimeType,
    quality
  ) {
    return new Promise(
      function(resolve, reject) {
        canvas.toBlob(
          function(blob) {
            if (blob) {
              resolve(blob);
            } else {
              reject(
                new Error(
                  'Image optimization failed.'
                )
              );
            }
          },
          mimeType,
          quality
        );
      }
    );
  }

  async function optimizeImage(file) {
    /*
     * Small images are uploaded unchanged.
     */
    if (
      file.size <=
      1024 * 1024
    ) {
      return file;
    }

    const objectUrl =
      URL.createObjectURL(file);

    try {
      const image =
        await loadImageElement(
          objectUrl
        );

      const maximumWidth = 1600;
      const maximumHeight = 1200;

      const scale = Math.min(
        1,
        maximumWidth / image.width,
        maximumHeight / image.height
      );

      const width = Math.max(
        1,
        Math.round(
          image.width * scale
        )
      );

      const height = Math.max(
        1,
        Math.round(
          image.height * scale
        )
      );

      const canvas =
        document.createElement(
          'canvas'
        );

      canvas.width = width;
      canvas.height = height;

      const context =
        canvas.getContext('2d');

      context.fillStyle = '#ffffff';

      context.fillRect(
        0,
        0,
        width,
        height
      );

      context.drawImage(
        image,
        0,
        0,
        width,
        height
      );

      const outputType =
        'image/jpeg';

      const blob =
        await canvasToBlob(
          canvas,
          outputType,
          0.82
        );

      if (
        blob.size >= file.size
      ) {
        return file;
      }

      const baseName =
        cleanText(file.name)
          .replace(
            /\.[^.]+$/,
            ''
          ) ||
        'kitchen-image';

      return new File(
        [blob],
        baseName + '.jpg',
        {
          type: outputType,
          lastModified:
            Date.now()
        }
      );
    } finally {
      URL.revokeObjectURL(
        objectUrl
      );
    }
  }

  function showCurrentImage(fileInfo) {
    if (!fileInfo) {
      elements.currentSection.hidden =
        true;

      state.currentImage = null;

      return;
    }

    state.currentImage = fileInfo;

    const imageUrl =
      fileInfo.thumbnailUrl ||
      fileInfo.viewUrl;

    elements.currentImage.src =
      imageUrl;

    elements.currentLink.href =
      fileInfo.viewUrl || imageUrl;

    elements.currentSection.hidden =
      false;

    setText(
      elements.uploadHeading,
      'Replace Kitchen image'
    );

    window.ApnaBiteCore.setCache(
      CURRENT_IMAGE_CACHE,
      fileInfo,
      3600
    );
  }

  function showCachedCurrentImage() {
    const cached =
      window.ApnaBiteCore.getCache(
        CURRENT_IMAGE_CACHE
      );

    if (
      cached &&
      typeof cached === 'object'
    ) {
      showCurrentImage(cached);

      setStatus(
        '',
        '●',
        'Checking current image',
        'Showing the saved image while we refresh its details.'
      );

      return true;
    }

    return false;
  }

  async function loadCurrentImage() {
    if (state.loading) return;

    setLoading(true);

    try {
      const kitchenResponse =
        await window.ApnaBiteAPI.request(
          'chef.kitchen.get',
          {},
          {
            retry: true,
            deduplicate: true
          }
        );

      const kitchenData =
        kitchenResponse.data || {};

      if (
        !kitchenData.exists ||
        !kitchenData.kitchen
      ) {
        setStatus(
          'pending',
          '!',
          'Kitchen Profile required',
          'Complete the Kitchen Profile step before uploading an image.'
        );

        elements.saveButton.disabled =
          true;

        return;
      }

      state.kitchen =
        kitchenData.kitchen;

      const fileId =
        cleanText(
          state.kitchen
            .thumbnailFileId
        );

      if (!fileId) {
        window.ApnaBiteCore.removeCache(
          CURRENT_IMAGE_CACHE
        );

        showCurrentImage(null);

        setStatus(
          '',
          '3',
          'Upload your Kitchen image',
          'Choose a clear landscape image representing your Kitchen.'
        );

        return;
      }

      const fileResponse =
        await window.ApnaBiteAPI.request(
          'drive.fileInfo',
          {
            fileId: fileId
          },
          {
            retry: true,
            deduplicate: true
          }
        );

      showCurrentImage(
        fileResponse.data
      );

      setStatus(
        'approved',
        '✓',
        'Current image loaded',
        'You can continue with this image or upload a replacement.'
      );
    } catch (error) {
      setStatus(
        'rejected',
        '!',
        'Unable to load Kitchen image',
        'Check your connection and reload this page.'
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadImage(event) {
    event.preventDefault();

    if (
      state.loading ||
      state.uploading
    ) {
      return;
    }

    const validationError =
      validateFile(
        state.selectedFile
      );

    if (validationError) {
      showFileError(
        validationError
      );

      return;
    }

    if (
      !state.kitchen ||
      !state.kitchen.kitchenId
    ) {
      window.ApnaBiteUI.showToast(
        'Complete the Kitchen Profile step first.',
        'warning'
      );

      return;
    }

    setUploading(true);

    try {
      const optimizedFile =
        await optimizeImage(
          state.selectedFile
        );

      const dataUrl =
        await readFileAsDataUrl(
          optimizedFile
        );

      const response =
        await window.ApnaBiteAPI.request(
          'drive.upload',
          {
            purpose:
              'KITCHEN_THUMBNAIL',
            kitchenId:
              state.kitchen.kitchenId,
            fileName:
              optimizedFile.name,
            mimeType:
              optimizedFile.type,
            base64Data:
              dataUrl
          },
          {
            timeoutMs: 30000,
            retry: false,
            deduplicate: false
          }
        );

      const fileInfo =
        response.data || null;

      if (
        !fileInfo ||
        !fileInfo.fileId
      ) {
        throw new Error(
          'Uploaded file details were not returned.'
        );
      }

      showCurrentImage(fileInfo);

      window.ApnaBiteCore.removeCache(
        'chef_kitchen_profile'
      );

      window.ApnaBiteCore.removeCache(
        'chef_onboarding'
      );

      window.ApnaBiteUI.showToast(
        'Kitchen image uploaded successfully.',
        'success'
      );

      setText(
        elements.saveStatus,
        'Uploaded'
      );

      setStatus(
        'approved',
        '✓',
        'Kitchen image saved',
        'The current image is linked to your Kitchen. Previous uploads remain in history.'
      );

      resetSelection();

      window.setTimeout(function() {
        window.location.href =
          'onboarding.html';
      }, 600);
    } catch (error) {
      setText(
        elements.saveStatus,
        'Upload failed'
      );

      window.ApnaBiteUI.handleApiError(
        error,
        {
          redirectToLogin: true
        }
      );
    } finally {
      setUploading(false);
    }
  }

  function bindEvents() {
    elements.backButton.addEventListener(
      'click',
      function() {
        window.location.href =
          'onboarding.html';
      }
    );

    elements.dropZone.addEventListener(
      'click',
      openFilePicker
    );

    elements.changeButton.addEventListener(
      'click',
      openFilePicker
    );

    elements.fileInput.addEventListener(
      'change',
      function() {
        handleSelectedFile(
          elements.fileInput.files[0]
        );
      }
    );

    elements.dropZone.addEventListener(
      'dragover',
      function(event) {
        event.preventDefault();

        elements.dropZone.classList.add(
          'chef-upload-zone--dragging'
        );
      }
    );

    elements.dropZone.addEventListener(
      'dragleave',
      function() {
        elements.dropZone.classList.remove(
          'chef-upload-zone--dragging'
        );
      }
    );

    elements.dropZone.addEventListener(
      'drop',
      function(event) {
        event.preventDefault();

        elements.dropZone.classList.remove(
          'chef-upload-zone--dragging'
        );

        handleSelectedFile(
          event.dataTransfer.files[0]
        );
      }
    );

    elements.form.addEventListener(
      'submit',
      uploadImage
    );

    window.addEventListener(
      'pagehide',
      clearPreviewUrl
    );
  }

  async function initialize() {
    if (
      !document.body.classList.contains(
        'chef-kitchen-image-page'
      )
    ) {
      return;
    }

    if (state.initialized) return;

    state.initialized = true;

    getElements();

    if (
      !elements.form ||
      !elements.fileInput ||
      !elements.saveButton
    ) {
      return;
    }

    if (
      !window.ApnaBiteCore
        .requireLocalSession(
          ['CHEF']
        )
    ) {
      return;
    }

    showCachedCurrentImage();
    bindEvents();
    await loadCurrentImage();
  }

  window.ApnaBiteChefKitchenImage =
    Object.freeze({
      initialize: initialize,
      loadCurrentImage:
        loadCurrentImage
    });

  window.ApnaBiteCore.ready(
    initialize
  );
})(window, document);
