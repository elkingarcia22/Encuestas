import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  AiMagicIcon,
  Alert01Icon,
  Alert02Icon,
  AlertCircleIcon,
  ArrowRight01Icon,
  CheckmarkBadge01Icon,
  CheckmarkCircle02Icon,
  DashboardSquare01Icon,
  DashboardSquare02Icon,
  Edit02Icon,
  InformationCircleIcon,
  MagicWand01Icon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  Mortarboard01Icon,
  Mortarboard02Icon,
  MortarboardIcon,
  PencilEdit01Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  SparklesIcon,
  TaskDone01Icon,
  Tick02Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  UserMultipleIcon,
} from '@hugeicons/core-free-icons'
import type { IconSvgElement } from '@hugeicons/react'
import {
  Badge,
  Button,
  DrawerClose,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  Text,
} from '@ubits/flux-ui'

import { DrawerShell } from '../drawers/components/drawer-shell'
import { FilaCifras } from '@/modules/admin/inicio/components/bloques'
import { EncabezadoPatron, PestanasDePatron, Reglas, SectionIntro } from '../patrones/piezas'
import {
  BIEN,
  CONCEPTOS,
  ESTADO,
  ORDEN,
  PERSONAS,
  PESTANAS,
  POR_PESTANA,
  RESUELTOS,
  REVISION,
  TAMANOS,
  VOCABULARIO,
  type Estado,
  type Hallazgo,
  type Pestana,
} from './datos'
import { ENLACES, type Enlace } from './enlaces'
import { Hint } from '@/shared/components/Hint'

// Unificación: las formas distintas de maquetar la misma pieza que conviven en el proyecto (Cristian, Nicolás, David
// y Elkin), la deuda del tema y lo que el check no ve. Primera auditoría el 17-sep sobre develop; segunda el 28-sep
// sobre staging. Cada pestaña es una entrada del menú; la ruta /design-system/unificacion/:pestana elige cuál se ve.

const ICONO: Record<string, IconSvgElement> = {
  PlusSignIcon,
  Add01Icon,
  Tick02Icon,
  CheckmarkCircle02Icon,
  TaskDone01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  SparklesIcon,
  AiMagicIcon,
  Mortarboard01Icon,
  MortarboardIcon,
  Alert02Icon,
  Alert01Icon,
  DashboardSquare02Icon,
  DashboardSquare01Icon,
  CheckmarkBadge01Icon,
  UserMultipleIcon,
  Edit02Icon,
  PencilEdit02Icon,
  PencilEdit01Icon,
  MoreHorizontalIcon,
  MoreVerticalIcon,
  InformationCircleIcon,
  AlertCircleIcon,
  Mortarboard02Icon,
  MagicWand01Icon,
}

const TODOS = Object.values(POR_PESTANA).flat()

type Abierta = { titulo: string; clave: string } | null
type Abrir = (abierta: Abierta) => void

// Agrupa los archivos por pantalla: una pantalla puede tener la variante en varios archivos (main y sus piezas).
function porPantalla(lista: Enlace[]) {
  const grupos = new Map<string, { pantalla: string; ruta: string | null; compartido: boolean; archivos: Enlace[] }>()
  for (const enlace of lista) {
    const llave = enlace.ruta ?? enlace.archivo
    const grupo = grupos.get(llave) ?? { pantalla: enlace.pantalla, ruta: enlace.ruta, compartido: false, archivos: [] }
    grupo.compartido ||= enlace.compartido
    grupo.archivos.push(enlace)
    grupos.set(llave, grupo)
  }
  return [...grupos.values()]
}

function cuantasPantallas(clave: string) {
  return porPantalla(ENLACES[clave] ?? []).length
}

// Cifra que abre la lista de pantallas donde aparece la variante.
function CifraConEnlace({ clave, titulo, abrir }: { clave: string; titulo: string; abrir: Abrir }) {
  const lista = ENLACES[clave] ?? []
  const pantallas = cuantasPantallas(clave)
  return (
    <Button variant="link" size="xs" className="h-auto px-0" onClick={() => abrir({ titulo, clave })}>
      {pantallas === 1 ? '1 pantalla' : `${pantallas} pantallas`}
      {lista.length !== pantallas ? ` · ${lista.length} archivos` : ''}
    </Button>
  )
}

function PanelPantallas({ abierta, cerrar }: { abierta: Abierta; cerrar: () => void }) {
  const grupos = abierta ? porPantalla(ENLACES[abierta.clave] ?? []) : []
  return (
    <DrawerShell
      open={abierta !== null}
      onOpenChange={(abierto) => (abierto ? undefined : cerrar())}
      title={abierta?.titulo ?? ''}
      description={`${grupos.length === 1 ? '1 pantalla' : `${grupos.length} pantallas`}. Cada una abre donde se ve; debajo, el archivo, cuántas veces aparece y de quién es.`}
      footer={<DrawerClose render={<Button variant="outline" />}>Cerrar</DrawerClose>}
    >
      <ItemGroup className="flex flex-col gap-1">
        {grupos.map((grupo) => {
          const contenido = (
            <>
              <ItemContent>
                <ItemTitle>{grupo.pantalla}</ItemTitle>
                {grupo.archivos.map((archivo) => (
                  <ItemDescription key={archivo.archivo} className="break-all">
                    {archivo.archivo.replace(/^src\/modules\//, '')} · {archivo.usos} · {archivo.autor}
                  </ItemDescription>
                ))}
              </ItemContent>
              <ItemActions>
                {grupo.compartido ? <Badge variant="outline">Pieza compartida</Badge> : null}
                {grupo.ruta ? (
                  <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                ) : (
                  <Badge variant="outline">Sin enlace</Badge>
                )}
              </ItemActions>
            </>
          )
          return grupo.ruta ? (
            <Item key={grupo.ruta} size="sm" variant="outline" render={<Link to={grupo.ruta} onClick={cerrar} />}>
              {contenido}
            </Item>
          ) : (
            <Item key={grupo.archivos[0].archivo} size="sm" variant="outline">
              {contenido}
            </Item>
          )
        })}
      </ItemGroup>
    </DrawerShell>
  )
}
const cuantos = (estado: Estado) => String(TODOS.filter((hallazgo) => hallazgo.estado === estado).length)

function TarjetaHallazgo({ hallazgo, abrir }: { hallazgo: Hallazgo; abrir: Abrir }) {
  const estado = ESTADO[hallazgo.estado]
  return (
    <Frame id={hallazgo.id}>
      <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <FrameTitle>{hallazgo.titulo}</FrameTitle>
          <FrameDescription>{hallazgo.resumen}</FrameDescription>
        </div>
        <Hint label={estado.ayuda}>
          <Badge variant={estado.badge}>{estado.etiqueta}</Badge>
        </Hint>
      </FrameHeader>
      <FramePanel className="grid gap-6 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-2">
          <Text as="span" variant="muted" size="xs" weight="medium">
            Hoy
          </Text>
          <Table>
            <TableBody>
              {hallazgo.hoy.map((variante) => (
                <TableRow key={variante.forma}>
                  <TableCell className="whitespace-normal">
                    <Text as="span" size="sm">
                      {variante.forma}
                    </Text>
                    {variante.detalle ? (
                      <Text as="span" variant="muted" size="xs" className="block">
                        {variante.detalle}
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-right whitespace-normal">
                    {variante.clave ? (
                      <CifraConEnlace clave={variante.clave} titulo={variante.forma} abrir={abrir} />
                    ) : (
                      <Text as="span" size="sm" weight="semibold">
                        {variante.cifra}
                      </Text>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <Text as="span" variant="muted" size="xs" weight="medium">
            Propuesta
          </Text>
          <Text as="p" size="sm">
            {hallazgo.propuesta}
          </Text>
          {hallazgo.donde ? (
            <Text as="p" variant="muted" size="xs">
              Dónde: {hallazgo.donde.join(' · ')}
            </Text>
          ) : null}
        </div>
      </FramePanel>
    </Frame>
  )
}

// Archivos de cada persona que usan una variante. Ingeniería (el andamiaje original) no entra en la tabla.
function archivosDe(clave: string, persona: string) {
  return (ENLACES[clave] ?? []).filter((enlace) => enlace.autor === persona).length
}

function QuienUsaQue({ abrir }: { abrir: Abrir }) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Quién usa qué</FrameTitle>
        <FrameDescription>
          Archivos de cada persona que resuelven la pieza de esa forma. Una fila con cifras en dos variantes es una pieza
          que el equipo hace de dos maneras. Toca la variante para ver las pantallas.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pieza</TableHead>
              <TableHead>Variante</TableHead>
              {PERSONAS.map((persona) => (
                <TableHead key={persona} className="text-right">
                  {persona}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {VOCABULARIO.flatMap((fila) =>
              fila.variantes.map((variante, indice) => (
                <TableRow key={variante.clave}>
                  <TableCell>
                    {indice === 0 ? (
                      <Text as="span" size="sm" weight="medium">
                        {fila.tema}
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      size="xs"
                      className="h-auto px-0"
                      onClick={() => abrir({ titulo: `${fila.tema}: ${variante.forma}`, clave: variante.clave })}
                    >
                      {variante.forma}
                    </Button>
                  </TableCell>
                  {PERSONAS.map((persona) => {
                    const cuantos = archivosDe(variante.clave, persona)
                    return (
                      <TableCell key={persona} className="text-right">
                        <Text as="span" size="sm" variant={cuantos === 0 ? 'muted' : undefined}>
                          {cuantos === 0 ? '–' : cuantos}
                        </Text>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )),
            )}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  )
}

function Resumen({ abrir }: { abrir: Abrir }) {
  return (
    <div className="flex flex-col gap-6">
      <Frame>
        <FramePanel>
          <FilaCifras
            columnas="sm:grid-cols-2 lg:grid-cols-4"
            cifras={[
              { etiqueta: 'Por arreglar', valor: cuantos('arreglar'), detalle: 'Se ve mal hoy o se puede caer' },
              { etiqueta: 'Por decidir', valor: cuantos('decidir'), detalle: 'Entre todo el equipo' },
              { etiqueta: 'Limpieza', valor: cuantos('limpiar'), detalle: 'No cambia lo que se ve' },
              {
                etiqueta: 'Pantallas revisadas',
                valor: REVISION.pantallas,
                detalle: `${REVISION.archivos} archivos de ${REVISION.rama}, ${REVISION.fecha}`,
              },
            ]}
          />
        </FramePanel>
      </Frame>

      <Reglas titulo="Lo que está bien en todo el equipo" reglas={BIEN} />

      <Reglas titulo="Resuelto desde el 17 de septiembre" reglas={RESUELTOS} />

      <QuienUsaQue abrir={abrir} />

      <div className="flex flex-col gap-3">
        <SectionIntro
          title="Los frentes"
          description="El problema no es que se rompan las reglas: cada persona tiene su vocabulario para decir lo mismo, y cada uno es coherente consigo mismo."
        />
        <ItemGroup className="gap-2">
          {PESTANAS.filter((pestana) => pestana.valor !== 'resumen').map((pestana) => {
            const hallazgos = POR_PESTANA[pestana.valor as Exclude<Pestana, 'resumen'>]
            return (
              <Item key={pestana.valor} variant="outline" render={<Link to={pestana.ruta} />}>
                <ItemContent>
                  <ItemTitle>{pestana.etiqueta}</ItemTitle>
                  <ItemDescription>{pestana.bajada}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="outline">{hallazgos.length} hallazgos</Badge>
                  <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      </div>

      <Reglas titulo="Orden sugerido" reglas={ORDEN} pendiente />
    </div>
  )
}

function VocabularioIconos({ abrir }: { abrir: Abrir }) {
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Dónde se ve la fusión</FrameTitle>
        <FrameDescription>
          Empates entre vocabularios paralelos. La cifra es en cuántas pantallas aparece cada icono; toca uno para ver cuáles y de quién son.
        </FrameDescription>
      </FrameHeader>
      <FramePanel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Concepto</TableHead>
              <TableHead>Iconos en uso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {CONCEPTOS.map((fila) => (
              <TableRow key={fila.concepto}>
                <TableCell>
                  <Text as="span" size="sm" weight="medium">
                    {fila.concepto}
                  </Text>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <div className="flex flex-wrap gap-2">
                    {fila.iconos.map((icono) => {
                      const nombre = icono.nombre.replace(/Icon$/, '')
                      const clave = `icono:${icono.nombre}`
                      return (
                        <Button
                          key={icono.nombre}
                          variant="outline"
                          size="sm"
                          onClick={() => abrir({ titulo: `${fila.concepto}: ${nombre}`, clave })}
                        >
                          <HugeiconsIcon icon={ICONO[icono.nombre]} aria-hidden="true" data-icon="inline-start" />
                          {nombre} · {cuantasPantallas(clave)}
                        </Button>
                      )
                    })}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FramePanel>
      <FramePanel className="flex flex-col gap-2">
        <Text as="span" variant="muted" size="xs" weight="medium">
          Tamaños fijados a mano (size)
        </Text>
        <div className="flex flex-wrap gap-2">
          {TAMANOS.map((tamano) => (
            <Badge key={tamano.medida} variant={['14', '16', '20'].includes(tamano.medida) ? 'success-light' : 'outline'}>
              {tamano.medida} px · {tamano.usos}
            </Badge>
          ))}
        </div>
      </FramePanel>
    </Frame>
  )
}

export function Component() {
  const { pestana } = useParams()
  const navigate = useNavigate()
  const activa = PESTANAS.find((item) => item.valor === pestana)?.valor ?? 'resumen'
  const actual = PESTANAS.find((item) => item.valor === activa)!
  const [abierta, setAbierta] = useState<Abierta>(null)

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPatron
        titulo={activa === 'resumen' ? 'Unificación' : actual.etiqueta}
        antetitulo="Design system · Unificación"
        etiqueta={<Badge variant="warning-light">Revisado el {REVISION.fecha} en {REVISION.rama}</Badge>}
      >
        Las piezas que cada persona resuelve a su manera (Cristian, Nicolás, David y Elkin), la deuda del tema y lo que el
        check no está viendo. Cada punto dice cómo está hoy, en qué pantallas y de quién; las decisiones las toma el equipo.
      </EncabezadoPatron>

      <Tabs
        value={activa}
        onValueChange={(valor) => navigate(PESTANAS.find((item) => item.valor === valor)?.ruta ?? '/design-system/unificacion')}
      >
        <PestanasDePatron items={PESTANAS} />
      </Tabs>

      {activa === 'resumen' ? (
        <Resumen abrir={setAbierta} />
      ) : (
        <div className="flex flex-col gap-4">
          {activa === 'iconos' ? <VocabularioIconos abrir={setAbierta} /> : null}
          {POR_PESTANA[activa].map((hallazgo) => (
            <TarjetaHallazgo key={hallazgo.id} hallazgo={hallazgo} abrir={setAbierta} />
          ))}
        </div>
      )}

      <PanelPantallas abierta={abierta} cerrar={() => setAbierta(null)} />
    </div>
  )
}

Component.displayName = 'DesignSystemUnificacionPage'
