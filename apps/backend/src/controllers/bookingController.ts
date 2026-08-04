import type { Response } from 'express';
import type { Pool } from 'pg';
import { z } from 'zod';
import type { AuthRequest } from '../middleware/auth.js';
import { sendRegistrationEmail, sendBookingConfirmation } from '../services/emailService.js';
import type { Registration, TourBooking } from '../types/index.js';

/** The only slots a tour can be booked into. */
export const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'] as const;

const RegistrationSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  age_group_id: z.string(),
});

const BookingSchema = z.object({
  visitor_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(10),
  preferred_date: z.string().datetime(),
  time_slot: z.enum(TIME_SLOTS),
});

const AvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD'),
});

// Registrations
export async function createRegistration(
  db: Pool,
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const data = RegistrationSchema.parse(req.body);
    const result = await db.query(
      'INSERT INTO registrations (first_name, last_name, email, phone, age_group_id, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [data.first_name, data.last_name, data.email, data.phone, data.age_group_id, 'pending']
    );
    const registration = result.rows[0] as Registration;
    await sendRegistrationEmail(data.email, data.first_name);
    res.status(201).json(registration);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('createRegistration failed', error);
      res.status(500).json({ error: 'Failed to create registration' });
    }
  }
}

export async function getRegistrations(
  db: Pool,
  _req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const result = await db.query('SELECT * FROM registrations ORDER BY created_at DESC');
    res.json(result.rows as Registration[]);
  } catch (error) {
    console.error('getRegistrations failed', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
}

// Tour Bookings
export async function getAvailability(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const { date } = AvailabilitySchema.parse(req.query);

    const booked = await db.query(
      'SELECT time_slot FROM tour_bookings WHERE DATE(preferred_date) = $1 AND status != $2',
      [date, 'cancelled']
    );
    const bookedSlots = booked.rows.map((r: { time_slot: string }) => r.time_slot);
    const available = TIME_SLOTS.filter((slot) => !bookedSlots.includes(slot));
    res.json({ date, available, booked: bookedSlots });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('getAvailability failed', error);
      res.status(500).json({ error: 'Failed to fetch availability' });
    }
  }
}

export async function createBooking(db: Pool, req: AuthRequest, res: Response): Promise<void> {
  try {
    const data = BookingSchema.parse(req.body);

    // Conditional insert so a slot cannot be claimed twice between the
    // availability check and the write.
    const result = await db.query(
      `INSERT INTO tour_bookings (visitor_name, email, phone, preferred_date, time_slot, status)
       SELECT $1, $2, $3, $4, $5, $6
       WHERE NOT EXISTS (
         SELECT 1 FROM tour_bookings
         WHERE DATE(preferred_date) = DATE($4::timestamptz)
           AND time_slot = $5
           AND status != 'cancelled'
       )
       RETURNING *`,
      [data.visitor_name, data.email, data.phone, data.preferred_date, data.time_slot, 'pending']
    );

    if (result.rows.length === 0) {
      res.status(409).json({ error: 'Time slot already booked' });
      return;
    }

    const booking = result.rows[0] as TourBooking;
    await sendBookingConfirmation(data.email, data.preferred_date, data.time_slot);
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation failed', details: error.issues });
    } else {
      console.error('createBooking failed', error);
      res.status(500).json({ error: 'Failed to create booking' });
    }
  }
}

export async function getBookings(db: Pool, _req: AuthRequest, res: Response): Promise<void> {
  try {
    const result = await db.query('SELECT * FROM tour_bookings ORDER BY preferred_date DESC');
    res.json(result.rows as TourBooking[]);
  } catch (error) {
    console.error('getBookings failed', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
}
