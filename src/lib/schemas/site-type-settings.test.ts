import { describe, it, expect } from "vitest";
import {
  WeddingSettingsSchema,
  InsuranceAgentSettingsSchema,
  NonprofitSettingsSchema,
  TypeSettingsSchema,
  parseTypeSettings,
} from "./site-type-settings";

describe("site-type-settings", () => {
  describe("WeddingSettingsSchema", () => {
    it("should parse valid wedding settings", () => {
      const result = WeddingSettingsSchema.parse({
        siteType: "wedding",
        eventName: "John & Jane",
        eventDate: "2026-06-15",
        eventLocation: "Central Park",
      });

      expect(result.siteType).toBe("wedding");
      expect(result.eventName).toBe("John & Jane");
      expect(result.eventDate).toBe("2026-06-15");
      expect(result.eventLocation).toBe("Central Park");
    });

    it("should use defaults for missing fields", () => {
      const result = WeddingSettingsSchema.parse({
        siteType: "wedding",
      });

      expect(result.siteType).toBe("wedding");
      expect(result.eventName).toBeNull();
      expect(result.eventDate).toBeNull();
      expect(result.musicUrl).toBeNull();
    });

    it("should reject non-wedding siteType", () => {
      expect(() => {
        WeddingSettingsSchema.parse({
          siteType: "insurance_agent",
        });
      }).toThrow();
    });
  });

  describe("InsuranceAgentSettingsSchema", () => {
    it("should parse valid insurance agent settings", () => {
      const result = InsuranceAgentSettingsSchema.parse({
        siteType: "insurance_agent",
        agencyName: "Acme Insurance",
        licenseNumber: "LIC-12345",
      });

      expect(result.siteType).toBe("insurance_agent");
      expect(result.agencyName).toBe("Acme Insurance");
      expect(result.licenseNumber).toBe("LIC-12345");
    });
  });

  describe("NonprofitSettingsSchema", () => {
    it("should parse valid nonprofit settings", () => {
      const result = NonprofitSettingsSchema.parse({
        siteType: "nonprofit",
        organizationName: "Save the Whales",
        ein: "12-3456789",
      });

      expect(result.siteType).toBe("nonprofit");
      expect(result.organizationName).toBe("Save the Whales");
      expect(result.ein).toBe("12-3456789");
    });
  });

  describe("TypeSettingsSchema", () => {
    it("should discriminate wedding settings", () => {
      const result = TypeSettingsSchema.parse({
        siteType: "wedding",
        eventName: "Test Wedding",
      });

      expect(result.siteType).toBe("wedding");
      if (result.siteType === "wedding") {
        expect(result.eventName).toBe("Test Wedding");
      }
    });

    it("should discriminate insurance agent settings", () => {
      const result = TypeSettingsSchema.parse({
        siteType: "insurance_agent",
        agencyName: "Test Agency",
      });

      expect(result.siteType).toBe("insurance_agent");
      if (result.siteType === "insurance_agent") {
        expect(result.agencyName).toBe("Test Agency");
      }
    });

    it("should reject invalid siteType", () => {
      expect(() => {
        TypeSettingsSchema.parse({
          siteType: "invalid",
        });
      }).toThrow();
    });
  });

  describe("parseTypeSettings", () => {
    it("should parse JSON string", () => {
      const json = JSON.stringify({
        eventName: "Test Event",
        eventDate: "2026-07-01",
      });

      const result = parseTypeSettings("wedding", json);

      expect(result.siteType).toBe("wedding");
      if (result.siteType === "wedding") {
        expect(result.eventName).toBe("Test Event");
        expect(result.eventDate).toBe("2026-07-01");
      }
    });

    it("should parse object", () => {
      const obj = {
        eventName: "Test Event",
        eventDate: "2026-07-01",
      };

      const result = parseTypeSettings("wedding", obj);

      expect(result.siteType).toBe("wedding");
      if (result.siteType === "wedding") {
        expect(result.eventName).toBe("Test Event");
      }
    });
  });
});
