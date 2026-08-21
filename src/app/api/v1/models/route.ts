import { NextResponse } from 'next/server';
import { IPORTAL_MODELS } from '@/lib/core/models';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const modelsData = IPORTAL_MODELS.map((m) => ({
    id: m.id,
    object: 'model',
    created: 1787330000,
    owned_by: 'iportal.uz',
    permission: [
      {
        id: `perm-${m.id}`,
        object: 'model_permission',
        created: 1787330000,
        allow_create_engine: false,
        allow_sampling: true,
        allow_logprobs: true,
        allow_search_indices: false,
        allow_view: true,
        allow_fine_tuning: false,
        organization: '*',
        group: null,
        is_blocking: false,
      },
    ],
    root: m.id,
    parent: null,
    meta: {
      name: m.name,
      category: m.category,
      description: m.description,
      context_window: m.contextWindow,
      speed: m.speed,
    },
  }));

  return NextResponse.json({
    object: 'list',
    data: modelsData,
  }, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'X-Powered-By': 'iportal-ai',
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
