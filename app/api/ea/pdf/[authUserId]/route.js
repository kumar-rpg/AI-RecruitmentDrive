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

  // Resolve photo to a short-lived signed URL so the PDF renderer can embed it
  let pdfData = data;
  if (data.photo_path) {
    const { data: signed } = await supabaseAdmin()
      .storage.from('applications')
      .createSignedUrl(data.photo_path, 120);
    if (signed?.signedUrl) pdfData = { ...data, photo_url: signed.signedUrl };
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
