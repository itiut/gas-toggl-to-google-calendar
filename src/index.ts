import { Client } from './toggl';
import { EntriesHash, sync } from './calendar';

export function run() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const togglApiToken = scriptProperties.getProperty('TOGGL_API_TOKEN');
  const calendarId = scriptProperties.getProperty('CALENDAR_ID');

  if (!togglApiToken) {
    throw new Error('Script property `TOGGL_API_TOKEN` is required.');
  }
  if (!calendarId) {
    throw new Error('Script property `CALENDAR_ID` is required.');
  }

  const calendar = CalendarApp.getCalendarById(calendarId);
  if (!calendar) {
    throw new Error("Can't access to the calendar: " + calendarId);
  }

  const syncDurationInDays =
    Math.max(
      Number(scriptProperties.getProperty('SYNC_DURATION_IN_HOURS')),
      0
    ) || 7;

  const now = new Date();
  const startTime = new Date(
    now.getTime() - 1000 * 60 * 60 * 24 * syncDurationInDays
  );

  const client = new Client(togglApiToken);
  const entries = client
    .getTimeEntries(startTime, now)
    .filter(entry => !entry.isRunning);

  const entriesHash = entries.reduce(
    (hash, entry) => {
      hash[String(entry.id)] = entry;
      return hash;
    },
    {} as EntriesHash
  );
  sync(calendar, startTime, now, entriesHash);
}
