import type { RouteObject } from 'react-router'

// Rutas de Suite AI. Se montan desde el módulo admin (src/modules/admin/routes.ts)
// para no tocar src/app/register-modules.ts, que es andamiaje de ingeniería.
// Cuando ingeniería lo registre como módulo propio, basta con moverlas allá.
export const suiteAiRoutes: RouteObject = {
  path: 'suite-ai',
  children: [
    {
      index: true,
      lazy: () => import('./chat/main'),
    },
    {
      path: 'chat/:convo',
      lazy: () => import('./chat/main'),
    },
    {
      path: 'voz',
      lazy: () => import('./voz/main'),
    },
  ],
}
