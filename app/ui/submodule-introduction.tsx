import type { SubmoduleEditorialIntroduction } from "@/lib/training-types";

export default function SubmoduleIntroduction({
  contentHtml,
  introduction,
  exerciseCount,
}: {
  contentHtml: string;
  introduction?: SubmoduleEditorialIntroduction;
  exerciseCount: number;
}) {
  const hasEditorialContent = Boolean(
    introduction?.label?.trim() || introduction?.headline?.trim()
      || introduction?.paragraphs?.some(paragraph => paragraph.trim())
      || introduction?.transition?.trim(),
  );
  // Empty rich-text documents should not leave an input-shaped empty panel.
  const hasLegacyContent = Boolean(contentHtml.replace(/<[^>]*>|&nbsp;|&#160;|\u00a0/gi, "").trim())
    || /<(?:img|video|audio|iframe|table)\b/i.test(contentHtml);
  if (!hasEditorialContent && !hasLegacyContent) return null;

  const transition = introduction?.transition?.replaceAll(
    "{exercises}", `${exerciseCount} exercice${exerciseCount > 1 ? "s" : ""}`,
  );

  return (
    <div className="submodule-introduction">
      {hasEditorialContent ? (
        <>
          {introduction?.label ? <p className="submodule-introduction__label">{introduction.label}</p> : null}
          {introduction?.headline ? <h3 className="submodule-introduction__headline">{introduction.headline}</h3> : null}
          {introduction?.paragraphs?.length ? (
            <div className="submodule-introduction__body">
              {introduction.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          ) : null}
          {transition ? (
            <p className="submodule-introduction__transition">
              <span aria-hidden="true">→</span><span>{transition}</span>
            </p>
          ) : null}
        </>
      ) : (
        <div className="module-content submodule-introduction__legacy" dangerouslySetInnerHTML={{ __html: contentHtml }} />
      )}
    </div>
  );
}
