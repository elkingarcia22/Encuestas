# HU: Navegación del Workspace administrador

## Contexto

El admin entra a varios productos (Selección, Aprendizaje, Desempeño) y a herramientas (Tareas, Avisos). Diagnóstico vive dentro de Aprendizaje. Si Empresa, Comunicaciones y Reclutamiento conviven en el mismo rail sin agrupación, se pierde el mapa mental y se mezclan configuración de tenant con el día a día. Un sidenav con **Productos** y **Herramientas**, más **Configuración** en el menú del logo de empresa, reduce clics errados y deja claro qué es producto frente a ajuste de tenant. Las empresas sombrilla necesitan cambiar de sucursal (en el prototipo: mi empresa, Alpha, Beta, Omega) sin salir del Workspace.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** un menú lateral agrupado por Productos y Herramientas, y la configuración de la empresa junto al logo del tenant,
**para** llegar al módulo correcto y cambiar de sucursal o ver cupos sin confundir catálogo/operación con datos, roles o personalización.

## Alcance

**Incluye:**
- Orden del sidenav Workspace admin: **Inicio** (fuera de grupo) → grupo **Productos** → grupo **Herramientas**.
- Productos (en este orden): **Selección** (badge **Nuevo**; Dashboard, Onboarding, Vacantes, Plantillas — sin Créditos), **Aprendizaje**, **Desempeño y cultura**. **Diagnóstico** no es producto aparte: va dentro de Aprendizaje, entre Certificados y Reportes.
- Aprendizaje admin tiene segundo y tercer nivel: **LMS Creator** (Contenidos, Categorías, Universidad corporativa, LMS AI), **Planes de Formación** (Planes, Grupos), **Certificados** (Descarga, Configuración), **Diagnóstico**, **Reportes**, **Métricas**.
- Herramientas: **Tareas** (ítem único: abre Seguimiento empresa-completa), **Avisos internos**, **Agente de tu empresa**.
- Cabecera del sidebar admin: logo de la empresa activa a la izquierda y tres puntos a la derecha (`space-between`). El clic en **toda la fila** (logo + tres puntos) abre el **menú de empresa**.
- El menú de empresa muestra primero **Licencias:** y **Créditos:** (etiqueta a la izquierda, valor a la derecha; sin logo ni nombre arriba), luego grupo **Configuración** y grupo **Empresas**. **mi empresa** usa el isotipo de la empresa en el avatar; Alpha, Beta y Omega siguen con inicial.
- Destinos de Configuración: Gestión de usuarios, Personalización, Organigrama, Datos de empresa, Roles y permisos.
- Grupo Empresas (prototipo de grupo sombrilla): **mi empresa** (tenant demo), **Alpha**, **Beta**, **Omega**. Cambiar de empresa actualiza logo y cupos. En producción aplicará a tenants con varias razones sociales.
- Sidebar colaborador: logo de la empresa (mi empresa) sin menú ni tres puntos. Orden: Inicio → **Productos** (Aprendizaje, Desempeño y cultura) → **Herramientas** (Tareas en acordeón). **Diagnóstico** va dentro de Aprendizaje, debajo de Métricas. **No** incluye Reclutamiento (Selección es solo admin). **No** incluye Agentes ni Reportes de desempeño.
- Aprendizaje colaborador, en este orden: **Modo estudio AI**, Catálogo, **Universidad corporativa**, Zona de estudio, Progreso, Métricas, Diagnóstico.
- Desempeño y cultura colaborador: Evaluaciones 360, Objetivos, Matriz de talento, Encuestas (Encuestas no es un ítem raíz del rail).
- Tareas colaborador (acordeón): Tareas, Planes, Plantillas, Seguimiento (vista líder: María Alejandra y su equipo). En admin, Tareas no es acordeón.
- Sidebar del design system (playground): logo UBITS, sin menú de empresa.
- Ya no hay selector **Configuración** ni logo de empresa en el AppHeader (el logo vive solo en el sidebar).
- Feedback en el footer del sidebar abre un modal (no es una página).

**Excluye:**
- Contenido del dashboard de Inicio (HU-INI-001).
- Pie de Workspace (HU-INI-003).
- Flujos internos de LMS Creator, planes, 360, tareas (HUs de cada módulo).
- Madurez de las pantallas placeholder (Selección, Diagnóstico, Avisos, ítems de Configuración, etc.): el menú enlaza aunque el destino esté vacío.
- Menú del colaborador / AprendizajeWorkspace (salvo el logo estático).
- Persistencia real de sucursal en backend (el prototipo usa sessionStorage).

## Reglas de Negocio

- **RN-01:** El sidenav admin muestra las etiquetas de grupo **Productos** y **Herramientas** (no «Módulos», no «Empresa» como sección del rail).
- **RN-02:** **Inicio** es el primer ítem y no pertenece a ningún grupo.
- **RN-03:** El producto se llama **Selección** (no Reclutamiento) y lleva el badge **Nuevo**. Sus ítems son Dashboard, Onboarding, Vacantes y Plantillas; **no** hay Créditos en Selección.
- **RN-04:** **Avisos internos** vive en Herramientas. No hay entrada **Comunicaciones** en el sidenav.
- **RN-05:** **Configuración** (antes Empresa) no está en el sidenav ni en el AppHeader: se abre desde el menú de empresa (clic en la fila del logo del sidebar admin). Los destinos son: Gestión de usuarios, Personalización, Organigrama, Datos de empresa, Roles y permisos.
- **RN-06:** Desempeño y cultura incluye, en este orden: Evaluaciones 360, Objetivos, Matriz de talento, **PDI** y **Encuestas**. Encuestas no es un producto aparte en el rail.
- **RN-07:** Cambiar un ítem del menú navega al destino; no abre un modal para entrar a LMS Creator.
- **RN-08:** El orden de Productos no se personaliza por usuario en este playground: Inicio → Selección → Aprendizaje → Desempeño y cultura. Herramientas: Tareas (ítem único), Avisos internos, Agente de tu empresa.
- **RN-09:** Solo el sidebar **admin** abre el menú de empresa. El colaborador ve el logo sin acción. El design system del playground conserva el logo UBITS.
- **RN-10:** El menú se abre al hacer clic en toda la fila del logo (logo + tres puntos). Con el sidebar colapsado, el logo del tenant abre el mismo menú.
- **RN-11:** Licencias y Créditos se muestran en filas (`Licencias:` / `Créditos:` a la izquierda, valor a la derecha) como `usadas/total` con formato `es-CO` (ej. `940/1.000`, `25.000/45.000`). En el prototipo son mock por empresa. No se repite logo ni nombre en la cabecera del menú.
- **RN-12:** Aprendizaje admin incluye, en este orden: LMS Creator (Contenidos, Categorías, Universidad corporativa, LMS AI), Planes de Formación (Planes, Grupos), Certificados (Descarga, Configuración), **Diagnóstico**, Reportes y **Métricas**. Diagnóstico no es un producto aparte en el rail admin.
- **RN-13:** En el sidenav colaborador, Aprendizaje incluye, en este orden: Modo estudio AI, Catálogo, Universidad corporativa, Zona de estudio, Progreso, Métricas y Diagnóstico. Diagnóstico no es un ítem aparte del rail.
- **RN-14:** En admin, **Tareas** es un ítem único de Herramientas: al hacer clic abre Seguimiento HR (empresa-completa). Lista, Planes y Plantillas no viven en el rail admin (son del colaborador). En colaborador, Tareas sí es acordeón (Tareas, Planes, Plantillas, Seguimiento vista líder: María Alejandra y su equipo).
- **RN-15:** Agentes (IA para HR) no aparece en el sidenav colaborador. Reportes de desempeño del colaborador no existe.

## Criterios de Aceptación

**Escenario: Camino feliz — llegar a LMS Creator desde Productos**

**Dado** que el admin está en Inicio del Workspace
**Cuando** abre Aprendizaje → LMS Creator → Contenidos
**Entonces** llega al listado de contenidos
**Y** en el rail ve el grupo Productos (con Selección, Aprendizaje, Desempeño y cultura) y el grupo Herramientas (Tareas, Avisos internos, Agente de tu empresa)

**Escenario: Camino feliz — abrir Configuración y cupos desde el logo**

**Dado** que el admin está en una página Workspace
**Cuando** hace clic en la fila del logo de la empresa (logo o tres puntos)
**Entonces** ve Licencias: y Créditos: del tenant activo (sin repetir logo ni nombre)
**Y** puede ir a Gestión de usuarios, Personalización, Organigrama, Datos de empresa o Roles y permisos
**Y** no ve un botón Configuración en el AppHeader

**Escenario: Camino feliz — cambiar de sucursal**

**Dado** que el menú de empresa está abierto
**Cuando** elige Alpha (o Beta u Omega)
**Entonces** el logo del sidebar pasa a esa empresa
**Y** Licencias y Créditos IA muestran los cupos de esa sucursal

**Escenario: Caso borde — Configuración no está en el rail ni en el header**

**Dado** que el admin busca datos de empresa o roles
**Cuando** recorre el sidenav y el AppHeader
**Entonces** no ve «Empresa» ni «Comunicaciones» como ítems del menú
**Y** no ve el selector Configuración en el header
**Y** abre Configuración desde el menú de la fila del logo

**Escenario: Caso borde — colaborador y design system**

**Dado** que la persona está en Workspace colaborador o en el design system
**Cuando** mira la cabecera del sidebar
**Entonces** en colaborador ve el logo de mi empresa sin menú
**Y** en design system ve el logo UBITS sin menú de empresa

**Escenario: Camino feliz — Diagnóstico bajo Aprendizaje (colaborador)**

**Dado** que la persona está en Workspace colaborador
**Cuando** abre Aprendizaje
**Entonces** ve Modo estudio AI, Catálogo, Universidad corporativa, Zona de estudio, Progreso, Métricas y Diagnóstico, en ese orden
**Y** Diagnóstico está debajo de Métricas
**Y** no ve Diagnóstico como ítem aparte del rail
**Y** no ve Agentes ni Reportes en el rail

**Escenario: Camino feliz — Diagnóstico bajo Aprendizaje (admin)**

**Dado** que el admin está en el Workspace
**Cuando** abre Aprendizaje
**Entonces** ve LMS Creator, Planes de Formación, Certificados, Diagnóstico, Reportes y Métricas, en ese orden
**Y** Diagnóstico está entre Certificados y Reportes
**Y** Métricas está debajo de Reportes
**Y** al entrar a LMS Creator ve Contenidos, Categorías, Universidad corporativa y LMS AI
**Y** al entrar a Planes de Formación ve Planes y Grupos
**Y** al entrar a Certificados ve Descarga y Configuración
**Y** no ve Diagnóstico como producto aparte en el grupo Productos

**Escenario: Camino feliz — PDI bajo Desempeño**

**Dado** que el admin está en el Workspace
**Cuando** abre Desempeño y cultura
**Entonces** ve Evaluaciones 360, Objetivos, Matriz de talento, PDI y Encuestas, en ese orden
**Y** PDI está entre Matriz de talento y Encuestas

**Escenario: Camino negativo — no llamar Reclutamiento al producto de vacantes**

**Dado** que el admin mira el grupo Productos
**Cuando** busca el módulo de vacantes y plantillas
**Entonces** ve **Selección** con badge **Nuevo**
**Y** no ve un ítem llamado Reclutamiento
**Y** no ve Créditos dentro de Selección

**Escenario: Camino feliz — Tareas admin es un ítem único**

**Dado** que el admin está en Workspace
**Cuando** hace clic en Tareas en Herramientas
**Entonces** llega a Seguimiento empresa-completa
**Y** no ve un acordeón con Tareas, Planes ni Plantillas

**Escenario: Camino feliz — Tareas colaborador sigue en acordeón**

**Dado** que María Alejandra está en Workspace colaborador
**Cuando** abre Tareas en Herramientas
**Entonces** ve Tareas, Planes, Plantillas y Seguimiento
**Y** el Seguimiento es la vista líder (ella y su equipo)
**Y** no es la vista empresa-completa de HR

**Escenario: Camino negativo — el colaborador no ve Reclutamiento en el sidenav**

**Dado** que la persona está en Workspace colaborador
**Cuando** recorre el menú lateral
**Entonces** no ve un ítem llamado Reclutamiento
