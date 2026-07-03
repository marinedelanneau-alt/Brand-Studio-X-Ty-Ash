export function isMissingDatabaseObject(error: { code?: string; message?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";

  return (
    error?.code === "PGRST205" ||
    message.includes("could not find the table") ||
    message.includes("could not find the column") ||
    message.includes("schema cache")
  );
}
