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
import { AuthorizePaymentInput, AuthorizePaymentOutput, CancelPaymentInput, CancelPaymentOutput, CapturePaymentInput, CapturePaymentOutput, CreateAccountHolderInput, CreateAccountHolderOutput, DeleteAccountHolderInput, DeleteAccountHolderOutput, DeletePaymentInput, DeletePaymentOutput, GetPaymentStatusInput, GetPaymentStatusOutput, InitiatePaymentInput, InitiatePaymentOutput, ListPaymentMethodsInput, ListPaymentMethodsOutput, ProviderWebhookPayload, RefundPaymentInput, RefundPaymentOutput, RetrievePaymentInput, RetrievePaymentOutput, SavePaymentMethodInput, SavePaymentMethodOutput, UpdateAccountHolderInput, UpdateAccountHolderOutput, UpdatePaymentInput, UpdatePaymentOutput, WebhookActionResult } from "@medusajs/framework/types";
import { AbstractPaymentProvider } from "@medusajs/framework/utils";
import { Client } from "@paypal/paypal-server-sdk";
interface PayPalOptions {
    clientId: string;
    clientSecret: string;
    isSandbox?: boolean;
}
export default class PayPalProviderService extends AbstractPaymentProvider<PayPalOptions> {
    static identifier: string;
    protected readonly options_: PayPalOptions;
    protected readonly client_: Client;
    static validateOptions(options: PayPalOptions): void;
    constructor(container: any, options: PayPalOptions);
    /**
     * Create PayPal order
     *
     * Key:
     * - intent: CAPTURE (PayPal default)
     * - Amount conversion: cents -> dollars
     */
    initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput>;
    /**
     * Authorize/Capture payment
     *
     * Key:
     * - PayPal CAPTURE intent: authorize = capture
     * - Execute capture and return correct CAPTURED status
     */
    authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput>;
    /**
     * Capture payment
     *
     * PayPal already completes capture in authorizePayment
     * Just return current status
     */
    capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput>;
    /**
     * Cancel payment
     */
    cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput>;
    /**
     * Delete payment
     */
    deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput>;
    /**
     * Get payment status
     */
    getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput>;
    /**
     * Refund payment
     */
    refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput>;
    /**
     * Retrieve payment
     */
    retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput>;
    /**
     * Update payment
     */
    updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput>;
    /**
     * Handle webhook
     */
    getWebhookActionAndData(webhookData: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult>;
    /**
     * Map PayPal status to Medusa PaymentSessionStatus
     */
    private getStatus;
    /**
     * Create account holder (customer)
     */
    createAccountHolder({ context, }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput>;
    /**
     * Update account holder
     */
    updateAccountHolder({ context, data, }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput>;
    /**
     * Delete account holder
     */
    deleteAccountHolder({ context, }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput>;
    /**
     * Save payment method - PayPal Vault API
     */
    savePaymentMethod({ context, data, }: SavePaymentMethodInput): Promise<SavePaymentMethodOutput>;
    /**
     * List saved payment methods - PayPal Vault API
     */
    listPaymentMethods({ context, }: ListPaymentMethodsInput): Promise<ListPaymentMethodsOutput>;
}
export {};
//# sourceMappingURL=service.d.ts.map