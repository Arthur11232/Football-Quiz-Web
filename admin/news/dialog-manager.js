export class DialogManager {
  constructor(dialog) {
    this.dialog = dialog;
    this.eyebrow = dialog.querySelector('[data-dialog-eyebrow]');
    this.title = dialog.querySelector('[data-dialog-title]');
    this.message = dialog.querySelector('[data-dialog-message]');
    this.cancelButton = dialog.querySelector('[data-dialog-cancel]');
    this.confirmButton = dialog.querySelector('[data-dialog-confirm]');
    this.queue = [];
    this.activeRequest = null;

    dialog.addEventListener('close', () => this.finish(dialog.returnValue === 'confirm'));
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close('cancel');
    });
  }

  confirm(options = {}) {
    return new Promise((resolve) => {
      this.queue.push({ options, resolve });
      this.showNext();
    });
  }

  showNext() {
    if (this.activeRequest || this.queue.length === 0) return;
    this.activeRequest = this.queue.shift();
    const {
      eyebrow = 'Подтверждение',
      title = 'Продолжить?',
      message = '',
      confirmText = 'Подтвердить',
      cancelText = 'Отмена',
      tone = 'primary'
    } = this.activeRequest.options;

    this.eyebrow.textContent = eyebrow;
    this.title.textContent = title;
    this.message.textContent = message;
    this.cancelButton.textContent = cancelText;
    this.confirmButton.textContent = confirmText;
    this.confirmButton.dataset.tone = tone;
    this.dialog.returnValue = '';
    this.dialog.showModal();
    this.cancelButton.focus();
  }

  finish(confirmed) {
    if (!this.activeRequest) return;
    const { resolve } = this.activeRequest;
    this.activeRequest = null;
    resolve(confirmed);
    this.showNext();
  }
}
