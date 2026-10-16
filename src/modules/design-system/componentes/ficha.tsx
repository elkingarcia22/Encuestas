import type { ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, CheckmarkCircle02Icon, Cancel01Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { PantallaDeError } from '../estados/errores-sistema'
import { registroQueNoExiste } from '../estados/errores-sistema-datos'
import { ESTADO_AJUSTE, ajusteDe } from '../ajustes/main'
import { EncabezadoPatron } from '../patrones/piezas'
import { piezasDeFicha, storybookDe } from './inventario-datos'

// Componentes › una ficha (7-oct): la pieza del equipo frente al componente de flux del que parte, las dos en vivo, y
// debajo qué cambió, por qué, cuándo usarla y dónde. Lee el ajuste documentado (ajustes/main.tsx y los de cada módulo),
// así que toda pieza documentada tiene ficha y lo que se edite en el ajuste se ve aquí.

function Dato({ termino, children }: { termino: string; children: ReactNode }) {
  return (
    <Item size="xs">
      <ItemContent>
        <ItemDescription>{termino}</ItemDescription>
        <ItemTitle className="flex-wrap">{children}</ItemTitle>
      </ItemContent>
    </Item>
  )
}

function ListaConFlecha({ items }: { items: string[] }) {
  return (
    <ItemGroup className="gap-1">
      {items.map((texto) => (
        <Item key={texto} size="xs">
          <ItemMedia>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <Text as="span" size="sm">
              {texto}
            </Text>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

export function Component() {
  const { id } = useParams()
  const navigate = useNavigate()
  const ajuste = ajusteDe(id)
  if (!ajuste) {
    return <PantallaDeError error={registroQueNoExiste('esta ficha', 'componentes')} onAccion={() => navigate('/design-system/componentes')} />
  }
  const estado = ESTADO_AJUSTE[ajuste.estado]
  const enCodigo = piezasDeFicha(ajuste.id)
  const base = ajuste.piezas.map((pieza) => pieza.nombre)

  return (
    <div className="flex flex-col gap-8">
      <EncabezadoPatron
        antetitulo="Design system · Componentes"
        titulo={ajuste.titulo}
        etiqueta={
          <Badge variant={estado.badge} title={estado.ayuda}>
            {estado.etiqueta}
          </Badge>
        }
        acciones={
          <Button variant="outline" nativeButton={false} render={<Link to="/design-system/componentes" />}>
            Ver todos los componentes
          </Button>
        }
      >
        {ajuste.resumen}
      </EncabezadoPatron>

      <Frame>
        <FrameHeader>
          <FrameTitle>La pieza</FrameTitle>
          <FrameDescription>De qué componentes de flux parte y cómo se llama en el código.</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <ItemGroup className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
            <Dato termino="Hecha con (flux)">
              {base.length
                ? base.map((nombre) => {
                    const url = storybookDe(nombre)
                    return url ? (
                      <Button
                        key={nombre}
                        variant="link"
                        size="sm"
                        nativeButton={false}
                        render={<a href={url} target="_blank" rel="noreferrer" />}
                        className="h-auto! p-0!"
                      >
                        {nombre}
                        <HugeiconsIcon icon={LinkSquare02Icon} size={14} aria-hidden="true" />
                      </Button>
                    ) : (
                      <span key={nombre}>{nombre}</span>
                    )
                  })
                : 'Nada de la librería'}
            </Dato>
            <Dato termino="En el código">{enCodigo.length ? enCodigo.map((p) => p.pieza).join(' · ') : 'Dentro del marco o de su pantalla'}</Dato>
            {enCodigo[0]?.archivo ? <Dato termino="Archivo">{enCodigo[0].archivo}</Dato> : null}
            {ajuste.hechoAMano ? <Dato termino="Lo que no sale de flux">{ajuste.hechoAMano}</Dato> : null}
          </ItemGroup>
        </FramePanel>
      </Frame>

      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Frame className="h-full">
          <FrameHeader>
            <FrameTitle>Así viene en flux</FrameTitle>
            <FrameDescription>Tal como lo trae la librería.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-1 items-center justify-center py-8">{ajuste.libreria}</FramePanel>
        </Frame>
        <Frame className="h-full">
          <FrameHeader>
            <FrameTitle>Así se customizó</FrameTitle>
            <FrameDescription>La pieza que usa el producto.</FrameDescription>
          </FrameHeader>
          <FramePanel className="flex flex-1 items-center justify-center py-8">{ajuste.ubits}</FramePanel>
        </Frame>
      </div>

      <Frame>
        <FrameHeader>
          <FrameTitle>Qué cambió</FrameTitle>
          <FrameDescription>{ajuste.porque}</FrameDescription>
        </FrameHeader>
        <FramePanel>
          <ListaConFlecha items={ajuste.cambia} />
        </FramePanel>
      </Frame>

      <div className="grid gap-4 md:grid-cols-2">
        <Frame className="h-full">
          <FrameHeader>
            <FrameTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={18} aria-hidden="true" />
              Úsala para
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="flex-1">
            <Text size="sm">{ajuste.usar}</Text>
          </FramePanel>
        </Frame>
        <Frame className="h-full">
          <FrameHeader>
            <FrameTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={Cancel01Icon} size={18} aria-hidden="true" />
              No la uses para
            </FrameTitle>
          </FrameHeader>
          <FramePanel className="flex-1">
            <Text size="sm">{ajuste.evitar}</Text>
          </FramePanel>
        </Frame>
      </div>

      <Frame>
        <FrameHeader>
          <FrameTitle>Dónde vive</FrameTitle>
        </FrameHeader>
        <FramePanel>
          <ListaConFlecha items={ajuste.donde} />
        </FramePanel>
      </Frame>
    </div>
  )
}

Component.displayName = 'DesignSystemFichaComponente'
