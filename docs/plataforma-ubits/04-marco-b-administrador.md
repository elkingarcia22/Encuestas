# Marco B · Administrador

Se entra por «Ir al administrador». Desaparece la barra lateral y aparece una barra superior con seis secciones que despliegan su propio menú.

## Inicio

### Inicio del administrador — `/admin-hr/home`

Saludo, bienvenida a los cuatro módulos y tarjetas: usuarios y licencias, creación masiva, mapa de competencias, métricas y centro de ayuda.

Dato de la cuenta: 646 de 5.000 licencias en uso.

### No encontrado del administrador — `/admin-hr/404`

Página de error del administrador.

## Empresa

### Gestión de usuarios — `/admin-hr/users`

Acciones individuales y masivas, recordatorios de inicio de sesión y lista de usuarios. Los cambios masivos se procesan en segundo plano y el resultado llega por correo.

### Crear usuario — `/admin-hr/users/creation`

Nombre, apellidos, usuario, correo, documento, cargo, país, ciudad, nivel, área, tipo de rol, líder, ¿es su propio líder? y dos columnas libres.

### Acciones masivas por archivo — `/admin-hr/users/bulk-user-*`

Crear, editar, suspender y activar varios usuarios con un archivo de plantilla.

### Roles y permisos — `/access-control/home`

Crear rol, lista de roles con los productos que toca cada uno y descarga de la lista de usuarios.

### Comunicaciones — `/admin-hr/comunications`

Publicaciones internas con filtros por fecha, autor y estado.

### Crear publicación — `formulario de Comunicaciones`

Título (50), descripción (400), enlace, imagen y video. Al activarla, llega por correo a toda la empresa.

### Trazabilidad de publicación — `/admin-hr/comunications/publication-trace/:id`

Seguimiento de una publicación.

## Aprendizaje del admin

### Mapa de competencias — `tarjeta del inicio del administrador`

Consultar, crear o editar mapas de competencias. Su ruta lleva a los planes de formación del Creator.

## Desempeño del admin

### Evaluaciones 360 del administrador — `/talent/360/admin`

Crear evaluación, lista con estado borrador / en progreso / finalizada y resultados generales.

Dato de la cuenta: 28 evaluaciones creadas.

### Objetivos del administrador — `/talent/goals/admin`

Configuración de ciclos de objetivos.

Estado observado: Vacío en esta cuenta.

### Matriz de talento — `/talent-matrix`

Cruza evaluaciones 360 con objetivos. Lista de análisis y «Crear análisis».

Estado observado: Vacío en esta cuenta.

## Encuestas del admin

### Encuestas del administrador — `/surveys/admin`

Pestañas encuestas y datos demográficos, crear y comparar encuestas. Tipos: cultura, riesgo psicosocial, acontecimientos traumáticos (NOM-035).

Dato de la cuenta: 78 encuestas creadas.

## Diagnóstico del admin

### Diagnóstico del administrador — `/assessments/admin`

Assessments de competencias.

Estado observado: Módulo inactivo en esta empresa.

## Ayuda y métricas

### UBITS Metrics — `/admin-hr/metrics`

Tablero de Power BI incrustado. Los permisos de métricas se gestionan desde Intranalytics.

### Centro de ayuda — `/admin-hr/help-center`

Mesa de soporte (soporte@ubits.co), equipo de expertos con agenda y novedades del producto.

## Equipo interno

### Detalle de empresa — `/admin-hr/companies/:id`

Datos de la empresa, cursos propios y suscripción (MAX + LMS, licencias). Acciones de suspender empresa o eliminar suscripción.
