---
name: expediente-candidato
description: "Bloque «Expediente digital y evaluaciones» (Selección, pedido de Elkin, 22-sep): pantalla propia con pestañas, vacante comercial nueva y lo pendiente."
metadata:
  node_type: memory
  type: project
  originSessionId: 96fbffe0-44a5-4202-935f-065c956fe67e
  modified: 2026-09-22T22:13:09.966Z
---

Maquetado el 22-23 sep en la rama cristian; commit 056e5a7 (23 sep, sin subir). Ruta
`/admin/seleccion/vacantes/:id/candidatos/:candidatoId?pestana=…`, en
`vacantes/detalle/candidato/`. El panel lateral del tablero quedó como vista rápida con «Ver expediente».

Decisiones que Cristian aprobó («Hazlo»): pantalla propia y no panel (por los ~660 px de alto);
pestañas según el flujo de la vacante; lo profundo (transcripción, comentario) en DrawerShell;
Serena sin pestañas anidadas; tocar lo mínimo de data.ts (etapas psicometricas/roleplay, `flujo?`
por vacante, `etapa?` en Nota, VACANTE_COMERCIAL). data.ts lo trata como ajeno aunque git lo
atribuye a tiangrupify.

**Why:** los docs (06-marco-d) solo respaldan las 5 etapas, Serena y el filtro de CV; confianza,
psicométricas, roleplay con control de trampas, transcripciones, documentos e historial vienen del
pedido y están por confirmar con producto.

**How to apply:** pendiente el visor de PDF (se propusieron opciones, no se improvisó); estado
compartido tablero↔expediente en `estado-vacante.ts`. Relacionado: [[crear-vacante-elkin]].
