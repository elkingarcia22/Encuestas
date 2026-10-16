import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { SinResultados } from '@/shared/components/SinResultados'
import { GRUPOS, PIEZAS_CUSTOM, type PiezaInventario } from './inventario-datos'

// Componentes › Customizados (7-oct): todo lo customizado en una sola lista, ordenada por grupos. «Así viene en flux» son
// los componentes de la librería tal cual (su documentación es el Storybook). «Así se customizó» son las piezas del
// equipo hechas con flux; cada fila dice para qué sirve, de qué está hecha, dónde se ve y, si la tiene, su ficha.

function FilaPieza({ pieza }: { pieza: PiezaInventario }) {
  return (
    <Item size="sm">
      <ItemContent className="gap-1.5">
        <ItemTitle className="flex-wrap">
          {pieza.nombre}
          {pieza.pieza ? (
            <Text as="span" variant="muted" size="xs" className="font-mono">
                {pieza.pieza}
            </Text>
          ) : null}        </ItemTitle>
        <ItemDescription>{pieza.necesidad}</ItemDescription>
        <span className="flex flex-wrap items-center gap-1">
          {pieza.hechaCon.length ? (
            pieza.hechaCon.map((nombre) => (
              <Badge key={nombre} variant="outline" size="sm">
                {nombre}
              </Badge>
            ))
          ) : (
            <Text as="span" variant="muted" size="xs">
              Propia, sin componente de flux
            </Text>
          )}
        </span>
      </ItemContent>
      <ItemActions>
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={pieza.verEn} />}>
          Ver en el DS
        </Button>
        {pieza.ficha ? (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link to={`/design-system/componentes/ficha/${pieza.ficha}`} />}>
            Ficha
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} aria-hidden="true" />
          </Button>
        ) : null}
      </ItemActions>
    </Item>
  )
}

// Componentes › Todos los componentes › Customizados: la lista por grupos. Cada fila abre su ficha cuando la tiene.
export function Customizados() {
  const [busqueda, setBusqueda] = useState('')

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const coinciden = q
      ? PIEZAS_CUSTOM.filter((p) => [p.nombre, p.pieza, p.necesidad, ...p.hechaCon].some((texto) => texto.toLowerCase().includes(q)))
      : PIEZAS_CUSTOM
    return GRUPOS.map((grupo) => ({
      ...grupo,
      piezas: coinciden.filter((p) => p.grupo === grupo.id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    })).filter((grupo) => grupo.piezas.length)
  }, [busqueda])

  return (
    <section className="flex flex-col gap-4">
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id="buscar-customizado"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, para qué sirve o componente de flux"
          aria-label="Buscar componente customizado"
        />
      </InputGroup>
      <nav aria-label="Grupos" className="flex flex-wrap gap-2">
        {grupos.map((grupo) => (
          <Button key={grupo.id} variant="outline" size="sm" nativeButton={false} render={<a href={`#grupo-${grupo.id}`} />}>
            {grupo.nombre}
            <Badge variant="secondary" size="sm">
              {grupo.piezas.length}
            </Badge>
          </Button>
        ))}
      </nav>

      {grupos.length ? (
        grupos.map((grupo) => (
          <Frame key={grupo.id} id={`grupo-${grupo.id}`} className="scroll-mt-6">
            <FrameHeader>
              <FrameTitle className="flex items-center gap-2">
                {grupo.nombre}
                <Badge variant="secondary" size="sm">
                  {grupo.piezas.length}
                </Badge>
              </FrameTitle>
              <FrameDescription>{grupo.detalle}</FrameDescription>
            </FrameHeader>
            <FramePanel className="p-0!">
              <ItemGroup className="gap-0! divide-y divide-border">
                {grupo.piezas.map((pieza) => (
                  <FilaPieza key={pieza.id} pieza={pieza} />
                ))}
              </ItemGroup>
            </FramePanel>
          </Frame>
        ))
      ) : (
        <SinResultados busqueda={busqueda} onLimpiar={() => setBusqueda('')} />
      )}
    </section>
  )
}