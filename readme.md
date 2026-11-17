# BlaBlaNotes

Aplicación web para crear listas de notas por teclado y por voz. Cada lista tiene su propio color, las notas funcionan como una lista de tareas y se pueden compartir por WhatsApp.

## Características

- Navigation drawer con creación de listas, listado, borrado por lista y ajustes.
- Tema claro/oscuro con conmutador de modo oscuro en Ajustes, opción «Seguir el tema del sistema» y botón de tema en la barra superior si está presente.
- 8 colores de lista saturados con contraste AA en ambos temas.
- Edición de título y color desde la cabecera: al pulsar la barra de color o el título de la lista activa.
- Tooltips CSS en los botones, visibles al pasar el ratón y al enfocar con el teclado.
- Notas con estado pendiente/hecha, edición en línea y borrado.
- Dictado de voz con la Web Speech API del navegador: el texto aparece mientras hablas, sin claves ni envíos a servidores propios.
- Envío de listas por WhatsApp desde un botón flotante de solo icono, encima del botón de escribir nota, con copia al portapapeles como alternativa.
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

- El dictado lo proporciona el navegador (Chrome, Edge y Safari); en Firefox no está disponible y puedes escribir la nota a mano. Chrome necesita conexión para escuchar.
- El micrófono necesita un contexto seguro (localhost o HTTPS) y permisos.
- Los datos de cada navegador son independientes. Usa Ajustes → Exportar copia para moverlos.
