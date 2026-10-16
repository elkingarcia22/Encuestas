// Los mensajes de bienvenida y de cierre. Las encuestas de ejemplo los traen con marcado ligero
// (párrafos y negritas); lo que se escribe en el paso 5 es texto sencillo, con una línea en blanco
// entre párrafos. Aquí se leen los dos como párrafos hechos de tramos, normales o en negrita, para
// mostrarlos con los textos del tema sin inyectar HTML en la página.

export type Tramo = { texto: string; fuerte: boolean }
export type Parrafo = Tramo[]

const BLOQUES = 'p, li, h1, h2, h3, h4, blockquote'

function tramosDe(nodo: Node, fuerte: boolean): Tramo[] {
  if (nodo.nodeType === Node.TEXT_NODE) return [{ texto: nodo.textContent ?? '', fuerte }]
  if (!(nodo instanceof Element)) return []
  const enNegrita = fuerte || /^(strong|b|h\d)$/i.test(nodo.tagName)
  return [...nodo.childNodes].flatMap((hijo) => tramosDe(hijo, enNegrita))
}

// Junta los tramos seguidos del mismo peso y deja los espacios como en una sola línea.
function limpiar(tramos: Tramo[]): Parrafo {
  const juntos = tramos.reduce<Tramo[]>((acc, tramo) => {
    const texto = tramo.texto.replace(/\s+/g, ' ')
    const previo = acc[acc.length - 1]
    return previo && previo.fuerte === tramo.fuerte ? [...acc.slice(0, -1), { ...previo, texto: previo.texto + texto }] : [...acc, { ...tramo, texto }]
  }, [])
  if (juntos.length === 0) return []
  const primero = { ...juntos[0], texto: juntos[0].texto.trimStart() }
  const conPrimero = [primero, ...juntos.slice(1)]
  const ultimo = conPrimero[conPrimero.length - 1]
  return [...conPrimero.slice(0, -1), { ...ultimo, texto: ultimo.texto.trimEnd() }].filter((tramo) => tramo.texto !== '')
}

function parrafosDeMarcado(html: string): Parrafo[] {
  const documento = new DOMParser().parseFromString(html, 'text/html')
  const bloques = [...documento.body.querySelectorAll(BLOQUES)]
  const fuente = bloques.length > 0 ? bloques : [documento.body]
  return fuente.map((bloque) => limpiar(tramosDe(bloque, false))).filter((parrafo) => parrafo.length > 0)
}

export function parrafosDe(contenido: string): Parrafo[] {
  if (contenido.includes('<')) return parrafosDeMarcado(contenido)
  return contenido
    .split(/\n\s*\n/)
    .map((bloque) => bloque.trim())
    .filter((bloque) => bloque !== '')
    .map((bloque) => [{ texto: bloque, fuerte: false }])
}

/** El mensaje como se edita: párrafos separados por una línea en blanco. */
export const textoEditable = (contenido: string) =>
  contenido.includes('<') ? parrafosDe(contenido).map((parrafo) => parrafo.map((tramo) => tramo.texto).join('')).join('\n\n') : contenido

export const enBlanco = (contenido: string) => parrafosDe(contenido).length === 0

/** Un enunciado en una sola línea: el del banco llega con marcado y aquí se ve solo su texto. */
export const textoPlano = (contenido: string) => (contenido.includes('<') ? parrafosDe(contenido).map((parrafo) => parrafo.map((tramo) => tramo.texto).join('')).join(' ') : contenido.trim())

const escapar = (texto: string) => texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** El mensaje como lo abre el editor de texto enriquecido: el sencillo de antes pasa a un párrafo por bloque. */
export const aHtml = (contenido: string) =>
  contenido.includes('<')
    ? contenido
    : contenido
        .split(/\n\s*\n/)
        .map((bloque) => bloque.trim())
        .filter((bloque) => bloque !== '')
        .map((bloque) => `<p>${escapar(bloque).replace(/\n/g, '<br>')}</p>`)
        .join('')

const ETIQUETAS_PERMITIDAS = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'UL', 'OL', 'LI', 'H2', 'H3', 'BLOCKQUOTE', 'A', 'DIV', 'SPAN'])

function limpiarNodo(nodo: Node): void {
  ;[...nodo.childNodes].forEach((hijo) => {
    if (!(hijo instanceof Element)) return
    if (!ETIQUETAS_PERMITIDAS.has(hijo.tagName)) {
      // Una etiqueta que no es del editor se descarta con todo lo que lleva dentro si es ejecutable; el resto, solo su texto.
      if (/^(SCRIPT|STYLE|IFRAME|OBJECT|EMBED)$/i.test(hijo.tagName)) hijo.remove()
      else hijo.replaceWith(...hijo.childNodes)
      return limpiarNodo(nodo)
    }
    ;[...hijo.attributes].forEach((atributo) => {
      const permitido = hijo.tagName === 'A' && atributo.name === 'href' && /^(https?:|mailto:)/i.test(atributo.value.trim())
      if (!permitido) hijo.removeAttribute(atributo.name)
    })
    if (hijo.tagName === 'A') {
      hijo.setAttribute('target', '_blank')
      hijo.setAttribute('rel', 'noopener noreferrer')
    }
    limpiarNodo(hijo)
  })
}

/** El marcado del editor, solo con lo que el editor sabe escribir: sin scripts, estilos ni atributos sueltos. */
export function marcadoSeguro(contenido: string): string {
  const documento = new DOMParser().parseFromString(contenido, 'text/html')
  limpiarNodo(documento.body)
  return documento.body.innerHTML
}

const textoDeMarcado = (contenido: string) => new DOMParser().parseFromString(contenido, 'text/html').body.textContent ?? ''

/** Cuántos caracteres tiene el mensaje: solo su texto, sin contar el marcado. */
export const largoMensaje = (contenido: string) => (contenido.includes('<') ? textoDeMarcado(contenido) : contenido).length

/** El mensaje cortado a `max` caracteres de texto sin romper el marcado: lo que sobra se quita desde el final. */
export function recortarMensaje(contenido: string, max: number): string {
  if (largoMensaje(contenido) <= max) return contenido
  if (!contenido.includes('<')) return contenido.slice(0, max)
  const documento = new DOMParser().parseFromString(contenido, 'text/html')
  let quedan = max
  const recorrer = (nodo: Node) => {
    ;[...nodo.childNodes].forEach((hijo) => {
      if (quedan <= 0) return hijo.remove()
      if (hijo.nodeType !== Node.TEXT_NODE) return recorrer(hijo)
      const texto = hijo.textContent ?? ''
      if (texto.length > quedan) hijo.textContent = texto.slice(0, quedan)
      quedan -= Math.min(texto.length, quedan)
    })
  }
  recorrer(documento.body)
  return documento.body.innerHTML
}
