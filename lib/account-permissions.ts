export type PermissionAccount = { role?: string; is_admin?: boolean; is_active?: boolean; can_view_clients?: boolean; complimentary_access?: boolean };
export function isClientViewer(account: PermissionAccount | null | undefined) {
  return account?.can_view_clients === true;
}
export function canAdminister(account: PermissionAccount | null | undefined) {
  return !!account && account.is_active !== false && (account.role === "admin" || account.is_admin === true);
}
export function canReadClients(account: PermissionAccount | null | undefined) {
  return !!account && account.is_active !== false && (canAdminister(account) || (isClientViewer(account) && !account.is_admin));
}
