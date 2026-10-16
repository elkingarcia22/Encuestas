import { useState } from 'react'
import { useNavigate } from 'react-router'
import { HugeiconsIcon } from '@hugeicons/react'
import { LeftToRightListBulletIcon, Note01Icon, UserCircleIcon } from '@hugeicons/core-free-icons'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
  Kbd,
  KbdGroup,
  Tabs,
  TabsList,
  TabsTrigger,
  Text,
  toast,
} from '@ubits/flux-ui'
import { Orb } from '@/shared/components/Orb'

import { VACANTES_SELECCION, ruta } from './data'
import { useSuite } from './estado'

// Caso 06 del concepto: el buscador (⌘K) que también le pregunta al agente. Agrupa en «Preguntar
// al agente», «Objetos» e «Ir a»; Tab cambia de grupo.

const PESTANAS = ['Todo', 'Ir a', 'Objetos', 'Preguntar']

export function Buscador() {
  const suite = useSuite()
  const navigate = useNavigate()
  const [consulta, setConsulta] = useState(suite.buscador.consulta)
  const [pestana, setPestana] = useState('Todo')

  const escrita = consulta.trim()
  const palabras = (escrita || 'vacantes de analista')
    .toLowerCase()
    .split(/\s+/)
    .filter((p) => p.length > 2)
  const pregunta = escrita
    ? `Sobre «${escrita}»: ¿qué hay abierto y en qué etapa va?`
    : '¿Cuántas vacantes de analista están abiertas y en qué etapa van?'

  const ir = (destino: string) => {
    suite.cerrarBuscador()
    navigate(destino)
  }
  const avisar = (titulo: string) => {
    suite.cerrarBuscador()
    toast.add({ title: titulo })
  }

  const objetos = [
    {
      icono: Note01Icon,
      titulo: 'Analista de datos',
      detalle: '· vacante · Entrevistas · 12 candidatos',
      abrir: () => {
        suite.cerrarBuscador()
        suite.abrirVacante(VACANTES_SELECCION[0])
      },
    },
    { icono: UserCircleIcon, titulo: 'Andrés Malo', detalle: '· candidato · Analista de datos', abrir: () => avisar('Perfil de Andrés Malo') },
    { icono: Note01Icon, titulo: 'Onboarding operativo', detalle: '· contenido · borrador · 6 lecciones', abrir: () => ir(ruta('editor')) },
  ].filter((o) => {
    const texto = `${o.titulo} ${o.detalle}`.toLowerCase()
    return palabras.length === 0 || palabras.some((p) => texto.includes(p))
  })

  const destinos = [
    { detalle: 'Vacantes', abrir: () => ir(ruta('vacantes')) },
    { detalle: 'Plantillas de selección', abrir: () => avisar('Plantillas de selección') },
    { detalle: 'Configuración del proceso', abrir: () => avisar('Configuración de selección') },
  ]

  const verPregunta = pestana === 'Todo' || pestana === 'Preguntar'
  const verObjetos = pestana === 'Todo' || pestana === 'Objetos'
  const verDestinos = pestana === 'Todo' || pestana === 'Ir a'
  const total = (verPregunta ? 1 : 0) + (verObjetos ? objetos.length : 0) + (verDestinos ? destinos.length : 0)

  const preguntarAgente = () => {
    suite.cerrarBuscador()
    suite.empezarChat(
      escrita ? `Consulta: ${escrita}` : 'Consulta de selección',
      pregunta,
      'Hay 3 vacantes de analista abiertas: Analista de datos en entrevistas (12 candidatos), Analista financiero en filtro inicial (28) y Analista de calidad en borrador.',
    )
  }

  return (
    <CommandDialog
      open={suite.buscador.abierto}
      onOpenChange={(abierto) => (abierto ? null : suite.cerrarBuscador())}
      title="Buscar o preguntar"
      description="Busca pantallas y objetos, o pregúntale al agente"
      className="sm:max-w-2xl"
    >
      <Command
        shouldFilter={false}
        onKeyDown={(e) => {
          if (e.key !== 'Tab') return
          e.preventDefault()
          setPestana((actual) => PESTANAS[(PESTANAS.indexOf(actual) + (e.shiftKey ? PESTANAS.length - 1 : 1)) % PESTANAS.length])
        }}
      >
        <CommandInput value={consulta} onValueChange={setConsulta} placeholder="Busca o pregúntale al agente…" />
        <div className="flex items-center gap-3 px-3 pt-2">
          <Tabs value={pestana} onValueChange={(valor) => setPestana(String(valor))}>
            <TabsList>
              {PESTANAS.map((nombre) => (
                <TabsTrigger key={nombre} value={nombre}>
                  {nombre}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Text as="span" variant="muted" size="xs" className="ml-auto">
            {total} resultados
          </Text>
        </div>
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          {verPregunta ? (
            <CommandGroup heading="Preguntar al agente">
              <CommandItem value="preguntar" onSelect={preguntarAgente}>
                <Orb className="size-6" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <Text as="span" size="sm" weight="medium">
                    «{pregunta}»
                  </Text>
                  <Text as="span" variant="muted" size="xs">
                    Consulta sobre Selección · responde en el panel lateral
                  </Text>
                </div>
                <CommandShortcut>↵</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          ) : null}
          {verObjetos && objetos.length ? (
            <CommandGroup heading="Objetos">
              {objetos.map((objeto) => (
                <CommandItem key={objeto.titulo} value={`objeto-${objeto.titulo}`} onSelect={objeto.abrir}>
                  <HugeiconsIcon icon={objeto.icono} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    {objeto.titulo}{' '}
                    <Text as="span" variant="muted" size="sm">
                      {objeto.detalle}
                    </Text>
                  </span>
                  <CommandShortcut>Abrir</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          {verDestinos ? (
            <CommandGroup heading="Ir a">
              {destinos.map((destino) => (
                <CommandItem key={destino.detalle} value={`ir-${destino.detalle}`} onSelect={destino.abrir}>
                  <HugeiconsIcon icon={LeftToRightListBulletIcon} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">
                    Selección{' '}
                    <Text as="span" variant="muted" size="sm">
                      › {destino.detalle}
                    </Text>
                  </span>
                  <CommandShortcut>Navegar</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
        </CommandList>
        <div className="border-border flex flex-wrap items-center gap-x-4 gap-y-1 border-t px-3 py-2">
          <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
            <KbdGroup>
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
            </KbdGroup>
            moverse
          </Text>
          <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
            <Kbd>↵</Kbd>
            abrir o preguntar
          </Text>
          <Text as="span" variant="muted" size="xs" className="flex items-center gap-1">
            <Kbd>⇥</Kbd>
            cambiar grupo
          </Text>
          <Text as="span" variant="muted" size="xs" className="ml-auto">
            Alcance: {suite.organizacion}
          </Text>
        </div>
      </Command>
    </CommandDialog>
  )
}
