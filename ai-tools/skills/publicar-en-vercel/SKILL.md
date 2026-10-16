---
name: publicar-en-vercel
description: >-
  Publicar el playground en internet para compartirlo por enlace con el equipo, el jefe o
  quien revisa. Usar cuando pidan "subamos a Vercel", "publica esto", "pásame el enlace",
  "quiero mostrarlo en la reunión". Explica cómo compilar, qué se sube, cómo queda siempre el
  mismo enlace público y qué revisar antes y después.
---

# Publicar el playground

El playground se publica **ya compilado** en la cuenta de Vercel de UBITS (equipo **UX Playground**,
proyecto `ux-playground/playground-ux`). Vercel no compila nada, solo sirve los archivos: no tiene
acceso a la librería interna (@ubits/flux-ui vive en CodeArtifact de AWS y el acceso dura 12 horas),
así que si intenta compilar desde Bitbucket falla con «npm error code E401».

Desde el 25 sep el proyecto `ux-playground/playground-ux` tiene los **dominios de UBITS**, y su rama de
producción es `develop`:

| Rama | Cómo se publica | Enlace público |
| --- | --- | --- |
| `develop` | `deploy --prebuilt --prod` | <https://playground.ubits.co> |
| `staging` | `deploy --prebuilt` (sin `--prod`) y después `vercel alias set <publicación> staging-playground.ubits.co` (y `playground-ux-staging.vercel.app`) | <https://staging-playground.ubits.co> |

`staging-playground.ubits.co` es un dominio **de rama**: Vercel solo lo llena solo cuando compila un push a
`staging`, y eso falla (E401). Por eso se apunta a mano con `alias set`. Ojo: cada `--prod` (develop) mueve
también `playground-ux-staging.vercel.app` y `-sigma` a develop; después de publicar develop, vuelve a
apuntar `playground-ux-staging.vercel.app` a la publicación de staging. El proyecto aparte
`playground-ux-develop` (<https://playground-ux-develop.vercel.app>, del 24 sep) sobra y se retira cuando
el equipo deje de usar ese enlace.

Cada enlace muestra **lo que está en esa rama en Bitbucket**, no lo que hay en la copia local: se arma
desde la rama (un `git worktree` de `origin/staging` u `origin/develop`, con `node_modules` enlazado)
y no desde la carpeta de trabajo. Los enlaces `…-ux-playground.vercel.app` piden iniciar sesión en
Vercel (protección del equipo): no se comparten.

## Quién firma: herramientasubits@ubits.co

Todo commit de este repo se firma con **`herramientasubits@ubits.co`** (decisión del 24 sep). El proyecto
de Vercel vive en la cuenta de herramientas de UBITS y solo recibe los commits cuyo autor es de esa
cuenta: un commit con otro correo sube a Bitbucket, pero Vercel no lo toma y nada avisa.

- Se configura una vez por copia del repo: `git config user.email herramientasubits@ubits.co`. Solo
  cambia este repo; el nombre de cada persona se queda, así se sigue viendo quién hizo qué.
- Compruébalo antes de cualquier commit con `git config user.email`.
- El gancho `ai-tools/hooks/revisar-identidad.mjs` lo avisa al abrir la sesión y **bloquea** un
  commit con otro correo, también si viene con `--author`.
- Los commits viejos (tiangrupify, cmunoz@ubits.co, los de Nicolás y los dos del 24 sep que salieron con
  `herramientas@ubits.co` por error) no se reescriben: ya están en
  Bitbucket y reescribirlos rompería las copias del resto del equipo.

## Antes de publicar

1. **Pregunta.** Publicar deja el trabajo a la vista de cualquiera con el enlace; no se hace
   por iniciativa propia.
2. **Compila** con `npm run build`. Compilar es además la única forma de detectar archivos que
   ya no existen: `npm run check` no mira las imágenes ni los recursos importados, así que
   borrar un PNG que alguien sigue importando solo falla aquí.
3. **Cierra con `npm run check`** si tocaste pantallas.

## Publicar

La sesión de Vercel de UBITS se guarda **aparte**, en `~/.vercel-ubits`, para no cerrar la de
Grupify (la cuenta personal que tenía el enlace viejo). Si no existe, la inicia la persona, no
Claude, porque pide confirmar desde el correo:

```bash
npx vercel login --global-config ~/.vercel-ubits
```

Se entra con **herramientasubits@ubits.co**, en una ventana de incógnito si el navegador tiene abierta
otra cuenta de Vercel. Se comprueba con `npx vercel whoami --global-config ~/.vercel-ubits`.

La carpeta de publicación vive en el directorio temporal de la sesión:

```
vercel-ubits/.vercel/project.json          # sale de: vercel link --yes --project playground-ux --scope ux-playground
vercel-ubits/.vercel/output/config.json     # rutas: todo a index.html y cabecera noindex
vercel-ubits/.vercel/output/static/         # aquí va el contenido de dist/
```

`config.json`, que es el que hace que las direcciones internas funcionen al recargar:

```json
{ "version": 3, "routes": [
  { "src": "/(.*)", "headers": { "X-Robots-Tag": "noindex, nofollow" }, "continue": true },
  { "handle": "filesystem" },
  { "src": "/(.*)", "dest": "/index.html" } ] }
```

El procedimiento, por cada rama: armar la rama (`npm run build` en su worktree), vaciar `static/`,
copiar su `dist/` en su lugar y, desde la carpeta de publicación de ese proyecto (`vercel-ubits/` para
staging, `vercel-ubits-develop/` para develop, cada una con su `vercel link`):

```bash
npx vercel deploy --prebuilt --prod --yes --scope ux-playground --global-config ~/.vercel-ubits
```

El enlace viejo de Grupify (`playground-ux-flame.vercel.app`, proyecto `grupify/playground-ux`) ya no
se actualiza; solo se usa si alguien lo pide.

## Después

- El primer intento a veces responde **«Not authorized»**: se reintenta y pasa.
- Comprueba dos o tres direcciones con `curl -o /dev/null -w "%{http_code}"`, incluida alguna
  interna (`/design-system/...`), no solo la portada.
- Entrega el enlace público de la rama, no el de la publicación concreta
  (`playground-xxxx.vercel.app`), que cambia cada vez.
- Comprueba que cada enlace sirve la versión de su rama: el `assets/index-*.js` del enlace tiene que
  ser el mismo del `dist/index.html` que armaste.

## Junto con Bitbucket

Cuando pidan «sube a los dos», son dos cosas distintas: el commit y el push a la rama en
Bitbucket, y esta publicación. Haz las dos y di el resultado de cada una. El commit, firmado con
`herramientasubits@ubits.co` (arriba).

## Cuando Vercel pueda compilar solo

El push firmado con `herramientasubits@ubits.co` ya llega a Vercel, pero la compilación falla por el
acceso a la librería (E401). Cuando ingeniería le dé a Vercel su propio acceso a CodeArtifact (lo
limpio: la federación OIDC de Vercel con un rol de AWS que solo lea ese repositorio, y un paso que pida
el token antes de instalar; `scripts/aws-login.sh` tendría que saltarse en Vercel), el push basta y la
publicación manual sobra: actualiza esta skill ese día.
