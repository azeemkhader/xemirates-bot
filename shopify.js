/**
 * Shopify API Module
 * Handles all communication with the Shopify Admin API
 */

const axios = require('axios');

class ShopifyAPI {
  constructor(shopDomain, accessToken) {
    this.baseURL = `https://${shopDomain}/admin/api/2024-01`;
    this.headers = {
      'X-Shopify-Access-Token': accessToken,
      'Content-Type': 'application/json',
    };
  }

  // ─────────────────────────────────────────────
  // Fetch all products (returns simplified list)
  // ─────────────────────────────────────────────
  async getProducts() {
    try {
      const res = await axios.get(`${this.baseURL}/products.json?limit=50&fields=id,title,variants`, {
        headers: this.headers,
      });

      return res.data.products.map((p) => ({
        id: p.id,
        title: p.title,
        variants: p.variants.map((v) => ({
          id: v.id,
          title: v.title,
          price: v.price,
          sku: v.sku,
          available: v.inventory_quantity > 0 || v.inventory_management === null,
        })),
      }));
    } catch (err) {
      console.error('❌ Shopify getProducts error:', err.response?.data || err.message);
      return [];
    }
  }

  // ─────────────────────────────────────────────
  // Create a Draft Order in Shopify
  // ─────────────────────────────────────────────
  async createDraftOrder({ customerName, customerEmail, phone, lineItems, shippingAddress, note }) {
    const nameParts = customerName.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '-';

    const payload = {
      draft_order: {
        line_items: lineItems.map((item) => ({
          variant_id: item.variantId,
          quantity: item.quantity,
        })),
        customer: {
          first_name: firstName,
          last_name: lastName,
          email: customerEmail || undefined,
          phone: phone || undefined,
        },
        shipping_address: shippingAddress
          ? {
              first_name: firstName,
              last_name: lastName,
              address1: shippingAddress.address1,
              city: shippingAddress.city,
              country: shippingAddress.country || 'AE',
              zip: shippingAddress.zip || '00000',
              phone: phone || undefined,
            }
          : undefined,
        note: note || 'Order via WhatsApp Bot',
        use_customer_default_address: false,
      },
    };

    try {
      const res = await axios.post(`${this.baseURL}/draft_orders.json`, payload, {
        headers: this.headers,
      });

      const draft = res.data.draft_order;
      return {
        success: true,
        orderId: draft.id,
        orderName: draft.name,
        invoiceUrl: draft.invoice_url,
        total: draft.total_price,
        currency: draft.currency,
      };
    } catch (err) {
      console.error('❌ Shopify createDraftOrder error:', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.errors || err.message };
    }
  }

  // ─────────────────────────────────────────────
  // Complete (confirm) a Draft Order → real order
  // ─────────────────────────────────────────────
  async completeDraftOrder(draftOrderId) {
    try {
      const res = await axios.put(
        `${this.baseURL}/draft_orders/${draftOrderId}/complete.json`,
        {},
        { headers: this.headers }
      );
      const order = res.data.draft_order;
      return {
        success: true,
        orderId: order.order_id,
        orderName: order.name,
      };
    } catch (err) {
      console.error('❌ Shopify completeDraftOrder error:', err.response?.data || err.message);
      return { success: false, error: err.response?.data?.errors || err.message };
    }
  }
}

module.exports = ShopifyAPI;
