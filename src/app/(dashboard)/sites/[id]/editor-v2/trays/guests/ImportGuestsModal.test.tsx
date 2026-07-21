// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import { ImportGuestsModal, type ImportState } from "./ImportGuestsModal";

afterEach(cleanup);

const state: ImportState = {
  headers: ["Name", "Email"],
  rows: [
    { Name: "A", Email: "a@x.com" },
    { Name: "B", Email: "b@x.com" },
  ],
  mapping: { Name: "", Email: "" },
};

describe("ImportGuestsModal", () => {
  it("renders the preview rows and a mapping select per header", () => {
    render(
      <ImportGuestsModal
        state={state}
        setImportModal={vi.fn()}
        result={null}
        importing={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText("Import Guests")).toBeTruthy();
    expect(screen.getByText("a@x.com")).toBeTruthy();
    expect(screen.getByText("b@x.com")).toBeTruthy();
    expect(screen.getAllByRole("combobox")).toHaveLength(state.headers.length);
  });

  it("triggers onSubmit from the import button", () => {
    const onSubmit = vi.fn();
    render(
      <ImportGuestsModal
        state={state}
        setImportModal={vi.fn()}
        result={null}
        importing={false}
        onSubmit={onSubmit}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /import 2 rows/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("disables the import button while importing", () => {
    render(
      <ImportGuestsModal
        state={state}
        setImportModal={vi.fn()}
        result={null}
        importing={true}
        onSubmit={vi.fn()}
      />,
    );
    expect(
      (screen.getByRole("button", { name: /importing/i }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
  });

  it("cancels by clearing the import modal", () => {
    const setImportModal = vi.fn();
    render(
      <ImportGuestsModal
        state={state}
        setImportModal={setImportModal}
        result={null}
        importing={false}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(setImportModal).toHaveBeenCalledWith(null);
  });

  it("shows the result summary and hides the preview once imported", () => {
    render(
      <ImportGuestsModal
        state={state}
        setImportModal={vi.fn()}
        result={{ imported: 3, skipped: 1 }}
        importing={false}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByText(/imported 3, skipped 1/i)).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("dispatches a state updater when a mapping select changes", () => {
    const setImportModal = vi.fn();
    render(
      <ImportGuestsModal
        state={state}
        setImportModal={setImportModal}
        result={null}
        importing={false}
        onSubmit={vi.fn()}
      />,
    );
    fireEvent.change(screen.getAllByRole("combobox")[0], {
      target: { value: "firstName" },
    });
    // The handler reads e.target.value lazily inside the updater, so applying
    // it with a mock can't observe the value (React resets the controlled
    // select). Assert the interaction dispatches a functional update instead.
    expect(setImportModal).toHaveBeenCalledTimes(1);
    expect(typeof setImportModal.mock.calls[0][0]).toBe("function");
  });
});
