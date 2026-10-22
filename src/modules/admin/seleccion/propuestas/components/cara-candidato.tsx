import { Avatar, AvatarFallback } from '@ubits/flux-ui'

// La cara de la persona en la cabecera de su ficha (13 oct, reunión con la PM y el TL: «son personas, no son solo datos;
// póngame un avatar»). Los candidatos no tienen foto: van sus iniciales. Solo en la cabecera de la ficha; en las tablas y
// en el tablero siguen sin cara (5 oct, Nicolás: «no deberíamos tener esos avatares en las tablas»).
export function CaraCandidato({ nombre }: { nombre: string }) {
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .map((parte) => parte[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <Avatar size="lg">
      <AvatarFallback>{iniciales}</AvatarFallback>
    </Avatar>
  )
}
