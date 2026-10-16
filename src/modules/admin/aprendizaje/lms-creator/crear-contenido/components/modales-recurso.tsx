import { useEffect, useState } from 'react'
import { Button, Field, FieldDescription, FieldError, Textarea } from '@ubits/flux-ui'
import { textoPlano, type Recurso } from './borrador'
import { DEMO_PDF, DEMO_SCORM } from './demo'
import { EditorTexto } from './editor-texto'
import { InstruccionGrande } from './marco-inmersivo'
import { FileUpload, type ArchivoCargado } from './file-upload'
import { ActionDialog } from '@/shared/components/ActionDialog'

// Añadir un recurso no necesita la pantalla completa: subir un PDF o pegar un enlace es un campo, y en un panel gigante
// casi blanco ese campo queda perdido en la mitad. Cada alta usa el tamaño de lo que pide, en la única ventana del
// sistema (ActionDialog, decisión 4 de la auditoría, 5-oct):
//   «default» (620px) — un campo o una zona para soltar el archivo: PDF, embebido y SCORM.
//   «wide» (736px) — el editor de texto, que sí necesita ancho para escribir cómodo.
// La instrucción grande del cuerpo (InstruccionGrande) se queda a propósito: es la excepción documentada de los modales
// de alta de recurso.
// Todos los modales de alta de recurso miden lo mismo que «Agregar video», que es el de la familia con más dentro:
// con dos medidas distintas, elegir PDF después de haber mirado video se sentía como si la ventana se encogiera
// (Dave, 14-oct).
const ALTA_RECURSO = 'wide' as const
const ALTA_TEXTO = 'wide' as const

// Los modales de recurso a pantalla completa: PDF, Embebido, Texto y SCORM (HU-LMS-001, RN-03d–g). «Volver» regresa a
// «Añadir página» sin crear nada; cerrar tampoco crea la página. El botón del pie se enciende cuando hay qué cargar.

type Base = {
  abierto: boolean
  onCerrar: () => void
  /** Solo cuando se llegó desde «Añadir página». */
  onVolver?: () => void
  onConfirmar: (recurso: Recurso) => void
}

// La instrucción y el control van en el tercio de arriba, no centrados en el alto: el adjunto de la librería es una
// fila delgada y, centrado en un modal de pantalla completa, quedaba a media pantalla con un vacío encima.
// El cuerpo solo apila lo que va dentro. El relleno lo pone el panel del modal: antes llevaba `pt-[12vh]`, un
// margen pensado para centrar el contenido en el lienzo de pantalla completa, y en un modal normal era hueco blanco.
function Cuerpo({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full flex-col gap-6">{children}</div>
}

/**
 * Los campos de un alta de recurso: centrados y a 530 px, aunque la ventana mida 736.
 *
 * Es el mismo ancho que las pestañas «Enlace de video» y «Subir video» de Agregar video. La ventana es ancha porque
 * la instrucción grande y las listas de ejemplos lo piden, pero un campo de 736 px de largo se lee mal y deja el
 * contenido flotando: lo que se escribe o se suelta vive en una columna más estrecha (Dave, 14-oct).
 */
function CamposEstrechos({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex w-full max-w-[530px] flex-col gap-5">{children}</div>
}

/** La variante del botón que confirma un alta de recurso: primario cuando ya se puede, contorno mientras falta algo.
 *  Lo comparten todos los modales de recurso —PDF, texto, embebido, SCORM y las pestañas de Agregar video— para que
 *  un botón apagado se vea igual en todos. */
export const botonListo = (listo: boolean) => (listo ? ('default' as const) : ('outline' as const))

// ── PDF ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export function ModalPdf({ abierto, onCerrar, onVolver, onConfirmar }: Base) {
  const [archivo, setArchivo] = useState<ArchivoCargado | null>(null)
  const [subiendo, setSubiendo] = useState(false)
  useEffect(() => {
    if (abierto) setArchivo(null)
  }, [abierto])

  const listo = Boolean(archivo) && !subiendo
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size={ALTA_RECURSO}
      onBack={onVolver}
      title="Agregar PDF"
      footer={
        <Button variant={botonListo(listo)} disabled={!listo} onClick={() => archivo && onConfirmar({ tipo: 'pdf', src: archivo.url || DEMO_PDF, archivo: archivo.nombre, permitirDescarga: true })}>
          Confirmar
        </Button>
      }
      dismissible={false}
    >
      <Cuerpo>
        <InstruccionGrande antes="Sube el " clave="archivo PDF" despues=" que quieres añadir" />
        <CamposEstrechos>
          <FileUpload
            titulo="Archivo PDF"
            acepta="application/pdf,.pdf"
            maximoMb={250}
            formatos="PDF · Hasta 250 MB"
            conProgreso
            archivo={archivo}
            onArchivo={setArchivo}
            onSubiendo={setSubiendo}
          />
        </CamposEstrechos>
      </Cuerpo>
    </ActionDialog>
  )
}

// ── Embebido ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * De lo que pegue el creador a lo que de verdad se puede meter en un iframe.
 *
 * La mayoría de los sitios prohíben que otra página los muestre dentro (cabecera `X-Frame-Options` o `CSP`), así que
 * pegar la dirección de la barra —la de ver el video, la de editar el documento— deja un recuadro en blanco. Casi todos
 * tienen otra dirección hermana pensada para embeber, y esa es la que hay que usar.
 *
 * Para el creador esto es invisible: pega la URL que tenga a mano y aquí abajo se traduce.
 */

type Embebido = { src: string; fuente?: string }

/** El identificador del video de YouTube, venga como venga la dirección. */
function idYouTube(u: URL) {
  if (u.hostname.endsWith('youtu.be')) return u.pathname.slice(1).split('/')[0]
  const v = u.searchParams.get('v')
  if (v) return v
  return u.pathname.match(/\/(?:embed|shorts|live|v)\/([^/?#]+)/)?.[1]
}

/** Segundo de arranque: YouTube lo escribe como `t=90`, `t=1m30s` o `start=90`. */
function segundos(valor: string | null) {
  if (!valor) return null
  if (/^\d+$/.test(valor)) return valor
  const m = valor.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/)
  if (!m) return null
  const total = Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
  return total ? String(total) : null
}

function traducir(u: URL): Embebido | null {
  const host = u.hostname.replace(/^www\./, '')
  const ruta = u.pathname

  // YouTube: ver, compartir, shorts y directos van todos a /embed.
  if (host.endsWith('youtube.com') || host === 'youtu.be') {
    const id = idYouTube(u)
    if (!id) return null
    const arranque = segundos(u.searchParams.get('t') ?? u.searchParams.get('start'))
    return { src: `https://www.youtube.com/embed/${id}${arranque ? `?start=${arranque}` : ''}`, fuente: 'YouTube' }
  }

  // Vimeo: vimeo.com/123 → el reproductor.
  if (host.endsWith('vimeo.com') && !host.startsWith('player.')) {
    const id = ruta.match(/^\/(?:video\/)?(\d+)/)?.[1]
    if (id) return { src: `https://player.vimeo.com/video/${id}`, fuente: 'Vimeo' }
  }

  // Drive: un archivo suelto se ve con /preview, no con /view.
  if (host === 'drive.google.com') {
    const id = ruta.match(/\/file\/d\/([^/]+)/)?.[1]
    if (id) return { src: `https://drive.google.com/file/d/${id}/preview`, fuente: 'Google Drive' }
  }

  // Documentos, hojas y presentaciones: la dirección de editar no se deja embeber.
  if (host === 'docs.google.com') {
    const tipo = ruta.match(/^\/(document|spreadsheets|presentation|forms)\//)?.[1]
    const id = ruta.match(/\/d\/(?:e\/)?([^/]+)/)?.[1]
    if (tipo && id) {
      const nombre = { document: 'un documento', spreadsheets: 'una hoja', presentation: 'una presentación', forms: 'un formulario' }[tipo]
      if (tipo === 'presentation') return { src: `https://docs.google.com/presentation/d/${id}/embed`, fuente: `Google Slides · ${nombre}` }
      if (tipo === 'forms') return { src: `https://docs.google.com/forms/d/e/${id}/viewform?embedded=true`, fuente: 'Google Forms' }
      return { src: `https://docs.google.com/${tipo}/d/${id}/preview`, fuente: `Google Docs · ${nombre}` }
    }
  }

  if (host.endsWith('loom.com')) {
    const id = ruta.match(/\/(?:share|embed)\/([^/?#]+)/)?.[1]
    if (id) return { src: `https://www.loom.com/embed/${id}`, fuente: 'Loom' }
  }

  if (host.endsWith('canva.com')) {
    const base = ruta.match(/^(\/design\/[^/]+\/[^/]+)/)?.[1]
    if (base) return { src: `https://www.canva.com${base}/view?embed`, fuente: 'Canva' }
  }

  if (host.endsWith('miro.com')) {
    const id = ruta.match(/\/app\/board\/([^/?#]+)/)?.[1]
    if (id) return { src: `https://miro.com/app/live-embed/${id}/`, fuente: 'Miro' }
  }

  // Podcasts y audio de Spotify.
  if (host === 'open.spotify.com') {
    const m = ruta.match(/^\/(episode|show|track|album|playlist)\/([^/?#]+)/)
    if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, fuente: 'Spotify' }
  }

  if (host.endsWith('figma.com') && /^\/(file|proto|design|board)\//.test(ruta)) {
    return { src: `https://www.figma.com/embed?embed_host=ubits&url=${encodeURIComponent(u.toString())}`, fuente: 'Figma' }
  }

  return null
}

/**
 * Acepta una URL o un código iframe/object/embed y devuelve la dirección a embeber, ya traducida cuando el sitio tiene
 * una forma propia de embeber. `fuente` es de dónde salió, para decírselo al creador.
 */
export function leerEmbebido(valor: string): Embebido | null {
  const texto = valor.trim()
  if (!texto) return null

  // Código pegado: nos quedamos con su `src`, que ya viene listo para embeber.
  if (/<(iframe|object|embed)\b/i.test(texto)) {
    const src = texto.match(/src\s*=\s*["']([^"']+)["']/i)?.[1]
    if (!src) return null
    try {
      return traducir(new URL(src)) ?? { src: new URL(src).toString() }
    } catch {
      return null
    }
  }

  const crudo = /^https?:\/\//i.test(texto) ? texto : /^[\w.-]+\.[a-z]{2,}/i.test(texto) ? `https://${texto}` : null
  if (!crudo) return null
  try {
    const u = new URL(crudo)
    return traducir(u) ?? { src: u.toString() }
  } catch {
    return null
  }
}

export function ModalEmbebido({ abierto, onCerrar, onVolver, onConfirmar }: Base) {
  const [valor, setValor] = useState('')
  const [tocado, setTocado] = useState(false)
  useEffect(() => {
    if (abierto) {
      setValor('')
      setTocado(false)
    }
  }, [abierto])

  const leido = leerEmbebido(valor)
  const invalido = tocado && Boolean(valor.trim()) && !leido
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size={ALTA_RECURSO}
      onBack={onVolver}
      title="Agregar embebido"
      footer={
        <Button
          variant={botonListo(Boolean(leido))}
          disabled={!leido}
          onClick={() => leido && onConfirmar({ tipo: 'embebido', src: leido.src, codigo: /</.test(valor) ? valor.trim() : undefined })}
        >
          Cargar
        </Button>
      }
      dismissible={false}
    >
      <Cuerpo>
        <InstruccionGrande antes="Pega el " clave="enlace o el código" despues=" que quieres embeber" />
        <CamposEstrechos>
          <Field data-invalid={invalido ? 'true' : undefined}>
          <Textarea
            aria-label="Enlace o código a embeber"
            rows={5}
            placeholder="Pega el link o el código a embeber"
            value={valor}
            onChange={(e) => {
              setValor(e.target.value)
              setTocado(true)
            }}
            aria-invalid={invalido ? true : undefined}
            className="min-h-35"
          />
          {invalido ? (
            <FieldError>Este no es un enlace válido</FieldError>
          ) : (
              <FieldDescription>La URL debe ser embebible y visible para los colaboradores. También puedes pegar el código iframe.</FieldDescription>
            )}
          </Field>
        </CamposEstrechos>
      </Cuerpo>
    </ActionDialog>
  )
}

// ── Texto ────────────────────────────────────────────────────────────────────────────────────────────────────────

export function ModalTexto({ abierto, onCerrar, onVolver, onConfirmar, inicial }: Base & { inicial?: string }) {
  const [html, setHtml] = useState('')
  const [clave, setClave] = useState(0)
  useEffect(() => {
    if (abierto) {
      setHtml(inicial ?? '')
      setClave((c) => c + 1)
    }
  }, [abierto, inicial])

  const listo = Boolean(textoPlano(html))
  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size={ALTA_TEXTO}
      onBack={onVolver}
      title={inicial ? 'Editar texto' : 'Agregar texto'}
      footer={
        <Button variant={botonListo(listo)} disabled={!listo} onClick={() => onConfirmar({ tipo: 'texto', html })}>
          Confirmar
        </Button>
      }
      dismissible={false}
    >
      <Cuerpo>
        <InstruccionGrande antes="Escribe el " clave="texto" despues=" que quieres añadir" />
        <EditorTexto key={clave} id="cc-recurso-texto" valor={html} onCambio={setHtml} placeholder="Escribe el contenido de la página…" alto={280} />
      </Cuerpo>
    </ActionDialog>
  )
}

// ── SCORM ────────────────────────────────────────────────────────────────────────────────────────────────────────

export function ModalScorm({ abierto, onCerrar, onVolver, onConfirmar }: Base) {
  const [archivo, setArchivo] = useState<ArchivoCargado | null>(null)
  useEffect(() => {
    if (abierto) setArchivo(null)
  }, [abierto])

  return (
    <ActionDialog
      open={abierto}
      onOpenChange={(abrir) => {
        if (!abrir) onCerrar()
      }}
      size={ALTA_RECURSO}
      onBack={onVolver}
      title="Agregar SCORM"
      footer={
        <Button
          variant={botonListo(Boolean(archivo))}
          disabled={!archivo}
          // El prototipo no descomprime el paquete: se muestra el SCORM de ejemplo en su lugar.
          onClick={() => archivo && onConfirmar({ tipo: 'scorm', src: DEMO_SCORM, archivo: archivo.nombre, generadoConIA: false })}
        >
          Cargar SCORM
        </Button>
      }
      dismissible={false}
    >
      <Cuerpo>
        <InstruccionGrande antes="Sube el " clave="paquete SCORM" despues=" que quieres añadir" />
        <CamposEstrechos>
          <FileUpload titulo="Paquete SCORM" acepta=".zip,application/zip" maximoMb={250} formatos="ZIP SCORM · Hasta 250 MB" archivo={archivo} onArchivo={setArchivo} />
        </CamposEstrechos>
      </Cuerpo>
    </ActionDialog>
  )
}
