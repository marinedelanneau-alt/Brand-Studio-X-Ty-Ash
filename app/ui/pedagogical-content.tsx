import { renderPedagogicalContent } from "@/lib/pedagogical-content";

export default function PedagogicalContent({
  content,
  className = "",
}: {
  content: string | null | undefined;
  className?: string;
}) {
  const html = renderPedagogicalContent(content);

  if (!html) {
    return null;
  }

  return (
    <div
      className={`pedagogical-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
