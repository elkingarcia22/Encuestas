# HU: Home y consumo de ruta de aprendizaje (colaborador)

## Contexto

El colaborador necesita una portada de ruta análoga a la de contenido: ver de qué va la ruta, cuánto dura (suma de contenidos), aliados y expertos agregados, y la lista de contenidos. El tipo de navegación (Lineal/Libre) define cómo se desbloquean esos contenidos al comenzar y avanzar.

## Historia de Usuario

**Como** colaborador de mi empresa,
**quiero** abrir la home de una ruta, comenzar o continuar el recorrido y abrir cada contenido según el tipo de navegación,
**para** completar la ruta en orden o explorando, sin confundirme con un contenido suelto.

## Alcance

**Incluye:**
- Home de ruta (misma estructura que portada de contenido): hero/meta a la izquierda; specs + CTA + lista de contenidos a la derecha.
- Lista «Contenidos que conforman esta ruta» con **cards compact**.
- Duración = suma de duraciones de los contenidos hijos.
- Aliados y expertos = unión de los de los contenidos que integran la ruta.
- Estados de portada: por iniciar, en progreso, finalizado.
- Variantes Lineal y Libre.
- CTA Comenzar / Continuar / Ver más contenidos (+ certificado si aplica).
- Progreso de ruta = contenidos finalizados / total (sin mirar el % interno de cada contenido).

**Excluye:**
- Configuración en Creator (HU-LMS-014).
- Páginas internas de cada contenido (Experiencia de estudio de contenido).
- Planes de formación.

## Reglas de Negocio

- **RN-01:** Antes de pulsar **Comenzar ahora**, todos los cards de contenido están deshabilitados (transparencia), tanto en Lineal como en Libre.
- **RN-02:** Al pulsar **Comenzar ahora**, la colaboradora **permanece en la home** de la ruta: el CTA pasa a **Continuar** y se desbloquean los cards según el tipo de navegación. No se abre ningún contenido todavía.
- **RN-03:** En Lineal, al comenzar solo se habilita el **primer** contenido; el siguiente se habilita cuando el anterior está finalizado.
- **RN-04:** En Libre, al comenzar se habilitan **todos** los contenidos de la ruta.
- **RN-05:** Clic en un contenido habilitado abre la home (experiencia de estudio) de ese contenido.
- **RN-06:** **Continuar** en la home de ruta abre el siguiente contenido después del último finalizado; si aún no finalizó ninguno, abre el primero. Igual en Lineal y Libre.
- **RN-07:** El progreso mostrado es `contenidos finalizados / total` (ej. 2 de 5 = 40%).
- **RN-08:** En finalizado, CTA primario **Ver más contenidos** y, si hay certificado, **Descargar certificado**; progreso 100%.
- **RN-09:** Copy de la lista: «Contenidos que conforman esta ruta».

## Criterios de Aceptación

**Escenario: Por iniciar — cards bloqueados**

**Dado** que María abre una ruta sin haber comenzado
**Cuando** ve la home
**Entonces** el CTA es **Comenzar ahora**
**Y** todos los cards de la lista están deshabilitados con transparencia

**Escenario: Lineal — comienza y solo el primero**

**Dado** que la ruta es Lineal y está por iniciar
**Cuando** María pulsa **Comenzar ahora**
**Entonces** permanece en la home de la ruta
**Y** el CTA pasa a **Continuar**
**Y** solo el primer contenido queda habilitado
**Y** los demás siguen deshabilitados

**Escenario: Libre — comienza y todos habilitados**

**Dado** que la ruta es Libre y está por iniciar
**Cuando** María pulsa **Comenzar ahora**
**Entonces** permanece en la home de la ruta
**Y** el CTA pasa a **Continuar**
**Y** todos los contenidos de la lista quedan habilitados

**Escenario: Continuar sin haber finalizado nada**

**Dado** que María ya pulsó **Comenzar ahora** y no ha finalizado ningún contenido
**Cuando** pulsa **Continuar**
**Entonces** se abre la experiencia de estudio del primer contenido

**Escenario: Continuar tras finalizar el primero**

**Dado** que María finalizó el primer contenido de la ruta y vuelve a la home
**Cuando** pulsa **Continuar**
**Entonces** se abre la experiencia de estudio del segundo contenido
**Y** en Lineal ese segundo contenido ya está habilitado en la lista

**Escenario: Finalizado**

**Dado** que María finalizó todos los contenidos de la ruta
**Cuando** ve la home
**Entonces** el progreso es 100%
**Y** ve **Ver más contenidos**
**Y** si la ruta tiene certificado, ve **Descargar certificado**

**Escenario: Progreso parcial**

**Dado** que la ruta tiene 5 contenidos y María finalizó 2
**Cuando** ve la home en progreso
**Entonces** el progreso mostrado es 40%
