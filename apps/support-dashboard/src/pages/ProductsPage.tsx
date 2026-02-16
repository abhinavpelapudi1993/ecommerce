import { useEffect, useState, type FormEvent } from 'react';
import { Button, Title, Text } from '@clickhouse/click-ui';
import { PageContainer } from '@ecommerce/ui-components';
import { useServices } from '@ecommerce/state-service';
import type { Product, CreateProductRequest, UpdateProductRequest } from '@ecommerce/data-client';

interface ProductFormData {
  name: string;
  sku: string;
  price: string;
  stock: string;
  description: string;
}

const emptyForm: ProductFormData = {
  name: '',
  sku: '',
  price: '',
  stock: '',
  description: '',
};

export function ProductsPage() {
  const services = useServices();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await services.productClient.listProducts();
      setProducts(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openAdd = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError(null);
    setShowModal(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      sku: product.sku,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description,
    });
    setFormError(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setForm(emptyForm);
    setFormError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.name.trim() || !form.sku.trim() || !form.price || !form.stock) {
      setFormError('Name, SKU, price, and stock are required');
      return;
    }

    const price = parseFloat(form.price);
    const stock = parseInt(form.stock);
    if (isNaN(price) || price < 0) {
      setFormError('Enter a valid price');
      return;
    }
    if (isNaN(stock) || stock < 0) {
      setFormError('Enter a valid stock quantity');
      return;
    }

    setSubmitting(true);
    try {
      if (editingProduct) {
        const request: UpdateProductRequest = {
          name: form.name.trim(),
          description: form.description.trim(),
          price,
          stock,
        };
        await services.productClient.updateProduct(editingProduct.id, request);
      } else {
        const request: CreateProductRequest = {
          name: form.name.trim(),
          sku: form.sku.trim(),
          description: form.description.trim(),
          price,
          stock,
        };
        await services.productClient.createProduct(request);
      }
      closeModal();
      await fetchProducts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await services.productClient.deleteProduct(deleteTarget.id);
      setDeleteTarget(null);
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageContainer
      title="Products"
      actions={
        <Button onClick={openAdd}>Add Product</Button>
      }
    >
      {error && (
        <Text color="danger" style={{ display: 'block', marginBottom: 12 }}>
          {error}
        </Text>
      )}

      {loading && products.length === 0 ? (
        <Text color="muted">Loading products...</Text>
      ) : products.length === 0 ? (
        <Text color="muted">No products found. Add one above.</Text>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>SKU</th>
              <th style={thStyle}>Price</th>
              <th style={thStyle}>Stock</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td style={tdStyle}>
                  <Text>{p.name}</Text>
                  {p.description && (
                    <>
                      <br />
                      <Text color="muted" size="sm">{p.description}</Text>
                    </>
                  )}
                </td>
                <td style={tdStyle}>
                  <code>{p.sku}</code>
                </td>
                <td style={tdStyle}>${p.price.toFixed(2)}</td>
                <td style={tdStyle}>
                  <span style={{ color: p.stock <= 0 ? '#ef4444' : p.stock < 10 ? '#eab308' : 'inherit' }}>
                    {p.stock}
                  </span>
                </td>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button type="secondary" onClick={() => openEdit(p)}>
                      Edit
                    </Button>
                    <Button type="secondary" onClick={() => setDeleteTarget(p)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Product Form Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: 'var(--click-color-bg-default, #fff)',
              color: '#1a1a2e',
              borderRadius: 12,
              padding: 24,
              width: 460,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Title type="h3">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </Title>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}
            >
              <div>
                <label htmlFor="product-name">
                  <Text size="sm">Name</Text>
                </label>
                <input
                  id="product-name"
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Product name"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="product-sku">
                  <Text size="sm">SKU</Text>
                </label>
                <input
                  id="product-sku"
                  type="text"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  placeholder="e.g., WIDGET-001"
                  disabled={!!editingProduct}
                  style={{
                    ...inputStyle,
                    opacity: editingProduct ? 0.6 : 1,
                  }}
                />
              </div>
              <div>
                <label htmlFor="product-price">
                  <Text size="sm">Price ($)</Text>
                </label>
                <input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="product-stock">
                  <Text size="sm">Stock</Text>
                </label>
                <input
                  id="product-stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  style={inputStyle}
                />
              </div>
              <div>
                <label htmlFor="product-description">
                  <Text size="sm">Description</Text>
                </label>
                <textarea
                  id="product-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                  }}
                />
              </div>
              {formError && <Text color="danger">{formError}</Text>}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Button type="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            style={{
              background: 'var(--click-color-bg-default, #fff)',
              color: '#1a1a2e',
              borderRadius: 12,
              padding: 24,
              width: 400,
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Title type="h3">Delete Product</Title>
            <Text style={{ display: 'block', margin: '12px 0' }}>
              Are you sure you want to delete "{deleteTarget.name}" ({deleteTarget.sku})?
              This action cannot be undone.
            </Text>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button type="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid var(--click-color-border-default, #ccc)',
  width: '100%',
  marginTop: 4,
  color: '#1a1a2e',
  background: 'var(--click-color-bg-panel, rgba(255,255,255,0.05))',
};

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
