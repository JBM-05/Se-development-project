import { duplicateConflictFields } from "../../src/utils/duplicates";

describe("duplicate conflict mapping", () => {
  it("maps duplicate phone and email flags to field names", () => {
    expect(duplicateConflictFields({ phone: true, email: false })).toEqual(["phone"]);
    expect(duplicateConflictFields({ phone: false, email: true })).toEqual(["email"]);
    expect(duplicateConflictFields({ phone: true, email: true })).toEqual(["phone", "email"]);
    expect(duplicateConflictFields({ phone: false, email: false })).toEqual([]);
  });
});

