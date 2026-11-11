export const APP_NAME = 'BlaBlaNotes';
export const APP_VERSION = '1.0.0';
export const STORAGE_KEY = 'blablanotes.state.v1';
export const DATA_VERSION = 1;

export const MAX_TITLE_LENGTH = 60;
export const MAX_NOTE_LENGTH = 5000;
export const SHARE_TEXT_LIMIT = 3500;

export const LIST_COLORS = [
  { id: 'sand', label: 'Arena' },
  { id: 'peach', label: 'Melocotón' },
  { id: 'rose', label: 'Rosa' },
  { id: 'lavender', label: 'Lavanda' },
  { id: 'sky', label: 'Cielo' },
  { id: 'mint', label: 'Menta' },
  { id: 'lime', label: 'Lima' },
  { id: 'stone', label: 'Piedra' }
];

export const COLOR_IDS = LIST_COLORS.map((color) => color.id);
export const DEFAULT_COLOR = 'sand';

export const SPEECH_LANGUAGES = [
  { id: 'es-ES', label: 'Español (España)' },
  { id: 'es-MX', label: 'Español (México)' },
  { id: 'es-AR', label: 'Español (Argentina)' },
  { id: 'en-US', label: 'Inglés (Estados Unidos)' },
  { id: 'en-GB', label: 'Inglés (Reino Unido)' },
  { id: 'pt-BR', label: 'Portugués (Brasil)' },
  { id: 'fr-FR', label: 'Francés (Francia)' },
  { id: 'de-DE', label: 'Alemán (Alemania)' },
  { id: 'ca-ES', label: 'Catalán' }
];

export const SPEECH_LANGUAGE_IDS = SPEECH_LANGUAGES.map((language) => language.id);
export const DEFAULT_SETTINGS = { lang: 'es-ES' };
