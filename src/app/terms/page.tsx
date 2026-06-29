'use client';
import Link from 'next/link';
import { FileText, UserCheck, Ban, Gavel, RefreshCw, Mail, ArrowLeft, ExternalLink, AlertTriangle } from 'lucide-react';

const sections = [
  {
    icon: <UserCheck size={22} />,
    title: '1. Acceptance of Terms',
    content: `By accessing or using Media Server, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access or use the service. These terms apply to all users of the application.`,
  },
  {
    icon: <FileText size={22} />,
    title: '2. Educational Use Only',
    content: `This application is provided strictly for educational and personal research purposes. It is designed to help users understand how media streaming and downloading technologies work. Any other use, particularly the unauthorized downloading of copyrighted content, is strictly prohibited.`,
  },
  {
    icon: <Ban size={22} />,
    title: '3. Prohibited Activities',
    content: null,
    isList: true,
    items: [
      'Downloading, distributing, or sharing copyrighted content without authorization.',
      'Using the application to infringe upon the intellectual property rights of any third party.',
      'Circumventing or bypassing technical measures implemented by content platforms.',
      'Using the service for any commercial purpose without explicit written consent.',
      'Attempting to disrupt or gain unauthorized access to the underlying systems.',
    ],
  },
  {
    icon: <Gavel size={22} />,
    title: '4. Intellectual Property & Liability',
    content: `The application software itself is the intellectual property of its developers. The developers bear no liability for how you choose to use this tool. You, as the end user, are fully responsible for ensuring that your usage complies with all applicable local, national, and international laws, including those governing copyright and intellectual property.`,
  },
  {
    icon: <RefreshCw size={22} />,
    title: '5. Changes to Terms',
    content: `We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to the application. Your continued use of the service after any modifications constitutes your acceptance of the new terms. We encourage you to review these terms periodically.`,
  },
  {
    icon: <Mail size={22} />,
    title: '6. Contact',
    isContact: true,
  },
];

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingTop: '80px', paddingBottom: '80px' }}>
      <style>{`
        .legal-page { max-width: 780px; margin: 0 auto; padding: 0 1.5rem; }
        .legal-hero { text-align: center; margin-bottom: 3.5rem; }
        .legal-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 1rem; border-radius: 100px;
          background: rgba(139,92,246,0.1);
          color: #8b5cf6; font-size: 0.8rem; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 1.25rem;
        }
        .legal-title {
          font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; line-height: 1.15;
          letter-spacing: -0.03em; color: var(--foreground);
          margin: 0 0 1rem 0;
        }
        .legal-subtitle { color: var(--text-muted); font-size: 1.05rem; line-height: 1.7; margin: 0; }
        .legal-updated { font-size: 0.8rem; color: var(--text-muted); margin-top: 0.75rem; opacity: 0.7; }

        .disclaimer-box {
          display: flex; gap: 1rem; align-items: flex-start;
          padding: 1.25rem 1.5rem; border-radius: 14px; margin-bottom: 2.5rem;
          background: rgba(239,68,68,0.07); border: 1px solid rgba(239,68,68,0.25);
          color: var(--foreground);
        }
        .disclaimer-icon { color: #ef4444; flex-shrink: 0; margin-top: 2px; }
        .disclaimer-box strong { color: #ef4444; }

        .sections-list { display: flex; flex-direction: column; gap: 1.25rem; }
        .section-card {
          background: var(--card-bg); border: 1px solid var(--border);
          border-radius: 16px; padding: 2rem; transition: border-color 0.2s, box-shadow 0.2s;
        }
        .section-card:hover { border-color: rgba(139,92,246,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .section-header { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem; }
        .section-icon-wrap {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(139,92,246,0.1);
          color: #8b5cf6;
          display: flex; align-items: center; justify-content: center;
        }
        .section-title { font-size: 1.1rem; font-weight: 700; color: var(--foreground); margin: 0; }
        .section-body { color: var(--text-muted); line-height: 1.75; font-size: 0.97rem; margin: 0; }
        .section-list { color: var(--text-muted); line-height: 1.75; font-size: 0.97rem; margin: 0; padding-left: 1.25rem; }
        .section-list li { margin-bottom: 0.4rem; }

        .legal-footer {
          margin-top: 3rem; display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 1rem;
          padding-top: 2rem; border-top: 1px solid var(--border);
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 0.5rem;
          color: var(--text-muted); text-decoration: none; font-size: 0.9rem; transition: color 0.15s;
        }
        .back-link:hover { color: var(--foreground); }
        .privacy-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1.25rem; border-radius: 8px;
          background: #8b5cf6; color: white; text-decoration: none;
          font-weight: 600; font-size: 0.875rem; transition: filter 0.15s;
        }
        .privacy-link:hover { filter: brightness(1.1); }
      `}</style>

      <div className="legal-page">
        {/* Hero */}
        <div className="legal-hero">
          <div className="legal-badge"><FileText size={13} /> Terms of Service</div>
          <h1 className="legal-title">Terms of Service</h1>
          <p className="legal-subtitle">
            Please read these terms carefully before using Media Server. By using the service, you agree to these terms.
          </p>
          <p className="legal-updated">Last updated: June 29, 2025</p>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-box">
          <div className="disclaimer-icon"><AlertTriangle size={20} /></div>
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.95rem' }}>
            <strong>Important Notice.</strong> This application is provided for <strong>educational purposes only</strong>. Misuse of this tool to download copyrighted material without authorization is strictly prohibited and may be illegal in your jurisdiction.
          </p>
        </div>

        {/* Sections */}
        <div className="sections-list">
          {sections.map((s, i) => (
            <div className="section-card" key={i}>
              <div className="section-header">
                <div className="section-icon-wrap">{s.icon}</div>
                <h2 className="section-title">{s.title}</h2>
              </div>
              {s.isContact ? (
                <p className="section-body">
                  If you have questions about these Terms of Service, please contact us at{' '}
                  <a href="mailto:support@subhan.tech" style={{ color: '#8b5cf6', textDecoration: 'none', fontWeight: 600 }}>
                    support@subhan.tech
                  </a>. We typically respond within 48 hours.
                </p>
              ) : s.isList ? (
                <ul className="section-list">
                  {s.items!.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              ) : (
                <p className="section-body">{s.content}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="legal-footer">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
          <Link href="/privacy" className="privacy-link">View Privacy Policy <ExternalLink size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
