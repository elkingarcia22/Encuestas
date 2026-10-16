# Contexto de producto UBITS

Mapa funcional del **producto UBITS** (personas, vocabulario, flujos e Historias de Usuario) para que los agentes de Cursor razonen sobre el *qué* y el *porqué* del producto.

**No es** documentación del playground (librería, tokens, reglas de maquetación). Eso vive en `AGENTS.md` y `CLAUDE.md` de este repo.

## Cómo usarlo (agentes)

1. Leer [`fundamentos/00-mapa.md`](fundamentos/00-mapa.md).
2. Si el cambio es un feature grande: PRD en la carpeta del módulo (`PRD-*.md`, skill `writer-prd`).
3. Abrir el `_flujo.md` del módulo que toca la tarea (misma rama que el sidenav).
4. Leer las `HU-*.md` relevantes (formato `writer-us-new`).
5. Maquetar o criticar la pantalla en este playground, siguiendo las reglas de `AGENTS.md`.
6. **Al terminar un cambio que amerite producto** (flujo, regla, menú, naming): actualizar o crear la `HU-*.md`, `_indice-hus.md`, y si aplica `fundamentos/00-mapa.md` / `fundamentos/01-vocabulario.md` / `_flujo.md` / PRD. No dejar el prototipo solo en código.

## Estructura

Las carpetas **copian el sidenav** (Inicio → Productos → Herramientas, y las hojas de cada acordeón). Si un flujo **no está en el rail** (experiencia de estudio, IA para HR, errores de sistema, Recursos/Resultados de un contenido), tiene carpeta propia.

```
contexto-producto/
├── README.md
├── _indice-hus.md
├── _plantilla-hu.md
├── _plantilla-prd.md
├── prd/                          # solo índice → los PRDs viven en cada módulo
├── fundamentos/                  # mapa, vocabulario, personas (no es un ítem del rail)
├── admin/
│   ├── inicio/
│   ├── configuracion/            # menú del logo (no sidenav)
│   ├── productos/
│   │   ├── seleccion/            # Dashboard, Onboarding, Vacantes, Plantillas
│   │   ├── aprendizaje/
│   │   │   ├── lms-creator/      # Contenidos (+ recursos/resultados/navegación), Categorías, U. corporativa, LMS AI
│   │   │   ├── planes-de-formacion/   # Planes, Grupos
│   │   │   ├── certificados/          # Descarga, Configuración
│   │   │   ├── diagnostico/
│   │   │   ├── reportes/
│   │   │   └── metricas/
│   │   └── desempeno-y-cultura/  # 360, Objetivos, Matriz, PDI, Encuestas
│   └── herramientas/
│       ├── tareas/               # ítem único → Seguimiento HR
│       ├── avisos-internos/
│       └── agente-de-tu-empresa/
├── colaborador/
│   ├── inicio/
│   ├── productos/
│   │   ├── aprendizaje/          # Modo estudio AI, Catálogo, U. corporativa, Zona, Progreso, Métricas, Diagnóstico
│   │   │   └── experiencia-estudio/   # fuera del sidebar
│   │   └── desempeno-y-cultura/
│   ├── herramientas/tareas/      # Tareas, Planes, Plantillas, Seguimiento
│   └── ia-para-hr/               # fuera del sidebar
└── transversal/
    └── errores-sistema/          # fuera del sidebar
```

Si una carpeta solo tiene `_pendiente.md`, el ítem del sidenav existe pero **aún no hay HU**. No inventar producto ahí.

| Archivo / carpeta | Rol |
|-------------------|-----|
| `fundamentos/00-mapa.md` | Mapa de producto y módulos |
| `fundamentos/01-vocabulario.md` | Naming fijo de UI |
| `fundamentos/02-personas-y-roles.md` | Personas y roles |
| `_plantilla-hu.md` | Plantilla vacía writer-us-new |
| `_plantilla-prd.md` | Plantilla vacía writer-prd |
| `prd/README.md` | Índice de PRDs (archivos viven en cada módulo) |
| `_indice-hus.md` | Inventario de HUs y estado |
| `admin/`, `colaborador/` | Flujos alineados al sidenav de cada mundo |
| `transversal/` | Flujos que no cuelgan de un ítem del rail |

## Convenciones

- Un archivo = una HU (`HU-slug.md`) o un overview (`_flujo.md`).
- `_pendiente.md` = el ítem del sidenav ya tiene carpeta, pero no hay HU. No rellenar hasta que se pida.
- IDs en el índice: `HU-LMS-001`, `HU-APR-001`, etc.
- En las HUs: español, Gherkin con **Dado / Cuando / Entonces**, sin código, sin stack, sin CSS.
- Al citar otra HU: hipervínculo relativo al `.md`.

## Ubicación

Esta carpeta vive en **`docs/plataforma-ubits/fuentes/contexto-producto/`** y se versiona con este repo.
