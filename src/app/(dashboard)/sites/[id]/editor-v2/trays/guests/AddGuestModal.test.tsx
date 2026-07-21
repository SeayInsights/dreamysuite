// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import { AddGuestModal } from "./AddGuestModal";

afterEach(cleanup);

const submitButton = () =>
  screen.getByRole("button", { name: "Add Guest" }) as HTMLButtonElement;

describe("AddGuestModal", () => {
  it("renders form fields and the passed categories", () => {
    render(
      <AddGuestModal
        categories={["Family", "Friends"]}
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("First Name")).toBeTruthy();
    expect(screen.getByLabelText("Email")).toBeTruthy();
    expect(screen.getByRole("option", { name: "Family" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Friends" })).toBeTruthy();
  });

  it("gates the submit button on a non-empty first name", () => {
    render(
      <AddGuestModal categories={[]} onClose={vi.fn()} onSubmit={vi.fn()} />,
    );
    expect(submitButton().disabled).toBe(true);
    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Sam" },
    });
    expect(submitButton().disabled).toBe(false);
  });

  it("submits the form data and closes on success", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(true);
    const { container } = render(
      <AddGuestModal categories={[]} onClose={onClose} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Sam" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "sam@example.com" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ firstName: "Sam", email: "sam@example.com" }),
    );
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it("stays open (does not close) when submit fails", async () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn().mockResolvedValue(false);
    const { container } = render(
      <AddGuestModal categories={[]} onClose={onClose} onSubmit={onSubmit} />,
    );

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Sam" },
    });
    fireEvent.submit(container.querySelector("form")!);

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    // saving resets, so the button returns to its enabled "Add Guest" state
    await waitFor(() => expect(submitButton().disabled).toBe(false));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("closes via the Cancel button without submitting", () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(
      <AddGuestModal categories={[]} onClose={onClose} onSubmit={onSubmit} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
