const dateFormatter = new Intl.DateTimeFormat('es-ES', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit'
});

export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatTimestamp(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return dateFormatter.format(date);
}

export function formatNoteCount(count) {
  return count === 1 ? '1 nota' : `${count} notas`;
}

export function formatListSummary(list) {
  if (!list || list.notes.length === 0) {
    return 'Sin notas todavía';
  }

  const doneCount = list.notes.filter((note) => note.done).length;
  const doneLabel = doneCount === 1 ? '1 hecha' : `${doneCount} hechas`;

  return `${formatNoteCount(list.notes.length)} · ${doneLabel}`;
}

export function truncate(text, maxLength = 90) {
  const normalized = text.replace(/\s+/g, ' ').trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 1)}…`;
}

export function buildWhatsAppText(list) {
  const lines = [`*${list.title}*`, ''];

  if (list.notes.length === 0) {
    lines.push('_Sin notas todavía._');
  } else {
    for (const note of list.notes) {
      lines.push(`${note.done ? '✅' : '☐'} ${note.text}`);
    }
  }

  lines.push('', '_Enviado desde BlaBlaNotes_');

  return lines.join('\n');
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to the legacy copy method.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.append(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    return copied;
  } catch {
    return false;
  }
}

export function getSpeechRecognition() {
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}
