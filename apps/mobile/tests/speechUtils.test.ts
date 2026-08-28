import { describe, it, expect } from "vitest";
import {
  similarityScore,
  fuzzyIncludes,
  levenshtein,
  normalizeForCompare
} from "../src/speechUtils";

describe("normalizeForCompare", () => {
  it("strips Arabic diacritics (tashkeel)", () => {
    expect(normalizeForCompare("مَرْحَبًا")).toBe(normalizeForCompare("مرحبا"));
  });

  it("normalizes alef/yeh/teh-marbuta variants", () => {
    expect(normalizeForCompare("إأآا")).toBe("ا".repeat(4));
    expect(normalizeForCompare("مدرسة")).toBe("مدرسه");
  });

  it("strips punctuation and collapses whitespace", () => {
    expect(normalizeForCompare("سلام،   دنیا!")).toBe("سلام دنیا");
  });
});

describe("levenshtein", () => {
  it("is 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0);
  });

  it("counts a single substitution as distance 1", () => {
    expect(levenshtein("cat", "bat")).toBe(1);
  });

  it("handles empty strings", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });
});

describe("similarityScore", () => {
  it("returns 100 for an identical phrase", () => {
    expect(similarityScore("سلام", "سلام")).toBe(100);
  });

  it("returns 100 for two empty strings (nothing to compare)", () => {
    expect(similarityScore("", "")).toBe(100);
  });

  it("is diacritic-insensitive", () => {
    expect(similarityScore("مَرْحَبًا", "مرحبا")).toBe(100);
  });

  it("returns a low score for unrelated phrases", () => {
    expect(similarityScore("سلام", "بغداد")).toBeLessThan(60);
  });

  it("never returns a negative score for very different lengths", () => {
    expect(similarityScore("a", "a very long unrelated sentence")).toBeGreaterThanOrEqual(0);
  });
});

describe("fuzzyIncludes", () => {
  it("matches an exact substring", () => {
    expect(fuzzyIncludes("رستوران خوب", "رستوران")).toBe(true);
  });

  it("tolerates a small typo via edit distance", () => {
    expect(fuzzyIncludes("رستوران خوب", "رستوان")).toBe(true);
  });

  it("rejects unrelated queries", () => {
    expect(fuzzyIncludes("رستوران خوب", "هواپیما")).toBe(false);
  });

  it("treats an empty query as matching everything", () => {
    expect(fuzzyIncludes("anything", "")).toBe(true);
  });
});
