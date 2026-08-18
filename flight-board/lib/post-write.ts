type TimestampedItem = { id: number; updated_at: string; dispatch_updated_at?: string | null };
type Identified = { id: number };

export type AuthoritativeItemSnapshot<Item extends TimestampedItem, Activity extends Identified, EconomicsEvent extends Identified> = {
  generated_at: string;
  item: Item;
  activity: Activity[];
  work_economics_events: EconomicsEvent[];
};

type BootstrapState<Item extends TimestampedItem, Activity extends Identified, EconomicsEvent extends Identified> = {
  generated_at: string;
  items: Item[];
  activity: Activity[];
  work_economics_events: EconomicsEvent[];
};

function mergeById<T extends Identified>(preferred: T[], fallback: T[]) {
  const seen = new Set<number>();
  return [...preferred, ...fallback].filter((entry) => {
    if (seen.has(entry.id)) return false;
    seen.add(entry.id);
    return true;
  });
}

function isNewer(left: TimestampedItem, right: TimestampedItem) {
  const freshness = (item: TimestampedItem) => Math.max(
    Date.parse(item.updated_at) || 0,
    item.dispatch_updated_at ? Date.parse(item.dispatch_updated_at) || 0 : 0,
  );
  return freshness(left) > freshness(right);
}

export function isLatestItemAction(latestActionId: number | undefined, resultActionId: number) {
  return latestActionId === resultActionId;
}

export function applyAuthoritativeSnapshot<
  State extends BootstrapState<Item, Activity, EconomicsEvent>,
  Item extends TimestampedItem,
  Activity extends Identified,
  EconomicsEvent extends Identified,
>(state: State, snapshot: AuthoritativeItemSnapshot<Item, Activity, EconomicsEvent>): State {
  return {
    ...state,
    generated_at: snapshot.generated_at,
    items: state.items.map((item) => item.id === snapshot.item.id ? snapshot.item : item),
    activity: mergeById(snapshot.activity, state.activity),
    work_economics_events: mergeById(snapshot.work_economics_events, state.work_economics_events),
  };
}

export function mergeBootstrapPreservingNewerItems<
  State extends BootstrapState<Item, Activity, EconomicsEvent>,
  Item extends TimestampedItem,
  Activity extends Identified,
  EconomicsEvent extends Identified,
>(current: State, incoming: State): State {
  const currentById = new Map(current.items.map((item) => [item.id, item]));
  return {
    ...incoming,
    items: incoming.items.map((item) => {
      const confirmed = currentById.get(item.id);
      return confirmed && isNewer(confirmed, item) ? confirmed : item;
    }),
    activity: mergeById(incoming.activity, current.activity),
    work_economics_events: mergeById(incoming.work_economics_events, current.work_economics_events),
  };
}
