import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ArrowDataTransferHorizontalIcon,
  Cancel01Icon,
  Copy01Icon,
  Download04Icon,
  Mail01Icon,
  MoreHorizontalIcon,
  UserRemove01Icon,
} from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Button,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Field,
  FieldDescription,
  FieldLabel,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { VentanaDeAccion } from '@/modules/design-system/drawers/components/drawer-anidado'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { Hint } from '@/shared/components/Hint'
import { PageActionBar } from '@/shared/components/PageShell'
import { notify } from '@/shared/components/notify'
import { cumplidosDe, siguienteEtapaDe, tituloEtapa, type Candidatura, type VacanteUI } from '../../propuestas/datos'
import type { Bloqueo, Cambio } from '../../propuestas/components/use-proceso'
import { QUIEN_MUEVE, registroDeMovimientos } from '../../propuestas/movimientos'
import { noSeGuardo } from '../../propuestas/simular'
import { motion } from 'motion/react'
import { CifraAnimada } from '../../propuestas/components/cifra-animada'
import { RESORTE } from '../../propuestas/components/animacion'

// Trabajar con varias personas a la vez en la bandeja (24 sep, Nicolás: «construye algo mejor con esas selecciones
// múltiples, que las acciones masivas sean más, la opción de seleccionar todo tampoco la veo»). Antes la barra decía
// «›  ✕  Quitar (3)»: dos iconos sin nombre y el botón principal gastado en deshacer la selección.
//
// - Arriba de la lista, «Seleccionar todas» y cuántas van («3 de 9 seleccionadas · Quitar selección»).
// - Abajo, una barra flotante con las caras de quienes van, las acciones con su nombre (mover, escribirles, pedir
//   opinión; exportar y copiar correos en «⋯»), rechazar aparte y en rojo, y avanzar como la acción principal.

const personas = (n: number) => `${n} ${n === 1 ? 'persona' : 'personas'}`

export type { Cambio } from '../../propuestas/components/use-proceso'

// ── Seleccionar todas ──
export function SeleccionarTodas({
  visibles,
  marcadas,
  onCambiar,
}: {
  // Candidaturas en la bandeja de una vacante, personas en la de la base: solo se mira quién es cada una.
  visibles: { id: string }[]
  marcadas: string[]
  onCambiar: (ids: string[]) => void
}) {
  const enVista = visibles.filter((c) => marcadas.includes(c.id)).length
  const todas = visibles.length > 0 && enVista === visibles.length

  return (
    <div className="flex shrink-0 items-center gap-3 border-b px-5 py-2.5">
      {/* Sin estado «a medias»: la casilla de la librería lo dibuja con el mismo visto que «todas» y daría a entender
          que todo está marcado (para reportar a librería). Cuántas van lo dice el texto de al lado. */}
      <Checkbox
        checked={todas}
        onCheckedChange={() => onCambiar(todas ? [] : visibles.map((c) => c.id))}
        aria-label={todas ? 'Quitar la selección' : `Seleccionar a las ${visibles.length} personas de la lista`}
      />
      <Text as="span" size="sm" className="tabular-nums">
        {marcadas.length ? `${marcadas.length} de ${visibles.length} seleccionadas` : 'Seleccionar todas'}
      </Text>
      {marcadas.length ? (
        <Button variant="link" size="sm" className="ml-auto h-auto! p-0!" onClick={() => onCambiar([])}>
          Quitar selección
        </Button>
      ) : null}
    </div>
  )
}

// ── La barra y sus ventanas ──
type Ventana = 'correo' | 'opinion' | null

const PLANTILLAS = [
  {
    id: 'entrevista',
    titulo: 'Invitación a entrevista',
    texto:
      'Hola {nombre}, gracias por tu interés en la vacante de {vacante}. Queremos conocerte: responde este correo con dos horarios que te queden bien esta semana.',
  },
  {
    id: 'documentos',
    titulo: 'Solicitud de documentos',
    texto:
      'Hola {nombre}, para seguir con tu proceso en {vacante} necesitamos tu certificado laboral y tu documento de identidad. Puedes responder este correo con los archivos.',
  },
  {
    id: 'actualizacion',
    titulo: 'Actualización del proceso',
    texto:
      'Hola {nombre}, te escribimos para contarte que tu proceso en {vacante} sigue avanzando. Te avisaremos apenas tengamos novedades.',
  },
]

export function BarraEnLote({
  vacante,
  marcadas,
  onLimpiar,
  onMover,
  onElegirEtapa,
  onRechazar,
  bloqueo,
}: {
  vacante: VacanteUI
  marcadas: Candidatura[]
  onLimpiar: () => void
  // «Avanzar de etapa»: cada una a la siguiente de la suya.
  onMover: (cambios: Cambio[]) => void
  // «Mover a…»: la ventana de mover para varias (elegir la etapa, escribirles, comentar), la misma de una persona.
  onElegirEtapa: () => void
  onRechazar: (candidaturas: Candidatura[]) => void
  // Con la vacante cerrada no se mueve ni se rechaza: los botones lo dicen al pasar el cursor.
  bloqueo?: Bloqueo | null
}) {
  const [ventana, setVentana] = useState<Ventana>(null)
  const [plantilla, setPlantilla] = useState(PLANTILLAS[0].id)
  const [mensaje, setMensaje] = useState(PLANTILLAS[0].texto)
  const [revisores, setRevisores] = useState<string[]>([])
  const [pedido, setPedido] = useState('')

  const cuantas = marcadas.length
  // A quiénes afecta, con su etapa: se ve en cada ventana antes de confirmar.
  const quienes = marcadas.map((c) => ({ ini: c.candidato.iniciales, title: c.candidato.nombre, meta: tituloEtapa(c.etapa) }))
  // Cada una avanza a la siguiente de **su** etapa; quien ya está en la última se queda.
  const avances = marcadas.flatMap((c) => {
    const siguiente = siguienteEtapaDe(vacante.etapas, c.etapa)
    return siguiente ? [{ candidatura: c, destino: siguiente }] : []
  })

  const abrir = (cual: Ventana) => {
    setPlantilla(PLANTILLAS[0].id)
    setMensaje(PLANTILLAS[0].texto)
    setRevisores([])
    setPedido('')
    setVentana(cual)
  }

  const exportar = () => {
    const filas = [
      ['Nombre', 'Correo', 'Celular', 'Cargo actual', 'Empresa', 'Etapa', 'Días en la etapa', 'Requisitos que cumple'],
      ...marcadas.map((c) => [
        c.candidato.nombre,
        c.candidato.correo,
        c.candidato.celular,
        c.candidato.cargo,
        c.candidato.empresa,
        tituloEtapa(c.etapa),
        String(c.dias),
        `${cumplidosDe(c.criterios)} de ${c.criterios.length}`,
      ]),
    ]
    const csv = filas.map((fila) => fila.map((celda) => `"${celda.replaceAll('"', '""')}"`).join(',')).join('\n')
    const enlace = document.createElement('a')
    enlace.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' }))
    enlace.download = `${vacante.titulo} · ${personas(cuantas)}.csv`
    enlace.click()
    URL.revokeObjectURL(enlace.href)
    notify(`Exportaste ${personas(cuantas)}`, 'El archivo CSV quedó en tus descargas.', 'success')
  }

  const copiarCorreos = () => {
    const correos = marcadas.map((c) => c.candidato.correo).join(', ')
    void navigator.clipboard?.writeText(correos)
    notify(`Copiaste ${cuantas === 1 ? '1 correo' : `${cuantas} correos`}`, correos, 'success')
  }

  return (
    <>
      {/* La barra: la superficie de la barra de acciones del proyecto (`PageActionBar`: fondo del tema, borde, esquina y
          sombra), flotando dentro de la tarjeta de candidatos. Antes era la `FloatingActionBar` de la librería, que pinta
          un azul marino fijo que no es del tema (su variante clara no existe, aunque se declare) y deja las acciones como
          iconos sueltos. Nicolás, 24 sep: «hazle un glow up, para mí se ve horrible». Ahora: a quién se le aplica (sus
          caras), qué se puede hacer (con nombre), rechazar aparte y avanzar como la acción principal. */}
      {/* Sube desde abajo con resorte al elegir a la primera persona y baja al soltar a la última (va dentro de un
          `AnimatePresence` en la página); la cuenta cambia contando (15 oct, glow up de movimiento). */}
      <motion.div
        // Dónde flota lo decide la página (pegada abajo mientras el tablero se ve).
        className="w-max max-w-full"
        initial={{ opacity: 0, y: 28, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 22, scale: 0.96, transition: { duration: 0.18 } }}
        transition={RESORTE}
      >
      <PageActionBar className="mt-0 gap-2 py-2 pr-2 pl-3">
        <div className="flex items-center gap-2.5 pr-1" role="status">
          <Text as="span" size="sm" weight="medium" className="whitespace-nowrap tabular-nums">
            <CifraAnimada valor={cuantas} duracion={0.35} /> {cuantas === 1 ? 'seleccionada' : 'seleccionadas'}
          </Text>
        </div>

        <Separator orientation="vertical" className="h-6! max-md:hidden" />

        {/* Lo ocasional, en el menú normal de la librería (el de la barra vieja salía blanco sobre blanco). Primero de las
            acciones, a la izquierda de todo: «⋯» · terciario · secundario · primario (25 sep). */}
        <DropdownMenu>
          <Hint label="Más acciones" side="top">
            <DropdownMenuTrigger render={<BotonIcono size="icon" aria-label="Más acciones" />}>
              <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
            </DropdownMenuTrigger>
          </Hint>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={exportar}>
                <HugeiconsIcon icon={Download04Icon} size={16} />
                Exportar a CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={copiarCorreos}>
                <HugeiconsIcon icon={Copy01Icon} size={16} />
                Copiar sus correos
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <Hint label={bloqueo ? bloqueo.corto : 'Elegir la etapa, escribirles y dejar un comentario'} side="top">
          <Button variant="ghost" onClick={onElegirEtapa} disabled={Boolean(bloqueo)}>
            <HugeiconsIcon icon={ArrowDataTransferHorizontalIcon} size={16} />
            Mover a…
          </Button>
        </Hint>
        <Button variant="ghost" onClick={() => abrir('correo')}>
          <HugeiconsIcon icon={Mail01Icon} size={16} />
          Enviar correo
        </Button>
        {/* «Pedir opinión» queda oculto por ahora (25 sep, Nicolás: «ocultemos esto de pedir opinión»). Su ventana sigue
            abajo por si vuelve: basta con devolver aquí el botón que la abre con `abrir('opinion')`. */}

        <Separator orientation="vertical" className="h-6! max-md:hidden" />

        <Button variant="destructive" onClick={() => onRechazar(marcadas)} disabled={Boolean(bloqueo)}>
          <HugeiconsIcon icon={UserRemove01Icon} size={16} />
          Rechazar
        </Button>
        {/* Lo que más se hace con varias a la vez: pasarlas a su siguiente etapa. Si todas están en la última, no hay a
            dónde avanzar y el botón lo dice; con la vacante cerrada, tampoco. */}
        <Button onClick={() => onMover(avances)} disabled={!avances.length || Boolean(bloqueo)}>
          {bloqueo ? 'Vacante cerrada' : avances.length ? 'Avanzar de etapa' : 'Ya están en la última etapa'}
        </Button>
        <Hint label="Quitar la selección" side="top">
          <BotonIcono size="icon" aria-label="Quitar la selección" onClick={onLimpiar}>
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </BotonIcono>
        </Hint>
      </PageActionBar>
      </motion.div>

      {/* Escribirles a todas con una plantilla que se puede ajustar; cada una recibe su nombre. */}
      <VentanaDeAccion
        open={ventana === 'correo'}
        onOpenChange={(abierta) => !abierta && setVentana(null)}
        size="wide"
        title={`Escribirle a ${personas(cuantas)}`}
        sub="Cada correo sale por separado y con el nombre de quien lo recibe. Sale al confirmar."
        items={quienes}
        confirmLabel={`Enviar ${cuantas === 1 ? 'el correo' : `${cuantas} correos`}`}
        pendingLabel="Enviando…"
        confirmDisabled={!mensaje.trim()}
        onConfirm={function escribir() {
          const titulo = PLANTILLAS.find((p) => p.id === plantilla)?.titulo
          if (noSeGuardo(`lote-correo:${marcadas.map((c) => c.id).join(',')}:${plantilla}`, 'No pudimos enviar los correos', escribir, 'No salió ninguno.')) return setVentana(null)
          // Cada correo queda en el historial de su persona, con quién lo mandó y la plantilla (VA-34).
          const cuando = Date.now()
          registroDeMovimientos.agregar(
            marcadas.map((c) => ({
              id: `${c.id}=correo@${cuando}`,
              tipo: 'correo' as const,
              candidaturaId: c.id,
              desde: c.etapa,
              hacia: c.etapa,
              cuando,
              dias: c.dias,
              quien: QUIEN_MUEVE,
              saltadas: [],
              aviso: titulo ?? 'Correo',
            })),
          )
          notify(`Enviaste ${cuantas === 1 ? '1 correo' : `${cuantas} correos`}`, titulo ? `«${titulo}».` : undefined, 'success')
          setVentana(null)
        }}
      >
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>Plantilla</FieldLabel>
            <Select
              value={plantilla}
              onValueChange={(valor) => {
                setPlantilla(valor as string)
                setMensaje(PLANTILLAS.find((p) => p.id === valor)?.texto ?? '')
              }}
            >
              <SelectTrigger className="w-full" aria-label="Plantilla del correo">
                <SelectValue>{(valor: string) => PLANTILLAS.find((p) => p.id === valor)?.titulo}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PLANTILLAS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.titulo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel>Mensaje</FieldLabel>
            <Textarea value={mensaje} onChange={(evento) => setMensaje(evento.target.value)} rows={5} />
            <FieldDescription>{'{nombre}'} y {'{vacante}'} se cambian por los datos de cada persona.</FieldDescription>
          </Field>
        </div>
      </VentanaDeAccion>

      {/* Pedir opinión: a quién del equipo de la vacante y qué se quiere que miren. */}
      <VentanaDeAccion
        open={ventana === 'opinion'}
        onOpenChange={(abierta) => !abierta && setVentana(null)}
        title={`Pedir opinión sobre ${personas(cuantas)}`}
        sub="Les llega un aviso con las fichas; su respuesta queda en las notas de cada persona."
        items={quienes}
        confirmLabel="Pedir opinión"
        pendingLabel="Pidiendo opinión…"
        confirmDisabled={!revisores.length}
        onConfirm={function pedir() {
          const nombres = vacante.equipo.filter((m) => revisores.includes(m.correo)).map((m) => m.nombre.split(' ')[0])
          if (noSeGuardo(`opinion:${revisores.join(',')}`, 'No pudimos pedir su opinión', pedir, 'No le llegó a nadie.')) return setVentana(null)
          notify(`Le pediste su opinión a ${nombres.join(' y ')}`, `Sobre ${personas(cuantas)} de ${vacante.titulo}.`, 'success')
          setVentana(null)
        }}
      >
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>A quién</FieldLabel>
            <div className="flex flex-col gap-1.5">
              {vacante.equipo.map((miembro) => {
                const elegido = revisores.includes(miembro.correo)
                return (
                  <Item key={miembro.correo} size="sm" variant="outline" render={<label />} className="cursor-pointer">
                    {/* Centrada con el avatar: una caja de su mismo alto (24px). */}
                    <ItemMedia className="h-6">
                      <Checkbox
                        checked={elegido}
                        onCheckedChange={() =>
                          setRevisores((antes) => (elegido ? antes.filter((c) => c !== miembro.correo) : [...antes, miembro.correo]))
                        }
                      />
                    </ItemMedia>
                    <ItemMedia>
                      <Avatar size="sm">
                        <AvatarFallback>{miembro.iniciales}</AvatarFallback>
                      </Avatar>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{miembro.nombre}</ItemTitle>
                      <ItemDescription>{miembro.permiso}</ItemDescription>
                    </ItemContent>
                  </Item>
                )
              })}
            </div>
          </Field>
          <Field>
            <FieldLabel>Qué quieres que miren (opcional)</FieldLabel>
            <Textarea
              value={pedido}
              onChange={(evento) => setPedido(evento.target.value)}
              rows={3}
              placeholder="Por ejemplo: ¿alguna te parece para la entrevista con el equipo?"
            />
          </Field>
        </div>
      </VentanaDeAccion>
    </>
  )
}
