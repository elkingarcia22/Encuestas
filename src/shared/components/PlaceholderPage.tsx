import { SlotArea } from '@/shared/components/SlotArea'

type PlaceholderPageProps = {
  title: string
  path: string
}

// Pantalla que todavía no está maquetada: un solo espacio libre que toma todo el contenido, con el mismo aspecto
// que los slots del design system (rayado gris con filo punteado). El marco de la página —barra lateral, cabecera
// y pie— no cambia. Va dentro de PageShell, que pone el ancho (desde el 5-oct ya no trae el suyo).
export function PlaceholderPage({ title, path }: PlaceholderPageProps) {
  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col">
      <SlotArea name={title} hint={`Aquí va la pantalla de ${title}. Todavía no está maquetada: se arma en ${path}.`} />
    </div>
  )
}
