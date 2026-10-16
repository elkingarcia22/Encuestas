# Guía — Copy corto en diapositivas (SCORM y canvas de video)

Referencia de producto para el pool demo, placeholders y generación futura de diapositivas en **Presentación interactiva** y escenas **Canvas / Diapositivas** de Video con IA. Misma plantilla HTML (`scormGenerator`).

## Por qué importa

En presentaciones y e-learning, demasiado texto en pantalla hace que la gente **lea en vez de escuchar o procesar**. La teoría de doble canal (texto escrito + voz/narración) indica que párrafos largos compiten con la atención: el slide debe **anclar** la idea, no ser el guion completo.

Fuentes consultadas (síntesis de buenas prácticas, 2024–2025):

- [How Much Text Should Go on a Presentation Slide? (Beautiful.ai)](https://designerbot.com/blog/how-much-text-should-go-on-a-presentation-slide)
- [Educator's blueprint: high-quality slides (AEM Education)](https://doi.org/10.1002/aet2.11022)
- Reglas clásicas 5×5 / 6×6 (p. ej. [Prezentium — bullet points](https://prezentium.com/6-ways-to-use-bullet-points-for-presentations/))
- Densidad de información según uso del deck ([Andrew Quagliata](https://www.andrewquagliata.com/post/information-density-is-the-key-to-smarter-slide-decks))

## Reglas UBITS (playground y producto)

| Regla | Objetivo |
|-------|----------|
| **Una idea por diapositiva** | Si hay 5 modos o 5 pasos densos, mejor 5 slides cortos o bullets de frase corta, no un párrafo por ítem. |
| **Test de 3 segundos** | En 3 s debe quedar claro el mensaje principal (título + 1 frase o pocos bullets). |
| **~15–35 palabras visibles** en diapos de apoyo (contenido, pasos, cita, cierre). Con imagen a un lado: preferir bullets cortos (no párrafos); 3–5 bullets de frase corta. |
| **Bullets 5×6** | Máx. 5 bullets; ~6 palabras por bullet. Si hay 5 modos, una línea corta por modo (sin explicación larga). |
| **Título = takeaway** | El título dice la idea; el cuerpo no la repite en prosa. |
| **Detalle → notas / narración / hotspots** | Lo largo va a voz del video, tooltip del hotspot o acordeón/tab, no al bloque principal. |
| **Imagen a un lado** | Tipos con media lateral (contenido, pasos, cita, dato clave, timeline, resumen, split, intro clásica): el texto **no** debe llenar todo el ancho; deja aire junto a la imagen. |

### Excepción e-learning sin presentador

En SCORM autocontenido el slide a veces **es** el material. Aun así: frases cortas, jerarquía clara, una idea por bloque. Preferir tabs/acordeón/hotspots para profundizar en vez de un único panel con 200+ palabras.

## Checklist rápido (antes de Generar / al editar demo)

1. ¿Se entiende en 3 segundos?
2. ¿Hay más de ~6 líneas densas? → partir o acortar.
3. ¿Cada bullet es una mini-frase? → sí.
4. ¿La imagen lateral tiene espacio o el texto la aplasta? → acortar copy.
5. ¿Esto es guion oral? → sacar del slide y dejar ancla.

## Qué está en el playground

- Pool demo Thomas-Kilmann y placeholders: copy acortado según esta guía (`buildPool` / `applyPlaceholderSlidesForPreview`).
- Layouts con **imagen lateral** restaurados (estado previo a “slides solo texto”) para content, steps, quote, keypoint, summary, timeline; intro clásica con foto; split / media ya tenían imagen.
- Video canvas usa las mismas plantillas: misma densidad y misma composición.

## Relacionado

- [HU-LMS-017 — Agregar SCORM](./HU-scorm-con-ia.md)
- [HU-LMS-018 — Presentación interactiva](./HU-presentacion-interactiva.md)
- [HU-LMS-003 — Video con IA](./HU-video-con-ia.md)
