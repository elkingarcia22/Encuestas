# HU: Tipo de navegación del contenido (creador)

## Contexto

Hoy todo contenido fuerza un recorrido lineal: el colaborador no puede saltar páginas desde el índice. Eso sirve para compliance y evaluaciones en orden, pero frena cursos de consulta, onboarding flexible o material de referencia. Dar al creador un control explícito de navegación lineal vs libre aumenta el ajuste del contenido al caso de uso y reduce fricción de consumo sin perder el cierre controlado.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** elegir en Ajustes si el contenido se navega de forma lineal o libre,
**para** decidir cuándo obligo al orden de páginas y cuándo permito explorar, sin perder el control sobre el cierre del contenido.

## Pantallas en el prototipo

Cada pantalla del flujo tiene su dirección en el playground UX (en local, `http://localhost:5173` + la dirección). Si se abre directo con el borrador vacío, carga el curso de ejemplo «Resolución efectiva de conflictos en equipos de trabajo» para seguir el flujo desde ahí.

| Pantalla | Dirección | Qué se ve |
|---|---|---|
| Ajustes · Tipo de navegación | [`/admin/aprendizaje/lms-creator/crear-contenido#ajustes-navegacion`](http://localhost:5173/admin/aprendizaje/lms-creator/crear-contenido#ajustes-navegacion) | Lineal o Libre |

## Alcance

**Incluye:**
- Nueva card «Tipo de navegación» en el hub de Ajustes de Crear contenido y Editar contenido, después de «Pesos de evaluación».
- Panel de configuración con dos opciones mutuamente excluyentes: Lineal y Libre.
- Valor por defecto: Lineal (comportamiento histórico).
- Persistencia del tipo elegido junto con el resto de ajustes del contenido (borrador o publicado).
- Resumen visible en la card del hub según la opción activa (p. ej. «Lineal» o «Libre»).

**Excluye:**
- Cambiar la lógica de consumo del colaborador (ver HU-APR-007).
- Aplicar tipo de navegación a **planes** de formación (las rutas tienen HU-LMS-014).
- Reordenar páginas automáticamente al cambiar de lineal a libre.
- Analytics de saltos de página (evento de producto aparte).

## Reglas de Negocio

- **RN-01:** El tipo de navegación admite exactamente dos valores: Lineal y Libre.
- **RN-02:** Todo contenido nuevo inicia en Lineal hasta que el creador elija otra opción.
- **RN-03:** La card «Tipo de navegación» aparece siempre en el hub de Ajustes, inmediatamente después de «Pesos de evaluación».
- **RN-04:** Solo puede estar activa una opción a la vez; al guardar/publicar prevalece la última selección confirmada en el panel.
- **RN-05:** Lineal significa que el colaborador debe avanzar las páginas en el orden del índice (sin saltar a páginas posteriores no completadas).
- **RN-06:** Libre significa que el colaborador puede abrir cualquier página de recurso desde el índice; la página de fin del contenido permanece bloqueada hasta completar el resto de páginas consumibles.
- **RN-07:** Cambiar el tipo de navegación en un contenido ya publicado aplica de inmediato al siguiente acceso de estudio (no exige republicar ni cambiar visibilidad).

## Criterios de Aceptación

**Escenario: Camino feliz — configurar navegación libre al crear**

**Dado** que Ana crea un contenido nuevo en LMS Creator
**Y** llega al paso Ajustes
**Cuando** abre la card «Tipo de navegación», elige Libre y vuelve al hub
**Entonces** la card muestra el resumen «Libre»
**Y** al publicar el contenido queda configurado con navegación libre

**Escenario: Caso borde — valor por defecto lineal**

**Dado** que Ana abre Crear contenido y llega a Ajustes sin tocar Tipo de navegación
**Cuando** revisa la card en el hub
**Entonces** el resumen muestra «Lineal»
**Y** el contenido se comporta como recorrido obligatorio en orden si lo publica así

**Escenario: Camino negativo — no puede dejar ambas opciones sin selección**

**Dado** que Ana está en el panel Tipo de navegación de un contenido
**Cuando** intenta desmarcar la opción activa sin elegir la otra
**Entonces** permanece seleccionada una de las dos opciones (Lineal o Libre)
**Y** no puede guardar un contenido sin tipo de navegación definido
