import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  Cancel01Icon,
  FileImportIcon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  cn,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { ETAPAS } from '../../vacantes/detalle/components/data'
import { CANDIDATURAS, ESPERA_RESPUESTA, cumplidosDe, type Candidatura , tituloEtapa, VACANTES_UI } from '../datos'
import { DialogoRechazo } from '../components/dialogo-rechazo'
import { FichaPersona } from '../components/ficha-persona'
import { ImportarCvs } from '../components/importar-cvs'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'

// Propuesta 2 · El tablero de la vacante.
//
// La vacante abre en su embudo: se ve de un vistazo cuánta gente hay en cada etapa y qué está parado. La clave es que
// el tablero NO crece sin límite: cada columna muestra 10 y el resto se abre en la lista, como hace Greenhouse (y
// Teamtailor con 8). Con 300 candidatos un tablero completo es inmanejable.
//
// Los CVs importados caen en la primera columna y se ven aparecer (decisión de Nicolás, 21 sep).

const TOPE_COLUMNA = 10

function TarjetaCandidatura({
  candidatura,
  onAbrir,
  onAvanzar,
  onRechazar,
}: {
  candidatura: Candidatura
  onAbrir: () => void
  onAvanzar: () => void
  onRechazar: () => void
}) {
  const { candidato, criterios, dias } = candidatura
  const espera = ESPERA_RESPUESTA(candidatura)

  return (
    <Item variant="outline" size="sm" render={<li />} className="group/tarjeta cursor-pointer items-start!" onClick={onAbrir}>
      <ItemMedia>
        <Avatar>
          <AvatarFallback>{candidato.iniciales}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0! gap-1!">
        <ItemTitle className="w-full!">
          <span className="min-w-0 flex-1 truncate">{candidato.nombre}</span>
          <span className="shrink-0 text-sm font-medium tabular-nums">
            {cumplidosDe(criterios)}/{criterios.length}
          </span>
        </ItemTitle>
        <ItemDescription className="w-full!">
          <span className="truncate">{candidato.cargo}</span>
        </ItemDescription>
        <ItemDescription className="w-full!">
          <span className="flex items-center gap-1.5 truncate text-xs">
            {espera ? <HugeiconsIcon icon={Alert02Icon} size={13} className="shrink-0 text-warning" /> : null}
            <span className="truncate">{espera ? candidato.accion : `${dias} ${dias === 1 ? 'día' : 'días'} en la etapa`}</span>
          </span>
        </ItemDescription>
        {/* Las dos acciones aparecen al pasar el cursor: la tarjeta se mantiene limpia. */}
        <div
          className="mt-1 flex w-full gap-1.5 opacity-0 transition-opacity group-hover/tarjeta:opacity-100 focus-within:opacity-100"
          onClick={(event) => event.stopPropagation()}
        >
          <Button variant="outline" size="xs" className="flex-1" onClick={onAvanzar}>
            Avanzar
            <HugeiconsIcon icon={ArrowRight01Icon} size={13} />
          </Button>
          <Button variant="outline" size="icon-xs" aria-label={`Rechazar a ${candidato.nombre}`} onClick={onRechazar}>
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </Button>
        </div>
      </ItemContent>
    </Item>
  )
}

export function Component() {
  const [vacanteId, setVacanteId] = useState(VACANTES_UI[0].id)
  const [lista, setLista] = useState<Candidatura[]>(CANDIDATURAS)
  const [abiertaId, setAbiertaId] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState<Candidatura[] | null>(null)
  const [importando, setImportando] = useState(false)
  const [verTodas, setVerTodas] = useState<string | null>(null)

  const vacante = VACANTES_UI.find((v) => v.id === vacanteId) ?? VACANTES_UI[0]
  const deLaVacante = useMemo(() => lista.filter((c) => c.vacante.id === vacanteId), [lista, vacanteId])
  const abierta = lista.find((c) => c.id === abiertaId) ?? null

  const porEtapa = (etapa: string) =>
    deLaVacante
      .filter((c) => c.etapa === etapa)
      .sort((a, b) => Number(ESPERA_RESPUESTA(b)) - Number(ESPERA_RESPUESTA(a)) || b.dias - a.dias)

  const mover = (id: string, etapa: string) => setLista((actual) => actual.map((c) => (c.id === id ? { ...c, etapa, dias: 0 } : c)))

  const avanzar = (candidatura: Candidatura) => {
    const indice = ETAPAS.findIndex((e) => e.id === candidatura.etapa)
    const destino = indice < ETAPAS.length - 1 ? ETAPAS[indice + 1].id : null
    if (!destino) return
    const antes = candidatura.etapa
    mover(candidatura.id, destino)
    notifyAction(`${candidatura.candidato.nombre} pasó a ${tituloEtapa(destino)}`, 'Nadie recibe correo por este cambio.', {
      label: 'Deshacer',
      onClick: () => mover(candidatura.id, antes),
    })
  }

  const rechazar = (motivo: string, avisar: boolean) => {
    const ids = (rechazando ?? []).map((c) => c.id)
    setLista((actual) => actual.filter((c) => !ids.includes(c.id)))
    notify(`${rechazando?.[0].candidato.nombre} quedó rechazado`, `${motivo}. ${avisar ? 'El correo ya salió.' : 'Sin correo.'}`)
    setRechazando(null)
    if (ids.includes(abiertaId ?? '')) setAbiertaId(null)
  }

  // Los CVs importados entran como candidaturas nuevas en la primera etapa del flujo.
  const recibirImportados = (nuevas: Candidatura[]) => {
    setLista((actual) => [...nuevas, ...actual])
    notify(`${nuevas.length} candidatos entraron a ${tituloEtapa(ETAPAS[0].id)}`, 'Están marcados como recién importados.')
  }

  const enTablero = verTodas ? porEtapa(verTodas) : []

  return (
    <PageShell width="full">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección', path: '/admin/seleccion/vacantes' },
          { label: 'Tablero' },
        ]}
        title={vacante.titulo}
        description="El embudo de la vacante: cada columna muestra a quién le toca algo primero."
        actions={
          <>
            <Select value={vacanteId} onValueChange={(valor) => setVacanteId(valor as string)}>
              <SelectTrigger className="w-56">
                <SelectValue>{(valor: string) => VACANTES_UI.find((v) => v.id === valor)?.titulo ?? valor}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {VACANTES_UI.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => setImportando(true)}>
              <HugeiconsIcon icon={FileImportIcon} size={16} />
              Importar CVs
            </Button>
            <Button onClick={() => notify('Agregar candidato')}>
              <HugeiconsIcon icon={UserAdd01Icon} size={16} />
              Agregar candidato
            </Button>
          </>
        }
      />

      <PageContent className="min-h-0">
        <ScrollArea className="w-full">
          <div className="flex min-h-[34rem] items-stretch gap-4 pb-4">
            {ETAPAS.map((etapa, indice) => {
              const todas = porEtapa(etapa.id)
              const visibles = todas.slice(0, TOPE_COLUMNA)
              const esperan = todas.filter(ESPERA_RESPUESTA).length

              return (
                <div key={etapa.id} className="flex w-72 shrink-0 flex-col gap-3 rounded-xl border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant="secondary" className="mt-0.5 shrink-0 tabular-nums">
                      {indice + 1}
                    </Badge>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-1.5">
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">{etapa.titulo}</span>
                        {etapa.ia ? <IconoIA className="size-3.5" /> : null}
                        <span className="shrink-0 text-sm font-medium tabular-nums">{todas.length}</span>
                      </span>
                      {esperan ? (
                        <span className="flex items-center gap-1 text-xs text-warning">
                          <HugeiconsIcon icon={Alert02Icon} size={12} />
                          {esperan} {esperan === 1 ? 'espera respuesta' : 'esperan respuesta'}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <ItemGroup className="gap-2!">
                    {visibles.map((candidatura) => (
                      <TarjetaCandidatura
                        key={candidatura.id}
                        candidatura={candidatura}
                        onAbrir={() => setAbiertaId(candidatura.id)}
                        onAvanzar={() => avanzar(candidatura)}
                        onRechazar={() => setRechazando([candidatura])}
                      />
                    ))}
                  </ItemGroup>

                  {/* El tablero no crece sin fin: a partir de 10 se abre la lista de esa etapa. */}
                  {todas.length > TOPE_COLUMNA ? (
                    <Button variant="ghost" size="sm" className="justify-start text-muted-foreground!" onClick={() => setVerTodas(etapa.id)}>
                      Ver las {todas.length} de esta etapa
                      <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
                    </Button>
                  ) : null}

                  {!todas.length ? (
                    <Text as="p" variant="muted" size="sm" className="px-1 py-6 text-center">
                      Nadie en esta etapa
                    </Text>
                  ) : null}
                </div>
              )
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        <Text as="p" variant="muted" size="xs">
          Cada columna muestra {TOPE_COLUMNA} personas: primero quien espera una respuesta y, dentro, quien lleva más días
          parado. Con más de {TOPE_COLUMNA} el tablero deja de servir para trabajar, así que el resto se abre en lista.
        </Text>
      </PageContent>

      {/* La ficha, en panel lateral: el tablero no se pierde */}
      <Drawer open={abierta !== null} onOpenChange={(abiertoAhora) => !abiertoAhora && setAbiertaId(null)}>
        <DrawerContent className="w-[min(34rem,100vw)]!">
          {abierta ? (
            <FichaPersona
              candidatura={abierta}
              onAvanzar={() => {
                avanzar(abierta)
                setAbiertaId(null)
              }}
              onRechazar={() => setRechazando([abierta])}
              onIrA={(id) => setAbiertaId(id)}
            />
          ) : null}
        </DrawerContent>
      </Drawer>

      {/* La lista completa de una etapa, cuando pasa del tope */}
      <Drawer open={verTodas !== null} onOpenChange={(abiertoAhora) => !abiertoAhora && setVerTodas(null)}>
        <DrawerContent className="w-[min(34rem,100vw)]!">
          <DrawerHeader>
            <DrawerTitle>{verTodas ? tituloEtapa(verTodas) : ''}</DrawerTitle>
            <DrawerDescription>{enTablero.length} personas en esta etapa, en orden de urgencia.</DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <ItemGroup className="gap-2!">
              {enTablero.map((candidatura) => (
                <Item
                  key={candidatura.id}
                  variant="outline"
                  size="sm"
                  className={cn('cursor-pointer')}
                  onClick={() => {
                    setVerTodas(null)
                    setAbiertaId(candidatura.id)
                  }}
                >
                  <ItemMedia>
                    <Avatar>
                      <AvatarFallback>{candidatura.candidato.iniciales}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{candidatura.candidato.nombre}</ItemTitle>
                    <ItemDescription>
                      {candidatura.candidato.cargo} · {candidatura.dias} {candidatura.dias === 1 ? 'día' : 'días'}
                    </ItemDescription>
                  </ItemContent>
                </Item>
              ))}
            </ItemGroup>
          </div>
        </DrawerContent>
      </Drawer>

      <ImportarCvs
        abierto={importando}
        onOpenChange={setImportando}
        vacante={vacante}
        onListo={recibirImportados}
      />

      {rechazando?.length ? (
        <DialogoRechazo
          key={rechazando.map((c) => c.id).join()}
          abierto
          onOpenChange={(abiertoAhora) => setRechazando(abiertoAhora ? rechazando : null)}
          pedido={{ id: 0, candidaturas: rechazando }}
          vacante={rechazando[0].vacante}
          lista={lista}
          onConfirmar={(decision) => rechazar(decision.motivo, Boolean(decision.correo))}
        />
      ) : null}
    </PageShell>
  )
}

Component.displayName = 'SeleccionTableroPage'
