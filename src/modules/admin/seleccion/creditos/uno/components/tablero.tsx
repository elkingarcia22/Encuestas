import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Button, Heading, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { notifyAction } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { BloqueResumen, ListaDatos } from '../../../vacantes/crear/components/piezas-resumen'
import type { VacanteUI } from '../../../propuestas/datos'
import { grupoDe, type Grupo } from '@/modules/design-system/metricas/grupos-atencion'
import { ListaAsuntos, MediaGrupo, TableroAtencion, TarjetaSugerencia } from '@/modules/design-system/metricas/tablero-atencion'
import { creditos, registroDeCreditos, type Bolsa, type Movimiento } from '../../../propuestas/creditos'
import { asuntosCreditos, atencionCreditos, nombresDe, useAtencionCreditos, type AsuntoCredito } from './atencion'
import { noSeGuardo } from '../../../propuestas/simular'

// «Lo que necesita tu atención» en Créditos, con el tablero de Vacantes (5 oct): las mismas cuatro columnas, recogido al
// entrar, y cada asunto se resuelve en su panel lateral. Lo que se resuelve repartiendo (darle créditos a un agente,
// aplicar la sugerencia de la IA) sale solo del tablero porque la bolsa cambia; «Ya lo revisé», «Pedir más créditos» y
// descartar lo sacan por la sesión. Todo trae «Deshacer».

const RUTA_VACANTES = '/admin/seleccion/exploraciones/uno'

export function TableroCreditos({
  bolsa,
  historial,
  cargando,
  onReasignar,
  onComprar,
}: {
  bolsa: Bolsa
  historial: Movimiento[]
  cargando: boolean
  onReasignar: () => void
  // Comprar con tarjeta (8 oct): lo que antes era pedirle la recarga al ejecutivo.
  onComprar: () => void
}) {
  const navigate = useNavigate()
  const estado = useAtencionCreditos()
  const [expandido, setExpandido] = useState(false)
  // El asunto abierto se guarda entero: si se resuelve, el panel lo sigue mostrando (ya resuelto) hasta volver a la lista.
  const [panel, setPanel] = useState<{ abierto: boolean; grupo: Grupo; asunto: AsuntoCredito | null }>({ abierto: false, grupo: 'critico', asunto: null })

  const pendientes = asuntosCreditos({ bolsa, historial, hechos: estado.hechos, descartadas: estado.descartadas })
  const delGrupo = (grupo: Grupo) => pendientes.filter((asunto) => asunto.grupo === grupo)
  // Lo abierto, al día: si ya no está entre los pendientes, se resolvió.
  const abierto = panel.asunto ? (pendientes.find((asunto) => asunto.id === panel.asunto?.id) ?? null) : null

  const abrirAsunto = (asunto: AsuntoCredito) => setPanel({ abierto: true, grupo: asunto.grupo, asunto })
  const abrirGrupo = (grupo: Grupo) => setPanel({ abierto: true, grupo, asunto: null })
  const volver = () => setPanel((actual) => ({ ...actual, asunto: null }))

  /* Lo que se hace desde el tablero o el panel -------------------------------------------------------------------- */

  const darle = (asunto: AsuntoCredito) => {
    if (!asunto.agente || !asunto.darle) return
    const { agente, vacantes } = asunto.agente
    if (noSeGuardo(`darle:${asunto.id}`, `No pudimos darle créditos a ${agente.nombre}`, () => darle(asunto), 'Sigue con los que tenía.')) return
    const deshacer = registroDeCreditos.repartir({ [agente.id]: asunto.darle }, `Para dos semanas de ${agente.nombre}`)
    notifyAction(
      `Le diste ${creditos(asunto.darle)} créditos a ${agente.nombre}`,
      asunto.grupo === 'critico'
        ? `Vuelve a trabajar en ${nombresDe(vacantes)}.`
        : 'Le alcanzan unas dos semanas a su ritmo.',
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  const reasignar = () => {
    setPanel((actual) => ({ ...actual, abierto: false, asunto: null }))
    onReasignar()
  }

  const pedir = () => {
    setPanel((actual) => ({ ...actual, abierto: false, asunto: null }))
    onComprar()
  }

  const revisado = (asunto: AsuntoCredito) => {
    const deshacer = atencionCreditos.marcar(asunto.id)
    notifyAction('Lo marcamos como revisado', 'Sale del tablero.', { label: 'Deshacer', onClick: deshacer }, 'success')
    volver()
  }

  const aplicar = (asunto: AsuntoCredito) => {
    if (!asunto.reparto) return
    if (noSeGuardo(`aplicar:${asunto.id}`, 'No pudimos repartir los créditos', () => aplicar(asunto), 'Siguen como estaban.')) return
    const deshacer = registroDeCreditos.repartir(asunto.reparto.cambios, 'Sugerencia de la IA: cubrir dos semanas')
    notifyAction(
      `Repartimos ${creditos(asunto.reparto.total)} créditos`,
      `${asunto.reparto.nombres} quedan con dos semanas a su ritmo.`,
      { label: 'Deshacer', onClick: deshacer },
      'success',
    )
  }

  const descartar = (asunto: AsuntoCredito) => {
    const deshacer = atencionCreditos.descartar(asunto.id)
    if (panel.asunto?.id === asunto.id) volver()
    notifyAction('Descartamos la sugerencia', 'No te la vuelvo a proponer en esta sesión.', { label: 'Deshacer', onClick: deshacer }, 'success')
  }

  const sugerencia = (asunto: AsuntoCredito, completa = false) => (
    <TarjetaSugerencia
      titulo={asunto.titulo}
      resumen={asunto.resumen}
      porque={asunto.porque}
      completa={completa}
      etiqueta={asunto.etiqueta ?? 'Aplicar'}
      onAplicar={() => aplicar(asunto)}
      onDescartar={() => descartar(asunto)}
    />
  )

  return (
    <section aria-labelledby="atencion-titulo">
      <TableroAtencion
        pendientes={pendientes}
        cargando={cargando}
        expandido={expandido}
        onExpandido={setExpandido}
        onAbrir={abrirAsunto}
        onVerGrupo={abrirGrupo}
      />

      <PanelCreditos
        abierto={panel.abierto}
        onAbierto={(abrir) => setPanel((actual) => ({ ...actual, abierto: abrir, asunto: abrir ? actual.asunto : null }))}
        grupo={panel.grupo}
        asuntos={delGrupo(panel.grupo)}
        asunto={abierto ?? panel.asunto}
        resuelto={Boolean(panel.asunto) && !abierto}
        onAsunto={(asunto) => setPanel((actual) => ({ ...actual, asunto }))}
        sugerencia={(asunto) => sugerencia(asunto, true)}
        acciones={{
          darle,
          reasignar,
          pedir,
          revisado,
          aplicar,
          descartar,
          abrirVacante: (vacante) => navigate(`${RUTA_VACANTES}/${vacante.id}`),
        }}
      />
    </section>
  )
}

/* El panel lateral ---------------------------------------------------------------------------------------------- */

type Acciones = {
  darle: (asunto: AsuntoCredito) => void
  reasignar: () => void
  pedir: (asunto: AsuntoCredito) => void
  revisado: (asunto: AsuntoCredito) => void
  aplicar: (asunto: AsuntoCredito) => void
  descartar: (asunto: AsuntoCredito) => void
  abrirVacante: (vacante: VacanteUI) => void
}

// Como el del inicio de Vacantes: primero la lista del grupo; al tocar un asunto, su detalle con la vuelta al grupo
// arriba: qué está pasando, con los datos que lo explican, y cómo resolverlo ahí mismo.
function PanelCreditos({
  abierto,
  onAbierto,
  grupo,
  asuntos,
  asunto,
  resuelto,
  onAsunto,
  sugerencia,
  acciones,
}: {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  grupo: Grupo
  asuntos: AsuntoCredito[]
  asunto: AsuntoCredito | null
  resuelto: boolean
  onAsunto: (asunto: AsuntoCredito | null) => void
  sugerencia: (asunto: AsuntoCredito) => ReactNode
  acciones: Acciones
}) {
  const info = grupoDe(grupo)
  const esSugerencia = asunto?.grupo === 'ia'
  const pie = asunto?.pie

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbierto}
      size="lg"
      media={<MediaGrupo grupo={grupo} />}
      kicker={asunto ? info.titulo : undefined}
      title={asunto ? asunto.titulo : info.titulo}
      description={asunto ? asunto.resumen : `${asuntos.length} ${plural(asuntos.length, 'asunto', 'asuntos')} · ${info.corto}`}
      navigation={
        asunto ? (
          <div className="flex items-center border-b px-3 py-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => onAsunto(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              {info.titulo}
            </Button>
          </div>
        ) : undefined
      }
      footer={
        asunto ? (
          <>
            <Button variant="outline" onClick={() => onAsunto(null)}>
              Volver
            </Button>
            {!resuelto && esSugerencia ? (
              <>
                <Button variant="ghost" className="ml-auto" onClick={() => acciones.descartar(asunto)}>
                  Descartar
                </Button>
                <BotonIaSecundario onClick={() => acciones.aplicar(asunto)}>{asunto.etiqueta ?? 'Aplicar'}</BotonIaSecundario>
              </>
            ) : null}
            {!resuelto && pie && !esSugerencia ? (
              <>
                {pie.revisado ? (
                  <Button variant="ghost" className="ml-auto" onClick={() => acciones.revisado(asunto)}>
                    Ya lo revisé
                  </Button>
                ) : null}
                {pie.reasignar ? (
                  <Button variant={asunto.darle ? 'outline' : 'default'} className={pie.revisado ? undefined : 'ml-auto'} onClick={acciones.reasignar}>
                    {asunto.darle ? 'Reasignar a mano' : 'Reasignar créditos'}
                  </Button>
                ) : null}
                {pie.pedir ? <Button onClick={() => acciones.pedir(asunto)}>Comprar créditos</Button> : null}
                {asunto.darle ? <Button onClick={() => acciones.darle(asunto)}>Darle {creditos(asunto.darle)} créditos</Button> : null}
              </>
            ) : null}
          </>
        ) : undefined
      }
    >
      {asunto ? (
        <div className="flex flex-col gap-6">
          {esSugerencia ? (
            <>
              <div className="flex flex-col gap-3">
                <Heading as="h3" level={6} className="flex items-center gap-2">
                  <IconoIA />
                  Por qué lo propongo
                </Heading>
                <Text size="sm">{asunto.porque}</Text>
              </div>
              <BloqueResumen>
                <Heading as="h3" level={6}>
                  Qué cambia
                </Heading>
                <ListaDatos filas={asunto.datos} />
                {resuelto ? <Resuelto texto="Hecho" /> : null}
              </BloqueResumen>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <Heading as="h3" level={6}>
                  Qué está pasando
                </Heading>
                <ListaDatos filas={asunto.datos} />
              </div>
              <BloqueResumen>
                <Heading as="h3" level={6}>
                  Cómo resolverlo
                </Heading>
                <Text size="sm" variant="muted">
                  {asunto.como}
                </Text>
                {asunto.vacantes?.length ? <ListaVacantes vacantes={asunto.vacantes} onAbrir={acciones.abrirVacante} /> : null}
                {resuelto ? <Resuelto texto="Resuelto" /> : null}
              </BloqueResumen>
            </>
          )}
        </div>
      ) : (
        <ListaAsuntos grupo={grupo} asuntos={asuntos} onAbrir={onAsunto} sugerencia={sugerencia} />
      )}
    </DrawerShell>
  )
}

function Resuelto({ texto }: { texto: string }) {
  return (
    <Badge variant="success-outline" className="w-fit">
      {texto}
    </Badge>
  )
}

// Las vacantes del asunto, para entrar a ver qué pasa en cada una.
function ListaVacantes({ vacantes, onAbrir }: { vacantes: VacanteUI[]; onAbrir: (vacante: VacanteUI) => void }) {
  return (
    <ItemGroup className="gap-0! rounded-xl border">
      {vacantes.map((vacante, indice) => (
        <div key={vacante.id}>
          {indice > 0 ? <ItemSeparator /> : null}
          <Item size="sm" className="gap-3">
            <ItemContent className="min-w-0">
              <ItemTitle className="w-full truncate">{vacante.titulo}</ItemTitle>
              <ItemDescription>
                {`${plural(vacante.aplicaciones, '1 aplicación', `${vacante.aplicaciones} aplicaciones`)} · ${plural(vacante.ultimaSemana, '1 esta semana', `${vacante.ultimaSemana} esta semana`)}`}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <Button variant="outline" size="sm" onClick={() => onAbrir(vacante)}>
                Abrir
              </Button>
            </ItemActions>
          </Item>
        </div>
      ))}
    </ItemGroup>
  )
}
