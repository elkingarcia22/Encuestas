---
name: revision-david-planes-2026-09-30
description: Revisión de David a Planes de formación (30-sep) — pendientes, reglas de negocio de planes y dependencia de su módulo Desempeño
metadata:
  type: project
---

Reunión Cristian–David del 2026-09-30 sobre Planes de formación (staging). David necesita Planes listo hoy o mañana: su módulo de Desempeño depende de él.

Pedidos: menús de la tabla en español (Pin to left/right, Toggle columns); lupa del buscador de la tabla montada sobre el texto; «Personalizar columnas» a dos renglones; vacío de búsqueda del DS (Limpiar búsqueda, lupa con X) y ver el vacío de Planes; título/descripción de «Ver plan» desalineados; resumen de la fila en cifras (personas y contenidos, no nombre del grupo); «Aún no lo empiezan» completo en un panel; algo tapaba «Eliminar»; crear con selector de dos fechas y tarjeta de resumen (patrón de Cristian) — decidir borde/fondo; EDITAR POR PERSONA (Gestionar contenidos, como en el real) debe volver.

Reglas de negocio: plan de contenidos = cursos específicos; plan de competencias = una competencia (miles de cursos) + intensidad en horas. Al guardar queda «Procesando» y grupos/empresa se convierten en personas. Producción guarda con botón (sin autoguardado). Competencias tienen habilidades (Comunicación: 7); dejar UI de filtro por habilidades lista; Carlos tiene iconos de competencias en Figma. Pantalla de referencia: Mac de 13". Ver [[aprendizaje-planes-grupos]].

Hecho el 30-sep (sin commit): TablaDatos con pinnable:false, textos de menús de la librería traducidos (design-system/data-grid/textos-libreria.ts) y tabla-datos.css (lupa del filtro y ancho/mayúsculas del menú de columnas; index.css es zona protegida); vacíos SinResultados/PrimeraVez en las tablas de Planes y Grupos (?vacio en la lista); nombre alineado con px-0! (px-0 solo no le gana al tema); resumen de fila en cifras; «Ver las N personas» en un panel; editar por persona en el panel de editar; crear con RangoDeFechas y la tarjeta «Así va el plan» (piezas-resumen de Vacantes). Pendiente: competencias con habilidades e iconos de Carlos; documentar los arreglos de la tabla en /design-system/diferencias.
- 1-oct: competencias = catálogo real de src/shared/bd (35 competencias con imagen, 156 habilidades); se fueron las «familias» inventadas; planes de ejemplo renombrados a competencias reales. «Enfoque por habilidades (opcional)» en el paso Competencias de Agregar asignación (Asignacion.habilidades: competencia → habilidades; sin entrada = todas; enfoqueDe en planes-datos). Tarjetas dicen «7 habilidades» / «Enfocada en 2 de 4». Cuadrícula también para competencias. Pendiente: iconos de Carlos (Figma).
