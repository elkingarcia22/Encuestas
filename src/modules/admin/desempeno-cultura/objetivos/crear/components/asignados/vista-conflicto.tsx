import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Alert02Icon, ArrowLeft01Icon, CheckmarkCircle02Icon, GitForkIcon, UserGroupIcon, UserIcon } from '@hugeicons/core-free-icons'
import {
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { Hint } from '@/shared/components/Hint'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { TOTAL_WEIGHT } from '../../../modelo/constructor/cicloBuilderTypes'
import type { ConflictGroup, LoadSource } from '../../../modelo/constructor/weightConflicts'
import type { WeightSharesController } from '../../../modelo/constructor/weightShares'

// «Repartir el peso del ciclo»: cuando a alguien le llegan objetivos por dos asignaciones a la vez, entre todas tienen
// que sumar su 100 %. No es una ventana encima: es una página más, del paso o del panel de asignación, a la que se
// entra con «Repartir el peso» y de la que se sale con «Volver». Se organiza por caso, no por persona: la gente que
// comparte las mismas vías comparte un solo reparto, así que hay una tarjeta por combinación. Junto a una vía grupal
// que comparten muchos, la salida barata: «Sacarla de aquí» (solo cuando el caso es de una persona).
// El volver es «← Volver», flecha y palabra (regla «panel-volver-arriba», 13-oct): en el panel lo pone DrawerShell con
// onVolver; en el paso, esta vista lo pinta arriba cuando recibe `onVolver`.

export function VistaConflicto({
  control,
  afectadas,
  onVolver,
  onSacar,
}: {
  control: WeightSharesController
  /** Cuánta gente está en esto: lo dice la cabecera. */
  afectadas: number
  /** Solo en el paso: dentro del panel el «← Volver» lo pone DrawerShell. */
  onVolver?: () => void
  /** Saca a esta persona de esa asignación grupal sin tocar al resto del grupo. */
  onSacar?: (setId: string, personId: string) => void
}) {
  return (
    <section className="flex flex-col gap-4" aria-label="Repartir el peso del ciclo">
      {onVolver ? (
        <div>
          <Button variant="ghost" size="sm" onClick={onVolver}>
            <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
            Volver
          </Button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <Heading as="h3" level={6}>
              Repartir el peso del ciclo
            </Heading>
            <Text size="sm" variant="muted">
              Los objetivos de una persona reparten {TOTAL_WEIGHT} % entre todos, y {afectadas === 1 ? 'esta persona los recibe' : `estas ${afectadas} personas los reciben`} por más de una
              asignación.
            </Text>
          </div>
        </div>
        <Badge variant={control.status.isDone ? 'success-light' : 'warning-light'} size="sm">
          <HugeiconsIcon icon={control.status.isDone ? CheckmarkCircle02Icon : Alert02Icon} aria-hidden="true" />
          {control.status.text}
        </Badge>
      </div>

      {control.groups.length === 0 ? (
        <PrimeraVez icono="glass-tick" titulo="Ya nadie recibe objetivos por dos asignaciones a la vez." descripcion="Vuelve a la lista para seguir con las asignaciones." className="border" />
      ) : (
        control.groups.map((grupo) => <TarjetaCaso key={grupo.key} grupo={grupo} control={control} onSacar={onSacar} />)
      )}
    </section>
  )
}

function TarjetaCaso({ grupo, control, onSacar }: { grupo: ConflictGroup; control: WeightSharesController; onSacar?: (setId: string, personId: string) => void }) {
  const personas = grupo.people
  const una = personas.length === 1
  const nombres = personas.slice(0, 2).map((persona) => persona.name)
  const resto = personas.length - nombres.length
  const total = grupo.sources.reduce((suma, via) => suma + control.shareOf(via), 0)
  const cuadra = control.isBalanced(grupo)

  return (
    <Frame>
      {/* La cabecera en fila (título a la izquierda, insignia a la derecha): el tema de FrameHeader la apila y la clase
          sola no le gana (diferencias.json › instalacion-estilos-sin-capa). */}
      <FrameHeader className="flex-row! items-center! justify-between! gap-3!">
        <div className="flex min-w-0 flex-col">
          <FrameTitle className="truncate">{una ? personas[0].name : `${personas.length} personas`}</FrameTitle>
          <FrameDescription className="truncate">{una ? personas[0].area : `${nombres.join(', ')}${resto > 0 ? ` y ${resto} más` : ''}`}</FrameDescription>
        </div>
        <Badge variant={cuadra ? 'success-light' : 'warning-light'} size="sm" className="shrink-0 tabular-nums">
          <HugeiconsIcon icon={cuadra ? CheckmarkCircle02Icon : Alert02Icon} aria-hidden="true" />
          {total} de {TOTAL_WEIGHT} % de peso
        </Badge>
      </FrameHeader>
      <FramePanel>
        {/* Filas pegadas, separadas por ItemSeparator (regla caja-o-divisor): el gap del tema de ItemGroup no se quita sin
            «!» (diferencias.json › instalacion-estilos-sin-capa). */}
        <ItemGroup className="gap-0!">
          {grupo.sources.map((via, indice) => (
            <div key={via.setId}>
              {indice > 0 ? <ItemSeparator /> : null}
              <FilaVía via={via} valor={control.shareOf(via)} onValor={(valor) => control.setShare(via.setId, valor)} persona={una ? personas[0] : null} onSacar={onSacar} />
            </div>
          ))}
        </ItemGroup>
      </FramePanel>
    </Frame>
  )
}

function FilaVía({
  via,
  valor,
  onValor,
  persona,
  onSacar,
}: {
  via: LoadSource
  valor: number
  onValor: (valor: number) => void
  persona: { personId: string; name: string } | null
  onSacar?: (setId: string, personId: string) => void
}) {
  const vacia = valor === 0
  const detalle = vacia
    ? 'Sin peso: sus objetivos no contarían para nadie'
    : `${via.objectiveCount} ${via.objectiveCount === 1 ? 'objetivo' : 'objetivos'}${via.sharedWith > 0 ? ` · el mismo peso para ${via.sharedWith} ${via.sharedWith === 1 ? 'persona más' : 'personas más'}` : ''}`
  // Bajarle el peso a una asignación que comparten cientos por culpa de una sola persona es caro: la salida barata va al lado.
  const puedeSacar = onSacar && persona && via.kind === 'grupal' && via.sharedWith > 0

  return (
    <Item size="sm" className="gap-3">
      <ItemMedia variant="icon">
        <HugeiconsIcon icon={via.kind === 'grupal' ? UserGroupIcon : UserIcon} aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle className="truncate">{via.label}</ItemTitle>
        <ItemDescription className={vacia ? 'text-warning' : undefined}>{detalle}</ItemDescription>
      </ItemContent>
      <ItemActions>
        {puedeSacar ? (
          <Hint label={`Saca a ${persona.name} de esta asignación sin cambiarle el peso a las otras ${via.sharedWith} personas`}>
            <Button variant="outline" size="sm" onClick={() => onSacar(via.setId, persona.personId)}>
              <HugeiconsIcon icon={GitForkIcon} aria-hidden="true" />
              Sacarla de aquí
            </Button>
          </Hint>
        ) : null}
        <CampoCupo valor={valor} onValor={onValor} etiqueta={`Peso de ${via.label}`} />
      </ItemActions>
    </Item>
  )
}

function CampoCupo({ valor, onValor, etiqueta }: { valor: number; onValor: (valor: number) => void; etiqueta: string }) {
  const [texto, setTexto] = useState({ texto: String(valor), de: valor })
  const visible = texto.de === valor ? texto.texto : String(valor)
  const confirmar = () => {
    const leido = Number.parseInt(visible, 10)
    const siguiente = Number.isNaN(leido) ? 0 : Math.max(0, Math.min(TOTAL_WEIGHT, leido))
    setTexto({ texto: String(siguiente), de: siguiente })
    onValor(siguiente)
  }
  return (
    <div className="w-24">
      <InputGroup>
        <InputGroupInput
          inputMode="numeric"
          className="text-end tabular-nums"
          aria-label={etiqueta}
          aria-invalid={valor === 0 || undefined}
          value={visible}
          onChange={(evento) => setTexto({ texto: evento.target.value.replace(/[^0-9]/g, ''), de: valor })}
          onBlur={confirmar}
          onKeyDown={(evento) => {
            if (evento.key === 'Enter') evento.currentTarget.blur()
          }}
        />
        <InputGroupAddon align="inline-end">
          <InputGroupText>%</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

/** Las acciones del reparto: en el paso van al pie de la vista; en el panel, en su propio pie. */
// Sin «Volver» en el pie: la flecha de volver ya está arriba, junto al título (Elkin, 14-oct).
export function AccionesConflicto({ control, onAplicar }: { control: WeightSharesController; onAplicar: () => void }) {
  return (
    <>
      {control.groups.length > 0 ? (
        <Button variant="outline" onClick={control.autoAdjust}>
          Repartir por mí
        </Button>
      ) : null}
      <Button disabled={!control.canApply} onClick={onAplicar}>
        Aplicar pesos
      </Button>
    </>
  )
}
