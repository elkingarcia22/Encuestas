import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Bug01Icon, Cancel01Icon, CropIcon, Idea01Icon, Image01Icon, ThumbsUpIcon, Upload01Icon } from '@hugeicons/core-free-icons'
import { useLocation } from 'react-router'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  Button,
  Checkbox,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Spinner,
  Textarea,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { ActionDialog } from '@/shared/components/ActionDialog'
import { CapturaArea } from '@/shared/components/CapturaArea'
import { usePageCrumbs } from '@/shared/components/page-crumbs'
import { getBreadcrumbs } from '@/shared/layouts/nav-config'
import ambienteAzul from '@/shared/assets/ambiente-azul.png'

type FeedbackDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Cada tipo cambia la ayuda del comentario: dice qué contar para que el equipo pueda actuar.
const TIPOS = [
  {
    valor: 'mejora',
    etiqueta: 'Mejora',
    icono: ThumbsUpIcon,
    ayuda: '¿Qué te costó o qué harías distinto? Cuéntanos qué intentabas hacer.',
  },
  {
    valor: 'error',
    etiqueta: 'Error',
    icono: Bug01Icon,
    ayuda: '¿Qué pasó y qué esperabas que pasara? Si puedes, di los pasos para repetirlo.',
  },
  {
    valor: 'idea',
    etiqueta: 'Idea',
    icono: Idea01Icon,
    ayuda: '¿Qué te gustaría poder hacer en UBITS y para qué te serviría?',
  },
] as const

type Tipo = (typeof TIPOS)[number]['valor']

// Un pantallazo adjunto: un recorte de la interfaz o una imagen subida. Todo es simulado (no hay archivos reales).
type Adjunto = {
  id: number
  tipo: 'recorte' | 'imagen'
  nombre: string
  detalle: string
  subiendo: boolean
}

const MAXIMO = 500
const MAX_ADJUNTOS = 5
// Lo que tarda el envío simulado: más de 300 ms para que «Enviando…» se lea como algo que pasa.
const ESPERA_ENVIO = 700

const CORREO = 'carolina.vargas@meta.com'

function IlustracionGlass({ categoria, nombre, tamano }: { categoria: string; nombre: string; tamano: number }) {
  const base = `/iconos-glass/${categoria}/${nombre}`
  return (
    <img
      src={`${base}@1x.png`}
      srcSet={`${base}@1x.png 1x, ${base}@2x.png 2x`}
      width={tamano}
      height={tamano}
      alt=""
      draggable={false}
      className="pointer-events-none select-none"
    />
  )
}

// «Enviar feedback» (pie de la barra lateral y riel): una ventana de acción del proyecto (ActionDialog), no una página.
// Dos pantallas en la misma ventana: el formulario y, al enviar, el agradecimiento con el resumen de lo enviado.
// - Formulario: tipo, comentario, varios pantallazos (capturar un área de la interfaz o subir imágenes, hasta 5) y las
//   opciones de envío. En vez de pedir el módulo, ya sabe en qué página estás y lo adjunta (se puede quitar).
// - Agradecimiento: ilustración, mensaje y, si dejó contactarlo, a qué correo. «Enviar otro» vuelve al
//   formulario en limpio; «Listo» cierra.
export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { pathname } = useLocation()
  const propias = usePageCrumbs()
  const pagina = (propias ?? getBreadcrumbs(pathname)).map((crumb) => crumb.label).join(' › ') || 'Inicio'

  const [tipo, setTipo] = useState<Tipo>('mejora')
  const [comentario, setComentario] = useState('')
  const [adjuntos, setAdjuntos] = useState<Adjunto[]>([])
  // Mientras se elige el área la ventana se esconde (sigue abierta para el padre) y vuelve con la captura. Guarda a qué
  // recorte reemplaza («Volver a capturar») o `null` si es uno nuevo.
  const [capturando, setCapturando] = useState<{ reemplaza: number | null } | null>(null)
  const [conPagina, setConPagina] = useState(true)
  const [contactar, setContactar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)

  const siguienteId = useRef(1)
  const relojes = useRef<number[]>([])
  useEffect(() => () => relojes.current.forEach((reloj) => window.clearTimeout(reloj)), [])

  const actual = TIPOS.find((opcion) => opcion.valor === tipo) ?? TIPOS[0]
  const subiendo = adjuntos.some((adjunto) => adjunto.subiendo)
  const caben = adjuntos.length < MAX_ADJUNTOS

  const limpiar = () => {
    setTipo('mejora')
    setComentario('')
    setAdjuntos([])
    setCapturando(null)
    setConPagina(true)
    setContactar(false)
    setEnviando(false)
    setEnviado(false)
  }

  // Cada vez que se abre, empieza en limpio. Mientras se envía no se cierra.
  const cambiarAbierto = (abrir: boolean) => {
    if (!abrir && enviando) return
    if (abrir) limpiar()
    onOpenChange(abrir)
  }

  // Subida simulada: entra en «Subiendo…» y un momento después queda lista.
  const subirImagen = () => {
    const id = siguienteId.current++
    const numero = adjuntos.filter((adjunto) => adjunto.tipo === 'imagen').length + 1
    setAdjuntos((lista) => [...lista, { id, tipo: 'imagen', nombre: `imagen-${numero}.png`, detalle: '248 KB', subiendo: true }])
    relojes.current.push(
      window.setTimeout(() => {
        setAdjuntos((lista) => lista.map((adjunto) => (adjunto.id === id ? { ...adjunto, subiendo: false } : adjunto)))
      }, 1200),
    )
  }

  const quitar = (id: number) => setAdjuntos((lista) => lista.filter((adjunto) => adjunto.id !== id))

  const enviar = () => {
    setEnviando(true)
    relojes.current.push(
      window.setTimeout(() => {
        setEnviando(false)
        setEnviado(true)
      }, ESPERA_ENVIO),
    )
  }

  const pie = enviado ? (
    <>
      <Button variant="outline" onClick={limpiar}>
        Enviar otro
      </Button>
      <Button onClick={() => onOpenChange(false)}>Listo</Button>
    </>
  ) : (
    <>
      <Button variant="outline" disabled={enviando} onClick={() => cambiarAbierto(false)}>
        Cancelar
      </Button>
      <Button disabled={!comentario.trim() || subiendo || enviando} onClick={enviar}>
        {enviando ? <Spinner /> : null}
        {enviando ? 'Enviando…' : 'Enviar feedback'}
      </Button>
    </>
  )

  return (
    <>
      {capturando ? (
        <CapturaArea
          onCapturar={(area) => {
            const detalle = `${area.ancho} × ${area.alto} px · ${pagina}`
            const reemplaza = capturando.reemplaza
            if (reemplaza !== null) {
              setAdjuntos((lista) => lista.map((adjunto) => (adjunto.id === reemplaza ? { ...adjunto, detalle } : adjunto)))
            } else {
              const numero = adjuntos.filter((adjunto) => adjunto.tipo === 'recorte').length + 1
              setAdjuntos((lista) => [
                ...lista,
                { id: siguienteId.current++, tipo: 'recorte', nombre: `Recorte de pantalla ${numero}.png`, detalle, subiendo: false },
              ])
            }
            setCapturando(null)
          }}
          onCancelar={() => setCapturando(null)}
        />
      ) : null}

      <ActionDialog
        open={open && !capturando}
        onOpenChange={cambiarAbierto}
        title={enviado ? 'Feedback enviado' : 'Enviar feedback'}
        sub={enviado ? undefined : 'Cuéntanos qué funciona bien y qué podemos mejorar.'}
        note={enviado ? undefined : 'Lo lee el equipo de producto de UBITS.'}
        footer={pie}
      >
        {/* El halo azul de la interfaz (el mismo de PageAmbience en las pantallas del Workspace) en las dos pantallas,
            formulario y agradecimiento (1 oct): detrás de toda la ventana desde arriba. La ventana es fija, así que es ella
            la que lo contiene; queda bajo el título y no se mueve al desplazar el formulario. */}
        <img
          src={ambienteAzul}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 w-full opacity-40 select-none dark:opacity-45"
        />
        {enviado ? (
          // Agradecimiento (1 oct): la ilustración de enviar y el mensaje (sin resumen de lo enviado, pedido de diseño) y,
          // si dejó contactarlo, a qué correo. Se anuncia al aparecer.
          // 32px entre la descripción y la línea del pie (1 oct).
          <div role="status" className="flex flex-col gap-5 pb-8">
            <Empty className="py-4!">
              <EmptyHeader className="gap-1.5!">
                <EmptyMedia>
                  {/* Sin confeti (1 oct, pedido de diseño): el componente Confeti sigue disponible si vuelve. */}
                  <IlustracionGlass categoria="acciones" nombre="glass-tick" tamano={72} />
                </EmptyMedia>
                <EmptyTitle>¡Gracias, Carolina!</EmptyTitle>
                <EmptyDescription>
                  Tu feedback es muy importante para nosotros.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>


            {contactar ? (
              <FieldDescription>Si necesitamos más detalles, te escribiremos a {CORREO}.</FieldDescription>
            ) : null}
          </div>
        ) : (
          // Espaciado: 24px entre bloques, comentario y pantallazos juntos a 12px, las casillas tras una línea y aire antes
          // del pie.
          <FieldGroup className="gap-6! pb-4">
            {/* Tipo como botones secundarios sencillos (1 oct): el ToggleGroup de la librería con borde, icono y nombre, del
                ancho de su texto. El elegido se marca con borde y texto azules sobre un azul muy suave, para que se note
                cuál está puesto. Siempre hay uno: no se puede desmarcar. */}
            <FieldSet>
              <FieldLegend variant="label">Tipo de feedback</FieldLegend>
              <ToggleGroup
                variant="outline"
                value={[tipo]}
                onValueChange={(valor) => valor[0] && setTipo(valor[0] as Tipo)}
                aria-label="Tipo de feedback"
                spacing={2}
              >
                {TIPOS.map((opcion) => (
                  <ToggleGroupItem
                    key={opcion.valor}
                    value={opcion.valor}
                    className="aria-pressed:border-primary! aria-pressed:bg-primary/8! aria-pressed:text-primary!"
                  >
                    <HugeiconsIcon icon={opcion.icono} size={16} aria-hidden="true" />
                    {opcion.etiqueta}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </FieldSet>

            <FieldGroup className="gap-3!">
              <Field>
                <FieldLabel htmlFor="feedback-comentario">Comentario</FieldLabel>
                {/* 100px de entrada (1 oct). */}
                <Textarea
                  id="feedback-comentario"
                  rows={4}
                  maxLength={MAXIMO}
                  value={comentario}
                  onChange={(e) => setComentario(e.target.value.slice(0, MAXIMO))}
                  placeholder={actual.ayuda}
                  aria-describedby="feedback-conteo"
                  className="min-h-25! h-25!"
                />
                <div className="flex justify-end">
                  <FieldDescription id="feedback-conteo" aria-live="polite" className="tabular-nums">
                    {comentario.length}/{MAXIMO}
                  </FieldDescription>
                </div>
              </Field>

              {/* Varios pantallazos (1 oct), hasta 5: recortes de cualquier parte de la interfaz o imágenes subidas. Sin
                  ninguno, el vacío de «subir portada» de Crear contenido; con alguno, la lista a todo el ancho y debajo las
                  dos vías para sumar otro y cuántos van. */}
              <Field>
                <FieldLabel>Pantallazos (opcional)</FieldLabel>
                {adjuntos.length === 0 ? (
                  <Empty className="w-full rounded-xl border border-solid! py-6!">
                    <EmptyHeader className="gap-1!">
                      <EmptyMedia>
                        <IlustracionGlass categoria="multimedia" nombre="glass-camera" tamano={48} />
                      </EmptyMedia>
                      <EmptyTitle>Muéstranos lo que ves</EmptyTitle>
                      <EmptyDescription>
                        Captura cualquier parte de la pantalla o sube imágenes JPG o PNG de hasta 5 MB.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent className="flex-row flex-wrap justify-center gap-2">
                      <Button variant="outline" onClick={() => setCapturando({ reemplaza: null })}>
                        <HugeiconsIcon icon={CropIcon} size={16} aria-hidden="true" />
                        Capturar un área
                      </Button>
                      <Button variant="outline" onClick={subirImagen}>
                        <HugeiconsIcon icon={Upload01Icon} size={16} aria-hidden="true" />
                        Subir imágenes
                      </Button>
                    </EmptyContent>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-2">
                    <ul aria-label="Pantallazos adjuntos" className="flex flex-col gap-2">
                      {adjuntos.map((adjunto) => (
                        <li key={adjunto.id}>
                          <Attachment state={adjunto.subiendo ? 'uploading' : 'done'} className="w-full! max-w-none!">
                            <AttachmentMedia>
                              <HugeiconsIcon icon={adjunto.tipo === 'recorte' ? CropIcon : Image01Icon} aria-hidden="true" />
                            </AttachmentMedia>
                            <AttachmentContent>
                              <AttachmentTitle>{adjunto.nombre}</AttachmentTitle>
                              <AttachmentDescription>{adjunto.subiendo ? 'Subiendo…' : adjunto.detalle}</AttachmentDescription>
                            </AttachmentContent>
                            <AttachmentActions>
                              {adjunto.tipo === 'recorte' ? (
                                <AttachmentAction
                                  aria-label={`Volver a capturar ${adjunto.nombre}`}
                                  onClick={() => setCapturando({ reemplaza: adjunto.id })}
                                >
                                  <HugeiconsIcon icon={CropIcon} aria-hidden="true" />
                                </AttachmentAction>
                              ) : null}
                              <AttachmentAction aria-label={`Quitar ${adjunto.nombre}`} onClick={() => quitar(adjunto.id)}>
                                <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                              </AttachmentAction>
                            </AttachmentActions>
                          </Attachment>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-2">
                      {caben ? (
                        <>
                          <Button variant="outline" size="sm" onClick={() => setCapturando({ reemplaza: null })}>
                            <HugeiconsIcon icon={CropIcon} size={14} aria-hidden="true" />
                            Capturar otra área
                          </Button>
                          <Button variant="outline" size="sm" onClick={subirImagen}>
                            <HugeiconsIcon icon={Upload01Icon} size={14} aria-hidden="true" />
                            Subir otra imagen
                          </Button>
                        </>
                      ) : null}
                      <FieldDescription aria-live="polite" className="ml-auto tabular-nums">
                        {caben ? `${adjuntos.length} de ${MAX_ADJUNTOS}` : `Llegaste al máximo de ${MAX_ADJUNTOS}`}
                      </FieldDescription>
                    </div>
                  </div>
                )}
              </Field>
            </FieldGroup>

            <FieldSeparator />

            <FieldSet className="gap-3!">
              <FieldLegend className="sr-only">Opciones de envío</FieldLegend>
              <Field orientation="horizontal">
                <Checkbox id="feedback-pagina" checked={conPagina} onCheckedChange={(valor) => setConPagina(Boolean(valor))} />
                <FieldLabel htmlFor="feedback-pagina">Incluir la página donde estás: {pagina}</FieldLabel>
              </Field>
              <Field orientation="horizontal">
                <Checkbox id="feedback-contactar" checked={contactar} onCheckedChange={(valor) => setContactar(Boolean(valor))} />
                <FieldLabel htmlFor="feedback-contactar">Pueden contactarme sobre este feedback</FieldLabel>
              </Field>
            </FieldSet>
          </FieldGroup>
        )}
      </ActionDialog>
    </>
  )
}
