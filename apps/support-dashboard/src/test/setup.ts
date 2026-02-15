import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';
import React from 'react';

// Mock @clickhouse/click-ui to avoid styled-components ThemeProvider requirement
vi.mock('@clickhouse/click-ui', () => ({
  Title: ({ children, ...props }: any) => React.createElement('div', props, children),
  Text: ({ children, ...props }: any) => React.createElement('span', props, children),
  Button: ({ children, onClick, ...props }: any) => React.createElement('button', { onClick, ...props }, children),
}));
