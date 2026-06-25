import { notFound } from 'next/navigation';
import { blogs } from '@/data/blogs';
import Link from 'next/link';

// Next.js 15 requires params to be awaited
export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const blog = blogs.find(b => b.slug === resolvedParams.slug);

  if (!blog) {
    notFound();
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 500, padding: '0.5rem 1rem', background: 'var(--card-bg)', borderRadius: '100px', border: '1px solid var(--border)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Home
        </Link>
      </div>

      <div style={{ width: '100%', height: '400px', borderRadius: '24px', overflow: 'hidden', marginBottom: '3rem', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}>
        <img src={blog.imageUrl} alt={blog.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, padding: '3rem' }}>
          <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: blog.color, color: 'white', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {blog.readTime}
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1.1, textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
            {blog.title}
          </h1>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '3rem 4rem', borderRadius: '24px', marginBottom: '4rem' }}>
        <div 
          dangerouslySetInnerHTML={{ __html: blog.content }} 
          style={{ 
            fontSize: '1.2rem', 
            lineHeight: 1.8, 
            color: 'var(--foreground)'
          }} 
          className="blog-content"
        />
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .blog-content h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 3rem;
          margin-bottom: 1.5rem;
          color: var(--foreground);
        }
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-top: 2rem;
          margin-bottom: 1rem;
          color: var(--foreground);
        }
        .blog-content p {
          margin-bottom: 1.5rem;
          color: var(--text-muted);
        }
        .blog-content ul {
          margin-bottom: 1.5rem;
          padding-left: 2rem;
          color: var(--text-muted);
        }
        .blog-content li {
          margin-bottom: 0.5rem;
        }
        .blog-content strong {
          color: var(--foreground);
          font-weight: 700;
        }
      `}} />
    </div>
  );
}
