/**
 * ============================================================
 * APNABITE V1 — SHARED UI UTILITIES
 * File: assets/js/ui.js
 * Requires: core.js
 * ============================================================
 */

(function(window, document) {
  'use strict';

  let toastContainer = null;
  let activeModal = null;

  function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (
      text !== undefined &&
      text !== null
    ) {
      element.textContent = String(text);
    }

    return element;
  }

   function getToastContainer() {
    if (
      toastContainer &&
      document.body.contains(toastContainer)
    ) {
      return toastContainer;
    }

    toastContainer = createElement(
      'div',
      'toast-container'
    );

    toastContainer.setAttribute(
      'aria-live',
      'polite'
    );

    toastContainer.setAttribute(
      'aria-atomic',
      'true'
    );

    document.body.appendChild(
      toastContainer
    );

    return toastContainer;
  }

  function getToastIcon(type) {
    const icons = {
      success: '✓',
      error: '!',
      warning: '!',
      info: 'i'
    };

    return icons[type] || 'i';
  }

  function showToast(message, type, duration) {
    const allowedTypes = [
      'success',
      'error',
      'warning',
      'info'
    ];

    const toastType =
      allowedTypes.includes(type)
        ? type
        : 'info';

    const toast = createElement(
      'div',
      'toast toast--' + toastType
    );

    toast.setAttribute(
      'role',
      type === 'error'
        ? 'alert'
        : 'status'
    );

    const icon = createElement(
      'span',
      'toast__icon',
      getToastIcon(toastType)
    );

    icon.setAttribute(
      'aria-hidden',
      'true'
    );

    const messageElement = createElement(
      'span',
      'toast__message',
      message || 'Something happened.'
    );

    const closeButton = createElement(
      'button',
      'toast__close',
      '×'
    );

    closeButton.type = 'button';

    closeButton.setAttribute(
      'aria-label',
      'Close notification'
    );

    toast.append(
      icon,
      messageElement,
      closeButton
    );

    getToastContainer().appendChild(toast);

    window.requestAnimationFrame(function() {
      toast.classList.add(
        'toast--visible'
      );
    });

    let removed = false;

    const removeToast = function() {
      if (removed) return;

      removed = true;

      window.clearTimeout(removeTimer);

      toast.classList.remove(
        'toast--visible'
      );

      window.setTimeout(function() {
        toast.remove();
      }, 250);
    };

    const removeTimer = window.setTimeout(
      removeToast,
      Number(duration || 3500)
    );

    closeButton.addEventListener(
      'click',
      removeToast
    );

    return toast;
  }

  function setButtonLoading(
    button,
    loading,
    loadingText
  ) {
    if (!button) return;

    if (loading) {
      if (!button.dataset.originalText) {
        button.dataset.originalText =
          button.textContent;
      }

      button.disabled = true;

      button.classList.add(
        'button--loading'
      );

      button.textContent =
        loadingText || 'PLEASE WAIT…';

      return;
    }

    button.disabled = false;

    button.classList.remove(
      'button--loading'
    );

    if (button.dataset.originalText) {
      button.textContent =
        button.dataset.originalText;

      delete button.dataset.originalText;
    }
  }

  function createSpinner(label) {
    const wrapper = createElement(
      'div',
      'loading-state'
    );

    wrapper.setAttribute(
      'role',
      'status'
    );

    const spinner = createElement(
      'span',
      'loading-spinner'
    );

    spinner.setAttribute(
      'aria-hidden',
      'true'
    );

    const text = createElement(
      'span',
      'loading-state__text',
      label || 'Loading…'
    );

    wrapper.append(
      spinner,
      text
    );

    return wrapper;
  }

  function showLoader(container, label) {
    if (!container) return null;

    const loader = createSpinner(label);

    container.replaceChildren(loader);

    return loader;
  }

  function createSkeletonCard() {
    const card = createElement(
      'div',
      'skeleton-card'
    );

    card.setAttribute(
      'aria-hidden',
      'true'
    );

    const image = createElement(
      'div',
      'skeleton skeleton--image'
    );

    const content = createElement(
      'div',
      'skeleton-card__content'
    );

    content.append(
      createElement(
        'div',
        'skeleton skeleton--title'
      ),
      createElement(
        'div',
        'skeleton skeleton--text'
      ),
      createElement(
        'div',
        'skeleton skeleton--short'
      )
    );

    card.append(
      image,
      content
    );

    return card;
  }

  function showSkeletons(container, count) {
    if (!container) return;

    const fragment =
      document.createDocumentFragment();

    const total = Math.max(
      1,
      Math.min(
        Number(count || 4),
        20
      )
    );

    for (
      let index = 0;
      index < total;
      index++
    ) {
      fragment.appendChild(
        createSkeletonCard()
      );
    }

    container.replaceChildren(fragment);
  }

  function createState(options) {
    const settings = options || {};

    const state = createElement(
      'div',
      'page-state page-state--' +
        (settings.type || 'empty')
    );

    const icon = createElement(
      'div',
      'page-state__icon',
      settings.icon || '○'
    );

    icon.setAttribute(
      'aria-hidden',
      'true'
    );

    const title = createElement(
      'h3',
      'page-state__title',
      settings.title || 'Nothing here yet'
    );

    state.append(
      icon,
      title
    );

    if (settings.message) {
      state.appendChild(
        createElement(
          'p',
          'page-state__message',
          settings.message
        )
      );
    }

    if (
      settings.actionText &&
      typeof settings.onAction === 'function'
    ) {
      const button = createElement(
        'button',
        'button button--primary',
        settings.actionText
      );

      button.type = 'button';

      button.addEventListener(
        'click',
        settings.onAction
      );

      state.appendChild(button);
    }

    return state;
  }

  function showEmptyState(
    container,
    options
  ) {
    if (!container) return;

    container.replaceChildren(
      createState(
        Object.assign(
          {
            type: 'empty',
            icon: '○'
          },
          options || {}
        )
      )
    );
  }

  function showErrorState(
    container,
    options
  ) {
    if (!container) return;

    container.replaceChildren(
      createState(
        Object.assign(
          {
            type: 'error',
            icon: '!'
          },
          options || {}
        )
      )
    );
  }

  function showOfflineState(
    container,
    retryFunction
  ) {
    showErrorState(container, {
      icon: '↻',
      title: 'You’re offline',
      message:
        'Check your internet connection and try again.',
      actionText:
        typeof retryFunction === 'function'
          ? 'TRY AGAIN'
          : '',
      onAction: retryFunction
    });
  }

  function closeModal(result) {
    if (!activeModal) return;

    const modalState = activeModal;
    activeModal = null;

    document.body.classList.remove(
      'modal-open'
    );

    document.removeEventListener(
      'keydown',
      modalState.escapeHandler
    );

    modalState.overlay.classList.remove(
      'modal-overlay--visible'
    );

    window.setTimeout(function() {
      modalState.overlay.remove();

      if (
        modalState.previousFocus &&
        typeof modalState.previousFocus.focus ===
          'function'
      ) {
        modalState.previousFocus.focus();
      }

      modalState.resolve(result);
    }, 200);
  }

  function showModal(options) {
    const settings = options || {};

    if (activeModal) {
      closeModal(false);
    }

    return new Promise(function(resolve) {
      const previousFocus =
        document.activeElement;

      const overlay = createElement(
        'div',
        'modal-overlay'
      );

      const modal = createElement(
        'div',
        'modal'
      );

      modal.setAttribute(
        'role',
        'dialog'
      );

      modal.setAttribute(
        'aria-modal',
        'true'
      );

      const header = createElement(
        'div',
        'modal__header'
      );

      const title = createElement(
        'h2',
        'modal__title',
        settings.title || 'ApnaBite'
      );

      const closeButton = createElement(
        'button',
        'modal__close',
        '×'
      );

      closeButton.type = 'button';

      closeButton.setAttribute(
        'aria-label',
        'Close'
      );

      header.append(
        title,
        closeButton
      );

      const body = createElement(
        'div',
        'modal__body'
      );

      if (
        settings.content &&
        settings.content instanceof window.Node
      ) {
        body.appendChild(
          settings.content
        );
      } else {
        body.textContent =
          settings.message ||
          settings.content ||
          '';
      }

      const footer = createElement(
        'div',
        'modal__footer'
      );

      if (settings.cancelText !== false) {
        const cancelButton = createElement(
          'button',
          'button button--secondary',
          settings.cancelText || 'CANCEL'
        );

        cancelButton.type = 'button';

        cancelButton.addEventListener(
          'click',
          function() {
            closeModal(false);
          }
        );

        footer.appendChild(cancelButton);
      }

      const confirmButton = createElement(
        'button',
        'button button--primary',
        settings.confirmText || 'OK'
      );

      confirmButton.type = 'button';

      if (settings.danger) {
        confirmButton.classList.add(
          'button--danger'
        );
      }

      confirmButton.addEventListener(
        'click',
        function() {
          closeModal(true);
        }
      );

      footer.appendChild(confirmButton);

      modal.append(
        header,
        body,
        footer
      );

      overlay.appendChild(modal);

      document.body.appendChild(overlay);

      const escapeHandler = function(event) {
        if (
          event.key === 'Escape' &&
          activeModal
        ) {
          closeModal(false);
        }
      };

      activeModal = {
        overlay: overlay,
        resolve: resolve,
        previousFocus: previousFocus,
        escapeHandler: escapeHandler
      };

      document.body.classList.add(
        'modal-open'
      );

      document.addEventListener(
        'keydown',
        escapeHandler
      );

      closeButton.addEventListener(
        'click',
        function() {
          closeModal(false);
        }
      );

      overlay.addEventListener(
        'click',
        function(event) {
          if (
            event.target === overlay &&
            settings.closeOnOverlay !== false
          ) {
            closeModal(false);
          }
        }
      );

      window.requestAnimationFrame(function() {
        overlay.classList.add(
          'modal-overlay--visible'
        );

        confirmButton.focus();
      });
    });
  }

  function confirmAction(options) {
    return showModal(options);
  }

  function createQuantityControl(options) {
    const settings = options || {};

    const minimum = Number(
      settings.minimum === undefined
        ? 0
        : settings.minimum
    );

    const maximum = Number(
      settings.maximum === undefined
        ? 99
        : settings.maximum
    );

    let quantity = Math.max(
      minimum,
      Math.min(
        Number(settings.value || 0),
        maximum
      )
    );

    const wrapper = createElement(
      'div',
      'quantity-control'
    );

    const minusButton = createElement(
      'button',
      'quantity-control__button',
      '−'
    );

    const quantityValue = createElement(
      'span',
      'quantity-control__value',
      quantity
    );

    const plusButton = createElement(
      'button',
      'quantity-control__button',
      '+'
    );

    minusButton.type = 'button';
    plusButton.type = 'button';

    minusButton.setAttribute(
      'aria-label',
      'Decrease quantity'
    );

    plusButton.setAttribute(
      'aria-label',
      'Increase quantity'
    );

    function render() {
      quantityValue.textContent =
        String(quantity);

      minusButton.disabled =
        quantity <= minimum;

      plusButton.disabled =
        quantity >= maximum;
    }

    function update(nextQuantity) {
      const parsedQuantity =
        Number(nextQuantity);

      if (!Number.isFinite(parsedQuantity)) {
        return;
      }

      quantity = Math.max(
        minimum,
        Math.min(
          parsedQuantity,
          maximum
        )
      );

      render();

      if (
        typeof settings.onChange === 'function'
      ) {
        settings.onChange(quantity);
      }
    }

    minusButton.addEventListener(
      'click',
      function() {
        update(quantity - 1);
      }
    );

    plusButton.addEventListener(
      'click',
      function() {
        update(quantity + 1);
      }
    );

    wrapper.append(
      minusButton,
      quantityValue,
      plusButton
    );

    wrapper.getValue = function() {
      return quantity;
    };

    wrapper.setValue = update;

    render();

    return wrapper;
  }

  function getFriendlyError(error) {
    if (!error) {
      return 'Something went wrong. Please try again.';
    }

    const messages = {
      NETWORK_ERROR:
        'Unable to connect. Check your internet connection.',
      REQUEST_TIMEOUT:
        'The request took too long. Please try again.',
      HTTP_ERROR:
        'Server connection failed. Please try again.',
      SESSION_REQUIRED:
        'Please log in to continue.',
      INVALID_SESSION:
        'Your session is invalid. Please log in again.',
      SESSION_EXPIRED:
        'Your session expired. Please log in again.',
      SESSION_INACTIVE:
        'Your session is no longer active.',
      INVALID_MOBILE:
        'Enter a valid 10-digit mobile number.',
      INVALID_OTP:
        'The OTP entered is incorrect.',
      INVALID_OTP_FORMAT:
        'Enter the 6-digit OTP.',
      OTP_EXPIRED:
        'OTP expired. Please request a new OTP.',
      OTP_ATTEMPTS_EXCEEDED:
        'Maximum OTP attempts exceeded. Request a new OTP.',
      ACCOUNT_NOT_FOUND:
        'No account was found for these details.',
      ACCOUNT_ALREADY_EXISTS:
        'An account already exists for these details.',
      RATE_LIMIT_EXCEEDED:
        'Too many attempts. Please wait and try again.',
      INVALID_REFERRAL_CODE:
        'The referral code is invalid or unavailable.',
      CONSENT_REQUIRED:
        'Please accept the required consent to continue.'
    };

    return messages[error.code] ||
      error.message ||
      'Something went wrong. Please try again.';
  }

  function handleApiError(error, options) {
    const settings = options || {};
    const message = getFriendlyError(error);

    showToast(
      message,
      'error',
      4500
    );

    const sessionErrors = [
      'SESSION_REQUIRED',
      'INVALID_SESSION',
      'SESSION_EXPIRED',
      'SESSION_INACTIVE'
    ];

    if (
      error &&
      sessionErrors.includes(error.code) &&
      settings.redirectToLogin !== false
    ) {
      if (window.ApnaBiteCore) {
        window.ApnaBiteCore.clearSession();

        window.setTimeout(function() {
          window.ApnaBiteCore.navigate(
            'login.html',
            true
          );
        }, 500);
      }
    }

    return message;
  }

  window.ApnaBiteUI = Object.freeze({
    showToast: showToast,
    setButtonLoading: setButtonLoading,
    createSpinner: createSpinner,
    showLoader: showLoader,
    createSkeletonCard: createSkeletonCard,
    showSkeletons: showSkeletons,
    createState: createState,
    showEmptyState: showEmptyState,
    showErrorState: showErrorState,
    showOfflineState: showOfflineState,
    showModal: showModal,
    closeModal: closeModal,
    confirmAction: confirmAction,
    createQuantityControl:
      createQuantityControl,
    getFriendlyError:
      getFriendlyError,
    handleApiError:
      handleApiError
  });
})(window, document);
