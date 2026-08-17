/**
 * Quita caracteres con significado especial en la sintaxis de filtros de
 * PostgREST (`,` `.` `(` `)` `%` `*`) antes de interpolar texto del usuario
 * en un `.or(...)`. Sin esto, alguien podría escribir un término de
 * búsqueda que altere el filtro real (ej. agregando una cláusula extra).
 */
export function sanitizeSearchTerm(term: string): string {
  return term.replace(/[,.()%*]/g, "").trim();
}
