// Tour del nuevo UBITS la primera vez que se entra desde el login (1 oct). El login pregunta `debeMostrarTour()` antes
// de navegar: si la persona no lo ha visto (`ubits-tour-visto` en este navegador), lo marca como visto y devuelve
// `true`, y el login navega con `{ tour: true }` en el estado de la ruta. El marco (AppSidebar) lee ese estado y abre el
// tour; al cerrarlo lo borra. Se hace por el estado de la ruta y no por almacenamiento, porque el marco ya está montado
// detrás del login y no se vuelve a montar al llegar al admin. Si el navegador no deja guardar, no se abre solo (la
// tarjeta «Hacer el tour» lo sigue abriendo).
const CLAVE_VISTO = 'ubits-tour-visto'

export function debeMostrarTour() {
  try {
    if (localStorage.getItem(CLAVE_VISTO)) return false
    localStorage.setItem(CLAVE_VISTO, '1')
    return true
  } catch {
    return false
  }
}

export type EstadoTour = { tour?: boolean } | null
