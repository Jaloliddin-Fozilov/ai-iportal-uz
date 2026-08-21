import { NextResponse } from 'next/server';
import { IPORTAL_MODELS } from '@/lib/core/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function GET() {
  const models = IPORTAL_MODELS.map(m => ({
    id: m.id,
    object: 'model',
    created: 1700000000,
    owned_by: 'iportal-uz',
    permission: [],
    root: m.id,
    parent: null,
    metadata: {
      name: m.name,
      provider: m.provider,
      category: m.category,
      description: m.description,
      context_window: m.contextWindow,
      speed: m.speed,
      is_free: m.isFree,
    },
  }));

  return NextResponse.json(
    {
      object: 'list',
      data: models,
    },
    { headers: corsHeaders }
  );
}
