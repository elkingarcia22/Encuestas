import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Delete02Icon, InformationCircleIcon, RefreshIcon } from '@hugeicons/core-free-icons'
import {
  Alert,
  AlertAction,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Field,
  FieldLabel,
  Heading,
  Input,
  Text,
} from '@ubits/flux-ui'
import {
  MAX_IDEA,
  MAX_IDEAS,
  MAX_TITULO_ESCENA,
  diapositivaDeEscena,
  type AcentoId,
  type Escena,
  type EstiloId,
} from '../../crear-contenido/components/presentacion/datos'
import { MiniaturaDiapositiva } from '../../crear-contenido/components/presentacion/diapositiva'

// «Borrador de diapositivas» del setup (ScormIaStructurePanel): una tarjeta por diapositiva con su miniatura, el
// título y las ideas principales. Se edita una a la vez; si el setup cambió después de estructurar, las tarjetas se
// bloquean hasta volver a estructurar.

type Props = {
  escenas: Escena[]
  estilo: EstiloId
  tituloPresentacion: string
  acento: AcentoId
  logo: string | null
  desactualizada: boolean
  onReestructurar: () => void
  onCambiar: (escenas: Escena[]) => void
}

export function PanelEstructura({ escenas, estilo, tituloPresentacion, acento, logo, desactualizada, onReestructurar, onCambiar }: Props) {
  const [editando, setEditando] = useState<string | null>(null)

  return (
    <div className="flex flex-col gap-4">
      {desactualizada ? (
        <Alert variant="info">
          <HugeiconsIcon icon={InformationCircleIcon} aria-hidden="true" />
          <AlertDescription>
            <p>Cambiaste el setup. Vuelve a estructurar la presentación (gratis) para actualizar las diapositivas.</p>
          </AlertDescription>
          <AlertAction>
            <Button variant="outline" size="sm" onClick={onReestructurar}>
              <HugeiconsIcon icon={RefreshIcon} size={16} />
              Volver a estructurar
            </Button>
          </AlertAction>
        </Alert>
      ) : null}

      <ol className="flex flex-col gap-3" aria-label="Diapositivas del borrador">
        {escenas.map((escena, indice) => (
          <TarjetaEscena
            key={escena.id}
            escena={escena}
            indice={indice}
            estilo={estilo}
            tituloPresentacion={tituloPresentacion}
            acento={acento}
            logo={logo}
            editando={editando === escena.id}
            bloqueada={desactualizada || (editando != null && editando !== escena.id)}
            onEditar={() => setEditando(escena.id)}
            onCancelar={() => setEditando(null)}
            onGuardar={(siguiente) => {
              onCambiar(escenas.map((e) => (e.id === siguiente.id ? siguiente : e)))
              setEditando(null)
            }}
          />
        ))}
      </ol>
    </div>
  )
}

type PropsTarjeta = {
  escena: Escena
  indice: number
  estilo: EstiloId
  tituloPresentacion: string
  acento: AcentoId
  logo: string | null
  editando: boolean
  bloqueada: boolean
  onEditar: () => void
  onCancelar: () => void
  onGuardar: (escena: Escena) => void
}

function TarjetaEscena({ escena, indice, estilo, tituloPresentacion, acento, logo, editando, bloqueada, onEditar, onCancelar, onGuardar }: PropsTarjeta) {
  const [titulo, setTitulo] = useState(escena.titulo)
  const [ideas, setIdeas] = useState<string[]>(escena.ideas)

  const empezar = () => {
    setTitulo(escena.titulo)
    setIdeas(escena.ideas.length ? [...escena.ideas] : [''])
    onEditar()
  }

  // La miniatura se actualiza en vivo mientras se edita.
  const vista = editando ? { ...escena, titulo, ideas } : escena
  const diapositiva = diapositivaDeEscena(vista, estilo, tituloPresentacion, indice)
  const puedeGuardar = Boolean(titulo.trim()) && ideas.some((i) => i.trim())
  const idTitulo = `escena-${escena.id}-titulo`

  return (
    <li>
      <Card size="sm">
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-start">
          <div className="w-full max-w-45 shrink-0 md:w-56 md:max-w-none">
            <MiniaturaDiapositiva diapositiva={{ ...diapositiva, id: escena.id }} acento={acento} logo={logo} className="border" />
          </div>

          {editando ? (
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <Field>
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel htmlFor={idTitulo}>Título de la diapositiva</FieldLabel>
                  <Text as="span" size="xs" variant="muted" className="tabular-nums">
                    {`${titulo.length}/${MAX_TITULO_ESCENA}`}
                  </Text>
                </div>
                <Input id={idTitulo} value={titulo} maxLength={MAX_TITULO_ESCENA} onChange={(e) => setTitulo(e.target.value)} />
              </Field>
              <Text size="xs" variant="muted">
                Ideas principales. No es la redacción final, solo el esquema
              </Text>
              <div className="flex flex-col gap-2">
                {ideas.map((idea, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Text as="span" variant="muted" aria-hidden="true">
                      •
                    </Text>
                    <Input
                      aria-label={`Idea principal ${i + 1}`}
                      value={idea}
                      maxLength={MAX_IDEA}
                      placeholder="Escribe una idea principal"
                      onChange={(e) => setIdeas((lista) => lista.map((x, j) => (j === i ? e.target.value : x)))}
                    />
                    <Button
                      variant="destructive"
                      size="icon-sm"
                      aria-label="Eliminar idea"
                      disabled={ideas.length <= 1}
                      onClick={() => setIdeas((lista) => lista.filter((_, j) => j !== i))}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="link"
                size="sm"
                className="w-fit px-0"
                disabled={ideas.length >= MAX_IDEAS}
                onClick={() => setIdeas((lista) => [...lista, ''])}
              >
                <HugeiconsIcon icon={Add01Icon} size={14} />
                Agregar idea
              </Button>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={onCancelar}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  disabled={!puedeGuardar}
                  onClick={() => onGuardar({ ...escena, titulo: titulo.trim(), ideas: ideas.map((i) => i.trim()).filter(Boolean) })}
                >
                  Guardar cambios
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <Heading as="h3" level={6}>
                {escena.titulo}
              </Heading>
              <Text as="ul" size="sm" variant="muted" className="flex list-disc flex-col gap-1 pl-5">
                {escena.ideas.map((idea, i) => (
                  <li key={i}>{idea}</li>
                ))}
              </Text>
              <Button variant="link" size="sm" className="w-fit px-0" disabled={bloqueada} onClick={empezar}>
                Editar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </li>
  )
}
