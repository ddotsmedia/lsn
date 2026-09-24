import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.query;

  if (!email || !password) {
    return res.redirect(`/admin?error=Email and password required`);
  }

  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:3001/api';
    const response = await fetch(`${backendUrl}/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.redirect(`/admin?error=${encodeURIComponent(data.error || 'Login failed')}`);
    }

    if (data.accessToken) {
      const token = encodeURIComponent(data.accessToken);
      const refresh = encodeURIComponent(data.refreshToken);
      return res.redirect(`/admin/dashboard?token=${token}&refresh=${refresh}`);
    }

    return res.redirect(`/admin?error=No token received`);
  } catch (err) {
    return res.redirect(`/admin?error=${encodeURIComponent((err as Error).message || 'Login failed')}`);
  }
}
