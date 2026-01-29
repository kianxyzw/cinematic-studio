import { NextRequest, NextResponse } from 'next/server';

const PIPELINE_URL = process.env.PIPELINE_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Forward to local pipeline server
    const res = await fetch(`${PIPELINE_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Pipeline connection error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cannot connect to pipeline server. Make sure it is running on localhost:3001' 
      },
      { status: 503 }
    );
  }
}
