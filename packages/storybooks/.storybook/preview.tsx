import React from 'react';
import { ClickUIProvider } from '@clickhouse/click-ui';
import type { Preview } from '@storybook/react';

const preview: Preview = {
  decorators: [
    (Story) => (
      <ClickUIProvider theme="dark">
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </ClickUIProvider>
    ),
  ],
};

export default preview;
