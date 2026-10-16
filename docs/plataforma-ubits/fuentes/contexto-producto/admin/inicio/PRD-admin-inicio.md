# PRD · Admin Inicio y chrome del Workspace

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Lista |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Inicio + chrome Workspace (sidenav, menú de empresa, pie) |

## 1. Resumen

Este PRD define el punto de entrada del administrador HR (dashboard de Inicio) y el chrome estable del Workspace: mapa de navegación Productos / Herramientas, menú de empresa (cupos, Configuración, cambio de sucursal) y pie legal al final del contenido. En v1 el admin prioriza el día desde métricas e ítems de atención, llega al módulo correcto sin confundir operación con configuración de tenant, y consulta legales sin que un pie fijo tape la tarea.

## 2. Problema y objetivo

Sin un home con señales claras y un rail agrupado, el admin mezcla producto del día a día con ajustes de empresa, pierde tiempo buscando módulos y llega a destinos aún no maduros sin contexto. El pie sticky tapa métricas y tablas.

Objetivos medibles (playground / discovery):

- Reducir el tiempo desde login hasta la primera acción en un módulo maduro (métrica PENDIENTE de instrumentar).
- Que el 100 % de las pantallas Workspace muestren el pie al final del main (excepto Agente IA).
- Que Configuración y cambio de sucursal solo se descubran desde el menú del logo, no desde el rail ni el header.

### Fuera de alcance (v1)

- Exactitud de métricas de producción (valores ilustrativos).
- Madurez de pantallas placeholder enlazadas desde Quick actions, atención o el rail (Selección, Diagnóstico, Avisos, ítems de Configuración, etc.).
- Home del colaborador.
- Flujos internos de LMS Creator, planes, 360, tareas.
- Destinos reales de enlaces legales (prototipo puede ser ancla vacía).
- Layout Inmersivo (tiene su propio footer de flujo).

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador HR | Ver dashboard Inicio; navegar Productos y Herramientas; abrir menú de empresa (Licencias, Créditos, Configuración, Empresas); cambiar sucursal demo; ver pie legal | Personalizar el orden del rail; ver Configuración en AppHeader; abrir menú de empresa en cara colaborador |
| Colaborador (chrome relacionado) | Ver logo de empresa sin menú; rail Productos / Herramientas propio; pie Workspace | Ver Selección / Reclutamiento; menú de empresa; Agentes en el rail |
| Visitante design system (playground) | Ver logo UBITS y pie Workspace | Menú de empresa / cupos de tenant |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Producto de vacantes se llama **Selección** (no Reclutamiento) y lleva badge **Nuevo** | Copy y rail deben usar ese nombre; sin ítem Créditos dentro de Selección |
| Configuración es ajuste de tenant, no operación diaria | Sale del rail y del AppHeader; vive en el menú de la fila del logo |
| Diagnóstico no es producto aparte | En admin va bajo Aprendizaje (entre Certificados y Reportes); en colaborador bajo Aprendizaje (debajo de Métricas) |
| Tareas admin ≠ colaborador | Admin: ítem único → Seguimiento empresa-completa. Colaborador: acordeón (Tareas, Planes, Plantillas, Seguimiento líder) |
| Pie sticky tapa contenido | Pie al final del main, con el scroll; oculto en Agente IA |
| Enlaces a módulos inmaduros existen a propósito | El destino puede estar vacío; no se promete paridad con LMS Creator o 360 |

## 5. Experiencia de usuario (flujos)

**Entrada:** el admin abre Inicio del Workspace.

**Camino feliz — dashboard:** ve saludo contextual (Buenos días / Buenas tardes / Buenas noches + nombre), Top métricas con periodo Últimos 7 días / Últimos 30 días, bloque Necesita tu atención con conteo y CTAs, y Quick actions con filas hacia módulos.

**Camino feliz — navegación:** desde Inicio abre Productos → Aprendizaje → LMS Creator → Contenidos (u otro destino); el rail muestra Productos (Selección, Aprendizaje, Desempeño y cultura) y Herramientas (Tareas, Avisos internos, Agente de tu empresa). Clic en Tareas abre Seguimiento HR sin acordeón.

**Camino feliz — menú de empresa:** clic en toda la fila del logo (logo o tres puntos) → Licencias: y Créditos: del tenant → Configuración (Gestión de usuarios, Personalización, Organigrama, Datos de empresa, Roles y permisos) → Empresas (mi empresa, Alpha, Beta, Omega). Cambiar sucursal actualiza logo y cupos.

**Empty / borde:** sin resultados no aplica al dashboard; en Agente IA el pie no aparece. Sidebar colaborador: logo sin menú. Design system: logo UBITS sin menú.

**Error / negativo:** el admin busca «Empresa» o «Comunicaciones» en el rail o Configuración en el header → no las encuentra; debe usar el menú del logo. Un Quick action a módulo inmaduro llega a pantalla incompleta sin asumir flujo maduro.

## 6. Especificación UI

**Inicio (dashboard)**

- Saludo + fecha + nombre.
- Top métricas: selector de periodo solo «Últimos 7 días» / «Últimos 30 días»; valores ya formateados (porcentajes, ratios, miles con separador local).
- Necesita tu atención: lista con conteo.
- Título de acciones rápidas en pantalla: **Quick actions** (inglés, decisión de producto documentada).
- Accesos solo a módulos existentes en el mapa (maduros o placeholder).

**Sidenav admin (orden fijo)**

- Inicio (fuera de grupo) → Productos → Herramientas.
- Productos: Selección (Nuevo; Dashboard, Onboarding, Vacantes, Plantillas) → Aprendizaje (LMS Creator: Contenidos, Categorías, Universidad corporativa, LMS AI; Planes de Formación: Planes, Grupos; Certificados: Descarga, Configuración; Diagnóstico; Reportes; Métricas) → Desempeño y cultura (Evaluaciones 360, Objetivos, Matriz de talento, PDI, Encuestas).
- Herramientas: Tareas (único) → Avisos internos → Agente de tu empresa.
- LMS Creator se abre por navegación directa (sin modal de entrada).

**Menú de empresa**

- Filas `Licencias:` / `Créditos:` como usadas/total con formato es-CO (ej. `940/1.000`).
- Sin repetir logo ni nombre en cabecera del menú.
- mi empresa con isotipo; Alpha, Beta, Omega con inicial.

**Pie Workspace**

- Wordmark UBITS; enlaces exactos: `Términos y condiciones de uso de la plataforma` y `Política de privacidad`.
- No sticky / fixed.

## 7. Requisitos de calidad (producto)

- Accesibilidad: el menú de empresa se abre desde toda la fila del logo (incl. sidebar colapsado); Feedback del footer del sidebar abre modal, no página.
- Idioma UI: español neutro en labels del rail y legales; excepción documentada: título «Quick actions».
- Privacidad (desde el usuario): legales visibles al final del contenido Workspace; no forzar overlay.
- Empty / error: destinos placeholder no deben aparentar el mismo nivel de madurez que LMS Creator o 360; empty de búsqueda en otros módulos sigue el patrón de producto («No se encontraron resultados»).

## 8. Criterios de aceptación

**Escenario: Camino feliz — entrar al home admin**

**Dado** que el admin abre Inicio
**Cuando** carga el dashboard
**Entonces** ve el saludo con su nombre, Top métricas y Necesita tu atención
**Y** puede cambiar el periodo entre Últimos 7 días y Últimos 30 días
**Y** ve la sección Quick actions con filas de acción

**Escenario: Camino feliz — llegar a LMS Creator desde Productos**

**Dado** que el admin está en Inicio del Workspace
**Cuando** abre Aprendizaje → LMS Creator → Contenidos
**Entonces** llega al listado de contenidos
**Y** en el rail ve Productos (Selección, Aprendizaje, Desempeño y cultura) y Herramientas (Tareas, Avisos internos, Agente de tu empresa)

**Escenario: Camino feliz — Configuración y cupos desde el logo**

**Dado** que el admin está en una página Workspace
**Cuando** hace clic en la fila del logo de la empresa
**Entonces** ve Licencias: y Créditos: del tenant activo
**Y** puede ir a los destinos de Configuración
**Y** no ve un botón Configuración en el AppHeader

**Escenario: Caso borde — pie al final y oculto en Agente IA**

**Dado** que el admin está en Inicio
**Cuando** llega al final del contenido
**Entonces** ve el wordmark UBITS y los dos enlaces legales
**Y** el pie no cubre métricas ni acciones mientras hace scroll
**Cuando** cambia el sidebar a Agente IA
**Entonces** el pie de Workspace no se muestra

**Escenario: Camino negativo — no llamar Reclutamiento ni pegar el pie**

**Dado** que el admin mira Productos y hace scroll en una página Workspace
**Cuando** busca vacantes y legales
**Entonces** ve Selección con badge Nuevo (sin Reclutamiento ni Créditos en Selección)
**Y** el pie no permanece fijo sobre el contenido

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 | Dashboard Inicio (HU-INI-001); sidenav + menú empresa + contraste colaborador/DS (HU-INI-002); pie Workspace (HU-INI-003) | Madurez de placeholders; métricas reales de producción; sticky footer |
| Posterior | Instrumentación del tiempo a primera acción; destinos legales reales; madurez de módulos enlazados | Redefinir el mapa Productos/Herramientas sin decisión de producto |

## 10. Decisiones abiertas

1. **PENDIENTE —** Definir la métrica operativa de «tiempo medio desde login hasta primera acción en módulo maduro» (umbral y cómo se mide fuera del playground).
2. **PENDIENTE —** Cuándo (y si) los Quick actions / atención dejan de enlazar pantallas vacías vs. ocultarlos hasta madurez.
3. **PENDIENTE —** Si el título «Quick actions» se localiza a español neutro en un release futuro o se mantiene en inglés a propósito.
4. **PENDIENTE —** Alcance de producción del cambio de sucursal (solo tenants multi-razón social) vs. el prototipo mi empresa / Alpha / Beta / Omega.

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-INI-001 | Dashboard de inicio del administrador | v1 |
| HU-INI-002 | Navegación del Workspace administrador | v1 |
| HU-INI-003 | Pie del Workspace | v1 |

## 12. Referencias

- [fundamentos/00-mapa.md](../../fundamentos/00-mapa.md)
- [admin/inicio/_flujo.md](_flujo.md)
- [admin/inicio/HU-dashboard-admin.md](HU-dashboard-admin.md)
- [admin/inicio/HU-navegacion-workspace.md](HU-navegacion-workspace.md)
- [admin/inicio/HU-workspace-footer.md](HU-workspace-footer.md)
- [_indice-hus.md](../../_indice-hus.md) — sección Admin — Inicio
