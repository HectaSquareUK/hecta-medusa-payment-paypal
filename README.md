# @hectasquare/medusa-payment-paypal

A professional-grade PayPal payment provider module for Medusa v2.13+. This module facilitates seamless integration with the PayPal Orders API, supporting advanced features such as payment capture, refund management, and secure payment method vaulting.

## Key Features

*   **PayPal Orders API v2 Integration**: Utilizes the latest PayPal API standards for robust payment processing.
*   **Automatic Payment Capture**: Optimized workflows for immediate fund capture upon authorization.
*   **Complete Refund Management**: Integrated support for full and partial refunds with comprehensive transaction tracking.
*   **Vault API Support**: Securely store customer payment methods to enhance the checkout experience for returning users.
*   **Webhook Synchronization**: Automated handling of PayPal system events to ensure real-time data consistency.
*   **Type Safety**: Fully implemented in TypeScript to provide comprehensive compile-time verification.

## Installation

To integrate the module into your Medusa project, install the package via your preferred package manager:

```bash
npm install @hectasquare/medusa-payment-paypal
```

Alternatively, using pnpm:

```bash
pnpm add @hectasquare/medusa-payment-paypal
```

## Configuration

### 1. Environment Variables

Configure the required PayPal credentials in your application's `.env` file:

```env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_SANDBOX=true
```

Credentials can be obtained through the [PayPal Developer Portal](https://developer.paypal.com/).

### 2. Medusa Configuration

Register the provider within your `medusa-config.ts` configuration file:

```typescript
import { defineConfig } from '@medusajs/framework'

export const config = defineConfig({
  modules: {
    payment: [
      {
        resolve: '@hectasquare/medusa-payment-paypal',
        options: {
          isSandbox: isSandbox,
          clientId: process.env.PAYPAL_CLIENT_ID,
          clientSecret: process.env.PAYPAL_CLIENT_SECRET,
          isSandbox: process.env.PAYPAL_SANDBOX === 'true'// add PAYPAL_SANDBOX in env to true or false , variable to toggle sandbox mode
        }
      }
    ]
  }
})
```

## Integration Workflow

1.  **Selection**: The customer chooses PayPal as the payment method during checkout.
2.  **Order Creation**: An order is initialized via the PayPal Orders API.
3.  **Authorization**: The customer authorizes the transaction through the PayPal interface.
4.  **Capture and Verification**: The system captures the payment and updates the order status in Medusa.

## Configuration Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `clientId` | string | Yes | The PayPal REST API Client ID. |
| `clientSecret` | string | Yes | The PayPal REST API Client Secret. |
| `isSandbox` | boolean | No | Enables the PayPal Sandbox environment (default: `false`). |

## Support and Troubleshooting

For technical assistance or to report issues, please consult the documentation or visit our [GitHub repository](https://github.com/HectaSquareUK/hecta-medusa-payment-paypal).

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
