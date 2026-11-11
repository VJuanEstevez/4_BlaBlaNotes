import { MAX_NOTE_LENGTH } from '../constants.js';
import { getSpeechRecognition } from '../utils.js';

const dialog = document.getElementById('record-dialog');
const form = document.getElementById('record-form');
const listNameElement = document.getElementById('record-list-name');
const statusElement = document.getElementById('record-status');
const interimElement = document.getElementById('record-interim');
const textarea = document.getElementById('record-text');
const hintElement = document.getElementById('record-hint');
const toggleButton = document.getElementById('record-toggle');
const saveButton = document.getElementById('record-save');

const ERROR_MESSAGES = {
  'not-allowed': 'No se ha permitido el micrófono. Revisa los permisos del navegador.',
  'service-not-allowed': 'El servicio de dictado no está disponible o no tiene permiso.',
  'audio-capture': 'No se ha encontrado ningún micrófono.',
  network: 'El dictado necesita conexión y el servicio no responde.',
  'no-speech': 'No se ha detectado voz. Inténtalo de nuevo.',
  'language-not-supported': 'El idioma elegido no está disponible en este navegador.',
  aborted: 'El dictado se ha detenido.'
};

let onSaveNote = null;
let getLanguage = () => 'es-ES';
let recognition = null;
let listening = false;
let manualStop = false;
let interimText = '';
let lastErrorCode = null;

function setStatus(message, { error = false } = {}) {
  statusElement.textContent = message;
  statusElement.classList.toggle('is-error', error);
}

function updateInterim() {
  interimElement.textContent = interimText;
  interimElement.hidden = !interimText || !listening;
}

function updateUi() {
  dialog.classList.toggle('is-recording', listening);
  toggleButton.textContent = listening ? 'Detener dictado' : (textarea.value.trim() ? 'Continuar dictado' : 'Empezar a dictar');
  saveButton.disabled = !textarea.value.trim();
  updateInterim();
}

function appendFinal(rawText) {
  const clean = rawText.replace(/\s+/g, ' ').trim();

  if (!clean) {
    return;
  }

  const current = textarea.value.replace(/\s+$/, '');
  let next = current ? `${current} ${clean}` : clean;

  if (next.length > MAX_NOTE_LENGTH) {
    next = next.slice(0, MAX_NOTE_LENGTH);
    setStatus('Has alcanzado el límite de caracteres. El dictado se ha detenido.');
    stopRecognition(true);
  }

  textarea.value = next;
  textarea.scrollTop = textarea.scrollHeight;
  updateUi();
}

function flushInterim() {
  if (!interimText) {
    return;
  }

  const pending = interimText;
  interimText = '';
  appendFinal(pending);
  updateInterim();
}

function detachRecognition() {
  if (!recognition) {
    return;
  }

  recognition.onstart = null;
  recognition.onresult = null;
  recognition.onerror = null;
  recognition.onend = null;

  try {
    recognition.abort();
  } catch {
    // The recognition may already be stopped.
  }

  recognition = null;
}

function handleResult(event) {
  if (!dialog.open) {
    return;
  }

  let interim = '';

  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const result = event.results[index];
    const transcript = result[0]?.transcript ?? '';

    if (result.isFinal) {
      appendFinal(transcript);
    } else {
      interim += transcript;
    }
  }

  interimText = interim.trim();
  updateInterim();
}

function handleError(event) {
  if (!dialog.open) {
    return;
  }

  lastErrorCode = event.error;
  flushInterim();
  listening = false;
  updateUi();
  setStatus(ERROR_MESSAGES[event.error] ?? 'No se ha podido usar el micrófono. Inténtalo de nuevo.', { error: true });
}

function handleEnd() {
  if (!dialog.open) {
    listening = false;
    return;
  }

  listening = false;
  recognition = null;

  if (lastErrorCode) {
    updateUi();
    return;
  }

  flushInterim();
  updateUi();
  setStatus(
    manualStop
      ? 'Dictado detenido. Revisa el texto y guarda tu nota.'
      : 'El dictado se ha pausado. Puedes continuar cuando quieras.'
  );
}

function createRecognition() {
  const Recognition = getSpeechRecognition();
  const instance = new Recognition();
  instance.lang = getLanguage();
  instance.continuous = true;
  instance.interimResults = true;
  instance.maxAlternatives = 1;

  instance.onstart = () => {
    if (!dialog.open) {
      return;
    }

    listening = true;
    setStatus('Escuchando…');
    updateUi();
  };

  instance.onresult = handleResult;
  instance.onerror = handleError;
  instance.onend = handleEnd;

  return instance;
}

function startRecognition() {
  const Recognition = getSpeechRecognition();

  if (!Recognition || listening) {
    return;
  }

  detachRecognition();
  lastErrorCode = null;
  manualStop = false;

  try {
    recognition = createRecognition();
    recognition.start();
    listening = true;
    setStatus('Escuchando…');
    updateUi();
  } catch {
    recognition = null;
    listening = false;
    updateUi();
    setStatus('No se ha podido iniciar el dictado. Pulsa el botón para intentarlo de nuevo.', { error: true });
  }
}

function stopRecognition(byUser) {
  manualStop = byUser;

  if (!recognition) {
    listening = false;
    updateUi();
    return;
  }

  try {
    recognition.stop();
  } catch {
    listening = false;
    updateUi();
  }
}

function handleToggle() {
  if (listening) {
    stopRecognition(true);
  } else {
    startRecognition();
  }
}

function handleSubmit(event) {
  event.preventDefault();
  detachRecognition();
  listening = false;
  flushInterim();
  updateUi();

  const text = textarea.value.trim();

  if (!text) {
    setStatus('Escribe o dicta algo antes de guardar.', { error: true });
    textarea.focus();
    return;
  }

  if (onSaveNote?.(text) === false) {
    setStatus('No se ha podido guardar la nota.', { error: true });
    return;
  }

  dialog.close();
}

function cleanup() {
  listening = false;
  manualStop = true;
  interimText = '';
  lastErrorCode = null;
  detachRecognition();
  dialog.classList.remove('is-recording');
  interimElement.hidden = true;
  interimElement.textContent = '';
}

export function initRecorder({ getLanguage: languageGetter, onSaveNote: saveHandler }) {
  getLanguage = languageGetter ?? getLanguage;
  onSaveNote = saveHandler;

  form.addEventListener('submit', handleSubmit);
  toggleButton.addEventListener('click', handleToggle);

  textarea.addEventListener('input', updateUi);
  textarea.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      form.requestSubmit();
    }
  });

  dialog.addEventListener('close', cleanup);
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return {
    open(list) {
      const supported = Boolean(getSpeechRecognition());

      listNameElement.textContent = list.title;
      textarea.value = '';
      interimText = '';
      lastErrorCode = null;
      manualStop = false;
      hintElement.textContent = supported
        ? 'Puedes corregir el texto antes de guardarlo.'
        : 'Tu navegador no admite el dictado. Escribe la nota manualmente.';
      toggleButton.hidden = !supported;
      setStatus(supported ? 'Preparando el micrófono…' : 'Tu navegador no admite el dictado.');
      updateUi();
      dialog.showModal();

      if (supported) {
        toggleButton.focus({ preventScroll: true });
        startRecognition();
      } else {
        textarea.focus();
      }
    }
  };
}
