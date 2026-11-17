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

/* Idiomas para el reconocimiento de voz del navegador (BCP 47).
   «auto» usa el idioma configurado en el dispositivo. */
export const SPEECH_LANGUAGES = [
  { id: 'auto', label: 'Usar el idioma del navegador' },
  { id: 'es-ES', label: 'Español (España)' },
  { id: 'es-MX', label: 'Español (México)' },
  { id: 'es-AR', label: 'Español (Argentina)' },
  { id: 'en-US', label: 'Inglés (Estados Unidos)' },
  { id: 'en-GB', label: 'Inglés (Reino Unido)' },
  { id: 'pt-BR', label: 'Portugués (Brasil)' },
  { id: 'fr-FR', label: 'Francés (Francia)' },
  { id: 'de-DE', label: 'Alemán (Alemania)' },
  { id: 'it-IT', label: 'Italiano' },
  { id: 'ca-ES', label: 'Catalán' }
];

export const SPEECH_LANGUAGE_IDS = SPEECH_LANGUAGES.map((language) => language.id);

export const THEMES = [
  { id: 'system', label: 'Seguir el sistema' },
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' }
];
export const THEME_IDS = THEMES.map((theme) => theme.id);
export const DEFAULT_SETTINGS = { lang: 'auto', theme: 'system' };
