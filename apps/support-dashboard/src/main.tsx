import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClickUIProvider } from '@clickhouse/click-ui';
import { ServiceProvider } from '@ecommerce/state-service';
import { container } from './bootstrap';
import { App } from './App';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ClickUIProvider theme="dark">
      <ServiceProvider container={container}>
        <App />
      </ServiceProvider>
    </ClickUIProvider>
  </StrictMode>,
);
