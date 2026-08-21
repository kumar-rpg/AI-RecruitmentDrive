import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  try {
    const { data: applicants, error } = await supabaseAdmin()
      .from('applicants')
      .select('status')
      .order('submitted_at', { ascending: false });

    if (error) {
      return Response.json({ error: 'Failed to fetch applicants' }, { status: 500 });
    }

    return Response.json(applicants || []);
  } catch (error) {
    console.error('Applicants API error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
