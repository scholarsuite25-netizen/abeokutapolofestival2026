/**
 * Committee readiness scoring (Phase 2 — readiness dashboard).
 * Pure functions: unit-tested, no I/O. Pages gather counts and call these.
 */

export interface ReadinessCounts {
  membersTotal: number;
  membersVerified: number;
  tasksTotal: number;
  tasksCompleted: number;
  meetingsTotal: number;
  meetingsHeld: number;
  decisionsTotal: number;
  decisionsApproved: number;
}

export interface ReadinessDimension {
  key: keyof ReadinessCounts | "responsibilities";
  label: string;
  numerator: number;
  denominator: number;
  percent: number;
}

export interface ReadinessReport {
  dimensions: ReadinessDimension[];
  overallPercent: number;
  band: "not_started" | "in_progress" | "nearly_ready" | "ready";
}

const clampPercent = (numerator: number, denominator: number): number => {
  if (denominator <= 0) return 0;
  return Math.min(100, Math.round((numerator / denominator) * 100));
};

export function computeReadiness(
  counts: ReadinessCounts,
  responsibilitiesApproved = 0,
  responsibilitiesTotal = 0,
): ReadinessReport {
  const dimensions: ReadinessDimension[] = [
    {
      key: "membersVerified",
      label: "Roster verified",
      numerator: counts.membersVerified,
      denominator: counts.membersTotal,
      percent: clampPercent(counts.membersVerified, counts.membersTotal),
    },
    {
      key: "tasksCompleted",
      label: "Tasks completed",
      numerator: counts.tasksCompleted,
      denominator: counts.tasksTotal,
      percent: clampPercent(counts.tasksCompleted, counts.tasksTotal),
    },
    {
      key: "meetingsHeld",
      label: "Meetings held",
      numerator: counts.meetingsHeld,
      denominator: counts.meetingsTotal,
      percent: clampPercent(counts.meetingsHeld, counts.meetingsTotal),
    },
    {
      key: "decisionsApproved",
      label: "Decisions approved",
      numerator: counts.decisionsApproved,
      denominator: counts.decisionsTotal,
      percent: clampPercent(counts.decisionsApproved, counts.decisionsTotal),
    },
    {
      key: "responsibilities",
      label: "Responsibilities approved",
      numerator: responsibilitiesApproved,
      denominator: responsibilitiesTotal,
      percent: clampPercent(responsibilitiesApproved, responsibilitiesTotal),
    },
  ];

  // Weight roster and tasks higher; empty dimensions contribute nothing.
  const weights: Record<string, number> = {
    membersVerified: 0.3,
    tasksCompleted: 0.25,
    meetingsHeld: 0.15,
    decisionsApproved: 0.15,
    responsibilities: 0.15,
  };

  const overallPercent = Math.round(
    dimensions.reduce((sum, d) => sum + d.percent * (weights[d.key] ?? 0.1), 0),
  );

  const band: ReadinessReport["band"] =
    overallPercent >= 90
      ? "ready"
      : overallPercent >= 60
        ? "nearly_ready"
        : overallPercent >= 20
          ? "in_progress"
          : "not_started";

  return { dimensions, overallPercent, band };
}

export const BAND_LABEL: Record<ReadinessReport["band"], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  nearly_ready: "Nearly ready",
  ready: "Ready",
};
