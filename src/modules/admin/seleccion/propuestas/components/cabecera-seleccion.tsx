import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, Clock01Icon, FileImportIcon, GridViewIcon, PlusSignIcon } from '@hugeicons/core-free-icons'
import { Button, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Skeleton, Text } from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { PageHeader } from '@/shared/components/PageShell'
import { CeldaCifra } from '@/modules/design-system/metricas/cifras'
import { plural } from '@/modules/design-system/patrones/formato'
import { ColumnaIndicador, FilaIndicadores } from '@/modules/design-system/graficos/fila-indicadores'
import { CANDIDATURAS, ESPERA_RESPUESTA, VACANTES_UI } from '../datos'
import { LineaEsqueleto, useCarga } from '@/modules/design-system/estados/carga'
import { Ayuda, Cambio, Cifra, Pie } from './cifras'
import type { Base } from './use-base'

// Las cabeceras de Selección.
//
// Hasta el 26 sep «Vacantes» y «Mis candidatos» eran dos vistas de un mismo switch y compartían toda la cabecera (22 sep:
// «el título debería permanecer vacantes y el cta de candidatos debe quedar dentro de la tabla»). El 27 sep Nicolás las
// separó como en el producto: «candidatos debe quedar fuera toda su experiencia». Desde entonces:
// - En la exploración 1 (la que queda: la 2 y la 3 se borraron el 1 oct) son dos entradas del menú. «Vacantes» lleva `CabeceraVacantes` y sus cifras
//   (`PulsoSeleccion`); «Mis candidatos», `CabeceraCandidatos`, sus propias cifras (`PulsoBase`, con la forma de las del inicio de Vacantes desde el 5 oct) y su propio botón lleno,
//   «Importar candidatos», porque ahí es lo principal que se hace.
// - La exploración 4 las juntaba en una sola sección, «Reclutamiento», con el switch; se borró el 1 oct.

// La frase de debajo del título de cada pantalla. Vive aquí para que las dos pantallas de la exploración no se
// desincronicen.
export const EXPLORACION: Record<string, { descripcion: string }> = {
  '/admin/seleccion/exploraciones/uno': {
    descripcion: 'Todos los procesos abiertos de la empresa, con lo que espera una respuesta tuya.',
  },
  '/admin/seleccion/candidatos/dos': {
    descripcion: 'Encuentra a la persona que buscas en tu base y postúlala a una vacante.',
  },
}

// `onCrearConPlantilla` suma el secundario «Crear con plantilla», que abre el catálogo de plantillas de la creación de
// Vacantes (la 1 crea con ese flujo desde el 30 sep).
export function CabeceraVacantes({ ruta, onCrear, onCrearConPlantilla }: { ruta: string; onCrear: () => void; onCrearConPlantilla?: () => void }) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: 'Inicio', path: '/admin' },
        { label: 'Selección' },
        { label: 'Vacantes' },
      ]}
      title="Vacantes"
      description={EXPLORACION[ruta]?.descripcion}
      actions={
        <>
          {onCrearConPlantilla ? (
            <Button variant="outline" onClick={onCrearConPlantilla}>
              <HugeiconsIcon icon={GridViewIcon} size={16} />
              Crear con plantilla
            </Button>
          ) : null}
          <Button onClick={onCrear}>
            <HugeiconsIcon icon={PlusSignIcon} size={16} />
            Crear vacante
          </Button>
        </>
      }
    />
  )
}

// «Mis candidatos» como sección propia: su miga, su título, su frase y sus acciones (`AccionesBase`).
export function CabeceraCandidatos({ ruta, acciones }: { ruta: string; acciones: ReactNode }) {
  return (
    <PageHeader
      breadcrumbs={[
        { label: 'Inicio', path: '/admin' },
        { label: 'Selección' },
        { label: 'Mis candidatos' },
      ]}
      title="Mis candidatos"
      description={EXPLORACION[ruta]?.descripcion}
      actions={acciones}
    />
  )
}

// Las dos acciones de la base, en el orden de la regla (secundario · primario): ver lo que ya se importó y traer más
// gente. En «Mis candidatos» como sección, importar es lo principal y va lleno. Dentro de «Reclutamiento» (exploración 4)
// el botón lleno es «Crear vacante» y estas bajan delineadas a la tarjeta: `principal={false}`.
export function AccionesBase({ base, principal = true, size }: { base: Base; principal?: boolean; size?: 'sm' }) {
  return (
    <>
      <Button variant={principal ? 'outline' : 'ghost'} size={size} onClick={base.importar.verHistorial}>
        <HugeiconsIcon icon={Clock01Icon} size={16} />
        Importaciones
        <Badge variant="secondary" className="tabular-nums">
          {base.importar.lotes.length}
        </Badge>
      </Button>
      <Button variant={principal ? 'default' : 'outline'} size={size} onClick={base.importar.abrir}>
        <HugeiconsIcon icon={FileImportIcon} size={16} />
        Importar candidatos
      </Button>
    </>
  )
}

// Las cifras van en el marco gris de `Indicadores` (Design system › Métricas), en una sola fila partida por líneas
// (auditoría, 5-oct; antes, una tarjeta blanca con el relleno forzado). Se arma con sus mismas piezas —Frame, FramePanel,
// CeldaCifra y las columnas de FilaCifras— porque `Indicadores` todavía no deja poner el atajo dentro de la cifra ni
// mostrar la carga.
const FILA_CIFRAS = 'divide-border grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x'
const CELDA = 'flex flex-col gap-2 lg:px-5 lg:first:ps-0 lg:last:pe-0'

// Cómo va el área antes del detalle: cuatro cifras separadas por líneas, el mismo bloque que usa el Inicio.
// Dos de ellas son atajos: llevan a la parte de la lista que están contando, que es lo que uno quiere hacer
// después de leerlas. Si la lista no está en la misma pantalla (la cabecera de «Reclutamiento» sobre la otra vista), el
// atajo es un enlace que vuelve a ella ya filtrada (`?ver=`).
// Con un atajo puesto (`activo`), su mismo enlace lo quita: «Ver todas las vacantes», como «Ver todas» en las alertas de
// Vacantes (5-oct, la tabla pasó a la del sistema y el chip «Con gente esperando» de encima se fue).
export function PulsoSeleccion({
  ruta,
  alFiltrar,
  activo = null,
}: {
  ruta: string
  alFiltrar?: (que: 'publicadas' | 'esperando') => void
  activo?: 'publicadas' | 'esperando' | null
}) {
  // Las cifras llegan al entrar a la pantalla. Mientras tanto, cada celda ya dice qué cuenta (el rótulo no depende de
  // los datos) y en gris el número, su detalle y el atajo, en el mismo alto.
  const cargando = useCarga()
  const dentroDe = (vacanteId: string) => CANDIDATURAS.filter((c) => c.vacante.id === vacanteId)

  const publicadas = VACANTES_UI.filter((vacante) => vacante.estado === 'Publicada').length
  const borradores = VACANTES_UI.filter((vacante) => vacante.estado === 'Borrador').length
  const conGente = VACANTES_UI.filter((vacante) => dentroDe(vacante.id).length > 0).length
  const enProceso = CANDIDATURAS.length
  const esperan = CANDIDATURAS.filter(ESPERA_RESPUESTA)
  // Cuánto lleva esperando quien más lleva: es lo que convierte «8 esperan» en algo que se siente urgente.
  const diasDelMasViejo = Math.max(0, ...esperan.map((c) => c.dias))
  const aplicacionesSemana = VACANTES_UI.reduce((suma, vacante) => suma + vacante.ultimaSemana, 0)
  const aplicacionesTotal = VACANTES_UI.reduce((suma, vacante) => suma + vacante.aplicaciones, 0)

  const atajo = (que: 'publicadas' | 'esperando', contenido: ReactNode) =>
    alFiltrar ? (
      <Button variant="link" size="sm" className="h-auto! w-fit p-0!" onClick={() => alFiltrar(que)}>
        {activo === que ? 'Ver todas las vacantes' : contenido}
      </Button>
    ) : (
      <Button variant="link" size="sm" className="h-auto! w-fit p-0!" nativeButton={false} render={<Link to={`${ruta}?ver=${que}`} />}>
        {contenido}
      </Button>
    )

  return (
    <Frame>
      <FramePanel
        role={cargando ? 'status' : undefined}
        aria-label={cargando ? 'Cargando las cifras' : undefined}
        className={FILA_CIFRAS}
      >
        <div className={CELDA}>
          <Celda
            cargando={cargando}
            cifra={{
              valor: String(publicadas),
              etiqueta: 'Vacantes publicadas',
              detalle: `de ${VACANTES_UI.length} en total · ${borradores} en borrador`,
            }}
          />
          {cargando ? <AtajoCargando /> : atajo('publicadas', 'Ver solo las publicadas')}
        </div>

        <div className={CELDA}>
          <Celda
            cargando={cargando}
            cifra={{
              valor: String(enProceso),
              etiqueta: 'Personas en proceso',
              detalle: `repartidas en ${conGente} ${conGente === 1 ? 'vacante' : 'vacantes'}`,
            }}
          />
        </div>

        <div className={CELDA}>
          <Celda
            cargando={cargando}
            cifra={{
              valor: String(esperan.length),
              etiqueta: 'Esperan una respuesta',
              detalle: esperan.length
                ? `la que más lleva, ${diasDelMasViejo} ${diasDelMasViejo === 1 ? 'día' : 'días'}`
                : 'nadie está esperando ahora mismo',
            }}
          />
          {cargando ? (
            <AtajoCargando />
          ) : esperan.length ? (
            atajo(
                'esperando',
                <>
                  <HugeiconsIcon icon={Alert02Icon} size={14} />
                  Ver esas vacantes
                </>,
              )
          ) : null}
        </div>

        <div className={CELDA}>
          <Celda
            cargando={cargando}
            cifra={{
              valor: String(aplicacionesSemana),
              etiqueta: 'Aplicaciones esta semana',
              detalle: `${aplicacionesTotal} en total desde que se abrieron`,
            }}
          />
        </div>
      </FramePanel>
    </Frame>
  )
}

// Cómo va la base, antes de la lista, con la forma de «Cómo van los procesos» del inicio de Vacantes (5 oct, Nicolás:
// «así mismo en forma deben de ser los de mis candidatos»): su marco con título, y en cada cifra la ayuda, hacia dónde va
// frente al periodo anterior y dos líneas, contra qué se compara y qué significa. Lo que se busca en una base de personas:
// cuánta gente hay, quién está en un proceso, quién espera algo del equipo y quién está libre para postularla. Cuentan
// toda la base, no lo filtrado: son el estado de la base.
//
// Hasta el 5 oct cada cifra traía un atajo que filtraba la tabla («Ver quiénes»). Se quitan con la forma nueva: los
// mismos filtros siguen a un clic en la tabla, en los grupos («En proceso», «Libres») y en «Filtros» («Entraron este mes»,
// «Esperan algo de ti»).
//
// Las dos cifras sin histórico en la maqueta (en proceso y esperando) derivan el periodo anterior de la de hoy con una
// regla fija, como las del inicio de Vacantes; la base y las libres lo sacan de cuándo entró cada persona.
export function PulsoBase({ base }: { base: Base }) {
  const cargando = useCarga()
  const { todas } = base

  const recientes = todas.filter((persona) => persona.dias <= 30)
  const baseAntes = todas.length - recientes.length

  const enProceso = todas.filter((persona) => persona.situacion === 'proceso')
  const vacantesConGente = new Set(
    enProceso.flatMap((persona) => persona.vivos.filter((proceso) => proceso.estado === 'En proceso').map((proceso) => proceso.vacanteId)),
  ).size
  // Maqueta: el mes pasado había cinco personas menos en un proceso.
  const enProcesoAntes = Math.max(0, enProceso.length - 5)

  const diasEsperando = (candidaturaId?: string) => CANDIDATURAS.find((c) => c.id === candidaturaId)?.dias ?? 0
  const esperan = todas
    .filter((persona) => persona.espera)
    .map((persona) => ({ persona, dias: diasEsperando(persona.espera?.candidaturaId) }))
    .sort((a, b) => b.dias - a.dias)
  // Maqueta: la semana pasada esperaban cuatro personas menos.
  const esperanAntes = Math.max(0, esperan.length - 4)

  // Mientras cargan, cada columna ya dice qué cuenta (el rótulo y la ayuda no dependen de los datos) y en gris la cifra y
  // sus dos líneas, en el mismo alto.
  const cifra = (valor: number, cambio: ReactNode) =>
    cargando ? <LineaEsqueleto tamano="titulo" ancho="w-24" className="h-7" /> : <Cifra valor={valor} cambio={cambio} />
  const pie = (frente: string, significa: string) =>
    cargando ? (
      <div className="flex w-full flex-col gap-0.5">
        <LineaEsqueleto tamano="chico" ancho="w-40 max-w-full" />
        <LineaEsqueleto tamano="chico" ancho="w-48 max-w-full" />
      </div>
    ) : (
      <Pie frente={frente} significa={significa} />
    )

  return (
    <section aria-labelledby="cifras-base-titulo" aria-busy={cargando || undefined}>
      {/* Compacto, como el marco de «Tus candidatos» de abajo: los dos títulos de la pantalla se arman igual. */}
      {/* Tres cifras (13 oct, PM: «el total de mi base, lo que está en este momento moviéndose, y si tengo a alguien
          bloqueado; no dejaría nada más»). Sin «Libres para postular»: no están libres, están en la base. */}
      <Frame spacing="sm">
        <FrameHeader>
          <FrameTitle id="cifras-base-titulo">Cómo va tu base</FrameTitle>
          <FrameDescription>Cada cifra, frente al periodo anterior.</FrameDescription>
        </FrameHeader>
        <FilaIndicadores etiqueta="Indicadores de tu base" columnas={3} enMarco>
          <ColumnaIndicador
            titulo="Personas en tu base"
            ayuda={<Ayuda titulo="Personas en tu base">Todas las personas de tu base: las que aplicaron, las que importaste y las que agregaste a mano. Se compara con las que había hace un mes.</Ayuda>}
            cifra={cifra(todas.length, <Cambio valor={todas.length - baseAntes} sufijo="" frente="el mes pasado" />)}
            pie={pie(
              `Frente a ${baseAntes.toLocaleString('es-CO')} el mes pasado`,
              // Por dónde llegó cada persona no se sabe (8 oct, VP de producto): se dice cuántas entraron, no por dónde.
              recientes.length ? `${recientes.length} ${plural(recientes.length, 'entró', 'entraron')} este mes` : 'Nadie entró este mes',
            )}
          />
          <ColumnaIndicador
            titulo="En algún proceso"
            ayuda={<Ayuda titulo="En algún proceso">Personas que hoy siguen en al menos una vacante abierta. Se compara con las que había hace un mes.</Ayuda>}
            cifra={cifra(enProceso.length, <Cambio valor={enProceso.length - enProcesoAntes} sufijo="" frente="el mes pasado" />)}
            pie={pie(`Frente a ${enProcesoAntes} el mes pasado`, `Repartidas en ${vacantesConGente} ${plural(vacantesConGente, 'vacante', 'vacantes')}`)}
          />
          <ColumnaIndicador
            titulo="Esperando acción"
            ayuda={<Ayuda titulo="Esperando acción">Personas en un proceso que esperan una acción tuya para seguir: revisarlas, moverlas o responderles. Menos es mejor. Se compara con la semana pasada.</Ayuda>}
            cifra={cifra(esperan.length, <Cambio valor={esperan.length - esperanAntes} sufijo="" menosEsMejor frente="la semana pasada" />)}
            pie={pie(
              `Frente a ${esperanAntes} la semana pasada`,
              esperan.length ? `La que más: ${esperan[0].persona.nombre} (${esperan[0].dias} ${plural(esperan[0].dias, 'día', 'días')})` : 'Nadie está esperando ahora mismo',
            )}
          />
        </FilaIndicadores>
      </Frame>
    </section>
  )
}

// La celda mientras cargan las cifras: el rótulo de verdad y, en gris, el número (28px de línea) y su detalle (16px). La
// usan también las cifras de «Reclutamiento» (exploración 4).
export function Celda({ cifra, cargando }: { cifra: Parameters<typeof CeldaCifra>[0]['cifra']; cargando: boolean }) {
  if (!cargando) return <CeldaCifra cifra={cifra} />
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Text as="span" variant="muted" size="sm">
        {cifra.etiqueta}
      </Text>
      <span aria-hidden="true" className="flex h-7 items-center">
        <Skeleton className="h-5.5 w-12" />
      </span>
      <LineaEsqueleto tamano="chico" ancho="w-40 max-w-full" />
    </div>
  )
}

// El atajo («Ver solo las publicadas») mientras cargan: una línea del alto del enlace (22px).
export function AtajoCargando() {
  return <LineaEsqueleto ancho="w-36 max-w-full" className="h-5.5" />
}
