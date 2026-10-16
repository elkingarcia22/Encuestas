import { useEffect, useRef, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle02Icon,
  Alert02Icon, Cancel01Icon, File01Icon, InformationCircleIcon, PencilEdit02Icon, PlayIcon, StopIcon } from '@hugeicons/core-free-icons'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertAction,
  AlertDescription,
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentMedia,
  AttachmentTitle,
  Badge,
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
  IconTile,
  Input,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  Progress,
  SelectValue,
  Separator,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { CloseButton } from '@/shared/components/CloseButton'
import { Composer } from '@/modules/admin/suite-ai/shared/composer'
import { DEMO_VIDEO } from '../demo'
import { confirmarRecurso, gastarTokens, getBorrador, iniciarTrabajo } from '../borrador'
import { FileUpload, type ArchivoCargado } from '../file-upload'
import {
  CATEGORIAS_AVATAR,
  COSTO_VIDEO,
  PAISES_VOZ,
  VOCES,
  VOZ_POR_DEFECTO,
  GUION_DEMO,
  GUION_MAXIMO,
  GUION_MINIMO,
  TEMA_MAXIMO,
  TEMA_MINIMO,
  TIEMPO,
  avataresDe,
  fotoAvatar,
  numero,
  tituloVoz,
  vozPorId,
} from './datos'
import { PestanaVideo, aviso, conCosto, useMuestra } from './piezas'
import { BanderaRedonda, OpcionVoz } from './selectores'

// Tab «Video Avatar IA» del modal «Agregar video»: el presentador, el guion (generado con IA o escrito a mano) y el
// logo opcional, con la vista previa del avatar a la derecha. «Generar video» cierra el modal: la página nace con el
// cargador y a los 15 s recibe el video (HU-LMS-001, recurso Video).

type ModoGuion = 'ia' | 'manual'

/** El estado del tab vive en el modal para que su pie («Generar video») pueda validarlo. */
export function usePanelAvatar() {
  const [categoria, setCategoria] = useState('staff')
  const [avatarId, setAvatarId] = useState(avataresDe('staff')[0].id)
  const [voz, setVoz] = useState(VOZ_POR_DEFECTO)
  const [modo, setModo] = useState<ModoGuion>('ia')
  const [tema, setTema] = useState('')
  const [adjuntos, setAdjuntos] = useState<string[]>([])
  const [errorTema, setErrorTema] = useState(false)
  const [generando, setGenerando] = useState(false)
  const [guionIA, setGuionIA] = useState<string | null>(null)
  const [guionManual, setGuionManual] = useState('')
  const [errorGuion, setErrorGuion] = useState<string | null>(null)
  const [logo, setLogo] = useState<ArchivoCargado | null>(null)
  const [aviso2m, setAviso2m] = useState(true)
  const refTema = useRef<HTMLTextAreaElement>(null)
  const refGuion = useRef<HTMLTextAreaElement>(null)

  const reiniciar = () => {
    setCategoria('staff')
    setAvatarId(avataresDe('staff')[0].id)
    setVoz(VOZ_POR_DEFECTO)
    setModo('ia')
    setTema('')
    setAdjuntos([])
    setErrorTema(false)
    setGenerando(false)
    setGuionIA(null)
    setGuionManual('')
    setErrorGuion(null)
    setLogo(null)
    setAviso2m(true)
  }

  const irA = (nodo: HTMLTextAreaElement | null) => {
    nodo?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    nodo?.focus()
  }

  /** Valida y genera. Devuelve el id de la página que nació, o null si algo falta. */
  const generar = (): string | null => {
    const guion = modo === 'ia' ? guionIA : guionManual
    if (modo === 'ia' && guionIA == null) {
      aviso('warning', 'Genera el guion con IA o cambia a «Escribir manualmente».')
      setErrorTema(true)
      irA(refTema.current)
      return null
    }
    const texto = (guion ?? '').trim()
    if (!texto || texto.length < GUION_MINIMO) {
      setErrorGuion(texto ? 'Escribe al menos 500 caracteres' : 'Campo requerido')
      irA(refGuion.current)
      return null
    }
    if (!gastarTokens(COSTO_VIDEO.avatarVideo)) {
      aviso('warning', `No tienes suficientes tokens (${COSTO_VIDEO.avatarVideo} requeridos).`)
      return null
    }
    const id = confirmarRecurso({ tipo: 'video', generando: true, generadoConIA: true, origenVideo: 'avatar' })
    iniciarTrabajo(id, 'video', TIEMPO.avatarVideo, { generando: false, src: DEMO_VIDEO })
    return id
  }

  return {
    categoria,
    setCategoria,
    avatarId,
    setAvatarId,
    voz,
    setVoz,
    modo,
    setModo,
    tema,
    setTema,
    adjuntos,
    setAdjuntos,
    errorTema,
    setErrorTema,
    generando,
    setGenerando,
    guionIA,
    setGuionIA,
    guionManual,
    setGuionManual,
    errorGuion,
    setErrorGuion,
    logo,
    setLogo,
    aviso2m,
    setAviso2m,
    refTema,
    refGuion,
    reiniciar,
    generar,
  }
}

export type EstadoAvatar = ReturnType<typeof usePanelAvatar>

function ContadorGuion({ texto, error }: { texto: string; error: string | null }) {
  return (
    <div className="flex items-center justify-between gap-2">
      {error ? <FieldError>{error}</FieldError> : <FieldDescription>Máximo {numero(GUION_MAXIMO)} caracteres</FieldDescription>}
      <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
        {numero(texto.length)}/{numero(GUION_MAXIMO)}
      </Text>
    </div>
  )
}

// La voz en el desplegable (OpcionVoz) vive en `selectores.tsx`: la comparte con la voz del roleplay.

// ── Video Avatar IA ──────────────────────────────────────────────────────────────────────────────────────────────
//
// La pestaña son cuatro cosas: el presentador, su voz, lo que dice y el logo. Las secciones viven aparte de cómo se
// reparten, porque el reparto está a prueba: en una sola columna el formulario medía 754 px —casi toda la pantalla,
// con scroll, cuando las otras tres pestañas miden entre 336 y 469— y eso es lo que se está resolviendo. Cambiar de
// reparto no debe significar tener una copia de los campos por cada uno (lab del 2-oct).

/** Cómo se reparten las cuatro secciones dentro del modal. */
export type DisposicionAvatar = 'una-columna' | 'dos-columnas' | 'acordeon'

function useSeccionesAvatar(estado: EstadoAvatar, { etiquetas = true }: { etiquetas?: boolean } = {}) {
  const s = estado
  const muestra = useMuestra()
  const adjuntar = useRef<HTMLInputElement>(null)
  const tiempos = useRef<number[]>([])
  useEffect(() => () => tiempos.current.forEach((t) => window.clearTimeout(t)), [])

  const lista = avataresDe(s.categoria)
  const voz = vozPorId(s.voz)
  const sonando = Boolean(voz.muestra) && muestra.sonando === voz.muestra
  const puedeGenerarGuion = s.tema.trim().length >= TEMA_MINIMO && !s.generando && getBorrador().tokens >= COSTO_VIDEO.guion

  const generarGuion = () => {
    if (!gastarTokens(COSTO_VIDEO.guion)) {
      aviso('warning', `No tienes suficientes tokens (${COSTO_VIDEO.guion} requeridos).`)
      return
    }
    s.setGenerando(true)
    tiempos.current.push(
      window.setTimeout(() => {
        s.setGenerando(false)
        s.setGuionIA(GUION_DEMO)
        s.setTema('')
        s.setAdjuntos([])
        s.setErrorTema(false)
        s.setErrorGuion(null)
      }, TIEMPO.guion),
    )
  }


  return {
    aviso: (
      <>
      {s.aviso2m ? (
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>Los videos generados tienen máximo 2 minutos de duración.</p>
          </AlertDescription>
          <AlertAction>
            <CloseButton label="Cerrar aviso" onClick={() => s.setAviso2m(false)} />
          </AlertAction>
        </Alert>
      ) : null}
      </>
    ),
    avatar: (
      <>
      {/* `@container`: la rejilla de abajo mide el ancho de esta sección, no el de la ventana. */}
      <section className="@container flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          {/* Al tamaño de un label de formulario (14px), no 16px en semibold: son los campos de un formulario corto,
              no las secciones de una página, y al lado de «Voz del video» o «Nombre» se veían desproporcionadas
              (Dave, 2-oct). */}
          {etiquetas ? <FieldLabel>Avatar</FieldLabel> : <span />}
          <Select value={s.categoria} onValueChange={(v) => s.setCategoria(String(v))}>
            <SelectTrigger size="sm" className="w-52" aria-label="Categoría de avatares">
              <SelectValue>
                {(v) => {
                  const c = CATEGORIAS_AVATAR.find((x) => x.id === v)
                  return c ? `${c.label} (${c.cantidad})` : ''
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {CATEGORIAS_AVATAR.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label} ({c.cantidad})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Un número de columnas por ancho, no miniaturas de medida fija. Las fijas dejaban un hueco a la derecha: la
            fila terminaba antes del borde y la última cara no quedaba alineada con el selector de categoría de arriba;
            con `1fr` cada fila llena el ancho exacto. Los cortes son divisores de 10, que es lo que trae una categoría,
            para que las filas queden completas: 5 por debajo de 576 px de sección —la columna del acordeón, la de dos
            columnas y el formulario de 530— y 10 de ahí en adelante. A 530 los diez en un renglón dejaban las caras en
            36 px, que ya no se distinguen. Lo que no vuelve es la rejilla de cinco columnas estiradas, que a 768 px hacía las fotos de
            125 px y la sección de 319 px (Dave, 2-oct). */}
        <RadioGroup
          value={String(s.avatarId)}
          onValueChange={(v) => s.setAvatarId(Number(v))}
          aria-label="Avatar"
          className="grid grid-cols-5 gap-1.5 @xl:grid-cols-10"
        >
          {lista.map((a) => (
            <FieldLabel key={a.id} htmlFor={`cc-vm-avatar-${a.id}`} className="relative" aria-label={a.nombre}>
              <Field className="p-0.5!">
                <img src={fotoAvatar(a)} alt={a.nombre} className="aspect-square w-full rounded-md object-cover" />
                <RadioGroupItem value={String(a.id)} id={`cc-vm-avatar-${a.id}`} className="absolute top-1.5 right-1.5" />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </section>
      </>
    ),
    voz: (
      <>
      {/* Mismo selector que la «Voz de Serena» de Selección (Crear vacante › Entrevista con Serena AI): desplegable en
          una fila con el botón de escuchar al lado. Se replica la forma, no se importa su pieza, porque la de allá
          tiene el aviso de «todavía no suenan» escrito por dentro y aquí las muestras sí existen. Un desplegable es un
          globo flotante, no una ventana: por eso cabe dentro de este modal sin abrir un modal encima de otro. */}
      {/* Sin cabecera «Voz» encima: el campo ya se llama «Voz del video» y eran dos veces la misma palabra, una de
          ellas más grande que la otra (Dave, 2-oct). */}
      <section className="flex flex-col gap-2">
        <Field>
          {etiquetas ? <FieldLabel htmlFor="cc-vm-voz">Voz del video</FieldLabel> : null}
          <div className="flex items-center gap-2">
            <Select value={s.voz} onValueChange={(v) => v && s.setVoz(String(v))}>
              <SelectTrigger id="cc-vm-voz" className="min-w-0 flex-1">
                <SelectValue>{(elegido: string) => <OpcionVoz voz={vozPorId(elegido)} />}</SelectValue>
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {PAISES_VOZ.map((pais) => {
                  const voces = VOCES.filter((v) => v.pais === pais)
                  return (
                    <SelectGroup key={pais}>
                      <SelectLabel>
                        <span className="flex items-center gap-1.5">
                          <BanderaRedonda codigo={voces[0]?.codigo ?? ''} /> {pais}
                        </span>
                      </SelectLabel>
                      {voces.map((v) => (
                        <SelectItem key={v.id} value={v.id} disabled={!v.disponible}>
                          <OpcionVoz voz={v} conPais={false} />
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )
                })}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="lg"
              className="shrink-0"
              disabled={!voz.muestra}
              aria-label={sonando ? 'Detener la muestra' : `Escuchar la ${tituloVoz(voz).toLowerCase()} de ${voz.pais}`}
              onClick={() => muestra.alternar(voz.muestra)}
            >
              <HugeiconsIcon icon={sonando ? StopIcon : PlayIcon} aria-hidden="true" />
              {sonando ? 'Detener' : 'Escuchar'}
            </Button>
          </div>
          <FieldDescription>El acento con el que el avatar narra el video.</FieldDescription>
        </Field>
      </section>
      </>
    ),
    guion: (
      <>
      <section className="flex flex-col gap-2">
        {etiquetas ? <FieldLabel>Guion</FieldLabel> : null}
        <RadioGroup
          value={s.modo}
          onValueChange={(v) => {
            s.setModo(v as ModoGuion)
            s.setErrorGuion(null)
            s.setErrorTema(false)
          }}
          aria-label="Cómo quieres definir el guion"
          className="grid gap-2 min-[601px]:grid-cols-2"
        >
          {(
            [
              { id: 'ia', label: 'Generar con IA', icono: null },
              { id: 'manual', label: 'Escribir manualmente', icono: PencilEdit02Icon },
            ] as const
          ).map((o) => (
            <FieldLabel key={o.id} htmlFor={`cc-vm-guion-${o.id}`}>
              <Field orientation="horizontal" className="items-center">
                {o.icono ? (
                  <IconTile variant="soft" size="sm">
                    <HugeiconsIcon icon={o.icono} />
                  </IconTile>
                ) : (
                  <IconoIA className="size-8" />
                )}
                <FieldContent>
                  <FieldTitle>{o.label}</FieldTitle>
                </FieldContent>
                <RadioGroupItem value={o.id} id={`cc-vm-guion-${o.id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
        {s.modo === 'ia' ? (
          <>
            <Field data-invalid={s.errorTema ? 'true' : undefined}>
              <Input
                ref={adjuntar}
                type="file"
                multiple
                accept=".txt,.pdf,.doc,.docx,text/plain,application/pdf"
                className="hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={(e) => {
                  const nombres = Array.from(e.target.files ?? []).map((f) => f.name)
                  s.setAdjuntos((previos) => [...previos, ...nombres])
                  e.target.value = ''
                }}
              />
              {/* La caja para escribirle a la IA es la del chat de Suite AI (Design system › Suite AI chat). */}
              <Composer
                inputRef={s.refTema}
                value={s.tema}
                onChange={(valor) => {
                  s.setTema(valor)
                  s.setErrorTema(false)
                }}
                onSend={() => puedeGenerarGuion && generarGuion()}
                onVoice={() => undefined}
                ariaLabel="Tema del guion"
                placeholder="Adjunta un archivo o describe el tema del guion"
                rows={4}
                maxLength={TEMA_MAXIMO}
                disabled={s.generando}
                invalid={s.errorTema}
                onAttach={() => adjuntar.current?.click()}
                attachLabel="Adjuntar"
                voice={false}
                action={
                  // La segunda acción de IA de la ventana: el primario de IA es «Generar video», en el pie (decisión 10
                  // de la auditoría, 5-oct: uno solo por vista).
                  <BotonIaSecundario disabled={!puedeGenerarGuion} onClick={generarGuion}>
                    {s.generando ? 'Generando' : conCosto('Generar guion', COSTO_VIDEO.guion)}
                  </BotonIaSecundario>
                }
              />
              {s.adjuntos.length ? (
                <div className="flex flex-wrap items-center gap-2">
                  {s.adjuntos.map((nombre, i) => (
                    <Attachment key={`${nombre}-${i}`} size="xs">
                      <AttachmentMedia>
                        <HugeiconsIcon icon={File01Icon} aria-hidden="true" />
                      </AttachmentMedia>
                      <AttachmentContent className="max-w-40">
                        <AttachmentTitle>{nombre}</AttachmentTitle>
                      </AttachmentContent>
                      <AttachmentActions>
                        <AttachmentAction aria-label={`Quitar ${nombre}`} onClick={() => s.setAdjuntos((p) => p.filter((_, j) => j !== i))}>
                          <HugeiconsIcon icon={Cancel01Icon} size={12} />
                        </AttachmentAction>
                      </AttachmentActions>
                    </Attachment>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-2">
                {s.errorTema ? (
                  <FieldError>Campo requerido</FieldError>
                ) : (
                  <FieldDescription>
                    Mínimo {numero(TEMA_MINIMO)} · Máximo {numero(TEMA_MAXIMO)} caracteres
                  </FieldDescription>
                )}
                <Text as="span" size="xs" variant="muted" className="shrink-0 tabular-nums">
                  {numero(s.tema.length)}/{numero(TEMA_MAXIMO)}
                </Text>
              </div>
            </Field>
            {s.guionIA != null ? (
              <Field data-invalid={s.errorGuion ? 'true' : undefined}>
                <FieldLabel htmlFor="cc-vm-guion-ia">Guion generado</FieldLabel>
                <Textarea
                  ref={s.refGuion}
                  id="cc-vm-guion-ia"
                  placeholder="Revisa y edita el guion antes de generar el video"
                  maxLength={GUION_MAXIMO}
                  value={s.guionIA}
                  aria-invalid={s.errorGuion ? true : undefined}
                  className="field-sizing-content max-h-125 min-h-40"
                  onChange={(e) => {
                    s.setGuionIA(e.target.value)
                    s.setErrorGuion(null)
                  }}
                />
                <ContadorGuion texto={s.guionIA} error={s.errorGuion} />
              </Field>
            ) : null}
          </>
        ) : (
          <Field data-invalid={s.errorGuion ? 'true' : undefined}>
            <Textarea
              ref={s.refGuion}
              aria-label="Guion del video"
              placeholder="Escribe el guion completo del video"
              rows={5}
              maxLength={GUION_MAXIMO}
              value={s.guionManual}
              aria-invalid={s.errorGuion ? true : undefined}
              onChange={(e) => {
                s.setGuionManual(e.target.value)
                s.setErrorGuion(null)
              }}
            />
            <ContadorGuion texto={s.guionManual} error={s.errorGuion} />
          </Field>
        )}
      </section>
      </>
    ),
    logo: (
      <>
      <section className="flex flex-col gap-2">
        {etiquetas ? (
          <FieldLabel>
            Logo de la empresa
            <Badge variant="secondary" size="xs">
              Opcional
            </Badge>
          </FieldLabel>
        ) : null}
        <FileUpload acepta="image/png,.png" maximoMb={2} formatos="PNG · hasta 2 MB" titulo="Logo de la empresa" exito={false} archivo={s.logo} onArchivo={s.setLogo} compacta />
      </section>
      </>
    ),
  }
}

const INSTRUCCION = { antes: 'Elige un ', clave: 'presentador', despues: ' y escribe lo que va a decir' } as const

/**
 * Lo que se lleva elegido, al lado del formulario. Nació para el reparto en acordeón, donde las secciones cerradas no
 * se ven y uno pierde el hilo de a quién eligió. Enseña la cara, no solo su nombre: es lo único que de verdad se está
 * decidiendo ahí.
 */
function ResumenAvatar({ estado }: { estado: EstadoAvatar }) {
  const s = estado
  const elegido = avataresDe(s.categoria).find((a) => a.id === s.avatarId) ?? avataresDe('all').find((a) => a.id === s.avatarId)
  const voz = vozPorId(s.voz)
  const guion = (s.modo === 'ia' ? (s.guionIA ?? '') : s.guionManual).trim()
  const filas = [
    { termino: 'Voz', valor: `${tituloVoz(voz)} · ${voz.pais}` },
    { termino: 'Guion', valor: guion ? `${numero(guion.length)} caracteres` : 'Sin escribir' },
    { termino: 'Logo', valor: s.logo ? s.logo.nombre : 'Sin logo' },
  ]
  // Lo mismo que exige el botón «Generar video», dicho antes de pulsarlo: el presentador y la voz vienen puestos de
  // fábrica, así que lo único que puede faltar es el guion. Es el bloque «Faltan N datos» de los asistentes.
  const falta: string[] = []
  if (s.modo === 'ia' && s.guionIA == null) falta.push('Generar el guion con IA')
  else if (!guion) falta.push('Escribir el guion')
  else if (guion.length < GUION_MINIMO) falta.push(`El guion necesita ${numero(GUION_MINIMO)} caracteres como mínimo`)
  const total = 3
  const listos = total - falta.length
  return (
    <Frame>
      <FrameHeader>
        <FrameTitle>Vista previa</FrameTitle>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {elegido ? <img src={fotoAvatar(elegido)} alt="" className="size-12 shrink-0 rounded-md object-cover" /> : null}
          <div className="flex min-w-0 flex-col">
            <Text as="span" size="sm" weight="semibold" className="truncate">
              {elegido?.nombre ?? 'Sin presentador'}
            </Text>
            <Text as="span" size="xs" variant="muted" className="truncate">
              Presentador
            </Text>
          </div>
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          {filas.map((f) => (
            <div key={f.termino} className="flex items-baseline justify-between gap-3">
              <Text as="span" size="sm" variant="muted" className="shrink-0">
                {f.termino}
              </Text>
              <Text as="span" size="sm" className="min-w-0 truncate text-right">
                {f.valor}
              </Text>
            </div>
          ))}
        </div>

        <Separator />

        {/* Qué falta para poder generar, igual que en Crear contenido y Crear assessment: con el acordeón cerrado es
            la única forma de saber que todavía no se puede (Dave, 2-oct). */}
        {falta.length ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <HugeiconsIcon icon={Alert02Icon} size={16} className="shrink-0 text-warning" aria-hidden="true" />
                <Text as="span" size="sm" weight="medium">
                  {falta.length === 1 ? 'Falta un dato' : `Faltan ${falta.length} datos`}
                </Text>
              </div>
              <Text as="span" variant="muted" size="xs" className="shrink-0 tabular-nums">
                {listos} de {total}
              </Text>
            </div>
            <Progress value={(listos / total) * 100} aria-label={`${listos} de ${total} datos obligatorios`} />
            <Text as="ul" variant="muted" size="sm" className="ml-6 list-disc">
              {falta.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </Text>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="shrink-0 text-success" aria-hidden="true" />
            <Text as="span" size="sm">
              Todo lo obligatorio está listo.
            </Text>
          </div>
        )}

        {/* El tope de duración vive aquí y no en un aviso encima del formulario: es un dato del video que se va a
            generar, igual que la voz o el guion, y arriba se comía 54 px en todos los repartos (Dave, 2-oct). */}
        <Separator />
        <div className="flex items-start gap-2">
          <HugeiconsIcon icon={InformationCircleIcon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <Text as="p" size="xs" variant="muted">
            Los videos generados tienen máximo 2 minutos de duración.
          </Text>
        </div>
      </FramePanel>
    </Frame>
  )
}

export function PanelAvatar({ estado, disposicion = 'una-columna' }: { estado: EstadoAvatar; disposicion?: DisposicionAvatar }) {
  // En el acordeón el título que abre cada sección ya hace de etiqueta: pintar las dos decía «Guion» encima de
  // «Guion» y «Logo de la empresa» encima de «Logo de la empresa» (2-oct).
  const sec = useSeccionesAvatar(estado, { etiquetas: disposicion !== 'acordeon' })

  if (disposicion === 'dos-columnas') {
    return (
      <PestanaVideo {...INSTRUCCION}>
        {sec.aviso}
        {/* `@container`: la rejilla mide el ancho del modal, no el de la ventana. */}
        <div className="@container">
          <div className="grid gap-6 @xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] [&>*]:min-w-0">
            <div className="flex flex-col gap-4">
              {sec.avatar}
              {sec.voz}
              {sec.logo}
            </div>
            <div className="flex flex-col gap-4">{sec.guion}</div>
          </div>
        </div>
      </PestanaVideo>
    )
  }

  if (disposicion === 'acordeon') {
    return (
      <PestanaVideo {...INSTRUCCION}>
        {/* Sin el aviso de los 2 minutos arriba: aquí vive dentro de la vista previa, con el resto de los datos del
            video que se va a generar. */}
        {/* El acordeón esconde lo que no está abierto, así que al lado va el resumen de lo que se lleva elegido: sin
            él hay que ir abriendo y cerrando para acordarse de qué presentador se eligió (Dave, 2-oct). Es la misma
            «Vista previa» de los asistentes de Crear contenido y Crear assessment. */}
        <div className="@container">
          {/* 300px, y solo aquí. La «Vista previa» del proyecto mide 20rem (320px) en Crear contenido, Crear
              assessment, Crear vacante, Crear plan y Encuestas, pero todas esas viven en una página de 1.140: ahí la
              columna se lleva el 28 % del ancho y aquí, dentro de un modal de 768, se llevaba el 42 %. Se baja a 300
              para que no se coma la pantalla; la medida general no cambia (Dave, 2-oct). */}
          <div className="grid gap-4 @xl:grid-cols-[minmax(0,1fr)_minmax(0,300px)] @xl:items-start [&>*]:min-w-0">
            {/* El guion abierto y de primero: es lo único sin lo que no hay video —presentador, voz y logo tienen
                valor por defecto— y antes quedaba tercero, debajo de dos cosas que ya estaban resueltas (Dave, 5-oct). */}
            <Accordion defaultValue={['guion']} className="w-full">
              {[
                {
                  id: 'guion',
                  titulo: (
                    <span className="flex items-center gap-2">
                      Guion
                      <Badge variant="warning-light" size="xs">
                        Obligatorio
                      </Badge>
                    </span>
                  ),
                  nodo: sec.guion,
                },
                { id: 'avatar', titulo: 'Presentador', nodo: sec.avatar },
                { id: 'voz', titulo: 'Voz del video', nodo: sec.voz },
                {
                  id: 'logo',
                  // Insignia, nunca «(opcional)» entre paréntesis: es la regla de nuestros formularios.
                  titulo: (
                    <span className="flex items-center gap-2">
                      Logo de la empresa
                      <Badge variant="secondary" size="xs">
                        Opcional
                      </Badge>
                    </span>
                  ),
                  nodo: sec.logo,
                },
              ].map((x) => (
                <AccordionItem key={x.id} value={x.id}>
                  <AccordionTrigger>{x.titulo}</AccordionTrigger>
                  <AccordionContent className="flex flex-col gap-4">{x.nodo}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
            <ResumenAvatar estado={estado} />
          </div>
        </div>
      </PestanaVideo>
    )
  }

  return (
    // Sin líneas entre campos: con las cabeceras al tamaño de un label esto es un formulario corriente, y un
    // formulario no se parte en secciones. Cada separador traía además su propio espacio arriba y abajo.
    <PestanaVideo {...INSTRUCCION}>
      {/* 530 px de tope y centrado, la misma medida del campo de «Enlace de video» y de la zona de «Subir video»: así
          las cuatro pestañas tienen el contenido del mismo ancho y no una estirada a los 720 del modal. El aviso de
          los 2 minutos va dentro: es parte de lo que se está llenando, y suelto a todo lo ancho marcaba un borde que
          el formulario de abajo no tenía (Dave, 2-oct). */}
      <div className="mx-auto flex w-full max-w-[530px] flex-col gap-4">
        {sec.aviso}
        {sec.avatar}
        {sec.voz}
        {sec.guion}
        {sec.logo}
      </div>
    </PestanaVideo>
  )
}
