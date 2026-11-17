import {
  COLOR_IDS,
  DATA_VERSION,
  DEFAULT_COLOR,
  DEFAULT_SETTINGS,
  MAX_NOTE_LENGTH,
  MAX_TITLE_LENGTH,
  SPEECH_LANGUAGE_IDS,
  SPEECH_LANGUAGES,
  STORAGE_KEY,
  THEME_IDS
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

function normalizeLanguage(value) {
  if (SPEECH_LANGUAGE_IDS.includes(value)) {
    return value;
  }

  // Datos antiguos guardados con un código corto («es», «en»…): se amplía al idioma más cercano.
  const base = typeof value === 'string' ? value.split('-')[0] : '';

  if (base) {
    const match = SPEECH_LANGUAGES.find((language) => language.id.split('-')[0] === base);

    if (match) {
      return match.id;
    }
  }

  return DEFAULT_SETTINGS.lang;
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
  const lang = normalizeLanguage(raw.settings?.lang);
  const theme = raw.settings?.theme;
  const resolvedTheme = THEME_IDS.includes(theme) ? theme : DEFAULT_SETTINGS.theme;

  return {
    version: DATA_VERSION,
    lists,
    activeListId,
    settings: { ...DEFAULT_SETTINGS, lang, theme: resolvedTheme }
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
