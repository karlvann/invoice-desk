import { NextRequest, NextResponse } from 'next/server';
import { initDatabase } from '../../../../lib/db';

const API_SECRET_KEY = process.env.API_SECRET_KEY;

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get('X-API-Key');
    
    if (!apiKey || !API_SECRET_KEY || apiKey !== API_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Initialize database
    await initDatabase();
    
    return NextResponse.json({
      success: true,
      message: 'Database initialized successfully'
    });
    
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json(
      { 
        error: 'Failed to initialize database',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Database initialization endpoint',
    method: 'Use POST with X-API-Key header to initialize database'
  });
}