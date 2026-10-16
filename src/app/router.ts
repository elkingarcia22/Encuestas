import { createBrowserRouter } from 'react-router'
import { appModules } from '@/app/register-modules'

// La pantalla de login vive fuera del layout con sidebar: se sirve directo,
// sin RootLayout, tanto en "/" como en "/auth".
const shellModules = appModules.filter((mod) => mod.id !== 'auth')

export const router = createBrowserRouter([
  {
    index: true,
    lazy: () => import('@/modules/auth/pages/AuthPage'),
  },
  {
    path: 'auth',
    lazy: () => import('@/modules/auth/pages/AuthPage'),
  },
  {
    path: '/',
    lazy: () => import('@/shared/layouts/RootLayout'),
    children: [
      ...shellModules.flatMap((mod) => mod.routes),
      {
        path: '*',
        lazy: () => import('@/shared/pages/NotFoundPage'),
      },
    ],
  },
])
