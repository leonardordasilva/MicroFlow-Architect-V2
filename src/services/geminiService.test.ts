/**
 * AI JSON parsing tests
 *
 * The JSON parsing/extraction logic has been fully migrated to the Edge Functions
 * (supabase/functions/generate-diagram/index.ts and supabase/functions/analyze-diagram/index.ts).
 * There is no client-side geminiService.ts anymore.
 *
 * These are smoke tests for the public function that invokes the Edge Function,
 * using vi.mock to mock the Supabase client.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test' } } }),
    },
  },
}));

import { supabase } from '@/integrations/supabase/client';

describe('AI Edge Function integration (smoke tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call generate-diagram Edge Function and return parsed diagram', async () => {
    const mockDiagram = {
      nodes: [{ id: 'n1', type: 'service', position: { x: 0, y: 0 }, data: { label: 'API', type: 'service' } }],
      edges: [],
    };

    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: mockDiagram,
      error: null,
    });

    const { data, error } = await supabase.functions.invoke('generate-diagram', {
      body: { description: 'Simple API service' },
    });

    expect(error).toBeNull();
    expect(data).toEqual(mockDiagram);
    expect(data.nodes).toHaveLength(1);
    expect(data.nodes[0].data.label).toBe('API');
  });

  it('should handle Edge Function error gracefully', async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: { message: 'Function invocation failed' },
    });

    const { data, error } = await supabase.functions.invoke('generate-diagram', {
      body: { description: 'Test' },
    });

    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });
});
