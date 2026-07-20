import { Fragment, type CSSProperties } from "react";
import { Placeholder, Multiline } from "./primitives";

/**
 * Presentational view for the multi-text block's default "text" mode: one or
 * more heading/body items with per-field styling and nl2br bodies. Store-free.
 */
export interface TextModeItem {
  heading?: string;
  body?: string;
}

export interface TextModeViewProps {
  id: string;
  type: string;
  items: TextModeItem[];
  headingStyle?: CSSProperties;
  bodyStyle?: CSSProperties;
  /** contentKey for data-lang-field attrs (only when rendering a single item). */
  langKey?: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function TextModeView({
  id,
  type,
  items,
  headingStyle,
  bodyStyle,
  langKey,
  style,
  data,
}: TextModeViewProps) {
  const hasStyle = style && Object.keys(style).length > 0;
  const hasHeadingStyle = headingStyle && Object.keys(headingStyle).length > 0;
  const bStyle = bodyStyle ?? {};
  return (
    <section
      className="block block-text"
      {...(hasStyle ? { style } : {})}
      {...(data ?? {})}
      data-block-id={id}
      data-block-type={type}
    >
      {items.map((item, idx) => {
        const h = String(item.heading ?? "");
        const body = String(item.body ?? "");
        const itemDivStyle: CSSProperties =
          idx > 0 ? { marginTop: "1.5rem", ...bStyle } : bStyle;
        const hasItemDivStyle = Object.keys(itemDivStyle).length > 0;
        return (
          <Fragment key={idx}>
            {h ? (
              <>
                <h2
                  className="section-heading"
                  {...(hasHeadingStyle ? { style: headingStyle } : {})}
                  {...(langKey
                    ? { "data-lang-field": `${langKey}_heading` }
                    : {})}
                >
                  {h}
                </h2>
                {idx === 0 ? (
                  <div className="section-rule" aria-hidden="true"></div>
                ) : null}
              </>
            ) : null}
            <div
              className="text-body"
              {...(hasItemDivStyle ? { style: itemDivStyle } : {})}
            >
              {body ? (
                <p {...(langKey ? { "data-lang-field": langKey } : {})}>
                  <Multiline text={body} />
                </p>
              ) : idx === 0 ? (
                <Placeholder text="Text will appear here once added." />
              ) : null}
            </div>
          </Fragment>
        );
      })}
    </section>
  );
}
