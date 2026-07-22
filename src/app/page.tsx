import Link from "next/link";
import { headers } from "next/headers";
import { getEnv } from "@/lib/cloudflare";
import { createAuth } from "@/app/lib/auth.server";
import { LogoutButton } from "@/app/components/LogoutButton";

export const metadata = {
  title: "DreamySuite — Beautiful event websites, in minutes",
  description:
    "Design and publish a stunning wedding or event site — RSVP, guest lists, bilingual pages, and cinematic motion effects. No code required.",
};

// Public marketing homepage — shown to everyone. When signed in, the nav + CTAs
// point into the workspace instead of sign-up.
export default async function Landing() {
  const env = await getEnv();
  let authed = false;
  try {
    const auth = createAuth(env);
    const session = await auth.api.getSession({ headers: await headers() });
    authed = !!session;
  } catch {
    /* unauthenticated visitor */
  }

  const features: Array<{ title: string; body: string; icon: string }> = [
    {
      title: "Visual, block-based editor",
      body: "Compose pages from blocks — hero, story, schedule, gallery, RSVP — and style everything live. No code.",
      icon: "M3 3h18v18H3zM3 9h18M9 21V9",
    },
    {
      title: "Cinematic motion",
      body: "A library of 90+ WebGL & animation effects — envelope reveals, backgrounds, transitions — most site builders can't touch.",
      icon: "M12 2v20M2 12h20M5 5l14 14M19 5L5 19",
    },
    {
      title: "RSVP & guest lists",
      body: "Built for events: collect RSVPs, manage your guest list, and let visitors sign a guestbook — no add-ons.",
      icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87",
    },
    {
      title: "Bilingual by default",
      body: "Publish in two languages side by side with a built-in toggle — perfect for family across borders.",
      icon: "M5 8l6 6M4 14l6-6 2-3M2 5h12M7 2h1M22 22l-5-10-5 10M14 18h6",
    },
    {
      title: "Your own domain",
      body: "Publish instantly to a DreamySuite address, or connect your own custom domain when you're ready.",
      icon: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20",
    },
    {
      title: "Publish in one click",
      body: "No builds, no waiting. Hit publish and your site is live on the global edge in seconds.",
      icon: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
    },
  ];

  return (
    <main className="lp">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <header className="lp-nav">
        <span className="lp-logo">DreamySuite</span>
        <nav className="lp-nav-actions">
          {authed ? (
            <>
              <Link href="/sites" className="lp-link">
                My Sites
              </Link>
              <LogoutButton className="lp-link">Log out</LogoutButton>
            </>
          ) : (
            <>
              <Link href="/login" className="lp-link">
                Log in
              </Link>
              <Link href="/signup" className="lp-btn lp-btn-primary">
                Get started
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="lp-hero">
        <p className="lp-eyebrow">Wedding &amp; event websites</p>
        <h1 className="lp-title">
          Beautiful event websites,
          <br />
          in minutes.
        </h1>
        <p className="lp-sub">
          Design a stunning invitation site with cinematic motion, collect RSVPs
          and manage your guest list, and publish it live — all without writing
          a line of code.
        </p>
        <div className="lp-cta-row">
          {authed ? (
            <Link href="/sites" className="lp-btn lp-btn-primary lp-btn-lg">
              Go to your sites
            </Link>
          ) : (
            <>
              <Link href="/signup" className="lp-btn lp-btn-primary lp-btn-lg">
                Start building — free
              </Link>
              <Link href="/login" className="lp-btn lp-btn-ghost lp-btn-lg">
                I already have an account
              </Link>
            </>
          )}
        </div>
        {!authed && (
          <p className="lp-trust">
            No credit card · Publish instantly · Your data stays yours
          </p>
        )}
      </section>

      <section className="lp-section">
        <h2 className="lp-h2">Everything your event needs</h2>
        <div className="lp-grid">
          {features.map((f) => (
            <div key={f.title} className="lp-card">
              <svg
                className="lp-card-icon"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={f.icon} />
              </svg>
              <h3 className="lp-card-title">{f.title}</h3>
              <p className="lp-card-body">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-band">
        <p className="lp-eyebrow lp-eyebrow-light">The difference</p>
        <h2 className="lp-band-title">Motion that feels like a keepsake.</h2>
        <p className="lp-band-sub">
          Envelope openings, storybook reveals, living backgrounds — DreamySuite
          ships a motion system built for moments that matter, not just another
          template.
        </p>
        <Link
          href={authed ? "/sites" : "/signup"}
          className="lp-btn lp-btn-primary lp-btn-lg"
        >
          {authed ? "Go to your sites" : "Create yours"}
        </Link>
      </section>

      <footer className="lp-footer">
        <span className="lp-logo lp-logo-sm">DreamySuite</span>
        <span className="lp-footer-note">
          Made for the moments worth remembering.
        </span>
      </footer>
    </main>
  );
}

const CSS = `
.lp{--gold:#B8921A;--ink:#292524;--muted:#78716c;--cream:#faf8f5;--line:#eae4db;
  min-height:100dvh;background:var(--cream);color:var(--ink);
  font-family:'Inter',system-ui,sans-serif;-webkit-font-smoothing:antialiased;}
.lp *{box-sizing:border-box;}
.lp-nav{display:flex;align-items:center;justify-content:space-between;
  max-width:1100px;margin:0 auto;padding:1.5rem 1.5rem;}
.lp-logo{font-family:'Cormorant Garamond','Playfair Display',serif;font-size:1.5rem;
  font-weight:600;letter-spacing:.01em;}
.lp-logo-sm{font-size:1.25rem;}
.lp-nav-actions{display:flex;align-items:center;gap:1rem;}
.lp-link{color:var(--ink);text-decoration:none;font-size:.9375rem;
  background:none;border:none;padding:0;cursor:pointer;font-family:inherit;}
.lp-link:hover{color:var(--gold);}
.lp-btn{display:inline-flex;align-items:center;justify-content:center;
  border-radius:999px;font-size:.9375rem;font-weight:500;text-decoration:none;
  padding:.55rem 1.25rem;transition:opacity .15s,transform .15s;cursor:pointer;border:1px solid transparent;}
.lp-btn:hover{transform:translateY(-1px);}
.lp-btn-primary{background:var(--gold);color:#fff;}
.lp-btn-primary:hover{opacity:.9;}
.lp-btn-ghost{background:transparent;color:var(--ink);border-color:var(--line);}
.lp-btn-ghost:hover{border-color:var(--gold);color:var(--gold);}
.lp-btn-lg{padding:.8rem 1.75rem;font-size:1rem;}
.lp-hero{max-width:780px;margin:0 auto;padding:4.5rem 1.5rem 4rem;text-align:center;}
.lp-eyebrow{text-transform:uppercase;letter-spacing:.2em;font-size:.75rem;
  color:var(--gold);margin:0 0 1.25rem;font-weight:600;}
.lp-eyebrow-light{color:rgba(255,255,255,.8);}
.lp-title{font-family:'Cormorant Garamond','Playfair Display',serif;
  font-weight:600;font-size:clamp(2.5rem,7vw,4.25rem);line-height:1.05;margin:0 0 1.5rem;
  letter-spacing:-.01em;}
.lp-sub{font-size:1.125rem;line-height:1.7;color:var(--muted);max-width:560px;margin:0 auto 2rem;}
.lp-cta-row{display:flex;gap:.875rem;justify-content:center;flex-wrap:wrap;}
.lp-trust{margin-top:1.5rem;font-size:.8125rem;color:var(--muted);}
.lp-section{max-width:1100px;margin:0 auto;padding:3rem 1.5rem 4rem;}
.lp-h2{font-family:'Cormorant Garamond','Playfair Display',serif;font-weight:600;
  font-size:clamp(1.75rem,4vw,2.5rem);text-align:center;margin:0 0 2.5rem;}
.lp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;}
.lp-card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:1.75rem;}
.lp-card-icon{color:var(--gold);margin-bottom:1rem;}
.lp-card-title{font-size:1.0625rem;font-weight:600;margin:0 0 .5rem;}
.lp-card-body{font-size:.9375rem;line-height:1.6;color:var(--muted);margin:0;}
.lp-band{background:linear-gradient(160deg,#3a2f1a,#1c1710);color:#fff;text-align:center;
  padding:5rem 1.5rem;}
.lp-band-title{font-family:'Cormorant Garamond','Playfair Display',serif;font-weight:600;
  font-size:clamp(2rem,5vw,3rem);margin:0 0 1rem;}
.lp-band-sub{font-size:1.0625rem;line-height:1.7;color:rgba(255,255,255,.75);
  max-width:560px;margin:0 auto 2rem;}
.lp-footer{max-width:1100px;margin:0 auto;padding:2.5rem 1.5rem;display:flex;
  align-items:center;justify-content:space-between;flex-wrap:wrap;gap:.75rem;
  border-top:1px solid var(--line);}
.lp-footer-note{font-size:.875rem;color:var(--muted);font-style:italic;
  font-family:'Cormorant Garamond',serif;}
@media (max-width:600px){.lp-hero{padding-top:3rem;}}
`;
