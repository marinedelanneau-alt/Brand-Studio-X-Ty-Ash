import "server-only";

import { cookies } from "next/headers";

const MODULE_COMPLETION_COOKIE = "workspace-module-completions";
const MODULE_COMPLETION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type StoredModuleCompletions = Record<string, number[]>;

function parseStoredModuleCompletions(value: string | undefined) {
  if (!value) {
    return {} satisfies StoredModuleCompletions;
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {} satisfies StoredModuleCompletions;
    }

    return Object.fromEntries(
      Object.entries(parsed).map(([projectId, moduleIds]) => [
        projectId,
        Array.isArray(moduleIds)
          ? moduleIds.filter((moduleId): moduleId is number => Number.isInteger(moduleId))
          : [],
      ]),
    ) satisfies StoredModuleCompletions;
  } catch {
    return {} satisfies StoredModuleCompletions;
  }
}

export async function getCompletedModuleIdsFromCookie(projectId: number) {
  const cookieStore = await cookies();
  const storedValue = cookieStore.get(MODULE_COMPLETION_COOKIE)?.value;
  const completions = parseStoredModuleCompletions(storedValue);

  return completions[String(projectId)] ?? [];
}

export async function updateCompletedModuleCookie(input: {
  projectId: number;
  moduleId: number;
  isCompleted: boolean;
}) {
  const cookieStore = await cookies();
  const storedValue = cookieStore.get(MODULE_COMPLETION_COOKIE)?.value;
  const completions = parseStoredModuleCompletions(storedValue);
  const projectKey = String(input.projectId);
  const currentModuleIds = new Set(completions[projectKey] ?? []);

  if (input.isCompleted) {
    currentModuleIds.add(input.moduleId);
  } else {
    currentModuleIds.delete(input.moduleId);
  }

  completions[projectKey] = [...currentModuleIds].sort((left, right) => left - right);

  cookieStore.set(
    MODULE_COMPLETION_COOKIE,
    JSON.stringify(completions),
    {
      httpOnly: true,
      maxAge: MODULE_COMPLETION_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
    },
  );
}
