import { Router, Request, Response } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import speakeasy from 'speakeasy'
import { z } from 'zod'

const router = Router()

// Schemas
const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  totp: z.string().optional(),
})

// Types
interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    twoFactorEnabled: boolean
  }
}

// Constants
const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret'

/**
 * POST /api/v1/auth/login
 * Authenticate user with email/password and optional TOTP
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate input
    const validated = LoginSchema.parse(req.body)
    const { email, password, totp } = validated

    // TODO: Query database for user (when Prisma is integrated)
    // For now, use mock data
    const user = {
      id: '1',
      email: email,
      password_hash: '', // Would come from DB
      name: 'Admin User',
      role: 'ADMIN',
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEBLW64TMMQ======', // Mock secret
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Check if user exists (will be DB query)
    if (!user || user.email !== email) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Verify password (will be bcrypt compare with DB hash)
    // const passwordMatch = await bcrypt.compare(password, user.password_hash)
    // For now, use mock comparison
    const passwordMatch = password === 'AdminSecret123!'

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Check if MFA is required
    if (user.twoFactorEnabled && !totp) {
      return res.status(200).json({
        requiresMFA: true,
        sessionId: jwt.sign(
          { userId: user.id, type: 'mfa-session' },
          JWT_SECRET,
          { expiresIn: '10m' }
        ),
      })
    }

    // Verify TOTP if provided
    if (user.twoFactorEnabled && totp) {
      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: totp,
        window: 2, // Allow 30 seconds before/after
      })

      if (!verified) {
        return res.status(401).json({ error: 'Invalid TOTP code' })
      }
    }

    // Generate tokens
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: 'refresh',
      },
      REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    )

    // Log successful login
    console.log(`User logged in: ${email}`)

    // Return tokens and user data
    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: null, // Will be populated from DB
      },
      requiresMFA: false,
      sessionId: null,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors })
    }
    console.error('Login error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' })
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, REFRESH_SECRET) as any

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: decoded.userId,
        type: 'access',
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    )

    res.json({ accessToken })
  } catch (error) {
    console.error('Token refresh error:', error)
    res.status(401).json({ error: 'Invalid refresh token' })
  }
})

/**
 * POST /api/v1/auth/logout
 * Logout user (invalidate tokens)
 */
router.post('/logout', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // In production, invalidate token in Redis/database
    console.log(`User logged out: ${user.email}`)

    res.json({ message: 'Logged out successfully' })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * GET /api/v1/auth/me
 * Get current user info
 */
router.get('/me', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/v1/auth/setup-mfa
 * Setup TOTP for user
 */
router.post('/setup-mfa', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Generate new TOTP secret
    const secret = speakeasy.generateSecret({
      name: `Little Smarties (${user.email})`,
      issuer: 'Little Smarties Admin',
      length: 32,
    })

    // QR code URL for scanning
    const qrCode = secret.otpauth_url

    res.json({
      secret: secret.base32,
      qrCode,
      message: 'Scan this QR code with your authenticator app',
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * POST /api/v1/auth/verify-mfa
 * Verify and enable TOTP
 */
router.post('/verify-mfa', (req: AuthRequest, res: Response) => {
  try {
    const user = req.user
    const { secret, token } = req.body

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    // Verify token
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2,
    })

    if (!verified) {
      return res.status(400).json({ error: 'Invalid verification code' })
    }

    // Save secret to user in database
    // TODO: Update user.twoFactorSecret and twoFactorEnabled in database

    res.json({ message: 'MFA enabled successfully' })
  } catch (error) {
    console.error('MFA verification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Export router
export default router
