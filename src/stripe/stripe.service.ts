import { Injectable } from '@nestjs/common';

import Stripe from 'stripe';
import { StripeCreateCustomerInput, StripeUpdateProductInput } from './stripe.types';


@Injectable()
export class StripeService {
    private _client: Stripe;
    private _stripeApiVersion: string = '2022-11-15';
    private _stripeSecretKey: string = process.env.STRIPE_SECRET_KEY;

    constructor() {
        this._client = new Stripe(this._stripeSecretKey);
    }

    async createCustomer(data: StripeCreateCustomerInput) {
        try {
            return await this._client.customers.create({
                name: data.name,
                email: data.email,
                metadata: {
                    userId: data.userId,
                },
                source: data.source,
            });
        } catch (err) {
            throw err;
        }
    }

    async getCustomerDetails(stripeId: string) {
        return await this._client.customers.retrieve(stripeId, { expand: ['sources'] });
    }

    async getPaymentMethods(customerId: string) {
        try {
            return await this._client.paymentMethods.list({
                customer: customerId,
                type: 'card',
            });
        } catch (err) {
            throw err;
        }
    }

    async getChargeDetails(chargeId: string) {
        return await this._client.charges.retrieve(chargeId);
    }

    async createEphemeralKey(customerId: string) {
        try {
            return this._client.ephemeralKeys.create({ customer: customerId }, { apiVersion: this._stripeApiVersion });
        } catch (err) {
            throw err;
        }
    }

    async createProduct(productName: string, metadata?: any) {
        const product = await this._client.products.create({
            name: productName,
            metadata,
        });

        return product;
    }

    async updateProduct(productId: string, data?: StripeUpdateProductInput, active?: boolean) {
        const product = await this._client.products.update(productId, {
            ...(!!data.name && { name: data.name }),
            ...(!!data.metadata && { metadata: data.metadata }),
            ...(active !== undefined && { active }),
        });

        return product;
    }

    async deleteProduct(productId: string) {
        const product = await this._client.products.del(productId);

        return product;
    }

    async createPrice(
        productId: string,
        amount: number,
        currency: string = 'usd',
        recurringInterval: { interval: 'day' | 'week' | 'month' | 'year'; intervalCount: number },
    ) {
        const price = await this._client.prices.create({
            unit_amount: Math.round(amount * 100),
            currency,
            recurring: { interval: recurringInterval.interval, interval_count: recurringInterval.intervalCount },
            product: productId,
        });

        return price;
    }

    async updatePrice(priceId: string, active?: boolean, metadata?: any) {
        const price = await this._client.prices.update(priceId, {
            active,
            metadata,
        });

        return price;
    }

    async createSubscription(customerId: string, productPriceId: string, userId: number) {
        const subscription = await this._client.subscriptions.create({
            customer: customerId,
            items: [{ price: productPriceId }],
            metadata: {
                userId,
            },
        });

        return subscription;
    }

    async updateSubscription(
        subscriptionId: string,
        userSubscriptionId: number,
        priceUpdatingInfo?: { subscriptionItemId: string; productPriceId: string },
        cancelAtPeriodEnd?: boolean,
    ) {
        const { productPriceId, subscriptionItemId } = priceUpdatingInfo;

        const subscription = await this._client.subscriptions.update(subscriptionId, {
            ...(!!userSubscriptionId && { metadata: { userSubscriptionId } }),
            ...(!!productPriceId &&
                !!subscriptionItemId && { items: [{ id: subscriptionItemId, price: productPriceId }] }),
            ...(!!cancelAtPeriodEnd && { cancel_at_period_end: cancelAtPeriodEnd }),
        });

        return subscription;
    }

    async retrieveSubscription(userSubscriptionId: string): Promise<Stripe.Response<Stripe.Subscription>> {
        return await this._client.subscriptions.retrieve(userSubscriptionId);
    }

    async cancelSubscription(subscriptionId: string) {
        const subscription = await this._client.subscriptions.cancel(subscriptionId, { invoice_now: true });
        return subscription;
    }

    async resumeSubscription(subscriptionId: string) {
        const subscription = await this._client.subscriptions.resume(subscriptionId, { billing_cycle_anchor: 'now' });
        return subscription;
    }

    async pauseSubscription(subscriptionId: string) {
        const subscription = await this._client.subscriptions.update(subscriptionId, {
            pause_collection: {
                behavior: 'void',
            },
        });

        return subscription;
    }

    async pricesList(id: any) {
        const prices = await this._client.prices.list({ product: id });
        await Promise.all(prices.data.map(async (price) => {
            await this._client.prices.update(price.id, { active: false });
        }));
        return true;
    }
    async updateProductStatus(productId: string, active?: boolean) {
        const product = await this._client.products.update(productId, {
            ...(active !== undefined && { active }),
        });
        return product;
    }

    async createTaxRate(data: any) {
        const taxRate = await this._client.taxRates.create(data);
        return taxRate;
    }


    async createInvoice(customerId: string, subscriptionId: string) {
        const invoice = await this._client.invoices.create({
            customer: customerId,
            subscription: subscriptionId,
            auto_advance: false,
        });
        return invoice;
    }


    async createInvoiceItem(customerId: string, amount: number, currency: string, description: string) {
        const invoiceItem = await this._client.invoiceItems.create({
            customer: customerId,
            amount: Math.round(amount * 100),
            currency,
            description,
        });
        return invoiceItem;
    }


    async payInvoice(invoiceId: string) {
        const invoice = await this._client.invoices.pay(invoiceId);
        return invoice;
    }


    async createSubscriptionItem(subscriptionId: string, priceId: string) {
        const subscriptionItem = await this._client.subscriptionItems.create({
            subscription: subscriptionId,
            price: priceId,
        });
        return subscriptionItem;
    }


    async deleteSubscriptionItem(subscriptionItemId: string) {
        const subscriptionItem = await this._client.subscriptionItems.del(subscriptionItemId);
        return subscriptionItem;
    }

    async listProducts(): Promise<Stripe.ApiList<Stripe.Product>> {
        return await this._client.products.list();
    }

    async listPrices(): Promise<Stripe.ApiList<Stripe.Price>> {
        return await this._client.prices.list();
    }

    async listSubscriptions(customerId: string): Promise<Stripe.ApiList<Stripe.Subscription>> {
        return await this._client.subscriptions.list({ customer: customerId });
    }

    async getInvoiceDetails(invoiceId: string): Promise<Stripe.Invoice> {
        return await this._client.invoices.retrieve(invoiceId);
    }

    async listInvoiceItems(invoiceId: string): Promise<Stripe.ApiList<Stripe.InvoiceItem>> {
        return await this._client.invoiceItems.list({ invoice: invoiceId });
    }

    async listTaxRates(): Promise<Stripe.ApiList<Stripe.TaxRate>> {
        return await this._client.taxRates.list();
    }

    async updateTaxRate(taxRateId: string, data: any): Promise<Stripe.TaxRate> {
        return await this._client.taxRates.update(taxRateId, data);
    }

    async createPaymentIntent(customerId: string, amount: number, currency: string): Promise<Stripe.PaymentIntent> {
        return await this._client.paymentIntents.create({
            amount: Math.round(amount * 100),
            currency,
            customer: customerId,
        });
    }
}
