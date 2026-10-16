# Arranque del computador nuevo de Cristian (instrucciones para Claude Code)

Hola, Claude. Soy Cristian, de UX en UBITS. Este Mac es nuevo y no tiene nada instalado. Necesito que me dejes listo el
**playground-ux** (repo `techubits/playground-ux` en Bitbucket, rama `cristian`) para seguir trabajando donde lo dejé en
otro computador. Respóndeme siempre en español y sin jerga técnica.

## Reglas mientras me ayudas
- **Nunca escribas mis contraseñas** ni las pidas por el chat. Cuando haga falta iniciar sesión (Bitbucket, AWS, la
  contraseña del Mac, Vercel), detente, dime exactamente qué hacer y espera a que te confirme.
- Antes de cada paso, dime en una línea qué vas a hacer. Si algo falla, lee el error y arréglalo antes de seguir.
- No hagas commit, push ni publiques nada sin preguntarme.

## Pasos

1. **Revisa qué hay instalado**: `git`, `brew`, `node`, `aws`. Si falta git, corre `xcode-select --install` y espérame:
   abre una ventana que debo aceptar.

2. **Llave SSH para Bitbucket** (el repo se baja por SSH):
   - Si no existe, créala: `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_bitbucket -C "cristian-pc-nuevo" -N ""`
   - Añade a `~/.ssh/config` (sin duplicarlo si ya está):
     ```
     Host bitbucket.org
       HostName bitbucket.org
       User git
       IdentityFile ~/.ssh/id_ed25519_bitbucket
       IdentitiesOnly yes
     ```
   - Copia la llave pública al portapapeles (`pbcopy < ~/.ssh/id_ed25519_bitbucket.pub`) y **detente**. Pídeme que la
     pegue en Bitbucket: mi foto › Personal settings › SSH keys › Add key.
   - Cuando te confirme, prueba con `ssh -o StrictHostKeyChecking=accept-new -T git@bitbucket.org`. Debe responder con mi
     usuario.

3. **Bajar el proyecto**:
   ```
   mkdir -p ~/Developer && cd ~/Developer && git clone git@bitbucket.org:techubits/playground-ux.git
   cd ~/Developer/playground-ux && git checkout cristian
   git config user.email herramientasubits@ubits.co
   git config user.name "Cristian Muñoz"
   ```
   El correo es obligatorio en este repo: con otro, Vercel no publica y un gancho bloquea el commit. Configúralo solo en
   el repo, no en global.

4. **Instalar con el script del proyecto**: `bash scripts/setup.sh`. Instala Homebrew, Node y AWS CLI si faltan.
   - Si Homebrew pide la contraseña del Mac, **detente** y pídeme que corra yo el comando en mi terminal.
   - La primera vez se detiene en AWS porque falta configurar el acceso. Sigue con el paso 5.

5. **Configurar AWS una sola vez.** Es interactivo, así que **pídeme que corra yo** `aws configure sso` en mi terminal y
   dame esta tabla para que responda:

   | Pregunta | Respuesta |
   | --- | --- |
   | SSO session name | `ubits` |
   | SSO start URL | `https://identitycenter.amazonaws.com/ssoins-72238f9ab8f99973` |
   | SSO region | `us-east-1` |
   | SSO registration scopes | `sso:account:access` |
   | (se abre el navegador: yo inicio sesión) | |
   | Cuenta | `824404647578` |
   | Rol | `ProductDesignerDev` |
   | Default client Region | `us-east-1` |
   | CLI default output format | `json` |
   | Profile name | `default` |

   Si no me aparece esa cuenta o ese rol, mi usuario aún no tiene acceso: dime que se lo pida a ingeniería. Su guía:
   https://ubits-dev.atlassian.net/wiki/external/ZjE2MWI1YmNlMGZiNDcyMWJkY2RlMWQyYzQ1NGMxMjM

   Cuando termine, vuelve a correr `bash scripts/setup.sh`. Esta vez debe terminar e instalar las dependencias. La
   librería interna `@ubits/flux-ui` sale de un registro privado; su acceso dura unas 12 horas y se renueva con
   `npm run aws-login`.

6. **Comprobar que todo funciona**:
   - `npm run check` tiene que decir: reglas en orden, lint sin errores y typecheck sin errores.
   - Levanta el playground con `npm run dev` y confírmame en qué dirección quedó (normalmente `http://localhost:5173`).
   - Si tienes un navegador a mano, abre `/admin/aprendizaje/planes-de-formacion/planes` y dime si carga.

7. **Recuperar el contexto**. En el repo están el traspaso y tu memoria del computador anterior:
   - Lee completo `docs/traspaso/cristian-2026-10-01.md`: decisiones, pendientes, análisis del design system y reglas del
     equipo.
   - Copia los archivos de `docs/traspaso/memoria-claude/` (todos menos `LEEME.md`) a tu carpeta de memoria de este
     proyecto y dime cuántos quedaron.
   - Lee también `CLAUDE.md` y `AGENTS.md` del repo: son las reglas obligatorias de la maqueta.

8. **Cerrar con un resumen corto**:
   - qué quedó instalado;
   - qué me tocó hacer a mí;
   - en qué estado está la rama `cristian` frente a `staging` (`git fetch` y cuántos commits hay de diferencia en cada
     sentido);
   - cuáles son los pendientes de la sección 4 del traspaso.

## Opcional (solo si te lo pido después)
- Capturas para revisar el design system: `npm i -g playwright && npx playwright install chromium`.
- Figma: `/plugin` e instalar `figma` del catálogo oficial; yo inicio sesión.
- Publicar en Vercel: yo inicio sesión con `npx vercel@latest login --global-config ~/.vercel-ubits`, usando la cuenta de
  herramientas. Los pasos están en la skill `publicar-en-vercel` del repo.
