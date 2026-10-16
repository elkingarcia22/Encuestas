import type { RouteObject } from 'react-router'

export type AppModule = {
  id: string
  title: string
  path: string
  description: string
  nav?: boolean
  routes: RouteObject[]
}
