const region = document.getElementById('toast-region');
const MAX_VISIBLE_TOASTS = 3;

export function showToast(message, { variant = 'default', duration = 4200 } = {}) {
  try {
    if (typeof region.showPopover === 'function' && !region.matches(':popover-open')) {
      region.showPopover();
    }
  } catch {
    // The toast stays visible even if the Popover API is unavailable.
  }

  const toast = document.createElement('p');
  toast.className = variant === 'error' ? 'toast toast--error' : 'toast';
  toast.textContent = message;
  region.append(toast);

  while (region.children.length > MAX_VISIBLE_TOASTS) {
    region.firstElementChild.remove();
  }

  window.setTimeout(() => {
    toast.remove();
  }, duration);
}
