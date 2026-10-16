# Marco D · Reclutamiento

Se abre desde «Selección» en la barra lateral, en pestaña nueva y en otro dominio (talentos.ubitslearning.com), con la misma sesión. Tiene su propia barra lateral de iconos y su propia versión (UBITS 1.4.0).

## Vacantes

### Vacantes — `/recruitment/job/dashboard`

Saluda con nombre, correo y empresa. «Todavía no tienes ninguna vacante creada».

Estado observado: Vacío en esta cuenta.

### Carpetas de vacantes — `/recruitment/job/dashboard/folders`

Agrupación de vacantes en carpetas; el paso 1 de crear vacante permite elegirlas.

Estado observado: No se pudo ver: redirige cuando no hay vacantes.

### Vacantes pausadas — `/recruitment/job/paused-jobs`

Por su nombre, las vacantes en pausa.

Estado observado: No se pudo ver: redirige cuando no hay vacantes.

### Historial de créditos — `/recruitment/job/credits-history`

Por su nombre, el consumo de créditos del plan.

Estado observado: No se pudo ver: redirige cuando no hay datos.

### Detalle de la vacante — `/recruitment/job/detail`

Según el aviso de la vacante creada, desde aquí o desde el listado se cambia el estado a publicada.

Estado observado: No se pudo ver: la cuenta no tiene vacantes.

## Crear vacante

### Crear vacante · 1 información básica — `/recruitment/job/create/basic-info`

Carpeta, empresa confidencial, nombre, descripción con «Crear con IA», contrato, habilidades, departamento, experiencia, seniority, idioma, ubicación, reubicación, modalidad, moneda, rango salarial y equity.

### Crear vacante · 2 configurar — `/recruitment/job/create/configuration`

Plantilla, correo automático de rechazo a los N días y el flujo del candidato armado con una biblioteca de etapas normales y etapas con IA.

### Crear vacante · 3 visibilidad y equipo — `/recruitment/job/create/add-members`

El asistente lo rotula «Visibilidad»; su ruta es la del equipo de la vacante.

Estado observado: No se pudo ver: requiere una vacante en curso.

### Vacante creada — `/recruitment/job/create/publish`

«¡Felicitaciones! Tu vacante ha sido creada». Avisa que para publicarla hay que cambiar su estado a PUBLICADA.

## Flujo del candidato

### Biblioteca de etapas — `dentro del paso 2`

Pestañas etapas, etapas con IA y crear nueva etapa.

### Flujo del candidato — `dentro del paso 2`

Etapas arrastrables en el orden en que el candidato las completa.

Dato de la cuenta: 5 etapas por defecto.

### Etapa 1 · Evaluación CV — `flujo del candidato`

Filtro inicial: porcentaje sobre el rango salarial, puntaje mínimo y si se aceptan ex empleados.

### Etapa 2 · Serena AI (entrevistadora de IA) — `flujo del candidato`

Filtro inicial hecho por una entrevistadora de IA, con su propia configuración.

### Etapa 3 · Para revisión — `flujo del candidato`

Categoría assessment: revisión humana.

### Etapa 4 · Antecedentes judiciales — `flujo del candidato`

Verificación de antecedentes.

### Etapa 5 · Seleccionado — `flujo del candidato`

Categoría oferta. Cierra el proceso.

### Plantillas de flujos — `/recruitment/workflows`

Guardar un flujo para reutilizarlo. «Crea tu primera plantilla personalizada».

Estado observado: Vacío en esta cuenta.

## Candidatos

### Candidatos — `/recruitment/job/candidate-pool`

Indicadores total, en proceso, descartados y acción requerida; tabla y «Agregar candidato».

Estado observado: Vacío en esta cuenta.

## Dashboard

### Dashboard de reclutamiento — `/recruitment/dashboard`

Filtros por vacante, estado, país, seniority, periodo y reclutador. Tiempo de contratación, tasa de éxito, candidatos por vacante, embudo por etapa y ranking de vacantes.

## Configuración

### Configuración · plan — `/recruitment/configuration/plan`

Plan Basic, frecuencia de pago, siguiente corte y cuota de entrevistas.

Estado observado: Avisa que el plan expiró.

### Configuración · usuarios y permisos — `/recruitment/configuration/users`

«Invita a tu equipo»: invitado, estado, correo, permiso y última actividad.

### Suscripción mensual — `/recruitment/billing`

«No está autorizado para esta página. Contactar a soporte».

Estado observado: Sin permiso con este rol.

### Administración interna de Reclutamiento — `/recruitment/admin`

Según sus rutas, pagos y llamadas de Serena. Reservado al equipo interno de UBITS.

Estado observado: Vacío con este rol.
