import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, SidebarTrigger } from '@ubits/flux-ui'

import { useNavigation } from './use-navigation'

export function AppHeader() {
  const { activePath } = useNavigation()

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 pt-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 pr-4 pl-2">
        <SidebarTrigger className="-ml-1 flex opacity-60 hover:opacity-100" />
        <Breadcrumb>
          <BreadcrumbList>
            {activePath.sectionLabel && (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">{activePath.sectionLabel}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{activePath.label}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
