# PRD · Certificados — descarga masiva (admin)

| Campo | Valor |
| ----- | ----- |
| Producto | UBITS |
| Versión PRD | 0.1 |
| Estado | Lista |
| Dueño producto | TBD |
| Módulo (sidenav / flujo) | Admin → Productos → Aprendizaje → Certificados → Descarga |

## 1. Resumen

Este PRD define la **descarga masiva de certificados** para el administrador HR: solicitar constancias en lote por modo global, por contenido o por colaborador, con validación, confirmación explícita, anti-duplicado de 48 horas y notificación por correo. En v1 el alcance es solo la solicitud y entrega del paquete; la configuración de plantillas queda fuera.

## 2. Problema y objetivo

Tras cerrar cohortes o periodos de formación, HR necesita certificados de muchos colaboradores. Hoy el proceso manual (uno a uno o fuera de plataforma) genera retrasos, reenvíos y carga a soporte.

**Objetivos medibles (v1):**

- El admin completa una solicitud en menos de 3 minutos en el camino feliz.
- Cero solicitudes idénticas aceptadas dentro de la ventana de 48 horas.
- Cada solicitud confirmada genera aviso de correo según el modo elegido.
- El enlace de descarga comunicado permanece disponible 2 días.

### Fuera de alcance (v1)

- Diseño gráfico del PDF del certificado.
- Configuración de plantilla de certificado (`certificados/configuracion` — `_pendiente`; fase posterior).
- Reportes CSV / por recurso de Resultados del contenido.
- Descarga unitaria desde la ficha del colaborador (si existe, es otro flujo).
- Personalización de asunto o cuerpo del correo por el admin.

## 3. Personas y permisos

| Rol | Qué puede hacer (observable) | Qué no puede |
| --- | ---------------------------- | ------------ |
| Administrador de recursos humanos | Elegir modo, filtrar, validar, confirmar solicitud, ver aviso anti-duplicado | Editar plantilla del PDF; forzar una segunda corrida idéntica en menos de 48 h |
| Creador LMS | Puede entrar si su rol lo permite en el playground; misma UI de solicitud | Configurar plantillas (no existe en v1) |
| Colaborador | — | No ve este flujo de descarga masiva admin |

## 4. Restricciones de producto

| Hallazgo | Implicación para la experiencia |
| -------- | ------------------------------- |
| Anti-duplicado ventana exacta de 48 h | Tras confirmar, una solicitud equivalente muestra estado de duplicado; no se genera segunda corrida |
| Enlace de descarga válido 2 días | Copy de confirmación / correo debe mencionar la vigencia de 2 días |
| Tres modos distintos | La UI obliga a elegir un modo; los criterios de “equivalente” dependen del modo |
| Confirmación obligatoria | No hay “generar” directo: siempre pasa por “Revisa y confirma tu solicitud” |

## 5. Experiencia de usuario (flujos)

**Entrada:** sidenav Admin → Productos → Aprendizaje → Certificados → Descarga (o ítem equivalente de descarga masiva).

**Camino feliz (modo por contenido):**

1. El admin elige modo **Por contenido**.
2. Selecciona un contenido (ej. “Onboarding comercial Q3”) y criterios visibles del modo.
3. Valida; ve resumen “Revisa y confirma tu solicitud”.
4. Confirma → solicitud registrada → mensaje de que recibirá el correo con la descarga.

**Empty:** sin contenidos / colaboradores que coincidan con filtros → empty “No se encontraron resultados” y opción de ajustar criterios.

**Error / validación:** modo por colaborador sin colaborador seleccionado → no envía; error en pantalla.

**Borde — anti-duplicado:** misma solicitud equivalente en menos de 48 h → pantalla/estado de duplicado; aviso de esperar 48 h o cambiar fechas/filtros; no se acepta la corrida.

**Borde — modo global:** solicitud que abarca el alcance global definido en UI; misma confirmación y anti-duplicado.

## 6. Especificación UI

**Pantalla / estados principales:**

- Selector de modo: Global | Por contenido | Por colaborador.
- Controles de filtro/selección según modo (contenido, colaborador, fechas u otros criterios visibles).
- Paso de revisión: título o encabezado **Revisa y confirma tu solicitud**.
- Estado de solicitud duplicada (anti-duplicado) con mensaje accionable.
- Confirmación de éxito: indicación de correo pendiente.

**Campos visibles vs sistema:**

- Visibles: modo, selecciones, criterios, confirmación.
- Sistema: marca de equivalencia para anti-duplicado, generación del paquete, envío de correo, caducidad del enlace (2 días).

**Validaciones:**

- Modo por contenido: exige contenido seleccionado.
- Modo por colaborador: exige al menos un colaborador.
- Confirmación bloqueada si faltan campos obligatorios del modo.

**Copy mínimo (español neutro):**

- “Revisa y confirma tu solicitud”
- Aviso anti-duplicado: cambiar fechas/filtros o reintentar en 48 horas.
- Éxito: indicación de que recibirá el correo con la descarga.
- Empty: “No se encontraron resultados”

## 7. Requisitos de calidad (producto)

- Accesibilidad: foco y labels en selector de modo, filtros y botón confirmar; mensajes de error asociados a campos.
- Idioma UI: español neutro.
- Privacidad: la solicitud y el correo solo exponen certificados del alcance que el admin eligió; no listar datos de otras empresas.
- Empty / error: empty de sin resultados; validación en pantalla; estado de duplicado sin “falso éxito”.

## 8. Criterios de aceptación

**Escenario: Camino feliz — descarga por contenido**

**Dado** que el admin elige modo por contenido y selecciona “Onboarding comercial Q3”
**Cuando** valida y confirma la solicitud
**Entonces** la solicitud se registra
**Y** se indica que recibirá el correo con la descarga

**Escenario: Camino feliz — modo global**

**Dado** que el admin elige modo global y completa los criterios visibles del modo
**Cuando** confirma la solicitud
**Entonces** la solicitud se registra
**Y** se notifica por correo según el modo global

**Escenario: Caso borde — anti-duplicado 48 h**

**Dado** que el admin ya solicitó la misma descarga global hace menos de 48 horas
**Cuando** intenta solicitarla de nuevo
**Entonces** ve el estado de solicitud duplicada con el aviso de esperar 48 horas o cambiar filtros
**Y** no se genera una segunda corrida idéntica

**Escenario: Caso borde — enlace con vigencia**

**Dado** que el admin confirmó una solicitud válida
**Cuando** consulta el mensaje de confirmación o el correo simulado
**Entonces** se indica que el enlace de descarga estará disponible por 2 días

**Escenario: Error / camino negativo — confirmar sin selección**

**Dado** que el admin eligió modo por colaborador
**Cuando** intenta confirmar sin seleccionar colaborador
**Entonces** la solicitud no se envía
**Y** ve un error de validación en la pantalla

## 9. Fases de entrega

| Fase | Incluye | No incluye |
| ---- | ------- | ---------- |
| v1 | Tres modos, validación, confirmación, anti-duplicado 48 h, notificación por correo, vigencia enlace 2 días | Plantillas de certificado, diseño del PDF, reportes de Resultados |
| Posterior | Configuración de plantillas; posibles mejoras de copy de correo o historial de solicitudes | — |

## 10. Decisiones abiertas

1. **PENDIENTE —** Definición exacta de “solicitud equivalente” por modo (qué campos entran en la comparación).
2. **PENDIENTE —** Alcance concreto del modo global (toda la empresa, todos los contenidos del periodo, u otro criterio de negocio).
3. **PENDIENTE —** Quién recibe el correo si hay varios admins en la misma solicitud.
4. **PENDIENTE —** Prioridad y alcance de Configuración de plantillas (fase posterior).

## 11. Trazabilidad a HUs

| ID tentativo | Título | Fase |
| ------------ | ------ | ---- |
| HU-LMS-007 | Descarga masiva de certificados | v1 |
| — | Configuración de plantillas de certificado | Posterior (hoy `_pendiente`) |

## 12. Referencias

- [fundamentos/00-mapa.md](../../../../fundamentos/00-mapa.md)
- [admin/productos/aprendizaje/certificados/descarga/HU-certificados-descarga.md](descarga/HU-certificados-descarga.md) (HU-LMS-007)
- [admin/productos/aprendizaje/certificados/configuracion/_pendiente.md](configuracion/_pendiente.md)
- [_indice-hus.md](../../../../_indice-hus.md)
