# @hectasquare/medusa-payment-paypal

A comprehensive PayPal payment provider for Medusa v2.10+ using the latest PayPal Server SDK.

## Features

-  Full PayPal Orders API integration
-  Automatic payment capture with CAPTURE intent
-  Complete refund support with capture ID tracking
-  PayPal Vault API for saving payment methods
-  Extensive logging for debugging
-  TypeScript support
-  Compatible with Medusa v2.10+

## Installation

\\\ash
npm install @hectasquare/medusa-payment-paypal
\\\

or with pnpm:

\\\ash
pnpm add @hectasquare/medusa-payment-paypal
\\\

## Configuration

Add to your \medusa-config.ts\:

\\\	ypescript
import { defineConfig } from '@medusajs/framework'
import paypalProvider from '@hectasquare/medusa-payment-paypal'

export const config = defineConfig({
  // ... other config
  modules: {
    payment: [
      {
        resolve: '@hectasquare/medusa-payment-paypal',
        options: {
          clientId: process.env.PAYPAL_CLIENT_ID,
          clientSecret: process.env.PAYPAL_CLIENT_SECRET,
          isSandbox: process.env.PAYPAL_SANDBOX === 'true'
        }
      }
    ]
  }
})
\\\

## Environment Variables

\\\
PAYPAL_CLIENT_ID=your_client_id_here
PAYPAL_CLIENT_SECRET=your_client_secret_here
PAYPAL_SANDBOX=true # Set to false for production
\\\

## Support

For issues and feature requests, please visit our [GitHub repository](https://github.com/HectaSquareUK/medusa-payment-paypal).

## License

MIT
