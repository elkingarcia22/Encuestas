import { cn, Text } from '@ubits/flux-ui'
import { ANCHO_ACCESO } from '@/shared/components/page-width'
import { CasosMenu } from './casos-menu'
import entrada from './entrada.module.css'
import { SignInPanel } from './sign-in-panel'
import { TestimonialSidebar } from './testimonial-sidebar'

export function AuthView({ fullPage = false }: { fullPage?: boolean }) {
  // Dentro del layout de documentación ya hay un <main>: aquí solo lo es la página completa (/auth).
  const Root = fullPage ? 'main' : 'div'

  return (
    <Root
      className={cn(
        'w-full bg-background text-foreground xl:grid xl:grid-cols-2',
        fullPage ? 'min-h-svh' : 'min-h-full',
        entrada.raiz,
      )}
    >
      <TestimonialSidebar />

      {/* isolate: el degradado va por debajo del contenido, pero dentro de esta columna. */}
      <div
        className={cn(
          'relative isolate flex flex-col justify-center px-5 py-10 sm:px-8',
          fullPage ? 'min-h-svh' : 'min-h-full',
        )}
      >
        {/* Degradado propio del login (7 oct, según la referencia de login.ubitslearning.com en móvil): lineal a
            208°, azul del tema arriba a la derecha que llega al blanco a media altura. Con «to-bl» la
            diagonal iba de esquina a esquina y en una columna ancha teñía también abajo a la derecha. No es
            PageAmbience, que sigue rigiendo el resto de pantallas. */}
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute inset-0 -z-10 bg-linear-208 from-primary/20 via-primary/8 via-22% to-transparent to-50%',
            entrada.ambiente,
          )}
        />

        <div className={cn('absolute top-4 right-4 sm:top-6 sm:right-6', entrada.tarde)}>
          <CasosMenu />
        </div>

        {/* Una sola columna para todos los pasos: al cambiar de paso nada salta de ancho. Mide la «Columna de acceso»,
            360 px, la medida oficial de Espacio y esquinas › Ancho del contenido (7 oct). */}
        <section className={cn('mx-auto flex w-full flex-col gap-6', ANCHO_ACCESO, entrada.cascada)}>
          <SignInPanel />

          <div className="mt-2 flex items-center justify-center gap-2">
            <Text as="span" variant="muted" size="xs">
              Con la tecnología de
            </Text>
            <img src="/ubits-logo.svg" alt="UBITS" className="h-3.5 w-auto dark:hidden" />
            <img src="/ubits-logo-white.svg" alt="UBITS" className="hidden h-3.5 w-auto dark:block" />
          </div>
        </section>
      </div>
    </Root>
  )
}
