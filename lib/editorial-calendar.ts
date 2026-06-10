export type EditorialCalendarStatus =
  | "idea"
  | "draft"
  | "scheduled"
  | "published";

export type EditorialCalendarEntry = {
  id: string;
  date: string;
  title: string;
  channel: string;
  status: EditorialCalendarStatus;
  notes: string;
};

const ENTRY_PREFIX = "__editorial_calendar_entry__:";

export const EDITORIAL_CALENDAR_CONFIG_PREFIX = "__editorial_calendar_config__:";

export const EDITORIAL_CALENDAR_STATUS_LABELS: Record<EditorialCalendarStatus, string> = {
  idea: "Idee",
  draft: "À produire",
  scheduled: "Programme",
  published: "Publie",
};

const STATUS_VALUES = Object.keys(
  EDITORIAL_CALENDAR_STATUS_LABELS,
) as EditorialCalendarStatus[];

export function getSerializedEditorialCalendarOptions() {
  return [`${EDITORIAL_CALENDAR_CONFIG_PREFIX}1`];
}

export function isEditorialCalendarOptions(options: string[]) {
  return options.some((option) => option.startsWith(EDITORIAL_CALENDAR_CONFIG_PREFIX));
}

export function serializeEditorialCalendarEntries(entries: EditorialCalendarEntry[]) {
  return entries
    .map((entry) => ({
      ...entry,
      date: entry.date.trim(),
      title: entry.title.trim(),
      channel: entry.channel.trim(),
      notes: entry.notes.trim(),
      status: STATUS_VALUES.includes(entry.status) ? entry.status : "idea",
    }))
    .filter((entry) => entry.date && entry.title)
    .map((entry) => `${ENTRY_PREFIX}${encodeURIComponent(JSON.stringify(entry))}`);
}

export function parseEditorialCalendarEntries(values: string[]) {
  return values
    .filter((value) => value.startsWith(ENTRY_PREFIX))
    .map((value) => value.slice(ENTRY_PREFIX.length))
    .map((value) => {
      try {
        return JSON.parse(decodeURIComponent(value)) as Partial<EditorialCalendarEntry>;
      } catch {
        return null;
      }
    })
    .filter((entry): entry is Partial<EditorialCalendarEntry> => entry !== null)
    .map((entry) => ({
      id: typeof entry.id === "string" && entry.id ? entry.id : crypto.randomUUID(),
      date: typeof entry.date === "string" ? entry.date : "",
      title: typeof entry.title === "string" ? entry.title : "",
      channel: typeof entry.channel === "string" ? entry.channel : "",
      status:
        typeof entry.status === "string" &&
        STATUS_VALUES.includes(entry.status as EditorialCalendarStatus)
          ? (entry.status as EditorialCalendarStatus)
          : "idea",
      notes: typeof entry.notes === "string" ? entry.notes : "",
    }))
    .filter((entry) => entry.date && entry.title);
}

export function isEditorialCalendarComplete(values: string[]) {
  return parseEditorialCalendarEntries(values).length > 0;
}
