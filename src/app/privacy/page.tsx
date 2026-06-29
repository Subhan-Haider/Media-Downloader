'use client';
import Link from 'next/link';
import { Shield, Eye, HardDrive, Copyright, AlertTriangle, Mail, ArrowLeft, ExternalLink } from 'lucide-react';

const sections = [
  {
    icon: <Eye size={22} />,
    title: '1. Data Collection & Privacy',
    content: `Media Server runs entirely on your own machine or a private server. We do not track, collect, log, or transmit any of your personal data, downloaded files, search history, or usage patterns to any external servers or third-party services. Your activity stays completely private.`,
  },
  {
    icon: <HardDrive size={22} />,
    title: '2. Local Storage',
    content: `All media files downloaded through this application are stored on your local hard drive in the designated library folder. You have complete ownership and full control over every file. Deleting a file through the interface permanently removes it from your device.`,
  },
  {
    icon: <Copyright size={22} />,
    title: '3. Fair Use & Copyright',
    content: `This software is intended as a personal utility to archive and back up media for offline, personal consumption. You are solely responsible for ensuring that your use of this application complies with the copyright laws of your jurisdiction and the Terms of Service of the platforms you are downloading from.`,
  },
  {
    icon: <Shield size={22} />,
    title: '4. No Warranty',
    content: `This software is provided "as is", without warranty of any kind, express or implied. In no event shall the developers be liable for any claim, damages, or other liability arising from, out of, or in connection with the software or the use of the software.`,
  },
  {
    icon: <Mail size={22} />,
    title: '5. Contact',
    content: null,
    isContact: true,
  },
];

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', paddingTop: '80px', paddingBottom: '80px' }}>
      <style>{`
        .legal-page { max-width: 780px; margin: 0 auto; padding: 0 1.5rem; }
        .legal-hero { text-align: center; margin-bottom: 3.5rem; }
        .legal-badge {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 1rem; border-radius: 100px;
          background: rgba(var(--primary-rgb,26,133,255),0.1);
          color: var(--primary, #1a85ff); font-size: 0.8rem; font-weight: 600;
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
        .section-card:hover { border-color: rgba(var(--primary-rgb,26,133,255),0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        .section-header { display: flex; align-items: center; gap: 0.85rem; margin-bottom: 1rem; }
        .section-icon-wrap {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(var(--primary-rgb,26,133,255),0.1);
          color: var(--primary, #1a85ff);
          display: flex; align-items: center; justify-content: center;
        }
        .section-title { font-size: 1.1rem; font-weight: 700; color: var(--foreground); margin: 0; }
        .section-body { color: var(--text-muted); line-height: 1.75; font-size: 0.97rem; margin: 0; }

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
        .terms-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1.25rem; border-radius: 8px;
          background: var(--primary); color: white; text-decoration: none;
          font-weight: 600; font-size: 0.875rem; transition: filter 0.15s;
        }
        .terms-link:hover { filter: brightness(1.1); }
      `}</style>

      <div className="legal-page">
        {/* Hero */}
        <div className="legal-hero">
          <div className="legal-badge"><Shield size={13} /> Privacy Policy</div>
          <h1 className="legal-title">Your Privacy, Our Priority</h1>
          <p className="legal-subtitle">
            We built this tool to respect your privacy. Here's everything you need to know about how we handle your data.
          </p>
          <p className="legal-updated">Last updated: June 29, 2025</p>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer-box">
          <div className="disclaimer-icon"><AlertTriangle size={20} /></div>
          <p style={{ margin: 0, lineHeight: 1.7, fontSize: '0.95rem' }}>
            <strong>Educational Purposes Only.</strong> This application is created strictly for educational purposes. The developers do not endorse or support the downloading of copyrighted material. You are solely responsible for ensuring you have the legal right to download any media using this tool.
          </p>
        </div>

        {/* Sections */}
        <div className="sections-list">
          {sections.map((s, i) =>
            s.isContact ? (
              <div className="section-card" key={i}>
                <div className="section-header">
                  <div className="section-icon-wrap">{s.icon}</div>
                  <h2 className="section-title">{s.title}</h2>
                </div>
                <p className="section-body">
                  Have questions or concerns about this policy? Reach out to us at{' '}
                  <a href="mailto:support@subhan.tech" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                    support@subhan.tech
                  </a>.
                  We typically respond within 48 hours.
                </p>
              </div>
            ) : (
              <div className="section-card" key={i}>
                <div className="section-header">
                  <div className="section-icon-wrap">{s.icon}</div>
                  <h2 className="section-title">{s.title}</h2>
                </div>
                <p className="section-body">{s.content}</p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="legal-footer">
          <Link href="/" className="back-link"><ArrowLeft size={16} /> Back to Home</Link>
          <Link href="/terms" className="terms-link">View Terms of Service <ExternalLink size={14} /></Link>
        </div>
      </div>
    </div>
  );
}
