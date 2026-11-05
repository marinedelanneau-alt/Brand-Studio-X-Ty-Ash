import { renderToBuffer } from "@react-pdf/renderer";
import { ModulePdfSummary } from "@/lib/module-pdf-summary";
import type { ModuleSummaryCard } from "@/lib/module-summary";
import type { ModuleShareData } from "@/lib/get-module-share-data";
import type { WorkspaceModule } from "./training-types";

export async function generateModulePdf(input: {
  summary: ModuleSummaryCard;
  shareData: ModuleShareData;
  module?: WorkspaceModule;
}) {
  return renderToBuffer(
    <ModulePdfSummary summary={input.summary} shareData={input.shareData} module={input.module} />,
  );
}
