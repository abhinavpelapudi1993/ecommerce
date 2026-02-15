import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import { PageContainer, CustomerCard } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import type { Customer } from '@ecommerce/data-client';

export function CustomersPage() {
  const navigate = useNavigate();
  const { customerClient } = useServices();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const handleSearch = async () => {
    const trimmed = query.trim();
    if (!trimmed || !isValidEmail(trimmed)) return;
    setLoading(true);
    try {
      const customers = await customerClient.searchCustomers(trimmed);
      setResults(customers);
      setSearched(true);
    } catch {
      setResults([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Customers">
      <div style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter customer's full email address..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={inputStyle}
          />
          <Button onClick={handleSearch} disabled={!isValidEmail(query.trim()) || loading}>
            Search
          </Button>
        </div>

        {loading && <Text color="muted">Searching...</Text>}

        {searched && !loading && results.length === 0 && (
          <div style={emptyState}>
            <Text color="muted">No customers found</Text>
          </div>
        )}

        {results.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Text size="sm" color="muted" style={{ marginBottom: 4, display: 'block' }}>
              {results.length} {results.length === 1 ? 'customer' : 'customers'} found
            </Text>
            {results.map((c) => (
              <CustomerCard
                key={c.id}
                customer={c}
                onSelect={() => navigate(`/customer/${c.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid var(--click-color-border-default, #555)',
  fontSize: 14,
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
  color: 'inherit',
};

const emptyState: React.CSSProperties = {
  padding: 32,
  textAlign: 'center',
  border: '1px dashed var(--click-color-border-default, #555)',
  borderRadius: 8,
};
