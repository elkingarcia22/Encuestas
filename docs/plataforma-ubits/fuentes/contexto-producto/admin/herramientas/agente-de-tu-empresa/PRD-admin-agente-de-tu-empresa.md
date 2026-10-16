# PRD · Agente de tu empresa

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Borrador |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Herramientas → Agente de tu empresa · Colaborador → Agentes (card) |

## 1. Resumen

Un **agente por empresa** alimentado por **colecciones** (carpetas y documentos). El admin da cara al agente, arma conocimiento y controla visibilidad; el colaborador pregunta en lenguaje natural y ve respuestas citadas. Distinto del chat genérico **Agente IA** y de **Modo estudio IA**. Estado **Borrador** alineado a HU-TRA-001.

## 2. Problema y objetivo

Las políticas viven en archivos sueltos. Sin un agente con fuentes, el equipo pierde tiempo buscando y el admin no controla qué documentos alimentan las respuestas.

**Objetivos (v1 del producto, sujeto a cierre de HU):**

- Un solo agente por tenant; el colaborador no elige “cuál agente”.
- Colecciones con visibilidad (Borrador / Público / Privado / Oculto) y herencia/override en carpetas.
- **Probar agente** solo en home admin si hay ≥1 colección con ≥1 documento.
- Card colaborador solo si hay ≥1 colección visible; primera en Agentes.
- Citas numeradas con panel del documento (completo, fragmento resaltado, autoscroll).

### Fuera de alcance (v1)

- Chat genérico Agente IA; Modo estudio IA; Chat IA de grupos.
- Catálogo Agentes salvo la card de este producto.
- PDF, Word, video; varios agentes por empresa; “Ver como” en Probar agente.
- Techos de cantidad/peso/profundidad (prototipo no los simula).
- Carga de documentos desde el chat del colaborador.
- Nombres prohibidos en UI: Notebook, RAG, vector store, “base de conocimiento” como producto.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador (ej. María Alejandra) | Editar cara; crear/editar colecciones y carpetas; subir `.txt`/`.md`; Probar agente; visibilidades | Varios agentes; tipos no texto en v1 |
| Colaborador (con colección visible) | Ver card, chatear, abrir citas | Subir documentos; ver colecciones Borrador/Oculto no aplicables |
| Colaborador sin colecciones visibles | Usa catálogo IA para HR en Agentes | Ver la card Agente de tu empresa |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Un agente por empresa | Sin selector de agente en colaborador |
| Visibilidad en colección/carpeta, no en el agente | Herencia al crear hija; se puede pisar |
| Probar agente = todas las colecciones del tenant | Incluye Borrador/Privado/Oculto; sin “Ver como” |
| Probar solo en home y con documentos | Sin botón si no hay colección con documento |
| Card colaborador condicionada | Sin colecciones visibles → no aparece la card |
| Cambio de visibilidad a mitad de chat | El hilo sigue; el siguiente mensaje ya no usa esa colección |
| App Header dos niveles | Solo página actual y padre; HeaderProduct sin breadcrumb |

## 5. Experiencia de usuario (flujos)

**Admin — entrada:** Herramientas → Agente de tu empresa.

**Camino feliz admin:** home (cara + listado) → Crear colección (drawer) → subir documentos → opcional carpetas → Probar agente (IA panel).

**Camino feliz colaborador:** Agentes → card primera → chat → clic en número de cita → panel documento.

**Empty:** home sin colecciones; colección/carpeta vacía (copy cerrado en HU).

**Error:** archivo no texto; pregunta fuera de documentos (copy cerrado).

## 6. Especificación UI

**Home admin:** cara (imagen default o personalizada), nombre, tono; listado lista/cards; CTA **Crear colección**; **Editar agente** (drawer: imagen, nombre, tono); **Probar agente** si aplica.

**Dentro de colección/carpeta:** CTA **Nuevo** (Nueva carpeta / Subir documentos); checkbox y barra masiva; drag and drop; menú tres puntos; preview documento en drawer.

**Visibilidad:** Borrador | Público (default) | Privado (personas/grupos) | Oculto.

**Chat:** historial, citas, disclaimer bajo el input; panel derecho al citar.

**Copy cerrado (ejemplos):** empty home/colección/carpeta; archivo no texto; no encontrado; disclaimer del agente.

## 7. Requisitos de calidad (producto)

- Accesibilidad: drawers, chat y citas operables por teclado; disclaimer visible.
- Idioma UI: español neutro; nombre de producto **Agente de tu empresa**.
- Privacidad: el colaborador solo consume colecciones visibles para él; Probar agente es solo admin.
- Empty / error: empties y mensajes de la HU; no inventar otros.

## 8. Criterios de aceptación

**Escenario: Camino feliz — colección pública y pregunta del colaborador**

**Dado** que el admin está en Herramientas → Agente de tu empresa
**Cuando** crea una colección pública y sube un `.txt` o `.md`
**Entonces** la colección aparece en el home
**Y** un colaborador con acceso ve la card Agente de tu empresa como primera en Agentes
**Y** puede preguntar y ver citas con panel del documento

**Escenario: Caso borde — Probar agente sin documentos**

**Dado** que no hay ninguna colección con documentos
**Cuando** el admin entra a la home del agente
**Entonces** ve Crear colección como acción principal
**Y** no ve el botón Probar agente

**Escenario: Caso borde — sin colecciones visibles**

**Dado** que el colaborador no tiene ninguna colección Pública ni Privada aplicable
**Cuando** abre Agentes
**Entonces** no ve la card Agente de tu empresa
**Y** Agentes sigue mostrando el catálogo de IA para HR

**Escenario: Error / camino negativo — pregunta fuera de documentos**

**Dado** que el colaborador chatea con el agente y tiene colecciones visibles
**Cuando** pregunta algo que no está en esos documentos
**Entonces** ve: “No encontré eso en los documentos de tu empresa. Puede que no esté en las colecciones que tienes disponibles.”
**Y** el disclaimer bajo el input permanece visible

**Escenario: Error / camino negativo — archivo no texto**

**Dado** que el admin sube documentos a una colección
**Cuando** elige un archivo que no es `.txt` ni `.md`
**Entonces** ve: “En esta versión solo se pueden subir archivos de texto.”
**Y** el archivo no queda en la colección

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 (al cerrar HU) | Cara, colecciones/carpetas, visibilidades, Probar agente, card + chat colaborador, `.txt`/`.md` | Multi-agente, PDF/Word, Ver como, upload desde chat |
| Posterior | Formatos adicionales; techos; naming “Agente {empresa}” si PM lo valida | Mezclar con Agente IA genérico |

## 10. Decisiones abiertas

1. **PENDIENTE —** Cerrar estado de HU-TRA-001 (pasa de borrador a lista) y validar copy de producto con PM.
2. **PENDIENTE —** Si el nombre visible del agente puede diferir del ítem del sidenav en comunicación externa.
3. **PENDIENTE —** Límites reales de archivos/peso cuando deje de ser solo prototipo.
4. **PENDIENTE —** Prioridad de PDF/Word post-v1.

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-TRA-001 | Agente de tu empresa | v1 (HU en borrador) |

## 12. Referencias

- [fundamentos/00-mapa.md](../../../fundamentos/00-mapa.md)
- [admin/herramientas/agente-de-tu-empresa/_flujo.md](_flujo.md)
- [admin/herramientas/agente-de-tu-empresa/HU-agente-de-tu-empresa.md](HU-agente-de-tu-empresa.md) (HU-TRA-001)
- [_indice-hus.md](../../../_indice-hus.md)
