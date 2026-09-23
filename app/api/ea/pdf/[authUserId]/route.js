import { renderToBuffer } from '@react-pdf/renderer';
import { supabaseServer } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import ApplicationPdfDocument from '@/lib/pdf/ApplicationPdfDocument';

export const runtime = 'nodejs';

export async function GET(request, { params }) {
  const { authUserId } = await params;

  // Verify caller is admin
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.app_metadata?.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fetch the full application record
  const { data, error } = await supabaseAdmin()
    .from('employment_applications')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error || !data) {
    return new Response('Application not found', { status: 404 });
  }

  // Download photo and encode as base64 data URI so react-pdf can embed it
  // without making a separate network request at render time.
  let pdfData = data;
  if (data.photo_path) {
    const { data: blob, error: photoErr } = await supabaseAdmin()
      .storage.from('applications')
      .download(data.photo_path);
    if (blob && !photoErr) {
      const buf = Buffer.from(await blob.arrayBuffer());
      const mime = blob.type || 'image/jpeg';
      pdfData = { ...data, photo_url: `data:${mime};base64,${buf.toString('base64')}` };
    }
  }

  // Render PDF
  const buffer = await renderToBuffer(<ApplicationPdfDocument data={pdfData} />);

  const filename = `${(data.full_name || 'Applicant').replace(/[^a-zA-Z0-9 ]/g, '')}_Application.pdf`;

  return new Response(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
