export interface ParsedIcalEvent {
  uid: string;
  summary: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  description?: string;
  source: string;
}

/**
 * Parses raw iCalendar (RFC 5545) text feeds into structured reservation blocks.
 * Formats supported:
 *   DTSTART;VALUE=DATE:20261105
 *   DTSTART:20261105T140000Z
 *   DTEND;VALUE=DATE:20261107
 */
export function parseICalFeed(icalText: string, defaultSource: string = "airbnb"): ParsedIcalEvent[] {
  const events: ParsedIcalEvent[] = [];
  
  // Unfold lines (RFC 5545 allows multiline splitting with CRLF + space/tab)
  const unfolded = icalText.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
  const lines = unfolded.split(/\r?\n/);

  let inVEvent = false;
  let currentUid = "";
  let currentSummary = "Reserved / Blocked on OTA";
  let currentStart = "";
  let currentEnd = "";
  let currentDesc = "";

  const parseDateStr = (rawVal: string): string | null => {
    // Extract numbers: YYYYMMDD or YYYYMMDDTHHMMSSZ
    const match = rawVal.match(/(\d{4})(\d{2})(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return `${y}-${m}-${d}`;
    }
    return null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === "BEGIN:VEVENT") {
      inVEvent = true;
      currentUid = "";
      currentSummary = "Reserved / Blocked on OTA";
      currentStart = "";
      currentEnd = "";
      currentDesc = "";
      continue;
    }

    if (trimmed === "END:VEVENT") {
      if (inVEvent && currentStart && currentEnd) {
        // UID fallback if missing
        const uid = currentUid || `ical-${currentStart}-${currentEnd}-${Date.now()}`;
        events.push({
          uid,
          summary: currentSummary,
          checkIn: currentStart,
          checkOut: currentEnd,
          description: currentDesc,
          source: defaultSource,
        });
      }
      inVEvent = false;
      continue;
    }

    if (!inVEvent) continue;

    const colonIdx = trimmed.indexOf(":");
    if (colonIdx === -1) continue;

    const propFull = trimmed.slice(0, colonIdx);
    const value = trimmed.slice(colonIdx + 1);
    const propName = propFull.split(";")[0].toUpperCase();

    if (propName === "UID") {
      currentUid = value;
    } else if (propName === "SUMMARY") {
      currentSummary = value;
    } else if (propName === "DESCRIPTION") {
      currentDesc = value;
    } else if (propName === "DTSTART") {
      const parsed = parseDateStr(value);
      if (parsed) currentStart = parsed;
    } else if (propName === "DTEND") {
      const parsed = parseDateStr(value);
      if (parsed) currentEnd = parsed;
    }
  }

  return events;
}
