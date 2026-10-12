import { describe, expect, test } from "bun:test";
import { participantUrl } from "./competition-poster";

describe("competition QR destination", () => {
  test("uses the current host and public participant lobby without MC credentials", () => {
    expect(participantUrl("https://goq.example", "ABC123")).toBe("https://goq.example/competitions/ABC123");
  });
});