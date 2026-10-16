import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowRight01Icon,
  File01Icon,
  Notification02Icon,
  PreferenceHorizontalIcon,
  RefreshIcon,
} from '@hugeicons/core-free-icons'
import { useNavigate } from 'react-router'
import { Badge, Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Heading, IconTile, Progress, useTheme } from '@ubits/flux-ui'
import promoBg from '@/shared/assets/promo-seleccion.jpg'
import { Orb } from './Orb'
import { PROMO_BULLETS, PROMO_NEWS, PROMO_STEPS } from './shell-data'
import { notify } from './notify'
import { CloseButton } from '@/shared/components/CloseButton'
import { BotonIcono } from '@/shared/components/BotonIcono'

type AnnouncementProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// 1 · Lanzamiento de feature: el agente ya ejecuta en Selección. Copia del prototipo:
// ilustración con dos tarjetas, «Nuevo», título, tres puntos y dos acciones.
export function FeatureDialog({ open, onOpenChange }: AnnouncementProps) {
  const navigate = useNavigate()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* Entrada como en el prototipo: aparece, sube 10px y crece con un rebote suave (~300ms). */}
      <DialogContent
        showCloseButton={false}
        className="gap-0! overflow-hidden p-0! duration-300! ease-[cubic-bezier(0.22,1.2,0.36,1)]! slide-in-from-bottom-[10px] sm:max-w-129!"
      >
        <div className="relative h-53 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${promoBg})` }}>
          <div className="absolute inset-x-8.5 top-9.5 flex items-center gap-3.5">
            <div className="w-37.5 shrink-0 rounded-xl bg-card/95 p-3 shadow-xl">
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Vacante</p>
              <p className="mt-1 text-sm font-medium">Analista de datos</p>
              <Progress
                value={64}
                aria-label="Avance de la vacante"
                className="mt-2"
              />
            </div>
            {/* El orbe, no una estrella dibujada: es la única marca de la IA (auditoría, 5-oct). */}
            <span className="flex size-8.5 shrink-0 items-center justify-center rounded-full bg-card shadow-lg">
              <Orb className="size-5" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl bg-card/95 px-3.5 py-3 shadow-xl">
              <div className="flex items-center gap-2">
                <Orb className="size-6" />
                <span className="text-sm">
                  Moví 12 candidatos a <span className="font-medium">Entrevistas</span>
                </span>
              </div>
              <div className="mt-2 flex gap-2">
                <Badge variant="secondary" size="xs">Hecho</Badge>
                <Badge variant="secondary" size="xs">Sin correos</Badge>
              </div>
            </div>
          </div>
          {/* Cerrar sobre la ilustración con la pastilla común de cerrar. */}
          <CloseButton label="Cerrar" className="absolute top-4 right-4" onClick={() => onOpenChange(false)} />
        </div>

        <div className="px-7 pt-6.5 pb-5.5">
          <DialogHeader className="gap-0!">
            <Badge variant="secondary" className="w-fit tracking-wider uppercase">
              <Orb className="size-3" />
              Nuevo
            </Badge>
            <DialogTitle render={<Heading as="h2" level={3} />} className="mt-3.5">
              El agente ya ejecuta en Selección
            </DialogTitle>
            <DialogDescription className="sr-only">
              Pídele tareas con efecto real y revisa el impacto antes de confirmar.
            </DialogDescription>
          </DialogHeader>
          <ul className="mt-5 flex flex-col gap-4">
            {PROMO_BULLETS.map((b) => (
              <li key={b.text} className="flex items-start gap-3">
                <IconTile variant="solid" className="size-7.5! rounded-lg! bg-muted! text-foreground/75! [--icon-tile-icon-size:16px]">
                  <HugeiconsIcon icon={b.icon} size={16} />
                </IconTile>
                <span className="flex-1 text-base leading-normal text-pretty text-foreground/75">{b.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className="flex-row! gap-3! px-7 pt-4 pb-6">
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Después
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={() => {
              onOpenChange(false)
              navigate('/admin/seleccion/exploraciones/uno')
              notify('Selección · el agente ya puede actuar aquí')
            }}
          >
            Probarlo en Selección
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Entrada común de los anuncios, como en el prototipo: sube 10px y crece con un rebote suave (~300ms).
const ENTER = 'duration-300! ease-[cubic-bezier(0.22,1.2,0.36,1)]! slide-in-from-bottom-[10px]'

// 2 · Novedades del release (prototipo «Lo que cambió esta semana»): versión, tres mejoras y pie gris.
export function ChangelogDialog({ open, onOpenChange }: AnnouncementProps) {
  const close = () => onOpenChange(false)
  const navigate = useNavigate()
  const { setMode } = useTheme()

  // Cada novedad lleva a su funcionalidad (1 oct): Selección abre Vacantes, el tema oscuro se prende y el Centro de
  // procesos, que no tiene pantalla propia, dice dónde abrirlo.
  const abrir = (titulo: string) => {
    close()
    if (titulo === 'Acciones en vacantes') navigate('/admin/seleccion/vacantes')
    else if (titulo === 'Tema oscuro') setMode('dark')
    else notify('El centro de procesos se abre desde Notificaciones')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={`flex! max-h-[72vh] flex-col gap-0! overflow-hidden p-0! sm:max-w-130! ${ENTER}`}
      >
        <div className="relative overflow-hidden border-b px-6.5 pt-6 pb-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-20 -right-10 h-42.5 w-55 rounded-full bg-radial-[closest-side] from-primary/20 to-transparent blur-lg"
          />
          <div className="relative flex items-center gap-2">
            <Badge className="tracking-wider">v4.2</Badge>
            <span className="tabular-nums text-xs text-muted-foreground">11 SEP 2026</span>
            <CloseButton label="Cerrar" className="ml-auto" onClick={close} />
          </div>
          <DialogTitle render={<Heading as="h2" level={3} />} className="relative mt-3">
            Lo que cambió esta semana
          </DialogTitle>
          {/* 4px del título a su bajada, como en todo el sistema. */}
          <DialogDescription className="relative mt-1! text-sm leading-normal">
            Tres mejoras pensadas para que no tengas que revisar todo a mano.
          </DialogDescription>
        </div>

        <ul className="min-h-0 flex-1 overflow-auto">
          {PROMO_NEWS.map((n) => (
            // Toda la fila responde (1 oct): se tiñe al pasar el cursor con el gris de resaltado de los menús y la flecha avanza. El control sigue siendo el
            // botón de la flecha, que se estira sobre la fila para que el clic caiga en cualquier punto.
            <li
              key={n.title}
              className="group/novedad relative flex gap-3 border-b px-6.5 py-4.5 transition-colors last:border-b-0 hover:bg-accent has-focus-visible:bg-accent"
            >
              <IconTile variant="solid" className="size-8.5! rounded-md! bg-muted! text-foreground/75! [--icon-tile-icon-size:17px]">
                <HugeiconsIcon icon={n.icon} size={17} />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">{n.title}</span>
                  <Badge variant="secondary" size="xs" className="tracking-wider uppercase">{n.tag}</Badge>
                </div>
                <p className="text-sm leading-normal text-pretty text-muted-foreground">{n.text}</p>
              </div>
              <BotonIcono
                aria-label={`Ir a ${n.title}`}
                className="self-center after:absolute after:inset-0 after:content-['']"
                onClick={() => abrir(n.title)}
              >
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  className="transition-transform duration-200 group-hover/novedad:translate-x-0.5 motion-reduce:transition-none"
                />
              </BotonIcono>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-3 border-t bg-muted px-6.5 py-4">
          <span className="flex-1 text-xs text-muted-foreground">Se publican los jueves</span>
          <Button
            variant="outline"
            onClick={() => {
              close()
              notify('Historial completo de novedades')
            }}
          >
            Ver historial
          </Button>
          <Button onClick={close}>
            Entendido
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// 3 · Bienvenida (prototipo «Tus procesos ahora corren solos»): ilustración de procesos a la izquierda,
// pasos numerados a la derecha.
export function WelcomeDialog({ open, onOpenChange }: AnnouncementProps) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={`flex! gap-0! overflow-hidden p-0! sm:max-w-190! ${ENTER}`}
      >
        <div className="relative hidden w-78 shrink-0 overflow-hidden border-r bg-muted px-6 py-7 md:block">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-22.5 -left-12.5 h-50 w-65 rounded-full bg-radial-[closest-side] from-primary/15 to-transparent blur-xl"
          />
          <div className="relative flex flex-col gap-2">
            <div className="rounded-xl border bg-card px-3.25 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={RefreshIcon} size={15} />
                <span className="flex-1 text-sm font-medium">Importación</span>
                <span className="tabular-nums text-xs text-muted-foreground">78%</span>
              </div>
              <Progress
                value={78}
                aria-label="Importación"
                className="mt-2"
              />
            </div>
            <div className="ml-5.5 rounded-xl border bg-card px-3.25 py-3 shadow-lg">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={File01Icon} size={15} />
                <span className="flex-1 text-sm font-medium">Revisión</span>
                <span className="text-xs font-medium">Retomar</span>
              </div>
              <p className="mt-1! text-xs text-muted-foreground">10 de 33 listos</p>
            </div>
            <div className="mt-1 flex items-center gap-2 self-start rounded-full bg-foreground p-1.5 text-background">
              <span className="flex size-6.5 items-center justify-center">
                <HugeiconsIcon icon={PreferenceHorizontalIcon} size={14} />
              </span>
              <span className="flex size-6.5 items-center justify-center">
                <HugeiconsIcon icon={Notification02Icon} size={14} />
              </span>
              <span className="flex h-6.5 items-center rounded-full bg-background px-3 text-xs font-medium text-foreground">
                Nuevo
              </span>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center gap-2 px-7 pt-7">
            <span className="text-xs font-medium tracking-widest text-muted-foreground uppercase">Paso 1 de 3</span>
            <div className="flex flex-1 gap-1">
              <span className="h-0.75 flex-1 rounded-full bg-foreground" />
              <span className="h-0.75 flex-1 rounded-full bg-border" />
              <span className="h-0.75 flex-1 rounded-full bg-border" />
            </div>
            <CloseButton label="Cerrar" onClick={close} />
          </div>

          <div className="px-7 pt-4">
            <DialogTitle render={<Heading as="h2" level={3} />}>
              Tus procesos ahora corren solos
            </DialogTitle>
            <DialogDescription className="mt-2! text-base leading-relaxed text-pretty">
              Cierra el chat cuando quieras: el centro de procesos sigue trabajando y te avisa al terminar.
            </DialogDescription>
            <ol className="mt-5.5 flex flex-col gap-4">
              {PROMO_STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-3">
                  <span className="flex size-6.5 shrink-0 items-center justify-center rounded-full bg-primary tabular-nums text-xs text-primary-foreground">
                    {s.n}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-0.75">
                    <span className="text-base font-medium">{s.title}</span>
                    <span className="text-sm leading-normal text-pretty text-muted-foreground">{s.text}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-auto flex items-center gap-3 px-7 pt-6 pb-6.5">
            <Button variant="link" className="h-auto! p-0! font-normal text-muted-foreground" onClick={close}>
              Saltar el recorrido
            </Button>
            <Button
              size="lg"
              className="ml-auto"
              onClick={() => {
                close()
                notify('Centro de procesos')
              }}
            >
              Empezar
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
