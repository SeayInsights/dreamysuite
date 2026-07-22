import { describe, it, expect } from "vitest";
import { buildStyles } from "./styles";

describe("published typography", () => {
  it("left-aligns long-form body copy (.text-body)", () => {
    const { css } = buildStyles(null);
    expect(css).toMatch(/\.text-body\s*\{[^}]*text-align:\s*left/);
    // the block still centers on the page
    expect(css).toMatch(/\.text-body\s*\{[^}]*margin:\s*0 auto/);
  });
});
