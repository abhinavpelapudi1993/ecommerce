import { Fragment, useState } from 'react';
import { Text, Button } from '@clickhouse/click-ui';
import {
  PurchaseStatus,
  ShipmentStatus,
  TransactionType,
  TransactionStatus,
} from '@ecommerce/data-client';
import type { Purchase, Shipment, Transaction } from '@ecommerce/data-client';

type RefundAction = 'return' | 'refund';

interface PurchaseTableProps {
  purchases: Purchase[];
  onReturn?: (purchase: Purchase) => void;
  onRefund?: (purchase: Purchase) => void;
  onCancel?: (purchase: Purchase) => void;
  shipments?: Record<string, Shipment>;
  onUpdateShipment?: (shipmentId: string, status: ShipmentStatus) => void;
  onFetchTransactions?: (purchaseId: string) => Promise<Transaction[]>;
}

const statusColors: Record<string, string> = {
  [PurchaseStatus.Pending]: '#3b82f6',
  [PurchaseStatus.Settled]: '#22c55e',
  [PurchaseStatus.PartiallyRefunded]: '#eab308',
  [PurchaseStatus.Refunded]: '#ef4444',
  [PurchaseStatus.SettlementFailed]: '#dc2626',
  [PurchaseStatus.RefundFailed]: '#dc2626',
  [PurchaseStatus.Cancelled]: '#6b7280',
};

const shipmentStatusColors: Record<string, string> = {
  [ShipmentStatus.Processing]: '#3b82f6',
  [ShipmentStatus.Shipped]: '#f59e0b',
  [ShipmentStatus.Delivered]: '#22c55e',
  [ShipmentStatus.Returned]: '#a855f7',
  [ShipmentStatus.Cancelled]: '#6b7280',
};

const nextStatus: Record<string, ShipmentStatus> = {
  [ShipmentStatus.Processing]: ShipmentStatus.Shipped,
  [ShipmentStatus.Shipped]: ShipmentStatus.Delivered,
};

const nextStatusLabel: Record<string, string> = {
  [ShipmentStatus.Processing]: 'Mark Shipped',
  [ShipmentStatus.Shipped]: 'Mark Delivered',
};

const txTypeLabels: Record<string, string> = {
  [TransactionType.OrderPlaced]: 'Order Placed',
  [TransactionType.ShipmentDelivered]: 'Shipment Delivered',
  [TransactionType.Refund]: 'Refund',
  [TransactionType.SettlementFailed]: 'Settlement Failed',
  [TransactionType.RefundFailed]: 'Refund Failed',
  [TransactionType.OrderCancelled]: 'Order Cancelled',
};

const txTypeColors: Record<string, string> = {
  [TransactionType.OrderPlaced]: '#3b82f6',
  [TransactionType.ShipmentDelivered]: '#22c55e',
  [TransactionType.Refund]: '#ef4444',
  [TransactionType.SettlementFailed]: '#dc2626',
  [TransactionType.RefundFailed]: '#dc2626',
  [TransactionType.OrderCancelled]: '#6b7280',
};

function TransactionTimeline({ transactions, loading }: { transactions: Transaction[]; loading: boolean }) {
  if (loading) {
    return <Text color="muted" size="sm">Loading transactions...</Text>;
  }

  if (transactions.length === 0) {
    return <Text color="muted" size="sm">No transactions recorded yet.</Text>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {transactions.map((tx) => (
        <div
          key={tx.id}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            padding: '8px 12px',
            borderRadius: 6,
            background: 'var(--click-color-bg-hover, rgba(255,255,255,0.03))',
          }}
        >
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: txTypeColors[tx.type] || '#888',
              marginTop: 5,
              flexShrink: 0,
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
              <Text style={{ fontWeight: 600, fontSize: 13 }}>
                {txTypeLabels[tx.type] || tx.type}
              </Text>
              <Text size="sm" color="muted" style={{ flexShrink: 0 }}>
                {new Date(tx.createdAt).toLocaleString()}
              </Text>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginTop: 2 }}>
              <Text size="sm" color="muted">
                {tx.description || '—'}
              </Text>
              <Text size="sm" style={{ fontWeight: 500, flexShrink: 0 }}>
                {tx.type === TransactionType.Refund ? '-' : ''}${tx.amount.toFixed(2)}
              </Text>
            </div>
            <Text size="sm" color="muted" style={{ marginTop: 2 }}>
              Status:{' '}
              <span style={{ color: tx.status === TransactionStatus.Failed ? '#dc2626' : tx.status === TransactionStatus.Completed ? '#22c55e' : '#f59e0b' }}>
                {tx.status}
              </span>
            </Text>
            {tx.errorMessage && (
              <Text size="sm" color="danger" style={{ display: 'block', marginTop: 2 }}>
                {tx.errorMessage}
              </Text>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PurchaseTable({ purchases, onReturn, onRefund, onCancel, shipments, onUpdateShipment, onFetchTransactions }: PurchaseTableProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  if (purchases.length === 0) {
    return <Text color="muted">No purchases found.</Text>;
  }

  const hasActions = !!onReturn || !!onRefund || !!onCancel;
  const colCount = 7 + (hasActions ? 1 : 0);

  const toggleTransactions = async (purchaseId: string) => {
    if (expandedId === purchaseId) {
      setExpandedId(null);
      return;
    }

    setExpandedId(purchaseId);
    if (onFetchTransactions) {
      setTxLoading(true);
      try {
        const txs = await onFetchTransactions(purchaseId);
        setTransactions(txs);
      } catch {
        setTransactions([]);
      } finally {
        setTxLoading(false);
      }
    }
  };

  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={thStyle}>Date</th>
          <th style={thStyle}>Product</th>
          <th style={thStyle}>Qty</th>
          <th style={thStyle}>Total</th>
          <th style={thStyle}>Status</th>
          <th style={thStyle}>Shipment</th>
          <th style={thStyle}>Refunded</th>
          {hasActions && <th style={thStyle}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {purchases.map((p) => {
          const elapsed = p.settledAt ? Date.now() - new Date(p.settledAt).getTime() : 0;
          const isSettled = p.status === PurchaseStatus.Settled;
          const hasNoRefund = p.refundedAmount === 0;

          // Return: full refund, 1 min window from delivery, only if no refund has been processed yet
          const canReturn =
            onReturn && isSettled && hasNoRefund &&
            (!p.settledAt || elapsed <= 1 * 60 * 1000);

          // Refund: partial (max 50%), 2 min window from delivery, only if no refund has been processed yet
          const canRefund =
            onRefund && isSettled && hasNoRefund &&
            (!p.settledAt || elapsed <= 2 * 60 * 1000);
          const shipment = p.shipmentId && shipments ? shipments[p.shipmentId] : null;
          const canCancel = onCancel && p.status === PurchaseStatus.Pending &&
            (!shipment || shipment.status === ShipmentStatus.Processing);
          const isExpanded = expandedId === p.id;

          return (
            <Fragment key={p.id}>
              <tr
                onClick={() => onFetchTransactions && toggleTransactions(p.id)}
                style={{
                  cursor: onFetchTransactions ? 'pointer' : undefined,
                  background: isExpanded ? 'var(--click-color-bg-hover, rgba(255,255,255,0.03))' : undefined,
                }}
              >
                <td style={tdStyle}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </td>
                <td style={tdStyle}>
                  <Text>{p.productName}</Text>
                  <br />
                  <Text color="muted" size="sm">
                    {p.productSku}
                  </Text>
                  <br />
                  <Text color="muted" size="sm" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                    ID: {p.productId}
                  </Text>
                </td>
                <td style={tdStyle}>{p.quantity}</td>
                <td style={tdStyle}>
                  {p.status === PurchaseStatus.Cancelled || p.status === PurchaseStatus.Refunded ? (
                    <>
                      <Text style={{ textDecoration: 'line-through', opacity: 0.5 }}>${p.totalAmount.toFixed(2)}</Text>
                      <br />
                      <Text color="muted" size="sm">$0.00 (refunded)</Text>
                    </>
                  ) : p.refundedAmount > 0 ? (
                    <>
                      <Text>${(p.totalAmount - p.refundedAmount).toFixed(2)}</Text>
                      <br />
                      <Text color="muted" size="sm" style={{ textDecoration: 'line-through', opacity: 0.5 }}>${p.totalAmount.toFixed(2)}</Text>
                    </>
                  ) : (
                    <Text>${p.totalAmount.toFixed(2)}</Text>
                  )}
                </td>
                <td style={tdStyle}>
                  <span
                    style={{
                      color: statusColors[p.status] || '#888',
                      fontWeight: 500,
                      fontSize: 13,
                    }}
                  >
                    {p.status.replace('_', ' ')}
                  </span>
                  {p.errorMessage && (
                    <Text color="danger" size="sm" style={{ display: 'block', marginTop: 2 }}>
                      {p.errorMessage}
                    </Text>
                  )}
                </td>
                <td style={tdStyle}>
                  {shipment ? (
                    <div>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#fff',
                          background: shipmentStatusColors[shipment.status] || '#888',
                        }}
                      >
                        {shipment.status}
                      </span>
                      <br />
                      <Text color="muted" size="sm">{shipment.trackingNumber}</Text>
                      <br />
                      <Text color="muted" size="sm" style={{ fontSize: 11, wordBreak: 'break-all' }}>
                        ID: {p.shipmentId}
                      </Text>
                      {onUpdateShipment && p.shipmentId && nextStatus[shipment.status] && p.status !== PurchaseStatus.Cancelled && (
                        <button
                          onClick={(e) => { e.stopPropagation(); onUpdateShipment(p.shipmentId!, nextStatus[shipment.status]); }}
                          style={shipmentActionBtn}
                        >
                          {nextStatusLabel[shipment.status]}
                        </button>
                      )}
                    </div>
                  ) : p.shipmentId ? (
                    <Text color="muted" size="sm">Loading...</Text>
                  ) : (
                    <Text color="muted" size="sm">—</Text>
                  )}
                </td>
                <td style={tdStyle}>${p.refundedAmount.toFixed(2)}</td>
                {hasActions && (
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                      {canCancel && (
                        <Button type="secondary" onClick={() => onCancel(p)}>
                          Cancel Order
                        </Button>
                      )}
                      {canReturn && (
                        <Button onClick={() => onReturn(p)}>
                          Return
                        </Button>
                      )}
                      {canRefund && (
                        <Button onClick={() => onRefund(p)}>
                          Refund
                        </Button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
              {isExpanded && (
                <tr key={`${p.id}-tx`}>
                  <td colSpan={colCount} style={{ padding: '12px 24px', background: 'var(--click-color-bg-hover, rgba(255,255,255,0.02))' }}>
                    <Text style={{ fontWeight: 600, display: 'block', marginBottom: 8 }}>
                      Transaction History
                    </Text>
                    <TransactionTimeline transactions={transactions} loading={txLoading} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 12px',
  borderBottom: '2px solid var(--click-color-border-default, #e0e0e0)',
  fontSize: 13,
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderBottom: '1px solid var(--click-color-border-default, #f0f0f0)',
  fontSize: 14,
  verticalAlign: 'top',
};

const shipmentActionBtn: React.CSSProperties = {
  display: 'block',
  marginTop: 4,
  padding: '2px 8px',
  borderRadius: 4,
  border: '1px solid var(--click-color-border-default, #555)',
  background: 'transparent',
  color: 'inherit',
  fontSize: 11,
  cursor: 'pointer',
};
