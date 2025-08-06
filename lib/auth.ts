import { cookies } from 'next/headers'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export interface User {
  id: string
  email: string
  name: string
  role: string
  organization_id: string
  created_at: string
}

export async function getUser(): Promise<User | null> {
  try {
    const cookieStore = await cookies()
    const sessionToken = cookieStore.get('session-token')?.value
    
    if (!sessionToken) {
      return null
    }

    const users = await sql`
      SELECT u.*, o.name as organization_name 
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.session_token = ${sessionToken}
      LIMIT 1
    `
    
    if (users.length === 0) {
      return null
    }

    return users[0] as User
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID()
  
  await sql`
    UPDATE users 
    SET session_token = ${sessionToken}, last_login = NOW()
    WHERE id = ${userId}
  `
  
  return sessionToken
}

export async function clearSession(sessionToken: string): Promise<void> {
  await sql`
    UPDATE users 
    SET session_token = NULL
    WHERE session_token = ${sessionToken}
  `
}

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for demo - use bcrypt in production
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hash
}
