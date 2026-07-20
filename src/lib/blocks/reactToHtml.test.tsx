import { describe, it, expect } from "vitest";
import { renderReactToHtml } from "./reactToHtml";

// Feasibility spike: prove React -> static HTML string works in this toolchain
// before building the presentational block components on top of it.
describe("renderReactToHtml (mechanism spike)", () => {
  it("renders a simple element to static markup", () => {
    const html = renderReactToHtml(
      <section className="block" data-block-id="x">
        <h1>Hi</h1>
      </section>,
    );
    expect(html).toBe(
      '<section class="block" data-block-id="x"><h1>Hi</h1></section>',
    );
  });

  it("emits no hydration markers or comment nodes", () => {
    const html = renderReactToHtml(<div>{["a", "b"]}</div>);
    expect(html).not.toContain("<!--");
    expect(html).toBe("<div>ab</div>");
  });
});
