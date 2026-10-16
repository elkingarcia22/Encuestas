import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Coins01Icon, Upload01Icon } from '@hugeicons/core-free-icons'
import {
  Attachment,
  Badge,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
  Button,
  Card,
  Field,
  FieldLabel,
  Heading,
  Input,
  CardContent,
  Spinner,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { EditorTexto } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/editor-texto'
import { FileUpload, type ArchivoCargado } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/file-upload'
import { BotonIa } from '@/shared/components/BotonIa'
import { BarraEditor } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/barras'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { notify } from '@/shared/components/notify'
import { TokenBadge, TokenCost } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/tokens'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { ChipGuardado, useGuardadoSimulado, type EstadoGuardado } from '@/shared/components/ChipGuardado'
import { EdicionEnLinea } from '@/shared/components/EdicionEnLinea'
import { ConNota } from './demos'

// Piezas que nacieron con el flujo de Crear contenido (LMS Creator) y que la librería todavía no trae.

// ── Editor de texto enriquecido ──

export function TextoLibreria() {
  return (
    <ConNota nota="Textarea: solo texto plano, sin negrita, listas ni enlaces.">
      <Textarea className="w-72" rows={4} placeholder="Añade una descripción para el contenido aquí" aria-label="Descripción (librería)" />
    </ConNota>
  )
}

export function TextoUbits() {
  const [html, setHtml] = useState('<p>Aprende a gestionar <strong>conflictos</strong> de forma efectiva.</p>')
  return (
    <ConNota nota="La barra es Toggle y el botón de icono; el área copia el borde y el foco del Textarea.">
      <div className="w-80">
        <EditorTexto id="ajustes-rte" valor={html} onCambio={setHtml} placeholder="Escribe el contenido de la página…" alto={96} />
      </div>
    </ConNota>
  )
}

// ── Cargador de archivos ──

export function CargaLibreria() {
  return (
    <ConNota nota="Attachment en reposo: sirve para un adjunto, sin soltar archivos ni validar formato o peso.">
      <div className="w-72">
        <Attachment state="idle">
          <AttachmentMedia>
            <HugeiconsIcon icon={Upload01Icon} aria-hidden="true" />
          </AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Subir PDF</AttachmentTitle>
            <AttachmentDescription>PDF · Hasta 250 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentTrigger aria-label="Elegir archivo" />
        </Attachment>
      </div>
    </ConNota>
  )
}

export function CargaUbits() {
  const [archivo, setArchivo] = useState<ArchivoCargado | null>(null)
  return (
    <ConNota nota="El AdjuntoCsv del equipo a todo el ancho, con la lógica del hook useFileUpload: arrastrar, soltar, validar y la barra de subida.">
      <div className="w-80">
        <FileUpload titulo="Subir PDF" acepta="application/pdf,.pdf" maximoMb={250} formatos="PDF · Hasta 250 MB" conProgreso compacta archivo={archivo} onArchivo={setArchivo} />
      </div>
    </ConNota>
  )
}

// ── Marco de flujo a pantalla completa ──

export function MarcoLibreria() {
  return (
    <ConNota nota="Dentro del workspace: barra lateral y header comunes alrededor.">
      <Card size="sm" className="w-72">
        <CardContent>
          <Text size="sm" className="text-muted-foreground">
            Una pantalla normal vive en PageShell, entre la barra lateral y el header.
          </Text>
        </CardContent>
      </Card>
    </ConNota>
  )
}

// El panel de generación vive dentro de Crear contenido: se enseña abriendo el flujo.
export function AbrirCrearContenido() {
  const navigate = useNavigate()
  return (
    <ConNota nota="Aparece abajo a la izquierda de Crear contenido mientras la IA genera un recurso.">
      <Button variant="outline" onClick={() => navigate('/admin/aprendizaje/lms-creator/crear-contenido#portada')}>
        Abrir Crear contenido
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
      </Button>
    </ConNota>
  )
}

// Las piezas reales del marco: la salida única junto al título (BotonSalirCreacion) y la barra de los pasos
// (BarraEditor) con el ChipGuardado a la izquierda y sin «Cancelar» (regla de creación, 6-oct).
export function MarcoUbits() {
  const navigate = useNavigate()
  return (
    <ConNota nota="Tapa el workspace con su cabecera (título, guardado y una sola salida) y su barra de pasos; solo el centro hace scroll.">
      <div className="flex w-full max-w-md flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <Text as="p" weight="semibold" className="min-w-0 truncate">
            Nuevo contenido
          </Text>
          <BotonSalirCreacion onClick={() => notify('Salir de la creación')} />
        </div>
        <BarraEditor
          inicio={<ChipGuardado estado="guardado" />}
          mensaje={null}
          onAtras={() => notify('Paso anterior')}
          principal={{ texto: 'Siguiente', flecha: true, onClick: () => notify('Paso siguiente') }}
        />
        <Button variant="outline" className="self-center" onClick={() => navigate('/admin/aprendizaje/lms-creator/crear-contenido#portada')}>
          Abrir Crear contenido
          <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
        </Button>
      </div>
    </ConNota>
  )
}

// ── Indicador de guardado ──

export function GuardadoLibreria() {
  return (
    <ConNota nota="Spinner: solo la ruedita. Sin texto y sin decir si ya guardó.">
      <Spinner className="size-4" />
    </ConNota>
  )
}

const ESTADOS_GUARDADO: EstadoGuardado[] = ['guardado', 'editando', 'guardando']

export function GuardadoUbits() {
  const [estado, guardar] = useGuardadoSimulado()
  return (
    <ConNota nota="Pastilla junto al título: dice en qué va el guardado automático, sin botón que pulsar.">
      <div className="flex flex-col items-center gap-4">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {ESTADOS_GUARDADO.map((e) => (
            <ChipGuardado key={e} estado={e} />
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={guardar}>
            Simular guardado
          </Button>
          <ChipGuardado estado={estado} />
        </div>
      </div>
    </ConNota>
  )
}


// ── Tokens de IA ──

export function TokensLibreria() {
  return (
    <ConNota nota="Badge con la moneda: el saldo cambia de golpe y el costo del botón va escrito como texto.">
      <div className="flex flex-col items-start gap-3">
        <Badge variant="focus-outline" className="gap-1 tabular-nums">
          <HugeiconsIcon icon={Coins01Icon} size={12} aria-hidden="true" />
          500
        </Badge>
        <Button size="sm">Generar portada · 50 tokens</Button>
      </div>
    </ConNota>
  )
}

export function TokensUbits() {
  const [tokens, setTokens] = useState(500)
  return (
    <ConNota nota="Al gastar, la insignia se aplasta y rebota, la moneda gira, el número baja contando y sube un «−50» en rojo.">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-3">
          <TokenBadge tokens={tokens} />
          <Button variant="outline" size="sm" onClick={() => setTokens((t) => (t >= 50 ? t - 50 : 500))}>
            Gastar 50
          </Button>
        </div>
        <BotonIa size="sm">
          Generar portada
          <TokenCost cost={50} />
        </BotonIa>
        <BotonIaSecundario size="sm">
          Generar evaluación
          <TokenCost cost={50} />
        </BotonIaSecundario>
      </div>
    </ConNota>
  )
}

// ── Edición en línea ──

export function EdicionLibreria() {
  return (
    <ConNota nota="Input suelto: para cambiar un dato hay que dejar el campo siempre a la vista, o llevarse a la persona a un formulario.">
      <div className="w-72">
        <Field>
          <FieldLabel htmlFor="ajustes-edicion-libreria">Título del contenido</FieldLabel>
          <Input id="ajustes-edicion-libreria" defaultValue="Inducción para nuevos líderes" />
        </Field>
      </div>
    </ConNota>
  )
}

export function EdicionUbits() {
  const [titulo, setTitulo] = useState('Inducción para nuevos líderes')
  const [descripcion, setDescripcion] = useState('Tres sesiones en vivo y un taller final para líderes que acaban de asumir equipo.')
  return (
    <ConNota nota="Sin borde ni fondo: hereda la tipografía de donde vive y solo se marca al pasar por encima. En una línea abraza el texto hasta su ancho máximo y, fuera del foco, lo que no cabe se corta con «…».">
      <div className="flex w-72 flex-col gap-3">
        <Heading as="h3" level={4}>
          <EdicionEnLinea valor={titulo} onCambiar={setTitulo} etiqueta="Título del contenido" marcador="Sin título" />
        </Heading>
        <Text size="sm" variant="muted">
          <EdicionEnLinea valor={descripcion} onCambiar={setDescripcion} etiqueta="Descripción" marcador="Sin descripción" multilinea />
        </Text>
      </div>
    </ConNota>
  )
}
