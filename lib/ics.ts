import { createEvent } from 'ics';

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


