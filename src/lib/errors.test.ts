import { describe, expect, it } from "vitest";
import {
  AppError,
  DatabaseError,
  ForbiddenError,
  getErrorMessage,
  NetworkError,
  NotFoundError,
  RateLimitError,
  UnauthorizedError,
  ValidationError,
} from "./errors";

describe("AppError", () => {
  it("carries message, code, context and a class-derived name", () => {
    const err = new AppError("boom", "CUSTOM", { a: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe("boom");
    expect(err.code).toBe("CUSTOM");
    expect(err.context).toEqual({ a: 1 });
    expect(err.name).toBe("AppError");
  });

  it("serializes to JSON for telemetry", () => {
    const json = new AppError("boom", "CUSTOM", { a: 1 }).toJSON();
    expect(json).toMatchObject({
      name: "AppError",
      message: "boom",
      code: "CUSTOM",
      context: { a: 1 },
    });
    expect(json).toHaveProperty("stack");
  });
});

describe("AppError subclasses", () => {
  type ErrCtor = new (
    message: string,
    context?: Record<string, unknown>,
  ) => AppError;
  const cases: Array<[ErrCtor, string, string]> = [
    [ValidationError, "VALIDATION_ERROR", "ValidationError"],
    [DatabaseError, "DATABASE_ERROR", "DatabaseError"],
    [NetworkError, "NETWORK_ERROR", "NetworkError"],
    [NotFoundError, "NOT_FOUND", "NotFoundError"],
    [UnauthorizedError, "UNAUTHORIZED", "UnauthorizedError"],
    [ForbiddenError, "FORBIDDEN", "ForbiddenError"],
    [RateLimitError, "RATE_LIMIT_EXCEEDED", "RateLimitError"],
  ];

  for (const [Ctor, code, name] of cases) {
    it(`${name} sets code ${code} and is an AppError`, () => {
      const err = new Ctor("msg", { k: "v" });
      expect(err).toBeInstanceOf(AppError);
      expect(err).toBeInstanceOf(Error);
      expect(err.code).toBe(code);
      expect(err.name).toBe(name);
      expect(err.message).toBe("msg");
      expect(err.context).toEqual({ k: "v" });
    });
  }
});

describe("getErrorMessage", () => {
  it("extracts from Error instances", () => {
    expect(getErrorMessage(new Error("nope"))).toBe("nope");
    expect(getErrorMessage(new ValidationError("bad input"))).toBe("bad input");
  });

  it("returns string errors as-is", () => {
    expect(getErrorMessage("plain")).toBe("plain");
  });

  it("reads common API error-response shapes", () => {
    expect(getErrorMessage({ error: "api said no" })).toBe("api said no");
    expect(getErrorMessage({ error: { message: "nested" } })).toBe("nested");
    expect(getErrorMessage({ message: "top-level" })).toBe("top-level");
  });

  it("falls back to a generic message for unknown values", () => {
    for (const value of [42, null, undefined, {}, { error: 123 }]) {
      expect(getErrorMessage(value)).toBe("An unknown error occurred");
    }
  });
});
