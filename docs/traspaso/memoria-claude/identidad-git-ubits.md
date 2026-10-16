---
name: identidad-git-ubits
description: Desde el 24-sep todo commit de playground-ux se firma con herramientasubits@ubits.co (cuenta de Vercel); gancho que lo vigila y el historial viejo sin reescribir.
metadata:
  type: project
---

Desde el 2026-09-24 (pedido de Cristian) todo commit de este repo se firma con
`herramientasubits@ubits.co`: el proyecto de Vercel vive en la cuenta de herramientas de UBITS y solo
recibe commits cuyo autor es de esa cuenta. Config local del repo: `user.name = Cristian Muñoz`,
`user.email = herramientasubits@ubits.co`; la global (`tiangrupify <tian@grupify.com>`) no se tocó.

Del 21 al 23-sep se firmó como `Cristian Muñoz <cmunoz@ubits.co>`; antes, `tiangrupify`. Nada de
eso se reescribe (ya está en Bitbucket y rompería las copias de Nicolás y del resto).

Los dos primeros commits del 24-sep (54ace76 y e6452c1) salieron con `herramientas@ubits.co`, un
correo equivocado; se corrigió con un commit nuevo encima, sin reescribir.

**Why:** con otro correo el push llega a Bitbucket pero Vercel no publica, y nadie se entera.
**How to apply:** `ai-tools/hooks/revisar-identidad.mjs` (SessionStart + PreToolUse·Bash) avisa y
bloquea commits con otro correo o con `--author`. Documentado en CLAUDE.md («Al cerrar», punto 4),
skill publicar-en-vercel y la tabla de ganchos de flux-ui-storybook. AGENTS.md es protegido: no se
tocó. La publicación manual a `grupify/playground-ux` ([[vercel-deploy-playground]]) queda hasta
confirmar cómo publica el proyecto de herramientas.
