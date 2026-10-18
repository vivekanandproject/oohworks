import { sendAlerts } from "./alerts";
import { remindAvailability } from "./availability";
import { readMediaKits } from "./media-kits";
import { refreshReplyTimes } from "./reply-times";

/**
 * The jobs that run on a timer, by name. Cloud Scheduler calls /api/jobs/{name}/ with CRON_SECRET
 * (infra/terraform); anything else may run one the same way.
 */
export const JOBS = {
  alerts: { every: "hour", run: () => sendAlerts() },
  availability: { every: "Monday at 09:30 in India", run: () => remindAvailability() },
  "reply-times": { every: "night at 03:00 in India", run: () => refreshReplyTimes() },
  "media-kits": { every: "ten minutes", run: () => readMediaKits() },
} as const;

export type JobName = keyof typeof JOBS;
