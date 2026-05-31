export function sortEvents(events: any[]): any[] {
  return [...events].sort((a, b) => {
    const aTime = a.lastTimestamp ?? a.eventTime ?? '';
    const bTime = b.lastTimestamp ?? b.eventTime ?? '';
    return bTime.localeCompare(aTime);
  });
}
