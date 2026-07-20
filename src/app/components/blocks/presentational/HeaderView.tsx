import type { CSSProperties } from "react";

export interface HeaderViewProps {
  id: string;
  type: string;
  text: string;
  titleStyle?: CSSProperties;
  style?: CSSProperties;
  data?: Record<string, string>;
}

/** Presentational header block — single source for published markup. */
export function HeaderView({
  id,
  type,
  text,
  titleStyle,
  style,
  data,
}: HeaderViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  const hasTitleStyle = titleStyle && Object.keys(titleStyle).length > 0;
  return (
    <section
      className="block block-header"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      data-block-id={id}
      data-block-type={type}
    >
      <h2
        className="section-heading"
        {...(hasTitleStyle ? { style: titleStyle } : {})}
      >
        {text}
      </h2>
      <div className="section-rule" aria-hidden="true"></div>
    </section>
  );
}
