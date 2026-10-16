# HU: Descarga masiva de certificados

## Contexto

Tras cerrar cohortes, HR necesita certificados de muchos colaboradores sin descargar uno a uno. Un flujo con modos (global / contenido / colaborador), resumen a la vista y anti-duplicado reduce reenvíos y carga de soporte. Meta: cero solicitudes idénticas aceptadas dentro de la ventana de 48 horas.

## Historia de Usuario

**Como** administrador de recursos humanos,
**quiero** solicitar la descarga masiva de certificados por global, por contenido o por colaborador,
**para** entregar constancias sin procesos manuales repetidos.

## Alcance

**Incluye:**
- Tres modos de solicitud: global, por contenido, por colaborador.
- Validación en la barra, resumen vivo a la derecha y aviso de anti-duplicado (48 horas).
- Notificación por correo según el modo (simulación de envío).

**Excluye:**
- Diseño gráfico del PDF del certificado.
- Configuración de plantilla de certificado.
- Reportes CSV/por recurso de Resultados del contenido (HU-LMS-013).

## Reglas de Negocio

- **RN-01:** Modos: global, por contenido, por colaborador.
- **RN-02:** Toda solicitud pasa por validación, y **lo que se va a pedir está a la vista mientras se llena**: a la
  derecha del formulario, en «Tu solicitud» —el alcance con su filtro, el rango de fechas, cuántos certificados
  encuentra, a qué correo llega y cuánto tarda—, y cambia con cada campo.
- **RN-02a:** **No hay ventana de confirmación** (Dave, 13-oct). Pedir una descarga *es* crear una solicitud, así que
  se recorre como una creación: el formulario a la izquierda, el resumen al lado y la acción abajo, en la **misma
  barra de los pasos de creación**, donde además se dice qué falta —el primer hueco, no la lista entera—. La ventana
  enseñaba ese mismo resumen, pero había que abrirla para leerlo y cerrarla para corregir.
- **RN-03:** Anti-duplicado: no se acepta una solicitud equivalente dentro de una ventana exacta de 48 horas; el aviso indica cambiar fechas/filtros o reintentar en 48 horas.
- **RN-04:** Al confirmar, se notifica por correo según el modo elegido.
- **RN-05:** El enlace de descarga comunicado estará disponible por 2 días.
- **RN-06:** *Tipo de contenidos* (solo UBITS, solo propios o ambos) se pide en la descarga **global** —a la izquierda de las fechas— y **por colaborador**. Forma parte de lo que hace equivalente a una solicitud (RN-03).
- **RN-07:** Tras confirmar, el aviso «Solicitud registrada» **no tiene botón** ni abre nada: el admin espera y el correo le llega a su bandeja cuando el archivo está listo.

## Criterios de Aceptación

**Escenario: Camino feliz — descarga por contenido**

**Dado** que el admin elige modo por contenido y selecciona “Onboarding comercial Q3”
**Cuando** valida y confirma la solicitud
**Entonces** la solicitud se registra
**Y** se indica que recibirá el correo con la descarga

**Escenario: Caso borde — anti-duplicado 48 h**

**Dado** que el admin ya solicitó la misma descarga global hace menos de 48 horas
**Cuando** intenta solicitarla de nuevo
**Entonces** ve el estado de solicitud duplicada con el aviso de esperar 48 horas o cambiar filtros
**Y** no se genera una segunda corrida idéntica

**Escenario: Camino negativo — confirmar sin selección**

**Dado** que el admin eligió modo por colaborador
**Cuando** intenta confirmar sin seleccionar colaborador
**Entonces** la solicitud no se envía
**Y** ve un error de validación en la pantalla

## Decisiones del prototipo

Resueltas al maquetar en el playground UX (las abiertas del PRD siguen pendientes para producto):

- **Campos por modo:** los tres piden *Emitidos entre* (rango de fechas, máximo un año), *Correo de destino* + *Confirmar correo* (vienen con el correo de quien pide) e *Incluir usuarios inactivos*. Global suma *Tipo de contenidos* (solo UBITS, solo propios o ambos), a la izquierda de *Emitidos entre*; por contenido, *Buscar contenido* (UBITS y de la empresa); por colaborador, *Buscar colaborador* y *Tipo de contenidos*.
- **Validaciones:** contenido o colaborador obligatorio según el modo; fecha inicial y final; rango de un año como máximo; correo válido; los dos correos iguales. Con errores no se registra nada: la barra dice qué falta, los campos se marcan y arriba sale «Revisa los campos marcados antes de continuar».
- **Solicitud equivalente (RN-03, simulación):** coinciden modo, contenido o colaborador, tipo de contenidos (global y por colaborador), fechas, correo e inactivos. Cambiar cualquiera de ellos permite una nueva.
- **Sin resultados:** si no hay certificados (el contenido no genera certificado, el periodo es anterior a 2025 o la persona no completó cursos) se muestra «No se encontraron certificados» con «¿Por qué puede estar pasando esto?» según el modo, y no se registra nada.
- **Al confirmar:** aviso «Solicitud registrada» en la pantalla y aviso flotante «Revisa tu correo en unos minutos», **sin botón**: en el producto el administrador espera y el correo le llega a su bandeja cuando el archivo está listo (RN-04). No hay nada que abrir desde la plataforma.
- **El correo es solo del prototipo:** para enseñar cómo le llegará, el playground abre la vista previa del correo cuando se cierra ese aviso flotante. Eso **no pasa en el producto**; la vista previa lo dice arriba («Vista del prototipo») y muestra, más o menos, el correo que recibe el cliente.
- **Error del servicio:** «No pudimos procesar la solicitud. Inténtalo de nuevo en unos minutos.» (en el prototipo solo por dirección).

## Pantallas en el prototipo (playground UX)

Todo vive en `/admin/aprendizaje/certificados/` (en local: `http://localhost:5173` + la dirección). Cada estado de cada modo tiene su dirección; abierta directo, carga un ejemplo (primer semestre de 2026).

| Pantalla o estado | Dirección |
|---|---|
| Descarga · global / por contenido / por colaborador (vacía) | `/descarga#global` · `#contenido` · `#colaborador` |
| Formulario lleno | `#{modo}-filled` |
| Validación (campos obligatorios) | `#{modo}-validacion` |
| No se encontraron certificados | `#{modo}-sin-resultados` |
| Solicitud registrada | `#{modo}-registrada` |
| Solicitud duplicada (48 horas) | `#{modo}-solicitud-duplicada` |
| Error del servicio | `#{modo}-error` |
| Correo «¡Tus certificados están listos!» (vista del prototipo, no existe en el producto) | `/correo/global` · `/correo/contenido` · `/correo/colaborador` (con `?desde=AAAA-MM-DD&hasta=…&nombre=…&para=…`; sin datos, el ejemplo) |
| Configuración | `/configuracion` (sin maquetar: ver `configuracion/_pendiente.md`) |

`{modo}` es `global`, `contenido` o `colaborador`.
