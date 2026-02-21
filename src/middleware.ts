import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // We'll use a session cookie to check for auth status in middleware
    // For now, since Firebase is client-side, we'll handle redirects in the layout or pages
    // But standard practice is to use a cookie.
    // To keep it simple for this MVP and Firebase's client-centricity, 
    // we'll handle protection via a client-side layout wrapper or individual pages.

    // Actually, let's try a simple cookie-based approach if available, 
    // but Firebase tokens are usually handled client-side.

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/library/:path*',
        '/project/:path*',
    ],
};
