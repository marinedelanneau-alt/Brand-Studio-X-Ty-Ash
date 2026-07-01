"use client";

import { forwardRef, useEffect, useImperativeHandle } from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";

const InfoBox = Node.create({
  name: "infoBox",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      type: {
        default: "note",
        parseHTML: (element) => element.getAttribute("data-info-box") ?? "note",
        renderHTML: (attributes) => ({
          "data-info-box": attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-info-box]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});

function ToolbarButton({
  label,
  isActive = false,
  onClick,
}: {
  label: string;
  isActive?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[0.6rem] border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
        isActive
          ? "border-[#cf7430] bg-[#fff1dc] text-[#cf7430]"
          : "border-[#eadfca] bg-white text-[#6b625a]"
      }`}
    >
      {label}
    </button>
  );
}

export type RichTextEditorHandle = {
  flush: () => string;
  getHTML: () => string;
};

const RichTextEditor = forwardRef<RichTextEditorHandle, {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}>(function RichTextEditor({
  value,
  onChange,
  placeholder,
}, ref) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        link: false,
        underline: false,
      }),
      InfoBox,
      Underline,
      Link.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "tiptap-editor min-h-48 rounded-[0.9rem] border border-[#eadfca] bg-white px-4 py-3 text-base leading-7 text-[#5f544a] outline-none",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(currentEditor.getHTML());
    },
  });

  useImperativeHandle(
    ref,
    () => ({
      flush: () => {
        const html = editor?.getHTML() ?? value;
        onChange(html);
        return html;
      },
      getHTML: () => editor?.getHTML() ?? value,
    }),
    [editor, onChange, value],
  );

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();

    if (currentHtml !== value) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          label="H1"
          isActive={editor.isActive("heading", { level: 1 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        />
        <ToolbarButton
          label="H2"
          isActive={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="H3"
          isActive={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label="Gras"
          isActive={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italique"
          isActive={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Souligne"
          isActive={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Liste"
          isActive={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Liste numerotee"
          isActive={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Citation"
          isActive={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        />
        <ToolbarButton
          label="Separateur"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        />
        <ToolbarButton
          label="Lien"
          isActive={editor.isActive("link")}
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href as string | undefined;
            const url = window.prompt("URL du lien", previousUrl ?? "https://");

            if (url === null) {
              return;
            }

            const trimmedUrl = url.trim();

            if (!trimmedUrl) {
              editor.chain().focus().unsetLink().run();
              return;
            }

            editor.chain().focus().extendMarkRange("link").setLink({ href: trimmedUrl }).run();
          }}
        />
        <ToolbarButton
          label="Retirer lien"
          onClick={() => editor.chain().focus().unsetLink().run()}
        />
        <ToolbarButton
          label="Emoji"
          onClick={() => editor.chain().focus().insertContent("✨ ").run()}
        />
        <ToolbarButton
          label="Astuce"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent('<div data-info-box="tip"><p>💡 Une astuce utile.</p></div>')
              .run()
          }
        />
        <ToolbarButton
          label="Exemple"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent('<div data-info-box="example"><p>Exemple concret.</p></div>')
              .run()
          }
        />
        <ToolbarButton
          label="Attention"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent('<div data-info-box="warning"><p>⚠ Point de vigilance.</p></div>')
              .run()
          }
        />
        <ToolbarButton
          label="A retenir"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent('<div data-info-box="remember"><p>✨ À retenir.</p></div>')
              .run()
          }
        />
        <ToolbarButton
          label="Encadre"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertContent('<div data-info-box="note"><p>Note importante.</p></div>')
              .run()
          }
        />
        <ToolbarButton
          label="Annuler"
          onClick={() => editor.chain().focus().undo().run()}
        />
        <ToolbarButton
          label="Refaire"
          onClick={() => editor.chain().focus().redo().run()}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
});

export default RichTextEditor;
