---
name: anatomia-asistentes-aprendizaje
description: "Los formularios de creación de Aprendizaje siguen la anatomía de David (Crear contenido, Diagnóstico): Frame gris por bloque y panel «Vista previa» a la derecha."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 96fbffe0-44a5-4202-935f-065c956fe67e
  modified: 2026-10-01T15:32:07.744Z
---

Al crear algo en Aprendizaje (planes, contenidos, assessments), cada bloque va en un `Frame` de flux-ui (FrameHeader con FrameTitle + FrameDescription afuera, FramePanel blanco adentro) y a la derecha un `Frame` «Vista previa»: arriba el nombre (apagado «Sin nombre todavía») con su insignia, luego filas término/valor, un Separator y al final «Faltan N datos» con barra y lista (AvanceObligatorios de piezas-resumen). Referencia en staging: lms-creator/crear-contenido/components/resumen-contenido.tsx y diagnostico/components/resumen-assessment.tsx.

**Why:** el 1-oct Cristian pidió «mejoremos esta card» y luego «revisa cómo lo tienen en esta ruta» (staging, LMS Creator › Crear contenido): quiere que los asistentes de Aprendizaje se lean igual. Una lista de chequeo propia que hice antes se reemplazó por esta anatomía.

**How to apply:** antes de inventar un panel de resumen en Aprendizaje, mira esas dos piezas en origin/staging (la rama cristian puede ir atrás). Relacionado: [[aprendizaje-planes-grupos]], [[calcar-estructura-mejorar-ui]].
