/**
 * Los permisos del ciclo: qué puede hacer cada rol con sus objetivos mientras el ciclo corre.
 *
 * En el prototipo los interruptores del bloque «Permisos del ciclo» eran decorativos —estado local que se perdía al
 * cambiar de paso—. Aquí viven en el borrador (`CicloDraft.permissions`), así que lo que se apaga queda apagado al
 * volver y se guarda con el ciclo. Los valores por defecto son los del prototipo.
 */

export type CicloPermissionAction = "view" | "create" | "update" | "edit" | "delete" | "uploadWithoutApproval" | "approve" | "toggleActive";

export const PERMISSION_ACTION_LABELS: Readonly<Record<CicloPermissionAction, string>> = {
  view: "Ver",
  create: "Crear",
  update: "Actualizar",
  edit: "Editar",
  delete: "Eliminar",
  uploadWithoutApproval: "Subir sin aprobación",
  approve: "Aprobar / Denegar",
  toggleActive: "Inactivar / Activar",
};

export type CicloPermissionScope = "leaderOwn" | "leaderTeam" | "collaboratorOwn";

export interface CicloPermissionGroup {
  scope: CicloPermissionScope;
  /** El rol, en la caja que agrupa sus permisos. */
  role: string;
  /** De qué objetivos habla el rol. */
  roleDetail: string;
  /** El nombre de la lista dentro de la caja. */
  title: string;
  actions: readonly CicloPermissionAction[];
}

export const PERMISSION_GROUPS: readonly CicloPermissionGroup[] = [
  { scope: "leaderOwn", role: "Líder", roleDetail: "sus objetivos y los de su equipo", title: "Objetivos del líder", actions: ["view", "create", "update", "edit", "delete", "uploadWithoutApproval", "toggleActive"] },
  { scope: "leaderTeam", role: "Líder", roleDetail: "sus objetivos y los de su equipo", title: "Objetivos del equipo del líder", actions: ["view", "create", "update", "edit", "delete", "approve", "toggleActive"] },
  { scope: "collaboratorOwn", role: "Colaborador", roleDetail: "sus objetivos propios", title: "Objetivos individuales", actions: ["view", "create", "update", "edit", "delete", "uploadWithoutApproval", "toggleActive"] },
];

export type CicloPermissions = Readonly<Record<CicloPermissionScope, Readonly<Partial<Record<CicloPermissionAction, boolean>>>>>;

export const DEFAULT_CICLO_PERMISSIONS: CicloPermissions = {
  leaderOwn: { view: true, create: true, update: true, edit: true, delete: true, uploadWithoutApproval: true, toggleActive: true },
  leaderTeam: { view: true, create: true, update: true, edit: true, delete: true, approve: true, toggleActive: true },
  collaboratorOwn: { view: true, create: true, update: true, edit: false, delete: false, uploadWithoutApproval: false, toggleActive: false },
};

/** Cuántos permisos se movieron de su valor por defecto: el resumen del bloque plegado. */
export function changedPermissionCount(permissions: CicloPermissions | undefined): number {
  if (!permissions) return 0;
  let count = 0;
  for (const group of PERMISSION_GROUPS) {
    for (const action of group.actions) {
      if ((permissions[group.scope][action] ?? false) !== (DEFAULT_CICLO_PERMISSIONS[group.scope][action] ?? false)) count += 1;
    }
  }
  return count;
}
