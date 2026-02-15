import { type ReactNode } from 'react';
import { Title } from '@clickhouse/click-ui';

interface PageContainerProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function PageContainer({ title, actions, children }: PageContainerProps) {
  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Title type="h2">{title}</Title>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      {children}
    </div>
  );
}
