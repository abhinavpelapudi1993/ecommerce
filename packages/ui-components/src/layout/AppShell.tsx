import { type ReactNode } from 'react';

interface AppShellProps {
  sidebar?: ReactNode;
  header?: ReactNode;
  children: ReactNode;
}

export function AppShell({ sidebar, header, children }: AppShellProps) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebar && (
        <aside
          style={{
            width: 240,
            borderRight: '1px solid var(--click-color-border-default, #e0e0e0)',
            padding: 16,
            flexShrink: 0,
          }}
        >
          {sidebar}
        </aside>
      )}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {header && (
          <header
            style={{
              padding: '12px 24px',
              borderBottom: '1px solid var(--click-color-border-default, #e0e0e0)',
            }}
          >
            {header}
          </header>
        )}
        <main style={{ flex: 1, padding: 24 }}>{children}</main>
      </div>
    </div>
  );
}
