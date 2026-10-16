import { pathwayValidationCases } from "../tests/pathway-validation-fixtures";
import seed from "../content/tyash-v1/pathway.json";
import { prepareIndependentPathway } from "../lib/pathway-versions";
process.stdout.write(JSON.stringify([
  ...pathwayValidationCases,
  { name: "complete approved Ty Ash pathway", valid: true, modules: prepareIndependentPathway(seed, []) },
]));
