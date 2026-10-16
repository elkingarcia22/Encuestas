import { useEffect, useRef, useState } from 'react'
import { Field, FieldDescription, Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle, Text } from '@ubits/flux-ui'
import { EditorTexto } from '@/modules/admin/aprendizaje/lms-creator/crear-contenido/components/editor-texto'
import { AiThinking } from '@/shared/components/AiThinking'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { notifyAction } from '@/shared/components/notify'
import { refinePageMessage } from '../../modelo/aiPageWording'
import type { SurveyDraft } from '../../modelo/surveyBuilderTypes'
import { aHtml, enBlanco, largoMensaje, recortarMensaje } from '../../modelo/textoPagina'
import { LIMITE_MENSAJE_PAGINA, contador } from '../../modelo/limites-texto'

// Paso 5: la bienvenida y el cierre. Son cortos, así que los dos quedan a la vista a la vez y se
// compara el tono de la primera línea con el de la despedida sin cambiar de pestaña. En blanco, la
// página no se muestra: escribir el mensaje es lo que la enciende. La IA escribe el mensaje si está
// en blanco o lo mejora si ya hay uno; trabaja en uno a la vez. «Crear con IA» va en la fila del
// título y la descripción, a la derecha de todo, y no dentro del campo.

type Mensaje = {
  id: 'welcome' | 'closing'
  titulo: string
  descripcion: string
  placeholder: string
}

const MENSAJES: Mensaje[] = [
  {
    id: 'welcome',
    titulo: 'Mensaje de bienvenida',
    descripcion: 'Propósito, duración y confidencialidad. En blanco, no se muestra.',
    placeholder: 'Añade un mensaje de bienvenida aquí',
  },
  {
    id: 'closing',
    titulo: 'Mensaje de cierre',
    descripcion: 'Agradecimiento y próximos pasos. En blanco, no se muestra.',
    placeholder: 'Añade un mensaje de cierre aquí',
  },
]

// `falla`: la encuesta de prueba que falla (fallaEnQA): la IA no responde y el texto queda como estaba (IA-006).
// El editor no tiene tope propio: lo que se escribe o se pega se mira antes de entrar, y solo pasa lo que cabe.
function alEscribir(evento: InputEvent) {
  const editor = evento.currentTarget as HTMLElement
  if (!evento.inputType.startsWith('insert')) return
  const nuevo = evento.data ?? evento.dataTransfer?.getData('text/plain') ?? ''
  const elegido = window.getSelection()?.toString().length ?? 0
  const cabe = LIMITE_MENSAJE_PAGINA.max - ((editor.textContent?.length ?? 0) - elegido)
  if (nuevo.length <= cabe) return
  evento.preventDefault()
  if (cabe > 0) document.execCommand('insertText', false, nuevo.slice(0, cabe))
}

export function PasoPaginas({ borrador, onCambio, falla = false }: { borrador: SurveyDraft; onCambio: (cambio: Partial<SurveyDraft>) => void; falla?: boolean }) {
  // Lo que llegue más largo por otra vía (la IA, un pegado que el navegador no avisa) se corta en el tope.
  const cambiar = (id: Mensaje['id'], entrada: string) => {
    const texto = recortarMensaje(entrada, LIMITE_MENSAJE_PAGINA.max)
    onCambio(id === 'welcome' ? { welcomeDescription: texto, welcomeEnabled: !enBlanco(texto) } : { closingDescription: texto, closingEnabled: !enBlanco(texto) })
  }
  const textoDe = (id: Mensaje['id']) => (id === 'welcome' ? borrador.welcomeDescription : borrador.closingDescription)

  const [mejorando, setMejorando] = useState<Mensaje['id'] | null>(null)
  // Los editores se vuelven a montar al terminar la IA: el tope se engancha cada vez.
  useEffect(() => {
    const editores = MENSAJES.map((mensaje) => document.getElementById(`mensaje-${mensaje.id}`)).filter((nodo): nodo is HTMLElement => nodo !== null)
    editores.forEach((nodo) => nodo.addEventListener('beforeinput', alEscribir))
    return () => editores.forEach((nodo) => nodo.removeEventListener('beforeinput', alEscribir))
  }, [mejorando])
  const vivo = useRef(true)
  useEffect(() => {
    vivo.current = true
    return () => {
      vivo.current = false
    }
  }, [])
  const conIa = async (id: Mensaje['id']) => {
    setMejorando(id)
    // Lo que había antes de la IA, para poder volver a él (IA-005).
    const anterior = textoDe(id)
    const nuevo = await refinePageMessage(anterior, id)
    if (!vivo.current) return
    if (falla) {
      setMejorando(null)
      return notifyAction(
        id === 'welcome' ? 'No pudimos crear el mensaje de bienvenida' : 'No pudimos crear el mensaje de cierre',
        'La IA no respondió. Tu texto quedó como estaba.',
        { label: 'Reintentar', onClick: () => void conIa(id) },
        'error',
      )
    }
    cambiar(id, nuevo)
    setMejorando(null)
    // Si ya había un mensaje escrito, la IA lo reescribe y el aviso deja recuperar el original con «Deshacer».
    if (enBlanco(anterior)) return
    notifyAction(
      id === 'welcome' ? 'Reescribimos el mensaje de bienvenida' : 'Reescribimos el mensaje de cierre',
      'Si preferías el que tenías, puedes recuperarlo.',
      { label: 'Deshacer', onClick: () => cambiar(id, anterior) },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Text as="p" variant="muted" size="sm">
        Lo primero y lo último que lee quien responde. Este paso es opcional.
      </Text>
      {MENSAJES.map((mensaje) => (
        <Frame key={mensaje.id}>
          <FrameHeader className="flex-row! items-center! justify-between! gap-3!">
            <div className="flex min-w-0 flex-col gap-1">
              <FrameTitle>{mensaje.titulo}</FrameTitle>
              <FrameDescription>{mensaje.descripcion}</FrameDescription>
            </div>
            {/* Redacta si el campo está vacío y mejora si ya hay texto. */}
            <BotonIaSecundario className="shrink-0" disabled={mejorando !== null} onClick={() => void conIa(mensaje.id)}>
              Crear con IA
            </BotonIaSecundario>
          </FrameHeader>
          <FramePanel>
            <Field>
              {mejorando === mensaje.id ? <AiThinking label={mensaje.id === 'welcome' ? 'Mejorando el mensaje de bienvenida…' : 'Mejorando el mensaje de cierre…'} /> : null}
              {/* Editor de texto enriquecido del design system (Ajustes propios): negrita, listas, títulos y enlaces. Deshabilitado
                  no existe en él, así que mientras la IA redacta se tapa con el aviso y el campo no se monta. */}
              {mejorando === mensaje.id ? null : <EditorTexto id={`mensaje-${mensaje.id}`} placeholder={mensaje.placeholder} alto={140} valor={aHtml(textoDe(mensaje.id))} onCambio={(html) => cambiar(mensaje.id, html)} />}
              <FieldDescription>{contador(largoMensaje(aHtml(textoDe(mensaje.id))), LIMITE_MENSAJE_PAGINA.max)}</FieldDescription>
            </Field>
          </FramePanel>
        </Frame>
      ))}
    </div>
  )
}
