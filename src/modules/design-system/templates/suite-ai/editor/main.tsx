import { Fragment, useState } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Add01Icon, Cancel01Icon } from '@hugeicons/core-free-icons'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
  Frame,
  FrameFooter,
  FramePanel,
  Heading,
  Input,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Text,
  Textarea,
} from '@ubits/flux-ui'
import { BotonIaSecundario } from '@/shared/components/BotonIaSecundario'
import { BotonIcono } from '@/shared/components/BotonIcono'

import { OTRAS_COMPETENCIAS } from '../components/data'
import { useSuite } from '../components/estado'

// Caso 03 del concepto: el editor de un contenido de LMS Creator con el agente contextual acoplado
// a la derecha (components/agente-contextual.tsx). El menú lateral queda plegado a íconos para dar
// ancho al editor.

const PESTANAS = [
  { valor: 'informacion', etiqueta: 'Información' },
  { valor: 'lecciones', etiqueta: 'Lecciones' },
  { valor: 'audiencia', etiqueta: 'Audiencia' },
  { valor: 'resultados', etiqueta: 'Resultados' },
]

export function Component() {
  const suite = useSuite()
  const { editor } = suite
  const [pestana, setPestana] = useState('informacion')
  const restantes = OTRAS_COMPETENCIAS.filter((c) => !editor.competencias.includes(c))
  const alcance = editor.audiencias.filter((a) => a.activa).reduce((suma, a) => suma + a.personas, 0)
  const resultados = [
    { etiqueta: 'Inscritos', valor: editor.publicado ? '128' : '0' },
    { etiqueta: 'Terminación', valor: editor.publicado ? '12%' : '—' },
    { etiqueta: 'Satisfacción', valor: editor.publicado ? '4,6' : '—' },
  ]

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6 pt-2">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <Heading as="h1" level={2}>
            {editor.nombre || 'Contenido sin nombre'}
          </Heading>
          <Text variant="muted">Contenido propio · {editor.lecciones.length} lecciones · última edición hace 3 min</Text>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={suite.previsualizar}>
            Previsualizar
          </Button>
          <Button disabled={editor.publicado} onClick={suite.publicarContenido}>
            {editor.publicado ? 'Publicado' : 'Publicar'}
          </Button>
        </div>
      </div>

      <Tabs value={pestana} onValueChange={(valor) => setPestana(String(valor))}>
        <TabsList variant="line" className="w-full justify-start">
          {PESTANAS.map((p) => (
            <TabsTrigger key={p.valor} value={p.valor} className="flex-none">
              {p.etiqueta}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="informacion" className="pt-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nombre-contenido">Nombre del contenido</FieldLabel>
              <Input id="nombre-contenido" value={editor.nombre} onChange={(e) => suite.cambiarEditor({ nombre: e.target.value })} />
            </Field>
            <Field>
              <div className="flex items-center gap-2">
                <FieldLabel htmlFor="descripcion-contenido">Descripción</FieldLabel>
                {editor.aplicado ? null : (
                  <BotonIaSecundario size="xs" onClick={suite.sugerencia}>
                    Sugerencia lista
                  </BotonIaSecundario>
                )}
              </div>
              <Textarea
                id="descripcion-contenido"
                rows={4}
                value={editor.descripcion}
                onChange={(e) => suite.cambiarEditor({ descripcion: e.target.value, aplicado: false })}
              />
            </Field>
            <Field>
              <FieldTitle>Competencias asociadas</FieldTitle>
              <div className="flex flex-wrap items-center gap-2">
                {editor.competencias.map((competencia) => (
                  <Button key={competencia} variant="secondary" size="sm" aria-label={`Quitar ${competencia}`} onClick={() => suite.quitarCompetencia(competencia)}>
                    {competencia}
                    <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                  </Button>
                ))}
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="outline" size="sm" disabled={!restantes.length} />}>
                    <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
                    Agregar
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Competencias</DropdownMenuLabel>
                      {restantes.map((competencia) => (
                        <DropdownMenuItem key={competencia} onClick={() => suite.agregarCompetencia(competencia)}>
                          {competencia}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Field>
          </FieldGroup>
        </TabsContent>

        <TabsContent value="lecciones" className="pt-4">
          <Frame>
            <FramePanel>
              <ItemGroup>
                {editor.lecciones.map((leccion, indice) => (
                  <Fragment key={leccion.id}>
                    {indice > 0 ? <ItemSeparator /> : null}
                    <Item size="sm">
                      <ItemMedia>
                        <Badge variant="secondary" size="sm">
                          {String(indice + 1).padStart(2, '0')}
                        </Badge>
                      </ItemMedia>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="w-full truncate">{leccion.titulo}</ItemTitle>
                      </ItemContent>
                      <ItemActions>
                        <Text as="span" variant="muted" size="sm" className="whitespace-nowrap">
                          {leccion.detalle}
                        </Text>
                        <BotonIcono size="icon-xs" aria-label={`Quitar ${leccion.titulo}`} onClick={() => suite.quitarLeccion(leccion.id)}>
                          <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" />
                        </BotonIcono>
                      </ItemActions>
                    </Item>
                  </Fragment>
                ))}
              </ItemGroup>
            </FramePanel>
            <FrameFooter>
              <Button variant="outline" size="sm" className="w-fit" onClick={suite.agregarLeccion}>
                <HugeiconsIcon icon={Add01Icon} aria-hidden="true" />
                Agregar lección
              </Button>
            </FrameFooter>
          </Frame>
        </TabsContent>

        <TabsContent value="audiencia" className="pt-4">
          <Frame>
            <FramePanel>
              <ItemGroup>
                {editor.audiencias.map((audiencia, indice) => (
                  <Fragment key={audiencia.titulo}>
                    {indice > 0 ? <ItemSeparator /> : null}
                    <Item size="sm">
                      <ItemContent>
                        <ItemTitle>{audiencia.titulo}</ItemTitle>
                        <ItemDescription>{audiencia.personas} personas</ItemDescription>
                      </ItemContent>
                      <ItemActions>
                        <Switch
                          checked={audiencia.activa}
                          onCheckedChange={() => suite.alternarAudiencia(audiencia.titulo)}
                          aria-label={`Incluir a ${audiencia.titulo}`}
                        />
                      </ItemActions>
                    </Item>
                  </Fragment>
                ))}
              </ItemGroup>
            </FramePanel>
            <FrameFooter>
              <Text variant="muted" size="sm">
                {alcance} personas recibirían este contenido al publicar.
              </Text>
            </FrameFooter>
          </Frame>
        </TabsContent>

        <TabsContent value="resultados" className="pt-4">
          <Frame>
            <FramePanel className="divide-border grid grid-cols-3 divide-x">
              {resultados.map((dato) => (
                <div key={dato.etiqueta} className="flex flex-col gap-1 px-4 first:ps-0 last:pe-0">
                  <Text as="span" size="xl" weight="semibold">
                    {dato.valor}
                  </Text>
                  <Text as="span" variant="muted" size="sm">
                    {dato.etiqueta}
                  </Text>
                </div>
              ))}
            </FramePanel>
            <FrameFooter>
              <Text variant="muted" size="sm">
                {editor.publicado ? 'Datos de las últimas 24 horas · se actualiza cada hora.' : 'Sin datos hasta publicar el contenido.'}
              </Text>
            </FrameFooter>
          </Frame>
        </TabsContent>
      </Tabs>
    </div>
  )
}

Component.displayName = 'DesignSystemTemplateSuiteAiEditor'
