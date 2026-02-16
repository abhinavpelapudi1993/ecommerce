import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Text } from '@clickhouse/click-ui';
import { PageContainer, PromoCodeInput } from '@ecommerce/ui-components';
import {
  useServices,
  createPurchaseStore,
  createPromoStore,
} from '@ecommerce/state-service';
import { ShipmentStatus } from '@ecommerce/data-client';
import type { ValidatePromoResponse, Shipment, Product, Address } from '@ecommerce/data-client';
import { useCustomer } from '../customer-context';

export function ProductPage() {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const { customer } = useCustomer();
  const services = useServices();

  const purchaseStore = useMemo(() => createPurchaseStore(services), [services]);
  const promoStore = useMemo(() => createPromoStore(services), [services]);

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [shippingAddress, setShippingAddress] = useState<Address | null>(null);

  useEffect(() => {
    if (productId) {
      services.productClient.getProduct(productId).then(setProduct).catch(() => {});
    }
  }, [productId]);

  // Fetch full customer profile (with shipping address) from API
  useEffect(() => {
    if (customer?.id) {
      services.customerClient.getCustomer(customer.id)
        .then((fullCustomer) => {
          if (fullCustomer.shippingAddress) {
            setShippingAddress({ ...fullCustomer.shippingAddress });
          }
        })
        .catch(() => {});
    }
  }, [customer?.id]);

  const handleValidatePromo = async (code: string): Promise<ValidatePromoResponse> => {
    const purchaseAmount = product ? product.price * quantity : 100;
    return promoStore.getState().validatePromo(code, purchaseAmount);
  };

  const handleApplyPromo = (code: string, discountAmount: number) => {
    setPromoCode(code);
    setDiscount(discountAmount);
  };

  const updateAddress = (field: keyof Address, value: string) => {
    setShippingAddress((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  const handlePurchase = async () => {
    if (!productId || !customer || !shippingAddress) return;
    setPurchasing(true);
    setError(null);

    try {
      const purchase = await purchaseStore.getState().createPurchase(
        customer.id,
        productId,
        quantity,
        promoCode || undefined,
        shippingAddress,
      );
      setSuccess(true);
      if (purchase.shipmentId) {
        services.shipmentClient.getShipment(purchase.shipmentId)
          .then(setShipment)
          .catch(() => {});
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  if (success) {
    return (
      <PageContainer title="Purchase Complete">
        <Text style={{ display: 'block', marginBottom: 16 }}>
          Your order has been placed and is being shipped.
        </Text>

        {shipment && (
          <div style={shipmentCard}>
            <Text size="sm" color="muted" style={{ display: 'block', marginBottom: 8 }}>
              Shipment Details
            </Text>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <Text size="sm" color="muted">Status</Text>
                <div>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#fff',
                    background: shipment.status === ShipmentStatus.Delivered ? '#22c55e'
                      : shipment.status === ShipmentStatus.Shipped ? '#f59e0b' : '#3b82f6',
                  }}>
                    {shipment.status}
                  </span>
                </div>
              </div>
              <div>
                <Text size="sm" color="muted">Tracking</Text>
                <Text style={{ display: 'block', fontWeight: 600 }}>{shipment.trackingNumber}</Text>
              </div>
              <div>
                <Text size="sm" color="muted">Ship To</Text>
                <Text style={{ display: 'block' }}>
                  {shipment.shippingAddress.line1}, {shipment.shippingAddress.city}, {shipment.shippingAddress.state}
                </Text>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <Button onClick={() => navigate('/')}>Continue Shopping</Button>
          <Button onClick={() => navigate('/purchases')}>View Purchases</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Purchase">
      <div style={{ maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="qty">
            <Text size="sm">Quantity</Text>
          </label>
          <input
            id="qty"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            style={inputStyle}
          />
        </div>

        <PromoCodeInput onValidate={handleValidatePromo} onApply={handleApplyPromo} />

        {discount > 0 && (
          <Text color="default">
            Promo applied: -${discount.toFixed(2)}
          </Text>
        )}

        {/* Shipping Address Confirmation */}
        {shippingAddress && (
          <div style={addressCard}>
            <Text size="sm" color="muted" style={{ display: 'block', marginBottom: 8 }}>
              Shipping Address
            </Text>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                placeholder="Address line 1"
                value={shippingAddress.line1}
                onChange={(e) => updateAddress('line1', e.target.value)}
                style={inputStyle}
              />
              <input
                placeholder="Address line 2 (optional)"
                value={shippingAddress.line2 || ''}
                onChange={(e) => updateAddress('line2', e.target.value)}
                style={inputStyle}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="City"
                  value={shippingAddress.city}
                  onChange={(e) => updateAddress('city', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  placeholder="State"
                  value={shippingAddress.state}
                  onChange={(e) => updateAddress('state', e.target.value)}
                  style={{ ...inputStyle, width: 80 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder="Postal code"
                  value={shippingAddress.postalCode}
                  onChange={(e) => updateAddress('postalCode', e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                />
                <input
                  placeholder="Country"
                  value={shippingAddress.country}
                  onChange={(e) => updateAddress('country', e.target.value)}
                  style={{ ...inputStyle, width: 80 }}
                />
              </div>
            </div>
          </div>
        )}

        {error && <Text color="danger">{error}</Text>}

        <Button onClick={handlePurchase} disabled={purchasing || !shippingAddress}>
          {purchasing ? 'Processing...' : 'Complete Purchase'}
        </Button>
      </div>
    </PageContainer>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--click-color-border-default, #ccc)',
  marginTop: 4,
  color: '#fff',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
};

const shipmentCard: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: 8,
  border: '1px solid var(--click-color-border-default, #333)',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
};

const addressCard: React.CSSProperties = {
  padding: '16px 20px',
  borderRadius: 8,
  border: '1px solid var(--click-color-border-default, #ccc)',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.03))',
};
