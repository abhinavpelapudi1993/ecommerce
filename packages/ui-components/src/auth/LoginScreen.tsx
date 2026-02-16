import { useState } from 'react';
import { Title, Text, Button } from '@clickhouse/click-ui';

export interface LoginUser {
  id: string;
  name: string;
  email: string;
}

interface LoginScreenProps {
  appName?: string;
  users: LoginUser[];
  onLogin: (userId: string) => void;
  accessCode?: string;
}

const DEFAULT_CODE = '123456';

export function LoginScreen({
  appName = 'E-Commerce',
  users,
  onLogin,
  accessCode = DEFAULT_CODE,
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [matchedUser, setMatchedUser] = useState<LoginUser | null>(null);

  const handleEmailContinue = () => {
    const trimmed = email.trim().toLowerCase();
    const found = users.find((u) => u.email.toLowerCase() === trimmed);
    if (!found) {
      setError('No account found with this email');
      return;
    }
    setMatchedUser(found);
    setError('');
    setStep('code');
  };

  const handleCodeSubmit = () => {
    if (code !== accessCode) {
      setError('Invalid access code');
      return;
    }
    if (matchedUser) {
      onLogin(matchedUser.id);
    }
  };

  const handleBack = () => {
    setStep('email');
    setCode('');
    setError('');
  };

  return (
    <div style={backdrop}>
      <div style={stripeStyle} />

      <div style={wrapper}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={logoMark}>{appName[0]}</div>
          <Title type="h2" style={{ color: '#fff' }}>{appName}</Title>
        </div>

        <div style={card}>
          <Title type="h3" style={{ textAlign: 'center', marginBottom: 24 }}>
            Sign in
          </Title>

          {step === 'email' && (
            <>
              <label style={labelStyle}>
                Email *
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleEmailContinue()}
                  placeholder="Enter your email..."
                  style={inputStyle}
                  autoFocus
                />
              </label>

              {error && <Text color="danger" size="sm" style={{ display: 'block', marginTop: 8 }}>{error}</Text>}

              <button onClick={handleEmailContinue} disabled={!email.trim()} style={primaryButton}>
                Continue
              </button>

              <div style={divider}>
                <span style={dividerLine} />
                <Text color="muted" size="sm">Demo Accounts</Text>
                <span style={dividerLine} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => { setEmail(u.email); setError(''); }}
                    style={quickFillButton}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f5f5f5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fafafa')}
                  >
                    <div style={avatar}>{u.name[0]}</div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{u.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{u.email}</div>
                    </div>
                  </button>
                ))}
              </div>

              <Text color="muted" size="sm" style={{ display: 'block', textAlign: 'center', marginTop: 12 }}>
                Access code for all accounts: <strong style={{ color: '#1a1a2e' }}>123456</strong>
              </Text>
            </>
          )}

          {step === 'code' && matchedUser && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ ...avatar, margin: '0 auto 8px', width: 48, height: 48, fontSize: 20 }}>
                  {matchedUser.name[0]}
                </div>
                <Text style={{ display: 'block', fontWeight: 600, color: '#1a1a2e' }}>
                  {matchedUser.name}
                </Text>
                <Text color="muted" size="sm">{matchedUser.email}</Text>
              </div>

              <label style={labelStyle}>
                Access Code *
                <input
                  type="password"
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCodeSubmit()}
                  placeholder="Enter 6-digit code..."
                  maxLength={6}
                  style={inputStyle}
                  autoFocus
                />
              </label>

              {error && <Text color="danger" size="sm" style={{ display: 'block', marginTop: 8 }}>{error}</Text>}

              <button onClick={handleCodeSubmit} disabled={!code.trim()} style={primaryButton}>
                Sign In
              </button>

              <button onClick={handleBack} style={backLink}>
                &larr; Use a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const backdrop: React.CSSProperties = {
  minHeight: '100vh',
  background: '#1a1a2e',
  position: 'relative',
  overflow: 'hidden',
};

const stripeStyle: React.CSSProperties = {
  position: 'absolute',
  bottom: -80,
  left: -100,
  right: -100,
  height: 200,
  background: '#FADB14',
  transform: 'rotate(-3deg)',
  zIndex: 0,
};

const wrapper: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: 24,
};

const logoMark: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 12,
  background: '#FADB14',
  color: '#1a1a2e',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 28,
  fontWeight: 700,
  marginBottom: 12,
};

const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 420,
  background: '#fff',
  borderRadius: 12,
  padding: '32px 36px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: '#444',
  marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px 14px',
  borderRadius: 8,
  border: '2px solid var(--click-color-border-default, #e0e0e0)',
  fontSize: 14,
  marginTop: 6,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  color: '#1a1a2e',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
};

const primaryButton: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#1a1a2e',
  color: '#fff',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  marginTop: 16,
  transition: 'opacity 0.15s',
};

const quickFillButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 10px',
  borderRadius: 6,
  border: 'none',
  background: '#fafafa',
  cursor: 'pointer',
  width: '100%',
  transition: 'background 0.15s',
};

const avatar: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: '50%',
  background: '#FADB14',
  color: '#1a1a2e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 14,
  flexShrink: 0,
};

const divider: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  margin: '20px 0 12px',
};

const dividerLine: React.CSSProperties = {
  flex: 1,
  height: 1,
  background: '#e0e0e0',
};

const backLink: React.CSSProperties = {
  display: 'block',
  width: '100%',
  background: 'none',
  border: 'none',
  color: '#666',
  fontSize: 13,
  cursor: 'pointer',
  marginTop: 12,
  textAlign: 'center',
};
