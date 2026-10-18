import {
  calculateBarberWaitTime,
  selectBestAvailableBarber,
  calculateQueuePosition,
  generateTokenNumber,
  isSlotAvailable,
} from '../lib/queueAlgorithm';
import { Barber, QueueEntry, Appointment } from '../types';

export function runAutomatedTests() {
  const results: { test: string; passed: boolean; message?: string }[] = [];

  const mockBarber1: Barber = {
    id: 'barber-1',
    name: 'Farhaan Lone',
    photo_url: '',
    bio: '',
    experience_years: 10,
    specialties: ['Fade'],
    is_active: true,
    current_status: 'serving',
    avg_service_mins: 25,
    pin_code: '1111',
    working_hours: { start: '09:00', end: '21:00', days: ['Mon'] },
  };

  const mockBarber2: Barber = {
    id: 'barber-2',
    name: 'Sameer Khan',
    photo_url: '',
    bio: '',
    experience_years: 8,
    specialties: ['Crop'],
    is_active: true,
    current_status: 'available',
    avg_service_mins: 20,
    pin_code: '2222',
    working_hours: { start: '09:00', end: '21:00', days: ['Mon'] },
  };

  // Test 1: Active service elapsed time reduces estimated wait
  try {
    const started10MinsAgo = new Date(Date.now() - 10 * 60000).toISOString();
    const mockQueue: QueueEntry[] = [
      {
        id: 'q-1',
        salon_id: 's-1',
        barber_id: 'barber-1',
        service_id: 'srv-1',
        style_id: null,
        token_number: 'F-101',
        customer_name: 'Customer 1',
        secure_token: 'sec-1',
        status: 'in_service',
        priority_order: 1,
        is_any_barber: false,
        joined_at: started10MinsAgo,
        started_at: started10MinsAgo,
        estimated_wait_mins: 0,
      },
    ];

    const estimate = calculateBarberWaitTime(mockBarber1, mockQueue, []);
    // Remaining time on 25m service after 10 mins = 15 mins
    const passed = estimate.active_service_remaining_mins === 15;
    results.push({
      test: 'Active service elapsed time reduces wait',
      passed,
      message: `Expected ~15 mins remaining, got ${estimate.active_service_remaining_mins}`,
    });
  } catch (e: any) {
    results.push({ test: 'Active service elapsed time reduces wait', passed: false, message: e.message });
  }

  // Test 2: "Any Available Barber" chooses fastest available chair
  try {
    const mockBarbers = [mockBarber1, mockBarber2];
    const bestBarber = selectBestAvailableBarber(mockBarbers, []);
    const passed = bestBarber?.id === 'barber-2'; // Barber 2 is completely available
    results.push({
      test: 'Any Available Barber assigns fastest barber',
      passed,
      message: `Selected ${bestBarber?.name}`,
    });
  } catch (e: any) {
    results.push({ test: 'Any Available Barber assigns fastest barber', passed: false, message: e.message });
  }

  // Test 3: Token generator generates distinct sequential tokens
  try {
    const existingEntries: QueueEntry[] = [
      {
        id: 'q-1',
        salon_id: 's-1',
        barber_id: 'barber-1',
        service_id: 'srv-1',
        style_id: null,
        token_number: 'F-101',
        customer_name: 'Customer 1',
        secure_token: 'sec-1',
        status: 'in_service',
        priority_order: 1,
        is_any_barber: false,
        joined_at: new Date().toISOString(),
        estimated_wait_mins: 0,
      },
    ];

    const nextToken = generateTokenNumber(mockBarber1, existingEntries);
    const passed = nextToken === 'F-102';
    results.push({
      test: 'Sequential token generation prevents duplicate active tokens',
      passed,
      message: `Expected F-102, got ${nextToken}`,
    });
  } catch (e: any) {
    results.push({ test: 'Sequential token generation prevents duplicate active tokens', passed: false, message: e.message });
  }

  // Test 4: Appointment slot collision prevention (double-booking protection)
  try {
    const existingApts: Appointment[] = [
      {
        id: 'apt-1',
        barber_id: 'barber-1',
        barber_name: 'Farhaan Lone',
        service_id: 'srv-1',
        service_name: 'Haircut',
        service_price: 200,
        customer_name: 'Client 1',
        customer_phone: '9876543210',
        appointment_date: '2026-10-20',
        start_time: '14:00',
        end_time: '14:30',
        duration_minutes: 30,
        status: 'confirmed',
        appointment_ref: 'APT-1001',
        created_at: new Date().toISOString(),
      },
    ];

    // Conflict slot: 14:15 (inside 14:00 - 14:30)
    const isConflictSlotFree = isSlotAvailable('barber-1', '2026-10-20', '14:15', 30, existingApts);
    // Free slot: 15:00
    const isFreeSlotFree = isSlotAvailable('barber-1', '2026-10-20', '15:00', 30, existingApts);

    const passed = !isConflictSlotFree && isFreeSlotFree;
    results.push({
      test: 'Double-booking prevention validates genuine time slots',
      passed,
      message: `Conflict prevented: ${!isConflictSlotFree}, Free slot allowed: ${isFreeSlotFree}`,
    });
  } catch (e: any) {
    results.push({ test: 'Double-booking prevention validates genuine time slots', passed: false, message: e.message });
  }

  // Test 5: Queue position calculation
  try {
    const queueList: QueueEntry[] = [
      {
        id: 'q-1',
        salon_id: 's-1',
        barber_id: 'barber-1',
        service_id: 'srv-1',
        style_id: null,
        token_number: 'F-101',
        customer_name: 'Customer 1',
        secure_token: 'sec-1',
        status: 'in_service',
        priority_order: 1,
        is_any_barber: false,
        joined_at: new Date(Date.now() - 10000).toISOString(),
        estimated_wait_mins: 0,
      },
      {
        id: 'q-2',
        salon_id: 's-1',
        barber_id: 'barber-1',
        service_id: 'srv-1',
        style_id: null,
        token_number: 'F-102',
        customer_name: 'Customer 2',
        secure_token: 'sec-2',
        status: 'waiting',
        priority_order: 2,
        is_any_barber: false,
        joined_at: new Date().toISOString(),
        estimated_wait_mins: 15,
      },
    ];

    const pos = calculateQueuePosition(queueList[1], queueList);
    const passed = pos.position === 2 && pos.peopleAhead === 1;
    results.push({
      test: 'Queue position & people ahead calculation',
      passed,
      message: `Position: ${pos.position}, People ahead: ${pos.peopleAhead}`,
    });
  } catch (e: any) {
    results.push({ test: 'Queue position & people ahead calculation', passed: false, message: e.message });
  }

  return results;
}
