# HU: Ocultar evaluación y pesos en Ajustes

## Contexto

En un contenido publicado, ocultar una página de evaluación no es lo mismo que ocultar un video o un PDF: esa evaluación deja de contar en la nota final. El creador necesita ver el impacto en **Pesos de evaluación** (tag Oculta · fecha y peso 0%) y confirmar el recálculo equitativo antes de ocultarla.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** ver las evaluaciones ocultas en Ajustes → Pesos y confirmar al ocultar una evaluación que su peso se redistribuye,
**para** no dejar la nota final con pesos desalineados ni sorpresas al publicar.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Ajustes · Pesos de evaluación | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-pesos`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-pesos) | Evaluación oculta en 0 % con su etiqueta «Oculta · fecha» |

## Alcance

**Incluye:**
- Seed demo con al menos una evaluación ya oculta (peso 0% + tag **Oculta · fecha**).
- Panel `#ajustes-pesos`: lista todas las evaluaciones (visibles y ocultas); ocultas en 0% y no editables; el total 100% solo suma las visibles.
- En Recursos (edición publicada), al elegir **Ocultar** en una página de tipo evaluación: modal de advertencia con URL propia `#recursos/ocultar-evaluacion/{pageId}` (también `#recursos/ocultar-evaluacion` para diseño).
- Acciones del modal: **Cancelar** / **Confirmar ocultación**.
- Tras confirmar: la evaluación queda oculta, peso 0%, y el 100% se reparte equitativamente entre las evaluaciones que siguen visibles.

**Excluye:**
- Modal de impacto T5 al entrar a Recursos (HU-LMS-002).
- Ocultar páginas que no son evaluación (siguen sin este modal).
- Recálculo de notas históricas de estudiantes en backend (playground = demo).

## Reglas de Negocio

- **RN-01:** Una evaluación oculta aparece en Pesos con tag **Oculta · DD mmm AAAA** y peso fijo **0%** (campo deshabilitado).
- **RN-02:** Solo las evaluaciones **visibles** suman al total de 100% y se pueden editar (si hay 2 o más visibles).
- **RN-03:** Con una sola evaluación visible, su peso es automáticamente 100%; las ocultas siguen en 0%.
- **RN-04:** Al ocultar una evaluación desde Recursos se abre el modal de advertencia (no se oculta al instante). Ocultar otras páginas no usa este modal.
- **RN-05:** El modal vive en la URL `#recursos/ocultar-evaluacion` o `#recursos/ocultar-evaluacion/{idDePagina}`. Cancelar cierra el modal y vuelve a Recursos sin cambiar pesos. Confirmar ocultación aplica ocultar + redistribuye.
- **RN-06:** Al mostrar de nuevo una evaluación oculta, vuelve a entrar al set visible y los pesos se redistribuyen equitativamente entre las visibles.

## Criterios de Aceptación

**Escenario: Camino feliz — ver evaluación oculta en Pesos**

**Dado** que el contenido demo tiene una evaluación oculta y dos visibles
**Cuando** Ana abre `#ajustes-pesos`
**Entonces** ve la oculta con tag Oculta · fecha y peso 0%
**Y** las dos visibles suman 100% (50% / 50% o el reparto equitativo vigente)

**Escenario: Camino feliz — ocultar evaluación con modal**

**Dado** que Ana está en Recursos de un contenido publicado
**Y** hay al menos dos evaluaciones visibles
**Cuando** oculta una evaluación desde el menú ⋮
**Entonces** la URL pasa a `#recursos/ocultar-evaluacion/{id}`
**Y** ve el modal con Cancelar y Confirmar ocultación
**Cuando** confirma
**Entonces** esa evaluación queda oculta con peso 0%
**Y** la(s) evaluación(es) visible(s) restante(s) reciben el 100% repartido equitativamente

**Escenario: Caso borde — cancelar el modal**

**Dado** que el modal de ocultar evaluación está abierto
**Cuando** Ana elige Cancelar
**Entonces** la evaluación sigue visible
**Y** los pesos no cambian
**Y** vuelve a Recursos sin el hash del modal

**Escenario: Camino negativo — ocultar un video**

**Dado** que Ana oculta una página que no es evaluación
**Cuando** confirma la acción de ocultar (sin este modal)
**Entonces** no se abre el modal de recálculo de pesos
