import { redirect } from 'react-router'
import type { AppModule } from '@/shared/types/module'

export const designSystemModule: AppModule = {
  id: 'design-system',
  title: 'Design system',
  path: '/design-system',
  description: 'Documentación del sistema de diseño: fundamentos, componentes, bloques y templates.',
  nav: true,
  routes: [
    {
      path: 'design-system',
      children: [
        // Páginas de documentación: marco general del playground con el contenedor de 1.140 px (shell/main).
        {
          lazy: () => import('./shell/main'),
          children: [
            {
              index: true,
              lazy: () => import('./pages/DesignSystemPage'),
            },
            {
              path: 'get-started',
              lazy: () => import('./get-started/main'),
            },
            {
              path: 'trabajar-con-ia',
              lazy: () => import('./trabajar-con-ia/main'),
            },
            // El grafo del playground para la IA (7-oct): sale de ai-tools/grafo/generar-grafo.mjs.
            {
              path: 'grafo',
              lazy: () => import('./grafo/main'),
            },
            // Flujo de trabajo se juntó con Cómo usar el sistema (13-oct): repetían reglas y pasos.
            {
              path: 'flujo-de-trabajo',
              loader: () => redirect('/design-system/get-started#una-pantalla-nueva'),
            },
            {
              path: 'manifiesto',
              lazy: () => import('./manifiesto/main'),
            },
            {
              path: 'color',
              lazy: () => import('./color/main'),
            },
            {
              path: 'tipografia',
              lazy: () => import('./tipografia/main'),
            },
            {
              path: 'espacio',
              lazy: () => import('./espacio/main'),
            },
            // Ajustes propios dejó de ser pestaña de Marco (7-oct): sus piezas son fichas y el resto, Reglas globales.
            {
              path: 'marco/ajustes',
              loader: () => redirect('/design-system/componentes/reglas'),
            },
            {
              path: 'marco/:pestana?',
              lazy: () => import('./marco/main'),
            },
            {
              path: 'botones',
              lazy: () => import('./botones/main'),
            },
            {
              path: 'ajustes',
              loader: () => redirect('/design-system/componentes/reglas'),
            },
            {
              path: 'unificacion/:pestana?',
              lazy: () => import('./unificacion/main'),
            },
            {
              path: 'ia/:pestana?',
              lazy: () => import('./ia/main'),
            },
            {
              path: 'tarjeta-ia',
              lazy: () => import('./tarjeta-ia/main'),
            },
            {
              path: 'suite-ai-chat',
              lazy: () => import('./suite-ai-chat/main'),
            },
            // Componentes › Todos los componentes (7-oct): una página con cuatro pestañas y una ficha por pieza. Storybook
            // y Diferencias con la librería pasaron a ser pestañas; sus direcciones llevan allí.
            {
              path: 'componentes/ficha/:id',
              lazy: () => import('./componentes/ficha'),
            },
            {
              path: 'componentes/:pestana?',
              lazy: () => import('./componentes/todos'),
            },
            {
              path: 'storybook',
              loader: () => redirect('/design-system/componentes/flux'),
            },
            {
              path: 'estados',
              lazy: () => import('./estados/main'),
            },
            {
              path: 'data-grid',
              lazy: () => import('./data-grid/main'),
            },
            {
              path: 'formularios',
              lazy: () => import('./formularios/main'),
            },
            {
              path: 'metricas',
              lazy: () => import('./metricas/main'),
            },
            {
              path: 'diferencias',
              loader: () => redirect('/design-system/componentes/dev'),
            },
            {
              path: 'templates',
              lazy: () => import('./templates/main'),
            },
            {
              path: 'icons',
              lazy: () => import('./icons/main'),
            },
          ],
        },

        // Patrones de Nicolás: mismo marco general, pero cada página pone su propio contenedor (a veces
        // más ancho, 1.600 px, o angosto, 720 px), así que van fuera de shell/main.
        {
          path: 'drawers',
          lazy: () => import('./drawers/main'),
        },
        {
          path: 'modales',
          lazy: () => import('./modales/main'),
        },
        // Los dos configuradores del marco son pestañas de Marco; sus direcciones llevan allí.
        {
          path: 'barra-lateral',
          loader: () => redirect('/design-system/marco/barra-lateral'),
        },
        {
          path: 'header',
          loader: () => redirect('/design-system/marco/header'),
        },
        {
          path: 'navegacion',
          children: [
            { index: true, lazy: () => import('./navegacion/main') },
            { path: 'basica', lazy: () => import('./navegacion/basica/main') },
            { path: 'detalle', lazy: () => import('./navegacion/detalle/main') },
            { path: 'tablero', lazy: () => import('./navegacion/tablero/main') },
            { path: 'seleccion-masiva', lazy: () => import('./navegacion/seleccion-masiva/main') },
            { path: 'primer-uso', lazy: () => import('./navegacion/primer-uso/main') },
            { path: 'configuracion', lazy: () => import('./navegacion/configuracion/main') },
            { path: 'menu-horizontal', lazy: () => import('./navegacion/menu-horizontal/main') },
            { path: 'documento', lazy: () => import('./navegacion/documento/main') },
            { path: 'maestro-detalle', lazy: () => import('./navegacion/maestro-detalle/main') },
            { path: 'pasos', lazy: () => import('./navegacion/pasos/main') },
            { path: 'suite-ai', lazy: () => import('./navegacion/suite-ai/main') },
          ],
        },
        {
          path: 'agente-contextual',
          children: [
            { index: true, lazy: () => import('./agente-contextual/main') },
            { path: 'configurador', lazy: () => import('./agente-contextual/configurador/main') },
            { path: 'resumen-registro', lazy: () => import('./agente-contextual/resumen-registro/main') },
            { path: 'explicar-dato', lazy: () => import('./agente-contextual/explicar-dato/main') },
            { path: 'comparar', lazy: () => import('./agente-contextual/comparar/main') },
            { path: 'completar-formulario', lazy: () => import('./agente-contextual/completar-formulario/main') },
            { path: 'reescribir-seleccion', lazy: () => import('./agente-contextual/reescribir-seleccion/main') },
            { path: 'revision', lazy: () => import('./agente-contextual/revision/main') },
            { path: 'accion-masiva', lazy: () => import('./agente-contextual/accion-masiva/main') },
            { path: 'estados', lazy: () => import('./agente-contextual/estados/main') },
          ],
        },

        // Templates: cada uno trae su propio marco a pantalla completa, fuera del de documentación.
        {
          path: 'templates/auth',
          lazy: () => import('./templates/auth/main'),
        },
        {
          path: 'templates/app-shell-2',
          lazy: () => import('./templates/app-shell-2/main'),
        },
        {
          path: 'templates/app-shell-3',
          lazy: () => import('./templates/app-shell-3/main'),
        },
        {
          path: 'templates/dashboard',
          lazy: () => import('./templates/dashboard/main'),
        },
        {
          path: 'templates/dashboard-rrhh',
          lazy: () => import('./templates/dashboard-rrhh/main'),
        },
        // Template Home operativo: el inicio del administrador del concepto de producto. Las
        // entradas del menú sin template caen en «pendiente».
        {
          path: 'templates/home-operativo',
          lazy: () => import('./templates/home-operativo/main'),
          children: [
            { index: true, lazy: () => import('./templates/home-operativo/inicio/main') },
            { path: ':pantalla', lazy: () => import('./templates/home-operativo/pendiente/main') },
          ],
        },
        // Template Suite AI: el concepto de Nicolás (siete casos). Cada chat es una ruta; el modo
        // voz va a pantalla completa, fuera del marco, pero dentro del mismo estado del template.
        {
          path: 'templates/suite-ai',
          lazy: () => import('./templates/suite-ai/main'),
          children: [
            { index: true, lazy: () => import('./templates/suite-ai/inicio/main') },
            { path: 'vacantes', lazy: () => import('./templates/suite-ai/vacantes/main') },
            { path: 'editor', lazy: () => import('./templates/suite-ai/editor/main') },
            { path: 'voz', lazy: () => import('./templates/suite-ai/voz/main') },
            { path: 'chat', lazy: () => import('./templates/suite-ai/chat/main') },
            { path: 'chat/evaluaciones', lazy: () => import('./templates/suite-ai/propuesta/main') },
            { path: 'chat/vacaciones', lazy: () => import('./templates/suite-ai/aprobacion/main') },
            { path: 'chat/:id', lazy: () => import('./templates/suite-ai/conversacion/main') },
            { path: ':pantalla', lazy: () => import('./templates/suite-ai/pendiente/main') },
          ],
        },
        // Template «Home Suite AI»: el Home operativo dentro del marco del template Suite AI.
        { path: 'templates/home-suite-ai', lazy: () => import('./templates/home-suite-ai/main') },
        // Template Colaborador: recorrido «Estudiar un contenido asignado». La experiencia de
        // estudio va aparte porque es a pantalla completa, fuera del menú lateral.
        {
          path: 'templates/colaborador/estudio/:id',
          lazy: () => import('./templates/colaborador/estudio/main'),
        },
        {
          path: 'templates/colaborador',
          lazy: () => import('./templates/colaborador/main'),
          children: [
            { index: true, lazy: () => import('./templates/colaborador/inicio/main') },
            { path: 'catalogo', lazy: () => import('./templates/colaborador/catalogo/main') },
            { path: 'zona-de-estudio', lazy: () => import('./templates/colaborador/zona-de-estudio/main') },
            { path: 'progreso', lazy: () => import('./templates/colaborador/progreso/main') },
            { path: 'contenido/:id', lazy: () => import('./templates/colaborador/contenido/main') },
            { path: ':pantalla', lazy: () => import('./templates/colaborador/pendiente/main') },
          ],
        },
        // Templates que llevan los patrones (Estados, Data-grid, Formularios) a pantallas reales
        // del administrador. Comparten el marco del Home operativo (admin-compartido).
        // Estados a pantalla completa: los errores de sistema y las cargas sin tener que provocarlos.
        // Cada caso decide su propio marco, así que van sin layout común.
        {
          path: 'templates/estados',
          children: [
            { index: true, lazy: () => import('./templates/estados/indice') },
            { path: ':caso', lazy: () => import('./templates/estados/caso') },
          ],
        },
        {
          path: 'templates/gestion-usuarios',
          lazy: () => import('./templates/gestion-usuarios/main'),
          children: [
            { index: true, lazy: () => import('./templates/gestion-usuarios/lista/main') },
            { path: 'crear', lazy: () => import('./templates/gestion-usuarios/crear/main') },
            { path: 'editar/:id', lazy: () => import('./templates/gestion-usuarios/crear/main') },
            { path: 'carga-masiva/:accion', lazy: () => import('./templates/gestion-usuarios/carga-masiva/main') },
            { path: '*', lazy: () => import('./templates/admin-compartido/no-encontrada') },
          ],
        },
        {
          path: 'templates/planes-formacion',
          lazy: () => import('./templates/planes-formacion/main'),
          children: [
            { index: true, lazy: () => import('./templates/planes-formacion/lista/main') },
            { path: 'nuevo', lazy: () => import('./templates/planes-formacion/editor/main') },
            { path: ':id/editar', lazy: () => import('./templates/planes-formacion/editor/main') },
            { path: ':id', lazy: () => import('./templates/planes-formacion/detalle/main') },
            { path: '*', lazy: () => import('./templates/admin-compartido/no-encontrada') },
          ],
        },
        {
          path: 'templates/encuestas',
          lazy: () => import('./templates/encuestas/main'),
          children: [
            { index: true, lazy: () => import('./templates/encuestas/lista/main') },
            { path: 'nueva', lazy: () => import('./templates/encuestas/editor/main') },
            { path: ':id/editar', lazy: () => import('./templates/encuestas/editor/main') },
            { path: '*', lazy: () => import('./templates/admin-compartido/no-encontrada') },
          ],
        },
        {
          path: 'templates/shell-test',
          lazy: () => import('./templates/shell-test/main'),
        },
      ],
    },
  ],
}
