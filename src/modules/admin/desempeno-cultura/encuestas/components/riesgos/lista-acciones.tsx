import { useMemo, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Search01Icon } from '@hugeicons/core-free-icons'
import { Badge, Button, Checkbox, InputGroup, InputGroupAddon, InputGroupInput, Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemSeparator, ItemTitle, Text } from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import type { RiskItem } from '../../modelo/riesgos'
import type { ListaAccion } from './soluciones'
import { TextoCompleto } from '@/shared/components/TextoCompleto'

// La lista de un caso, una fila por elemento (una persona, una pregunta, un comentario, una dimensión). Con acción
// (recordar a quienes faltan), cada fila tiene su botón; marcar varias cambia el de la cabecera a «hacerlo con las
// marcadas», y sin marcar actúa sobre todas las que faltan. Lo ya hecho se queda en la lista con su insignia, igual
// que la tabla de quién falta en Resultados. Sin acción es solo para mirar: lo que el módulo deja leer pero no
// resolver desde aquí. Va dentro del marco «Cómo resolverlo» del drawer: el marco pone el borde, la lista solo las líneas.

const POR_PAGINA = 8
const UMBRAL_BUSQUEDA = 8

export function ListaAcciones({ items, accion, buscar, hechos, onHacer, onVer }: { items: readonly RiskItem[]; accion?: ListaAccion; buscar: string; hechos: ReadonlySet<string>; onHacer: (ids: readonly string[]) => void; onVer?: (id: string) => void }) {
  const [marcadas, setMarcadas] = useState<ReadonlySet<string>>(new Set())
  const [busqueda, setBusqueda] = useState('')
  const [visibles, setVisibles] = useState(POR_PAGINA)

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return texto ? items.filter((item) => `${item.title} ${item.detail ?? ''}`.toLowerCase().includes(texto)) : items
  }, [items, busqueda])
  const pendientes = items.filter((item) => !hechos.has(item.id))
  const pendientesFiltradas = filtradas.filter((item) => !hechos.has(item.id))
  const marcadasPendientes = pendientes.filter((item) => marcadas.has(item.id))
  const todasMarcadas = pendientesFiltradas.length > 0 && pendientesFiltradas.every((item) => marcadas.has(item.id))
  const algunaMarcada = marcadasPendientes.length > 0

  const hacer = (ids: readonly string[]) => {
    if (ids.length === 0) return
    onHacer(ids)
    setMarcadas((previas) => new Set([...previas].filter((id) => !ids.includes(id))))
  }
  const alternar = (id: string) =>
    setMarcadas((previas) => {
      const siguientes = new Set(previas)
      if (!siguientes.delete(id)) siguientes.add(id)
      return siguientes
    })
  const alternarTodas = () => setMarcadas(todasMarcadas ? new Set() : new Set(pendientesFiltradas.map((item) => item.id)))

  const mostradas = filtradas.slice(0, visibles)

  return (
    <div className="flex flex-col gap-3">
      {items.length > UMBRAL_BUSQUEDA ? (
        <InputGroup>
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value)
              setVisibles(POR_PAGINA)
            }}
            placeholder={buscar}
            aria-label={buscar}
          />
        </InputGroup>
      ) : null}

      {accion ? (
        <div className="flex min-h-8 items-center gap-3">
          <Checkbox checked={todasMarcadas} indeterminate={algunaMarcada && !todasMarcadas} disabled={pendientesFiltradas.length === 0} onCheckedChange={alternarTodas} aria-label="Marcar todas las de la lista" />
          <Text as="span" size="sm" variant="muted" className="min-w-0 flex-1 truncate">
            {algunaMarcada ? `${marcadasPendientes.length} marcadas de ${pendientes.length}` : pendientes.length === 0 ? 'Todo resuelto' : `${pendientes.length} por resolver`}
          </Text>
          {accion.ia ? (
            <BotonIaSecundario disabled={pendientes.length === 0} onClick={() => hacer((algunaMarcada ? marcadasPendientes : pendientes).map((item) => item.id))}>
              {algunaMarcada ? accion.masiva(marcadasPendientes.length) : accion.todas}
            </BotonIaSecundario>
          ) : algunaMarcada ? (
            <Button size="sm" onClick={() => hacer(marcadasPendientes.map((item) => item.id))}>
              <HugeiconsIcon icon={accion.icono} aria-hidden="true" />
              {accion.masiva(marcadasPendientes.length)}
            </Button>
          ) : (
            <Button size="sm" variant="outline" disabled={pendientes.length === 0} onClick={() => hacer(pendientes.map((item) => item.id))}>
              <HugeiconsIcon icon={accion.icono} aria-hidden="true" />
              {accion.todas}
            </Button>
          )}
        </div>
      ) : (
        <Text as="span" size="sm" variant="muted">
          {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
        </Text>
      )}

      {filtradas.length === 0 ? (
        <Text size="sm" variant="muted">
          Nada coincide con «{busqueda}».
        </Text>
      ) : (
        <ItemGroup className="gap-0!">
          {mostradas.map((item, indice) => {
            const hecho = hechos.has(item.id)
            return (
              <div key={item.id}>
                {indice > 0 ? <ItemSeparator /> : null}
                <Item size="sm" className="gap-3 px-0!">
                  {accion ? <Checkbox checked={marcadas.has(item.id)} disabled={hecho} onCheckedChange={() => alternar(item.id)} aria-label={`Marcar ${item.title}`} /> : null}
                  <ItemContent className="min-w-0">
                    {item.person ? (
                      <Persona nombre={item.title} detalle={item.detail} />
                    ) : (
                      <>
                        <TextoCompleto texto={item.title}><ItemTitle className="line-clamp-2 w-full">{item.title}</ItemTitle></TextoCompleto>
                        {item.detail ? <TextoCompleto texto={item.detail}><ItemDescription className="line-clamp-1!">{item.detail}</ItemDescription></TextoCompleto> : null}
                      </>
                    )}
                  </ItemContent>
                  {accion ? (
                    <ItemActions>
                      {hecho && accion.ver && onVer ? (
                        <Button variant="outline" size="sm" onClick={() => onVer(item.id)}>
                          {accion.ver}
                          <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                        </Button>
                      ) : hecho ? (
                        <Badge variant="success-light" size="sm">
                          {accion.hecho}
                        </Badge>
                      ) : accion.ia ? (
                        <BotonIaSecundario onClick={() => hacer([item.id])}>{accion.individual}</BotonIaSecundario>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => hacer([item.id])}>
                          {accion.individual}
                        </Button>
                      )}
                    </ItemActions>
                  ) : null}
                </Item>
              </div>
            )
          })}
        </ItemGroup>
      )}

      {filtradas.length > visibles ? (
        <Button variant="ghost" size="sm" className="self-center" onClick={() => setVisibles((actual) => actual + POR_PAGINA)}>
          Mostrar más ({filtradas.length - visibles})
        </Button>
      ) : null}
    </div>
  )
}
