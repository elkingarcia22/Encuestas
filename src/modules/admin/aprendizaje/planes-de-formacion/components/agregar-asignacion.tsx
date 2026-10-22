import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Building03Icon, Csv01Icon, UserGroupIcon, UserMultiple02Icon } from '@hugeicons/core-free-icons'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  RadioGroup,
  RadioGroupItem,
  Text,
} from '@ubits/flux-ui'
import { ChipGuardado } from '@/shared/components/ChipGuardado'
import { PageContent, PageHeader, PageShell } from '@/shared/components/PageShell'
import type { Crumb } from '@/shared/layouts/nav-config'
import { BotonSalirCreacion } from '@/modules/design-system/navegacion/boton-salir-creacion'
import { PasosFila } from '@/modules/design-system/navegacion/pasos-fila'
import { useFrenoAtras } from '@/modules/design-system/navegacion/subpagina-en-url'
import { plural } from '@/modules/design-system/patrones/formato'
import { useGrupos } from './grupos-datos'
import { ListaCatalogo, pasaElTope, type Enfoque } from './panel-catalogo'
import { ListaParticipantes, SIN_SELECCION, itemsEnArchivo, resolverParticipantes, seleccionDe, type SeleccionParticipantes } from './panel-participantes'
import { ALCANCES, MAXIMO_COMPETENCIAS, PERSONAS_EMPRESA, TIPOS, type Alcance, type Asignacion, type TipoPlan } from './planes-datos'
import { BarraPasos } from '@/modules/design-system/navegacion/barra-pasos'

// «Agregar asignación», el mismo recorrido de UBITS, en SU PROPIA PÁGINA (13-oct, regla «crear-en-pagina»: los asistentes
// por pasos ya no viven en un panel). Es la misma ruta del plan con `?asignacion=nueva` (o `?asignacion=<id>` para
// editar una): el formulario del plan sigue montado por debajo y cede su lugar, así que el nombre, las fechas y las otras
// asignaciones siguen ahí al volver. Los pasos dependen del tipo de asignación, como allá:
// - por colaborador o por grupo: Tipo de asignación → Participantes → Contenido;
// - toda la empresa: Tipo de asignación → Contenido (no hay a quién elegir);
// - importar participantes: Tipo de asignación → Cargar archivo (el archivo ya dice a quién y qué).
// Con `inicial` se edita una asignación ya agregada: abre en el segundo paso con todo marcado (el «Editar» de «Nuevas
// asignaciones» en UBITS). Lo que se elige es local hasta «Agregar»: salir con algo elegido pregunta antes.

export const PARAM_ASIGNACION = 'asignacion'

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
  tipo,
  migas,
  yaAsignados,
  inicial,
  onAgregar,
  onVolver,
}: {
  tipo: TipoPlan
  // Las migas hasta el plan que se está creando o editando; la última (esta página) la pone la pantalla.
  migas: Crumb[]
  // Quienes ya tienen el plan (sin contar la asignación que se edita): el paso de colaboradores no los vuelve a ofrecer.
  yaAsignados: string[]
  inicial?: Asignacion
  onAgregar: (asignacion: Asignacion) => void
  // Volver al plan (sin agregar). Lo de «Agregar» también termina aquí.
  onVolver: () => void
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

  const resumen = participantes
    ? `${participantes.personas.toLocaleString('es-CO')} ${plural(participantes.personas, 'persona', 'personas')}${
        elegidos.length
          ? ` · ${competencias ? `${elegidos.length} de ${MAXIMO_COMPETENCIAS} competencias` : `${elegidos.length} ${plural(elegidos.length, 'contenido', 'contenidos')}`}`
          : ''
      }`
    : alcance === null
      ? 'Elige el tipo de asignación'
      : `Paso ${paso} de ${pasos.length}`

  // Hay algo elegido que no estaba al abrir: salir (o «Atrás» del navegador) pregunta antes de tirarlo.
  const instantanea = JSON.stringify({ alcance, seleccion, items, enfoque })
  const [alAbrir] = useState(instantanea)
  const hayCambios = instantanea !== alAbrir
  const freno = useFrenoAtras({ param: PARAM_ASIGNACION, activo: hayCambios, texto: 'Volver al plan' })
  const volver = () => {
    freno.liberar()
    onVolver()
  }

  const agregar = () => {
    if (!participantes) return
    // Solo el enfoque de las competencias que quedaron elegidas.
    const habilidades = Object.fromEntries(Object.entries(enfoque).filter(([titulo]) => elegidos.includes(titulo)))
    onAgregar({ id: inicial?.id ?? `a-${Date.now()}`, ...participantes, items: elegidos, ...(Object.keys(habilidades).length ? { habilidades } : {}) })
    volver()
  }

  return (
    <PageShell>
      <PageHeader
        breadcrumbs={[...migas, { label: inicial ? 'Editar asignación' : 'Agregar asignación' }]}
        title={inicial ? 'Editar asignación' : 'Agregar asignación'}
        description={`A quién le llega el plan y con qué ${textos.items}.`}
        actions={<BotonSalirCreacion texto="Volver al plan" onClick={volver} salida={{ conCambios: hayCambios }} />}
      />

      <PageContent>
        <PasosFila
          pasos={pasos.map((id) => ({ id, titulo: TITULO[id] }))}
          paso={actual}
          completos={new Set(pasos.filter((id, indice) => indice + 1 < paso && listo(id)))}
          bloqueados={new Set(pasos.filter((_, indice) => !alcanzable(indice + 1)))}
          onPaso={(id) => {
            const numero = pasos.indexOf(id as Paso) + 1
            if (alcanzable(numero)) setPaso(numero)
          }}
        />

        {actual === 'tipo' ? (
          <Frame>
            <FrameHeader>
              <FrameTitle>Tipo de asignación</FrameTitle>
              <FrameDescription>Elige a quién le llega el plan.</FrameDescription>
            </FrameHeader>
            <FramePanel>
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
            </FramePanel>
          </Frame>
        ) : null}

        {/* Las listas traen su propio marco (título, buscador, filtros y «Seleccionados»): aquí no se envuelven en otro. */}
        {(actual === 'participantes' || actual === 'archivo') && alcance && alcance !== 'empresa' ? (
          <ListaParticipantes modo={alcance} tipo={tipo} valor={seleccion} onCambio={setSeleccion} yaAsignados={yaAsignados} />
        ) : null}

        {actual === 'contenido' ? <ListaCatalogo tipo={tipo} marcados={items} onCambio={setItems} enfoque={enfoque} onEnfoque={setEnfoque} /> : null}

        {/* La barra de abajo: a la izquierda, el estado y lo que va; a la derecha, «Atrás» y seguir. Sin «Cancelar»: se sale
            con «Volver al plan», arriba. */}
        <BarraPasos
          inicio={
            <>
              {hayCambios ? <ChipGuardado estado="editando" /> : null}
              <Text as="span" role="status" variant="muted" size="sm" className="tabular-nums">
                {resumen}
              </Text>
            </>
          }
          paso={paso}
          onAtras={() => setPaso(paso - 1)}
          principal={{
            texto: !ultimo ? undefined : inicial ? 'Guardar cambios' : 'Agregar',
            deshabilitado: !puedeSeguir,
            onClick: () => (ultimo ? agregar() : setPaso(paso + 1)),
          }}
        />
      </PageContent>

      {freno.dialogo}
    </PageShell>
  )
}
