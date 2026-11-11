import { APP_VERSION, SPEECH_LANGUAGES } from '../constants.js';
import { getState, replaceState, resetState, updateSettings } from '../store.js';
import { askConfirm } from './confirm-dialog.js';
import { showToast } from './toast.js';

const dialog = document.getElementById('settings-dialog');
const languageSelect = document.getElementById('speech-language');
const exportButton = document.getElementById('export-button');
const importButton = document.getElementById('import-button');
const importFile = document.getElementById('import-file');
const resetButton = document.getElementById('reset-button');

function populateLanguages() {
  for (const language of SPEECH_LANGUAGES) {
    const option = document.createElement('option');
    option.value = language.id;
    option.textContent = language.label;
    languageSelect.append(option);
  }
}

function exportData() {
  const state = getState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `blablanotes-${stamp}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Copia de seguridad descargada.');
}

async function handleImport() {
  const file = importFile.files?.[0];
  importFile.value = '';

  if (!file) {
    return;
  }

  let parsed = null;

  try {
    parsed = JSON.parse(await file.text());
  } catch {
    showToast('No se ha podido leer la copia. Comprueba que sea un archivo JSON válido.', { variant: 'error' });
    return;
  }

  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.lists)) {
    showToast('El archivo no contiene una copia de BlaBlaNotes.', { variant: 'error' });
    return;
  }

  const listCount = parsed.lists.length;
  const confirmed = await askConfirm({
    title: 'Importar copia',
    message: `Se reemplazarán tus listas actuales por las de la copia (${listCount === 1 ? '1 lista' : `${listCount} listas`}). ¿Quieres continuar?`,
    confirmLabel: 'Importar y reemplazar',
    danger: false
  });

  if (!confirmed) {
    return;
  }

  if (!replaceState(parsed)) {
    showToast('La copia no es válida y no se ha importado.', { variant: 'error' });
    return;
  }

  showToast('Copia importada correctamente.');
  languageSelect.value = getState().settings.lang;
}

async function handleReset() {
  const confirmed = await askConfirm({
    title: 'Borrar todos los datos',
    message: 'Se eliminarán todas tus listas y notas de este navegador. Esta acción no se puede deshacer.',
    confirmLabel: 'Borrar todo'
  });

  if (!confirmed) {
    return;
  }

  resetState();
  dialog.close();
  showToast('Se han borrado todos los datos.');
  document.getElementById('main')?.focus({ preventScroll: true });
}

export function initSettingsDialog() {
  populateLanguages();
  document.getElementById('settings-version').textContent = APP_VERSION;

  languageSelect.addEventListener('change', () => {
    updateSettings({ lang: languageSelect.value });
  });

  exportButton.addEventListener('click', exportData);
  importButton.addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', handleImport);
  resetButton.addEventListener('click', handleReset);

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return {
    open() {
      languageSelect.value = getState().settings.lang;
      dialog.showModal();
    }
  };
}
