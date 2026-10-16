# HU: Agregar SCORM (Subir .zip)

## Contexto

El alta de SCORM es **solo carga de paquete .zip**. La generación con IA de diapositivas vive en **Presentación interactiva** (HU-LMS-018). El flujo legacy «SCORM con IA» (formulario título / contexto / tipos → Generar presentación) se retiró.

## Historia de Usuario

**Como** creadora de contenidos LMS,
**quiero** subir un .zip SCORM,
**para** montar el paquete en una página sin pasar por el editor studio.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Agregar SCORM | [`/admin/aprendizaje/lms-creator/agregar-recurso/scorm`](http://localhost:5173/admin/aprendizaje/lms-creator/agregar-recurso/scorm) | Subida del paquete .zip |
| Recursos · SCORM | [`/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p4`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#recursos/page/p4) | SCORM montado con «Reemplazar» |

## Alcance

**Incluye:**
- Modal **Agregar SCORM** compacto: upload `.zip` → **Cargar SCORM**.
- URL propia `/agregar-recurso/scorm`.
- Card SCORM **sin** badge IA.

**Excluye:**
- Generación con IA / editor studio (ver HU-LMS-018 Presentación interactiva).

## Reglas de Negocio

- **RN-01:** Subir .zip no consume tokens.
- **RN-02:** El modal SCORM no tiene pestañas ni badge de tokens.
- **RN-03:** En el prototipo, Cargar SCORM monta el paquete demo (`simulador-scorm.html`).

## Criterios de Aceptación

**Escenario: Subir zip**

**Dado** que Ana abre Agregar SCORM
**Cuando** sube un .zip y confirma Cargar SCORM
**Entonces** se monta el recurso SCORM demo en la página
**Y** no ve pestaña SCORM con IA ni costo de tokens
