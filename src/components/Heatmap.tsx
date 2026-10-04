import { shiftDay, utcToday } from "@/lib/platform/dates";

const WEEKS = 26;

function level(points: number): 0 | 1 | 2 | 3 | 4 {
  if (points <= 0) return 0;
  if (points === 1) return 1;
  if (points < 5) return 2;
  if (points < 10) return 3;
  return 4;
}

/** A calendar of the last six months. Each square is a day; deeper colour means more points. */
export function Heatmap({ activity, today = utcToday() }: { activity: Record<string, number>; today?: string }) {
  const end = new Date(`${today}T00:00:00Z`);
  const lastColumnStart = shiftDay(today, -end.getUTCDay());
  const start = shiftDay(lastColumnStart, -(WEEKS - 1) * 7);

  const cells: { day: string; points: number; future: boolean; col: number }[] = [];
  for (let col = 0; col < WEEKS; col += 1) {
    for (let row = 0; row < 7; row += 1) {
      const day = shiftDay(start, col * 7 + row);
      cells.push({ day, points: activity[day] ?? 0, future: day > today, col });
    }
  }
  const active = cells.filter((c) => c.points > 0).length;

  return (
    <div>
      <div className="heat-scroll">
        <div className="heat" role="img" aria-label={`${active} active days in the last six months`}>
          {cells.map((cell) => (
            <span
              key={cell.day}
              className={`heat-cell l${cell.future ? 0 : level(cell.points)}${cell.future ? " future" : ""}`}
              style={{ animationDelay: `${cell.col * 18}ms` }}
              title={cell.future ? undefined : `${cell.day}: ${cell.points} point${cell.points === 1 ? "" : "s"}`}
            />
          ))}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
        <span>
          {active} active day{active === 1 ? "" : "s"} in the last 6 months
        </span>
        <span className="heat-legend">
          Less <i className="heat-cell l0" /> <i className="heat-cell l1" /> <i className="heat-cell l2" />{" "}
          <i className="heat-cell l3" /> <i className="heat-cell l4" /> More
        </span>
      </div>
    </div>
  );
}
