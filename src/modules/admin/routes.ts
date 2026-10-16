import { redirect } from 'react-router'
import { suiteAiRoutes } from './suite-ai/routes'
import type { AppModule } from '@/shared/types/module'

export const adminModule: AppModule = {
  id: 'admin',
  title: 'Admin',
  path: '/admin',
  description: 'Panel de administración: selección, aprendizaje, desempeño y cultura, tareas y avisos.',
  nav: true,
  routes: [
    {
      path: 'admin',
      children: [
        {
          index: true,
          lazy: () => import('./inicio/main'),
        },
        {
          path: 'seleccion',
          children: [
            {
              index: true,
              lazy: () => import('./seleccion/main'),
            },
            // AI Insights reemplazó al Dashboard el 8 oct (VP de producto): su código sigue en `seleccion/dashboard`. Los
            // enlaces viejos del Dashboard y de Onboarding (que salió el 7 oct) llevan a él.
            {
              path: 'ai-insights',
              lazy: () => import('./seleccion/dashboard/main'),
            },
            { path: 'dashboard', loader: () => redirect('/admin/seleccion/ai-insights') },
            { path: 'onboarding', loader: () => redirect('/admin/seleccion/ai-insights') },
            {
              path: 'vacantes',
              lazy: () => import('./seleccion/vacantes/main'),
            },
            // Va antes del detalle para que «crear» no se lea como el id de una vacante.
            {
              path: 'vacantes/crear',
              lazy: () => import('./seleccion/vacantes/crear/main'),
            },
            // Las plantillas propias se arman y se editan con el mismo flujo de crear vacante.
            {
              path: 'vacantes/plantillas/crear',
              lazy: () => import('./seleccion/vacantes/crear/main'),
            },
            {
              path: 'vacantes/plantillas/:plantillaId/editar',
              lazy: () => import('./seleccion/vacantes/crear/main'),
            },
            {
              path: 'vacantes/:id',
              lazy: () => import('./seleccion/vacantes/detalle/main'),
            },
            // El expediente viejo se retiró (CA-13): decía otras cifras, movía sin deshacer y no se hablaba con el tablero.
            // Su dirección lleva a la ficha de la persona en su vacante, para que los enlaces que quedan sigan sirviendo.
            {
              path: 'vacantes/:id/candidatos/:candidatoId',
              loader: ({ params }) =>
                redirect(`/admin/seleccion/exploraciones/uno/${params.id}?persona=${encodeURIComponent(`${params.candidatoId}@${params.id}`)}`),
            },
            {
              path: 'plantillas',
              lazy: () => import('./seleccion/plantillas/main'),
            },
            // La exploración elegida del recorrido completo de Selección (las 2 y 3 se borraron el 1 oct). Desde el 27 sep
            // «Vacantes» y «Mis candidatos» son dos secciones del menú, como en el producto: la lista de vacantes (que sigue
            // dentro de una vacante) y, aparte, la base de candidatos.
            // La 1 empieza en el inicio de Vacantes de Elkin (30 sep); su lista anterior sigue en `uno/vacantes.tsx`.
            { path: 'exploraciones/uno', lazy: () => import('./seleccion/exploraciones/uno/inicio') },
            // Las direcciones viejas de la base (cuando vivía dentro de la lista de vacantes, con el switch) llevan a la
            // nueva. Van antes que «:vacanteId», si no la ruta las tomaría por una vacante.
            { path: 'exploraciones/uno/mis-candidatos', loader: () => redirect('/admin/seleccion/candidatos/dos') },
            // Crear en la 1 es la creación de Vacantes (30 sep): la vacante y las plantillas propias. Antes que «:vacanteId».
            { path: 'exploraciones/uno/crear', lazy: () => import('./seleccion/exploraciones/uno/crear') },
            { path: 'exploraciones/uno/plantillas/crear', lazy: () => import('./seleccion/exploraciones/uno/crear') },
            { path: 'exploraciones/uno/plantillas/:plantillaId/editar', lazy: () => import('./seleccion/exploraciones/uno/crear') },
            // «Editar» una vacante de la 1 es la misma creación, con lo que ya tiene (1 oct, reunión con Elkin).
            { path: 'exploraciones/uno/:vacanteId/editar', lazy: () => import('./seleccion/exploraciones/uno/crear') },
            { path: 'exploraciones/uno/:vacanteId', lazy: () => import('./seleccion/exploraciones/uno/vacante') },
            // Las exploraciones 2 y 3 se borraron el 1 oct (Nicolás: «solo deja la 1»): sus direcciones viejas llevan a la 1.
            // «Mis candidatos» es la opción 2 desde el 1 oct (Nicolás: «me voy con la opción 2 de mis candidatos… la 1, 3 y 5
            // bórralas»): sigue en `/candidatos/dos` y las direcciones de la 1 y la 3 llevan a ella.
            { path: 'exploraciones/dos/*', loader: () => redirect('/admin/seleccion/exploraciones/uno') },
            { path: 'exploraciones/tres/*', loader: () => redirect('/admin/seleccion/exploraciones/uno') },
            { path: 'candidatos/dos', lazy: () => import('./seleccion/exploraciones/dos/mis-candidatos') },
            // Agregar una persona a la base se hace en Mis candidatos, en su ventana (la página de la auditoría del 5-oct no
            // se trajo al unir tengo-miedo el 8 oct): la dirección lleva ahí.
            { path: 'candidatos/dos/agregar', loader: () => redirect('/admin/seleccion/candidatos/dos') },
            { path: 'candidatos/uno', loader: () => redirect('/admin/seleccion/candidatos/dos') },
            { path: 'candidatos/tres', loader: () => redirect('/admin/seleccion/candidatos/dos') },
            // La exploración 4 («Reclutamiento · Todo junto») se borró el 1 oct: sus direcciones llevan a Vacantes y a Mis candidatos.
            { path: 'reclutamiento/candidatos', loader: () => redirect('/admin/seleccion/candidatos/dos') },
            { path: 'reclutamiento/*', loader: () => redirect('/admin/seleccion/exploraciones/uno') },
            // «Gestión de créditos de IA» (25 sep): el saldo y el historial. Eran tres exploraciones; el 1 oct Nicolás dejó
            // la 1 y las direcciones de la 2 (reparto por agente) y la 3 (movimientos) llevan a ella.
            { path: 'creditos/uno', lazy: () => import('./seleccion/creditos/uno/main') },
            { path: 'creditos/dos', loader: () => redirect('/admin/seleccion/creditos/uno') },
            { path: 'creditos/tres', loader: () => redirect('/admin/seleccion/creditos/uno') },
            // La lista y el asistente de crear vacante de Cristian (22 sep, «Exploración 5») se borraron el 1 oct a pedido de
            // Nicolás: sus direcciones llevan a Vacantes.
            { path: 'exploraciones/cristian/*', loader: () => redirect('/admin/seleccion/exploraciones/uno') },
          ],
        },
        {
          path: 'aprendizaje',
          children: [
            {
              index: true,
              lazy: () => import('./aprendizaje/main'),
            },
            // Estas tres secciones abren un tercer nivel; su dirección raíz lleva a la primera página.
            {
              path: 'lms-creator',
              children: [
                { index: true, loader: () => redirect('/admin/aprendizaje/lms-creator/contenidos') },
                // «Contenidos» es la lista (todavía sin maquetar); el editor es el de un contenido concreto.
                { path: 'contenidos', lazy: () => import('./aprendizaje/lms-creator/contenidos/main') },
                { path: 'contenidos/onboarding-operativo', lazy: () => import('./aprendizaje/lms-creator/main') },
                // Resultados de un contenido ya publicado, **aparte del flujo de edición** (Dave, 13-oct): mirar cómo va
                // y cambiar lo que dice son dos trabajos distintos. Un borrador abre el asistente; lo demás, esto.
                { path: 'contenidos/:id/resultados', lazy: () => import('./aprendizaje/lms-creator/resultados/main') },
                // Crear contenido y crear evento (HU-LMS-001, HU-LMS-020): la experiencia definitiva, un asistente por pasos con el
                // resumen del contenido a la derecha. Cada recurso que se crea aparte tiene su propia dirección.
                { path: 'crear-contenido', lazy: () => import('./aprendizaje/lms-creator/crear-contenido/main') },
                { path: 'crear-evento', lazy: () => import('./aprendizaje/lms-creator/crear-evento/main') },
                { path: 'crear-ruta', lazy: () => import('./aprendizaje/lms-creator/crear-ruta/main') },
                { path: 'agregar-video', lazy: () => import('./aprendizaje/lms-creator/agregar-video/main') },
                { path: 'agregar-video/editor', lazy: () => import('./aprendizaje/lms-creator/agregar-video/editor/main') },
                {
                  path: 'agregar-presentacion-interactiva',
                  lazy: () => import('./aprendizaje/lms-creator/agregar-presentacion-interactiva/main'),
                },
                {
                  path: 'agregar-presentacion-interactiva/editor',
                  lazy: () => import('./aprendizaje/lms-creator/agregar-presentacion-interactiva/editor/main'),
                },
                // Agregar asistencia es una pantalla y no un modal: con el modal, confirmar el borrado de una sesión
                // dejaba un diálogo encima de otro (Dave, 2-oct).
                { path: 'agregar-asistencia', lazy: () => import('./aprendizaje/lms-creator/agregar-asistencia/main') },
                { path: 'agregar-roleplay-mvp', lazy: () => import('./aprendizaje/lms-creator/agregar-roleplay-mvp/main') },
                { path: 'agregar-roleplay', lazy: () => import('./aprendizaje/lms-creator/agregar-roleplay/main') },
                // El contenido que se está creando, recorrido como lo recorrerá quien lo estudie.
                { path: 'vista-colaborador', lazy: () => import('./aprendizaje/lms-creator/vista-colaborador/main') },
                // La dirección vieja redirige: un enlace compartido a «vista-estudiante» no puede morir (Dave, 8-oct).
                { path: 'vista-estudiante', loader: ({ request }) => redirect(`${new URL(request.url).pathname.replace('vista-estudiante', 'vista-colaborador')}${new URL(request.url).search}`) },
                // Lab del modal «Agregar video» (2-oct): se borra en cuanto Carlos elija una de las cinco.
                { path: 'lab-modal-video', lazy: () => import('./aprendizaje/lms-creator/lab-modal-video/main') },
                { path: 'categorias', lazy: () => import('./aprendizaje/lms-creator/categorias/main') },
                {
                  path: 'universidad-corporativa',
                  lazy: () => import('./aprendizaje/lms-creator/universidad-corporativa/main'),
                },
                { path: 'lms-ai', lazy: () => import('./aprendizaje/lms-creator/lms-ai/main') },
              ],
            },
            {
              path: 'planes-de-formacion',
              children: [
                { index: true, loader: () => redirect('/admin/aprendizaje/planes-de-formacion/planes') },
                { path: 'planes', lazy: () => import('./aprendizaje/planes-de-formacion/planes/main') },
                // Va antes del detalle para que «crear» no se lea como el id de un plan.
                { path: 'planes/crear', lazy: () => import('./aprendizaje/planes-de-formacion/planes/crear/main') },
                // Editar es la misma página que crear, con el plan cargado (auditoría del 5-oct: crear y editar en una
                // página con la barra fija abajo, nunca en un panel). Reemplaza al panel de edición del 30 sep.
                { path: 'planes/:id/editar', lazy: () => import('./aprendizaje/planes-de-formacion/planes/crear/main') },
                { path: 'planes/:id', lazy: () => import('./aprendizaje/planes-de-formacion/planes/detalle/main') },
                { path: 'grupos', lazy: () => import('./aprendizaje/planes-de-formacion/grupos/main') },
                // «crear» y «asistente» van antes del detalle para que no se lean como el id de un grupo.
                { path: 'grupos/crear', lazy: () => import('./aprendizaje/planes-de-formacion/grupos/formulario/main') },
                // El asistente de grupos ya no es una página: es el agente contextual de Grupos (28 sep).
                { path: 'grupos/asistente', loader: () => redirect('/admin/aprendizaje/planes-de-formacion/grupos') },
                // Como en UBITS, la página del grupo es su edición: no hay detalle aparte.
                { path: 'grupos/:id/editar', lazy: () => import('./aprendizaje/planes-de-formacion/grupos/formulario/main') },
                { path: 'grupos/:id', lazy: () => import('./aprendizaje/planes-de-formacion/grupos/formulario/main') },
              ],
            },
            {
              path: 'certificados',
              children: [
                { index: true, loader: () => redirect('/admin/aprendizaje/certificados/descarga') },
                { path: 'descarga', lazy: () => import('./aprendizaje/certificados/descarga/main') },
                { path: 'configuracion', lazy: () => import('./aprendizaje/certificados/configuracion/main') },
                // El correo que llega al confirmar una descarga, uno por modo (global, contenido, colaborador).
                { path: 'correo/:modo', lazy: () => import('./aprendizaje/certificados/correo/main') },
              ],
            },
            {
              path: 'diagnostico',
              children: [
                { index: true, lazy: () => import('./aprendizaje/diagnostico/main') },
                // Crear assessment: el asistente de tres pasos, en el mismo lenguaje que Crear contenido y Crear plan.
                { path: 'crear', lazy: () => import('./aprendizaje/diagnostico/crear/main') },
              ],
            },
            {
              path: 'reportes',
              lazy: () => import('./aprendizaje/reportes/main'),
            },
            {
              path: 'metricas',
              lazy: () => import('./aprendizaje/metricas/main'),
            },
          ],
        },
        {
          path: 'desempeno-cultura',
          children: [
            {
              index: true,
              lazy: () => import('./desempeno-cultura/main'),
            },
            {
              path: 'evaluaciones-360',
              lazy: () => import('./desempeno-cultura/evaluaciones-360/main'),
            },
            {
              path: 'objetivos',
              lazy: () => import('./desempeno-cultura/objetivos/main'),
            },
            // El constructor de ciclos, como el de encuestas: en blanco, desde una plantilla (llega en el estado de la
            // navegación) o para editar un ciclo que ya está en la lista.
            {
              path: 'objetivos/crear',
              lazy: () => import('./desempeno-cultura/objetivos/crear/main'),
            },
            {
              path: 'objetivos/:id/editar',
              lazy: () => import('./desempeno-cultura/objetivos/crear/main'),
            },
            {
              path: 'objetivos/:id/resultados',
              lazy: () => import('./desempeno-cultura/objetivos/resultados/main'),
            },
            {
              path: 'matriz-de-talento',
              lazy: () => import('./desempeno-cultura/matriz-de-talento/main'),
            },
            {
              path: 'pdi',
              lazy: () => import('./desempeno-cultura/pdi/main'),
            },
            {
              path: 'encuestas',
              lazy: () => import('./desempeno-cultura/encuestas/main'),
            },
            // El constructor: en blanco, desde una plantilla (llega en el estado de la navegación) o
            // para editar una encuesta que ya está en la lista.
            {
              path: 'encuestas/crear',
              lazy: () => import('./desempeno-cultura/encuestas/crear/main'),
            },
            {
              path: 'encuestas/:id/editar',
              lazy: () => import('./desempeno-cultura/encuestas/crear/main'),
            },
            {
              path: 'encuestas/:id/resultados',
              lazy: () => import('./desempeno-cultura/encuestas/resultados/main'),
            },
            {
              path: 'encuestas/comparativo',
              lazy: () => import('./desempeno-cultura/encuestas/comparativo/main'),
            },
          ],
        },
        {
          path: 'tareas',
          lazy: () => import('./tareas/main'),
        },
        // Crear una tarea o un plan es una página con la barra fija abajo, no un aviso de relleno (auditoría, 5-oct).
        { path: 'tareas/crear-tarea', lazy: () => import('./tareas/crear-tarea/main') },
        { path: 'tareas/crear-plan', lazy: () => import('./tareas/crear-plan/main') },
        {
          path: 'avisos-internos',
          children: [
            { index: true, lazy: () => import('./avisos-internos/main') },
            // Crear y editar son **una pantalla**, no un diálogo: el mismo formulario seccionado con la vista previa
            // a la derecha de Crear contenido y Crear ruta, sin pasos porque un aviso se llena de una (Dave, 2-oct).
            { path: 'crear', lazy: () => import('./avisos-internos/crear/main') },
            { path: ':id/editar', lazy: () => import('./avisos-internos/crear/main') },
          ],
        },
        // Configuración de la empresa (menú de empresa, no barra lateral).
        {
          path: 'configuracion',
          children: [
            { index: true, loader: () => redirect('/admin/configuracion/datos-empresa') },
            { path: 'datos-empresa', lazy: () => import('./configuracion/datos-empresa/main') },
            { path: 'personalizacion', lazy: () => import('./configuracion/personalizacion/main') },
          ],
        },
      ],
    },
    // Suite AI vive en su propia carpeta (src/modules/admin/suite-ai) y se monta aquí
    // mientras ingeniería lo registra como módulo independiente.
    suiteAiRoutes,
  ],
}
