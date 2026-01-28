import { 
  AbstractPaymentProvider, 
  MedusaError, 
  PaymentActions, 
  PaymentSessionStatus 
} from "@medusajs/framework/utils";
import { 
  AuthorizePaymentInput, 
  AuthorizePaymentOutput, 
  CancelPaymentInput, 
  CancelPaymentOutput, 
  CapturePaymentInput, 
  CapturePaymentOutput, 
  CreateAccountHolderInput, 
  CreateAccountHolderOutput, 
  DeleteAccountHolderInput, 
  DeleteAccountHolderOutput, 
  DeletePaymentInput, 
  DeletePaymentOutput, 
  GetPaymentStatusInput, 
  GetPaymentStatusOutput, 
  InitiatePaymentInput, 
  InitiatePaymentOutput, 
  ListPaymentMethodsInput, 
  ListPaymentMethodsOutput, 
  ProviderWebhookPayload, 
  RefundPaymentInput, 
  RefundPaymentOutput, 
  RetrievePaymentInput, 
  RetrievePaymentOutput, 
  SavePaymentMethodInput, 
  SavePaymentMethodOutput, 
  UpdateAccountHolderInput, 
  UpdateAccountHolderOutput, 
  UpdatePaymentInput, 
  UpdatePaymentOutput, 
  WebhookActionResult 
} from "@medusajs/framework/types";
import { 
  Client, 
  Environment, 
  OrdersController, 
  PaymentsController, 
  VaultController,
  CheckoutPaymentIntent,
  OrderApplicationContextUserAction,
} from "@paypal/paypal-server-sdk";

interface PayPalOptions {
  clientId: string;
  clientSecret: string;
  isSandbox?: boolean;
}

export default class PayPalProviderService extends AbstractPaymentProvider<PayPalOptions> {
  static identifier = "paypal";
  protected readonly options_: PayPalOptions;
  protected readonly client_: Client;

  static validateOptions(options: PayPalOptions): void {
    if (!options.clientId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Required option `clientId` is missing in PayPal provider");
    }
    if (!options.clientSecret) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Required option `clientSecret` is missing in PayPal provider");
    }
  }

  constructor(container: any, options: PayPalOptions) {
    super(container, options);
    this.options_ = options;
    
    // Initialize PayPal client
    this.client_ = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: options.clientId,
        oAuthClientSecret: options.clientSecret,
      },
      environment: options.isSandbox
        ? Environment.Sandbox
        : Environment.Production,
    });
  }

  /**
   * Create PayPal order
   */
  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { currency_code, amount, data, context } = input;
    const ordersController = new OrdersController(this.client_);

    try {
      const response = await ordersController.createOrder({
        body: {
          intent: CheckoutPaymentIntent.Capture,
          purchaseUnits: [
            {
              amount: {
                currencyCode: currency_code.toUpperCase(),
                value: ((amount as number) / 100).toFixed(2), // cents to dollars
              },
              customId: (data?.session_id as string) || undefined,
            },
          ],
          applicationContext: {
            userAction: OrderApplicationContextUserAction.PayNow,
          },
        },
        prefer: "return=representation",
      });

      const order = response.result;
      return {
        id: order.id as string,
        ...this.getStatus(order as any),
      };
    } catch (error: any) {
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal initiatePayment failed: ${error.message || error}`);
    }
  }

  /**
   * Authorize/Capture payment
   */
  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const { data } = input;
    const orderId = data?.id as string;

    if (!orderId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No PayPal order ID found for authorizePayment");
    }

    const ordersController = new OrdersController(this.client_);

    try {
      // PayPal CAPTURE intent: execute capture on authorize
      const response = await ordersController.captureOrder({
        id: orderId,
        prefer: "return=representation",
      });

      const result = response.result as any;
      
      // Extract and store capture_id for refunds
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
    } catch (error: any) {
      // If already captured (422 error), get status
      if (error.statusCode === 422) {
        return await this.getPaymentStatus(input);
      }
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal authorizePayment failed: ${error.message || error}`);
    }
  }

  /**
   * Capture payment
   */
  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    return await this.getPaymentStatus(input);
  }

  /**
   * Cancel payment
   */
  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    return {
      data: input.data,
    };
  }

  /**
   * Delete payment
   */
  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    return await this.cancelPayment(input);
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const { data } = input;
    const orderId = data?.id as string;

    if (!orderId) {
      return {
        status: PaymentSessionStatus.PENDING,
        data: data || {},
      };
    }

    const ordersController = new OrdersController(this.client_);

    try {
      const response = await ordersController.getOrder({
        id: orderId,
      });
      
      const result = response.result as any;
      
      // Extract and store capture_id for refunds
      const captureId = result?.purchase_units?.[0]?.payments?.captures?.[0]?.id;
      
      console.log("[PayPal] ========== GET PAYMENT STATUS ==========");
      console.log("[PayPal] Order ID:", result?.id);
      console.log("[PayPal] Capture ID:", captureId);
      console.log("[PayPal] ==========================================");

      const statusResult = this.getStatus(result);
      
      return {
        ...statusResult,
        data: { ...statusResult.data, capture_id: captureId }
      };
    } catch (error) {
      return {
        status: PaymentSessionStatus.ERROR,
        data: data || {},
      };
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const { data, amount } = input;

    console.log("[PayPal] ========== REFUND PAYMENT ==========");
    console.log("[PayPal] Input data:", JSON.stringify(data, null, 2));
    
    // Extract capture ID from data - try multiple locations
    let captureId = data?.capture_id;
    if (!captureId) { captureId = (data as any)?.purchase_units?.[0]?.payments?.captures?.[0]?.id; }
    if (!captureId) { captureId = (data as any)?.payments?.captures?.[0]?.id; }

    console.log("[PayPal] Final captureId:", captureId);
    console.log("[PayPal] ========================================");

    if (!captureId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No capture ID found for refund");
    }

    const paymentsController = new PaymentsController(this.client_);

    try {
      const refundRequest: any = {};
      if (amount && typeof amount === "number") {
        const currencyCode = (data as any)?.purchase_units?.[0]?.amount?.currency_code || "USD";
        refundRequest.amount = {
          currencyCode: currencyCode.toUpperCase(),
          value: (amount / 100).toFixed(2),
        };
      }

      const response = await paymentsController.refundCapturedPayment({
        captureId: captureId as string,
        body: refundRequest,
        prefer: "return=representation",
      });

      return { data: response.result as any };
    } catch (error: any) {
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal refundPayment failed: ${error.message || error}`);
    }
  }

  /**
   * Retrieve payment
   */
  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    return await this.getPaymentStatus(input);
  }

  /**
   * Update payment
   */
  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    return await this.initiatePayment(input);
  }

  /**
   * Handle webhook
   */
  async getWebhookActionAndData(webhookData: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    const { resource, event_type } = webhookData.data as any;

    switch (event_type) {
      case "PAYMENT.CAPTURE.COMPLETED":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: resource?.custom_id,
            amount: parseFloat(resource?.amount?.value || "0") * 100,
          },
        };
      case "PAYMENT.CAPTURE.DENIED":
      case "PAYMENT.CAPTURE.DECLINED":
        return {
          action: PaymentActions.FAILED,
          data: {
            session_id: resource?.custom_id,
            amount: parseFloat(resource?.amount?.value || "0") * 100,
          },
        };
      case "CHECKOUT.ORDER.APPROVED":
        return {
          action: PaymentActions.AUTHORIZED,
          data: {
            session_id: resource?.purchase_units?.[0]?.custom_id,
            amount: parseFloat(resource?.purchase_units?.[0]?.amount?.value || "0") * 100,
          },
        };
      case "PAYMENT.CAPTURE.REFUNDED":
        return {
          action: PaymentActions.SUCCESSFUL,
          data: {
            session_id: resource?.custom_id,
            amount: parseFloat(resource?.amount?.value || "0") * 100,
          },
        };
      default:
        return {
          action: PaymentActions.NOT_SUPPORTED,
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
  private getStatus(paypalOrder: any): { status: PaymentSessionStatus; data: any } {
    const status = paypalOrder.status;
    const data = paypalOrder;

    switch (status) {
      case "CREATED":
      case "SAVED":
        return {
          status: PaymentSessionStatus.PENDING,
          data,
        };
      case "APPROVED":
        return {
          status: PaymentSessionStatus.PENDING,
          data,
        };
      case "PAYER_ACTION_REQUIRED":
        return {
          status: PaymentSessionStatus.REQUIRES_MORE,
          data,
        };
      case "COMPLETED":
        return {
          status: PaymentSessionStatus.CAPTURED,
          data,
        };
      case "VOIDED":
        return {
          status: PaymentSessionStatus.CANCELED,
          data,
        };
      default:
        return {
          status: PaymentSessionStatus.PENDING,
          data,
        };
    }
  }

  /**
   * Create account holder
   */
  async createAccountHolder({ context }: CreateAccountHolderInput): Promise<CreateAccountHolderOutput> {
    const { account_holder, customer } = context;

    if (account_holder?.data?.id) {
      return { id: account_holder.data.id as string };
    }

    if (!customer) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No customer provided while creating account holder");
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
  async updateAccountHolder({ context, data }: UpdateAccountHolderInput): Promise<UpdateAccountHolderOutput> {
    const { account_holder, customer } = context;

    if (!account_holder?.data?.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing account holder ID");
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
  async deleteAccountHolder({ context }: DeleteAccountHolderInput): Promise<DeleteAccountHolderOutput> {
    const { account_holder } = context;

    if (!account_holder?.data?.id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing account holder ID");
    }
    return {};
  }

  /**
   * Save payment method
   */
  async savePaymentMethod({ context, data }: SavePaymentMethodInput): Promise<SavePaymentMethodOutput> {
    const accountHolderId = context?.account_holder?.data?.id;

    if (!accountHolderId) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Missing account holder ID for saving payment method");
    }

    const vaultController = new VaultController(this.client_);

    try {
      const setupTokenRequest = {
        payment_source: {
          card: data?.card || {},
        },
        customer: {
          id: accountHolderId as string,
        },
      };

      const response = await vaultController.createSetupToken({
        body: setupTokenRequest as any,
        paypalRequestId: context?.idempotency_key,
      });

      return {
        id: response.result.id || "",
        data: response.result as any,
      };
    } catch (error: any) {
      throw new MedusaError(MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR, `PayPal savePaymentMethod failed: ${error.message || error}`);
    }
  }

  /**
   * List saved payment methods
   */
  async listPaymentMethods({ context }: ListPaymentMethodsInput): Promise<ListPaymentMethodsOutput> {
    const accountHolderId = context?.account_holder?.data?.id;

    if (!accountHolderId) {
      return [];
    }

    const vaultController = new VaultController(this.client_);

    try {
      const response = await vaultController.listCustomerPaymentTokens({
        customerId: accountHolderId as string,
        pageSize: 100,
      });

      return (response.result.paymentTokens || []).map((token: any) => ({
        id: token.id,
        data: token,
      }));
    } catch (error: any) {
      if (error.statusCode === 404) {
        return [];
      }
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `PayPal listPaymentMethods failed: ${error.message || error}`);
    }
  }
}