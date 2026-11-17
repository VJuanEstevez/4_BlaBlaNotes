import { askConfirm } from './confirm-dialog.js';
import { deleteList, getState, setActiveList } from '../store.js';
import { formatNoteCount } from '../utils.js';
import { showToast } from './toast.js';

const desktopQuery = window.matchMedia('(min-width: 64rem)');

const TRASH_ICON =
  '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h16M9 7V4h6v3M10 11v6M14 11v6M6.5 7l.8 13h9.4l.8-13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" /></svg>';

let elements = null;
let isOpen = false;
let lastTrigger = null;

function getFocusableElements() {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  return Array.from(elements.drawer.querySelectorAll(selector)).filter((element) => element.getClientRects().length > 0);
}

function focusMain() {
  document.getElementById('main')?.focus({ preventScroll: true });
}

function openDrawer() {
  if (desktopQuery.matches || isOpen) {
    return;
  }

  lastTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : elements.menuButton;
  isOpen = true;
  elements.drawer.inert = false;
  elements.drawer.classList.add('is-open');
  elements.scrim.classList.add('is-visible');
  elements.appContent.inert = true;
  document.body.classList.add('drawer-open');
  elements.menuButton.setAttribute('aria-expanded', 'true');
  elements.closeButton.focus();
}

function closeDrawer({ restoreFocus = true } = {}) {
  if (!isOpen) {
    return;
  }

  isOpen = false;
  elements.drawer.classList.remove('is-open');
  elements.scrim.classList.remove('is-visible');
  elements.appContent.inert = false;
  document.body.classList.remove('drawer-open');
  elements.menuButton.setAttribute('aria-expanded', 'false');
  elements.drawer.inert = true;

  if (restoreFocus) {
    const target = lastTrigger?.isConnected ? lastTrigger : elements.menuButton;
    target.focus();
  }
}

function syncViewport() {
  if (desktopQuery.matches) {
    isOpen = false;
    elements.drawer.classList.remove('is-open');
    elements.scrim.classList.remove('is-visible');
    elements.appContent.inert = false;
    document.body.classList.remove('drawer-open');
    elements.menuButton.setAttribute('aria-expanded', 'false');
    elements.drawer.inert = false;
    return;
  }

  if (!isOpen) {
    elements.drawer.inert = true;
    elements.appContent.inert = false;
    elements.scrim.classList.remove('is-visible');
  }
}

function handleKeydown(event) {
  if (!isOpen) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    closeDrawer();
    return;
  }

  if (event.key !== 'Tab') {
    return;
  }

  const focusable = getFocusableElements();

  if (focusable.length === 0) {
    return;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

function focusDeleteButton(listId) {
  elements.listMenu
    .querySelector(`[data-delete-list-id="${CSS.escape(listId)}"]`)
    ?.focus({ preventScroll: true });
}

function focusAfterDelete(deletedIndex) {
  const deleteButtons = elements.listMenu.querySelectorAll('[data-delete-list-id]');
  const target = deleteButtons[Math.min(deletedIndex, deleteButtons.length - 1)] ?? elements.newListButton;
  target?.focus({ preventScroll: true });
}

async function handleDeleteList(listId) {
  const index = getState().lists.findIndex((entry) => entry.id === listId);
  const list = index === -1 ? null : getState().lists[index];

  if (!list) {
    return;
  }

  const notesPart = list.notes.length === 0 ? ' (está vacía)' : ` junto con ${formatNoteCount(list.notes.length)}`;
  const confirmed = await askConfirm({
    title: 'Eliminar lista',
    message: `Se eliminará «${list.title}»${notesPart}. Esta acción no se puede deshacer.`,
    confirmLabel: 'Eliminar lista'
  });

  if (!confirmed) {
    focusDeleteButton(listId);
    return;
  }

  deleteList(listId);
  focusAfterDelete(index);
  showToast('Lista eliminada.');
}

async function handleListClick(event) {
  const deleteButton = event.target.closest('[data-delete-list-id]');

  if (deleteButton) {
    await handleDeleteList(deleteButton.dataset.deleteListId);
    return;
  }

  const button = event.target.closest('[data-list-id]');

  if (!button) {
    return;
  }

  setActiveList(button.dataset.listId);
  closeDrawer({ restoreFocus: false });
  focusMain();
}

export function renderDrawer(state) {
  if (!elements) {
    return;
  }

  elements.listMenu.replaceChildren();
  elements.empty.hidden = state.lists.length > 0;

  for (const list of state.lists) {
    const item = document.createElement('li');
    item.className = 'list-menu__item';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'list-menu__button';
    button.dataset.listId = list.id;
    button.dataset.color = list.color;

    if (list.id === state.activeListId) {
      button.classList.add('is-active');
      button.setAttribute('aria-current', 'true');
    }

    const title = document.createElement('span');
    title.className = 'list-menu__title';
    title.textContent = list.title;

    const count = document.createElement('span');
    count.className = 'list-menu__count';
    count.textContent = formatNoteCount(list.notes.length);

    button.append(title, count);

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'icon-button icon-button--small list-menu__delete tooltip--top tooltip--end';
    deleteButton.dataset.deleteListId = list.id;
    deleteButton.setAttribute('aria-label', `Eliminar lista: ${list.title}`);
    deleteButton.setAttribute('data-tooltip', 'Eliminar lista');
    deleteButton.innerHTML = TRASH_ICON;

    item.append(button, deleteButton);
    elements.listMenu.append(item);
  }
}

export function initDrawer({ onNewList, onSettings }) {
  elements = {
    drawer: document.getElementById('drawer'),
    scrim: document.getElementById('scrim'),
    appContent: document.getElementById('app-content'),
    menuButton: document.getElementById('menu-button'),
    closeButton: document.getElementById('drawer-close'),
    newListButton: document.getElementById('new-list-button'),
    settingsButton: document.getElementById('settings-button'),
    listMenu: document.getElementById('list-menu'),
    empty: document.getElementById('drawer-empty')
  };

  elements.menuButton.addEventListener('click', openDrawer);
  elements.closeButton.addEventListener('click', () => closeDrawer());
  elements.scrim.addEventListener('click', () => closeDrawer());
  elements.listMenu.addEventListener('click', handleListClick);

  elements.newListButton.addEventListener('click', () => {
    const trigger = desktopQuery.matches ? elements.newListButton : elements.menuButton;
    closeDrawer({ restoreFocus: false });
    onNewList?.(trigger);
  });

  elements.settingsButton.addEventListener('click', () => {
    const trigger = desktopQuery.matches ? elements.settingsButton : elements.menuButton;
    closeDrawer({ restoreFocus: false });
    onSettings?.(trigger);
  });

  document.addEventListener('keydown', handleKeydown);
  desktopQuery.addEventListener('change', syncViewport);

  syncViewport();
  renderDrawer(getState());
}
