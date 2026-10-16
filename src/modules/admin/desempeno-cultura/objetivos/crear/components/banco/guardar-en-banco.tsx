import { useState, type JSX } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, BookmarkAdd02Icon, PlusSignIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Input,
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { Hint } from '@/shared/components/Hint'
import { notify } from '@/shared/components/notify'
import { AMBITION_META, AMBITION_ORDER, type AmbitionLevel } from '../../../modelo/constructor/aiObjectiveGenerator'
import { formatRawValue, type Objective } from '../../../modelo/constructor/cicloBuilderTypes'
import { addObjectiveToBank, useObjectiveBankLibrary } from '../../../modelo/constructor/objectiveBankLibrary'
import { OBJECTIVE_SCOPE_META, type ObjectiveScope } from '../../../modelo/constructor/objectiveBankTypes'

// «Guardar objetivo en el banco»: elegir el área y el tema donde queda (o crear un tema nuevo) y en qué nivel están
// las cifras que trae la tarjeta, porque el banco guarda una sola meta de referencia y estira desde ahí las otras dos.
// Se guarda en el navegador con objectiveBankLibrary y lo ven al momento todos los bancos abiertos. A diferencia del
// prototipo, al guardar se avisa con un toast.

const TEMA_NUEVO = '__tema-nuevo__'

function useFormulario({ objetivo, alcance, onCerrar }: { objetivo: Objective; alcance: ObjectiveScope; onCerrar: () => void }) {
  const areas = useObjectiveBankLibrary()
  const [areaId, setAreaId] = useState(areas[0]?.id ?? '')
  const area = areas.find((entrada) => entrada.id === areaId) ?? areas[0]
  const [tema, setTema] = useState<string>(area?.themes[0]?.id ?? TEMA_NUEVO)
  const [temaNuevo, setTemaNuevo] = useState('')
  const [nivel, setNivel] = useState<AmbitionLevel>('retador')

  const esNuevo = tema === TEMA_NUEVO
  const sePuede = esNuevo ? temaNuevo.trim() !== '' : tema !== ''
  const booleano = objetivo.measure === 'boolean'
  const desde = formatRawValue(objetivo.initialValue, objetivo.measure)
  const hasta = formatRawValue(objetivo.targetValue, objetivo.measure)

  const opcionesArea = areas.map((entrada) => ({ value: entrada.id, label: entrada.name }))
  const opcionesTema = [...(area?.themes ?? []).map((entrada) => ({ value: entrada.id, label: entrada.name })), { value: TEMA_NUEVO, label: 'Crear tema nuevo' }]

  const cambiarArea = (valor: string) => {
    setAreaId(valor)
    setTema(areas.find((entrada) => entrada.id === valor)?.themes[0]?.id ?? TEMA_NUEVO)
    setTemaNuevo('')
  }

  const guardar = () => {
    if (!sePuede) return
    const guardado = addObjectiveToBank({
      areaId,
      themeId: esNuevo ? undefined : tema,
      newThemeName: esNuevo ? temaNuevo.trim() : undefined,
      ambition: nivel,
      objective: {
        scope: alcance,
        title: objetivo.title,
        description: objetivo.description,
        measure: objetivo.measure ?? 'numeric',
        direction: objetivo.direction,
        initialValue: objetivo.initialValue,
        targetValue: objetivo.targetValue,
      },
    })
    if (guardado) {
      const destino = esNuevo ? temaNuevo.trim() : (opcionesTema.find((opcion) => opcion.value === tema)?.label ?? '')
      notify('Objetivo guardado en el banco', `Quedó en ${area?.name ?? ''} · ${destino}.`)
    }
    onCerrar()
  }

  return { sePuede, guardar, cuerpo: (
    <Frame>
      <FrameHeader>
        <FrameTitle>Datos del objetivo</FrameTitle>
        <FrameDescription>Se guarda para {OBJECTIVE_SCOPE_META[alcance].label.toLowerCase()}, en el área y tema que elijas.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <FieldGroup>
          <Item variant="muted" size="sm">
            <ItemContent>
              <ItemTitle>{objetivo.title.trim() || 'Sin título'}</ItemTitle>
              {!booleano && desde && hasta ? (
                <ItemDescription className="flex items-center gap-1 tabular-nums">
                  {desde}
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} aria-hidden="true" />
                  {hasta}
                </ItemDescription>
              ) : null}
            </ItemContent>
          </Item>

          <Field>
            <FieldLabel htmlFor="banco-guardar-area">Área</FieldLabel>
            <Select value={areaId} onValueChange={(valor) => cambiarArea(valor as string)} items={opcionesArea}>
              <SelectTrigger id="banco-guardar-area" className="w-full bg-background!">
                <SelectValue placeholder="Selecciona el área" />
              </SelectTrigger>
              <SelectContent>
                {opcionesArea.map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="banco-guardar-tema">Tema</FieldLabel>
            <Select value={tema} onValueChange={(valor) => setTema(valor as string)} items={opcionesTema}>
              <SelectTrigger id="banco-guardar-tema" className="w-full bg-background!">
                <SelectValue placeholder="Selecciona el tema" />
              </SelectTrigger>
              <SelectContent>
                {opcionesTema.slice(0, -1).map((opcion) => (
                  <SelectItem key={opcion.value} value={opcion.value}>
                    {opcion.label}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem value={TEMA_NUEVO}>
                  <HugeiconsIcon icon={PlusSignIcon} aria-hidden="true" />
                  Crear tema nuevo
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {esNuevo ? (
            <Field>
              <FieldLabel htmlFor="banco-guardar-tema-nuevo">Nombre del tema nuevo</FieldLabel>
              <Input id="banco-guardar-tema-nuevo" className="bg-background!" value={temaNuevo} placeholder="Escribe el nombre del tema" autoFocus onChange={(evento) => setTemaNuevo(evento.target.value)} />
            </Field>
          ) : null}

          {booleano ? null : (
            <Field>
              <FieldTitle>Nivel de la meta que estás guardando</FieldTitle>
              <ToggleGroup aria-label="Nivel de la meta" value={[nivel]} onValueChange={(valor) => valor.length && setNivel(valor[0] as AmbitionLevel)} variant="outline" size="sm" spacing={0}>
                {AMBITION_ORDER.map((opcion) => (
                  <Hint key={opcion} label={AMBITION_META[opcion].headline}>
                    <ToggleGroupItem value={opcion} className="px-3">
                      {AMBITION_META[opcion].label}
                    </ToggleGroupItem>
                  </Hint>
                ))}
              </ToggleGroup>
              <FieldDescription>Las otras dos metas se calculan a partir de esta cuando alguien lo elija del banco.</FieldDescription>
            </Field>
          )}
        </FieldGroup>
      </FramePanel>
    </Frame>
  ) }
}

function DrawerGuardar({ objetivo, alcance, abierto, onAbiertoChange }: GuardarEnBancoProps) {
  const cerrar = () => onAbiertoChange(false)
  const { sePuede, guardar, cuerpo } = useFormulario({ objetivo, alcance, onCerrar: cerrar })
  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="md"
      icon={BookmarkAdd02Icon}
      title="Guardar objetivo en el banco"
      description="Elige en qué área y tema del banco queda este objetivo."
      footer={
        <>
          <Button variant="outline" onClick={cerrar}>
            Cancelar
          </Button>
          <Button disabled={!sePuede} onClick={guardar}>
            Guardar en el banco
          </Button>
        </>
      }
    >
      {cuerpo}
    </DrawerShell>
  )
}

export interface GuardarEnBancoProps {
  objetivo: Objective
  alcance: ObjectiveScope
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
}

export function GuardarEnBanco(props: GuardarEnBancoProps): JSX.Element {
  // Cada apertura empieza de cero (área, tema y nivel por defecto).
  const [sesion, setSesion] = useState({ abierto: props.abierto, cuenta: 0 })
  if (sesion.abierto !== props.abierto) setSesion({ abierto: props.abierto, cuenta: props.abierto ? sesion.cuenta + 1 : sesion.cuenta })
  return <DrawerGuardar key={sesion.cuenta} {...props} />
}
