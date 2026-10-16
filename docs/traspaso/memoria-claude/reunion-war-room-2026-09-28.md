---
name: reunion-war-room-2026-09-28
description: "War room del 28-sep — Planes de formación «rompió la experiencia», «Agente IA» para todo lo de IA, tablas = la del DS con paginación en español, tab convencional como maestra, Selección pasa a Nico."
metadata:
  node_type: memory
  type: project
  originSessionId: 96fbffe0-44a5-4202-935f-065c956fe67e
  modified: 2026-09-29T14:48:51.060Z
---

Reunión con Carlos, Nico, Elkin y David (28-sep-2026). Decisiones que tocan a Cristian:

- **Planes de formación**: Carlos dijo que se «rompió la experiencia»; replicar la lógica de producción y mejorarla, sin
  darle la vuelta al flujo. Mostrar siempre producción vs propuesta lado a lado. Planes en producción lo hizo **David**
  y hay cosas en curso que no se ven: preguntarle. En producción, clic en un estudiante abre un drawer de *vista*
  (no edición). Carlos señaló la incoherencia «Integrantes 84» vs «Lista de usuarios 106 resultados».
- **Grupos** se quedan dentro de Planes de formación por ahora (Elkin quiere sacarlos a algo transversal de core;
  Carlos: dejarlo como hoy hasta que se decida).
- **IA**: el agente es contextual (empuja la interfaz y abre el panel a la derecha). Nombre único **«Agente IA»** para
  los CTA que abren el agente (también los «Resumir con IA»), para la pestaña del superagente (hoy «Suite AI») y para
  el título del panel (hoy «Agente contextual»). Provisional; luego se le da «cariñito».
- **Tablas**: todas iguales a la del DS (Data grid: caja gris, título, conteo, buscador a la derecha, filtros y orden
  en cada columna, filtros externos solo si hacen falta). La paginación debe quedar **en español** con «Anterior /
  Siguiente» y números: tarea de Cristian en el DS. Cristian mandará un prompt al equipo para auditar componentes fuera
  del DS.
- **Tabs**: la maestra es la tab convencional (subrayada), fuera de la tabla; el switch (`variant="view"`) solo en
  casos especiales. Reemplaza la regla de Nicolás del 21-sep.
- **Patrones**: cabecera = título + descripción fijos (no cambian al escribir), acciones a la derecha, contenido abajo;
  barra de acciones fija abajo con el «guardado» ahí; crear y editar con el mismo patrón; crear en página, no modal.
- **Selección** sale de Cristian: Nico es owner e integra con Elkin (expediente, candidatos, exploraciones).
- **Excel**: Cristian tiene todo en «no iniciado» aunque avanzó; Carlos pide estados reales y comprometer entregables
  de la semana (29-sep).
- Carlos subió un Manifiesto (Empezar › Manifiesto) basado en un video de la head de diseño de Stripe: leerlo.

**Why:** son acuerdos del equipo que cambian reglas vigentes (tablas, tabs, nombres de IA).
**How to apply:** ver [[aprendizaje-planes-grupos]], [[icono-ia]] y [[feedback-carlos-concepto]]; ante choque con
reglas-vigentes.md, gana esta reunión.

29-sep, aplicado: `TablaDatos` (design-system/data-grid/tabla-datos.tsx) = DataGridList + PiePaginacion en español dentro
de su marco; migradas las 20 tablas con paginación (quedan con DataGridList solo las que no paginan). Planes con pestaña
subrayada en el `tabs` de PageHeader. Cabecera del panel y riel = «Agente IA»; los «Resumir con IA» del expediente y la
ficha rápida → ReopenAgentButton. Grupos dice «Integrantes» en todo (como la HU). Pendiente: «Suite AI» del menú lateral
(marco protegido), listas de Selección con Table + PiePaginacion (de Nico) y el autor «Agente contextual» de las notas
de la vacante (Selección, de Nico).

29-sep, rama de David (origin/David, 28 commits sobre staging, sana: check y build pasan): hizo `MarcoTabla` en
src/shared/components/tabla-listado.tsx (Table + paginador en español, copia del patrón de Vacantes) y lo usa en
Contenidos, Diagnóstico, Avisos, Universidad corporativa y Zona de estudio. Choca con `TablaDatos` (DataGridList + pie
en español): hay que elegir una. MarcoTabla no tiene selección ni acciones masivas. Choque directo en
avisos-internos/main.tsx y data-grid/main.tsx. Sus piezas nuevas (MarcoTabla, BloqueAtencion, MetricasDestacadas,
BotonAyuda, encabezado-fijo, borde-ia) no están en el design system ni en el catálogo.
