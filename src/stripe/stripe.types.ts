import { Stripe } from 'stripe';

export type StripeConnectAccountData = {
    userId: number;
    email?: string;
    country?: string;
    type?: Stripe.AccountCreateParams.Type;
};

export type StripeCustomerMetaData = {
    UserId: number;
};

export type StripeCreateCustomerInput = {
    name: string;
    email: string;
    userId: number;
    source?: string;
};

export type StripeCreatePaymentIntentInput = {
    amount: number;
    stripeCustomerId: string;
    transactionId: number;
    applicationFee: number;
    connectAccountId?: string;
    transferAmount?: number;
    paymentMethodId?: string;
    offSession?: boolean;
    captureMethod?: Stripe.PaymentIntent.CaptureMethod;
    confirm?: boolean;
    setupFutureUsage?: Stripe.PaymentIntent.SetupFutureUsage;
};

export type StripeCreateChargeInput = {
    amount: number;
    stripeCustomerId: string;
    description?: string;
};

export type StripeUpdatePaymentIntentInput = {
    amount: number;
    transferAmount?: number;
};

export type StripePayoutInput = {
    amount: number;
    destination: string;
    hostId: number;
};

export type StripeWebhookEvents =
    | 'account.application.deauthorized'
    | 'account.updated'
    | 'payment_intent.succeeded'
    | 'payment_intent.amount_capturable_updated'
    | 'payment_intent.payment_failed'
    | 'payment_intent.canceled'
    | 'payout.failed'
    | 'refund.updated';

export type StripeWebhookEvent = Omit<Stripe.Event, 'type'> & {
    type: StripeWebhookEvents;
};

export type AccountLinkType = 'account_onboarding' | 'account_update';

export type StripeCreateAccountLinkInput = {
    account: string;
    type: AccountLinkType;
};

export type StripeUpdateProductInput = {
    name: string;
    metadata?: any;
};
