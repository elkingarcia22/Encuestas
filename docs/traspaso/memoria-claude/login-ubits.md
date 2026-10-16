---
name: login-ubits
description: Cómo llegar al login de la plataforma UBITS real; la contraseña la escribe siempre el usuario.
metadata: 
  node_type: memory
  type: reference
  originSessionId: 9b6ec876-7655-459c-8d46-b59dd878042e
  modified: 2026-09-11T21:06:33.132Z
---

Cuenta del usuario en la plataforma real: cmunozdesing@ubits.co.

- `https://login.ubitslearning.com/login` abierto directo da «Oops!, something went wrong» (Auth0
  sin `state`). Hay que entrar por `https://www.ubitslearning.com/`, que redirige al formulario
  con el `state` correcto.
- La contraseña no la escribe Claude: se deja la pestaña abierta en el Chrome del usuario (Claude
  in Chrome) y se le pide que inicie sesión; después se puede recorrer el LMS con su sesión.

El 2026-09-11 el usuario pidió «pon atención bien cómo es el LMS» para los templates siguientes
(su tarea «LMS»). Mientras no haya sesión, el recorrido documentado está en
`docs/plataforma-ubits/05-marco-c-creator.md` y en las HU de `admin/productos/aprendizaje/lms-creator/`.
El 2026-09-13 se recorrió el administrador real con esta sesión: ver [[recorrido-admin-ubits]].
Relacionado: [[contexto-producto-hus]], [[concepto-home-jefe]].
