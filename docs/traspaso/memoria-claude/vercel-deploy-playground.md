---
name: vercel-deploy-playground
description: Desde el 25-sep dominios UBITS: playground.ubits.co=develop (--prod), staging-playground.ubits.co=staging (alias a mano). Antes, desde el 24-sep el playground se publica ya compilado en la cuenta de UBITS (equipo ux-playground), un enlace por rama (staging y develop); Grupify quedó como historial.
metadata: 
  node_type: memory
  type: project
  originSessionId: 7cccada6-400a-4553-948c-fcd7e7c7b09e
  modified: 2026-09-16T14:30:30.690Z
---

**Desde el 2026-09-25 (vigente):** alguien del equipo puso dominios de UBITS en el proyecto `playground-ux` y rama de
producción `develop`: https://playground.ubits.co = develop (`deploy --prebuilt --prod`), https://staging-playground.ubits.co
= dominio de rama staging, que Vercel no llena porque su compilación falla (E401): se publica sin `--prod` y se apunta
con `vercel alias set`. Cada --prod arrastra playground-ux-staging.vercel.app/-sigma a develop: reapuntarlo. El proyecto
`playground-ux-develop` sobra. Detalle en la skill publicar-en-vercel. Primera vez: staging ab6ebed, develop 6a9e081.

**Del 2026-09-24:** cuenta de Vercel de UBITS, usuario `herramientasubits-8955`
(correo herramientasubits@ubits.co), equipo **UX Playground** (`ux-playground`). Sesión del CLI guardada
aparte en `~/.vercel-ubits` (`--global-config`), que la inició Cristian; la de Grupify (`tian-4505`) sigue
intacta en la sesión por defecto. Dos enlaces públicos, uno por rama:
- staging → proyecto `playground-ux` → https://playground-ux-staging.vercel.app (también `-sigma`).
- develop → proyecto `playground-ux-develop` (creado el 24-sep) → https://playground-ux-develop.vercel.app.
Cada rama se arma desde `origin/<rama>` en un worktree con `node_modules` enlazado y se publica con
`deploy --prebuilt --prod --scope ux-playground --global-config ~/.vercel-ubits` desde
`vercel-ubits/` o `vercel-ubits-develop/` del scratchpad. Primera publicación: staging 69ac0f5
(index-CGBMzm7R.js) y develop 6a9e081 (index-BYOm9Zn2.js).
El push a Bitbucket sí dispara compilaciones en `playground-ux`, pero fallan con E401 (CodeArtifact):
pendiente que ingeniería le dé acceso a Vercel (OIDC) o que Carlos apague la compilación automática.

**Historial (Grupify, hasta el 2026-09-23):**

Publicado por primera vez el 2026-09-11 a pedido del usuario ("deploy en vercel sencillo").

- Proyecto: `playground-ux` en el equipo **Grupify** de Vercel (la cuenta del CLI es `tian-4505`;
  el alcance por defecto es ese equipo).
- Enlace público: https://playground-ux-flame.vercel.app — las rutas internas funcionan (todo cae
  en `index.html`) y lleva `X-Robots-Tag: noindex` + `robots.txt` que bloquea buscadores.
- `playground-ux-grupify.vercel.app` y los enlaces de cada despliegue piden iniciar sesión en
  Vercel (Protección estándar del equipo).

**Por qué así:** `@ubits/flux-ui` viene de un registro privado (AWS CodeArtifact, `npm run
aws-login`, token de ~12 h), así que Vercel no puede instalar ni compilar el repo. Además el
`preinstall` corre `scripts/aws-login.sh`.

**Cómo volver a publicar:** `npm run build` en el repo; copiar `dist/` a
`<carpeta fuera del repo>/.vercel/output/static/`; `config.json` versión 3 con rutas
(cabecera noindex con `continue`, `handle: filesystem`, y `/(.*)` → `/index.html`);
`npx vercel@latest link --yes --project playground-ux` y
`npx vercel@latest deploy --prebuilt --prod --yes` desde esa carpeta. Se hace fuera del repo
para que el CLI no conecte el repositorio de Bitbucket ni toque `.gitignore`.
Segunda publicación el mismo día (marco único ShellUbits + template Colaborador), reutilizando
`project.json` y `config.json` de la carpeta anterior en una carpeta nueva del scratchpad; basta
`deploy --prebuilt --prod --yes` (no hizo falta volver a `link`). Para verificar: comparar el
`assets/index-*.js` de `dist/index.html` con el que sirve el enlace público.
Tercera publicación el 2026-09-12 (Home operativo ajustado): el primer `deploy --prebuilt` respondió
«Not authorized» aunque `vercel whoami` daba tian-4505; al repetirlo subió bien (la primera vez
quedaron archivos a medio subir). Si pasa, reintentar con `--debug` antes de concluir que falta
permiso. Carlos pidió publicar «con la cuenta de herramientas»: falta confirmar si es Grupify.
Cuarta publicación el 2026-09-14 (templates Gestión de usuarios, Planes, Encuestas; Icons con Glass;
Quick actions de la Home): mismo método, `project.json`/`config.json` copiados de la carpeta anterior,
`robots.txt` agregado a mano en `static/` (no está en `public/`). Subió al primer intento; ~25 MB por
los PNG Glass. Quinta publicación el 2026-09-14 (Home rediseñada + template Home Suite AI): misma carpeta
`vercel-playground/` del scratchpad, se reemplaza `.vercel/output/static` por `dist/` guardando antes
`robots.txt`. Ojo: con `| tail` la salida del CLI solo muestra el JSON final; el enlace `Aliased` sale arriba.
Sexta publicación el 2026-09-14 (Home tras la reunión de cierre: métricas estilo Nicolás, atención en una caja,
Crear un curso con degradado de IA, pie «Con la tecnología de UBITS»), mismo método.
Séptima el 2026-09-14 (encabezado «Hola, Carolina», fondo azul, 4 atajos, formulario de Encuestas y botón en
Formularios).
Novena (2026-09-14, tooltips con clic): el primer intento devolvió `"status": "error"` sin detalle y al repetirlo
subió bien; verificar siempre que el `index-*.js` público coincida con `dist/index.html`.
Décima (2026-09-15): primera publicada desde la rama **local** `prueba-fusion` (fusión con Nicolás + DS
reorganizado + plantillas en el marco del DS), compilada en su worktree del scratchpad; ese código NO está en
Bitbucket. `project.json`/`config.json`/`robots.txt` copiados de la carpeta del 14-sep. Primer intento «Not
authorized», el segundo subió (patrón repetido: reintentar sin más). Verificado index-CsUN2PZW.js.
Undécima (2026-09-16, para la reunión con el CEO): prueba-fusion hasta 5d8c0db (login Meta, 4 ajustes, fusión 2,
Suite AI en el DS, /admin unificado con «Cómo va cada producto»). Otra vez «Not authorized» al primer intento.
Verificado index-DkayAIF_.js. Duodécima el mismo día (5ad2797: Selección/Assessment/360 calcados de los tableros
que pasó el usuario, medidor con puntas redondeadas); subió al primer intento, index-C0xUsZ2b.js. Decimotercera (3f3139e: pestaña Suite AI del DS + Bold+), index-BnF8VNm8.js, primer intento. Decimocuarta (3dc68ff: Ver en acción + 4 pantallas del admin), index-CDd17Jd_.js. Decimoquinta (94d347e: Pantallas › En el producto + barra marcada en subpáginas), index-DOP8HfS0.js; también subida a Bitbucket el mismo día. Decimosexta (b888028: ReUI «volver a la librería» + fusión 3 de Nicolás sin Inter Tight), index-CyDo0_Gt.js, en Bitbucket y Vercel. Decimoséptima (b38d598: menú de perfil ReUI-14 con el selector de tema original y 248 px), index-C7R8wQDv.js, en ambos. Decimoctava (1e083ac, 17-sep: página Ajustes propios con comparaciones), index-B1zJk47k.js, en ambos. Decimonovena (4a36ed1: fusión 4 de Nicolás con accesibilidad AA), index-BYOm9Zn2.js, en ambos.
Relacionado: [[check-typecheck-no-op]], [[marco-unico-shellubits]], [[fusion-rama-nico]].
