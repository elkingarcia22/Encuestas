---
name: duplicados-ds-analisis-2026-10-01
description: "Re-medición en staging (1-oct) de las piezas duplicadas del DS; corrige la auditoría del 29-sep en tablas, ventanas, insignias y legacy del LMS."
metadata:
  node_type: memory
  type: project
  originSessionId: 96fbffe0-44a5-4202-935f-065c956fe67e
  modified: 2026-10-01T15:38:37.389Z
---

Medido sobre origin/staging dbda917 (1-oct-2026). Corrige [[auditoria-ds-cristian-2026-09-29]]:

- **Tablas:** MarcoTabla (David, ahora en src/shared/components/tabla-listado.tsx, zona protegida) se arma con Table a propósito: el «Personalizar columnas» de DataGridList no se puede quitar. Hay dos paginadores en español: PiePaginacion de Nicolás (Selección, y lo usa TablaDatos) y PaginacionTabla de David (MarcoTabla). La causa de fondo es la librería (paginación en inglés, botón de columnas fijo).
- **Ventanas:** las tres son de David. DialogoConfirmar = confirmaciones (AlertDialog), rol claro. El solape real es ActionDialog (31 pantallas) vs ConfiguredModal (~21 fuera del DS, casi todo Aprendizaje y Avisos). Además, 8 archivos usan el Dialog de la librería directo (5 de Selección, Encuestas, 2 del LMS).
- **Insignias:** el envoltorio solo cambia los tamaños xs y sm. Hay 228 archivos (428 usos) con una insignia chica de la librería, 48 de ellos en legacy/exploraciones. Mejor una regla global (o pedirle 10,5 px a la librería) que tocar 228 archivos ajenos.
- **Legacy del LMS:** no está abandonado. David lo deja a la vista desde Contenidos («Versión anterior (legacy 1/2/3)»), y el portal (Progreso) y el DS (demos-lms) importan piezas de legacy/. Borrarlo rompe cosas.
- **Sin documentar** (ni en el catálogo ni en AGENTS): MarcoTabla, ConfiguredModal, PrimeraVez, SinResultados, ChipGuardado, BotonAyuda, MetricasDestacadas y la insignia propia. TablaDatos está en el catálogo, pero no en AGENTS.
- El AiButton sigue diciendo «Asistente IA» (src/shared/components/AiButton.tsx:134).

**How to apply:** usar estas cifras y estos matices al hablar con David y Nicolás; no proponer borrar legacy ni editar las insignias archivo por archivo.
