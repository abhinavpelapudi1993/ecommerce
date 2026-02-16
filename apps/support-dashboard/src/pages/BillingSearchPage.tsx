import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import type { Customer } from '@ecommerce/data-client';

export function BillingSearchPage() {
  const navigate = useNavigate();
  const { customerClient } = useServices();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Customer[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const customers = await customerClient.searchCustomers(query.trim());
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
    <PageContainer title="Billing Lookup">
      <div style={{ maxWidth: 600 }}>
        <Text color="muted" style={{ display: 'block', marginBottom: 16 }}>
          Search for a customer to view their billing and credit history.
        </Text>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter customer email or ID..."
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            style={inputStyle}
          />
          <Button onClick={handleSearch} disabled={!query.trim() || loading}>
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
              Select a customer to view their billing
            </Text>
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/customer/${c.id}/billing`)}
                style={resultButton}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#FADB14')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--click-color-border-default, #555)')}
              >
                <div style={avatarStyle}>{c.name[0]}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <Text style={{ display: 'block', fontWeight: 600 }}>{c.name}</Text>
                  <Text color="muted" size="sm">{c.email}</Text>
                </div>
                <Text color="muted">&rarr;</Text>
              </button>
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
  color: '#fff',
};

const emptyState: React.CSSProperties = {
  padding: 32,
  textAlign: 'center',
  border: '1px dashed var(--click-color-border-default, #555)',
  borderRadius: 8,
};

const resultButton: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '14px 16px',
  borderRadius: 8,
  border: '1px solid var(--click-color-border-default, #555)',
  background: 'transparent',
  cursor: 'pointer',
  transition: 'border-color 0.15s',
  color: 'inherit',
  width: '100%',
};

const avatarStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: '50%',
  background: '#FADB14',
  color: '#1a1a2e',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
  fontSize: 15,
  flexShrink: 0,
};
