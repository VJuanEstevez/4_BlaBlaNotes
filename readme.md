# BlaBlaNotes

Aplicación web para crear listas de notas por teclado o por voz. Cada lista tiene su propio color, las notas funcionan como una lista de tareas y se pueden compartir por WhatsApp.

## Características

- Navigation drawer con creación de listas, listado y ajustes.
- 8 colores de lista con contraste AA.
- Notas con estado pendiente/hecha, edición en línea y borrado.
- Dictado a texto con la Web Speech API (Chrome, Edge y Safari).
- Envío de listas por WhatsApp con copia al portapapeles como alternativa.
- Exportación e importación de copias de seguridad en JSON.
- Persistencia local con `localStorage`: las notas no salen del dispositivo.

## Desarrollo

```bash
pnpm install
pnpm dev
```

Vite sirve la aplicación con la base `/4_BlaBlaNotes/`. Abre la URL que muestre la terminal.

```bash
pnpm run build
pnpm run preview
```

## Estructura

```
src/
├── index.html
├── css/
│   ├── tokens.css
│   ├── base.css
│   └── components.css
└── modules/
    ├── app.js
    ├── constants.js
    ├── utils.js
    ├── storage.js
    ├── store.js
    └── ui/
```

## Notas

- El dictado necesita un contexto seguro (localhost o HTTPS) y permisos de micrófono.
- Firefox no admite la Web Speech API; en ese caso la app permite escribir la nota manualmente.
- Los datos de cada navegador son independientes. Usa Ajustes → Exportar copia para moverlos.
