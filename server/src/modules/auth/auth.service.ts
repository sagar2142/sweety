import bcrypt from 'bcryptjs';
import { env } from '../../config/env';
import { isUniqueViolation, pool } from '../../db/pool';
import { AppError } from '../../utils/AppError';
import type { LoginInput, RegisterInput } from './auth.schemas';
import { signToken } from './token';

export interface PublicUser {
  id: number;
  name: string;
  email: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

interface UserRow extends PublicUser {
  password_hash: string;
}

const EMAIL_TAKEN = 'An account with this email already exists.';
const INVALID_LOGIN = 'Invalid email or password.';

// Compared against when the email is unknown, so a login attempt takes the
// same time whether or not the account exists.
const DUMMY_HASH = bcrypt.hashSync('sweety-dummy-password', env.BCRYPT_SALT_ROUNDS);

export async function registerUser(input: RegisterInput): Promise<AuthResult> {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_SALT_ROUNDS);

  try {
    const { rows } = await pool.query<PublicUser>(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email`,
      [input.name, input.email, passwordHash],
    );
    const user = rows[0]!;
    return { user, token: signToken(user.id) };
  } catch (error) {
    if (isUniqueViolation(error, 'users_email_lower_key')) {
      throw AppError.conflict(EMAIL_TAKEN, 'email');
    }
    throw error;
  }
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  const { rows } = await pool.query<UserRow>(
    'SELECT id, name, email, password_hash FROM users WHERE LOWER(email) = $1',
    [input.email],
  );
  const row = rows[0];

  // Same message for "no such user" and "wrong password" so attackers
  // cannot find out which emails are registered.
  const passwordMatches = await bcrypt.compare(input.password, row?.password_hash ?? DUMMY_HASH);
  if (!row || !passwordMatches) {
    throw AppError.unauthorized(INVALID_LOGIN);
  }

  const user: PublicUser = { id: row.id, name: row.name, email: row.email };
  return { user, token: signToken(user.id) };
}

export async function findUserById(userId: number): Promise<PublicUser> {
  const { rows } = await pool.query<PublicUser>('SELECT id, name, email FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw AppError.unauthorized('Your account no longer exists. Please sign up again.');
  return rows[0];
}
