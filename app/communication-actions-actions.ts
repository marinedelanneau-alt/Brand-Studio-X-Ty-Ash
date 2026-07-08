"use server";

import { revalidatePath } from "next/cache";
import { isMissingDatabaseObject } from "@/lib/database-errors";
import {
  deleteCommunicationAction,
  duplicateCommunicationAction,
  updateCommunicationActionStatus,
  upsertCommunicationAction,
  type ActionStatus,
  type CommunicationAction,
  type CommunicationActionInput,
} from "@/lib/communication-actions";
import { getUserFacingDataErrorMessage } from "@/lib/runtime-errors";
import { getAuthenticatedAccount } from "@/lib/session";
import { hasActiveAccess } from "@/lib/subscriptions";
import { getWorkspaceData } from "@/lib/training";

type ActionResult<T = null> = {
  status: "success" | "error";
  message: string;
  data?: T;
};

function getActionPlanErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    isMissingDatabaseObject(error as { code?: string; message?: string })
  ) {
    return "La table communication_actions doit être ajoutée dans Supabase avant d'enregistrer la feuille de route.";
  }

  return getUserFacingDataErrorMessage(error);
}

async function getAuthorizedProject() {
  const account = await getAuthenticatedAccount();
  if (!(await hasActiveAccess(account.id))) {
    throw new Error("Débloque Brand Studio pour enregistrer ta feuille de route.");
  }

  const workspace = await getWorkspaceData(account.id);
  if (!workspace.project) {
    throw new Error("Crée d'abord ton projet de marque.");
  }

  return { account, project: workspace.project };
}

function revalidateActionPlan() {
  revalidatePath("/mon-espace");
  revalidatePath("/mon-espace/plan-action-communication");
}

export async function saveCommunicationAction(
  action: CommunicationActionInput,
): Promise<ActionResult<CommunicationAction>> {
  try {
    const { account, project } = await getAuthorizedProject();

    const savedAction = await upsertCommunicationAction({
      accountId: account.id,
      projectId: project.id,
      action,
    });

    revalidateActionPlan();

    return {
      status: "success",
      message: action.id ? "Action mise a jour." : "Action ajoutee a ta feuille de route.",
      data: savedAction,
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionPlanErrorMessage(error),
    };
  }
}

export async function removeCommunicationAction(actionId: string): Promise<ActionResult> {
  try {
    const { project } = await getAuthorizedProject();
    await deleteCommunicationAction({ projectId: project.id, actionId });
    revalidateActionPlan();

    return {
      status: "success",
      message: "Action supprimée.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionPlanErrorMessage(error),
    };
  }
}

export async function copyCommunicationAction(actionId: string): Promise<ActionResult<CommunicationAction>> {
  try {
    const { account, project } = await getAuthorizedProject();
    const copiedAction = await duplicateCommunicationAction({
      accountId: account.id,
      projectId: project.id,
      actionId,
    });
    revalidateActionPlan();

    return {
      status: "success",
      message: "Action dupliquee.",
      data: copiedAction,
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionPlanErrorMessage(error),
    };
  }
}

export async function changeCommunicationActionStatus(input: {
  actionId: string;
  status: ActionStatus;
}): Promise<ActionResult> {
  try {
    const { project } = await getAuthorizedProject();
    await updateCommunicationActionStatus({
      projectId: project.id,
      actionId: input.actionId,
      status: input.status,
    });
    revalidateActionPlan();

    return {
      status: "success",
      message: "Statut mis à jour.",
    };
  } catch (error) {
    return {
      status: "error",
      message: getActionPlanErrorMessage(error),
    };
  }
}
