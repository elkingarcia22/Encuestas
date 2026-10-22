# Pruebas de usuario de Cristian (propuesta, 16-oct)

Del war room del 13-oct: Nicolás y Cristian listan sus pruebas en la pestaña «Pruebas de usuario» del Excel y las agendan esta semana; se hacen la siguiente. Esta es la propuesta de Cristian, lista para pasar al Excel cuando Carlos comparta la estructura. Las tareas y lo que se mide salen de las historias de usuario reales (`docs/plataforma-ubits/fuentes/contexto-producto/admin/productos/aprendizaje/planes-de-formacion/`).

Formato de cada sesión: 30 minutos, en remoto, con la maqueta de staging; la persona comparte pantalla y piensa en voz alta. Una persona por sesión; cinco sesiones por prueba alcanzan para ver los problemas grandes.

## 1. Crear un plan de contenidos y asignarlo (HU-LMS-005, HU-LMS-021)

- **Qué se prueba:** que se entienda el recorrido completo de crear un plan, ponerle fechas, asignarlo a un grupo y a personas sueltas, y guardarlo.
- **Perfil:** administrador de formación de una empresa cliente que hoy arma planes en UBITS (2 o 3 planes al trimestre). Ideal: alguien de una implementadora.
- **Tareas:**
  1. «Crea un plan para la cohorte que entra en noviembre con dos contenidos de inducción.»
  2. «Asígnalo al grupo Comercial y, además, a dos personas que no están en ese grupo.»
  3. «Antes de guardar, sal de la creación y vuelve: ¿qué pasó con lo que llevabas?» (ventana de salir del 13-oct).
- **Qué se mide:** si termina sin ayuda; tiempo hasta guardar; si entiende que el plan nace en «Planeado» y no en «Vigente» (RN-04); si encuentra «Agregar asignación» a la primera; qué entiende de la ventana «¿Salir de la creación?».

## 2. Leer el avance de un plan (HU-LMS-005 RN-08 y RN-09)

- **Qué se prueba:** que la barra de progreso se lea bien: es el % de personas que terminaron todo, no el promedio de avance.
- **Perfil:** el mismo administrador, o un líder que pide reportes de formación.
- **Tareas:**
  1. «¿Qué plan va más atrasado?»
  2. «En Ruta para nuevos líderes, ¿cuántas personas ya terminaron?»
  3. «¿Cada cuánto se actualiza este número?»
- **Qué se mide:** si interpreta el 32 % como «32 % de las personas terminó» (RN-08) o como promedio; si encuentra el globo de ayuda de los 30 minutos (RN-09); si llega al detalle con un clic en la fila (RN-06).

## 3. Plan de competencias con su límite (HU-LMS-015, RN-02 y RN-03)

- **Qué se prueba:** crear un plan de competencias con horas por competencia y el tope de 8 por asignación.
- **Perfil:** responsable de desarrollo o de talento que trabaja con competencias.
- **Tareas:**
  1. «Crea un plan de competencias de liderazgo con 10 horas por competencia.»
  2. «Asígnale 9 competencias a un grupo.»
- **Qué se mide:** si entiende que las horas son una sola cifra para todo el plan (RN-02); cómo reacciona al aviso «Máximo 8 competencias por asignación.» (RN-03) y si sabe qué hacer después.

## 4. Grupos para los planes (HU-LMS-006)

- **Qué se prueba:** crear un grupo y usarlo en un plan.
- **Perfil:** administrador de formación.
- **Tareas:**
  1. «Crea el grupo "Nuevos líderes Q4" con las personas que ascendieron este trimestre.»
  2. «Úsalo en un plan que ya existe.»
- **Qué se mide:** si entiende la diferencia entre grupo y asignación; si encuentra el grupo nuevo al asignar.

## Pendientes (sin historia de usuario)

- **Gestión de usuarios:** hay una maqueta (Design system › Pantallas › Gestión de usuarios) pero no hay historia de usuario (`admin/configuracion/gestion-usuarios/_pendiente.md`). El repo pide no inventar producto: se propone una prueba exploratoria de crear un usuario y de la carga masiva solo después de validar el alcance con producto.
- **Organigrama:** la pantalla está en «Próximamente» y no hay historia de usuario. Sin prueba hasta que haya maqueta.
