import { useEffect, useMemo, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Alert02Icon,
  ArrowRight01Icon,
  Briefcase06Icon,
  Cancel01Icon,
  FileImportIcon,
  Search01Icon,
  UserAdd01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Checkbox,
  FloatingActionBar,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Kbd,
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { notify, notifyAction } from '@/shared/components/notify'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { ETAPAS } from '../../vacantes/detalle/components/data'
import { CANDIDATURAS, ESPERA_RESPUESTA, ORIGENES, cumplidosDe, type Candidatura , tituloEtapa, VACANTES_UI } from '../datos'
import { DialogoRechazo } from '../components/dialogo-rechazo'
import { FichaPersona } from '../components/ficha-persona'
import { AvatarEsqueleto, Esqueleto, LineaEsqueleto, useCarga } from '../components/carga'
import { FiltroChip } from '../components/filtro-chip'

// Propuesta 1 · Bandeja de revisión.
//
// La unidad de trabajo es la persona, no la vacante: una sola lista filtrable con la ficha al lado, para revisar a
// muchos seguidos sin ir y volver. El tablero de la vacante sigue existiendo como otra forma de mirar lo mismo.
//
// Se trabaja como un gestor de correo: se baja por la lista con el teclado, se avanza o se rechaza, y avanzar se
// puede deshacer. Referencias: la cola de revisión de Greenhouse (atajos S/Y/N/D y flechas) y la lista de Workable.

type Filtro = {
  vacante: string
  etapa: string
  origen: string
  busqueda: string
  soloEspera: boolean
}

const VACIO: Filtro = { vacante: 'todas', etapa: 'todas', origen: 'todos', busqueda: '', soloEspera: false }

// Siguiente etapa del flujo; la última no avanza.
const siguienteEtapa = (etapa: string): string | null => {
  const indice = ETAPAS.findIndex((e) => e.id === etapa)
  return indice >= 0 && indice < ETAPAS.length - 1 ? ETAPAS[indice + 1].id : null
}

function FilaCandidatura({
  candidatura,
  activa,
  marcada,
  onAbrir,
  onMarcar,
}: {
  candidatura: Candidatura
  activa: boolean
  marcada: boolean
  onAbrir: () => void
  onMarcar: (marcada: boolean) => void
}) {
  const { candidato, vacante, etapa, dias } = candidatura
  const espera = ESPERA_RESPUESTA(candidatura)
  const cumplidos = cumplidosDe(candidatura.criterios)

  return (
    <Item
      size="sm"
      render={<li />}
      // La fila abierta se marca con la variante «muted» de la librería; las demás usan la fila normal,
      // con su esquina y su borde.
      variant={activa ? 'muted' : 'outline'}
      aria-current={activa || undefined}
      className="cursor-pointer items-start!"
      onClick={onAbrir}
    >
      <ItemMedia className="self-center!">
        <span onClick={(event) => event.stopPropagation()} className="flex items-center">
          <Checkbox checked={marcada} onCheckedChange={(valor) => onMarcar(valor === true)} aria-label={`Elegir a ${candidato.nombre}`} />
        </span>
      </ItemMedia>
      <ItemMedia>
        <Avatar>
          <AvatarFallback>{candidato.iniciales}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0! gap-1!">
        <ItemTitle className="w-full!">
          <span className="min-w-0 flex-1 truncate">{candidato.nombre}</span>
          {espera ? <HugeiconsIcon icon={Alert02Icon} size={15} className="shrink-0 text-warning" /> : null}
          <span className="shrink-0 text-sm font-medium tabular-nums" aria-label={`Cumple ${cumplidos} de ${candidatura.criterios.length} requisitos`}>
            {cumplidos}/{candidatura.criterios.length}
          </span>
        </ItemTitle>
        <ItemDescription className="w-full!">
          <span className="truncate">
            {candidato.cargo} · {candidato.empresa}
          </span>
        </ItemDescription>
        <ItemDescription className="w-full!">
          <span className="flex items-center gap-1.5 truncate">
            <HugeiconsIcon icon={Briefcase06Icon} size={13} className="shrink-0" />
            <span className="truncate text-xs">{vacante.titulo}</span>
            <Badge variant="secondary" className="shrink-0">
              {tituloEtapa(etapa)}
            </Badge>
            <span className="shrink-0 text-xs">{dias} d</span>
          </span>
        </ItemDescription>
      </ItemContent>
    </Item>
  )
}

// La fila mientras carga, con la silueta de `FilaCandidatura`: casilla, cara, el nombre con su cuenta y dos líneas
// (regla de cargas de Selección, 25 sep; auditoría, 5-oct).
function FilaCandidaturaCargando() {
  return (
    <Item size="sm" variant="outline" render={<li />} className="items-start!">
      <ItemMedia className="self-center!">
        <Skeleton className="size-4 rounded-sm" />
      </ItemMedia>
      <ItemMedia>
        <AvatarEsqueleto />
      </ItemMedia>
      <ItemContent className="min-w-0! gap-1!">
        <span className="flex w-full items-center gap-2">
          <LineaEsqueleto ancho="w-2/5" />
          <LineaEsqueleto ancho="ms-auto w-8" />
        </span>
        <LineaEsqueleto ancho="w-3/5" />
        <LineaEsqueleto tamano="chico" ancho="w-4/5" />
      </ItemContent>
    </Item>
  )
}

// La ficha mientras carga: su cabecera (cara grande y tres líneas), las pestañas y los bloques del resumen.
function FichaCargando() {
  return (
    <Esqueleto etiqueta="Cargando la ficha" className="flex h-full flex-col gap-5 bg-card p-5">
      <span className="flex items-start gap-4">
        <AvatarEsqueleto size="lg" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <LineaEsqueleto tamano="titulo" ancho="w-1/2" />
          <LineaEsqueleto ancho="w-2/3" />
          <LineaEsqueleto ancho="w-3/4" />
        </span>
      </span>
      <span className="flex gap-3">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-20" />
      </span>
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </Esqueleto>
  )
}

export function Component() {
  const [lista, setLista] = useState<Candidatura[]>(CANDIDATURAS)
  const [filtro, setFiltro] = useState<Filtro>(VACIO)
  const [abiertaId, setAbiertaId] = useState<string | null>(CANDIDATURAS[0]?.id ?? null)
  const [marcadas, setMarcadas] = useState<string[]>([])
  const [rechazando, setRechazando] = useState<Candidatura[] | null>(null)
  const listaRef = useRef<HTMLDivElement>(null)

  const visibles = useMemo(
    () =>
      lista.filter((c) => {
        if (filtro.vacante !== 'todas' && c.vacante.id !== filtro.vacante) return false
        if (filtro.etapa !== 'todas' && c.etapa !== filtro.etapa) return false
        if (filtro.origen !== 'todos' && c.candidato.origen !== filtro.origen) return false
        if (filtro.soloEspera && !ESPERA_RESPUESTA(c)) return false
        if (filtro.busqueda) {
          const texto = `${c.candidato.nombre} ${c.candidato.cargo} ${c.candidato.empresa} ${c.vacante.titulo}`.toLowerCase()
          if (!texto.includes(filtro.busqueda.toLowerCase())) return false
        }
        return true
      }),
    [lista, filtro],
  )

  // Orden del día: primero lo que espera una respuesta y, dentro de eso, lo que lleva más tiempo parado.
  const ordenadas = useMemo(
    () =>
      [...visibles].sort((a, b) => {
        const espera = Number(ESPERA_RESPUESTA(b)) - Number(ESPERA_RESPUESTA(a))
        return espera !== 0 ? espera : b.dias - a.dias
      }),
    [visibles],
  )

  const abierta = ordenadas.find((c) => c.id === abiertaId) ?? null
  const indiceAbierta = ordenadas.findIndex((c) => c.id === abiertaId)
  const esperan = lista.filter(ESPERA_RESPUESTA).length
  // Las cargas de Selección (auditoría, 5-oct): la lista llega al entrar y cada vez que cambian los filtros o la
  // búsqueda; la ficha, al entrar y al abrir a otra persona. La cabecera y los filtros se quedan quietos, y el vacío
  // espera a que termine la carga.
  const cargandoLista = useCarga(filtro)
  const cargandoFicha = useCarga(abiertaId ?? 'nadie')

  // Al filtrar, si lo que estaba abierto ya no está en la lista se abre el primero.
  useEffect(() => {
    if (!ordenadas.length) return
    if (!ordenadas.some((c) => c.id === abiertaId)) setAbiertaId(ordenadas[0].id)
  }, [ordenadas, abiertaId])

  const mover = (id: string, etapa: string) => setLista((actual) => actual.map((c) => (c.id === id ? { ...c, etapa, dias: 0 } : c)))

  const avanzar = (candidatura: Candidatura) => {
    const destino = siguienteEtapa(candidatura.etapa)
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
    setMarcadas([])
    notify(
      ids.length === 1 ? `${rechazando?.[0].candidato.nombre} quedó rechazado` : `${ids.length} personas quedaron rechazadas`,
      `${motivo}. ${avisar ? 'El correo ya salió.' : 'Sin correo.'}`,
    )
    setRechazando(null)
  }

  // Teclado, como en una bandeja de correo: J/K o flechas para moverse, A para avanzar y R para rechazar.
  useEffect(() => {
    const enCampo = (destino: EventTarget | null) =>
      destino instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(destino.tagName)

    const onKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || enCampo(event.target)) return
      const tecla = event.key.toLowerCase()
      if (['j', 'arrowdown'].includes(tecla) && ordenadas.length) {
        event.preventDefault()
        setAbiertaId(ordenadas[Math.min(indiceAbierta + 1, ordenadas.length - 1)].id)
      } else if (['k', 'arrowup'].includes(tecla) && ordenadas.length) {
        event.preventDefault()
        setAbiertaId(ordenadas[Math.max(indiceAbierta - 1, 0)].id)
      } else if (tecla === 'a' && abierta) {
        event.preventDefault()
        avanzar(abierta)
      } else if (tecla === 'r' && abierta) {
        event.preventDefault()
        setRechazando([abierta])
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordenadas, indiceAbierta, abierta])

  const set = <C extends keyof Filtro>(campo: C) => (valor: Filtro[C]) => setFiltro((actual) => ({ ...actual, [campo]: valor }))

  const marcadasCompletas = lista.filter((c) => marcadas.includes(c.id))

  return (
    <PageShell width="wide">
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', path: '/admin' },
          { label: 'Selección', path: '/admin/seleccion/vacantes' },
          { label: 'Candidatos' },
        ]}
        title="Candidatos"
        description="Todas las personas en proceso, de todas las vacantes. Revisa, avanza o rechaza sin salir de la lista."
        actions={
          <>
            <Button variant="outline" onClick={() => notify('Importar CVs', 'Se abriría el diálogo de importación masiva.')}>
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

      <PageContent className="min-h-0 gap-4">
        {/* Filtros: la vacante es un filtro más, no una pantalla aparte. */}
        <div className="flex flex-wrap items-center gap-2">
          <InputGroup className="w-full max-w-72">
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={16} />
            </InputGroupAddon>
            <InputGroupInput
              value={filtro.busqueda}
              onChange={(event) => set('busqueda')(event.target.value)}
              placeholder="Buscar por nombre, cargo o empresa"
              aria-label="Buscar candidatos"
            />
          </InputGroup>

          <Select value={filtro.vacante} onValueChange={(valor) => set('vacante')(valor as string)}>
            <SelectTrigger className="w-52">
              <SelectValue>
                {(valor: string) => (valor === 'todas' ? 'Todas las vacantes' : (VACANTES_UI.find((v) => v.id === valor)?.titulo ?? valor))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las vacantes</SelectItem>
              {VACANTES_UI.map((vacante) => (
                <SelectItem key={vacante.id} value={vacante.id}>
                  {vacante.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtro.etapa} onValueChange={(valor) => set('etapa')(valor as string)}>
            <SelectTrigger className="w-44">
              <SelectValue>
                {(valor: string) => (valor === 'todas' ? 'Todas las etapas' : tituloEtapa(valor))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas las etapas</SelectItem>
              {ETAPAS.map((etapa) => (
                <SelectItem key={etapa.id} value={etapa.id}>
                  {etapa.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtro.origen} onValueChange={(valor) => set('origen')(valor as string)}>
            <SelectTrigger className="w-48">
              <SelectValue>{(valor: string) => (valor === 'todos' ? 'Todos los orígenes' : valor)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los orígenes</SelectItem>
              {ORIGENES.map((origen) => (
                <SelectItem key={origen} value={origen}>
                  {origen}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* El chip de filtro de Selección: prendido lleva su «x» y el globo «Quitar el filtro» (auditoría, 5-oct). */}
          <FiltroChip
            activo={filtro.soloEspera}
            onCambiar={(valor) => set('soloEspera')(valor)}
            icono={Alert02Icon}
            texto="Esperan respuesta"
            cuenta={esperan}
            ayuda="Ver solo lo que espera una respuesta"
          />

          {filtro !== VACIO ? (
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => setFiltro(VACIO)}>
              Quitar filtros
            </Button>
          ) : null}
        </div>

        {/* Lista y ficha, con el divisor movible: la lista nunca se pierde. */}
        <ResizablePanelGroup orientation="horizontal" className="min-h-[38rem] flex-1 overflow-hidden rounded-xl border">
          <ResizablePanel defaultSize="38%" minSize="26%">
            <div className="flex h-full min-h-0 flex-col bg-card">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b px-4 py-2.5">
                {cargandoLista ? (
                  <LineaEsqueleto ancho="w-32" />
                ) : (
                  <Text as="span" size="sm" variant="muted">
                    {ordenadas.length} de {lista.length} personas
                  </Text>
                )}
                <Text as="span" size="xs" variant="muted" className="flex items-center gap-1">
                  <Kbd>J</Kbd>
                  <Kbd>K</Kbd>
                  moverse
                </Text>
              </div>
              <div ref={listaRef} className="min-h-0 flex-1 overflow-auto">
                {cargandoLista ? (
                  <Esqueleto etiqueta="Cargando candidatos">
                    <ItemGroup className="p-2">
                      {Array.from({ length: Math.min(Math.max(ordenadas.length, 3), 8) }, (_, indice) => (
                        <FilaCandidaturaCargando key={indice} />
                      ))}
                    </ItemGroup>
                  </Esqueleto>
                ) : ordenadas.length ? (
                  <ItemGroup className="p-2">
                    {ordenadas.map((candidatura) => (
                      <FilaCandidatura
                        key={candidatura.id}
                        candidatura={candidatura}
                        activa={candidatura.id === abiertaId}
                        marcada={marcadas.includes(candidatura.id)}
                        onAbrir={() => setAbiertaId(candidatura.id)}
                        onMarcar={(marcada) =>
                          setMarcadas((actuales) =>
                            marcada ? [...actuales, candidatura.id] : actuales.filter((id) => id !== candidatura.id),
                          )
                        }
                      />
                    ))}
                  </ItemGroup>
                ) : (
                  // El vacío de búsqueda y filtros del sistema: dice qué se buscó y deja limpiarlo (auditoría, 5-oct).
                  <SinResultados
                    busqueda={filtro.busqueda}
                    filtrosActivos={
                      [filtro.vacante !== VACIO.vacante, filtro.etapa !== VACIO.etapa, filtro.origen !== VACIO.origen, filtro.soloEspera].filter(Boolean).length
                    }
                    onLimpiar={() => setFiltro(VACIO)}
                  />
                )}
              </div>
            </div>
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="62%" minSize="40%">
            {cargandoLista || cargandoFicha ? (
              <FichaCargando />
            ) : abierta ? (
              <FichaPersona
                key={abierta.id}
                candidatura={abierta}
                onAvanzar={() => avanzar(abierta)}
                onRechazar={() => setRechazando([abierta])}
                onIrA={(id) => {
                  setFiltro(VACIO)
                  setAbiertaId(id)
                }}
              />
            ) : (
              // Nadie abierto: el vacío del sistema, con su ilustración y sin acción (decisión 14, auditoría, 5-oct; antes, un
              // Empty con el icono de agregar persona).
              <PrimeraVez
                icono="glass-profile"
                titulo="Elige a alguien de la lista"
                descripcion="Su CV, el ajuste con la vacante y las notas del equipo salen aquí."
                className="h-full"
              />
            )}
          </ResizablePanel>
        </ResizablePanelGroup>

        <Text as="p" variant="muted" size="xs" className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1.5">
            <Kbd>A</Kbd> avanzar de etapa
          </span>
          <span className="flex items-center gap-1.5">
            <Kbd>R</Kbd> rechazar
          </span>
          <span>Avanzar se puede deshacer; rechazar avisa por correo y no.</span>
        </Text>
      </PageContent>

      {/* Acciones sobre varias personas a la vez */}
      {marcadas.length ? (
        <FloatingActionBar
          variant="dark"
          collapsible={false}
          items={[
            {
              id: 'avanzar',
              label: 'Avanzar de etapa',
              icon: <HugeiconsIcon icon={ArrowRight01Icon} size={18} />,
              onClick: () => {
                marcadasCompletas.forEach((candidatura) => {
                  const destino = siguienteEtapa(candidatura.etapa)
                  if (destino) mover(candidatura.id, destino)
                })
                notify(`${marcadas.length} personas avanzaron de etapa`)
                setMarcadas([])
              },
            },
            {
              id: 'rechazar',
              label: 'Rechazar',
              icon: <HugeiconsIcon icon={Cancel01Icon} size={18} />,
              onClick: () => setRechazando(marcadasCompletas),
            },
          ]}
          primaryAction={{
            id: 'quitar',
            label: `Quitar (${marcadas.length})`,
            onClick: () => setMarcadas([]),
          }}
          labels={{ toolbar: 'Acciones sobre las personas elegidas' }}
        />
      ) : null}

      {rechazando?.length ? (
        <DialogoRechazo
          key={rechazando.map((c) => c.id).join()}
          abierto
          onOpenChange={(abierto) => setRechazando(abierto ? rechazando : null)}
          pedido={{ id: 0, candidaturas: rechazando }}
          vacante={rechazando[0].vacante}
          lista={lista}
          onConfirmar={(decision) => rechazar(decision.motivo, Boolean(decision.correo))}
        />
      ) : null}
    </PageShell>
  )
}

Component.displayName = 'SeleccionBandejaPage'
