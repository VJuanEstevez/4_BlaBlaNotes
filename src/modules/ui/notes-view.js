import { getActiveList, getState, deleteNote, toggleNote, updateNote } from '../store.js';
import { formatTimestamp, truncate } from '../utils.js';
import { askConfirm } from './confirm-dialog.js';
import { showToast } from './toast.js';

const template = document.getElementById('note-template');
const notesElement = document.getElementById('notes-list');
const mainElement = document.getElementById('main');

let currentListId = null;
const openDrafts = new Map();

function getNoteElement(noteId) {
  return notesElement.querySelector(`[data-note-id="${CSS.escape(noteId)}"]`);
}

function captureFocus() {
  const active = document.activeElement;

  if (!(active instanceof HTMLElement) || !notesElement.contains(active)) {
    return null;
  }

  const item = active.closest('[data-note-id]');

  if (!item) {
    return null;
  }

  let target = active.dataset.action ?? null;

  if (active.matches('.note__checkbox')) {
    target = 'checkbox';
  } else if (active.matches('.note__textarea')) {
    target = 'textarea';
  }

  return {
    noteId: item.dataset.noteId,
    target,
    start: typeof active.selectionStart === 'number' ? active.selectionStart : null,
    end: typeof active.selectionEnd === 'number' ? active.selectionEnd : null
  };
}

function focusTarget(noteId, target) {
  const item = getNoteElement(noteId);

  if (!item) {
    return;
  }

  const selectors = {
    checkbox: '.note__checkbox',
    textarea: '.note__textarea',
    expand: '[data-action="expand"]',
    edit: '[data-action="edit"]',
    delete: '[data-action="delete"]'
  };

  const element = item.querySelector(selectors[target] ?? selectors.expand);
  element?.focus({ preventScroll: true });
}

function focusTextareaEnd(noteId) {
  const textarea = getNoteElement(noteId)?.querySelector('.note__textarea');

  if (!textarea) {
    return;
  }

  textarea.focus({ preventScroll: true });
  const end = textarea.value.length;
  textarea.setSelectionRange(end, end);
}

function openEditor(noteId, note) {
  if (!openDrafts.has(noteId)) {
    openDrafts.set(noteId, note.text);
  }

  renderNotes(getState());
  focusTextareaEnd(noteId);
}

function closeEditor(noteId) {
  openDrafts.delete(noteId);
  renderNotes(getState());
  focusTarget(noteId, 'expand');
}

function handleSubmit(event) {
  const form = event.target.closest('.note__editor');

  if (!form) {
    return;
  }

  event.preventDefault();

  const item = form.closest('[data-note-id]');
  const noteId = item?.dataset.noteId;
  const textarea = form.querySelector('.note__textarea');
  const text = textarea?.value.trim() ?? '';

  if (!noteId || !textarea) {
    return;
  }

  if (!text) {
    showToast('La nota no puede estar vacía.', { variant: 'error' });
    textarea.focus();
    return;
  }

  openDrafts.delete(noteId);
  const updated = updateNote(noteId, text);

  if (!updated) {
    openDrafts.set(noteId, text);
    showToast('No se ha podido actualizar la nota.', { variant: 'error' });
    return;
  }

  focusTarget(noteId, 'expand');
}

async function handleDelete(note) {
  const confirmed = await askConfirm({
    title: 'Borrar nota',
    message: `Se eliminará esta nota: «${truncate(note.text, 90)}». Esta acción no se puede deshacer.`,
    confirmLabel: 'Borrar nota'
  });

  if (!confirmed) {
    return;
  }

  openDrafts.delete(note.id);
  deleteNote(note.id);
  mainElement.focus({ preventScroll: true });
  showToast('Nota borrada.');
}

async function handleClick(event) {
  const button = event.target.closest('button[data-action]');

  if (!button) {
    return;
  }

  const item = button.closest('[data-note-id]');
  const noteId = item?.dataset.noteId;
  const list = getActiveList();
  const note = list?.notes.find((entry) => entry.id === noteId);

  if (!note) {
    return;
  }

  switch (button.dataset.action) {
    case 'expand':
      if (openDrafts.has(noteId)) {
        closeEditor(noteId);
      } else {
        openEditor(noteId, note);
      }
      break;
    case 'edit':
      openEditor(noteId, note);
      break;
    case 'cancel':
      closeEditor(noteId);
      break;
    case 'delete':
      await handleDelete(note);
      break;
    default:
      break;
  }
}

function handleChange(event) {
  const checkbox = event.target.closest('.note__checkbox');

  if (!checkbox) {
    return;
  }

  const noteId = checkbox.closest('[data-note-id]')?.dataset.noteId;

  if (!noteId) {
    return;
  }

  toggleNote(noteId, checkbox.checked);
}

function handleInput(event) {
  const textarea = event.target.closest('.note__textarea');

  if (!textarea) {
    return;
  }

  const noteId = textarea.closest('[data-note-id]')?.dataset.noteId;

  if (noteId) {
    openDrafts.set(noteId, textarea.value);
  }
}

function handleKeydown(event) {
  const textarea = event.target.closest('.note__textarea');

  if (!textarea) {
    return;
  }

  const noteId = textarea.closest('[data-note-id]')?.dataset.noteId;

  if (!noteId) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeEditor(noteId);
    return;
  }

  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    textarea.closest('form')?.requestSubmit();
  }
}

export function renderNotes(state) {
  const list = state.lists.find((entry) => entry.id === state.activeListId) ?? null;
  const nextListId = list?.id ?? null;
  const listChanged = nextListId !== currentListId;

  if (listChanged) {
    openDrafts.clear();
    currentListId = nextListId;
  }

  const focus = listChanged ? null : captureFocus();
  notesElement.replaceChildren();

  if (!list) {
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const note of list.notes) {
    const item = template.content.firstElementChild.cloneNode(true);
    const isEditing = openDrafts.has(note.id);
    item.dataset.noteId = note.id;

    if (note.done) {
      item.classList.add('is-done');
    }

    if (isEditing) {
      item.classList.add('note--editing');
    }

    const snippet = truncate(note.text, 90);
    const checkbox = item.querySelector('.note__checkbox');
    checkbox.checked = note.done;
    checkbox.setAttribute('aria-label', `${note.done ? 'Marcar como pendiente' : 'Marcar como hecha'}: ${snippet}`);

    const expandButton = item.querySelector('[data-action="expand"]');
    const editor = item.querySelector('.note__editor');
    const textarea = item.querySelector('.note__textarea');
    const label = item.querySelector('[data-textarea-label]');

    editor.id = `note-editor-${note.id}`;
    textarea.id = `note-textarea-${note.id}`;
    label.htmlFor = textarea.id;
    label.textContent = `Editar la nota: ${snippet}`;
    expandButton.setAttribute('aria-expanded', String(isEditing));
    expandButton.setAttribute('aria-controls', editor.id);
    editor.hidden = !isEditing;
    textarea.value = isEditing ? openDrafts.get(note.id) : note.text;

    item.querySelector('.note__text').textContent = note.text;
    item.querySelector('.note__meta').textContent = `${note.done ? 'Hecha · ' : ''}${formatTimestamp(note.updatedAt)}`;
    item.querySelector('[data-action="edit"]').setAttribute('aria-label', `Editar nota: ${snippet}`);
    item.querySelector('[data-action="delete"]').setAttribute('aria-label', `Borrar nota: ${snippet}`);

    fragment.append(item);
  }

  notesElement.append(fragment);

  if (focus) {
    focusTarget(focus.noteId, focus.target);

    if (focus.target === 'textarea' && focus.start !== null) {
      const textarea = getNoteElement(focus.noteId)?.querySelector('.note__textarea');

      if (textarea) {
        textarea.setSelectionRange(focus.start, focus.end ?? focus.start);
      }
    }
  }
}

export function initNotesView() {
  notesElement.addEventListener('click', handleClick);
  notesElement.addEventListener('submit', handleSubmit);
  notesElement.addEventListener('change', handleChange);
  notesElement.addEventListener('input', handleInput);
  notesElement.addEventListener('keydown', handleKeydown);
}
