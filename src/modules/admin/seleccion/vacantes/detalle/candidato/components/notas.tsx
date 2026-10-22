import type { ReactNode } from 'react'
import { useState } from 'react'
import { NoteAddIcon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldDescription,
  FieldLabel,
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { iniciales } from '@/modules/design-system/patrones/formato'
import { EtiquetaIA } from '@/modules/design-system/ia/etiqueta-ia'
import { Orb } from '@/shared/components/Orb'
import { NOMBRE_ETAPA, type EtapaId, type Nota } from '../../components/data'
import { ImagenGlass } from '@/shared/components/ImagenGlass'

// Notas del equipo de selección. Cada una puede ir atada a una etapa (las observaciones de Serena, los
// comentarios de quienes evalúan el Roleplay) o quedar como nota general del candidato.

// `acciones`: lo que se puede hacer con cada nota (editar o borrar la propia, CA-42).
export function ListaNotas({
  notas,
  conEtapa = false,
  vacia,
  acciones,
}: {
  notas: Nota[]
  conEtapa?: boolean
  vacia: string
  acciones?: (nota: Nota) => ReactNode
}) {
  // Sin notas, el vacío del producto (icono y título), no una frase gris suelta. Sin texto de vacío no se pinta nada.
  if (!notas.length) {
    if (!vacia) return null
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="default">
            <ImagenGlass nombre="glass-edit" tamano={56} />
          </EmptyMedia>
          <EmptyTitle>{vacia}</EmptyTitle>
        </EmptyHeader>
      </Empty>
    )
  }
  return (
    <ItemGroup className="gap-2">
      {notas.map((nota) => (
        <Item key={nota.id} variant="muted" size="sm" className="items-start">
          <ItemMedia>
            {nota.agente ? (
              <Orb className="size-8" />
            ) : (
              <Avatar size="sm">
                <AvatarFallback>{iniciales(nota.autor)}</AvatarFallback>
              </Avatar>
            )}
          </ItemMedia>
          <ItemContent>
            <ItemTitle className="flex-wrap">
              {nota.autor}
              {nota.agente ? (
                <EtiquetaIA size="xs">Resumen del agente</EtiquetaIA>
              ) : null}
              {conEtapa ? (
                <Badge variant="secondary">
                  {nota.etapa ? NOMBRE_ETAPA[nota.etapa] : 'General'}
                </Badge>
              ) : null}
            </ItemTitle>
            <Text as="span" variant="muted" size="xs">
              {nota.fecha}
              {nota.editada ? ' · editada' : ''}
              {nota.privada ? ' · solo el equipo de selección' : ''}
            </Text>
            <Text as="p" size="sm">
              {nota.texto}
            </Text>
            {acciones ? acciones(nota) : null}
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

const GENERAL = 'general'

// Punto 7 · Agregar comentario. Desde una etapa (Roleplay, Serena) la etapa viene fija; desde la pestaña
// Notas se elige, y por defecto queda como nota general.
export function DrawerComentario({
  open,
  onOpenChange,
  etapa,
  etapas = [],
  onPublicar,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  etapa?: EtapaId
  etapas?: EtapaId[]
  onPublicar: (texto: string, etapa: EtapaId | undefined) => void
}) {
  const [texto, setTexto] = useState('')
  const [elegida, setElegida] = useState<string>(GENERAL)
  const opciones = [{ value: GENERAL, label: 'General del candidato' }, ...etapas.map((id) => ({ value: id, label: NOMBRE_ETAPA[id] }))]

  const cerrar = (abierto: boolean) => {
    onOpenChange(abierto)
    if (!abierto) {
      setTexto('')
      setElegida(GENERAL)
    }
  }

  const publicar = () => {
    onPublicar(texto.trim(), etapa ?? (elegida === GENERAL ? undefined : (elegida as EtapaId)))
    cerrar(false)
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={cerrar}
      size="md"
      kicker={etapa ? NOMBRE_ETAPA[etapa] : 'Expediente del candidato'}
      title={etapa === 'serena' ? 'Agregar observación' : etapa ? 'Agregar comentario' : 'Agregar nota'}
      description="Solo lo ve el equipo de selección."
      icon={NoteAddIcon}
      footer={
        <>
          <Button variant="outline" onClick={() => cerrar(false)}>
            Cancelar
          </Button>
          <Button disabled={!texto.trim()} onClick={publicar}>
            Publicar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        {etapa ? null : (
          <Field>
            <FieldLabel id="nota-etapa-label">Etapa</FieldLabel>
            <Select value={elegida} onValueChange={(valor) => setElegida(String(valor))} items={opciones}>
              <SelectTrigger aria-labelledby="nota-etapa-label">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {opciones.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldDescription>Atada a una etapa, la nota también aparece en su pestaña.</FieldDescription>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="nota-texto">Comentario</FieldLabel>
          <Textarea
            id="nota-texto"
            rows={7}
            value={texto}
            onChange={(event) => setTexto(event.target.value)}
            placeholder={
              etapa === 'roleplay'
                ? 'Qué hizo bien, qué le faltó y si lo pasarías a la siguiente etapa'
                : 'Qué viste y por qué importa para la decisión'
            }
            // El campo crece con el texto; con esto arranca con el alto de un comentario y no de una línea.
            className="min-h-32 resize-none"
          />
          <FieldDescription>Queda con tu nombre y la hora. El candidato no la ve.</FieldDescription>
        </Field>
      </div>
    </DrawerShell>
  )
}
