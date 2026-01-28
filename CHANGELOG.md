# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-10-13

### ⚠️ BREAKING CHANGES
- **SDK Migration**: Migrated from `@paypal/checkout-server-sdk` (deprecated) to `@paypal/paypal-server-sdk` (latest)
- Removed hybrid SDK approach in favor of unified SDK implementation
- All functionality now uses the latest PayPal Server SDK

### Changed
- 🔄 **Unified SDK**: Replaced hybrid SDK architecture with single `@paypal/paypal-server-sdk`
- ✨ **Core Payments**: All Orders and Payments API calls now use new SDK controllers
  - `OrdersController.createOrder()` for order creation
  - `OrdersController.captureOrder()` for payment capture
  - `OrdersController.getOrder()` for status retrieval
  - `PaymentsController.refundCapturedPayment()` for refunds
- 🎯 **Vault API**: Vault functionality continues to use same SDK (no changes)
- 📝 **TypeScript**: Improved type safety with latest SDK type definitions

### Removed
- ❌ `@paypal/checkout-server-sdk` dependency (deprecated by PayPal)
- ❌ `@types/paypal__checkout-server-sdk` dev dependency

### Why This Update?
PayPal's `@paypal/checkout-server-sdk` is no longer maintained. The new `@paypal/paypal-server-sdk` provides:
- ✅ Continued maintenance and security updates
- ✅ Complete feature parity for Orders and Payments APIs
- ✅ Better TypeScript support
- ✅ Unified API design across all PayPal services

### Migration Guide
No changes required for most users! The provider interface remains the same. Simply update the package:

```bash
npm install @rd1988/medusa-payment-paypal@^2.0.0
```

The payment flow, Vault API, and all configuration remain unchanged.

## [1.0.0] - 2024-10-13

### Added
- 🎉 Initial release
- ✅ Complete PayPal payment integration for Medusa v2.10+
- ✅ Core payment functionality
  - Create orders
  - Authorize and capture payments
  - Refund handling
  - Webhook integration
- ✅ Vault API support (US only)
  - Save payment methods using Setup Tokens
  - List saved payment methods
- ✅ Account holder management
  - Create customer accounts
  - Update customer information
  - Delete customer accounts
- ✅ Hybrid SDK approach
  - `@paypal/checkout-server-sdk` for core payments
  - `@paypal/paypal-server-sdk` for Vault API
- ✅ Proper status mapping (PayPal COMPLETED → Medusa CAPTURED)
- ✅ Automatic amount conversion (cents ↔ dollars)
- ✅ TypeScript support
- ✅ Sandbox and production environment support

### Technical Details
- Based on official @medusajs/payment-stripe implementation pattern
- Full TypeScript type definitions
- Comprehensive error handling
- Follows Medusa v2 payment provider specification

### Documentation
- Complete README with setup instructions
- API reference
- Frontend integration guide
- Troubleshooting section

[1.0.0]: https://github.com/yourusername/medusa-payment-paypal/releases/tag/v1.0.0

