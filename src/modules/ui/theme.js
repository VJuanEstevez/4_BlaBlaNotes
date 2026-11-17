import { getState, subscribe, updateSettings } from '../store.js';

const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
const themeColorMeta = document.querySelector('meta[name="theme-color"]');

const THEME_COLORS = {
  light: '#faf6ee',
  dark: '#14171a'
};

const THEME_TOGGLES = {
  light: 'Cambiar al tema oscuro',
  dark: 'Cambiar al tema claro'
};

let themeButton = null;

export function resolveTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    return theme;
  }

  return darkQuery.matches ? 'dark' : 'light';
}

function applyTheme(state = getState()) {
  const theme = resolveTheme(state.settings.theme);

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  themeColorMeta?.setAttribute('content', THEME_COLORS[theme]);

  if (!themeButton) {
    return;
  }

  const label = THEME_TOGGLES[theme];
  themeButton.setAttribute('aria-label', label);
  themeButton.setAttribute('data-tooltip', label);
}

export function initTheme() {
  themeButton = document.getElementById('theme-button');

  themeButton?.addEventListener('click', () => {
    const current = resolveTheme(getState().settings.theme);
    updateSettings({ theme: current === 'dark' ? 'light' : 'dark' });
  });

  darkQuery.addEventListener('change', () => {
    if (getState().settings.theme === 'system') {
      applyTheme();
    }
  });

  subscribe(applyTheme);
  applyTheme();
}
