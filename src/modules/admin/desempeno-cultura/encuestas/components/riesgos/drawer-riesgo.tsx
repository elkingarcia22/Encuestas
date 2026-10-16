import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { ListaDatos } from '@/modules/admin/seleccion/vacantes/crear/components/piezas-resumen'
import { planConIa, type PlanConIa } from '@/modules/admin/tareas/components/plan-con-ia'
import type { SurveyRisk } from '../../modelo/riesgos'
import { FilasSeparadas, MarcoLista } from '../marco-lista'
import { GRUPOS, grupoDe } from './columnas'
import { FilaRiesgo } from './fila-riesgo'
import { ListaAcciones } from './lista-acciones'
import { MANERAS, extensionInicial, type Solucion } from './soluciones'
import { AvanceMeta, ExtenderCierre } from './solucion-participacion'

export type { Solucion } from './soluciones'
import { PrimeraVez } from '@/shared/components/PrimeraVez'

// El panel lateral de los riesgos. Primero todos los casos, por prioridad; con la flecha se entra al detalle (con
// «Volver» arriba, como el catálogo de plantillas): qué está pasando, con los datos que lo explican, y cómo
// resolverlo ahí mismo (soluciones.ts): la lista de quienes faltan, de quienes hay que canalizar o de lo que hay que
// revisar, con su botón por fila y uno para todas; más días de cierre; y, abajo, la acción de la encuesta. Al
// resolver un caso del todo se vuelve a la lista, ya sin él.

// Todos los casos, en un marco por prioridad (alta, media, baja), con la misma fila del home: la acción de una vez y
// la flecha al detalle.
function ListaRiesgos({ riesgos, onAbrir, onResolver }: { riesgos: readonly SurveyRisk[]; onAbrir: (riesgo: SurveyRisk) => void; onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void }) {
  if (riesgos.length === 0) {
    return (
      <PrimeraVez icono="glass-tick" titulo="Nada por atender" descripcion="Lo que resolviste ya no aparece aquí." />
    )
  }
  return (
    <div className="flex flex-col gap-6">
      {GRUPOS.map((grupo) => {
        const delGrupo = riesgos.filter((riesgo) => riesgo.group === grupo.grupo)
        if (delGrupo.length === 0) return null
        return (
          <MarcoLista
            key={grupo.grupo}
            titulo={
              <span className="flex items-center gap-2">
                Prioridad {grupo.titulo.toLowerCase()}
                <Badge variant={grupo.insignia} size="sm" className="tabular-nums">
                  {delGrupo.length}
                </Badge>
              </span>
            }
            descripcion={grupo.resumen}
          >
            <FramePanel className="py-1!">
              <FilasSeparadas>
                {delGrupo.map((riesgo) => (
                  <FilaRiesgo key={riesgo.id} riesgo={riesgo} conPrioridad={false} onResolver={onResolver} onDetalle={onAbrir} />
                ))}
              </FilasSeparadas>
            </FramePanel>
          </MarcoLista>
        )
      })}
    </div>
  )
}

// La bajada de la lista nombra solo las prioridades que hay: con una sola, «4 casos, todos de prioridad alta».
function resumenDeLista(riesgos: readonly SurveyRisk[]): string {
  const casos = `${riesgos.length} ${riesgos.length === 1 ? 'caso' : 'casos'}`
  const hay = GRUPOS.filter((grupo) => riesgos.some((riesgo) => riesgo.group === grupo.grupo)).map((grupo) => grupo.titulo.toLowerCase())
  if (hay.length === 0) return casos
  if (hay.length === 1) return `${casos}, ${riesgos.length === 1 ? 'de' : 'todos de'} prioridad ${hay[0]}.`
  return `${casos}: primero la prioridad ${hay.slice(0, -1).join(', luego la ')} y luego la ${hay[hay.length - 1]}.`
}

export function DrawerRiesgos({
  riesgos,
  abierto,
  idAbierto,
  onIdAbierto: setIdAbierto,
  onAbierto,
  onResolver,
}: {
  riesgos: readonly SurveyRisk[]
  abierto: boolean
  /** El caso cuyo detalle está abierto; sin él, la lista de todos. Lo lleva el panel del home, que abre directo al detalle. */
  idAbierto: string | null
  onIdAbierto: (id: string | null) => void
  onAbierto: (abierto: boolean) => void
  onResolver: (riesgo: SurveyRisk, solucion: Solucion) => void
}) {
  const [nuevoCierre, setNuevoCierre] = useState<Date | undefined>(undefined)
  // Lo ya hecho de cada caso (a quién se recordó, a quién se canalizó…): se conserva si se sale y se vuelve a entrar.
  const [hechos, setHechos] = useState<Readonly<Record<string, ReadonlySet<string>>>>({})
  // Los planes que la IA armó en cada caso, por elemento: «Ver plan» los lleva a Tareas › Planes.
  const [planes, setPlanes] = useState<Readonly<Record<string, Readonly<Record<string, PlanConIa>>>>>({})
  // Un caso resuelto sale de la lista: si era el abierto, se vuelve a la lista sola.
  const riesgo = riesgos.find((opcion) => opcion.id === idAbierto) ?? null
  const manera = riesgo ? MANERAS[riesgo.kind] : null
  // La fecha propuesta para extender se pone al cambiar de caso, también cuando se entra directo desde el home.
  const [casoDeLaFecha, setCasoDeLaFecha] = useState<string | null>(null)
  if (riesgo && casoDeLaFecha !== riesgo.id) {
    setCasoDeLaFecha(riesgo.id)
    setNuevoCierre(extensionInicial(riesgo))
  }

  const abrir = (siguiente: SurveyRisk) => setIdAbierto(siguiente.id)
  // Los casos de plan no salen al crear el plan (quedaría «Ver plan» fuera de alcance): salen al dejar el caso, si no queda nada por crear.
  const salirDelCaso = () => {
    if (riesgo && manera?.lista?.accion?.ia && (riesgo.items ?? []).every((item) => hechos[riesgo.id]?.has(item.id))) onResolver(riesgo, { tipo: 'lista', aviso: '', completa: true })
    setIdAbierto(null)
  }
  const cambiarAbierto = (visible: boolean) => {
    if (!visible) salirDelCaso()
    onAbierto(visible)
  }

  const hacer = (actual: SurveyRisk, ids: readonly string[]) => {
    const lista = MANERAS[actual.kind].lista?.accion
    if (!lista) return
    const siguientes = new Set([...(hechos[actual.id] ?? []), ...ids])
    setHechos((previos) => ({ ...previos, [actual.id]: siguientes }))
    if (lista.ia) {
      const creados = Object.fromEntries(
        ids.map((id) => {
          const item = (actual.items ?? []).find((opcion) => opcion.id === id)
          return [id, planConIa({ id: `plan-${actual.id}-${id}`, sujeto: item?.title ?? actual.survey.name, origen: actual.survey.name, area: actual.kind === 'brecha' ? item?.title : undefined })]
        }),
      )
      setPlanes((previos) => ({ ...previos, [actual.id]: { ...previos[actual.id], ...creados } }))
    }
    onResolver(actual, { tipo: 'lista', aviso: lista.aviso(ids.length), completa: !lista.ia && (actual.items ?? []).every((item) => siguientes.has(item.id)) })
  }
  const verPlan = (actual: SurveyRisk, id: string) => {
    const delCaso = planes[actual.id] ?? {}
    if (delCaso[id]) onResolver(actual, { tipo: 'planes', nuevos: Object.values(delCaso), elegido: delCaso[id].plan.id })
  }

  const conLista = Boolean(manera?.lista && riesgo?.items && riesgo.items.length > 0)
  const botonPie = manera?.boton
  const solucionPie: Solucion | null = botonPie ? (botonPie.accion === 'resultados' ? { tipo: 'resultados', pestana: botonPie.pestana } : { tipo: 'accion', accion: botonPie.accion, paso: botonPie.paso }) : null

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={cambiarAbierto}
      size="lg"
      kicker={riesgo ? riesgo.title : undefined}
      title={riesgo ? riesgo.survey.name : 'Para atender'}
      description={riesgo ? riesgo.summary : resumenDeLista(riesgos)}
      badge={
        riesgo ? (
          <Badge variant={grupoDe(riesgo.group).insignia} size="sm">
            Prioridad {grupoDe(riesgo.group).titulo.toLowerCase()}
          </Badge>
        ) : undefined
      }
      navigation={
        riesgo ? (
          <div className="flex items-center border-b px-3 py-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={salirDelCaso}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              Volver a todos los casos
            </Button>
          </div>
        ) : undefined
      }
      // Sin «Volver» en el pie: la vuelta a la lista ya está arriba, en «Volver a todos los casos» (Elkin, 14-oct).
      footer={
        riesgo && botonPie && solucionPie ? (
          <>
            {riesgo.kind === 'abre' ? (
              <Button variant="outline" onClick={() => onResolver(riesgo, { tipo: 'accion', accion: 'descargarQr' })}>
                Descargar QR
              </Button>
            ) : null}
            <Button variant={manera?.lista?.accion ? 'outline' : 'default'} onClick={() => onResolver(riesgo, solucionPie)}>
              {botonPie.etiqueta}
            </Button>
          </>
        ) : undefined
      }
    >
      {riesgo && manera ? (
        // Dos marcos, como el último paso de «Cargar encuestas»: lo que pasa, con sus datos, y cómo resolverlo, con la lista
        // y, si aplica, más días de cierre en su propio panel.
        <div className="flex flex-col gap-6">
          <Frame>
            <FrameHeader>
              <FrameTitle>Qué está pasando</FrameTitle>
            </FrameHeader>
            <FramePanel className="flex flex-col gap-4">
              {manera.avance ? <AvanceMeta riesgo={riesgo} /> : null}
              <ListaDatos filas={riesgo.facts.map((dato) => ({ termino: dato.label, valor: dato.value }))} />
            </FramePanel>
          </Frame>
          <Frame>
            <FrameHeader>
              <FrameTitle>Cómo resolverlo</FrameTitle>
              <FrameDescription>{manera.texto}</FrameDescription>
            </FrameHeader>
            {conLista ? (
              <FramePanel className="flex flex-col gap-3">
                <Text size="sm" weight="semibold">
                  {manera.lista?.titulo}
                </Text>
                <ListaAcciones key={riesgo.id} items={riesgo.items ?? []} accion={manera.lista?.accion} buscar={manera.lista?.buscar ?? ''} hechos={hechos[riesgo.id] ?? new Set()} onHacer={(ids) => hacer(riesgo, ids)} onVer={(id) => verPlan(riesgo, id)} />
              </FramePanel>
            ) : null}
            {manera.extension ? (
              <FramePanel>
                <ExtenderCierre riesgo={riesgo} fecha={nuevoCierre} onFecha={setNuevoCierre} onExtender={(nuevoCierre) => onResolver(riesgo, { tipo: 'extension', nuevoCierre })} />
              </FramePanel>
            ) : null}
            {!conLista && !manera.extension ? (
              <FramePanel>
                <Text size="sm" variant="muted">
                  Se resuelve con el botón de abajo.
                </Text>
              </FramePanel>
            ) : null}
          </Frame>
        </div>
      ) : (
        <ListaRiesgos riesgos={riesgos} onAbrir={abrir} onResolver={onResolver} />
      )}
    </DrawerShell>
  )
}
