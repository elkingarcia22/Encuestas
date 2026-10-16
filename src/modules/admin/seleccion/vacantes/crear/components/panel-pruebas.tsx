import { useState } from 'react'
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react'
import {
  Brain02Icon,
  Delete02Icon,
  Diamond01Icon,
  Idea01Icon,
  PencilEdit02Icon,
  PlusSignIcon,
  Rocket01Icon,
  Task01Icon,
  UserGroupIcon,
  UserSearch01Icon,
} from '@hugeicons/core-free-icons'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
  IconTile,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
  RadioGroup,
  RadioGroupItem,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { IDIOMAS_PRUEBA, TIPOS_PRUEBA, pruebaNueva, type Prueba } from './etapas'
import { CampoNumero } from './piezas'
import { AvisoPropuestaIa } from './piezas-ia'

const ICONOS_PRUEBA: Record<string, IconSvgElement> = {
  'Cognición (inteligencia)': Brain02Icon,
  'Perfil de motivación': Rocket01Icon,
  'Dominancia cerebral': Idea01Icon,
  'Estilo social': UserGroupIcon,
  'Inventario de valores organizacionales (corta)': Diamond01Icon,
  'Personalidad 16': UserSearch01Icon,
}

type Props = {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  pruebas: Prueba[]
  onGuardar: (pruebas: Prueba[]) => void
  // Abierto desde «Configurar con IA» de la fila: las pruebas son la propuesta de la IA, todavía sin guardar.
  llenadoConIa?: boolean
  nombreVacante?: string
}

// Panel de la etapa «Pruebas psicotécnicas»: como el de Serena, los cambios quedan en borrador hasta
// «Guardar configuración»; cerrar o cancelar los descarta.
export function PanelPruebas({ abierto, onAbiertoChange, pruebas: guardadas, onGuardar, llenadoConIa = false, nombreVacante = '' }: Props) {
  const [pruebas, setPruebas] = useState(guardadas)
  const [borrador, setBorrador] = useState<Prueba | null>(null)

  const cerrarFormulario = () => setBorrador(null)

  const guardar = () => {
    if (!borrador) return
    const existe = pruebas.some((prueba) => prueba.id === borrador.id)
    setPruebas(
      existe ? pruebas.map((prueba) => (prueba.id === borrador.id ? borrador : prueba)) : [...pruebas, borrador],
    )
    cerrarFormulario()
  }

  // Se guarda aunque quede vacía: lo que frena la vacante es «Publicar», que avisa qué completar.
  const guardarConfiguracion = () => {
    onGuardar(pruebas)
    onAbiertoChange(false)
    if (pruebas.length === 0) notify('Guardamos la etapa sin pruebas', 'Agrega al menos una antes de publicar la vacante.', 'warning')
    else notify('Guardamos las pruebas psicotécnicas', undefined, 'success')
  }

  return (
    // El panel lateral del playground (DrawerShell), con el orbe: las pruebas las califica la IA.
    <DrawerShell
      open={abierto}
      onOpenChange={(valor) => {
        if (!valor) cerrarFormulario()
        onAbiertoChange(valor)
      }}
      size="lg"
      ai
      title="Pruebas psicotécnicas"
      description="Cada prueba mide algo distinto. El candidato las presenta todas en esta etapa."
      // Mientras se crea o edita una prueba el pie se oculta: la acción es la del formulario.
      footer={
        borrador ? undefined : (
          <>
            <Button variant="outline" onClick={() => onAbiertoChange(false)}>
              Cancelar
            </Button>
            <Button onClick={guardarConfiguracion}>
              Guardar configuración
            </Button>
          </>
        )
      }
    >
      <div>
        {llenadoConIa && !borrador ? <AvisoPropuestaIa nombreVacante={nombreVacante} /> : null}
        {borrador ? (
          <FormularioPrueba
            prueba={borrador}
            nueva={!pruebas.some((prueba) => prueba.id === borrador.id)}
            usadas={pruebas.filter((prueba) => prueba.id !== borrador.id).map((prueba) => prueba.tipo)}
            onCambio={setBorrador}
            onGuardar={guardar}
            onCancelar={cerrarFormulario}
          />
        ) : pruebas.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={Task01Icon} aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Todavía no hay pruebas</EmptyTitle>
              <EmptyDescription>
                Agrega la primera para empezar a medir al candidato con inteligencia artificial.
              </EmptyDescription>
            </EmptyHeader>
            {/* Secundario: el primario del panel es «Guardar configuración» (29 sep, reunión con Elkin). */}
            <EmptyContent>
              <Button variant="outline" onClick={() => setBorrador(pruebaNueva())}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                Agregar prueba
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="flex flex-col gap-3">
            {pruebas.map((prueba) => (
              <Item key={prueba.id} variant="outline">
                <ItemContent>
                  <ItemTitle>{prueba.tipo || 'Prueba sin tipo'}</ItemTitle>
                  <ItemDescription>
                    {TIPOS_PRUEBA.find((tipo) => tipo.valor === prueba.tipo)?.detalle}
                  </ItemDescription>
                  <ItemDescription>
                    Idioma: {prueba.idioma || 'sin definir'} · Puntaje mínimo: {prueba.puntajeMinimo} pts
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <BotonIcono aria-label={`Editar ${prueba.tipo || 'la prueba'}`} onClick={() => setBorrador(prueba)}>
                    <HugeiconsIcon icon={PencilEdit02Icon} size={18} />
                  </BotonIcono>
                  <BotonIcono
                    aria-label={`Quitar ${prueba.tipo || 'la prueba'}`}
                    className="text-destructive!"
                    onClick={() => setPruebas(pruebas.filter((otra) => otra.id !== prueba.id))}
                  >
                    <HugeiconsIcon icon={Delete02Icon} size={18} />
                  </BotonIcono>
                </ItemActions>
              </Item>
            ))}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setBorrador(pruebaNueva())}>
                <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} aria-hidden="true" />
                Agregar prueba
              </Button>
            </div>
          </div>
        )}
      </div>
    </DrawerShell>
  )
}

function FormularioPrueba({
  prueba,
  nueva,
  usadas,
  onCambio,
  onGuardar,
  onCancelar,
}: {
  prueba: Prueba
  nueva: boolean
  // Los tipos que ya están en la lista: cada prueba mide algo distinto, así que no se repiten.
  usadas: string[]
  onCambio: (prueba: Prueba) => void
  onGuardar: () => void
  onCancelar: () => void
}) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{nueva ? 'Nueva prueba' : 'Editar prueba'}</CardTitle>
        <CardDescription>Elige qué medir, en qué idioma la presenta y el puntaje para pasar.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <FieldSet>
          <FieldLegend>Tipo de prueba</FieldLegend>
          <RadioGroup
            value={prueba.tipo}
            onValueChange={(tipo) => onCambio({ ...prueba, tipo: tipo as string })}
            // Una columna: el panel es angosto y en dos la explicación de cada prueba se parte en muchas líneas.
            className="grid gap-3"
          >
            {TIPOS_PRUEBA.map((opcion, indice) => {
              const id = `prueba-tipo-${indice}`
              const usada = usadas.includes(opcion.valor)
              return (
                <FieldLabel key={opcion.valor} htmlFor={id}>
                  <Field orientation="horizontal" data-disabled={usada || undefined}>
                    <IconTile variant="soft" size="sm" className="shrink-0">
                      <HugeiconsIcon icon={ICONOS_PRUEBA[opcion.valor] ?? Task01Icon} aria-hidden="true" />
                    </IconTile>
                    <FieldContent>
                      <FieldTitle>{opcion.valor}</FieldTitle>
                      <FieldDescription>{usada ? 'Ya está en esta etapa.' : opcion.detalle}</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem value={opcion.valor} id={id} disabled={usada} />
                  </Field>
                </FieldLabel>
              )
            })}
          </RadioGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Idioma de la prueba</FieldLegend>
          <RadioGroup
            value={prueba.idioma}
            onValueChange={(idioma) => onCambio({ ...prueba, idioma: idioma as string })}
            className="grid gap-3 sm:grid-cols-2"
          >
            {IDIOMAS_PRUEBA.map((idioma) => {
              const id = `prueba-idioma-${idioma}`
              return (
                <FieldLabel key={idioma} htmlFor={id}>
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>{idioma}</FieldTitle>
                    </FieldContent>
                    <RadioGroupItem value={idioma} id={id} />
                  </Field>
                </FieldLabel>
              )
            })}
          </RadioGroup>
        </FieldSet>

        <CampoNumero
          id="prueba-minimo"
          etiqueta="Puntaje mínimo para pasar"
          descripcion="Por debajo de este puntaje el candidato no pasa de etapa. El máximo es 100."
          valor={prueba.puntajeMinimo}
          onCambio={(puntajeMinimo) => onCambio({ ...prueba, puntajeMinimo })}
          min={0}
          max={100}
          step={5}
          unidad="pts"
        />
      </CardContent>
      <CardFooter className="justify-end gap-2">
        <Button variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button disabled={!prueba.tipo || !prueba.idioma} onClick={onGuardar}>
          Guardar prueba
        </Button>
      </CardFooter>
    </Card>
  )
}
