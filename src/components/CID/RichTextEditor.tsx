import React, { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}

/**
 * A minimal rich-text editor for case narratives: bold, italic, underline,
 * highlight, and simple lists, built on contentEditable + execCommand so the
 * component needs no extra dependency. For a production build, swapping this
 * for TipTap or Slate is straightforward — the `value`/`onChange` contract
 * (HTML string in, HTML string out) stays the same.
 */
const RichTextEditor: React.FC<Props> = ({ value, onChange, placeholder, readOnly }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  // Only push `value` into the DOM on first mount / external changes, so we
  // don't fight the user's cursor position while they're typing.
  useEffect(() => {
    if (ref.current && (isFirstRender.current || document.activeElement !== ref.current)) {
      ref.current.innerHTML = value || "";
      isFirstRender.current = false;
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    ref.current?.focus();
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const ToolbarButton: React.FC<{ onClick: () => void; label: string; title: string }> = ({
    onClick,
    label,
    title,
  }) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()} // keep selection focused in the editor
      onClick={onClick}
      className="w-7 h-7 flex items-center justify-center rounded-sm text-sm text-bone-100 hover:bg-ink-700 border border-transparent hover:border-ink-600"
    >
      {label}
    </button>
  );

  return (
    <div className="case-editor border border-ink-600 rounded-sm bg-ink-900">
      {!readOnly && (
        <div className="flex items-center gap-1 border-b border-ink-600 px-2 py-1.5 bg-ink-800 rounded-t-sm">
          <ToolbarButton title="Bold" label="B" onClick={() => exec("bold")} />
          <ToolbarButton title="Italic" label="I" onClick={() => exec("italic")} />
          <ToolbarButton title="Underline" label="U" onClick={() => exec("underline")} />
          <span className="w-px h-4 bg-ink-600 mx-1" />
          <ToolbarButton
            title="Highlight"
            label="✎"
            onClick={() => exec("hiliteColor", "#B8934A")}
          />
          <span className="w-px h-4 bg-ink-600 mx-1" />
          <ToolbarButton title="Bullet list" label="•" onClick={() => exec("insertUnorderedList")} />
          <ToolbarButton title="Numbered list" label="1." onClick={() => exec("insertOrderedList")} />
          <span className="w-px h-4 bg-ink-600 mx-1" />
          <ToolbarButton title="Clear formatting" label="⌫" onClick={() => exec("removeFormat")} />
        </div>
      )}
      <div
        ref={ref}
        contentEditable={!readOnly}
        suppressContentEditableWarning
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        data-placeholder={placeholder}
        className="min-h-[160px] px-3 py-2 text-sm text-bone-100 leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-bone-400"
      />
    </div>
  );
};

export default RichTextEditor;
