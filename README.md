# 🔥 Medusa Payment PayPal in 100 Seconds

Shipping a Medusa store? You need payments that actually work. Meet the production-ready PayPal module for Medusa v2.13+. High performance. Type-safe. Zero friction.

## 🚀 Why this is the GOAT of PayPal Modules

- **Orders API v2**: The industry standard for capturing payments. No legacy junk.
- **Instant Capture**: Because nobody likes waiting for their money.
- **Refunds That Work**: Full tracking with Capture IDs. No more missing transactions.
- **Vault API**: Store payment methods securely. Let your customers skip the form.
- **Real-time Webhooks**: Stay synced with PayPal events automatically.
- **TypeScript Optimized**: 100% type-safe. Catch bugs before they ship.

## 🛠️ Get it Running (Fast)

Install the dependency and get back to building:

```bash
npm install @hectasquare/medusa-payment-paypal
# or if you like speed
pnpm add @hectasquare/medusa-payment-paypal
```

## ⚙️ Configure the Environment

Grab your keys from the [PayPal Developer Portal](https://developer.paypal.com/) and drop them in your `.env`:

```env
PAYPAL_CLIENT_ID=your_id_here
PAYPAL_CLIENT_SECRET=your_secret_here
PAYPAL_SANDBOX=true # Switch to false for production
```

## 💻 The Code

Wire it up in your `medusa-config.ts`. It's just a few lines of boilerplate:

```typescript
import { defineConfig } from '@medusajs/framework'

export const config = defineConfig({
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
```

## 🏗️ How it Ships

1. **Checkout**: Customer picks PayPal.
2. **Handshake**: We talk to the Orders API.
3. **Approval**: Customer approves on the PayPal UI.
4. **Win**: Payment is captured and Medusa is updated.

## 📄 Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `clientId` | string | ✅ | PayPal Client ID |
| `clientSecret` | string | ✅ | PayPal Client Secret |
| `isSandbox` | boolean | ❌ | Sandbox toggle (default: false) |

---

**Issues?** Check your credentials. 
**Errors?** Check your types.
**Ready?** Ship it. 🚀

[GitHub Repository](https://github.com/HectaSquareUK/medusa-payment-paypal)

## Contributing

Contributions are welcome. Open issues or pull requests on our [GitHub repository](https://github.com/HectaSquareUK/medusa-payment-paypal).

## License

MIT - see [LICENSE](LICENSE)
