"use strict";
/**
 * PayPal Payment Provider for Medusa 2.10+
 *
 * Using the latest @paypal/paypal-server-sdk for unified functionality:
 * - Orders API: Create orders, capture, query
 * - Payments API: Refund processing
 * - Vault API: Save payment methods, account management
 *
 * Based on official @medusajs/payment-stripe implementation pattern
 * Reference: https://github.com/medusajs/medusa/tree/develop/packages/modules/providers/payment-stripe
 * Documentation: https://docs.medusajs.com/resources/references/payment/provider
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@medusajs/framework/utils");
const paypal_server_sdk_1 = require("@paypal/paypal-server-sdk");
class PayPalProviderService extends utils_1.AbstractPaymentProvider {
    static validateOptions(options) {
        if (!options.clientId) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Required option `clientId` is missing in PayPal provider");
        }
        if (!options.clientSecret) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Required option `clientSecret` is missing in PayPal provider");
        }
    }
    constructor(container, options) {
        super(container, options);
        this.options_ = options;
        // Initialize PayPal client
        this.client_ = new paypal_server_sdk_1.Client({
            clientCredentialsAuthCredentials: {
                oAuthClientId: options.clientId,
                oAuthClientSecret: options.clientSecret,
            },
            environment: options.isSandbox
                ? paypal_server_sdk_1.Environment.Sandbox
                : paypal_server_sdk_1.Environment.Production,
        });
    }
    /**
     * Create PayPal order
     *
     * Key:
     * - intent: CAPTURE (PayPal default)
     * - Amount conversion: cents -> dollars
     */
    async initiatePayment(input) {
        const { currency_code, amount, data, context } = input;
        const ordersController = new paypal_server_sdk_1.OrdersController(this.client_);
        try {
            const response = await ordersController.createOrder({
                body: {
                    intent: paypal_server_sdk_1.CheckoutPaymentIntent.Capture,
                    purchaseUnits: [
                        {
                            amount: {
                                currencyCode: currency_code.toUpperCase(),
                                value: (amount / 100).toFixed(2), // cents to dollars
                            },
                            customId: data?.session_id || undefined,
                        },
                    ],
                    applicationContext: {
                        userAction: "PAY_NOW",
                    },
                },
                prefer: "return=representation",
            });
            const order = response.result;
            return {
                id: order.id,
                ...this.getStatus(order),
            };
        }
        catch (error) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal initiatePayment failed: ${error.message || error}`);
        }
    }
    /**
     * Authorize/Capture payment
     *
     * Key:
     * - PayPal CAPTURE intent: authorize = capture
     * - Execute capture and return correct CAPTURED status
     */
    async authorizePayment(input) {
        const { data } = input;
        const orderId = data?.id;
        if (!orderId) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "No PayPal order ID found for authorizePayment");
        }
        const ordersController = new paypal_server_sdk_1.OrdersController(this.client_);
        try {
            // PayPal CAPTURE intent: execute capture on authorize
            const response = await ordersController.captureOrder({
                id: orderId,
                prefer: "return=representation",
            });
            // Return CAPTURED status
            const result = response.result;
            // Extract and store capture_id for refunds (per Medusa docs)
            const captureId = result?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
            console.log("[PayPal] ========== AUTHORIZE PAYMENT ==========");
            console.log("[PayPal] Order ID:", result?.id);
            console.log("[PayPal] Order Status:", result?.status);
            console.log("[PayPal] Capture ID:", captureId);
            console.log("[PayPal] ========================================");
            const statusResult = this.getStatus(result);
            return {
                ...statusResult,
                data: { ...statusResult.data, capture_id: captureId }
            };
        }
        catch (error) {
            // If already captured (422 error), get status
            if (error.statusCode === 422) {
                return await this.getPaymentStatus(input);
            }
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal authorizePayment failed: ${error.message || error}`);
        }
    }
    /**
     * Capture payment
     *
     * PayPal already completes capture in authorizePayment
     * Just return current status
     */
    async capturePayment(input) {
        return await this.getPaymentStatus(input);
    }
    /**
     * Cancel payment
     */
    async cancelPayment(input) {
        return {
            data: input.data,
        };
    }
    /**
     * Delete payment
     */
    async deletePayment(input) {
        return await this.cancelPayment(input);
    }
    /**
     * Get payment status
     */
    async getPaymentStatus(input) {
        const { data } = input;
        const orderId = data?.id;
        if (!orderId) {
            return {
                status: utils_1.PaymentSessionStatus.PENDING,
                data: data || {},
            };
        }
        const ordersController = new paypal_server_sdk_1.OrdersController(this.client_);
        try {
            const response = await ordersController.getOrder({
                id: orderId,
            });
            return this.getStatus(response.result);
        }
        catch (error) {
            return {
                status: utils_1.PaymentSessionStatus.ERROR,
                data: data || {},
            };
        }
    }
    /**
     * Refund payment
     */
    async refundPayment(input) {
        const { data, amount } = input;
        // Extract capture ID from data
        const captureId = data?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        if (!captureId) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "No capture ID found for refund");
        }
        const paymentsController = new paypal_server_sdk_1.PaymentsController(this.client_);
        try {
            const refundRequest = {};
            if (amount && typeof amount === "number") {
                const currencyCode = data?.purchase_units?.[0]?.amount?.currency_code || "USD";
                refundRequest.amount = {
                    currencyCode: currencyCode.toUpperCase(),
                    value: (amount / 100).toFixed(2),
                };
            }
            const response = await paymentsController.refundCapturedPayment({
                captureId: captureId,
                body: refundRequest,
                prefer: "return=representation",
            });
            return { data: response.result };
        }
        catch (error) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal refundPayment failed: ${error.message || error}`);
        }
    }
    /**
     * Retrieve payment
     */
    async retrievePayment(input) {
        return await this.getPaymentStatus(input);
    }
    /**
     * Update payment
     */
    async updatePayment(input) {
        return await this.initiatePayment(input);
    }
    /**
     * Handle webhook
     */
    async getWebhookActionAndData(webhookData) {
        const { resource, event_type } = webhookData;
        switch (event_type) {
            case "PAYMENT.CAPTURE.COMPLETED":
                return {
                    action: utils_1.PaymentActions.SUCCESSFUL,
                    data: {
                        session_id: resource?.custom_id,
                        amount: parseFloat(resource?.amount?.value || "0") * 100,
                    },
                };
            case "PAYMENT.CAPTURE.DENIED":
            case "PAYMENT.CAPTURE.DECLINED":
                return {
                    action: utils_1.PaymentActions.FAILED,
                    data: {
                        session_id: resource?.custom_id,
                        amount: parseFloat(resource?.amount?.value || "0") * 100,
                    },
                };
            case "CHECKOUT.ORDER.APPROVED":
                return {
                    action: utils_1.PaymentActions.AUTHORIZED,
                    data: {
                        session_id: resource?.purchase_units?.[0]?.custom_id,
                        amount: parseFloat(resource?.purchase_units?.[0]?.amount?.value || "0") * 100,
                    },
                };
            case "PAYMENT.CAPTURE.REFUNDED":
                return {
                    action: utils_1.PaymentActions.SUCCESSFUL,
                    data: {
                        session_id: resource?.custom_id,
                        amount: parseFloat(resource?.amount?.value || "0") * 100,
                    },
                };
            default:
                return {
                    action: utils_1.PaymentActions.NOT_SUPPORTED,
                    data: {
                        session_id: "",
                        amount: 0,
                    },
                };
        }
    }
    /**
     * Map PayPal status to Medusa PaymentSessionStatus
     */
    getStatus(paypalOrder) {
        const status = paypalOrder.status;
        const data = paypalOrder;
        switch (status) {
            case "CREATED":
            case "SAVED":
                return {
                    status: utils_1.PaymentSessionStatus.PENDING,
                    data,
                };
            case "APPROVED":
                return {
                    status: utils_1.PaymentSessionStatus.PENDING,
                    data,
                };
            case "PAYER_ACTION_REQUIRED":
                return {
                    status: utils_1.PaymentSessionStatus.REQUIRES_MORE,
                    data,
                };
            case "COMPLETED":
                return {
                    status: utils_1.PaymentSessionStatus.CAPTURED,
                    data,
                };
            case "VOIDED":
                return {
                    status: utils_1.PaymentSessionStatus.CANCELED,
                    data,
                };
            default:
                return {
                    status: utils_1.PaymentSessionStatus.PENDING,
                    data,
                };
        }
    }
    /**
     * Create account holder (customer)
     */
    async createAccountHolder({ context, }) {
        const { account_holder, customer } = context;
        if (account_holder?.data?.id) {
            return { id: account_holder.data.id };
        }
        if (!customer) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "No customer provided while creating account holder");
        }
        const paypalCustomerId = `paypal_${customer.id}`;
        return {
            id: paypalCustomerId,
            data: {
                id: paypalCustomerId,
                email: customer.email,
                name: customer.company_name ||
                    `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
                    undefined,
                phone: customer.phone,
            },
        };
    }
    /**
     * Update account holder
     */
    async updateAccountHolder({ context, data, }) {
        const { account_holder, customer } = context;
        if (!account_holder?.data?.id) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Missing account holder ID");
        }
        const updatedData = {
            ...account_holder.data,
            ...data,
            email: customer?.email || account_holder.data.email,
            name: customer?.company_name ||
                `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim() ||
                account_holder.data.name,
        };
        return {
            data: updatedData,
        };
    }
    /**
     * Delete account holder
     */
    async deleteAccountHolder({ context, }) {
        const { account_holder } = context;
        if (!account_holder?.data?.id) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Missing account holder ID");
        }
        return {};
    }
    /**
     * Save payment method - PayPal Vault API
     */
    async savePaymentMethod({ context, data, }) {
        const accountHolderId = context?.account_holder?.data?.id;
        if (!accountHolderId) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, "Missing account holder ID for saving payment method");
        }
        const vaultController = new paypal_server_sdk_1.VaultController(this.client_);
        try {
            const setupTokenRequest = {
                payment_source: {
                    card: data?.card || {},
                },
                customer: {
                    id: accountHolderId,
                },
            };
            const response = await vaultController.createSetupToken({
                body: setupTokenRequest,
                paypalRequestId: context?.idempotency_key,
            });
            return {
                id: response.result.id || "",
                data: response.result,
            };
        }
        catch (error) {
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal savePaymentMethod failed: ${error.message || error}`);
        }
    }
    /**
     * List saved payment methods - PayPal Vault API
     */
    async listPaymentMethods({ context, }) {
        const accountHolderId = context?.account_holder?.data?.id;
        if (!accountHolderId) {
            return [];
        }
        const vaultController = new paypal_server_sdk_1.VaultController(this.client_);
        try {
            const response = await vaultController.listCustomerPaymentTokens({
                customerId: accountHolderId,
                pageSize: 100,
            });
            return (response.result.paymentTokens || []).map((token) => ({
                id: token.id,
                data: token,
            }));
        }
        catch (error) {
            if (error.statusCode === 404) {
                return [];
            }
            throw new utils_1.MedusaError(utils_1.MedusaError.Types.INVALID_DATA, `PayPal listPaymentMethods failed: ${error.message || error}`);
        }
    }
}
PayPalProviderService.identifier = "paypal";
exports.default = PayPalProviderService;
//# sourceMappingURL=service.js.map



