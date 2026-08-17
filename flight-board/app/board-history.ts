export const BOARD_PHASES = ["Sense", "Frame", "Engineer", "Evaluate", "Release", "Observe", "Learn"] as const;
export const RECENT_COMPLETION_DAYS = 7;

export type BoardItemRecord = {
  id: number;
  key: string;
  title: string;
  description?: string | null;
  phase: string;
  priority?: string | null;
  workflow?: string | null;
  state: string;
  assignee_name?: string | null;
  created_at?: string | null;
  closed_at?: string | null;
};

export type BoardActivityRecord = {
  id: number;
  item_id: number;
  action: string;
  detail: string;
  created_at: string;
};

export type PhaseTimelineEntry = {
  phase: string;
  enteredAt: string | null;
  status: "Observed" | "Not recorded";
  isCurrent: boolean;
};

export type PhaseTimeline = {
  entries: PhaseTimelineEntry[];
  completionTime: string | null;
};

const dayMs = 24 * 60 * 60 * 1000;

function timestamp(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function itemActivity(itemId: number, activity: BoardActivityRecord[]) {
  return activity.filter((event) => event.item_id === itemId);
}

function completedStateEvent(event: BoardActivityRecord) {
  return /(?:^|\s·\s)state\s*→\s*complete(?:$|\s·\s)/i.test(event.detail);
}

export function completionTime(
  item: BoardItemRecord,
  activity: BoardActivityRecord[],
  now: Date = new Date(),
) {
  if (item.state !== "complete") return null;
  const nowMs = now.getTime();
  const closedAt = timestamp(item.closed_at);
  if (closedAt !== null && closedAt <= nowMs) return item.closed_at ?? null;

  const observed = itemActivity(item.id, activity)
    .filter(completedStateEvent)
    .map((event) => ({ event, time: timestamp(event.created_at) }))
    .filter((candidate): candidate is { event: BoardActivityRecord; time: number } => candidate.time !== null && candidate.time <= nowMs)
    .sort((left, right) => right.time - left.time || right.event.id - left.event.id);
  return observed[0]?.event.created_at ?? null;
}

export function isRecentlyCompleted(
  item: BoardItemRecord,
  activity: BoardActivityRecord[],
  now: Date = new Date(),
  days = RECENT_COMPLETION_DAYS,
) {
  const completedAt = completionTime(item, activity, now);
  const completedMs = timestamp(completedAt);
  if (completedMs === null) return false;
  const nowMs = now.getTime();
  return completedMs <= nowMs && completedMs >= nowMs - days * dayMs;
}

export function matchesBoardSearch(item: BoardItemRecord, search: string) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return [item.key, item.title, item.description, item.assignee_name, item.phase, item.workflow]
    .some((value) => value?.toLowerCase().includes(term));
}

export function laneItems<T extends BoardItemRecord>(
  items: T[],
  activity: BoardActivityRecord[],
  phase: string,
  showCompleted: boolean,
  now: Date = new Date(),
) {
  const lane = items.filter((item) => item.phase === phase);
  const active = lane.filter((item) => item.state !== "complete");
  const completed = lane.filter((item) => item.state === "complete" && (showCompleted || isRecentlyCompleted(item, activity, now)));
  return { active, completed };
}

export function olderCompletedCount(
  items: BoardItemRecord[],
  activity: BoardActivityRecord[],
  now: Date = new Date(),
) {
  return items.filter((item) => item.state === "complete" && !isRecentlyCompleted(item, activity, now)).length;
}

function phaseFromCreatedEvent(event: BoardActivityRecord) {
  if (event.action !== "created") return null;
  const match = event.detail.match(/\bcreated in\s+(Sense|Frame|Engineer|Evaluate|Release|Observe|Learn)\b/i);
  if (!match) return null;
  return BOARD_PHASES.find((phase) => phase.toLowerCase() === match[1].toLowerCase()) ?? null;
}

function phaseFromTransition(event: BoardActivityRecord) {
  const match = event.detail.match(/(?:^|\s·\s)phase\s*→\s*(Sense|Frame|Engineer|Evaluate|Release|Observe|Learn)(?:$|\s·\s)/i);
  if (!match) return null;
  return BOARD_PHASES.find((phase) => phase.toLowerCase() === match[1].toLowerCase()) ?? null;
}

export function buildPhaseTimeline(
  item: BoardItemRecord,
  activity: BoardActivityRecord[],
  now: Date = new Date(),
): PhaseTimeline {
  const observed = new Map<string, { enteredAt: string; time: number; id: number }>();
  for (const event of itemActivity(item.id, activity)) {
    const phase = phaseFromTransition(event) ?? phaseFromCreatedEvent(event);
    const time = timestamp(event.created_at);
    if (!phase || time === null || time > now.getTime()) continue;
    const existing = observed.get(phase);
    if (!existing || time < existing.time || (time === existing.time && event.id < existing.id)) {
      observed.set(phase, { enteredAt: event.created_at, time, id: event.id });
    }
  }

  const recorded = BOARD_PHASES
    .filter((phase) => observed.has(phase))
    .map((phase) => ({ phase, ...observed.get(phase)! }))
    .sort((left, right) => left.time - right.time || left.id - right.id || BOARD_PHASES.indexOf(left.phase) - BOARD_PHASES.indexOf(right.phase))
    .map<PhaseTimelineEntry>(({ phase, enteredAt }) => ({ phase, enteredAt, status: "Observed", isCurrent: phase === item.phase }));
  const missing = BOARD_PHASES
    .filter((phase) => !observed.has(phase))
    .map<PhaseTimelineEntry>((phase) => ({ phase, enteredAt: null, status: "Not recorded", isCurrent: phase === item.phase }));

  return {
    entries: [...recorded, ...missing],
    completionTime: completionTime(item, activity, now),
  };
}
