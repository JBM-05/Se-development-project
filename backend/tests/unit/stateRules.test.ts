import { AppError } from "../../src/utils/errors";
import { assertStateCanBeDeleted } from "../../src/utils/stateRules";

describe("state deletion rules", () => {
  it("rejects deleting system states", () => {
    expect(() =>
      assertStateCanBeDeleted({ isSystem: true, linkedCount: 0, stateId: "state-1" })
    ).toThrow(AppError);
  });

  it("rejects linked states without a transfer target", () => {
    expect(() =>
      assertStateCanBeDeleted({ isSystem: false, linkedCount: 2, stateId: "state-1" })
    ).toThrow("Linked states require transferToStateId");
  });

  it("allows linked states with a different transfer target", () => {
    expect(() =>
      assertStateCanBeDeleted({
        isSystem: false,
        linkedCount: 2,
        stateId: "state-1",
        transferToStateId: "state-2"
      })
    ).not.toThrow();
  });
});

