export async function sendRegistrationEmail(email: string, name: string): Promise<void> {
  console.log(`Email would be sent to ${email}: Registration confirmation for ${name}`);
  // TODO: Integrate SendGrid when env vars available
}

export async function sendBookingConfirmation(
  email: string,
  date: string,
  timeSlot: string
): Promise<void> {
  console.log(`Email would be sent to ${email}: Tour booking confirmed for ${date} at ${timeSlot}`);
  // TODO: Integrate SendGrid when env vars available
}
