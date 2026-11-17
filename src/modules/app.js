import { DEFAULT_COLOR } from './constants.js';
import {
  addNote,
  createList,
  getActiveList,
  getState,
  saveNow,
  subscribe,
  updateList
} from './store.js';
import { formatListSummary } from './utils.js';
import { initDrawer, renderDrawer } from './ui/drawer.js';
import { initNotesView, renderNotes } from './ui/notes-view.js';
import { initListDialog } from './ui/list-dialog.js';
import { initComposeDialog } from './ui/compose-dialog.js';
import { initRecorder } from './ui/recorder.js';
import { initSettingsDialog } from './ui/settings-dialog.js';
import { initTheme } from './ui/theme.js';
import { shareList } from './ui/share.js';
import { showToast } from './ui/toast.js';

const topbar = document.getElementById('topbar');
const topbarEyebrow = document.getElementById('topbar-eyebrow');
const topbarTitles = document.querySelector('.topbar__titles');
const topbarTitle = document.getElementById('topbar-title');
const topbarTitleButton = document.getElementById('topbar-titles');
const noListsEmpty = document.getElementById('no-lists-empty');
const notesSection = document.getElementById('notes-section');
const notesEmpty = document.getElementById('notes-empty');
const notesSummary = document.getElementById('notes-summary');
const emptyCreateButton = document.getElementById('empty-create-button');
const writeButton = document.getElementById('write-button');
const shareButton = document.getElementById('share-button');
const recordButton = document.getElementById('record-button');
const mainElement = document.getElementById('main');

let pendingAction = null;

function suggestColor() {
  const lists = getState().lists;

  if (lists.length === 0) {
    return DEFAULT_COLOR;
  }

  return lists[lists.length - 1].color;
}

function focusTrigger(trigger) {
  if (trigger instanceof HTMLElement && trigger.isConnected) {
    trigger.focus({ preventScroll: true });
  }
}

function openNewListDialog(trigger, action = null) {
  pendingAction = action;
  focusTrigger(trigger);
  listDialog.open({ mode: 'create', suggestedColor: suggestColor() });
}

const listDialog = initListDialog({
  onSubmit({ mode, listId, title, color }) {
    if (mode === 'edit' && listId) {
      const updated = updateList(listId, { title, color });

      if (!updated) {
        showToast('No se ha podido guardar la lista.', { variant: 'error' });
        return false;
      }

      showToast('Lista actualizada.');
      return true;
    }

    const list = createList({ title, color });

    if (!list) {
      showToast('No se ha podido crear la lista.', { variant: 'error' });
      return false;
    }

    showToast('Lista creada.');

    const action = pendingAction;
    pendingAction = null;

    if (action === 'write' || action === 'record') {
      window.setTimeout(() => {
        if (action === 'write') {
          writeButton.focus({ preventScroll: true });
          composeDialog.open(list);
        } else {
          recordButton.focus({ preventScroll: true });
          recorder.open(list);
        }
      }, 0);
    } else {
      window.setTimeout(() => {
        mainElement.focus({ preventScroll: true });
      }, 0);
    }

    return true;
  }
});

const composeDialog = initComposeDialog({
  onSave(text) {
    const note = addNote(text);

    if (!note) {
      showToast('No se ha podido guardar la nota.', { variant: 'error' });
      return false;
    }

    return true;
  }
});

const recorder = initRecorder({
  getLanguage: () => getState().settings.lang,
  onSaveNote(text) {
    const note = addNote(text);

    if (!note) {
      showToast('No se ha podido guardar la nota dictada.', { variant: 'error' });
      return false;
    }

    showToast('Nota dictada añadida.');
    return true;
  }
});

const settingsDialog = initSettingsDialog();

function openWriter() {
  const list = getActiveList();

  if (!list) {
    openNewListDialog(writeButton, 'write');
    return;
  }

  composeDialog.open(list);
}

function openRecorder() {
  const list = getActiveList();

  if (!list) {
    openNewListDialog(recordButton, 'record');
    return;
  }

  recorder.open(list);
}

function openActiveListDialog() {
  const list = getActiveList();

  if (!list) {
    return;
  }

  focusTrigger(topbarTitleButton);
  listDialog.open({ mode: 'edit', list });
}

function render(state) {
  const list = state.lists.find((entry) => entry.id === state.activeListId) ?? null;

  if (list) {
    topbar.dataset.color = list.color;
    topbarEyebrow.textContent = 'Lista activa';
    topbarTitle.textContent = list.title;
    topbarTitleButton.disabled = false;
    shareButton.hidden = false;
    document.title = `${list.title} · BlaBlaNotes`;
  } else {
    delete topbar.dataset.color;
    topbarEyebrow.textContent = 'Notas por voz y texto';
    topbarTitle.textContent = 'BlaBlaNotes';
    topbarTitleButton.disabled = true;
    shareButton.hidden = true;
    document.title = 'BlaBlaNotes';
  }

  noListsEmpty.hidden = state.lists.length > 0;
  notesSection.hidden = !list;

  if (list) {
    notesSummary.textContent = formatListSummary(list);
    notesEmpty.hidden = list.notes.length > 0;
  }

  renderDrawer(state);
  renderNotes(state);
}

initTheme();
initNotesView();
initDrawer({
  onNewList(trigger) {
    openNewListDialog(trigger);
  },
  onSettings(trigger) {
    focusTrigger(trigger);
    settingsDialog.open();
  }
});

subscribe(render);
render(getState());

writeButton.addEventListener('click', openWriter);
recordButton.addEventListener('click', openRecorder);
emptyCreateButton.addEventListener('click', () => openNewListDialog(emptyCreateButton));
shareButton.addEventListener('click', () => {
  const list = getActiveList();

  if (list) {
    void shareList(list);
  }
});

topbar.addEventListener('click', (event) => {
  if (!(event.target instanceof Element) || !getActiveList()) {
    return;
  }

  if (event.target === topbar || topbarTitles.contains(event.target)) {
    openActiveListDialog();
  }
});

document.addEventListener('click', (event) => {
  if (!(event.target instanceof Element)) {
    return;
  }

  const closeButton = event.target.closest('[data-close]');

  if (closeButton) {
    closeButton.closest('dialog')?.close();
  }
});

let lastStorageWarning = 0;

window.addEventListener('blablanotes:storage-error', () => {
  const now = Date.now();

  if (now - lastStorageWarning < 5000) {
    return;
  }

  lastStorageWarning = now;
  showToast('No se han podido guardar los cambios. Revisa el espacio disponible en el navegador.', {
    variant: 'error'
  });
});

window.addEventListener('pagehide', saveNow);

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    saveNow();
  }
});
