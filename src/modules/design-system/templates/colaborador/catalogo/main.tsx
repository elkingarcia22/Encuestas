import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { ArrowRight01Icon, Cancel01Icon, FireIcon, Search01Icon } from '@hugeicons/core-free-icons'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Heading,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  ScrollArea,
  ScrollBar,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Text,
  ToggleGroup,
  ToggleGroupItem,
} from '@ubits/flux-ui'
import { BotonIcono } from '@/shared/components/BotonIcono'
import { SinResultados } from '@/shared/components/SinResultados'
import { TarjetaContenido } from '@/shared/components/TarjetaContenido'

import { ALIADOS, CONTENIDOS, MAS_BUSCADO, TIPOS, type Contenido } from '../components/data'
import { EncabezadoPantalla, datosDeTarjeta } from '../components/piezas'
import { iniciales, plural } from '../../../patrones/formato'

// Catálogo del colaborador. Hoy son dos pantallas que comparten vista: Aprendizaje · inicio
// (/home/learning) y Catálogo (/catalog) con buscador, filtros, «lo más buscado», aliados
// destacados y 13 tipos de contenido. HU «Home y catálogo de Aprendizaje» (RN-01 a RN-04).

const ORDENES = { relevancia: 'Más relevantes', valoracion: 'Mejor valorados', titulo: 'Por nombre' }
const NIVELES = ['Todos', 'Básico', 'Intermedio', 'Avanzado']
const IDIOMAS = ['Todos', 'Español', 'Inglés']

function coincide(contenido: Contenido, q: string) {
  return [contenido.titulo, contenido.proveedor, contenido.tipo, contenido.descripcion].some((campo) =>
    campo.toLowerCase().includes(q),
  )
}

export function Component() {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [tipo, setTipo] = useState('Todos')
  const [nivel, setNivel] = useState('Todos')
  const [idioma, setIdioma] = useState('Todos')
  const [aliado, setAliado] = useState<string | null>(null)
  const [orden, setOrden] = useState<keyof typeof ORDENES>('relevancia')

  const filtrosActivos = [tipo !== 'Todos', nivel !== 'Todos', idioma !== 'Todos', aliado !== null].filter(Boolean).length
  const filtrando = busqueda.trim() !== '' || filtrosActivos > 0

  const resultado = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const lista = CONTENIDOS.filter(
      (c) =>
        (!q || coincide(c, q)) &&
        (tipo === 'Todos' || c.tipo === tipo) &&
        (nivel === 'Todos' || c.nivel === nivel) &&
        (idioma === 'Todos' || c.idioma === idioma) &&
        (!aliado || c.proveedor === aliado),
    )
    if (orden === 'valoracion') return [...lista].sort((a, b) => b.valoracion - a.valoracion)
    if (orden === 'titulo') return [...lista].sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'))
    return lista
  }, [busqueda, tipo, nivel, idioma, aliado, orden])

  const limpiar = () => {
    setBusqueda('')
    setTipo('Todos')
    setNivel('Todos')
    setIdioma('Todos')
    setAliado(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPantalla
        titulo="Catálogo"
        descripcion="Contenidos de UBITS y de sus aliados para aprender más allá de tus planes."
      />

      <div className="flex flex-col gap-3">
        <InputGroup className="max-w-2xl">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Buscar en el catálogo"
            placeholder="¿Qué quieres aprender? Busca por tema, aliado o tipo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          {busqueda ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Limpiar búsqueda" onClick={() => setBusqueda('')}>
                <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>
        <div className="flex flex-wrap items-center gap-2">
          <Text as="span" variant="muted" size="sm" className="flex items-center gap-1">
            <HugeiconsIcon icon={FireIcon} size={16} aria-hidden="true" />
            Lo más buscado:
          </Text>
          {MAS_BUSCADO.map((termino) => (
            <Button key={termino} variant="outline" size="xs" onClick={() => setBusqueda(termino)}>
              {termino}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <ScrollArea className="w-full">
          <ToggleGroup
            variant="outline"
            size="sm"
            value={[tipo]}
            onValueChange={(valor) => valor[0] && setTipo(String(valor[0]))}
            aria-label="Tipo de contenido"
            className="w-max pb-3"
          >
            {['Todos', ...TIPOS].map((opcion) => (
              <ToggleGroupItem key={opcion} value={opcion}>
                {opcion}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={nivel} onValueChange={(v) => setNivel(String(v))}>
            <SelectTrigger size="sm" className="w-40" aria-label="Nivel">
              <SelectValue>{(v) => (v === 'Todos' ? 'Todos los niveles' : String(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {NIVELES.map((n) => (
                <SelectItem key={n} value={n}>
                  {n === 'Todos' ? 'Todos los niveles' : n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={idioma} onValueChange={(v) => setIdioma(String(v))}>
            <SelectTrigger size="sm" className="w-40" aria-label="Idioma">
              <SelectValue>{(v) => (v === 'Todos' ? 'Todos los idiomas' : String(v))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {IDIOMAS.map((i) => (
                <SelectItem key={i} value={i}>
                  {i === 'Todos' ? 'Todos los idiomas' : i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {aliado ? (
            <Badge variant="info-light">
              {aliado}
              <BotonIcono size="icon-xs" aria-label={`Quitar ${aliado}`} onClick={() => setAliado(null)}>
                <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
              </BotonIcono>
            </Badge>
          ) : null}
          <div className="ms-auto flex items-center gap-2">
            <Text as="span" variant="muted" size="sm">
              {resultado.length} {plural(resultado.length, 'contenido', 'contenidos')}
            </Text>
            <Select value={orden} onValueChange={(v) => setOrden(v as keyof typeof ORDENES)}>
              <SelectTrigger size="sm" className="w-44" aria-label="Ordenar">
                <SelectValue>{(v) => ORDENES[v as keyof typeof ORDENES]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ORDENES).map(([valor, etiqueta]) => (
                  <SelectItem key={valor} value={valor}>
                    {etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!filtrando ? (
        <section className="flex flex-col gap-3" aria-labelledby="aliados">
          <Heading as="h2" level={5} id="aliados">
            Aliados destacados
          </Heading>
          <ItemGroup className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALIADOS.map((nombre) => {
              const cuantos = CONTENIDOS.filter((c) => c.proveedor === nombre).length
              return (
                <Item key={nombre} variant="outline" size="sm" className="relative">
                  <ItemMedia>
                    <Avatar size="sm">
                      <AvatarFallback>{iniciales(nombre)}</AvatarFallback>
                    </Avatar>
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{nombre}</ItemTitle>
                    <ItemDescription>
                      {cuantos} {plural(cuantos, 'contenido', 'contenidos')}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    {/* El botón se estira sobre la fila: toda la fila filtra por el aliado. */}
                    <BotonIcono
                      aria-label={`Ver contenidos de ${nombre}`}
                      onClick={() => setAliado(nombre)}
                      className="after:absolute after:inset-0"
                    >
                      <HugeiconsIcon icon={ArrowRight01Icon} aria-hidden="true" />
                    </BotonIcono>
                  </ItemActions>
                </Item>
              )
            })}
          </ItemGroup>
        </section>
      ) : null}

      <section className="flex flex-col gap-3" aria-labelledby="resultados">
        <Heading as="h2" level={5} id="resultados">
          {filtrando ? 'Resultados' : 'Todo el catálogo'}
        </Heading>
        {resultado.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {resultado.map((contenido) => (
              <TarjetaContenido key={contenido.id} {...datosDeTarjeta(contenido, { onAbrir: navigate })} />
            ))}
          </div>
        ) : (
          // RN-04: vacío de búsqueda con la salida de limpiar. Es el «Sin resultados» del sistema: ilustración, lo
          // buscado entre comillas y cuántos filtros están puestos (decisión 14 de la auditoría).
          <SinResultados busqueda={busqueda} filtrosActivos={filtrosActivos} onLimpiar={limpiar} />
        )}
      </section>
    </div>
  )
}

Component.displayName = 'TemplateColaboradorCatalogo'
