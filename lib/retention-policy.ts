export const retentionPolicy = {
  account: { basis: "contract", afterAccessDays: null },
  userContent: { basis: "contract", afterAccessDays: null },
  commercialProof: { basis: "legal_obligation_or_legal_claims", years: null },
  invoices: { basis: "accounting_obligation", years: 10 },
  prospects: { basis: "consent_or_legitimate_interest", years: null, collectionDetected: false },
  support: { basis: "contract_or_legitimate_interest", years: null },
  privacyRequests: { basis: "legal_obligation", years: null },
} as const;

// No purge job is registered. Null durations are blocking decisions, not infinity.
export function canScheduleContentPurge(days: number | null, explicitlyApproved: boolean) {
  return explicitlyApproved && days !== null && Number.isInteger(days) && days >= 0;
}
