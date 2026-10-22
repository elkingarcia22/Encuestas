import { createContext, useContext } from 'react'
import { escalaDe, type Escala } from '../../modelo/resultados/cumplimiento'
import { nivelesDe } from '../../modelo/resultados/seguimiento'
import { CICLOS } from '../../modelo/ciclos'

// La escala de cumplimiento del ciclo que se mira (sale de sus niveles, 21-oct). La pone la pestaña Cumplimiento y la
// leen el árbol y el mapa de calor, que pintan cada cifra en el color de su tramo.
export const EscalaCumplimiento = createContext<Escala>(escalaDe(nivelesDe(CICLOS[0])))
export const useEscala = () => useContext(EscalaCumplimiento)
