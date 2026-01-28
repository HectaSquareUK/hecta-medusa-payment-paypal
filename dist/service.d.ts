/**
 * PayPal Payment Provider for Medusa 2.10+
 *
 * 使用最新的 @paypal/paypal-server-sdk 统一实现所有功能：
 * - Orders API：创建订单、捕获、查询
 * - Payments API：退款处理
 * - Vault API：保存支付方式、账户管理
 *
 * 基于官方 @medusajs/payment-stripe 的实现模式
 * 参考：https://github.com/medusajs/medusa/tree/develop/packages/modules/providers/payment-stripe
 * 文档：https://docs.medusajs.com/resources/references/payment/provider
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
     * 创建 PayPal 订单
     *
     * 🔑 关键：
     * - intent: CAPTURE (PayPal 默认)
     * - 金额转换：cents -> dollars
     */
    initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput>;
    /**
     * 授权/捕获支付
     *
     * 🔑 关键：
     * - PayPal CAPTURE intent：authorize = capture
     * - 执行捕获并返回正确的 CAPTURED 状态
     *
     * 参考 Stripe provider：authorizePayment 调用 getPaymentStatus
     * 但 PayPal 需要执行实际的 capture API 调用
     */
    authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput>;
    /**
     * 捕获支付
     *
     * PayPal 已在 authorizePayment 中完成捕获
     * 这里只需返回当前状态
     */
    capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput>;
    /**
     * 取消支付
     */
    cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput>;
    /**
     * 删除支付
     */
    deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput>;
    /**
     * 获取支付状态
     *
     * 参考 Stripe provider 的实现
     */
    getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput>;
    /**
     * 退款
     */
    refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput>;
    /**
     * 检索支付
     */
    retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput>;
    /**
     * 更新支付
     *
     * PayPal Orders API 创建后不支持更新金额
     * 需要创建新订单
     */
    updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput>;
    /**
     * 处理 Webhook
     *
     * PayPal Webhooks 参考：
     * https://developer.paypal.com/api/rest/webhooks/event-names/
     */
    getWebhookActionAndData(webhookData: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult>;
    /**
     * 🔑 关键方法：将 PayPal 状态映射到 Medusa PaymentSessionStatus
     *
     * 参考 Stripe provider 的 getStatus 实现
     *
     * PayPal 状态：
     * - CREATED: 订单已创建，等待支付
     * - SAVED: 已保存
     * - APPROVED: 买家已批准，等待捕获
     * - COMPLETED: 已完成捕获 🔑
     * - VOIDED: 已作废
     * - PAYER_ACTION_REQUIRED: 需要买家操作
     *
     * Medusa 状态：
     * - PENDING: 待处理
     * - AUTHORIZED: 已授权（未捕获）- Stripe 的 "requires_capture"
     * - CAPTURED: 已捕获 🔑 - Stripe 的 "succeeded"
     * - CANCELED: 已取消
     * - REQUIRES_MORE: 需要更多操作
     * - ERROR: 错误
     */
    private getStatus;
    /**
     * 创建账户持有人（客户）
     *
     * PayPal 不需要单独创建客户账户，使用 Medusa customer ID 作为标识
     *
     * 参考 Stripe provider 的实现模式
     */
    createAccountHolder({ context, }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput>;
    /**
     * 更新账户持有人
     *
     * PayPal 不支持直接更新客户信息
     * 返回更新后的数据供 Medusa 存储
     */
    updateAccountHolder({ context, data, }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput>;
    /**
     * 删除账户持有人
     *
     * PayPal 不需要删除客户账户
     * 仅返回确认
     */
    deleteAccountHolder({ context, }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput>;
    /**
     * 保存支付方式
     *
     * ✅ PayPal Vault API 功能 - 使用新 SDK
     *
     * 使用 Setup Tokens 来保存客户的支付方式
     * 参考：https://developer.paypal.com/docs/checkout/save-payment-methods/
     */
    savePaymentMethod({ context, data, }: SavePaymentMethodInput): Promise<SavePaymentMethodOutput>;
    /**
     * 列出已保存的支付方式
     *
     * ✅ PayPal Vault API 功能 - 使用新 SDK
     */
    listPaymentMethods({ context, }: ListPaymentMethodsInput): Promise<ListPaymentMethodsOutput>;
}
export {};
//# sourceMappingURL=service.d.ts.map