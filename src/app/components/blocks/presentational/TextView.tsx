import type { CSSProperties } from "react";
import { Placeholder, Multiline } from "./primitives";

export interface TextViewProps {
  id: string;
  type: string;
  heading: string;
  body: string;
  contentKey?: string;
  headingStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  style?: CSSProperties;
  data?: Record<string, string>;
}

/** Presentational text block — single source for published markup. */
export function TextView({
  id,
  type,
  heading,
  body,
  contentKey,
  headingStyle,
  bodyStyle,
  style,
  data,
}: TextViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  const hasHeadingStyle = headingStyle && Object.keys(headingStyle).length > 0;
  const hasBodyStyle = bodyStyle && Object.keys(bodyStyle).length > 0;
  return (
    <section
      className="block block-text"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      data-block-id={id}
      data-block-type={type}
    >
      {heading ? (
        <>
          <h2
            className="section-heading"
            {...(hasHeadingStyle ? { style: headingStyle } : {})}
            {...(contentKey
              ? { "data-lang-field": `${contentKey}_heading` }
              : {})}
          >
            {heading}
          </h2>
          <div className="section-rule" aria-hidden="true"></div>
        </>
      ) : null}
      <div
        className="text-body"
        {...(hasBodyStyle ? { style: bodyStyle } : {})}
      >
        {body ? (
          <p {...(contentKey ? { "data-lang-field": contentKey } : {})}>
            <Multiline text={body} />
          </p>
        ) : (
          <Placeholder text="Story text will appear here once added." />
        )}
      </div>
    </section>
  );
}
