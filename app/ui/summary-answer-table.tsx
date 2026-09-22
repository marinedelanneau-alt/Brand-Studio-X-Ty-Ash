import type { ModuleSummaryHighlight } from "@/lib/module-summary";

export default function SummaryAnswerTable({ table }: { table: NonNullable<ModuleSummaryHighlight["table"]> }) {
  return (
    <div className="mt-3 overflow-x-auto">
      <table className="w-full min-w-[600px] table-fixed border-collapse text-left text-sm leading-6 text-[#4f463f]">
        <thead className="bg-[#f9e8d8]">
          <tr>{table.columns.map((column, index) => <th key={index} scope="col" className="border border-[#e7dccb] p-3 align-top font-semibold">{column}</th>)}</tr>
        </thead>
        <tbody>{table.rows.map((row, index) => (
          <tr key={index} className="even:bg-[#f7f1e8]">{row.map((cell, column) => <td key={column} className="break-words border border-[#e7dccb] p-3 align-top">{cell || "—"}</td>)}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}
