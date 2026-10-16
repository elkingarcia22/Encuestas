import { useEffect, useRef, useState, type ReactNode } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Archive02Icon,
  Delete02Icon,
  Logout01Icon,
  LogoutSquare01Icon,
  Megaphone02Icon,
  TaskEdit01Icon,
} from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertTitle,
  Badge,
  Button,
  Heading,
  IconTile,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  toast,
} from '@ubits/flux-ui'

import { ConfirmarEliminar } from '../data-grid/casos/seguimiento'
import { Demo, Reglas, SectionIntro, type Regla } from '../patrones/piezas'
import { DrawerAnidado } from '../drawers/components/drawer-anidado'
import { usePanelActual } from '../drawers/components/panel-actual'

// Cuánto cuesta confirmar debe crecer con lo que se pierde. Cuatro escalones, cada uno con un
// caso de UBITS: deshacer, salir sin guardar, avisar a otros y borrar en masa.

const ESCALERA = [
  {
    situacion: 'Se puede deshacer',
    patron: 'No preguntes: hazlo y ofrece «Deshacer» en el aviso',
    ejemplo: 'Archivar un curso del catálogo',
  },
  {
    situacion: 'Se pierde trabajo sin guardar',
    patron: 'Ventana corta con el icono de salir; seguir editando, siempre a mano',
    ejemplo: 'Salir del hub de Crear evaluación 360°',
  },
  {
    situacion: 'Le llega a otras personas o no se revierte',
    patron: 'Ventana que dice a quién, a cuántos y qué pasa después',
    ejemplo: 'Activar un aviso interno (correo a toda la empresa)',
  },
  {
    situacion: 'Borra mucho o para todos',
    patron: 'Escribir una palabra para habilitar el botón',
    ejemplo: 'Eliminar planes o tareas en Seguimiento',
  },
]

// Dos ventanas, cada una con su trabajo (Cristian, 6-oct): DialogoConfirmar para preguntar antes de hacer algo
// (eliminar, salir sin guardar, activar, descartar, enviar), también cuando muestra lo que se pierde; ActionDialog para
// todo lo que tiene contenido (formularios, listas para elegir —también confirmar a quiénes afecta—, vistas previas,
// detalles, ajustes). Esto reemplaza la «ventana única» del 5-oct.
//
// El diálogo de los escalones 2 a 4, controlado desde afuera. «disparador» es el
// AlertDialogTrigger cuando el botón vive junto al diálogo; sin él se abre con «abierto».
// El botón de acción dice lo que va a pasar y no cierra solo: lo cierra quien confirma.
// Con «enCurso» («Eliminando…»), al confirmar el botón muestra el spinner y ese texto un momento antes de llamar a
// `onConfirmar`, y mientras tanto no se cancela ni se confirma dos veces (la respuesta de una acción va en su botón).
// «otra» es una tercera salida, entre cancelar y la acción, para cuando hay dos formas de seguir: salir de una edición
// guardando o sin guardar (1 oct, Nicolás: las ventanas de la creación de vacantes, con la pieza del DS). Tampoco cierra
// sola.
export function DialogoConfirmar({
  abierto,
  onAbiertoChange,
  disparador,
  icono,
  titulo,
  descripcion,
  cancelar = 'Cancelar',
  otra,
  accion,
  destructiva = false,
  deshabilitada = false,
  enCurso,
  size,
  onConfirmar,
  children,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  disparador?: ReactNode
  icono?: IconSvgElement
  titulo: ReactNode
  descripcion: ReactNode
  cancelar?: string
  otra?: { texto: string; onClick: () => void }
  accion: ReactNode
  destructiva?: boolean
  deshabilitada?: boolean
  enCurso?: string
  size?: 'default' | 'sm'
  onConfirmar: () => void
  children?: ReactNode
}) {
  const [corriendo, setCorriendo] = useState(false)
  const espera = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(espera.current), [])
  const panel = usePanelActual()
  const confirmar = () => {
    if (!enCurso) return onConfirmar()
    setCorriendo(true)
    espera.current = window.setTimeout(() => {
      setCorriendo(false)
      onConfirmar()
    }, 700)
  }
  const cambiar = (abrir: boolean) => (corriendo && !abrir ? undefined : onAbiertoChange(abrir))

  // Pedida desde un drawer, la confirmación no se abre encima: se apila dentro de él, con la fila para volver (8 oct).
  if (panel) {
    return (
      <DrawerAnidado
        open={abierto}
        onOpenChange={cambiar}
        icon={icono}
        title={titulo}
        description={descripcion}
        footer={
          <>
            <Button variant="outline" disabled={corriendo} onClick={() => cambiar(false)}>
              {cancelar}
            </Button>
            {otra ? (
              <Button variant="outline" disabled={corriendo} onClick={otra.onClick}>
                {otra.texto}
              </Button>
            ) : null}
            <Button variant={destructiva ? 'destructive' : undefined} disabled={deshabilitada || corriendo} onClick={confirmar}>
              {corriendo ? <Spinner /> : null}
              {corriendo ? enCurso : accion}
            </Button>
          </>
        }
      >
        {children ? <div className="flex flex-col gap-4">{children}</div> : null}
      </DrawerAnidado>
    )
  }

  return (
    <AlertDialog open={abierto} onOpenChange={cambiar}>
      {disparador}
      <AlertDialogContent size={size}>
        {/* El icono va siempre arriba del título y todo alineado a la izquierda, en los dos tamaños (Cristian, 6-oct): la
            librería, en pantallas anchas, lo pasa a la izquierda del título, y en la chica centra todo. Se fuerza con «!»
            porque el tema va sin capa; está documentado en Design system › Marco › Ajustes propios. */}
        <AlertDialogHeader className="place-items-start! text-left! has-data-[slot=alert-dialog-media]:grid-rows-[auto_auto_1fr]!">
          {icono ? (
            <AlertDialogMedia className="row-span-1!">
              <HugeiconsIcon icon={icono} aria-hidden="true" />
            </AlertDialogMedia>
          ) : null}
          <AlertDialogTitle className="col-start-1!">{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descripcion}</AlertDialogDescription>
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={corriendo}>{cancelar}</AlertDialogCancel>
          {otra ? (
            <Button variant="outline" disabled={corriendo} onClick={otra.onClick}>
              {otra.texto}
            </Button>
          ) : null}
          <AlertDialogAction variant={destructiva ? 'destructive' : undefined} disabled={deshabilitada || corriendo} onClick={confirmar}>
            {corriendo ? (
              <>
                <Spinner />
                {enCurso}
              </>
            ) : (
              accion
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function SinPreguntar() {
  const [archivado, setArchivado] = useState(false)

  return (
    <Demo
      title="1 · Hacer y ofrecer deshacer"
      description="Archivar se revierte con un clic, así que no se interrumpe con un diálogo: se hace y el aviso trae la salida."
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium">
            Ventas consultivas
          </Text>
          <Badge variant={archivado ? 'outline' : 'success-light'} size="sm">
            {archivado ? 'Archivado' : 'Público'}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={archivado}
          onClick={() => {
            setArchivado(true)
            toast.add({
              type: 'success',
              title: 'Curso archivado',
              description: 'Ya no aparece en el catálogo.',
              actionProps: {
                children: 'Deshacer',
                onClick: () => {
                  setArchivado(false)
                  toast.add({ type: 'info', title: 'El curso volvió al catálogo' })
                },
              },
            })
          }}
        >
          <HugeiconsIcon icon={Archive02Icon} aria-hidden="true" />
          Archivar
        </Button>
      </div>
    </Demo>
  )
}

// Lo que se va a tocar, en el cuerpo de DialogoConfirmar: una tarjeta con el registro y su estado (diseño del 6-oct,
// lienzo «Ventana de confirmar»). El título de la ventana queda fijo y lo particular va aquí (Carlos, 1-oct).
// En el tamaño normal: icono, nombre y detalle, y el estado a la derecha. En el chico se condensa en dos líneas, sin
// icono y con el estado junto al detalle. El cambio de forma lo da el tamaño de la ventana (data-size de AlertDialog);
// las clases van escritas enteras para que Tailwind las encuentre.
export function RegistroConfirmar({
  nombre,
  detalle,
  estado,
  tono = 'aviso',
  icono = TaskEdit01Icon,
}: {
  nombre: string
  detalle: string
  // Lo que pasa con el registro: «Cambios sin guardar», «Borrador»… Sin él, la tarjeta no lleva insignia.
  estado?: string
  tono?: 'aviso' | 'neutro'
  icono?: IconSvgElement
}) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-0.5 rounded-xl border bg-muted/40 px-3.5 py-3 group-data-[size=sm]/alert-dialog-content:grid-cols-[minmax(0,1fr)_auto] group-data-[size=sm]/alert-dialog-content:gap-y-1.5">
      <IconTile variant="outline" className="col-start-1 row-span-2 row-start-1 group-data-[size=sm]/alert-dialog-content:hidden!">
        <HugeiconsIcon icon={icono} aria-hidden="true" />
      </IconTile>
      <Heading
        as="h3"
        level={6}
        className="col-start-2 row-start-1 text-pretty group-data-[size=sm]/alert-dialog-content:col-span-2 group-data-[size=sm]/alert-dialog-content:col-start-1"
      >
        {nombre}
      </Heading>
      <Text as="span" variant="muted" size="sm" className="col-start-2 row-start-2 group-data-[size=sm]/alert-dialog-content:col-start-1">
        {detalle}
      </Text>
      {estado ? (
        <Badge
          variant={tono === 'aviso' ? 'warning-light' : 'secondary'}
          size="sm"
          className="col-start-3 row-span-2 row-start-1 group-data-[size=sm]/alert-dialog-content:col-start-2 group-data-[size=sm]/alert-dialog-content:row-span-1 group-data-[size=sm]/alert-dialog-content:row-start-2"
        >
          {estado}
        </Badge>
      ) : null}
    </div>
  )
}

function SalirSinGuardar() {
  // Dos ventanas: crear (no hay borrador que guardar, dos salidas) y editar (se puede guardar al salir, tres salidas).
  const [creando, setCreando] = useState(false)
  const [editando, setEditando] = useState(false)
  const cerrarEdicion = () => setEditando(false)

  return (
    <Demo
      title="2 · Salir sin guardar"
      description="El borrador de una evaluación 360° solo vive mientras dura la creación. Al salir se avisa en una ventana de 448 px que no se cierra con un clic afuera. Si al salir también se puede guardar (editar algo que ya existe, como en Crear vacante), la misma ventana suma una tercera salida en el pie: «Seguir editando» · «Salir sin guardar» · «Guardar y salir», y pasa a 620 px porque en 448 los tres botones no caben."
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium">
            Evaluación de desempeño 2026-II
          </Text>
          <Badge variant="warning-light" size="sm">
            Sin guardar
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setCreando(true)}>
            <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
            Salir de la creación
          </Button>
          <Button variant="outline" size="sm" onClick={() => setEditando(true)}>
            <HugeiconsIcon icon={Logout01Icon} aria-hidden="true" />
            Salir de la edición
          </Button>
        </div>
        <DialogoConfirmar
          abierto={creando}
          onAbiertoChange={setCreando}
          size="sm"
          icono={LogoutSquare01Icon}
          titulo="¿Salir sin guardar?"
          descripcion="Lo que llevas se pierde: el borrador no se guarda al salir."
          cancelar="Seguir editando"
          accion="Salir sin guardar"
          destructiva
          onConfirmar={() => {
            setCreando(false)
            toast.add({ type: 'info', title: 'Saliste de la creación', description: 'El borrador se descartó.' })
          }}
        >
          <RegistroConfirmar nombre="Evaluación de desempeño 2026-II" detalle="Evaluación 360°" estado="Sin guardar" />
        </DialogoConfirmar>
        <DialogoConfirmar
          abierto={editando}
          onAbiertoChange={setEditando}
          icono={LogoutSquare01Icon}
          titulo="¿Salir sin guardar los cambios?"
          descripcion="La evaluación sigue como estaba hasta que guardes. Si sales ahora, se pierde lo que cambiaste."
          cancelar="Seguir editando"
          otra={{
            texto: 'Salir sin guardar',
            onClick: () => {
              cerrarEdicion()
              toast.add({ type: 'info', title: 'Saliste sin guardar', description: 'La evaluación quedó como estaba.' })
            },
          }}
          accion="Guardar y salir"
          onConfirmar={() => {
            cerrarEdicion()
            toast.add({ type: 'success', title: 'Cambios guardados' })
          }}
        >
          <RegistroConfirmar nombre="Evaluación de desempeño 2026-II" detalle="Evaluación 360° · en edición" estado="Cambios sin guardar" />
        </DialogoConfirmar>
      </div>
    </Demo>
  )
}

function ActivarAviso() {
  const [activo, setActivo] = useState(false)
  const [abierto, setAbierto] = useState(false)

  return (
    <Demo
      title="3 · Llega a otras personas"
      description="Crear un aviso interno no es activarlo. Activarlo manda un correo a toda la empresa, así que la ventana dice a cuántas personas y que ya no se podrá editar. Mientras se activa, el botón muestra el spinner y la ventana no se cierra."
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium">
            Cierre de año 2026
          </Text>
          <Badge variant={activo ? 'success-light' : 'secondary'} size="sm">
            {activo ? 'Activo' : 'Borrador'}
          </Badge>
        </div>
        <Button size="sm" disabled={activo} onClick={() => setAbierto(true)}>
          <HugeiconsIcon icon={Megaphone02Icon} aria-hidden="true" />
          Activar aviso
        </Button>
        <DialogoConfirmar
          abierto={abierto}
          onAbiertoChange={setAbierto}
          icono={Megaphone02Icon}
          titulo="¿Activar el aviso?"
          descripcion="Llegará por correo a las 646 personas de Meta Colombia en los próximos minutos. Una vez activo ya no se puede editar; si algo cambia, habrá que publicar otro aviso."
          cancelar="Todavía no"
          accion="Activar y enviar a 646 personas"
          enCurso="Activando…"
          onConfirmar={() => {
            setAbierto(false)
            setActivo(true)
            toast.add({
              type: 'success',
              title: 'Aviso activado',
              description: 'Se está enviando a 646 personas.',
            })
          }}
        >
          <RegistroConfirmar nombre="Cierre de año 2026" detalle="Aviso interno" estado="Borrador" tono="neutro" icono={Megaphone02Icon} />
        </DialogoConfirmar>
      </div>
    </Demo>
  )
}

function EscribirParaBorrar() {
  const [abierto, setAbierto] = useState(false)

  return (
    <Demo
      title="4 · Escribir para confirmar"
      description="Eliminar un plan de formación borra la asignación de todas las personas. Escribir la palabra obliga a leer lo que se va a hacer. Es ConfirmarEliminar, la pieza de Seguimiento y Tareas, en la misma ventana de confirmar con el icono de eliminar."
    >
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <Text size="sm" weight="medium">
            Onboarding comercial Q3
          </Text>
          <Badge variant="info-light" size="sm">
            84 personas
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={() => setAbierto(true)}>
          <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" />
          Eliminar plan
        </Button>
        <ConfirmarEliminar
          abierto={abierto}
          onAbiertoChange={setAbierto}
          cantidad={1}
          sustantivo={['plan', 'planes']}
          titulo="¿Eliminar el plan de formación?"
          descripcion="Las 84 personas que lo tienen lo pierden de su Zona de estudio. Su avance en los contenidos se conserva, pero el plan no se puede recuperar."
          accion="Eliminar plan"
          onConfirmar={() => toast.add({ type: 'success', title: 'Plan eliminado' })}
        />
      </div>
    </Demo>
  )
}

// Cómo se arma una confirmación (acuerdo del 6-oct: confirmar en DialogoConfirmar, contenido en ActionDialog).
const COMO_SE_ARMA: Regla[] = [
  { titulo: 'La ventana de confirmar', detalle: 'DialogoConfirmar para preguntar antes de hacer algo: eliminar, salir sin guardar, activar, descartar, enviar. Icono arriba, texto centrado, el clic afuera no la cierra.' },
  { titulo: 'Lo que tiene contenido va en ActionDialog', detalle: 'Formularios, listas para elegir, vistas previas, detalles y ajustes. También confirmar con la lista de a quiénes afecta («Mover 3 candidatos»).' },
  { titulo: 'El icono de lo que va a pasar', detalle: 'El de salir para abandonar una creación o una edición, la papelera para eliminar, el de la acción para lo demás.' },
  { titulo: 'Título fijo, el registro en el cuerpo', detalle: 'El título dice qué es la ventana («¿Activar el aviso?»); el nombre del registro y lo que se pierde van debajo, en el cuerpo.' },
  { titulo: 'Tres salidas en el pie', detalle: 'Cuando se puede guardar al salir: «Seguir editando» · «Salir sin guardar» · «Guardar y salir».' },
  { titulo: 'La respuesta, en el botón', detalle: 'Mientras la acción corre, el botón muestra el spinner y lo que pasa («Activando…»), y la ventana no se cierra ni se confirma dos veces.' },
]

export function EstadosConfirmaciones() {
  return (
    <div className="flex flex-col gap-6">
      <SectionIntro
        title="Confirmaciones"
        description="Pedir confirmación tiene un costo: interrumpe. Por eso sube de nivel según lo que se pierde. Cada escalón tiene un caso real de UBITS; ábrelos y compara. Todas van en la ventana de confirmar (DialogoConfirmar); lo que tiene contenido va en ActionDialog."
      />

      <Demo title="La escalera" description="De lo más liviano a lo más pesado. Si dudas entre dos, elige el de arriba.">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cuando la acción…</TableHead>
                <TableHead>Qué hacer</TableHead>
                <TableHead>Caso en UBITS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ESCALERA.map((fila, indice) => (
                <TableRow key={fila.situacion}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" size="sm">
                        {indice + 1}
                      </Badge>
                      {fila.situacion}
                    </div>
                  </TableCell>
                  <TableCell>{fila.patron}</TableCell>
                  <TableCell>
                    <Text as="span" variant="muted" size="sm">
                      {fila.ejemplo}
                    </Text>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Demo>

      <div className="grid gap-4 md:grid-cols-2">
        <SinPreguntar />
        <SalirSinGuardar />
        <ActivarAviso />
        <EscribirParaBorrar />
      </div>

      <Reglas titulo="Cómo se arma" reglas={COMO_SE_ARMA} />

      <Alert variant="info">
        <HugeiconsIcon icon={Megaphone02Icon} aria-hidden="true" />
        <AlertTitle>El botón dice exactamente lo que va a pasar</AlertTitle>
        <AlertDescription>
          «Eliminar 3 tareas» o «Activar y enviar a 646 personas», nunca «Aceptar» ni «Sí». Y la salida
          segura («Cancelar», «Seguir editando») siempre está a mano.
        </AlertDescription>
      </Alert>
    </div>
  )
}
