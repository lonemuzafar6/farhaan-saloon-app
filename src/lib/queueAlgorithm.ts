import { Barber, QueueEntry, Appointment, WaitTimeEstimate } from '../types';

/**
 * Calculates real-time estimated wait time range for a specific barber based on:
 * 1. Active customer in service (duration minus elapsed time)
 * 2. Waiting customers in queue ahead
 * 3. Buffer factor (±15% variance range)
 */
export function calculateBarberWaitTime(
  barber: Barber,
  queueEntries: QueueEntry[],
  appointments: Appointment[] = [],
  currentTime: Date = new Date()
): WaitTimeEstimate {
  // If barber is unavailable
  if (barber.current_status === 'unavailable') {
    return {
      barber_id: barber.id,
      barber_name: barber.name,
      queue_length: 0,
      min_wait_mins: 0,
      max_wait_mins: 0,
      active_service_remaining_mins: 0,
      status: 'unavailable',
    };
  }

  // If barber is on break
  let breakRemainingMins = 0;
  if (barber.current_status === 'on_break' && barber.break_ends_at) {
    const breakEnd = new Date(barber.break_ends_at);
    const diffMs = breakEnd.getTime() - currentTime.getTime();
    breakRemainingMins = Math.max(0, Math.ceil(diffMs / (1000 * 60)));
  }

  // Active customer currently in chair
  const activeEntry = queueEntries.find(
    (q) => q.barber_id === barber.id && q.status === 'in_service'
  );

  let activeServiceRemainingMins = 0;
  if (activeEntry) {
    const expectedDuration = activeEntry.service_price ? 25 : barber.avg_service_mins;
    if (activeEntry.started_at) {
      const started = new Date(activeEntry.started_at);
      const elapsedMins = Math.floor((currentTime.getTime() - started.getTime()) / (1000 * 60));
      activeServiceRemainingMins = Math.max(5, expectedDuration - elapsedMins);
    } else {
      activeServiceRemainingMins = expectedDuration;
    }
  }

  // Waiting customers in this barber's queue (ordered by priority/time)
  const waitingEntries = queueEntries
    .filter((q) => q.barber_id === barber.id && q.status === 'waiting')
    .sort((a, b) => a.priority_order - b.priority_order);

  // Sum durations of all waiting customers ahead
  const waitingMins = waitingEntries.reduce((sum, entry) => {
    return sum + (barber.avg_service_mins || 25);
  }, 0);

  // Check upcoming appointments for this barber within the next 2 hours
  const todayStr = currentTime.toISOString().split('T')[0];
  const upcomingApts = appointments.filter((apt) => {
    return (
      apt.barber_id === barber.id &&
      apt.appointment_date === todayStr &&
      (apt.status === 'confirmed' || apt.status === 'in_service')
    );
  });
  const aptBufferMins = upcomingApts.length > 0 ? upcomingApts.length * 5 : 0;

  const totalCalculatedMins = breakRemainingMins + activeServiceRemainingMins + waitingMins + aptBufferMins;

  if (totalCalculatedMins === 0) {
    return {
      barber_id: barber.id,
      barber_name: barber.name,
      queue_length: 0,
      min_wait_mins: 0,
      max_wait_mins: 5,
      active_service_remaining_mins: 0,
      status: barber.current_status,
    };
  }

  // Create realistic bounds: minimum is -15%, maximum is +20% with min range of 5 mins
  const minWait = Math.max(0, Math.floor(totalCalculatedMins * 0.85));
  const maxWait = Math.max(minWait + 5, Math.ceil(totalCalculatedMins * 1.2));

  return {
    barber_id: barber.id,
    barber_name: barber.name,
    queue_length: waitingEntries.length + (activeEntry ? 1 : 0),
    min_wait_mins: minWait,
    max_wait_mins: maxWait,
    active_service_remaining_mins: activeServiceRemainingMins,
    status: barber.current_status,
  };
}

/**
 * "Any Available Barber" logic:
 * Compares current estimated waiting time, active status, and queue depth
 * among active, available barbers, picking the one that gets the customer served earliest.
 */
export function selectBestAvailableBarber(
  barbers: Barber[],
  queueEntries: QueueEntry[],
  appointments: Appointment[] = []
): Barber | null {
  const activeBarbers = barbers.filter(
    (b) => b.is_active && b.current_status !== 'unavailable'
  );

  if (activeBarbers.length === 0) return null;

  // 1. Look for currently available barbers with 0 waiting queue
  const completelyFree = activeBarbers.find((b) => {
    if (b.current_status !== 'available') return false;
    const hasActive = queueEntries.some(
      (q) => q.barber_id === b.id && (q.status === 'in_service' || q.status === 'waiting')
    );
    return !hasActive;
  });

  if (completelyFree) return completelyFree;

  // 2. Otherwise calculate wait times for all eligible barbers
  const evaluated = activeBarbers.map((b) => {
    const estimate = calculateBarberWaitTime(b, queueEntries, appointments);
    return {
      barber: b,
      estimate,
    };
  });

  // Sort ascending by minimum estimated wait, then by queue length
  evaluated.sort((a, b) => {
    if (a.estimate.min_wait_mins !== b.estimate.min_wait_mins) {
      return a.estimate.min_wait_mins - b.estimate.min_wait_mins;
    }
    return a.estimate.queue_length - b.estimate.queue_length;
  });

  return evaluated[0]?.barber || activeBarbers[0];
}

/**
 * Computes a customer's specific position in their assigned barber queue,
 * counting how many customers are ahead of them.
 */
export function calculateQueuePosition(
  entry: QueueEntry,
  allEntries: QueueEntry[]
): {
  position: number;
  peopleAhead: number;
  estimatedWaitRange: { min: number; max: number };
} {
  if (entry.status === 'in_service') {
    return {
      position: 1,
      peopleAhead: 0,
      estimatedWaitRange: { min: 0, max: 5 },
    };
  }

  if (entry.status !== 'waiting') {
    return {
      position: 0,
      peopleAhead: 0,
      estimatedWaitRange: { min: 0, max: 0 },
    };
  }

  // Active customer for this barber
  const hasActiveService = allEntries.some(
    (q) => q.barber_id === entry.barber_id && q.status === 'in_service'
  );

  // Waiting customers who joined before this customer or have higher priority
  const customersAhead = allEntries.filter((q) => {
    if (q.barber_id !== entry.barber_id || q.status !== 'waiting') return false;
    if (q.id === entry.id) return false;
    return q.priority_order < entry.priority_order || new Date(q.joined_at) < new Date(entry.joined_at);
  });

  const peopleAhead = customersAhead.length + (hasActiveService ? 1 : 0);
  const position = peopleAhead + 1;

  const baseMinutes = peopleAhead * 25;
  const minWait = Math.max(5, Math.floor(baseMinutes * 0.85));
  const maxWait = Math.max(minWait + 10, Math.ceil(baseMinutes * 1.25));

  return {
    position,
    peopleAhead,
    estimatedWaitRange: { min: minWait, max: maxWait },
  };
}

/**
 * Generates next sequential token string (e.g. F-103 or A-012)
 */
export function generateTokenNumber(
  barber: Barber | null,
  existingEntries: QueueEntry[]
): string {
  const prefix = barber ? barber.name.charAt(0).toUpperCase() : 'A';
  const matchingEntries = existingEntries.filter((e) => e.token_number.startsWith(prefix));
  const nextNum = 101 + matchingEntries.length;
  return `${prefix}-${nextNum}`;
}

/**
 * Checks appointment slot conflicts for online booking
 */
export function isSlotAvailable(
  barberId: string,
  dateStr: string,
  timeStr: string,
  durationMinutes: number,
  existingAppointments: Appointment[]
): boolean {
  const [slotH, slotM] = timeStr.split(':').map(Number);
  const slotStartMins = slotH * 60 + slotM;
  const slotEndMins = slotStartMins + durationMinutes;

  return !existingAppointments.some((apt) => {
    if (apt.barber_id !== barberId || apt.appointment_date !== dateStr) return false;
    if (apt.status === 'cancelled' || apt.status === 'no_show') return false;

    const [aptH, aptM] = apt.start_time.split(':').map(Number);
    const aptStartMins = aptH * 60 + aptM;
    const [endH, endM] = apt.end_time.split(':').map(Number);
    const aptEndMins = endH * 60 + endM;

    // Overlap condition
    return slotStartMins < aptEndMins && slotEndMins > aptStartMins;
  });
}
