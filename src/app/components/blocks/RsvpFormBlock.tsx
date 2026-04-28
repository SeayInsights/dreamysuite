"use client";

import { blockSectionStyle, parseCfg } from "@/lib/editableField";
import { TextEffectWrapper } from "@/app/components/TextEffectWrapper";
import { useFormSubmit } from "@/lib/hooks";

interface Block { id: string; type: string; [key: string]: unknown }

interface CustomQuestion { id: string; label: string }

export function RsvpFormBlock({ block }: { block: Block }) {
  const cfg = parseCfg(block.config);
  const heading = String(cfg.heading ?? cfg.title ?? "RSVP");
  const subheading = String(cfg.subheading ?? "");
  const siteId = String(cfg.siteId ?? "");
  const siteSlug = String(cfg.siteSlug ?? "");
  const customQuestions: CustomQuestion[] = Array.isArray(cfg.customQuestions) ? (cfg.customQuestions as CustomQuestion[]) : [];

  // Form submission with useFormSubmit hook
  const endpoint = siteSlug ? `/api/public/${siteSlug}/rsvp` : `/api/sites/${siteId}/rsvp`;

  const { status, error, submit } = useFormSubmit({
    endpoint,
    method: "POST",
    onSubmit: (formData) => {
      // Validate site configuration
      if (!siteSlug && !siteId) {
        throw new Error("RSVP unavailable — site not configured.");
      }

      // Extract custom question responses
      const customResponses: Record<string, string> = {};
      for (const q of customQuestions) {
        customResponses[q.id] = String(formData.get(`custom_${q.id}`) ?? "");
      }

      // Return data to submit
      return {
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        attending: formData.get("attending"),
        notes: formData.get("notes"),
        ...(customQuestions.length > 0 ? { customResponses } : {}),
      };
    },
    resetForm: true, // Reset form after successful submission
  });

  return (
    <section className="block block-rsvp" data-block-id={block.id} data-block-type={block.type}
      style={blockSectionStyle(cfg)}>
      <TextEffectWrapper as="h2" className="section-heading">{heading}</TextEffectWrapper>
      <div className="section-rule" aria-hidden="true" />
      {subheading && <p style={{ textAlign: "center", color: "var(--muted)", marginBottom: "1.5rem" }}>{subheading}</p>}

      {status === "success" ? (
        <div role="alert" aria-live="polite" style={{ textAlign: "center", color: "#22c55e", padding: "0.875rem 1rem", fontSize: "0.9375rem" }}>
          Thank you! Your RSVP has been received.
        </div>
      ) : (
        <form className="rsvp-form" onSubmit={submit} aria-label="RSVP form">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" name="firstName" type="text" placeholder="First name" autoComplete="given-name" required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" name="lastName" type="text" placeholder="Last name" autoComplete="family-name" required />
          </div>
          <div className="form-group">
            <label className="form-label">
              Email <span style={{ fontSize: "0.8em", color: "#9b8e85", fontWeight: 400 }}>(optional — for confirmation)</span>
            </label>
            <input className="form-input" name="email" type="email" placeholder="your@email.com" autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Will you attend?</label>
            <div className="radio-group" role="radiogroup" aria-label="Attendance">
              <label className="radio-label">
                <input type="radio" name="attending" value="yes" required /> Joyfully accepts
              </label>
              <label className="radio-label">
                <input type="radio" name="attending" value="no" /> Regretfully declines
              </label>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes or Dietary Restrictions</label>
            <textarea className="form-input form-textarea" name="notes" placeholder="Optional" />
          </div>
          {customQuestions.map((q) => (
            <div className="form-group" key={q.id}>
              <label className="form-label">{q.label}</label>
              <input className="form-input" name={`custom_${q.id}`} type="text" placeholder="Optional" />
            </div>
          ))}
          {status === "error" && error && (
            <p role="alert" style={{ color: "#ef4444", fontSize: "0.85rem", margin: 0 }}>{error}</p>
          )}
          <button className="rsvp-submit" type="submit" disabled={status === "submitting"}
            style={{ background: "var(--accent, #B8921A)", opacity: status === "submitting" ? 0.7 : 1 }}>
            {status === "submitting" ? "Sending\u2026" : "Send RSVP"}
          </button>
        </form>
      )}
    </section>
  );
}
