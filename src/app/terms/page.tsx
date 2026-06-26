import React from 'react';
import MainLayout from '@/components/MainLayout';

export default function TermsPage() {
  return (
    <MainLayout>
      <div style={{ maxWidth: '800px', margin: '4rem auto', padding: '0 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          By using Media Downloader, you agree to the following terms and conditions.
        </p>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '2rem', marginBottom: '1rem' }}>Educational Purposes</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '1.5rem' }}>
          This application is created strictly for educational purposes only. The developers do not endorse, encourage, or support the downloading of copyrighted material. You are solely responsible for ensuring you have the legal right or permission to download and store any media using this tool.
        </p>
      </div>
    </MainLayout>
  );
}
