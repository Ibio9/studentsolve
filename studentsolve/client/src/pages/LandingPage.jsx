import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';

const FEATURES = [
  { icon: '✦', title: 'AI Tutor', desc: 'Ask anything across all subjects. Get clear, thorough explanations instantly.' },
  { icon: '✎', title: 'Essay Marker', desc: 'Paste your essay, get AO-level feedback structured like a real examiner.' },
  { icon: '▶', title: 'YouTube Notes', desc: 'Turn any lecture or tutorial video into structured revision notes.' },
  { icon: '⊟', title: 'Flashcards', desc: 'Generate exam-ready flashcards from any text or uploaded PDF.' },
];

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        {/* Hero */}
        <section
          style={{
            maxWidth: 760,
            margin: '0 auto',
            padding: '100px 28px 80px',
            textAlign: 'center',
          }}
        >
          <div className="badge badge-gold" style={{ marginBottom: 28 }}>
            AI-Powered Study Platform
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2.4rem, 6vw, 4rem)',
              lineHeight: 1.1,
              marginBottom: 26,
            }}
          >
            Study smarter.
            <br />
            <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>Score higher.</span>
          </h1>

          <p
            style={{
              fontSize: '1.08rem',
              color: 'var(--text-secondary)',
              maxWidth: 520,
              margin: '0 auto 44px',
              lineHeight: 1.75,
            }}
          >
            StudentSolve gives you an AI tutor, essay marker, note generator, and flashcard
            creator — all in one place, built for real academic results.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-primary" style={{ padding: '13px 34px', fontSize: '0.95rem' }}>
              Get started free
            </Link>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '13px 34px', fontSize: '0.95rem' }}>
              Log in
            </Link>
          </div>
        </section>

        {/* Features */}
        <section
          style={{
            maxWidth: 960,
            margin: '0 auto',
            padding: '0 28px 100px',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: '1.85rem', marginBottom: 10 }}>Everything you need to revise</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Four powerful tools. One cohesive platform.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: 20,
            }}
          >
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="card" style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: 'var(--accent-dim)',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.35rem',
                    margin: '0 auto 16px',
                  }}
                >
                  {icon}
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', marginBottom: 8 }}>
                  {title}
                </h3>
                <p style={{ fontSize: '0.87rem', lineHeight: 1.6 }}>{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer
        style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '24px',
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.82rem',
        }}
      >
        StudentSolve · Built for students · By Ibrahim Malik
      </footer>
    </div>
  );
}
