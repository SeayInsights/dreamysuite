import type { CSSProperties } from "react";

/**
 * Presentational form blocks (rsvp / rsvp-form / guest-book). Store-free.
 *
 * Unlike the legacy string renderers, these emit `data-*` attributes instead of
 * an inline `onsubmit` handler (React SSR cannot emit inline event handlers). The
 * published site's scripts.ts attaches submit handlers by delegation on these
 * data attributes — behavior is identical, published pages stay zero-JS-framework.
 */

function containerProps(style?: CSSProperties, data?: Record<string, string>) {
  const hasStyle = style && Object.keys(style).length > 0;
  return { ...(hasStyle ? { style } : {}), ...(data ?? {}) };
}

export interface RsvpFormViewProps {
  id: string;
  type: string;
  title: string;
  subheading: string;
  slug: string;
  style?: CSSProperties;
  data?: Record<string, string>;
}

export function RsvpFormView({
  id,
  type,
  title,
  subheading,
  slug,
  style,
  data,
}: RsvpFormViewProps) {
  const formId = `rsvp-form-${id}`;
  const msgId = `rsvp-msg-${id}`;
  return (
    <section
      className="block block-rsvp"
      {...containerProps(style, data)}
      aria-label="RSVP"
      data-block-id={id}
      data-block-type={type}
    >
      <h2 className="section-heading">{title}</h2>
      <div className="section-rule" aria-hidden="true"></div>
      {subheading ? (
        <p
          style={{
            textAlign: "center",
            color: "var(--site-muted)",
            marginBottom: "1.5rem",
          }}
        >
          {subheading}
        </p>
      ) : null}
      <form
        className="rsvp-form"
        id={formId}
        aria-label="RSVP form"
        data-rsvp-slug={slug}
        data-rsvp-msg={msgId}
      >
        <div className="form-group">
          <label className="form-label" htmlFor={`rsvp-fn-${id}`}>
            First Name
          </label>
          <input
            className="form-input"
            id={`rsvp-fn-${id}`}
            name="firstName"
            type="text"
            placeholder="First name"
            autoComplete="given-name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`rsvp-ln-${id}`}>
            Last Name
          </label>
          <input
            className="form-input"
            id={`rsvp-ln-${id}`}
            name="lastName"
            type="text"
            placeholder="Last name"
            autoComplete="family-name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`rsvp-email-${id}`}>
            Email{" "}
            <span
              style={{ fontSize: "0.8em", color: "#9b8e85", fontWeight: 400 }}
            >
              (optional — for confirmation)
            </span>
          </label>
          <input
            className="form-input"
            id={`rsvp-email-${id}`}
            name="email"
            type="email"
            placeholder="your@email.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Will you attend?</label>
          <div
            className="radio-group"
            role="radiogroup"
            aria-label="Attendance"
          >
            <label className="radio-label">
              <input type="radio" name="attending" value="yes" required />{" "}
              Joyfully accepts
            </label>
            <label className="radio-label">
              <input type="radio" name="attending" value="no" /> Regretfully
              declines
            </label>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`rsvp-notes-${id}`}>
            Notes or Dietary Restrictions
          </label>
          <textarea
            className="form-input form-textarea"
            id={`rsvp-notes-${id}`}
            name="notes"
            placeholder="Optional"
          ></textarea>
        </div>
        <button
          className="rsvp-submit"
          type="submit"
          style={{ background: "var(--site-accent)" }}
        >
          Send RSVP
        </button>
      </form>
      <div
        id={msgId}
        role="alert"
        aria-live="polite"
        style={{
          display: "none",
          marginTop: "1.25rem",
          textAlign: "center",
          fontSize: "0.9375rem",
          padding: "0.875rem 1rem",
          borderRadius: "6px",
        }}
      ></div>
    </section>
  );
}

export interface GuestBookViewProps {
  id: string;
  type: string;
  siteId: string;
  heading: string;
  placeholderText: string;
  /** Merged container style + the block's fixed max-width/centering. */
  sectionStyle: CSSProperties;
  data?: Record<string, string>;
}

export function GuestBookView({
  id,
  type,
  siteId,
  heading,
  placeholderText,
  sectionStyle,
  data,
}: GuestBookViewProps) {
  const formId = `gb-form-${id}`;
  const listId = `gb-list-${id}`;
  return (
    <section
      className="block block-guest-book"
      {...(data ?? {})}
      aria-label="Guest Book"
      data-block-id={id}
      data-block-type={type}
      style={sectionStyle}
    >
      {heading ? (
        <>
          <h2 className="section-heading">{heading}</h2>
          <div className="section-rule" aria-hidden="true"></div>
        </>
      ) : null}
      <form
        className="rsvp-form"
        id={formId}
        data-gb-site={siteId}
        data-gb-list={listId}
      >
        <div className="form-group">
          <label className="form-label" htmlFor={`gb-name-${id}`}>
            Your Name
          </label>
          <input
            className="form-input"
            id={`gb-name-${id}`}
            name="name"
            type="text"
            placeholder="Your name"
            required
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor={`gb-msg-${id}`}>
            Message
          </label>
          <textarea
            className="form-input form-textarea"
            id={`gb-msg-${id}`}
            name="message"
            placeholder={placeholderText}
            required
          ></textarea>
        </div>
        <button
          className="rsvp-submit"
          type="submit"
          style={{ background: "var(--site-accent)" }}
        >
          Sign the book
        </button>
      </form>
      <div
        id={listId}
        style={{
          marginTop: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
        }}
      ></div>
    </section>
  );
}
