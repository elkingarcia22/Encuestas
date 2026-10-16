# HU: Agente de tu empresa

## Contexto

La empresa acumula políticas y procesos en archivos sueltos. El admin alimenta **un** agente con **colecciones** de documentos y decide quién las usa. El colaborador pregunta en lenguaje natural y ve respuestas citadas en esos documentos. Distinto del chat genérico **Agente IA** y del tutor **Modo estudio IA**.

## Historia de Usuario

**Como** administrador de mi empresa,
**quiero** darle cara al agente, armar colecciones de documentos y controlar quién las usa,
**para** que el equipo consulte el conocimiento oficial de la empresa con fuentes.

**Como** colaborador de mi empresa,
**quiero** preguntarle al agente de mi empresa y ver de qué documento sale la respuesta,
**para** resolver dudas operativas sin buscar en carpetas.

## Alcance

**Incluye:**
- Un agente por empresa, con **cara** (imagen, nombre y tono: una imagen por defecto, o la que el admin sube o genera con IA). **Editar agente** abre un **drawer** (mismo patrón que crear colección). **Generar con IA** abre una capa del mismo drawer (mismo flujo que generar portada).
- Admin: ítem **Agente de tu empresa** en Herramientas (junto a Tareas y Avisos).
- Home del agente: cara, listado de colecciones (lista y cards), crear / abrir / editar / eliminar, profundidad libre.
- Colección: vive en la home del agente. Agrupa **carpetas** y **documentos**. Ícono de libros.
- Carpeta: vive **dentro** de una colección (o de otra carpeta). Agrupa carpetas y documentos. Ícono de carpeta.
- Crear / editar: nombre, visibilidad (Borrador / Público / Privado / Oculto) y documentos (varios `.txt` o `.md` de una vez). Hija **hereda** del padre; se puede **pisar**. Privado = personas y/o grupos (mismo selector que LMS). Crear y editar salen en un **drawer** sobre el listado (el selector de Privado se abre encima, sin cerrar el drawer). En la home el CTA es **Crear colección**. **Dentro** de una colección o carpeta el CTA es **Nuevo**: dropdown con **Nueva carpeta** y **Subir documentos**; cada uno abre su drawer.
- Subir documentos **dentro** de una colección o carpeta (drawer, arrastre al lienzo o a una carpeta, o menú). v1: `.txt` y `.md`.
- Dentro de una colección o carpeta: seleccionar varios (checkbox en cards), barra de acciones masivas, arrastrar a una carpeta, menú de tres puntos con Mover / Descargar / Ocultar / Eliminar (carpeta también Editar).
- **Probar agente:** chat de admin en un **IA panel** (panel lateral) con todas las colecciones del tenant. Solo en la home del agente, y **solo si ya hay al menos una colección con un documento**.
- Colaborador: entra por **Agentes**. Si tiene ≥1 colección visible, la card **Agente de tu empresa** es la primera y abre el chat. Si no, la card no aparece.
- Chat colaborador: historial, citas numeradas, panel derecho con el documento (completo, fragmento resaltado, autoscroll).
- Copy cerrado de empty, archivo no texto, no encontrado y disclaimer.

**Excluye:**
- Chat genérico **Agente IA**.
- Modo estudio IA ([HU-APR-001](../../../colaborador/productos/aprendizaje/modo-estudio-ia/HU-modo-estudio-ia.md)), Chat IA de grupos ([HU-LMS-009](../../productos/aprendizaje/planes-de-formacion/grupos/HU-chat-ia-grupos.md)).
- Catálogo de la landing Agentes salvo la card de este producto ([HU-IA-001](../../../colaborador/ia-para-hr/HU-ia-para-hr.md)).
- PDF, Word, video, artefactos tipo NotebookLM, varios agentes por empresa.
- Selector «Ver como» en Probar agente.
- Techos de cantidad, peso o profundidad (el prototipo no los simula).
- Carga de documentos desde el chat del colaborador.

## Reglas de Negocio

- **RN-01:** Hay **un** agente por empresa. El colaborador no elige “cuál agente”: entra y chatea.
- **RN-02:** Las colecciones alimentan al agente. Un documento entra al chat del colaborador solo si la **colección que lo contiene** (visibilidad efectiva) lo incluye. El padre no arrastra documentos de una hija que él no puede ver, ni al revés.
- **RN-03:** En la home la unidad se llama **colección**. Lo que se crea **adentro** se llama **carpeta**. Al crear adentro: `Nueva carpeta en {nombre del padre}`. En el listado: `1 carpeta` / `N carpetas`. Ícono colección: libros. Ícono carpeta: carpeta. En la home el CTA es **Crear colección**. Dentro de una colección o carpeta hay un solo botón **Nuevo** (dropdown): **Nueva carpeta** y **Subir documentos**. Cada opción abre su drawer.
- **RN-04:** El agente tiene **cara**: **imagen**, nombre visible y **tono** (en ese orden en el drawer). Si el admin no sube ni genera una, se muestra una **imagen por defecto**. Puede cambiarla subiendo un archivo o generando con IA. Quitar una imagen personalizada vuelve a la por defecto: el agente no se queda sin imagen. No es una colección. El ítem del sidenav sigue diciendo **Agente de tu empresa** aunque el admin cambie el nombre de la cara. Descripción en la home: `Es el agente de chat con IA de tu empresa. Responde basándose en las colecciones de documentos que armes aquí.` **Editar agente** abre un drawer (no un modal).
- **RN-05:** Nombre de producto en UI v1: **Agente de tu empresa** (no “Agente [nombre de la empresa]” hasta validar con PM).
- **RN-06:** La visibilidad vive en cada colección o carpeta, no en el agente. Al crear una hija, **hereda** la del padre. Se puede **pisar** en el hijo (más restrictivo o más abierto).
- **RN-07:** Estados y efecto en el chat del colaborador:
  - **Borrador:** solo admins. No alimenta al colaborador.
  - **Público:** todos los colaboradores de la empresa. **Default al crear.**
  - **Privado:** solo las personas o grupos seleccionados (selector LMS).
  - **Oculto:** no alimenta el chat del colaborador. Si una hija visible lo pisa, esa hija sí.
- **RN-08:** Si el colaborador no tiene **ninguna** colección visible (tras herencia y override), **no ve** la card Agente de tu empresa en Agentes. Agentes sigue mostrando el catálogo de IA para HR.
- **RN-09:** Si tiene ≥1 colección visible, la card **Agente de tu empresa** es la **primera** de Agentes y abre el chat (solo documentos de colecciones visibles para él).
- **RN-10:** v1 admite **`.txt` y `.md`**. Tipo no permitido: `En esta versión solo se pueden subir archivos de texto.`
- **RN-11:** Cualquier admin del tenant puede crear colecciones (playground: María Alejandra).
- **RN-12:** Si ocultan o restringen una colección a mitad de chat, el hilo **sigue**. El **siguiente** mensaje ya no usa esa colección.
- **RN-13:** El historial se conserva si el acceso reaparece. Fuentes de un mensaje viejo pueden quedar no disponibles.
- **RN-14:** **Probar agente** abre un **IA panel** sobre la home y usa **todas** las colecciones del tenant (Públicas, Privadas, Ocultas y Borrador). No hay «Ver como». El botón **solo** está en la home del agente, no al entrar a una colección. **Solo se muestra** si existe al menos una colección con al menos un documento. Hasta entonces la acción principal es **Crear colección**; Probar agente no se ofrece como alternativa al armar el conocimiento.
- **RN-15:** El prototipo **no** impone tope de colecciones, archivos, peso ni profundidad. Sí bloquea tipos que no sean `.txt` o `.md`.
- **RN-16:** Al crear o editar una colección o carpeta se pueden subir varios `.txt` o `.md` de una vez. También se pueden subir después, dentro. No hay campo de descripción.
- **RN-17:** En el listado se distinguen **colección**, **carpeta** y **documento** (ícono y meta). Vacía se etiqueta `Vacía`. Si hay contenido, la meta nombra primero las **carpetas** (`1 carpeta` / `N carpetas`) y después los **documentos**. El documento muestra título (sin extensión), tipo y peso. Si la visibilidad efectiva es **Público** por herencia, solo se muestra el badge Público (sin el texto “Heredada”). Menú de tres puntos de carpeta y documento: **Mover**, **Descargar**, **Ocultar** / **Mostrar**, **Eliminar**. Carpeta (y colección en home) también **Editar**.
- **RN-18:** Citas: la respuesta lleva **números**. El chip muestra **archivo** y, en meta, **colección**. Clic en el número → panel derecho: documento **completo**, fragmento **resaltado**, **autoscroll**.
- **RN-19:** Pregunta fuera de los documentos: `No encontré eso en los documentos de tu empresa. Puede que no esté en las colecciones que tienes disponibles.`
- **RN-20:** Disclaimer bajo el input (admin en Probar y colaborador en el chat): `El agente puede equivocarse. Confirma en el documento si la decisión es importante.`
- **RN-21:** Empty de home admin sin colecciones: título `Aún no hay colecciones`. Cuerpo: `Una colección agrupa documentos y carpetas (políticas, procesos, manuales) para que el agente responda con fuentes de tu empresa.` CTA: `Crear colección`.
- **RN-22:** Empty dentro de una colección: título `Colección vacía`. Cuerpo: `Esta colección está vacía. Sube documentos o crea una carpeta.` CTA: `Crear carpeta`. Empty dentro de una carpeta: título `Carpeta vacía`. Cuerpo: `Esta carpeta está vacía. Sube documentos o crea otra carpeta.`
- **RN-23:** El colaborador **no** carga documentos en el chat. Solo pregunta.
- **RN-24:** Prohibido en UI: Notebook, RAG, vector store, “base de conocimiento” como nombre de producto.
- **RN-25:** El **App Header** es el breadcrumb y **solo dos niveles**: la página actual y su padre, si tiene. Home: `Agente de tu empresa`. Colección: `Agente de tu empresa / {colección}`. Carpeta: `{padre} / {carpeta}`. El padre es enlace. No muestra abuelos ni nietos. El HeaderProduct **no** lleva breadcrumb ni botón atrás.
- **RN-26:** En **Editar agente**, debajo de Nombre, hay **Tono**. Las opciones son las mismas que en Agregar video: Cercano y conversacional, Formal e institucional, Didáctico y claro, Motivador, Directo y práctico, Otro. **Default: Cercano y conversacional.** Si elige Otro, escribe el tono en un campo libre. El tono es del agente, no de cada colección.
- **RN-27:** **Generar con IA** (en Editar agente) no genera en el acto: abre una **capa del mismo drawer**. Flecha **Volver** a la izquierda del título (`Generar imagen`); **sin** botón cerrar. Badge IA de tokens en la cabecera (misma animación de descuento que portada). El cuerpo replica generar portada: “Tú lo imaginas, nosotros lo generamos”, describir la imagen (mín. 6 / máx. 500 palabras), adjuntar referencia, **Generar imagen** / **Regenerar imagen**. Costo: **50** tokens (igual que portada). Mientras genera, no se puede volver ni cancelar. **Guardar** de esa capa aplica la imagen a la cara y regresa al drawer de Editar agente. **Cancelar** o **Volver** descartan la generación no aplicada. **Guardar** del drawer de Editar agente persiste la cara.
- **RN-28:** El contador del toolbar nombra el tipo de ítem, no “resultados”. Home: `colecciones`. Dentro de una colección o carpeta: `carpetas` si solo hay carpetas, `documentos` si solo hay documentos, `elementos` si hay de ambos.
- **RN-29:** Dentro de una colección o carpeta, las cards (cuadrícula) y las filas (lista) tienen **checkbox** redondo para seleccionar varios. Al haber selección aparece una barra: **Mover**, **Descargar**, **Ocultar** / **Mostrar**, **Eliminar**. Mover abre un drawer para elegir colección o carpeta destino (no se puede mover una carpeta dentro de sí misma ni de una hija).
- **RN-30:** Se pueden **arrastrar** documentos o carpetas y **soltarlos** sobre una carpeta para moverlos. También se pueden soltar archivos `.txt` / `.md` del escritorio sobre la vista (suben a la carpeta actual) o sobre una carpeta (suben ahí).
- **RN-31:** Al abrir un documento, se previsualiza en un **drawer**. El `.md` se muestra con formato (títulos, listas, negritas, tablas). El `.txt` se muestra como texto plano.

## Criterios de Aceptación

**Escenario: Camino feliz — admin crea colección pública y el colaborador pregunta**

**Dado** que María Alejandra está en Herramientas → Agente de tu empresa
**Cuando** crea una colección pública y, dentro, sube un `.txt` o `.md` de vacaciones
**Entonces** la colección aparece en el home (lista o cards) distinguida de un documento
**Y** un colaborador con acceso ve la card Agente de tu empresa como primera en Agentes
**Y** puede preguntar “¿cuántos días me tocan?”
**Y** la respuesta cita el archivo; al hacer clic en el número se abre el panel derecho con el documento completo, el fragmento resaltado y autoscroll

**Escenario: Camino feliz — cara del agente**

**Dado** que María Alejandra está en la home del agente y no ha subido ni generado imagen
**Entonces** la home y Probar agente muestran la imagen por defecto
**Cuando** pulsa Editar agente
**Entonces** se abre un drawer
**Y** el primer campo es la imagen; luego Nombre y Tono
**Y** puede cambiar el nombre, el tono y la imagen (subir archivo)
**Y** Tono viene preseleccionado en `Cercano y conversacional` si no lo ha cambiado
**Cuando** pulsa Generar con IA
**Entonces** el mismo drawer pasa a la capa Generar imagen
**Y** ve flecha Volver, badge de tokens y el prompt para describir la imagen
**Y** no ve el botón cerrar
**Cuando** describe la imagen y pulsa Generar imagen
**Entonces** se descuentan 50 tokens en el badge
**Y** puede Regenerar imagen o Guardar
**Cuando** guarda en esa capa
**Entonces** la imagen queda en la cara del drawer Editar agente
**Cuando** guarda el drawer
**Entonces** esa cara reemplaza la por defecto
**Y** si quita la imagen, vuelve la por defecto
**Y** el sidenav sigue diciendo Agente de tu empresa

**Escenario: Camino feliz — carpeta dentro de una colección**

**Dado** que existe la colección pública “Políticas”
**Cuando** María Alejandra crea una carpeta adentro
**Entonces** el flujo se titula `Nueva carpeta en Políticas`
**Y** hereda Público salvo que elija otra visibilidad
**Y** en Políticas se ve como carpeta (ícono de carpeta, no de colección)

**Escenario: Camino feliz — crear en drawer**

**Dado** que María Alejandra está en la home del agente
**Cuando** pulsa Crear colección
**Entonces** se abre un drawer con nombre, visibilidad y carga de documentos
**Y** el listado permanece visible detrás
**Y** si elige Privado, el selector de personas se abre encima sin cerrar el drawer

**Escenario: Caso borde — sin colecciones visibles**

**Dado** que Carolina no tiene ninguna colección Pública ni Privada aplicable
**Cuando** abre Agentes
**Entonces** no ve la card Agente de tu empresa
**Y** Agentes sigue mostrando el catálogo de IA para HR

**Escenario: Caso borde — Probar agente**

**Dado** que existe una colección Privada de bodega con un documento y una en Borrador
**Cuando** María Alejandra está en la home del agente y abre Probar agente
**Entonces** se abre un IA panel
**Y** puede preguntar por bodega y el agente usa esas colecciones
**Y** no ve un selector «Ver como»
**Y** dentro de una colección no ve el botón Probar agente

**Escenario: Caso borde — Probar agente sin documentos**

**Dado** que no hay ninguna colección con documentos
**Cuando** María Alejandra entra a la home del agente
**Entonces** ve **Crear colección** como acción principal
**Y** no ve el botón Probar agente

**Escenario: Caso borde — hija que pisa visibilidad**

**Dado** que existe una colección Pública “Políticas” con una carpeta Privada “Bodega” (solo el equipo de bodega)
**Cuando** un colaborador que no es de bodega pregunta por el producto refrigerado
**Entonces** el agente no usa los documentos de “Bodega”
**Y** sí puede usar los documentos de “Políticas” si aplican

**Escenario: Caso borde — ocultan a mitad de chat**

**Dado** que el colaborador está en un hilo que ya usó una colección
**Cuando** el admin la pasa a Oculto o deja de incluirlo en Privado
**Entonces** el hilo sigue visible
**Y** el siguiente mensaje ya no usa esa colección

**Escenario: Camino negativo — pregunta fuera de los documentos**

**Dado** que el colaborador chatea con el agente y tiene colecciones visibles
**Cuando** pregunta algo que no está en esos documentos
**Entonces** ve: `No encontré eso en los documentos de tu empresa. Puede que no esté en las colecciones que tienes disponibles.`
**Y** el disclaimer bajo el input permanece visible

**Escenario: Camino negativo — archivo no texto**

**Dado** que María Alejandra sube documentos a una colección
**Cuando** elige un archivo que no es `.txt` ni `.md`
**Entonces** ve: `En esta versión solo se pueden subir archivos de texto.`
**Y** el archivo no queda en la colección

**Escenario: Camino feliz — Nuevo, seleccionar y mover**

**Dado** que María Alejandra está dentro de la colección “Políticas”
**Cuando** pulsa Nuevo
**Entonces** ve un dropdown con Nueva carpeta y Subir documentos
**Y** cada opción abre su drawer
**Y** puede seleccionar cards con checkbox, usar Mover / Descargar / Ocultar / Eliminar, o arrastrar un documento sobre una carpeta

**Escenario: Camino feliz — meta de carpetas y documentos**

**Dado** que una colección o carpeta tiene carpetas y documentos adentro
**Cuando** María Alejandra la ve en el listado
**Entonces** la meta nombra primero las carpetas y después los documentos
**Y** si no tiene nada, dice `Vacía`

**Escenario: Camino feliz — Público por herencia**

**Dado** que una carpeta hereda visibilidad Pública del padre
**Cuando** María Alejandra la ve en el listado o en el header
**Entonces** ve el badge Público
**Y** no ve el texto “Heredada”

**Escenario: Camino feliz — previsualizar Markdown**

**Dado** que María Alejandra abre un documento `.md` desde el listado
**Cuando** se abre el drawer
**Entonces** ve el contenido con formato (títulos, listas, negritas)
**Y** si abre un `.txt`, lo ve como texto plano
