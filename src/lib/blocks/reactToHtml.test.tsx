import { describe, it, expect } from "vitest";
import { renderReactToHtml } from "./reactToHtml";

// Proves React -> static HTML string works via the streaming renderer and that
// the output stays clean (no hydration markers), matching the old
// renderToStaticMarkup contract that the published zero-JS page depends on.
describe("renderReactToHtml", () => {
  it("renders a simple element to static markup", async () => {
    const html = await renderReactToHtml(
      <section className="block" data-block-id="x">
        <h1>Hi</h1>
      </section>,
    );
    expect(html).toBe(
      '<section class="block" data-block-id="x"><h1>Hi</h1></section>',
    );
  });

  it("emits no hydration markers or comment nodes", async () => {
    const html = await renderReactToHtml(<div>{["a", "b"]}</div>);
    expect(html).not.toContain("<!--");
    expect(html).toBe("<div>ab</div>");
  });
});
