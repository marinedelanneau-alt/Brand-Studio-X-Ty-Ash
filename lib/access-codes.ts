import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type AccessCodeRecord = {
  id: number;
  code: string | null;
  auth_user_id: string | null;
  email: string;
  client_name: string | null;
  company_name: string | null;
  is_active: boolean;
  is_admin: boolean;
  created_at: string;
};

function getTableConfig() {
  return {
    tableName: process.env.SUPABASE_ACCESS_CODES_TABLE ?? "client_access_codes",
    codeColumn: process.env.SUPABASE_ACCESS_CODE_COLUMN ?? "code",
    activeColumn: process.env.SUPABASE_ACTIVE_COLUMN ?? "is_active",
    labelColumn: process.env.SUPABASE_LABEL_COLUMN ?? "client_name",
  };
}

export async function findAccountByCode(accessCode: string) {
  const { tableName, codeColumn } = getTableConfig();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq(codeColumn, accessCode)
    .maybeSingle<AccessCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findAccountByEmail(email: string) {
  const { tableName } = getTableConfig();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("email", email)
    .maybeSingle<AccessCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function findAccountByAuthUserId(authUserId: string) {
  const { tableName } = getTableConfig();
  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("auth_user_id", authUserId)
    .maybeSingle<AccessCodeRecord>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function insertAccount(input: {
  code?: string | null;
  authUserId?: string | null;
  email: string;
  clientName: string;
  companyName: string;
}) {
  const { tableName, codeColumn, activeColumn, labelColumn } = getTableConfig();
  const supabase = createSupabaseServerClient();

  const { error } = await supabase.from(tableName).insert({
    [codeColumn]: input.code ?? null,
    auth_user_id: input.authUserId ?? null,
    email: input.email,
    [labelColumn]: input.clientName,
    company_name: input.companyName,
    [activeColumn]: true,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function attachAuthUserToAccount(input: {
  accountId: number;
  authUserId: string;
}) {
  const { tableName, codeColumn } = getTableConfig();
  const supabase = createSupabaseServerClient();

  const { error } = await supabase
    .from(tableName)
    .update({
      auth_user_id: input.authUserId,
      [codeColumn]: null,
    })
    .eq("id", input.accountId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function isCodeAvailable(accessCode: string) {
  const account = await findAccountByCode(accessCode);
  return !account;
}
