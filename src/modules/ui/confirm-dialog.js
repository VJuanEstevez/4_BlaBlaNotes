const dialog = document.getElementById('confirm-dialog');
const titleElement = document.getElementById('confirm-title');
const messageElement = document.getElementById('confirm-message');
const acceptButton = document.getElementById('confirm-accept');
const cancelButton = dialog.querySelector('button[value="cancel"]');

let resolvePromise = null;

dialog.addEventListener('close', () => {
  const resolve = resolvePromise;
  resolvePromise = null;
  resolve?.(dialog.returnValue === 'confirm');
});

dialog.addEventListener('click', (event) => {
  if (event.target === dialog) {
    dialog.close('cancel');
  }
});

export function askConfirm({
  title = 'Confirmar',
  message,
  confirmLabel = 'Eliminar',
  cancelLabel = 'Cancelar',
  danger = true
}) {
  if (dialog.open) {
    return Promise.resolve(false);
  }

  titleElement.textContent = title;
  messageElement.textContent = message;
  acceptButton.textContent = confirmLabel;
  acceptButton.className = danger ? 'button button--danger' : 'button button--primary';
  cancelButton.textContent = cancelLabel;
  dialog.returnValue = '';

  return new Promise((resolve) => {
    resolvePromise = resolve;
    dialog.showModal();
  });
}
