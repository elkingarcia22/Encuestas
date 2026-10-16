# HU: Consumo con navegación lineal o libre

## Contexto

El creador puede configurar Lineal o Libre en Ajustes. En el colaborador, el índice de la experiencia de estudio debe respetar esa regla: lineal obliga el orden; libre permite saltar páginas de recurso, manteniendo el fin del contenido bloqueado hasta completar el resto. Sin esto, la configuración del creador no tiene efecto observable y genera soporte confuso (“¿por qué no puedo abrir la página 3?”).

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** recorrer un contenido según el tipo de navegación que configuró el creador,
**para** completar mi formación sin bloqueos innecesarios cuando el contenido permite exploración, y sin saltarme el cierre controlado.

## Alcance

**Incluye:**
- Comportamiento del índice y del avance en Experiencia de estudio según tipo Lineal o Libre del contenido.
- Lineal: no se puede abrir desde el índice una página posterior no completada; el avance sigue el orden.
- Libre: se puede abrir cualquier página de recurso desde el índice (completada o no).
- En Libre, la página «Fin del contenido» permanece bloqueada hasta que el colaborador haya completado todas las demás páginas consumibles.
- Al completar el resto en Libre, «Fin del contenido» se habilita y se puede abrir desde el índice o al avanzar.

**Excluye:**
- Configuración del tipo en LMS Creator (ver HU-LMS-011).
- Cambiar reglas de aprobación de evaluaciones, intentos o tiempo límite.
- Navegación libre/lineal **entre contenidos** de una ruta (ver HU-APR-008 / HU-LMS-014).
- Recordar la última página visitada fuera del comportamiento ya existente de portada en progreso.

## Reglas de Negocio

- **RN-01:** Si el contenido es Lineal, una página no completada que esté después de la posición actual no es abrible desde el índice.
- **RN-02:** Si el contenido es Lineal, las páginas ya completadas sí se pueden reabrir desde el índice.
- **RN-03:** Si el contenido es Libre, cualquier página cuyo tipo no sea «fin del contenido» es abrible desde el índice, incluso sin haber completado las anteriores.
- **RN-04:** Si el contenido es Libre, «Fin del contenido» solo se habilita cuando el 100% de las páginas consumibles (todas excepto fin) están completadas.
- **RN-05:** Completar o visitar una página en Libre no obliga a visitar las páginas intermedias que el colaborador haya saltado; esas páginas siguen pendientes hasta abrirlas o completarlas.
- **RN-06:** En Libre, abrir una página de recurso que no sea evaluación la marca como completada. Saltar directamente a la página 3 no marca como completadas la 1 ni la 2.
- **RN-07:** Las evaluaciones en Libre solo se marcan completadas al aprobarlas (igual que en Lineal).
- **RN-08:** En Libre, intentar abrir «Fin del contenido» antes de completar el resto no cambia de vista ni marca el curso como finalizado.
- **RN-09:** Si el colaborador está en la última página consumible y pulsa Continuar sin haber completado todas las páginas, no avanza al cierre, no marca páginas no visitadas como completadas, y ve el aviso «Aún no has completado todas las páginas de este contenido.» (el botón Continuar permanece habilitado).

## Criterios de Aceptación

**Escenario: Camino feliz — saltar páginas con navegación libre**

**Dado** que María abre el contenido «Prevención del acoso laboral» (publicado en U. Corporativa) con tipo de navegación Libre
**Y** está en la página 1 sin haber completado la 2
**Cuando** en el índice hace clic en la página 3
**Entonces** ve el recurso de la página 3
**Y** las páginas 1 y 2 siguen sin marcarse como completadas

**Escenario: Caso borde — fin bloqueado hasta completar el resto**

**Dado** que María estudia un contenido con navegación Libre
**Y** ha completado todas las páginas excepto la de fin y una página intermedia
**Cuando** intenta abrir «Fin del contenido» desde el índice
**Entonces** la página de fin permanece bloqueada
**Y** no accede a la vista de cierre ni al certificado

**Escenario: Camino negativo — Continuar en la última página con páginas pendientes**

**Dado** que María está en la última página consumible (Evaluación Sección 2) con navegación Libre
**Y** aprobó esa evaluación
**Y** aún tiene páginas anteriores sin completar
**Cuando** pulsa Continuar
**Entonces** permanece en la experiencia sin ir al cierre
**Y** las páginas que no visitó siguen sin completarse
**Y** ve el aviso «Aún no has completado todas las páginas de este contenido.»

**Escenario: Camino negativo — lineal impide saltar adelante**

**Dado** que María abre un contenido con tipo de navegación Lineal
**Y** está en la página 1 sin haberla completado del todo o sin haber avanzado
**Cuando** intenta abrir la página 3 desde el índice
**Entonces** la página 3 no es abrible (permanece bloqueada)
**Y** debe avanzar en orden hasta desbloquearla
