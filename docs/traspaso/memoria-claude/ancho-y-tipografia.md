---
name: ancho-y-tipografia
description: "Regla del usuario: cuerpo de página a 1.140 px máximo y tipografía del tema (Inter, Heading/Text de flux-ui, seminegrita), también al usar piezas del marco de Nicolás."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: bec59ca1-6c42-4844-9b78-e4dd5b5e2d6a
  modified: 2026-09-15T15:27:14.815Z
---

El 2026-09-15, al pasar el design system al marco de Nicolás, el usuario pidió «recuerda el máximo width del
body y la tipografía». Al usar su `PageHeader` los títulos habían cambiado a `text-4xl font-light` forzado.

**Why:** Carlos pidió pesos seminegrita/negrita y consistencia; las reglas del repo prohíben tamaños y fuentes
hardcodeados. Nicolás trae de su concepto letra fina (Geist, cifras en 300) que no es la del tema.

**How to apply:**
- Cuerpo: contenedor de 1.140 px centrado (`PageShell` por defecto = `max-w-285`; en ShellUbits, el cuerpo
  de 1.140). 720 px solo formularios/pasos, 1.600 px solo tableros densos.
- Tipografía: solo la del tema (Inter). Títulos con `Heading` por nivel (página = nivel 2, 3xl seminegrita;
  sección = nivel 5), textos con `Text` (`size`, `weight`, `variant`). Nada de `text-[13px]`, `font-light`,
  `tracking-*` ni `!` en clases. El 2026-09-15 se corrigió `PageHeader`/`PageSection` en prueba-fusion
  (commit d45328d); el resto del marco de Nicolás (barra lateral, pie, menús flotantes) aún fuerza tamaños.
- Al revisar, capturar a 1.440 y 1.920 px para ver que el cuerpo no pasa de 1.140.
Relacionado: [[marco-unico-shellubits]], [[fusion-rama-nico]], [[feedback-carlos-concepto]].
