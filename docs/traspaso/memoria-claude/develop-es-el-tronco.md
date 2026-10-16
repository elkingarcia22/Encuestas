---
name: develop-es-el-tronco
description: La rama local cristian está 58 commits detrás de develop; todo el trabajo de Cristian y Nico ya está junto ahí.
metadata:
  type: project
---

Al 17-sep-2026 la rama local `cristian` está 58 commits por detrás de
`origin/develop` y 0 por delante. Todo lo de Cristian y todo lo de Nicolás ya
está fusionado en `develop` (295 archivos de diferencia, 311 pantallas .tsx
frente a 165 en la rama local). Ramas borrables:
`feature/reorganize-src-modules`, `feature/video-editor`; `shell-test-updates`
se descarta.

**Por qué:** cualquier auditoría o cambio hecho sobre la rama local mira media
foto y reporta cosas ya arregladas (p. ej. `--accent` apuntando a `--primary`,
que en develop ya volvió al gris del tema).

**Cómo aplicarlo:** antes de analizar o tocar código, verificar contra
`origin/develop` (`git show origin/develop:<ruta>` o un snapshot con
`git archive`). Ver [[fusion-rama-nico]] y [[auditoria-unificacion-2026-09-17]].

**Actualización 18-sep:** `prueba-fusion` es el staging de Cristian y Nico y va adelante de
develop (trae cambios de Nico: Marco como página única con pestañas por ruta, Ajustes propios
dentro de Marco). Se trabaja ahí. La rama local `prueba-fusion` está tomada por un worktree de
otra sesión en el scratchpad: para subir, rama temporal desde `origin/prueba-fusion` y
`git push origin HEAD:prueba-fusion`. Local de trabajo: `subir-fusion`.

**Actualización 18-sep (tarde):** `cristian` (local y en Bitbucket) quedó igual a `prueba-fusion`
(47606a8) y es la rama de trabajo local. Flujo: cambios en `cristian` → push a `cristian` y a
`prueba-fusion` (`git push origin HEAD:prueba-fusion`) → PR de `prueba-fusion` a `develop`.
PR abierto a mano por el usuario en Bitbucket; no hay CLI de Bitbucket.

**Actualización 21-sep:** la rama de staging se llama ahora `staging` (creada desde
`prueba-fusion`, mismo commit). `prueba-fusion` se deja unos días hasta que Nicolás cambie su
copia local, y luego se borra. Flujo: trabajo en `cristian` → push a `cristian` y a `staging` →
PR de `staging` a `develop`. **`develop` está protegida en Bitbucket: rechaza el push directo
(pre-receive hook declined), solo entra por pull request.**
