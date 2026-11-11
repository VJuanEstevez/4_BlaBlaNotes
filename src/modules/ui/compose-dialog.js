import { MAX_NOTE_LENGTH } from '../constants.js';

const dialog = document.getElementById('compose-dialog');
const form = document.getElementById('compose-form');
const listNameElement = document.getElementById('compose-list-name');
const textarea = document.getElementById('compose-text');
const counter = document.getElementById('compose-counter');
const errorElement = document.getElementById('compose-error');

let onSave = null;

function updateCounter() {
  counter.textContent = `${textarea.value.length} / ${MAX_NOTE_LENGTH}`;
}

function clearError() {
  errorElement.hidden = true;
  errorElement.textContent = '';
  textarea.removeAttribute('aria-invalid');
}

function showError(message) {
  errorElement.hidden = false;
  errorElement.textContent = message;
  textarea.setAttribute('aria-invalid', 'true');
  textarea.focus();
}

function handleSubmit(event) {
  event.preventDefault();

  const text = textarea.value.trim();

  if (!text) {
    showError('Escribe el texto de la nota.');
    return;
  }

  if (onSave?.(text) === false) {
    return;
  }

  dialog.close();
}

function open(list) {
  listNameElement.textContent = list.title;
  textarea.value = '';
  clearError();
  updateCounter();
  dialog.showModal();
  textarea.focus();
}

export function initComposeDialog({ onSave: saveHandler }) {
  onSave = saveHandler;

  form.addEventListener('submit', handleSubmit);
  textarea.addEventListener('input', () => {
    clearError();
    updateCounter();
  });

  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return { open };
}
