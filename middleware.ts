import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from "@/utils/supabase/middleware";

export async function middleware(request: NextRequest) {
  try {
    // Create a response and modify it with the Supabase auth middleware
    const response = NextResponse.next();
    
    // Create a Supabase client
    const supabase = createClient(request);

    // Refresh session if expired - required for Server Components
    await supabase.auth.getSession();

    return response;
  } catch (e) {
    // If there's an error, just continue without modifying the response
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
