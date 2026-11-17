import { SHARE_TEXT_LIMIT } from '../constants.js';
import { buildWhatsAppText, copyText } from '../utils.js';
import { showToast } from './toast.js';

export async function shareList(list) {
  if (!list) {
    return;
  }

  const text = buildWhatsAppText(list);

  if (text.length > SHARE_TEXT_LIMIT) {
    const copied = await copyText(text);
    showToast(
      copied
        ? 'La lista es muy larga para WhatsApp. El texto completo se ha copiado al portapapeles.'
        : 'La lista es demasiada larga para WhatsApp.',
      { variant: copied ? 'default' : 'error' }
    );
    return;
  }

  const popup = window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');

  if (popup) {
    popup.opener = null;
    return;
  }

  const copied = await copyText(text);
  showToast(
    copied ? 'No se ha podido abrir WhatsApp. El texto se ha copiado al portapapeles.' : 'No se ha podido abrir WhatsApp.',
    { variant: copied ? 'default' : 'error' }
  );
}
