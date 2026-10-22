import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Search01Icon, UserAdd01Icon } from '@hugeicons/core-free-icons'
import {
  Button,
  Checkbox,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'
import { PrimeraVez } from '@/shared/components/PrimeraVez'
import { SinResultados } from '@/shared/components/SinResultados'
import { Persona } from '@/modules/design-system/data-grid/casos/seguimiento'
import { BotonCancelarPanel } from '@/modules/design-system/drawers/components/boton-cancelar-panel'
import { DrawerShell } from '@/modules/design-system/drawers/components/drawer-shell'
import { plural } from '@/modules/design-system/patrones/formato'
import { AREAS } from '@/modules/design-system/templates/gestion-usuarios/components/datos'
import { ACTIVOS, nombreCompleto } from './grupos-datos'

// «Selección de colaboradores» al crear un grupo y «Edición de integrantes» desde su detalle: el mismo panel, con los
// integrantes que ya tiene marcados.
//
// El buscador, el área y el switch «Todos / Elegidos» van en una franja fija bajo la cabecera: con 888 personas la
// lista es larga, y si la barra se va con el scroll hay que subir cada vez que se quiere acotar. Cada persona ocupa una
// línea de texto (nombre y, debajo, cargo y área); el username sirve para buscar, pero no hace falta leerlo.

const VISIBLES = 60

type Vista = 'todos' | 'elegidos'

export function PanelIntegrantes({
  abierto,
  onAbiertoChange,
  titulo,
  grupo,
  elegidos,
  onGuardar,
  descripcion,
  accion = 'Guardar',
}: {
  abierto: boolean
  onAbiertoChange: (abierto: boolean) => void
  titulo: string
  // El nombre del grupo, para la bajada.
  grupo: string
  elegidos: string[]
  onGuardar: (ids: string[]) => void
  // Para usarlo fuera de Grupos: «Agregar usuario» de un contenido del plan (HU-LMS-021), con «Aplicar».
  descripcion?: string
  accion?: string
}) {
  const [marcados, setMarcados] = useState(elegidos)
  const [busqueda, setBusqueda] = useState('')
  const [area, setArea] = useState('todas')
  const [vista, setVista] = useState<Vista>('todos')

  const q = busqueda.trim().toLowerCase()
  // Quienes ya están en el grupo van primero: se revisan antes de sumar a nadie.
  const encontradas = [...ACTIVOS.filter((u) => elegidos.includes(u.id)), ...ACTIVOS.filter((u) => !elegidos.includes(u.id))].filter((u) => {
    if (vista === 'elegidos' && !marcados.includes(u.id)) return false
    if (area !== 'todas' && u.area !== area) return false
    return !q || `${nombreCompleto(u)} ${u.username} ${u.cargo}`.toLowerCase().includes(q)
  })
  const visibles = encontradas.slice(0, VISIBLES)
  const todosVisibles = visibles.length > 0 && visibles.every((u) => marcados.includes(u.id))
  const nuevos = marcados.filter((id) => !elegidos.includes(id)).length
  const quitados = elegidos.filter((id) => !marcados.includes(id)).length

  const alternar = (id: string, marcar: boolean) => setMarcados((actuales) => (marcar ? [...actuales, id] : actuales.filter((x) => x !== id)))
  const alternarVisibles = () =>
    setMarcados((actuales) =>
      todosVisibles ? actuales.filter((id) => !visibles.some((u) => u.id === id)) : [...new Set([...actuales, ...visibles.map((u) => u.id)])],
    )

  const limpiar = () => {
    setBusqueda('')
    setArea('todas')
    setVista('todos')
  }

  const barra = (
    <div className="flex flex-col gap-3 border-b px-5 py-3">
      {/* En celular el buscador va solo en su fila: junto al área quedaba en «Nombre,». */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <InputGroup className="min-w-0 flex-1">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} size={16} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre, usuario o cargo"
            aria-label="Buscar colaboradores por nombre, usuario o cargo"
          />
        </InputGroup>
        <Select value={area} onValueChange={(valor) => setArea(valor as string)}>
          <SelectTrigger className="w-full shrink-0 sm:w-36" aria-label="Filtrar por área">
            <SelectValue>{(valor: string) => (valor === 'todas' ? 'Todas las áreas' : valor)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las áreas</SelectItem>
            {AREAS.map((nombre) => (
              <SelectItem key={nombre} value={nombre}>
                {nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Dos maneras de mirar la misma lista: todos, o solo a quienes ya se eligieron para revisarlos. */}
        <Tabs value={vista} onValueChange={(valor) => setVista(valor as Vista)}>
          <TabsList variant="view">
            <TabsTrigger value="todos" className="tabular-nums">
              Todos · {ACTIVOS.length.toLocaleString('es-CO')}
            </TabsTrigger>
            <TabsTrigger value="elegidos" className="tabular-nums">
              Elegidos · {marcados.length}
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {visibles.length ? (
          <Button variant="ghost" size="sm" onClick={alternarVisibles}>
            {todosVisibles ? 'Quitar' : 'Elegir'} {plural(visibles.length, 'a esta persona', `los ${visibles.length} de la lista`)}
          </Button>
        ) : null}
      </div>
    </div>
  )


  return (
    <DrawerShell
      open={abierto}
      onOpenChange={onAbiertoChange}
      size="lg"
      icon={UserAdd01Icon}
      title={titulo}
      description={descripcion ?? (grupo ? `Para «${grupo}».` : 'Quienes forman el grupo. Puedes cambiarlo cuando quieras.')}
      headerExtra={barra}
      // 13-oct (I-009): con personas sumadas o quitadas, no se cierra al tocar fuera y pregunta antes de descartar.
      conCambios={nuevos > 0 || quitados > 0}
      footerClassName="justify-between! flex-wrap"
      footer={
        <>
          <div role="status" className="flex min-w-0 items-center gap-2">
            {marcados.length ? (
              <>
                <span className="flex min-w-0 flex-col">
                  <Text as="span" size="sm" weight="medium" className="tabular-nums">
                    {marcados.length} {plural(marcados.length, 'elegido', 'elegidos')}
                  </Text>
                  {nuevos || quitados ? (
                    <Text as="span" variant="muted" size="xs" className="tabular-nums">
                      {[nuevos ? `${nuevos} ${plural(nuevos, 'nuevo', 'nuevos')}` : '', quitados ? `${quitados} ${plural(quitados, 'sale', 'salen')}` : '']
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                  ) : null}
                </span>
              </>
            ) : (
              <Text as="span" variant="muted" size="sm">
                Nadie elegido todavía
              </Text>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <BotonCancelarPanel alCerrar={() => onAbiertoChange(false)} />
            <Button disabled={!nuevos && !quitados} onClick={() => onGuardar(marcados)}>
              {accion}
            </Button>
          </div>
        </>
      }
    >
      {visibles.length ? (
        <div className="flex flex-col gap-3">
          <ItemGroup className="-mx-2 gap-0.5">
            {visibles.map((u) => {
              const marcado = marcados.includes(u.id)
              return (
                <Item key={u.id} size="xs" variant={marcado ? 'muted' : 'default'} render={<label />} className="cursor-pointer">
                  <ItemMedia>
                    <Checkbox checked={marcado} onCheckedChange={(valor) => alternar(u.id, valor === true)} aria-label={nombreCompleto(u)} />
                  </ItemMedia>
                  {/* La fila de persona del sistema (decisión 21 de la auditoría, 5-oct): iniciales, nombre y, debajo, cargo y área. */}
                  <ItemContent className="min-w-0">
                    <Persona nombre={nombreCompleto(u)} detalle={`${u.cargo} · ${u.area}`} />
                  </ItemContent>
                </Item>
              )
            })}
          </ItemGroup>
          {encontradas.length > VISIBLES ? (
            <Text as="p" variant="muted" size="sm" className="text-center">
              Se muestran {VISIBLES} de {encontradas.length.toLocaleString('es-CO')}. Busca por nombre o elige un área para llegar al resto.
            </Text>
          ) : null}
        </div>
      ) : vista === 'elegidos' && !marcados.length ? (
        // Vacíos con su ilustración glass (13-oct).
        <PrimeraVez
          className="py-12"
          icono="glass-profile"
          titulo="Todavía no has elegido a nadie"
          descripcion="Marca a las personas en «Todos» y aquí las revisas antes de guardar."
          accion={{ texto: 'Ver a todos', onClick: () => setVista('todos') }}
        />
      ) : (
        <SinResultados busqueda={busqueda} filtrosActivos={(area !== 'todas' ? 1 : 0) + (vista === 'elegidos' ? 1 : 0)} onLimpiar={limpiar} />
      )}
    </DrawerShell>
  )
}
