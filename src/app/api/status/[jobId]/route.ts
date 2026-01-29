import { NextRequest, NextResponse } from 'next/server';

const PIPELINE_URL = process.env.PIPELINE_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    
    const res = await fetch(`${PIPELINE_URL}/status/${jobId}`);
    const data = await res.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { status: 'error', error: 'Cannot connect to pipeline server' },
      { status: 503 }
    );
  }
}
