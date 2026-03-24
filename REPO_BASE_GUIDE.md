# Repo Base Guide

## Important directories

- `functions/api/` — backend API routes
- `public/js/` — frontend modules
- `admin/` — admin pages
- `members/` — member pages
- `shop/` — storefront pages
- `checkout/` — checkout and confirmation pages

## Important backend groups

### Payments
- `checkout-create-order.js`
- `checkout-prepare-payment.js`
- `paypal-return.js`
- `paypal-webhook.js`
- `payment-providers.js`

### Product/media/admin
- `admin/products.js`
- `admin/product-detail.js`
- `admin/create-product.js`
- `admin/update-product.js`
- `admin/product-seo.js`
- `admin/product-image-annotations.js`
- `admin/product-images.js`
- `admin/site-item-inventory.js`

### Analytics
- `track/visit.js`
- `track/cart.js`
- `admin/visitor-analytics.js`

## Important frontend modules

- `site-analytics.js`
- `checkout.js`
- `order-confirmation.js`
- `admin-product-images.js`
- `admin-product-image-annotations.js`
- `admin-product-seo.js`
- `admin-site-item-inventory.js`
