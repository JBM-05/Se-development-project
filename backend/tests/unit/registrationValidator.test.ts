import { registrationSchema } from "../../src/validators/registrationValidator";

describe("registration validator", () => {
  it("rejects full names with fewer than three words", () => {
    const result = registrationSchema.safeParse({
      fullName: "Ali Salem",
      age: 24,
      major: "Architecture Engineering",
      phone: "+218912345678",
      email: "ali@example.com",
      city: "Tripoli"
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.fullName?.[0]).toContain("at least three words");
    }
  });
});

