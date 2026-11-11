import { DEFAULT_COLOR, LIST_COLORS } from '../constants.js';

const dialog = document.getElementById('list-dialog');
const form = document.getElementById('list-form');
const titleElement = document.getElementById('list-dialog-title');
const submitButton = document.getElementById('list-submit');
const titleInput = document.getElementById('list-title');
const errorElement = document.getElementById('list-title-error');
const colorOptions = document.getElementById('color-options');

let onSubmit = null;

function buildColorOptions() {
  for (const color of LIST_COLORS) {
    const label = document.createElement('label');
    label.className = 'color-option';
    label.dataset.color = color.id;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'color';
    input.value = color.id;
    input.className = 'visually-hidden';

    const swatch = document.createElement('span');
    swatch.className = 'color-option__swatch';
    swatch.setAttribute('aria-hidden', 'true');

    const name = document.createElement('span');
    name.className = 'color-option__name';
    name.textContent = color.label;

    label.append(input, swatch, name);
    colorOptions.append(label);
  }
}

function clearError() {
  errorElement.hidden = true;
  errorElement.textContent = '';
  titleInput.removeAttribute('aria-invalid');
}

function showError(message) {
  errorElement.hidden = false;
  errorElement.textContent = message;
  titleInput.setAttribute('aria-invalid', 'true');
  titleInput.focus();
}

function handleSubmit(event) {
  event.preventDefault();

  const title = titleInput.value.trim();

  if (!title) {
    showError('Escribe un título para la lista.');
    return;
  }

  const color = form.querySelector('input[name="color"]:checked')?.value ?? DEFAULT_COLOR;
  const handled = onSubmit?.({
    mode: dialog.dataset.mode,
    listId: dialog.dataset.listId || null,
    title,
    color
  });

  if (handled === false) {
    return;
  }

  dialog.close();
}

function open({ mode = 'create', list = null, suggestedColor = DEFAULT_COLOR } = {}) {
  const editing = mode === 'edit' && list;
  dialog.dataset.mode = editing ? 'edit' : 'create';
  dialog.dataset.listId = editing ? list.id : '';
  titleElement.textContent = editing ? 'Editar lista' : 'Nueva lista';
  submitButton.textContent = editing ? 'Guardar cambios' : 'Crear lista';
  titleInput.value = editing ? list.title : '';

  const color = editing ? list.color : suggestedColor;
  const radio = form.querySelector(`input[name="color"][value="${color}"]`) ?? form.querySelector('input[name="color"]');

  if (radio) {
    radio.checked = true;
  }

  clearError();
  dialog.showModal();
  titleInput.focus();

  if (editing) {
    titleInput.select();
  }
}

export function initListDialog({ onSubmit: submitHandler }) {
  onSubmit = submitHandler;
  buildColorOptions();

  form.addEventListener('submit', handleSubmit);
  titleInput.addEventListener('input', clearError);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener('close', clearError);

  return { open };
}
