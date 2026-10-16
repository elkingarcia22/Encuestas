import type { AppModule } from '@/shared/types/module'

export const authModule: AppModule = {
  id: 'auth',
  title: 'Autenticación',
  path: '/auth',
  description: 'Pantallas de acceso: login, registro y recuperación de contraseña.',
  nav: true,
  routes: [
    {
      path: 'auth',
      lazy: () => import('./pages/AuthPage'),
    },
  ],
}
