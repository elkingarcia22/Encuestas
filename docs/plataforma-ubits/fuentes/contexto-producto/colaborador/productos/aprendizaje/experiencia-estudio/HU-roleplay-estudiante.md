# HU: Hacer una llamada de roleplay evaluada

## Contexto

El creador ya puede añadir un **Evaluador roleplay** a un contenido ([HU-LMS-023](../../../../admin/productos/aprendizaje/lms-creator/contenidos/recursos/HU-roleplay-mvp.md)). Esta HU cubre el otro lado: qué le pasa al colaborador cuando llega a esa página.

Es un recurso distinto a todos los demás. No se consume mirando: se hace hablando, cuesta créditos de la organización, tiene intentos contados y —en modo Evaluación— puede dejarlo sin avanzar. Por eso la página necesita un **antes** (saber con quién va a hablar y comprobar el micrófono), un **durante** (la llamada) y un **después** (qué logró y qué sigue), y no un reproductor.

Hasta el 7-oct-2026 aquí no había nada de eso: el estudiante veía la ficha del creador —con el umbral de aprobación incluido— y un botón que, tras dos segundos, declaraba la conversación aprobada.

## Pantallas en el prototipo

Se ven dentro de la vista del colaborador, en la página **«Roleplay: feedback a un colaborador»** del contenido de ejemplo: [`/admin/aprendizaje/lms-creator/vista-colaborador`](http://localhost:5173/admin/aprendizaje/lms-creator/vista-colaborador). Con la demo: llamada con Andrea Guzmán, 4 objetivos, 3 intentos, 5 minutos.

| Momento | Qué se ve |
|---|---|
| Antes de la llamada | Personaje, escenario, duración, en qué intento va, el aviso de IA y privacidad, y la prueba de micrófono |
| Sin micrófono, con respaldo | La llamada se hará por escrito; el botón pasa a «Iniciar por escrito» |
| Sin micrófono, sin respaldo | Bloqueado, con la instrucción de entrar desde otro dispositivo |
| Llamada por voz | Pantalla completa oscura: el personaje, lo que dice, el micrófono y colgar |
| Llamada por escrito | Pantalla completa con el chat del Agente IA |
| Analizando | La IA revisando la conversación |
| Resultado | Objetivo por objetivo, con lo que hizo bien y lo que le faltó |
| Sin intentos | Sin reintento y sin poder avanzar |

## Historia de Usuario

**Como** colaborador,
**quiero** entender con quién voy a hablar y comprobar mi micrófono antes de empezar, hacer la llamada y ver al final qué objetivos alcancé,
**para** saber en qué me evalúan, no quemar un intento por un problema técnico y entender qué mejorar antes de reintentar.

## Reglas de Negocio

- **RN-01:** Cuatro momentos: **antes → llamada → analizando → resultado**. Abrir la página no completa el recurso; solo lo completa un intento terminado.
- **RN-02:** Antes de iniciar se ve con quién se habla, el escenario, la duración y **en qué intento va** («Intento 2 de 3»). Es el intento que va a hacer, no los que le quedan: «3 de 3» se leía como si no hubiera gastado ninguno.
- **RN-02a:** **Un roleplay se lee como una evaluación, porque también lo es** (Dave, 13-oct). Las dos pantallas comparten anatomía antes de empezar:
  - **El título de la página va en el marco gris**, como en todos los demás recursos. Antes el roleplay lo repetía dentro del panel blanco —la página y la llamada se llaman igual— y era el único que rompía ese estándar: se sentía de otra plataforma.
  - **Sus condiciones van debajo del título, en insignias**, las mismas que usa la evaluación: el modo, la duración y el intento. El **último intento se pone en rojo**, igual que allá.
  - El **modo entró como una condición más**. Antes era una insignia de color suelta a la derecha del título, y el contorno ámbar que usaba no llega al contraste mínimo.
  - En el panel blanco se queda lo que esa caja sí aporta y la evaluación no tiene: la cara, el nombre y el papel de la persona, el escenario, los avisos y la prueba de micrófono.
- **RN-02c:** **La llamada se inicia desde la barra del contenido**, abajo a la derecha, igual que una evaluación se abre con «Comenzar evaluación» (Dave, 13-oct). Antes el botón vivía dentro del panel blanco y la barra solo comentaba desde fuera —«Aprueba la llamada para continuar», con un «Continuar» apagado—, así que la acción de arrancar estaba en un sitio distinto según el recurso. **Lo que no se puede todavía se dice en la barra**, a la izquierda del botón: que falta probar el micrófono, que no hay créditos o que se acabaron los intentos. Dentro del panel se queda el motivo largo, que es donde está el control que lo resuelve.
- **RN-02b:** **El resultado también lleva esa cabecera**, aprobado o no. Sin ella, acabar una llamada dejaba al colaborador en una caja blanca suelta, sin el nombre de la página ni las condiciones a mano. Ahí el chip del intento dice **el que se acaba de hacer**, no el siguiente —esta pantalla mira hacia atrás—, y **solo se pone en rojo cuando de verdad avisa**: no alcanzó los objetivos y era el último intento. Tras aprobar no hay nada que alertar.
- **RN-03:** **El umbral de aprobación no se le muestra.** Saber que le bastan 3 de 4 objetivos lo invita a soltar uno, y lo que se le pide es ir por todos. Tampoco aparece al fallar un intento. Esto separa su pantalla de la ficha del creador, que sí lo lleva.
- **RN-04:** Antes de iniciar se advierte que lo evalúa una IA que puede equivocarse y que **la conversación queda registrada**: quien creó el contenido puede consultarla. Por eso se le pide no compartir datos personales ni información confidencial. **No se le puede decir que no se guarda**: sería prometer una privacidad que el producto no cumple.
- **RN-04a:** Lo único que de verdad no se guarda es la **prueba de micrófono**, donde solo se mide nivel. Esa distinción se mantiene en el texto de las dos pantallas.
- **RN-05:** La prueba de micrófono es **real**: pide permiso al navegador, enseña un medidor que reacciona a la voz y confirma solo si detectó sonido. Un botón que afirme que todo está bien sin medir nada no descubre el problema que viene a descubrir.
- **RN-05a:** Mientras dura la muestra se ve **cuánto falta** y la confirmación llega **en vivo**, apenas se capta la voz. Cuatro segundos hablándole a una tarjeta quieta se leen como que algo falló.
- **RN-05b:** Si falla, se dice **por qué** —no diste permiso, no hay micrófono conectado, otra aplicación lo está usando—, nunca un error genérico.
- **RN-06:** No se puede iniciar sin haber probado el micrófono o haber declarado que no se tiene.
- **RN-07:** Sin micrófono, y con el **respaldo por escrito** activo, la llamada se hace escribiendo: la conversación y la evaluación son las mismas.
- **RN-07a:** Si el creador **desactivó** el respaldo, no hay salida dentro de la pantalla. El mensaje no se queda en «no se puede»: dice **qué hacer** —conectar un micrófono o entrar desde otro dispositivo que tenga uno, por ejemplo el celular—. Un callejón sin salida sin instrucción deja al colaborador atascado en el contenido.
- **RN-07b:** En ese estado la pantalla **no promete lo que no puede cumplir**: dice «Necesitas un micrófono» (no «Vas a responder por escrito») y el botón sigue siendo «Iniciar llamada» deshabilitado. El texto del respaldo solo aparece cuando el respaldo existe.
- **RN-08:** Cada intento cuesta **150 créditos** de la organización. Si no alcanzan, no se puede iniciar y se le pide hablar con su administrador.
- **RN-09:** Los intentos son los que definió el creador. Al agotarlos sin aprobar no hay reintento: se le indica que hable con su administrador.
- **RN-09a:** El reintento vive en la **barra de navegación del contenido**, no dentro de la tarjeta de resultados: con un intento fallido y intentos restantes, el botón de avanzar pasa a decir **«Reintentar»**. Es el mismo patrón de las evaluaciones y evita dos botones primarios compitiendo en la misma pantalla.
- **RN-10:** El resultado se entrega **por objetivo**, no como una nota: cada uno queda alcanzado o no alcanzado, con **qué hizo bien** y **qué le faltó**, escrito en segunda persona. En una conversación lo útil es eso, no un porcentaje.
- **RN-10a:** Los objetivos se enseñan como un **marcador**: una fila por objetivo —número, enunciado y veredicto— y el **detalle se abre al tocarla**. Con cuatro o cinco, la lista entera con sus dos lecturas desplegadas obligaba a bajar para saber cómo fue; así se ve de un vistazo cuántos hay y cuáles se alcanzaron, y se abre el que interese (Dave, 7-oct).
- **RN-10b:** La fila va en **gris muy suave**, con el borde del color de su veredicto —verde o **rojo**, nunca gris: el que falló es justo el que hay que mirar—, y lo que se abre son **dos tarjetas blancas con borde**, una por lectura. Es el reparto del marco de los resúmenes del asistente: gris fuera, blanco dentro, para que las lecturas se despeguen en vez de hundirse. Cada una lleva su icono en una ficha de color —verde «Lo que hiciste bien», azul «Para la próxima»— que marca dónde empieza; sueltas, una debajo de otra, se leían como un solo párrafo largo.
- **RN-10c:** El veredicto va en la **insignia con punto** del design system (`success-light` / `destructive-light`), la misma forma que el estado de una vacante. En la fila, el número, el enunciado, la insignia y la flecha van **centrados entre sí**: el acordeón de la librería alinea arriba y hay que forzarlo, si no la insignia y la flecha quedan tres píxeles más altas.
- **RN-11:** En modo **Práctica** el intento siempre completa la página y no hay aprobado ni reprobado. En **Evaluación** la completa solo si alcanzó el umbral.
- **RN-12:** **Continuar sigue deshabilitado hasta aprobar.** Vale para la navegación lineal y para cerrar el contenido.
- **RN-13:** El micrófono se libera siempre al salir, aunque la prueba quede a medias.
- **RN-14:** La llamada ocupa **toda la pantalla**: mientras dura no hay índice, ni cabecera del contenido, ni scroll de fondo. No es un recurso que se mira, es una conversación. En la **vista de móvil** del creador se queda **dentro del teléfono**, como el panel del índice: montarla sobre la ventana rompería la ilusión del aparato.
- **RN-15:** El canal por voz va **oscuro siempre**, independiente del tema del usuario, como cualquier app de llamadas. El canal por escrito respeta el tema del producto.
- **RN-16:** El canal de arranque lo define la prueba de micrófono: con micrófono se entra por **voz**, sin micrófono directo al **chat**. El botón lo anuncia con su texto y su icono.
- **RN-17:** El canal **no cambia durante la llamada**. El respaldo por escrito es para quien no tiene micrófono, no una salida a mitad de camino.
- **RN-18:** Lo primero que dice el personaje es el **mensaje de bienvenida** que escribió el creador, en los dos canales.
- **RN-19:** Durante la llamada por voz el micrófono se mantiene **abierto** y el halo del botón se mueve **con la voz real**. Decir «Te escucho» con un indicador que late por temporizador es mentir sobre si se está captando algo. Al silenciar, el micrófono se cierra de verdad y el halo se apaga.
- **RN-20:** El botón de salida **nombra lo que termina**: «Finalizar llamada» por voz, «Finalizar chat» por escrito. En voz colgar **es** la acción de la pantalla, así que va en rojo sólido; en el chat la acción es enviar —vive dentro del campo— y terminar baja a secundario, lejos del enviar: son el mismo gesto con final opuesto.
- **RN-21:** En el hilo escrito solo se rotula a quien habla **del otro lado**. Marcar «Tú» los mensajes propios no informa de nada: la burbuja a la derecha ya lo dice.
- **RN-22:** El chat usa el mismo lenguaje visual que el **Agente IA**: fondo con orbes, el campo de escritura sin franja de pie propia y las respuestas del personaje sin caja. Es el mismo tipo de conversación, así que se ve como la misma cosa. Los dos canales comparten **un solo ancho de cuerpo**: al pasar de uno a otro no se mueve nada de sitio.

## Criterios de Aceptación

**Escenario: Camino feliz — probar, llamar y aprobar**

**Dado** que el colaborador llega a la página del roleplay
**Cuando** prueba su micrófono, inicia la llamada y alcanza los objetivos necesarios
**Entonces** ve el detalle objetivo por objetivo con lo que hizo bien y lo que le faltó
**Y** el botón Continuar queda habilitado

**Escenario: Error — terminar sin alcanzar los objetivos**

**Dado** que terminó un intento en modo Evaluación sin aprobar
**Cuando** mira el resultado
**Entonces** se le dice cuántos intentos le quedan, sin revelar cuántos objetivos necesitaba
**Y** el botón de la navegación pasa de «Continuar» a «Reintentar»

**Escenario: Error — agotar los intentos sin aprobar**

**Dado** que usó todos sus intentos sin alcanzar los objetivos
**Cuando** mira el resultado
**Entonces** no se le ofrece reintentar
**Y** se le indica que hable con su administrador
**Y** el contenido no se puede cerrar

**Escenario: Caso borde — el navegador niega el micrófono**

**Dado** que pide probar el micrófono y niega el permiso
**Cuando** vuelve a la tarjeta de prueba
**Entonces** se le dice que no dio permiso, no un error genérico
**Y** si el respaldo por escrito está activo puede iniciar la llamada escribiendo

**Escenario: Error — sin micrófono y sin respaldo por escrito**

**Dado** que el creador desactivó el respaldo por escrito
**Cuando** declara que no tiene micrófono
**Entonces** no puede iniciar la llamada
**Y** se le indica que conecte un micrófono o entre desde otro dispositivo
**Y** en ningún momento se le ofrece responder por escrito

**Escenario: Caso borde — silenciar durante la llamada**

**Dado** que está en la llamada por voz
**Cuando** silencia el micrófono
**Entonces** el halo del botón se apaga
**Y** el navegador deja de señalar que se está grabando

**Escenario: Caso borde — modo Práctica**

**Dado** que el roleplay está en modo Práctica
**Cuando** termina la llamada
**Entonces** ve el detalle por objetivo sin aprobado ni reprobado
**Y** el botón Continuar queda habilitado
