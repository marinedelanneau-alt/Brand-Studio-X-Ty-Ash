import type { WorkspaceModule } from "./training-types";

const POSITION_PREFIX = "position-";

export function getModuleRouteKey(module: Pick<WorkspaceModule, "position">) {
  return `${POSITION_PREFIX}${module.position}`;
}

export function getModuleHref(module: Pick<WorkspaceModule, "position">) {
  return `/mon-espace/module/${getModuleRouteKey(module)}`;
}

export function resolveWorkspaceModule(modules: WorkspaceModule[], routeKey: string) {
  if (routeKey.startsWith(POSITION_PREFIX)) {
    const position = Number(routeKey.slice(POSITION_PREFIX.length));
    return Number.isInteger(position) && position > 0
      ? modules.find((module) => module.position === position)
      : undefined;
  }

  const legacyId = Number(routeKey);
  if (!Number.isInteger(legacyId) || legacyId <= 0) return undefined;

  return (
    modules.find((module) => module.id === legacyId) ??
    modules.find((module) => module.position === legacyId)
  );
}
