import sidebarBackground from '@/modules/auth/Assets/Background-impacto-real.jpg'
import { AUTH18_TESTIMONIAL } from './data'

export function TestimonialSidebar() {
  return (
    <aside
      className="relative m-4 hidden overflow-hidden rounded-3xl bg-primary bg-cover bg-center px-8 py-10 sm:px-12 xl:flex xl:min-h-[calc(100svh-2rem)] xl:px-14 xl:py-12"
      style={{ backgroundImage: `url(${sidebarBackground})` }}
    >
      {/* Velo sobre la foto: con /25 el texto blanco de abajo quedaba en 4,1–4,3:1; con /40 pasa de 5:1. */}
      <div className="hidden absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="relative z-10 flex min-h-full w-full flex-col items-center justify-center text-center">
        <blockquote className="hidden max-w-[36rem] text-pretty text-[48px] leading-[1.34] font-semibold tracking-tight text-primary-foreground">
          {AUTH18_TESTIMONIAL.quote}
        </blockquote>
      </div>
    </aside>
  )
}
