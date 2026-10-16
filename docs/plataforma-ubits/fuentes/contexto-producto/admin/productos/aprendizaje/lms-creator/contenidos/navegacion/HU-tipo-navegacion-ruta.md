# HU: Tipo de navegación de la ruta (creador)

## Contexto

Las rutas agrupan contenidos en un orden. Sin un control Lineal/Libre, el creador no puede decidir si el colaborador debe recorrer esos contenidos en secuencia o explorarlos en cualquier orden. El mismo patrón de Ajustes que ya existe en contenidos debe aplicarse a rutas.

## Historia de Usuario

**Como** creador de contenidos LMS,
**quiero** elegir en Ajustes de la ruta si la navegación entre contenidos es lineal o libre,
**para** obligar un orden formativo o permitir explorar los contenidos de la ruta sin secuencia forzada.

## Alcance

**Incluye:**
- Paso **Ajustes** en Crear ruta (y el equivalente al publicar/guardar), con dos conjuntos, cada uno en su marco —como en Crear contenido, no un hub de tarjetas—:
  - Visibilidad
  - Tipo de navegación
- Panel Tipo de navegación con opciones mutuamente excluyentes: Lineal y Libre.
- Default: Lineal.
- Persistencia del tipo junto con la ruta (borrador o publicada).

**Excluye:**
- Pesos de evaluación (no aplican a ruta).
- Impacto en el progreso (fuera de este flujo de creación).
- Comportamiento del colaborador en la home de ruta (ver HU-APR-008).
- Navegación libre/lineal **dentro** de cada contenido hijo (sigue siendo HU-LMS-011 / HU-APR-007).

## Reglas de Negocio

- **RN-01:** El tipo de navegación de la ruta admite exactamente dos valores: Lineal y Libre.
- **RN-02:** Toda ruta nueva inicia en Lineal.
- **RN-03:** El paso Ajustes de Crear ruta muestra Visibilidad y Tipo de navegación (sin pesos).
- **RN-04:** Solo puede estar activa una opción a la vez.
- **RN-05:** Lineal: el colaborador desbloquea los contenidos de la ruta en el orden definido.
- **RN-06:** Libre: tras comenzar la ruta, el colaborador puede abrir cualquier contenido de la lista en cualquier orden.
- **RN-07:** El tipo de navegación de la ruta no cambia el tipo de navegación interno de cada contenido hijo.
- **RN-08:** Los textos del paso hablan de **contenidos**, no de páginas: dentro de una ruta lo que se desbloquea en orden son los contenidos. En pantalla, Lineal dice «Los colaboradores deben completar los contenidos **en el orden que definiste**. Cada uno se desbloquea al terminar el anterior» y Libre dice «Los colaboradores pueden abrir **cualquier contenido** de la ruta, en el orden que quieran».

## Criterios de Aceptación

**Escenario: Camino feliz — configurar libre al crear ruta**

**Dado** que Ana crea una ruta y llega a Ajustes
**Cuando** abre Tipo de navegación, elige Libre y vuelve al hub
**Entonces** la card muestra el resumen «Libre»
**Y** al publicar la ruta queda con navegación libre entre contenidos

**Escenario: Default lineal**

**Dado** que Ana llega a Ajustes sin tocar Tipo de navegación
**Cuando** revisa la card
**Entonces** el resumen muestra «Lineal»

**Escenario: Hub sin pesos**

**Dado** que Ana está en Ajustes de Crear ruta
**Cuando** ve el hub
**Entonces** ve Visibilidad y Tipo de navegación
**Y** no ve Pesos de evaluación
