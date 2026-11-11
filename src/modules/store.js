import { COLOR_IDS, DEFAULT_COLOR, MAX_NOTE_LENGTH, MAX_TITLE_LENGTH } from './constants.js';import { createEmptyState, loadState, normalizeState, saveState } from './storage.js';
import { createId } from './utils.js';

let state = loadState() ?? createEmptyState();
const listeners = new Set();
let saveTimer = null;

function emit() {
  for (const listener of listeners) {
    listener(state);
  }
}

function persist() {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveTimer = null;

    if (!saveState(state)) {
      window.dispatchEvent(new CustomEvent('blablanotes:storage-error'));
    }
  }, 150);
}

function commit() {
  persist();
  emit();
}

function findNote(noteId) {
  for (const list of state.lists) {
    const note = list.notes.find((entry) => entry.id === noteId);

    if (note) {
      return { list, note };
    }
  }

  return null;
}

export function subscribe(listener) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function getState() {
  return state;
}

export function getActiveList() {
  return state.lists.find((list) => list.id === state.activeListId) ?? null;
}

export function saveNow() {
  window.clearTimeout(saveTimer);
  saveTimer = null;

  if (!saveState(state)) {
    window.dispatchEvent(new CustomEvent('blablanotes:storage-error'));
  }
}

export function createList({ title, color }) {
  const cleanTitle = typeof title === 'string' ? title.trim().slice(0, MAX_TITLE_LENGTH) : '';

  if (!cleanTitle) {
    return null;
  }

  const now = new Date().toISOString();
  const list = {
    id: createId(),
    title: cleanTitle,
    color: COLOR_IDS.includes(color) ? color : DEFAULT_COLOR,
    createdAt: now,
    updatedAt: now,
    notes: []
  };

  state.lists.push(list);
  state.activeListId = list.id;
  commit();

  return list;
}

export function updateList(listId, { title, color }) {
  const list = state.lists.find((entry) => entry.id === listId);

  if (!list) {
    return false;
  }

  const cleanTitle = typeof title === 'string' ? title.trim().slice(0, MAX_TITLE_LENGTH) : '';

  if (!cleanTitle) {
    return false;
  }

  list.title = cleanTitle;

  if (COLOR_IDS.includes(color)) {
    list.color = color;
  }

  list.updatedAt = new Date().toISOString();
  commit();
  return true;
}

export function deleteList(listId) {
  const index = state.lists.findIndex((entry) => entry.id === listId);

  if (index === -1) {
    return false;
  }

  state.lists.splice(index, 1);

  if (state.activeListId === listId) {
    state.activeListId = state.lists[index]?.id ?? state.lists[index - 1]?.id ?? null;
  }

  commit();
  return true;
}

export function setActiveList(listId) {
  if (state.activeListId === listId || !state.lists.some((list) => list.id === listId)) {
    return;
  }

  state.activeListId = listId;
  commit();
}

export function addNote(text) {
  const list = getActiveList();
  const cleanText = typeof text === 'string' ? text.trim().slice(0, MAX_NOTE_LENGTH) : '';

  if (!list || !cleanText) {
    return null;
  }

  const now = new Date().toISOString();
  const note = {
    id: createId(),
    text: cleanText,
    done: false,
    createdAt: now,
    updatedAt: now
  };

  list.notes.push(note);
  list.updatedAt = now;
  commit();

  return note;
}

export function updateNote(noteId, text) {
  const match = findNote(noteId);
  const cleanText = typeof text === 'string' ? text.trim().slice(0, MAX_NOTE_LENGTH) : '';

  if (!match || !cleanText) {
    return false;
  }

  const now = new Date().toISOString();
  match.note.text = cleanText;
  match.note.updatedAt = now;
  match.list.updatedAt = now;
  commit();
  return true;
}

export function toggleNote(noteId, done) {
  const match = findNote(noteId);

  if (!match) {
    return false;
  }

  const now = new Date().toISOString();
  match.note.done = Boolean(done);
  match.note.updatedAt = now;
  match.list.updatedAt = now;
  commit();
  return true;
}

export function deleteNote(noteId) {
  const match = findNote(noteId);

  if (!match) {
    return false;
  }

  const index = match.list.notes.findIndex((note) => note.id === noteId);
  match.list.notes.splice(index, 1);
  match.list.updatedAt = new Date().toISOString();
  commit();
  return true;
}

export function updateSettings(patch) {
  state.settings = { ...state.settings, ...patch };
  commit();
}

export function replaceState(nextState) {
  const normalized = normalizeState(nextState);

  if (!normalized) {
    return false;
  }

  state = normalized;
  commit();
  return true;
}

export function resetState() {
  state = createEmptyState();
  window.clearTimeout(saveTimer);
  saveTimer = null;
  saveState(state);
  emit();
}
