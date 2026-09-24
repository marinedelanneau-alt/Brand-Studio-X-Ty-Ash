import type { ModuleSummaryHighlight } from "@/lib/module-summary";

export default function SummaryAnswerTable({ table }: { table: NonNullable<ModuleSummaryHighlight["table"]> }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[600px] table-fixed border-collapse text-left text-sm leading-6 text-[var(--text-primary)]">
        <thead className="bg-[var(--tyash-soft)]">
          <tr>{table.columns.map((column, index) => <th key={index} scope="col" className="border border-[var(--border)] p-3 align-top font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody>{table.rows.map((row, index) => (
          <tr key={index} className="even:bg-[var(--background)]">{row.map((cell, column) => <td key={column} className="break-words border border-[var(--border)] p-3 align-top">{cell || "—"}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}
