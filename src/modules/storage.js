import {
  COLOR_IDS,
  DATA_VERSION,
  DEFAULT_COLOR,
  DEFAULT_SETTINGS,
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  SPEECH_LANGUAGE_IDS,
  STORAGE_KEY
} from './constants.js';
import { createId } from './utils.js';

export function createEmptyState() {
  return {
    version: DATA_VERSION,
    lists: [],
    activeListId: null,
    settings: { ...DEFAULT_SETTINGS }
  };
}

function normalizeText(value, maxLength) {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function normalizeDate(value, fallback) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return date.toISOString();
}

export function normalizeState(raw) {
  if (!raw || typeof raw !== 'object' || !Array.isArray(raw.lists)) {
    return null;
  }

  const usedIds = new Set();
  const normalizeId = (value) => {
    let id = typeof value === 'string' && value.trim() ? value.trim() : createId();

    if (usedIds.has(id)) {
      id = createId();
    }

    usedIds.add(id);
    return id;
  };

  const lists = raw.lists.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') {
      return [];
    }

    const title = normalizeText(entry.title, MAX_TITLE_LENGTH);

    if (!title) {
      return [];
    }

    const createdAt = normalizeDate(entry.createdAt, new Date().toISOString());
    const notes = Array.isArray(entry.notes)
      ? entry.notes.flatMap((note) => {
          if (!note || typeof note !== 'object') {
            return [];
          }

          const text = normalizeText(note.text, MAX_NOTE_LENGTH);

          if (!text) {
            return [];
          }

          const noteCreatedAt = normalizeDate(note.createdAt, createdAt);

          return [
            {
              id: normalizeId(note.id),
              text,
              done: Boolean(note.done),
              createdAt: noteCreatedAt,
              updatedAt: normalizeDate(note.updatedAt, noteCreatedAt)
            }
          ];
        })
      : [];

    return [
      {
        id: normalizeId(entry.id),
        title,
        color: COLOR_IDS.includes(entry.color) ? entry.color : DEFAULT_COLOR,
        createdAt,
        updatedAt: normalizeDate(entry.updatedAt, createdAt),
        notes
      }
    ];
  });

  const activeListId = lists.some((list) => list.id === raw.activeListId) ? raw.activeListId : (lists[0]?.id ?? null);
  const language = raw.settings?.lang;
  const lang = SPEECH_LANGUAGE_IDS.includes(language) ? language : DEFAULT_SETTINGS.lang;

  return {
    version: DATA_VERSION,
    lists,
    activeListId,
    settings: { ...DEFAULT_SETTINGS, lang }
  };
}

export function loadState() {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return null;
    }

    return normalizeState(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function clearStoredState() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing else to do if the browser blocks storage access.
  }
}
