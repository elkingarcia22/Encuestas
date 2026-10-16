# HU: Evaluador roleplay con IA (MLP)

## Contexto

Con el Evaluador roleplay en su versión inicial ([HU-LMS-023](HU-roleplay-mvp.md)), Ana debe redactar a mano la personalidad del evaluador, el escenario y entre 3 y 5 objetivos de aprendizaje. Esa redacción es la parte difícil del recurso: define la calidad de la evaluación y es donde se traba quien no ha escrito prompts antes.

Esta HU cubre la versión **asistida por IA**: Ana describe la situación en una frase y el agente propone el roleplay completo, que ella revisa y ajusta. Corregir una propuesta es mucho más barato que escribirla desde cero.

> **Estado: fusionada el 5-oct-2026.** Ya no es un recurso aparte. De aquí se tomó **el setup** —la idea en una frase, el modo, la duración y la voz, y la salida para llenarlo a mano—, que ahora es el modal con el que empieza el único Evaluador roleplay; lo que sigue después es el paso a paso del otro. El recurso vivo se describe en [HU-LMS-023](HU-roleplay-mvp.md); esta queda por las decisiones de redacción y de generación, que siguen valiendo.
>
> Lo que **no** pasó a la versión fusionada: el formulario único a dos columnas para refinar la propuesta, y regenerar describiendo qué ajustar.

## Historia de Usuario

**Como** creadora de contenidos LMS,
**quiero** describir en una frase qué quiero que mi equipo practique y recibir el roleplay completo ya redactado,
**para** publicar una evaluación conversacional de calidad sin saber redactar el comportamiento de un agente.

## Alcance

**Incluye:**
- Tipo de recurso **Evaluador roleplay (MLP)** en Resources card, Añadir página y ResourcesBlock.
- Modal fullscreen con ruta propia: la pantalla correspondiente.
- Paso de arranque: idea del roleplay + modo + duración + voz del personaje.
- Generación con IA de escenario, personaje, personalidad, mensaje de bienvenida, papel del estudiante y objetivos.
- Formulario único a dos columnas para revisar y ajustar la propuesta.
- Regenerar la propuesta describiendo qué ajustar.
- Salida alternativa para quien prefiera llenar el formulario a mano.

**Excluye:**
- Los mismos campos, reglas y validaciones del recurso, que ya define [HU-LMS-023](HU-roleplay-mvp.md). Esta HU solo agrega la asistencia de IA y cambia la forma del formulario.
- Experiencia del colaborador durante la llamada.
- Entrenamiento o ajuste fino del modelo generador.

## Reglas de Negocio

> Todas las reglas de [HU-LMS-023](HU-roleplay-mvp.md) siguen vigentes: mismos campos obligatorios, mismos topes de caracteres, mismo rango de 3 a 5 objetivos, mismo costo de 150 créditos por intento exitoso y misma no retroactividad al editar. Aquí solo se listan las reglas **propias de la asistencia con IA**.

> **Costo de generación (prototipo):** el monto de tokens que se descuenta al regenerar es un **valor provisional del playground**, no un número definido de producto. Queda pendiente de definición por la PM. El prototipo solo ilustra la UX de cobro.

- **RN-01:** La idea del roleplay es obligatoria para generar. Ana puede escribirla libremente o partir de una de las ideas de ejemplo ofrecidas dentro del campo.
- **RN-02:** El modo, la duración y la voz se eligen **antes** de generar, no después: condicionan la propuesta que arma la IA. Siguen editables en el formulario.
- **RN-03:** La IA nunca guarda por su cuenta. Su propuesta llega al formulario como borrador y solo se guarda cuando Ana confirma.
- **RN-04:** Ana puede pedir **regenerar** describiendo qué quiere ajustar. Cada regeneración propone un personaje distinto y descuenta tokens (monto provisional — ver nota).
- **RN-05:** Ana puede optar por **no usar la IA** y llenar el formulario ella misma. En ese caso el formulario no muestra el aviso de propuesta generada, sino una invitación a generarla, que la devuelve al paso de la idea.
- **RN-06:** Al volver al paso de la idea, lo que Ana ya hubiera llenado **no se pierde**: puede retomarlo tal como estaba.
- **RN-07:** Los tokens restantes se muestran en el encabezado del flujo, igual que en Crear video con IA.

## Criterios de Aceptación

**Escenario: Camino feliz — generar y ajustar**

**Dado** que Ana elige «Evaluador roleplay (MLP)» en Añadir página
**Cuando** describe la situación en una frase, elige modo, duración y voz, y genera con IA
**Entonces** el formulario aparece lleno con escenario, personaje, personalidad, mensaje de bienvenida, papel del estudiante y objetivos
**Y** puede corregir cualquier campo antes de guardar

**Escenario: Caso borde — regenerar pidiendo un ajuste**

**Dado** que Ana tiene una propuesta generada que no la convence
**Cuando** pide volver a generar y describe qué quiere cambiar
**Entonces** recibe una propuesta distinta, con otro personaje
**Y** se descuentan los tokens correspondientes (monto provisional; definición pendiente PM)

**Escenario: Caso borde — preferir llenarlo a mano**

**Dado** que Ana está en el paso de la idea
**Cuando** elige llenar el formulario ella misma
**Entonces** llega al formulario vacío, conservando el modo, la duración y la voz que ya había elegido
**Y** en vez del aviso de propuesta generada ve una invitación a generarla con IA

**Escenario: Caso borde — volver a la idea sin perder lo escrito**

**Dado** que Ana llenó parte del formulario a mano
**Cuando** vuelve al paso de la idea
**Entonces** puede retomar lo que tenía sin volver a escribirlo

**Escenario: Error — intentar generar sin idea**

**Dado** que Ana está en el paso de la idea con el campo vacío
**Cuando** mira el botón de generar
**Entonces** lo encuentra deshabilitado
**Y** no se descuenta ningún token

**Escenario: Error — guardar con campos pendientes**

**Dado** que Ana borró un campo obligatorio de la propuesta generada
**Cuando** hace clic en «Guardar roleplay»
**Entonces** no se guarda
**Y** ve marcados los campos que faltan
