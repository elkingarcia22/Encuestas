import { useState, type ReactNode } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Heading,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
  Text,
} from '@ubits/flux-ui'
import { Badge } from '@/shared/components/Badge'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { IconoIA } from '@/modules/design-system/ia/icono-ia'
import { plural } from '@/modules/design-system/patrones/formato'
import { BloqueResumen, ListaDatos } from '../../../vacantes/crear/components/piezas-resumen'
import { claveDe, estadoInicio, useEstadoInicio } from './estado'
import { ListaAsuntos, MediaGrupo, TarjetaSugerencia as TarjetaSugerenciaComun } from '../../../propuestas/components/tablero-atencion'
import { etiquetaSugerencia, grupoDe, hechoDe, type Asunto, type Elemento, type Grupo } from './atencion'

// El panel lateral de un grupo del tablero, como el de Riesgos que Elkin armó en Encuestas: primero la lista de sus
// asuntos; al tocar uno se entra a su detalle (con la vuelta al grupo arriba): qué está pasando, con los datos que lo
// explican, y cómo resolverlo ahí mismo, con la acción de cada persona o vacante y la de todas a la vez. Lo resuelto
// queda marcado en la lista hasta cerrar el panel, y sale del tablero.

export type Manejadores = {
  // La acción de la fila (o de todas): escribir, reenviar, devolver al portal, abrir, terminar o revisar el lote.
  hacer: (asunto: Asunto, elementos: Elemento[]) => void
  // La segunda acción de la fila: abrir a la persona o la vacante, o dejarla así.
  otra: (asunto: Asunto, elemento: Elemento) => void
  abrir: (elemento: Elemento) => void
  // Las del pie de un asunto de una vacante, y el enlace a otra pantalla (Créditos).
  pie: (asunto: Asunto, que: 'abrir' | 'editar' | 'revisado' | 'enlace') => void
  aplicar: (asunto: Asunto) => void
  descartar: (asunto: Asunto) => void
  hechos: ReadonlySet<string>
}

function ListaElementos({ asunto, manejadores }: { asunto: Asunto; manejadores: Manejadores }) {
  const [visibles, setVisibles] = useState(8)
  const fila = asunto.fila
  const hecho = (elemento: Elemento) => manejadores.hechos.has(claveDe(asunto.id, elemento.id))
  const pendientes = asunto.elementos.filter((elemento) => !hecho(elemento))
  const mostrados = asunto.elementos.slice(0, visibles)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-8 items-center gap-3">
        <Text as="span" size="sm" variant="muted" className="min-w-0 flex-1 truncate">
          {pendientes.length === 0 ? 'Todo resuelto' : `${pendientes.length} por resolver`}
        </Text>
        {fila?.todas && pendientes.length > 1 ? (
          <Button size="sm" variant="outline" onClick={() => manejadores.hacer(asunto, pendientes)}>
            {fila.todas(pendientes.length)}
          </Button>
        ) : null}
      </div>
      <ItemGroup className="gap-0! rounded-xl border">
        {mostrados.map((elemento, indice) => (
          <div key={elemento.id}>
            {indice > 0 ? <ItemSeparator /> : null}
            <Item size="sm" className="gap-3">
              <ItemContent className="min-w-0">
                <ItemTitle className="w-full truncate">{elemento.titulo}</ItemTitle>
                <ItemDescription className="line-clamp-2!">{elemento.detalle}</ItemDescription>
              </ItemContent>
              <ItemActions className="gap-1.5">
                {hecho(elemento) && fila ? (
                  <Badge variant="success-light">
                    {hechoDe(asunto, claveDe(asunto.id, elemento.id), manejadores.hechos)}
                  </Badge>
                ) : (
                  <>
                    {asunto.otra && (elemento.persona || asunto.otra.accion !== 'abrir') ? (
                      <Button variant="ghost" size="sm" onClick={() => manejadores.otra(asunto, elemento)}>
                        {asunto.otra.etiqueta}
                      </Button>
                    ) : null}
                    {fila ? (
                      <Button variant="outline" size="sm" onClick={() => manejadores.hacer(asunto, [elemento])}>
                        {fila.etiqueta}
                      </Button>
                    ) : null}
                  </>
                )}
              </ItemActions>
            </Item>
          </div>
        ))}
      </ItemGroup>
      {asunto.elementos.length > visibles ? (
        <Button variant="ghost" size="sm" className="self-center" onClick={() => setVisibles((actual) => actual + 8)}>
          Mostrar más ({asunto.elementos.length - visibles})
        </Button>
      ) : null}
    </div>
  )
}

// Una sugerencia de la IA con la tarjeta común del tablero (`propuestas/components/tablero-atencion.tsx`).
export function TarjetaSugerencia({ asunto, manejadores, completa = false }: { asunto: Asunto; manejadores: Manejadores; completa?: boolean }) {
  return (
    <TarjetaSugerenciaComun
      titulo={asunto.titulo}
      resumen={asunto.resumen}
      porque={asunto.porque}
      completa={completa}
      etiqueta={etiquetaSugerencia(asunto)}
      onAplicar={() => manejadores.aplicar(asunto)}
      onDescartar={() => manejadores.descartar(asunto)}
    />
  )
}

export function PanelAtencion({
  abierto,
  onAbierto,
  grupo,
  asuntos,
  asunto,
  onAsunto,
  manejadores,
  ventanas,
}: {
  abierto: boolean
  onAbierto: (abierto: boolean) => void
  // Lo que se abre desde el panel (escribir, descartar): va dentro, como drawer anidado, no en una ventana encima.
  ventanas?: ReactNode
  grupo: Grupo
  // Los pendientes del grupo, para la lista.
  asuntos: Asunto[]
  // El que se está mirando, aunque ya se haya resuelto del todo (se ve hasta que se vuelve a la lista).
  asunto: Asunto | null
  onAsunto: (asunto: Asunto | null) => void
  manejadores: Manejadores
}) {
  const info = grupoDe(grupo)
  const pie = asunto?.pie
  const sugerencia = asunto?.grupo === 'ia'

  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbierto}
      size="lg"
      media={<MediaGrupo grupo={grupo} />}
      kicker={asunto ? info.titulo : undefined}
      title={asunto ? asunto.titulo : info.titulo}
      description={asunto ? asunto.resumen : `${asuntos.length} ${plural(asuntos.length, 'asunto', 'asuntos')} · ${info.corto}`}
      navigation={
        asunto ? (
          <div className="flex items-center border-b px-3 py-1.5">
            <Button variant="ghost" size="sm" className="text-muted-foreground!" onClick={() => onAsunto(null)}>
              <HugeiconsIcon icon={ArrowLeft01Icon} aria-hidden="true" />
              {info.titulo}
            </Button>
          </div>
        ) : undefined
      }
      footer={
        asunto ? (
          <>
            <Button variant="outline" onClick={() => onAsunto(null)}>
              Volver
            </Button>
            {sugerencia && asunto.pendientes > 0 ? (
              <>
                <Button variant="ghost" className="ml-auto" onClick={() => manejadores.descartar(asunto)}>
                  Descartar
                </Button>
                <BotonIaSecundario onClick={() => manejadores.aplicar(asunto)}>{etiquetaSugerencia(asunto)}</BotonIaSecundario>
              </>
            ) : null}
            {asunto.enlace ? (
              <Button className="ml-auto" onClick={() => manejadores.pie(asunto, 'enlace')}>
                {asunto.enlace.texto}
              </Button>
            ) : null}
            {pie && asunto.pendientes > 0 ? (
              <>
                {pie.revisado ? (
                  <Button variant="ghost" className="ml-auto" onClick={() => manejadores.pie(asunto, 'revisado')}>
                    Ya lo revisé
                  </Button>
                ) : null}
                {pie.abrir ? (
                  <Button variant="outline" className={pie.revisado ? undefined : 'ml-auto'} onClick={() => manejadores.pie(asunto, 'abrir')}>
                    Abrir la vacante
                  </Button>
                ) : null}
                {pie.editar ? <Button onClick={() => manejadores.pie(asunto, 'editar')}>Editar la vacante</Button> : null}
              </>
            ) : null}
          </>
        ) : undefined
      }
    >
      {asunto ? (
        <div className="flex flex-col gap-6">
          {sugerencia ? (
            <div className="flex flex-col gap-3">
              <Heading as="h3" level={6} className="flex items-center gap-2">
                <IconoIA />
                Por qué lo propongo
              </Heading>
              <Text size="sm">{asunto.porque}</Text>
              {asunto.pendientes === 0 ? (
                <Badge variant="success-light" className="w-fit">
                  Hecho
                </Badge>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                <Heading as="h3" level={6}>
                  Qué está pasando
                </Heading>
                <ListaDatos filas={asunto.datos} />
              </div>
              <BloqueResumen>
                <Heading as="h3" level={6}>
                  Cómo resolverlo
                </Heading>
                <Text size="sm" variant="muted">
                  {asunto.como}
                </Text>
                {asunto.elementos.length ? <ListaElementos key={asunto.id} asunto={asunto} manejadores={manejadores} /> : null}
                {!asunto.elementos.length && asunto.pendientes === 0 ? (
                  <Badge variant="success-light" className="w-fit">
                    Revisado
                  </Badge>
                ) : null}
              </BloqueResumen>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <ListaAsuntos
            grupo={grupo}
            asuntos={asuntos}
            onAbrir={onAsunto}
            sugerencia={(uno) => <TarjetaSugerencia asunto={uno} manejadores={manejadores} completa />}
          />
          <ResueltoHoy grupo={grupo} />
        </div>
      )}
      {ventanas}
    </DrawerShell>
  )
}

// Lo resuelto en esta sesión en este grupo, con quién y a qué hora, y su «Deshacer» aunque el aviso ya se haya ido
// (IN-31, IN-41). En las sugerencias, también las descartadas, para volver a proponerlas.
function ResueltoHoy({ grupo }: { grupo: Grupo }) {
  const estado = useEstadoInicio()
  const resueltos = estado.resueltos.filter((resuelto) => resuelto.grupo === grupo)
  const descartadas = grupo === 'ia' ? [...estado.descartadas] : []
  if (!resueltos.length && !descartadas.length) return null
  const hora = (ms: number) => new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })
  return (
    <div className="flex flex-col gap-2">
      {resueltos.length ? (
        <>
          <Heading as="h3" level={6}>
            Resuelto hoy
          </Heading>
          <ItemGroup className="gap-0! rounded-xl border">
            {resueltos.map((resuelto, indice) => (
              <div key={resuelto.id}>
                {indice > 0 ? <ItemSeparator /> : null}
                <Item size="sm">
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full">{resuelto.que}</ItemTitle>
                    <ItemDescription>
                      {resuelto.quien} · {hora(resuelto.cuando)}
                    </ItemDescription>
                  </ItemContent>
                  {resuelto.deshacer ? (
                    <ItemActions>
                      <Button variant="ghost" size="sm" onClick={resuelto.deshacer}>
                        Deshacer
                      </Button>
                    </ItemActions>
                  ) : null}
                </Item>
              </div>
            ))}
          </ItemGroup>
        </>
      ) : null}
      {descartadas.length ? (
        <>
          <Heading as="h3" level={6}>
            Descartadas
          </Heading>
          <ItemGroup className="gap-0! rounded-xl border">
            {descartadas.map((id, indice) => (
              <div key={id}>
                {indice > 0 ? <ItemSeparator /> : null}
                <Item size="sm">
                  <ItemContent className="min-w-0">
                    <ItemTitle className="w-full">{estado.motivos[id]?.titulo ?? 'Sugerencia descartada'}</ItemTitle>
                    <ItemDescription>{estado.motivos[id]?.motivo ?? 'Sin motivo'}</ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button variant="ghost" size="sm" onClick={() => estadoInicio.recuperar(id)}>
                      Volver a proponerla
                    </Button>
                  </ItemActions>
                </Item>
              </div>
            ))}
          </ItemGroup>
        </>
      ) : null}
    </div>
  )
}
