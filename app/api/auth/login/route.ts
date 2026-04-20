import { query } from '@/lib/db';
import { hashPassword, verifyPassword, createToken } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Parse request body with proper error handling
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Trim whitespace
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();

    console.log('Login attempt:', { email: trimmedEmail, hasPassword: !!trimmedPassword });

    if (!trimmedEmail || !trimmedPassword) {
      return NextResponse.json(
        { error: `Missing required fields: email=${!!trimmedEmail}, password=${!!trimmedPassword}` },
        { status: 400 }
      );
    }

    // Get user from database
    console.log('Looking up user...');
    const result = await query('SELECT * FROM profiles WHERE email = $1', [trimmedEmail.toLowerCase()]);

    if (result.rows.length === 0) {
      console.log('User not found:', trimmedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];
    console.log('User found:', user.id, 'checking password...');

    // Check password_hash exists
    if (!user.password_hash) {
      console.error('User has no password_hash:', user.id);
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await verifyPassword(trimmedPassword, user.password_hash);

    if (!isPasswordValid) {
      console.log('Password invalid for user:', user.id);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('Login successful for user:', user.id);

    // Create JWT token
    const token = createToken(user.id, user.email, user.role);

    // Return user data and token
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
      token,
    });

    // Set cookie
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
