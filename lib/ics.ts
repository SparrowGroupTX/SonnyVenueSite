/**
 * ICS (iCalendar) file generation for calendar integration.
 * 
 * Generates ICS files that can be imported into calendar applications
 * (Google Calendar, Outlook, Apple Calendar, etc.) to add booking events.
 */
import { createEvent } from 'ics';

/**
 * Generates an ICS file for an all-day event.
 * 
 * Creates a calendar event file that can be attached to emails
 * so customers can easily add bookings to their calendars.
 * 
 * @param params - Event parameters
 * @param params.title - Event title
 * @param params.description - Optional event description
 * @param params.location - Optional venue address
 * @param params.startDate - Start date (inclusive) in YYYY-MM-DD format
 * @param params.endDateExclusive - End date (exclusive) in YYYY-MM-DD format
 * @param params.uid - Unique identifier for the event
 * @param params.url - Optional URL to booking management page
 * @returns ICS file content as string
 * @throws Error if ICS generation fails
 */
export function generateAllDayIcs(params: {
  title: string;
  description?: string;
  location?: string;
  startDate: string; // YYYY-MM-DD
  endDateExclusive: string; // YYYY-MM-DD
  uid: string;
  url?: string;
}) {
  const [sy, sm, sd] = params.startDate.split('-').map((n) => parseInt(n, 10));
  const [ey, em, ed] = params.endDateExclusive.split('-').map((n) => parseInt(n, 10));
  const { error, value } = createEvent({
    title: params.title,
    description: params.description,
    location: params.location,
    start: [sy, sm, sd],
    end: [ey, em, ed],
    uid: params.uid,
    url: params.url,
    startInputType: 'local',
    endInputType: 'local',
    productId: 'sonny-venue',
    busyStatus: 'BUSY',
    calName: 'Sonny Venue',
  });
  if (error) throw error;
  return value;
}


