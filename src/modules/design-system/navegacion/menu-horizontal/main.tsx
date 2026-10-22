import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, ArrowRight01Icon, ViewIcon } from '@hugeicons/core-free-icons'
import { Orb } from '@/shared/components/Orb'
import { ICONO_IA } from '@/shared/layouts/nav-config'
import {
  Badge,
  Button,
  Card,
  IconTile,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { PageContent, PageHeader, PageSection, PageShell } from '@/shared/components/PageShell'
import { Indicadores } from '../../metricas/cifras'
import { WS } from '../../drawers/components/drawer-styles'
import { CaseFrame } from '../components/case-frame'
import { LEAVES, MENU, SUMMARIES } from './components/data'

// Patrón · Menú horizontal: la navegación del producto va arriba con submenús, en lugar de un tercer
// nivel en la barra lateral.
export function Component() {
  const [active, setActive] = useState('cursos')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const leaf = LEAVES.find((item) => item.value === active) ?? LEAVES[0]
  const parent = MENU.find((entry) => entry.value === leaf.parent)
  const summary = SUMMARIES[leaf.value]

  const choose = (value: string) => {
    setActive(value)
    setOpenMenu(null)
  }

  const crumbs = [
    { label: 'Inicio', path: '/admin' },
    { label: 'Aprendizaje' },
    ...(parent?.links ? [{ label: parent.label }] : []),
    { label: leaf.title },
  ]

  return (
    <CaseFrame title="Menú horizontal" hint="Submenús del producto arriba, como alternativa al tercer nivel de la barra lateral">
      <PageShell>
        <PageHeader
          tabsRegion="Menú del producto"
          breadcrumbs={crumbs}
          kicker="Producto"
          title="Aprendizaje"
          description="Cursos, planes de formación y certificados de Meta Colombia."
          actions={
            <Button variant="outline" className={WS} onClick={() => notify('Vista del colaborador', undefined, 'info')}>
              <HugeiconsIcon icon={ViewIcon} size={16} />
              Ver como colaborador
            </Button>
          }
          tabs={
            <div className="border-b">
              <NavigationMenu value={openMenu} onValueChange={(value) => setOpenMenu((value as string | null) ?? null)}>
                <NavigationMenuList className="gap-1">
                  {MENU.map((entry) => (
                    <NavigationMenuItem key={entry.value} value={entry.value}>
                      {entry.links ? (
                        <>
                          <NavigationMenuTrigger>{entry.label}</NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="grid w-140 grid-cols-2 gap-1 p-1">
                              {entry.links.map((link) => (
                                <NavigationMenuLink
                                  key={link.value}
                                  render={<button type="button" />}
                                  active={active === link.value}
                                  onClick={() => choose(link.value)}
                                  className="flex w-full cursor-pointer items-start gap-3 text-left"
                                >
                                  <IconTile variant="soft" size="sm">
                                    {link.icon === ICONO_IA ? <Orb className="size-4" /> : <HugeiconsIcon icon={link.icon} />}
                                  </IconTile>
                                  <span className="flex min-w-0 flex-col gap-1">
                                    <span className="text-sm font-medium">{link.title}</span>
                                    <span className="text-sm text-muted-foreground">{link.description}</span>
                                  </span>
                                </NavigationMenuLink>
                              ))}
                            </div>
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink
                          render={<button type="button" />}
                          active={active === entry.value}
                          onClick={() => choose(entry.value)}
                          className={navigationMenuTriggerStyle()}
                        >
                          {entry.label}
                        </NavigationMenuLink>
                      )}
                      {leaf.parent === entry.value ? (
                        <span aria-hidden className="pointer-events-none absolute inset-x-2.5 -bottom-px h-0.5 rounded-full bg-primary" />
                      ) : null}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>
          }
        />

        <PageContent>
          <PageSection
            title={leaf.title}
            description={summary.description}
            actions={
              <Button className={WS} onClick={() => notify(summary.cta, undefined, 'info')}>
                <HugeiconsIcon icon={Add01Icon} size={16} />
                {summary.cta}
              </Button>
            }
          >
            {/* Las cifras van en la fila partida del sistema, sin variación (decisión 11 de la auditoría). */}
            <Indicadores
              cifras={summary.stats.map((stat) => ({ etiqueta: stat.label, valor: stat.value, detalle: stat.note }))}
              columnas="sm:grid-cols-3"
            />

            <Card className="gap-0! py-0!">
              <div className="flex flex-col divide-y">
                {summary.rows.map((row) => (
                  <Button
                    key={row.title}
                    variant="ghost"
                    // El botón de la librería como superficie de la fila: se le quitan alto, filo y relleno propios
                    // para que la fila mida lo que pide su contenido. 12px de la baldosa al texto, como en el resto.
                    className="h-auto! w-full items-center! justify-start! gap-3! rounded-none! border-0! px-5! py-3.5! text-left font-normal! whitespace-normal! hover:bg-muted/60!"
                    onClick={() => notify(`Abrir «${row.title}»`, undefined, 'info')}
                  >
                    <IconTile variant="soft" size="sm">
                      {leaf.icon === ICONO_IA ? <Orb className="size-4" /> : <HugeiconsIcon icon={leaf.icon} />}
                    </IconTile>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="truncate text-sm font-medium">{row.title}</span>
                      <span className="truncate text-sm text-muted-foreground">{row.meta}</span>
                    </span>
                    <Badge variant="outline" className="font-normal">
                      {row.status}
                    </Badge>
                    <HugeiconsIcon icon={ArrowRight01Icon} size={16} className="text-muted-foreground" />
                  </Button>
                ))}
              </div>
            </Card>
          </PageSection>
        </PageContent>

      </PageShell>
    </CaseFrame>
  )
}

Component.displayName = 'NavigationMenuPage'
