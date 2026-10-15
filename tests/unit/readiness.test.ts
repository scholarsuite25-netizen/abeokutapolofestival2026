import { describe, expect, it } from "vitest";
import { computeReadiness } from "@/lib/readiness";

const empty = {
  membersTotal: 0,
  membersVerified: 0,
  tasksTotal: 0,
  tasksCompleted: 0,
  meetingsTotal: 0,
  meetingsHeld: 0,
  decisionsTotal: 0,
  decisionsApproved: 0,
};

describe("computeReadiness", () => {
  it("returns 0 / not_started when everything is empty", () => {
    const report = computeReadiness(empty);
    expect(report.overallPercent).toBe(0);
    expect(report.band).toBe("not_started");
    expect(report.dimensions).toHaveLength(5);
  });

  it("returns 100 / ready when everything is complete", () => {
    const report = computeReadiness(
      {
        membersTotal: 5,
        membersVerified: 5,
        tasksTotal: 4,
        tasksCompleted: 4,
        meetingsTotal: 3,
        meetingsHeld: 3,
        decisionsTotal: 2,
        decisionsApproved: 2,
      },
      2,
      2,
    );
    expect(report.overallPercent).toBe(100);
    expect(report.band).toBe("ready");
  });

  it("clamps percentages and weights roster highest", () => {
    const report = computeReadiness(
      {
        membersTotal: 10,
        membersVerified: 10,
        tasksTotal: 10,
        tasksCompleted: 0,
        meetingsTotal: 0,
        meetingsHeld: 0,
        decisionsTotal: 0,
        decisionsApproved: 0,
      },
      0,
      0,
    );
    // membersVerified 100% * 0.3 = 30 → in_progress band
    expect(report.dimensions.find((d) => d.key === "membersVerified")?.percent).toBe(100);
    expect(report.dimensions.find((d) => d.key === "meetingsHeld")?.percent).toBe(0);
    expect(report.overallPercent).toBe(30);
    expect(report.band).toBe("in_progress");
  });
});
