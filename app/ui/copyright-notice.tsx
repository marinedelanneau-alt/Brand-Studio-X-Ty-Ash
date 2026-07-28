import { copyrightText } from "@/lib/legal-policy";

export default function CopyrightNotice({ className = "" }: { className?: string }) {
  return <span className={className}>{copyrightText()}</span>;
}
