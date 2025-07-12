import { FastifyInstance } from 'fastify';

export class PaymentLogger {
  private fastify: FastifyInstance;
  
  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }
  
  public logPaymentCreation(order: any) {
    const { id, full_name, phone, email, city, address, comment, delivery_type, payment_method, total_amount } = order;
    
    const telegramMessage = `PAYMENT_CREATION
      Order: ${id}
      Amount: $${total_amount}
      ---
      Name: ${full_name}
      Phone: ${phone}
      Email: ${email}
      City: ${city}
      Address: ${address}
      Comment: ${comment || 'N/A'}
      ---
      Delivery: ${delivery_type}
      Payment: ${payment_method}
    `;

    this.fastify.log.info(`PAYMENT_CREATION: Order=${id}, Amount=$${total_amount}`);
    this.sendTelegramNotification(telegramMessage);
  }
  
  public logPaymentCreated(orderId: number, paymentUrl: string) {
    this.fastify.log.info(`PAYMENT_URL_CREATED: Order=${orderId}, URL=${paymentUrl}`);
  }
  
  public logPaymentCreationError(orderId: number, error: any) {
    const message = `PAYMENT_CREATION_ERROR: Order=${orderId}, Error=${JSON.stringify(error)}`;
    this.fastify.log.error(message);
    this.sendTelegramNotification(`PAYMENT_CREATION_ERROR\nOrder: ${orderId}\nError: ${JSON.stringify(error)}`);
  }
  
  public logWebhookReceived(data: any) {
    this.fastify.log.info(`WEBHOOK_RECEIVED: ${JSON.stringify(data, null, 2)}`);
  }
  
  public logPaymentSuccess(orderId: string, webhookData: any, order: any) {
    const amount = webhookData.amount_crypto;
    const currency = webhookData.currency;
    const amountUSD = webhookData.invoice_info?.amount_usd;
    const fee = webhookData.invoice_info?.fee_usd;
    const received = webhookData.invoice_info?.received_usd;
    const status = webhookData.invoice_info?.status || 'paid';
    
    const { full_name, phone, email, city, address, comment, delivery_type, payment_method } = order;

    const telegramMessage = `PAYMENT_SUCCESS
      Order: ${orderId}
      Amount: ${amount} ${currency}
      USD: $${amountUSD}
      ---
      Name: ${full_name}
      Phone: ${phone}
      Email: ${email}
      City: ${city}
      Address: ${address}
      Comment: ${comment || 'N/A'}
      ---
      Delivery: ${delivery_type}
      Payment: ${payment_method}
    `;

    const detailedLog = `PAYMENT_SUCCESS: Order=${orderId}, Amount=${amount} ${currency}, USD=$${amountUSD}, Received=$${received}, Fee=$${fee}, Status=${status}, Completed=${webhookData.invoice_info?.date_finished}, FULL_WEBHOOK_DATA: ${JSON.stringify(webhookData, null, 2)}`;
    
    this.fastify.log.info(detailedLog);
    this.sendTelegramNotification(telegramMessage);
  }
  
  private async sendTelegramNotification(message: string) {
    if (this.fastify.telegramBot) {
      return this.fastify.telegramBot.sendMessage(message);
    }
  }
}
