import { useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Add01Icon,
  ArrowDown01Icon,
  Briefcase01Icon,
  Comment01Icon,
  Download01Icon,
  Megaphone02Icon,
  Mortarboard01Icon,
  Target02Icon,
} from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Heading,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
} from '@ubits/flux-ui'

import { PERIODOS, PROCESOS } from './data'
import { VistaInicio } from './vista-inicio'
import { VistaMetricas } from './vista-metricas'
import { VistaOperativo } from './vista-operativo'

const CREAR = [
  { id: 'evaluacion', etiqueta: 'Evaluación 360', icono: Target02Icon },
  { id: 'encuesta', etiqueta: 'Encuesta', icono: Comment01Icon },
  { id: 'plan', etiqueta: 'Plan de formación', icono: Mortarboard01Icon },
  { id: 'vacante', etiqueta: 'Vacante', icono: Briefcase01Icon },
  { id: 'comunicacion', etiqueta: 'Comunicación', icono: Megaphone02Icon },
]

const ABIERTOS = PROCESOS.filter((proceso) => proceso.estado !== 'Finalizado').length

// Un rol, tres tipos de dashboard. Salen de las pantallas que ya hacen de "dashboard" en la
// plataforma real: el Panel principal (inicio), Seguimiento de tareas y los listados con
// estados (operativo), y el Dashboard de reclutamiento o los tableros de Métricas (métricas).
export function RrhhView() {
  const [periodo, setPeriodo] = useState('30d')

  return (
    <Tabs defaultValue="inicio" className="flex flex-1 flex-col gap-5">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Heading as="h1" level={3}>
              Recursos Humanos
            </Heading>
            <Text variant="muted" size="sm">
              Todo lo que pasa en la empresa, sin saltar entre cinco navegaciones.
            </Text>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={periodo} onValueChange={(valor) => setPeriodo(String(valor ?? '30d'))}>
              <SelectTrigger size="sm" className="w-40" aria-label="Periodo del dashboard">
                <SelectValue>{(valor) => PERIODOS[String(valor)]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERIODOS).map(([valor, texto]) => (
                  <SelectItem key={valor} value={valor}>
                    {texto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <HugeiconsIcon icon={Download01Icon} aria-hidden="true" />
              Exportar
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button size="sm" />}>
                <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
                Crear
                <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Crear en la empresa</DropdownMenuLabel>
                  {CREAR.map((opcion) => (
                    <DropdownMenuItem key={opcion.id}>
                      <HugeiconsIcon icon={opcion.icono} aria-hidden="true" />
                      {opcion.etiqueta}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <TabsList variant="line">
          <TabsTrigger value="inicio" className="flex-none">
            Inicio
          </TabsTrigger>
          <TabsTrigger value="operativo" className="flex-none">
            Operativo
            <Badge variant="secondary" size="xs" radius="full">
              {ABIERTOS}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="metricas" className="flex-none">
            Métricas
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="inicio">
        <VistaInicio />
      </TabsContent>
      <TabsContent value="operativo">
        <VistaOperativo />
      </TabsContent>
      <TabsContent value="metricas">
        <VistaMetricas />
      </TabsContent>
    </Tabs>
  )
}
