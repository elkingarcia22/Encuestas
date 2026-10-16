import { useState } from 'react'
import { FilterHorizontalIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  Label,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Slider,
  Switch,
} from '@ubits/flux-ui'
import { notify } from '@/shared/components/notify'
import { DrawerShell } from './drawer-shell'
import { KICKER, WS } from './drawer-styles'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const STAGES = [
  { value: 'publicada', label: 'Publicada', count: 12 },
  { value: 'filtro', label: 'Filtro inicial', count: 18 },
  { value: 'entrevistas', label: 'Entrevistas', count: 9 },
  { value: 'oferta', label: 'Oferta', count: 4 },
]

const AGES = [
  { value: 'todas', label: 'Cualquiera' },
  { value: '15', label: 'Menos de 15 días' },
  { value: '30', label: 'Entre 15 y 30 días' },
  { value: 'mas', label: 'Más de 30 días' },
]

const OWNERS = [
  { value: 'todos', label: 'Todos los responsables' },
  { value: 'laura', label: 'Laura M.' },
  { value: 'andres', label: 'Andrés P.' },
  { value: 'sara', label: 'Sara G.' },
]

const DEFAULTS = { stages: ['publicada', 'filtro', 'entrevistas', 'oferta'], age: 'todas', salary: [3, 9], owner: 'todos', test: false }

// Caso: filtrar una lista sin taparla del todo. El botón del pie dice cuántos resultados quedan.
export function FiltersDrawer({ open, onOpenChange }: Props) {
  const [stages, setStages] = useState(DEFAULTS.stages)
  const [age, setAge] = useState(DEFAULTS.age)
  const [salary, setSalary] = useState(DEFAULTS.salary)
  const [owner, setOwner] = useState(DEFAULTS.owner)
  const [test, setTest] = useState(DEFAULTS.test)

  const results = Math.max(
    0,
    STAGES.filter((s) => stages.includes(s.value)).reduce((n, s) => n + s.count, 0) -
      (age === 'todas' ? 0 : 7) -
      (owner === 'todos' ? 0 : 11) -
      (test ? 6 : 0) -
      Math.round((salary[0] - 1) + (15 - salary[1]) / 2),
  )

  const reset = () => {
    setStages(DEFAULTS.stages)
    setAge(DEFAULTS.age)
    setSalary(DEFAULTS.salary)
    setOwner(DEFAULTS.owner)
    setTest(DEFAULTS.test)
  }

  return (
    <DrawerShell
      open={open}
      onOpenChange={onOpenChange}
      size="sm"
      icon={FilterHorizontalIcon}
      title="Filtros de vacantes"
      description="Combina criterios; la lista se actualiza al aplicar."
      footer={
        <>
          <Button variant="ghost" className={`mr-auto ${WS}`} onClick={reset}>
            Limpiar
          </Button>
          <Button
            className={WS}
            disabled={results === 0}
            onClick={() => {
              notify(`Mostrando ${results} vacantes`)
              onOpenChange(false)
            }}
          >
            Ver {results} resultados
          </Button>
        </>
      }
    >
      <section>
        <div id="filters-stage" className={KICKER}>
          Etapa
        </div>
        <div role="group" aria-labelledby="filters-stage" className="mt-3 flex flex-col gap-3">
          {STAGES.map((stage) => (
            <Label key={stage.value} className="flex items-center gap-2.5 font-normal">
              <Checkbox
                checked={stages.includes(stage.value)}
                onCheckedChange={(checked) =>
                  setStages((all) => (checked ? [...all, stage.value] : all.filter((v) => v !== stage.value)))
                }
              />
              <span className="flex-1">{stage.label}</span>
              <span className="text-xs text-muted-foreground tabular-nums">{stage.count}</span>
            </Label>
          ))}
        </div>
      </section>

      <Separator className="my-5" />

      <section>
        <div id="filters-age" className={KICKER}>
          Tiempo abierta
        </div>
        <RadioGroup aria-labelledby="filters-age" value={age} onValueChange={(value) => setAge(value as string)} className="mt-3 gap-3">
          {AGES.map((option) => (
            <Label key={option.value} className="flex items-center gap-2.5 font-normal">
              <RadioGroupItem value={option.value} />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
      </section>

      <Separator className="my-5" />

      <section>
        <div className="flex items-center justify-between">
          <div id="filters-salary" className={KICKER}>
            Salario (millones COP)
          </div>
          <span className="text-sm tabular-nums">
            {salary[0]} – {salary[1]}
          </span>
        </div>
        <Slider
          value={salary}
          onValueChange={(value) => setSalary(value as number[])}
          min={1}
          max={15}
          step={0.5}
          className="mt-4"
          // En la raíz y no con aria-label: así el nombre llega también a los dos tiradores del rango.
          aria-labelledby="filters-salary"
        />
      </section>

      <Separator className="my-5" />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div id="filters-owner" className={KICKER}>
            Responsable
          </div>
          <Select value={owner} onValueChange={(value) => setOwner(value as string)} items={OWNERS}>
            <SelectTrigger className="w-full" aria-labelledby="filters-owner">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {OWNERS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Label className="flex items-center justify-between gap-3 font-normal">
          Solo con prueba técnica
          <Switch checked={test} onCheckedChange={setTest} />
        </Label>
      </section>
    </DrawerShell>
  )
}
