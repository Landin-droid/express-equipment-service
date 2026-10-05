import { canTransition } from "../../src/services/statusTransitions.js";

describe("canTransition", () => {
  it.each([
    ["new", "in_progress", true],
    ["new", "rejected", true],
    ["in_progress", "done", true],
    ["in_progress", "rejected", true],
    ["new", "done", false],
    ["done", "in_progress", false],
    ["rejected", "new", false],
  ])("%s -> %s = %s", (from, to, expected) => {
    expect(canTransition(from, to)).toBe(expected);
  });
});
