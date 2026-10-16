import { adminModule } from '@/modules/admin/routes'
import { authModule } from '@/modules/auth/routes'
import { designSystemModule } from '@/modules/design-system/routes'
import { portalColaboradorModule } from '@/modules/portal-colaborador/routes'
import type { AppModule } from '@/shared/types/module'

export const appModules: AppModule[] = [
  authModule,
  portalColaboradorModule,
  adminModule,
  designSystemModule,
]
