# Flujo — Inicio y chrome admin

## Objetivo

Dar al administrador HR un punto de entrada (dashboard) y un mapa de navegación estable: Productos vs Herramientas en el sidenav, Configuración y sucursales en el menú del logo de empresa, pie legal al final del Workspace.

## Actores

- Administrador de recursos humanos

## Chrome del Workspace (HU-INI-002)

1. **Sidenav:** Inicio → **Productos** (Selección [Nuevo], Aprendizaje, Desempeño y cultura) → **Herramientas** (Tareas, Avisos internos, Agente de tu empresa). Aprendizaje incluye Diagnóstico, Reportes y Métricas. **Tareas** es un ítem único: abre Seguimiento HR (empresa-completa). Lista, Planes y Plantillas no están en el rail admin.
2. **Menú de empresa** (clic en toda la fila del logo del sidebar admin): filas **Licencias:** y **Créditos:**, luego **Configuración** (Gestión de usuarios, Personalización, Organigrama, Datos de empresa, Roles y permisos) y **Empresas** (mi empresa con isotipo; Alpha, Beta y Omega con inicial). Ya no hay Empresa ni Comunicaciones en el rail, ni Configuración en el AppHeader.
3. LMS Creator se abre por href directo (Contenidos, etc.), sin modal de entrada.
4. **Pie de Workspace** (HU-INI-003): legales al final del main; no sticky; oculto en Agente IA.

## Capas del dashboard (HU-INI-001)

1. **Saludo** — fecha + Buenos días/tardes/noches + nombre.
2. **Top métricas** — periodo Últimos 7 días / Últimos 30 días.
3. **Necesita tu atención** — lista con conteo.
4. **Accesos rápidos** — solo módulos existentes.

## HUs

`HU-INI-001` (dashboard), `HU-INI-002` (navegación Workspace) y `HU-INI-003` (pie Workspace) en el índice.
