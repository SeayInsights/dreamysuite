// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { CategoryManagerModal } from "./CategoryManagerModal";
import type { Guest } from "./model";

afterEach(cleanup);

const guestIn = (category: string) => ({ category }) as unknown as Guest;
const newCatInput = () => screen.getByPlaceholderText(/new category/i);

describe("CategoryManagerModal", () => {
  it("renders the category list", () => {
    render(
      <CategoryManagerModal
        categories={["Family", "Friends"]}
        guests={[]}
        onSaveCategories={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Family")).toBeTruthy();
    expect(screen.getByText("Friends")).toBeTruthy();
  });

  it("adds a new category on Enter", () => {
    const onSaveCategories = vi.fn();
    render(
      <CategoryManagerModal
        categories={["Family"]}
        guests={[]}
        onSaveCategories={onSaveCategories}
        onClose={vi.fn()}
      />,
    );
    fireEvent.change(newCatInput(), { target: { value: "VIPs" } });
    fireEvent.keyDown(newCatInput(), { key: "Enter" });
    expect(onSaveCategories).toHaveBeenCalledWith(["Family", "VIPs"]);
  });

  it("ignores empty and duplicate additions", () => {
    const onSaveCategories = vi.fn();
    render(
      <CategoryManagerModal
        categories={["Family"]}
        guests={[]}
        onSaveCategories={onSaveCategories}
        onClose={vi.fn()}
      />,
    );
    // empty
    fireEvent.keyDown(newCatInput(), { key: "Enter" });
    // duplicate
    fireEvent.change(newCatInput(), { target: { value: "Family" } });
    fireEvent.keyDown(newCatInput(), { key: "Enter" });
    expect(onSaveCategories).not.toHaveBeenCalled();
  });

  it("deletes an unused category", () => {
    const onSaveCategories = vi.fn();
    render(
      <CategoryManagerModal
        categories={["Solo"]}
        guests={[]}
        onSaveCategories={onSaveCategories}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByTitle("Delete"));
    expect(onSaveCategories).toHaveBeenCalledWith([]);
  });

  it("blocks deletion of an in-use category", () => {
    const onSaveCategories = vi.fn();
    render(
      <CategoryManagerModal
        categories={["Family"]}
        guests={[guestIn("Family")]}
        onSaveCategories={onSaveCategories}
        onClose={vi.fn()}
      />,
    );
    const del = screen.getByTitle("In use") as HTMLButtonElement;
    expect(del.disabled).toBe(true);
    fireEvent.click(del);
    expect(onSaveCategories).not.toHaveBeenCalled();
  });

  it("renames a category", () => {
    const onSaveCategories = vi.fn();
    render(
      <CategoryManagerModal
        categories={["Family", "Friends"]}
        guests={[]}
        onSaveCategories={onSaveCategories}
        onClose={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByText("Family")); // enter rename mode
    const input = screen.getByDisplayValue("Family");
    fireEvent.change(input, { target: { value: "Kin" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onSaveCategories).toHaveBeenCalledWith(["Kin", "Friends"]);
  });

  it("closes via Done", () => {
    const onClose = vi.fn();
    render(
      <CategoryManagerModal
        categories={[]}
        guests={[]}
        onSaveCategories={vi.fn()}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
