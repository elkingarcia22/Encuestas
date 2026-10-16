import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon, Csv01Icon, Edit02Icon, Tick02Icon, UserAdd01Icon, UserGroupIcon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  RadioGroup,
  RadioGroupItem,
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
  Text,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { STEP_INDICATOR, STEP_LINE } from '@/modules/design-system/drawers/components/drawer-styles'
import { plural } from '@/modules/design-system/patrones/formato'
import { useGrupos } from './grupos-datos'
import { ListaCatalogo, pasaElTope, type Enfoque } from './panel-catalogo'
import { ListaParticipantes, SIN_SELECCION, itemsEnArchivo, resolverParticipantes, seleccionDe, type SeleccionParticipantes } from './panel-participantes'
import { ALCANCES, MAXIMO_COMPETENCIAS, PERSONAS_EMPRESA, TIPOS, type Alcance, type Asignacion, type TipoPlan } from './planes-datos'

// «Agregar asignación», el mismo recorrido de UBITS. Los pasos dependen del tipo de asignación, como allá:
// - por colaborador o por grupo: Tipo de asignación → Participantes → Contenido;
// - toda la empresa: Tipo de asignación → Contenido (no hay a quién elegir);
// - importar participantes: Tipo de asignación → Cargar archivo (el archivo ya dice a quién y qué).
// En UBITS es una capa a pantalla completa; aquí es el panel lateral del sistema en su tamaño más ancho, para que las
// listas de usuarios y de contenidos quepan como tabla. Con `inicial` se edita una asignación ya agregada: abre en el
// segundo paso con todo marcado (el «Editar» de «Nuevas asignaciones» en UBITS).

export const ICONO_ALCANCE: Record<Alcance, typeof UserGroupIcon> = {
  empresa: Building03Icon,
  colaboradores: UserMultiple02Icon,
  grupos: UserGroupIcon,
  archivo: Csv01Icon,
}

type Paso = 'tipo' | 'participantes' | 'contenido' | 'archivo'

// Sin tipo elegido solo existe el primer paso; los demás aparecen al elegirlo (así lo hace UBITS).
const pasosDe = (alcance: Alcance | null): Paso[] =>
  alcance === null ? ['tipo'] : alcance === 'empresa' ? ['tipo', 'contenido'] : alcance === 'archivo' ? ['tipo', 'archivo'] : ['tipo', 'participantes', 'contenido']

export function AgregarAsignacion({
  abierto,
  onAbiertoChange,
  tipo,
  yaAsignados,
  inicial,
  onAgregar,
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  tipo: TipoPlan
  // Quienes ya tienen el plan (sin contar la asignación que se edita): el paso de colaboradores no los vuelve a ofrecer.
  yaAsignados: string[]
  inicial?: Asignacion
  onAgregar: (asignacion: Asignacion) => void
}) {
  const grupos = useGrupos()
  const textos = TIPOS[tipo]
  const competencias = tipo === 'competencias'
  const [alcance, setAlcance] = useState<Alcance | null>(inicial?.alcance ?? null)
  const [paso, setPaso] = useState(inicial ? 2 : 1)
  const [seleccion, setSeleccion] = useState<SeleccionParticipantes>(() => (inicial ? seleccionDe(inicial, grupos) : SIN_SELECCION))
  const [items, setItems] = useState<string[]>(inicial && inicial.alcance !== 'archivo' ? inicial.items : [])
  // En competencias: en qué habilidades se enfoca cada una (sin entrada = todas).
  const [enfoque, setEnfoque] = useState<Enfoque>(inicial?.habilidades ?? {})

  const pasos = pasosDe(alcance)
  const actual = pasos[paso - 1]
  const ultimo = paso === pasos.length
  const participantes = alcance ? resolverParticipantes(alcance, seleccion, grupos, PERSONAS_EMPRESA) : null
  const elegidos = alcance === 'archivo' ? (participantes ? itemsEnArchivo(tipo) : []) : items
  const listo = (id: Paso) => (id === 'tipo' ? alcance !== null : id === 'contenido' ? items.length > 0 && !pasaElTope(tipo, items) : participantes !== null)
  const puedeSeguir = listo(actual)
  // Se puede saltar a un paso si todos los anteriores ya están resueltos: volver siempre, adelantar solo con lo elegido.
  const alcanzable = (numero: number) => pasos.slice(0, numero - 1).every(listo)

  const TITULO: Record<Paso, string> = {
    tipo: 'Tipo de asignación',
    participantes: 'Participantes',
    contenido: competencias ? 'Competencias' : 'Contenido',
    archivo: 'Cargar archivo',
  }

  const agregar = () => {
    if (!participantes) return
    // Solo el enfoque de las competencias que quedaron elegidas.
    const habilidades = Object.fromEntries(Object.entries(enfoque).filter(([titulo]) => elegidos.includes(titulo)))
    onAgregar({ id: inicial?.id ?? `a-${Date.now()}`, ...participantes, items: elegidos, ...(Object.keys(habilidades).length ? { habilidades } : {}) })
    onAbiertoChange(false)
  }

  const resumen = participantes
    ? `${participantes.personas.toLocaleString('es-CO')} ${plural(participantes.personas, 'persona', 'personas')}${
        elegidos.length
          ? ` · ${competencias ? `${elegidos.length} de ${MAXIMO_COMPETENCIAS} competencias` : `${elegidos.length} ${plural(elegidos.length, 'contenido', 'contenidos')}`}`
          : ''
      }`
    : alcance === null
      ? 'Elige el tipo de asignación'
      : `Paso ${paso} de ${pasos.length}`

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="xl"
      icon={inicial ? Edit02Icon : UserAdd01Icon}
      title={inicial ? 'Editar asignación' : 'Agregar asignación'}
      description={`A quién le llega el plan y con qué ${textos.items}.`}
      headerExtra={
        <div className="border-b px-5 py-3">
          <Stepper value={paso} onValueChange={(valor) => alcanzable(valor) && setPaso(valor)} indicators={{ completed: <HugeiconsIcon icon={Tick02Icon} className="size-3.5" /> }}>
            <StepperNav className="w-full">
              {pasos.map((id, indice) => (
                <StepperItem key={id} step={indice + 1} completed={paso > indice + 1} className="flex-1 last:flex-none">
                  <StepperTrigger className="gap-2" aria-controls={undefined} tabIndex={indice + 1 !== paso && alcanzable(indice + 1) ? 0 : -1}>
                    <StepperIndicator className={STEP_INDICATOR}>{indice + 1}</StepperIndicator>
                    <StepperTitle className="text-sm whitespace-nowrap">{TITULO[id]}</StepperTitle>
                  </StepperTrigger>
                  {indice < pasos.length - 1 ? <StepperSeparator className={`mx-3 flex-1 ${STEP_LINE}`} /> : null}
                </StepperItem>
              ))}
            </StepperNav>
          </Stepper>
        </div>
      }
      footerClassName="justify-between!"
      footer={
        <>
          <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
            {resumen}
          </Text>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => (paso > 1 ? setPaso(paso - 1) : onAbiertoChange(false))}>
              {paso > 1 ? 'Atrás' : 'Cancelar'}
            </Button>
            <Button disabled={!puedeSeguir} onClick={() => (ultimo ? agregar() : setPaso(paso + 1))}>
              {!ultimo ? 'Siguiente' : inicial ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </div>
        </>
      }
    >
      {actual === 'tipo' ? (
        <RadioGroup
          value={alcance ?? ''}
          onValueChange={(valor) => {
            setAlcance(valor as Alcance)
            setSeleccion(SIN_SELECCION)
          }}
          className="grid gap-3 sm:grid-cols-2"
          aria-label="Tipo de asignación"
        >
          {ALCANCES.map((opcion) => (
            <FieldLabel key={opcion.id} htmlFor={`alcance-${opcion.id}`}>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>
                    <HugeiconsIcon icon={ICONO_ALCANCE[opcion.id]} size={16} aria-hidden="true" />
                    {opcion.titulo}
                  </FieldTitle>
                  <FieldDescription>{opcion.detalle}</FieldDescription>
                </FieldContent>
                <RadioGroupItem value={opcion.id} id={`alcance-${opcion.id}`} />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      ) : null}

      {(actual === 'participantes' || actual === 'archivo') && alcance && alcance !== 'empresa' ? (
        <ListaParticipantes modo={alcance} tipo={tipo} valor={seleccion} onCambio={setSeleccion} yaAsignados={yaAsignados} />
      ) : null}

      {actual === 'contenido' ? <ListaCatalogo tipo={tipo} marcados={items} onCambio={setItems} enfoque={enfoque} onEnfoque={setEnfoque} /> : null}
    </DrawerShell>
  )
}
