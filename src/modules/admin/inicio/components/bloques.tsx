import type { ReactNode } from 'react'
import type { IconSvgElement } from '@hugeicons/react'
import { useNavigate } from "react-router";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  Cell,
  Label,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
  Heading,
  IconTile,
  ItemGroup,
  Progress,
  ProgressLabel,
  ProgressValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Text,
  TrafficLight,
} from "@ubits/flux-ui";

import { FilaCifras, type Cifra } from "@/modules/design-system/metricas/cifras";
import { notify } from "@/shared/components/notify";
import {
  ACTIVITY,
  EVAL_PENDING,
  EVAL_SEGMENTS,
  PROGRAMS,
  TRAINING_SERIES,
  VACANCIES,
} from "./data";

// Bloques de la Home con el mismo lenguaje que «Top métricas»: marco con borde doble (Frame), cifras en
// seminegrita del tema y leyendas con TrafficLight. Reemplazan en la Home a las tarjetas de Nicolás
// (charts.tsx y lists.tsx), que usaban otro tipo de caja y cifras en letra delgada; sus datos se reutilizan.

// La fila de cifras (Cifra, CeldaCifra, FilaCifras) se mudó a Design system › Métricas el 29-sep; se reenvía
// desde aquí para que las pantallas que la importan de este archivo no cambien.
export { CeldaCifra, FilaCifras, type Cifra } from "@/modules/design-system/metricas/cifras";

export const AZUL = "var(--primary)";
// Azul claro por transparencia, no mezclado con el fondo: mezclarlo con el fondo lo apagaba hasta
// desaparecer en modo oscuro.
export const AZUL_CLARO = "color-mix(in oklab, var(--primary) 55%, transparent)";
export const GRIS = "color-mix(in oklab, var(--foreground) 12%, var(--background))";

export const TOOLTIP = {
  cursor: { fill: "var(--muted)" },
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--popover-foreground)",
  },
  labelStyle: { color: "var(--foreground)", fontWeight: 500 },
};

// Ejes y cursor que comparten las tres gráficas: sin líneas duras, letra del tema y la referencia
// vertical suave que usan los bloques de gráfica de ReUI.
export const EJE = {
  tickLine: false as const,
  axisLine: false as const,
  tick: { fill: "var(--muted-foreground)", fontSize: 12 },
};

export const CURSOR_LINEA = {
  stroke: "var(--border)",
  strokeWidth: 1,
  strokeDasharray: "4 4",
};

// Techo redondo para el eje: así las marcas caen en 100, 200, 300 y no en cifras sueltas.
const TECHO = Math.ceil(Math.max(...TRAINING_SERIES.map((mes) => mes.iniciaron)) / 100) * 100

const FORMACION: Cifra[] = [
  { etiqueta: "Iniciaron en septiembre", valor: "274" },
  { etiqueta: "Completaron en septiembre", valor: "249" },
  {
    etiqueta: "Tasa de finalización",
    valor: "91 %",
  },
];

// Las tres pestañas de «Cómo va cada producto» usan la misma anatomía (como el bloque chart-16 de ReUI):
// a la izquierda, cifras divididas arriba y una gráfica abajo; a la derecha, una lista con avance.

export function TarjetaCifrasGrafica({
  titulo,
  descripcion,
  cifras,
  columnas = 'sm:grid-cols-3',
  leyenda,
  children,
}: {
  titulo: string
  descripcion: string
  cifras: Cifra[]
  columnas?: string
  leyenda?: ReactNode
  children: ReactNode
}) {
  return (
    <Frame className="h-full">
      <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
        <FrameTitle>{titulo}</FrameTitle>
        <FrameDescription>{descripcion}</FrameDescription>
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col gap-6">
        <FilaCifras cifras={cifras} columnas={columnas} />
        <div className="min-h-48 flex-1">{children}</div>
        {leyenda}
      </FramePanel>
    </Frame>
  )
}

export type FilaAvance = {
  titulo: string
  detalle: string
  pct: number
  valor?: string
  icono?: IconSvgElement
}

export function ListaAvance({
  titulo,
  descripcion,
  accion,
  filas,
}: {
  titulo: string
  descripcion: string
  accion?: { etiqueta: string; ruta: string }
  filas: FilaAvance[]
}) {
  const navigate = useNavigate()
  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>{titulo}</FrameTitle>
          <FrameDescription>{descripcion}</FrameDescription>
        </div>
        {accion ? (
          <Button variant="outline" size="sm" onClick={() => navigate(accion.ruta)}>
            {accion.etiqueta}
          </Button>
        ) : null}
      </FrameHeader>
      <FramePanel className="flex flex-1 flex-col justify-between gap-5">
        {filas.map((fila) => (
          <div key={fila.titulo} className="flex items-center gap-3">
            {fila.icono ? (
              <IconTile variant="soft" size="sm">
                <HugeiconsIcon icon={fila.icono} aria-hidden="true" />
              </IconTile>
            ) : null}
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Progress value={fila.pct}>
                <ProgressLabel>{fila.titulo}</ProgressLabel>
                {fila.valor ? (
                  <Text as="span" size="sm" weight="medium" className="ms-auto">
                    {fila.valor}
                  </Text>
                ) : (
                  <ProgressValue className="ms-auto" />
                )}
              </Progress>
              <Text as="span" variant="muted" size="xs">
                {fila.detalle}
              </Text>
            </div>
          </div>
        ))}
      </FramePanel>
    </Frame>
  )
}

export function Formacion() {
  const ultimo = TRAINING_SERIES[TRAINING_SERIES.length - 1]
  return (
    <TarjetaCifrasGrafica
      titulo="Formación"
      descripcion="Personas que iniciaron y completaron un curso, mes a mes"
      cifras={FORMACION}
      leyenda={
        <TrafficLight
          data={{
            label: 'Leyenda de septiembre',
            items: [
              { label: 'Iniciaron', value: String(ultimo.iniciaron), color: AZUL_CLARO },
              { label: 'Completaron', value: String(ultimo.completaron), color: AZUL },
            ],
          }}
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={TRAINING_SERIES} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          {/* El área clara es quién empieza; la línea azul, quién termina. El espacio entre las dos es la
              gente que se queda por el camino. */}
          <defs>
            <linearGradient id="home-iniciaron" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.24} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="month" tickMargin={10} {...EJE} />
          <YAxis width={56} domain={[0, TECHO]} ticks={[0, TECHO / 3, (TECHO / 3) * 2, TECHO]} {...EJE} />
          <Tooltip {...TOOLTIP} cursor={CURSOR_LINEA} />
          <Area
            type="monotone"
            dataKey="iniciaron"
            name="Iniciaron"
            stroke={AZUL_CLARO}
            strokeWidth={2}
            fill="url(#home-iniciaron)"
            dot={{ r: 3, fill: 'var(--card)', stroke: AZUL_CLARO, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="completaron"
            name="Completaron"
            stroke={AZUL}
            strokeWidth={2}
            dot={{ r: 3, fill: 'var(--card)', stroke: AZUL, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </TarjetaCifrasGrafica>
  )
}

export function Programas() {
  return (
    <ListaAvance
      titulo="Programas activos"
      descripcion="Avance de cada plan de formación"
      accion={{ etiqueta: 'Ver todo', ruta: '/admin/aprendizaje/planes-de-formacion' }}
      filas={PROGRAMS.map((programa) => ({ titulo: programa.title, detalle: programa.meta, pct: programa.pct, icono: programa.icon }))}
    />
  )
}

// Vacantes con la misma lista: etapa, avance y quién la lleva.
export function VacantesLista() {
  return (
    <ListaAvance
      titulo="Vacantes abiertas"
      descripcion="En qué etapa va cada proceso"
      accion={{ etiqueta: 'Ver todas', ruta: '/admin/seleccion/exploraciones/uno' }}
      filas={VACANCIES.slice(0, 5).map((vacante) => ({
        titulo: vacante.role,
        detalle: `${vacante.stage} · ${vacante.cands} candidatos · ${vacante.owner}`,
        pct: vacante.pct,
        valor: vacante.step,
      }))}
    />
  )
}

export function Vacantes() {
  const navigate = useNavigate();
  return (
    <Frame>
      <FrameHeader className="flex flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle className="flex items-center gap-2">
            Vacantes abiertas
            <Badge variant="secondary" radius="full">
              {VACANCIES.length}
            </Badge>
          </FrameTitle>
          <FrameDescription>
            En qué etapa va cada proceso y quién lo lleva
          </FrameDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/admin/seleccion/exploraciones/uno")}
        >
          Ver todas
        </Button>
      </FrameHeader>
      <FramePanel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cargo</TableHead>
              <TableHead>Etapa</TableHead>
              <TableHead>
                <div className="flex justify-end">Candidatos</div>
              </TableHead>
              <TableHead>
                <div className="flex justify-end">Responsable</div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {VACANCIES.map((vacante) => (
              <TableRow
                key={vacante.role}
                className="cursor-pointer"
                onClick={() => navigate("/admin/seleccion/exploraciones/uno")}
              >
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Text as="span" size="sm" weight="medium">
                      {vacante.role}
                    </Text>
                    <Text as="span" variant="muted" size="xs">
                      {vacante.meta}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  <Progress value={vacante.pct} className="w-40">
                    <ProgressLabel>{vacante.stage}</ProgressLabel>
                    <ProgressValue className="ms-auto">
                      {() => vacante.step}
                    </ProgressValue>
                  </Progress>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-end gap-1">
                    <Text as="span" size="sm" weight="medium">
                      {vacante.cands}
                    </Text>
                    <Text as="span" variant="muted" size="xs">
                      {vacante.fresh}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  <Avatar
                    size="sm"
                    className="ms-auto flex"
                    title={vacante.owner}
                  >
                    <AvatarFallback>{vacante.initials}</AvatarFallback>
                  </Avatar>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </FramePanel>
    </Frame>
  );
}

const COLOR_SEGMENTO = [AZUL, AZUL_CLARO, GRIS];

export function AvanceCiclo360() {
  const navigate = useNavigate();
  const total = EVAL_SEGMENTS.reduce(
    (suma, segmento) => suma + segmento.value,
    0,
  );
  const hechas = EVAL_SEGMENTS[0].value;
  const datos = EVAL_SEGMENTS.map((segmento, indice) => ({
    ...segmento,
    color: COLOR_SEGMENTO[indice],
  }));

  return (
    <Frame className="h-full">
      <FrameHeader className="flex flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <FrameTitle>Avance del ciclo 360</FrameTitle>
          <FrameDescription>
            El ciclo cierra el 30 de septiembre
          </FrameDescription>
        </div>
        <Badge variant="warning-light">{total - hechas} pendientes</Badge>
      </FrameHeader>
      {/* A todo el ancho, la dona y los pendientes van lado a lado (en pantallas chicas se apilan). */}
      <div className="grid gap-1 lg:grid-cols-2">
        <FramePanel className="flex flex-wrap items-center gap-6">
          <div className="size-36 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip {...TOOLTIP} />
                <Pie
                  data={datos}
                  dataKey="value"
                  nameKey="label"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={2}
                  cornerRadius={4}
                  stroke="var(--card)"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {datos.map((dato) => (
                    <Cell key={dato.key} fill={dato.color} />
                  ))}
                  <Label
                    value={`${Math.round((hechas / total) * 100)} %`}
                    position="center"
                    fill="var(--foreground)"
                    fontSize={20}
                    fontWeight={600}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <TrafficLight
            className="flex-col items-start"
            data={{
              label: "Estado de las evaluaciones",
              items: datos.map((dato) => ({
                label: dato.label,
                value: String(dato.value),
                color: dato.color,
              })),
            }}
          />
        </FramePanel>
        <FramePanel className="flex flex-col gap-3">
          <Heading as="h3" level={6}>
            Aún no la empiezan
          </Heading>
          <ItemGroup className="gap-3">
            {EVAL_PENDING.map((persona) => (
              <div key={persona.name} className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{persona.initials}</AvatarFallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Text
                    as="span"
                    size="sm"
                    weight="medium"
                    className="truncate"
                  >
                    {persona.name}
                  </Text>
                  <Text
                    as="span"
                    variant="muted"
                    size="xs"
                    className="truncate"
                  >
                    {persona.meta}
                  </Text>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    notify(`Recordatorio enviado a ${persona.name}`)
                  }
                >
                  Recordar
                </Button>
              </div>
            ))}
          </ItemGroup>
        </FramePanel>
      </div>
      <FrameFooter>
        <Button
          variant="link"
          size="sm"
          onClick={() => navigate("/admin/desempeno-cultura/evaluaciones-360")}
        >
          Ver las {total - hechas} personas
        </Button>
      </FrameFooter>
    </Frame>
  );
}

export function Actividad() {
  return (
    <Frame stacked>
      <FrameHeader className="[--frame-panel-header-gap:--spacing(1)]">
        <FrameTitle>Actividad reciente</FrameTitle>
        <FrameDescription>Lo último que pasó en tu equipo</FrameDescription>
      </FrameHeader>
      {ACTIVITY.map((entrada) => (
        <FramePanel
          key={entrada.who + entrada.what}
          className="flex items-center gap-3 [--frame-panel-py:0.75rem]"
        >
          <Avatar size="sm">
            <AvatarFallback>{entrada.initials}</AvatarFallback>
          </Avatar>
          <Text as="span" size="sm" className="min-w-0 flex-1 truncate">
            <Text as="span" size="sm" weight="medium">
              {entrada.who}
            </Text>{" "}
            {entrada.what}
          </Text>
          <Text as="span" variant="muted" size="xs" className="shrink-0">
            {entrada.when}
          </Text>
        </FramePanel>
      ))}
    </Frame>
  );
}
