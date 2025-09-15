import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle CORS for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    const response = NextResponse.next();
    
    // Allow requests from Astro development and production
    const allowedOrigins = [
      'http://localhost:4321',  // Current Astro dev
      'http://localhost:4322',  // New Astro dev (if different port)
      'http://localhost:3001',  // Alternative dev port
      'https://ausbeds.com.au', // Production
      'https://beta.ausbeds.com.au', // Beta site
      'https://*.vercel.app'    // Vercel preview deployments
    ];
    
    const origin = request.headers.get('origin');
    if (origin && (allowedOrigins.includes(origin) || origin.match(/https:\/\/.*\.vercel\.app/))) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
      response.headers.set('Access-Control-Max-Age', '86400');
    }
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: response.headers });
    }
    
    return response;
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*'
};