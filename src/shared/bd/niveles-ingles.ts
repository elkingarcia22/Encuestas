// Niveles de inglés del Marco Común Europeo, con los medios que usa UBITS.
//
// Es un campo **del Creator interno de UBITS**, no del creador de contenidos de una empresa: dice qué inglés hace
// falta para seguir un contenido en ese idioma. Por eso solo lo llevan los contenidos del catálogo de UBITS que están
// en inglés, y en el creador de las empresas ese campo ni existe (Dave, 2-oct).

export type NivelIngles = '<A1' | 'A1' | 'A2' | 'A2+' | 'B1' | 'B1+' | 'B2' | 'B2+' | 'C1' | 'C2'

/** En orden, de menos a más: así se ordenan y se listan en los filtros. */
export const NIVELES_INGLES: NivelIngles[] = ['<A1', 'A1', 'A2', 'A2+', 'B1', 'B1+', 'B2', 'B2+', 'C1', 'C2']
