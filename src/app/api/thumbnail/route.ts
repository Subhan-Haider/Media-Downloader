import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  const title = searchParams.get('title') || 'thumbnail';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const safeTitle = encodeURIComponent(title.replace(/[/\\?%*:|"<>]/g, '-'));
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Failed to fetch thumbnail');
    }
    
    // Attempt to parse extension from URL or content-type
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const ext = contentType.split('/')[1] || 'jpg';

    return new NextResponse(response.body, {
      headers: {
        'Content-Disposition': `attachment; filename="${safeTitle}-thumbnail.${ext}"`,
        'Content-Type': contentType,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
