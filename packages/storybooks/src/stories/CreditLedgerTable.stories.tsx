import type { Meta, StoryObj } from '@storybook/react';
import { CreditLedgerTable } from '@ecommerce/ui-components';
import { mockLedger } from '../mocks/credits';

const meta: Meta<typeof CreditLedgerTable> = {
  title: 'Credit/CreditLedgerTable',
  component: CreditLedgerTable,
};

export default meta;
type Story = StoryObj<typeof CreditLedgerTable>;

export const Default: Story = {
  args: {
    entries: mockLedger,
  },
};

export const Empty: Story = {
  args: {
    entries: [],
  },
};
