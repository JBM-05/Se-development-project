import { normalizeEmail, normalizePhone, validateAge } from "../../src/utils/normalization";

describe("normalization helpers", () => {
  it("normalizes email to lowercase trimmed value", () => {
    expect(normalizeEmail("  ALI@Example.COM ")).toBe("ali@example.com");
  });

  it("normalizes Libyan phone numbers to E.164", () => {
    expect(normalizePhone("0912345678", "LY")).toBe("+218912345678");
  });

  it("validates age settings", () => {
    expect(validateAge(18, 18, 100)).toBe(true);
    expect(validateAge(100, 18, 100)).toBe(true);
    expect(validateAge(17, 18, 100)).toBe(false);
    expect(validateAge(101, 18, 100)).toBe(false);
  });
});

