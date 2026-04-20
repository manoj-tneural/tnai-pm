import { query } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth';
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

    const { email, password, full_name, role } = body;

    // Trim whitespace
    const trimmedEmail = email?.trim();
    const trimmedPassword = password?.trim();
    const trimmedFullName = full_name?.trim();

    console.log('Signup attempt:', { email: trimmedEmail, full_name: trimmedFullName, hasPassword: !!trimmedPassword });

    if (!trimmedEmail || !trimmedPassword || !trimmedFullName) {
      return NextResponse.json(
        { error: `Missing required fields: email=${!!trimmedEmail}, password=${!!trimmedPassword}, full_name=${!!trimmedFullName}` },
        { status: 400 }
      );
    }

    // Validate email format (basic check)
    if (!trimmedEmail.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (trimmedPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Check if user already exists
    console.log('Checking for existing user:', trimmedEmail);
    const existingUser = await query('SELECT id FROM profiles WHERE email = $1', [trimmedEmail.toLowerCase()]);

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    console.log('Hashing password...');
    const passwordHash = await hashPassword(trimmedPassword);

    // Create user
    const userRole = role || 'engineer';
    console.log('Inserting user into database...');
    const result = await query(
      `INSERT INTO profiles (email, password_hash, full_name, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, full_name, role`,
      [trimmedEmail.toLowerCase(), passwordHash, trimmedFullName, userRole]
    );

    if (!result.rows[0]) {
      console.error('Failed to insert user');
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    const user = result.rows[0];
    console.log('User created:', user.id);

    // Create JWT token
    console.log('Creating JWT token...');
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
    // Note: Don't use secure:true on HTTP (like development/staging)
    // Only use secure on true HTTPS connections
    const isSecure = req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';
    
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    console.log('Cookie set with secure:', isSecure);

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
