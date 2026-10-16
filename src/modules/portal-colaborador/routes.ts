import type { AppModule } from '@/shared/types/module'

export const portalColaboradorModule: AppModule = {
  id: 'portal-colaborador',
  title: 'Portal colaborador',
  path: '/portal-colaborador',
  description: 'Portal del colaborador: aprendizaje, desempeño y cultura, y tareas.',
  nav: true,
  routes: [
    {
      path: 'portal-colaborador',
      children: [
        {
          index: true,
          lazy: () => import('./pages/PortalColaboradorPage'),
        },
        {
          path: 'aprendizaje',
          children: [
            {
              index: true,
              lazy: () => import('./aprendizaje/main'),
            },
            {
              path: 'modo-estudio-ai',
              lazy: () => import('./aprendizaje/modo-estudio-ai/main'),
            },
            {
              path: 'catalogo',
              lazy: () => import('./aprendizaje/catalogo/main'),
            },
            {
              path: 'universidad-corporativa',
              lazy: () => import('./aprendizaje/universidad-corporativa/main'),
            },
            {
              path: 'zona-de-estudio',
              lazy: () => import('./aprendizaje/zona-de-estudio/main'),
            },
            {
              path: 'progreso',
              lazy: () => import('./aprendizaje/progreso/main'),
            },
            {
              // El correo que reciben las personas del equipo cuando la líder les envía el recordatorio de estudio.
              path: 'progreso/correo-recordatorio',
              lazy: () => import('./aprendizaje/progreso/correo-recordatorio/main'),
            },
            {
              path: 'metricas',
              lazy: () => import('./aprendizaje/metricas/main'),
            },
            {
              path: 'diagnostico',
              lazy: () => import('./aprendizaje/diagnostico/main'),
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
            {
              path: 'matriz-de-talento',
              lazy: () => import('./desempeno-cultura/matriz-de-talento/main'),
            },
            {
              path: 'encuestas',
              lazy: () => import('./desempeno-cultura/encuestas/main'),
            },
          ],
        },
        {
          path: 'tareas',
          lazy: () => import('./tareas/main'),
        },
      ],
    },
  ],
}
