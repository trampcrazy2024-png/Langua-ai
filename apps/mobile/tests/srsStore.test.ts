import { describe, it, expect, beforeEach } from "vitest";
import { getAllSrsCards, getDueCardIds, getSrsStats, recordSrsReview } from "../src/srsStore";

// These tests rely on a real `localStorage`, which srsStore.ts uses
// directly. The jsdom environment (see apps/mobile/vitest.config.ts)
// provides it, unlike the default "node" environment - running these
// under "node" would silently no-op every read/write (srsStore's
// try/catch swallows the ReferenceError) and the tests would pass
// without actually exercising persistence at all.
beforeEach(() => {
  localStorage.clear();
});

describe("SM-2 SRS store", () => {
  it("starts with no cards", () => {
    expect(getAllSrsCards()).toEqual({});
    expect(getDueCardIds()).toEqual([]);
  });

  it("a first good review schedules a 1-day interval", () => {
    const card = recordSrsReview("phrase-1", 95);
    expect(card.repetitions).toBe(1);
    expect(card.interval).toBe(1);
    expect(card.easeFactor).toBeGreaterThan(2.5);
  });

  it("a second consecutive good review schedules a 6-day interval", () => {
    recordSrsReview("phrase-1", 95);
    const card = recordSrsReview("phrase-1", 90);
    expect(card.repetitions).toBe(2);
    expect(card.interval).toBe(6);
  });

  it("interval grows by easeFactor from the third good review onward", () => {
    recordSrsReview("phrase-1", 95);
    const second = recordSrsReview("phrase-1", 90);
    const third = recordSrsReview("phrase-1", 90);
    expect(third.repetitions).toBe(3);
    expect(third.interval).toBe(Math.round(second.interval * second.easeFactor));
    // interval must have grown past the previous 6-day step
    expect(third.interval).toBeGreaterThan(second.interval);
  });

  it("a failing score resets repetitions and interval to 1 day", () => {
    recordSrsReview("phrase-1", 95);
    recordSrsReview("phrase-1", 90);
    const card = recordSrsReview("phrase-1", 20);
    expect(card.repetitions).toBe(0);
    expect(card.interval).toBe(1);
  });

  it("ease factor never drops below the SM-2 floor of 1.3", () => {
    let card = recordSrsReview("phrase-1", 0);
    for (let i = 0; i < 10; i++) {
      card = recordSrsReview("phrase-1", 0);
    }
    expect(card.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  it("a freshly reviewed card is due today", () => {
    recordSrsReview("phrase-1", 95);
    expect(getDueCardIds()).toContain("phrase-1");
  });

  it("getSrsStats reflects total and due counts", () => {
    recordSrsReview("phrase-1", 95);
    recordSrsReview("phrase-2", 30);
    const stats = getSrsStats();
    expect(stats.totalCards).toBe(2);
    expect(stats.dueToday).toBe(2);
    expect(stats.matureCards).toBe(0);
  });
});
