import { FastifyInstance } from 'fastify';

export class PaymentLogger {
  private fastify: FastifyInstance;
  
  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
  }
  
  public logPaymentCreation(orderId: number, amount: number, email: string) {
    const message = `PAYMENT_CREATION: Order=${orderId}, Amount=$${amount}, Email=${email}`;
    this.fastify.log.info(message);
    
    this.sendTelegramNotification(`PAYMENT_CREATION\nOrder: ${orderId}\nAmount: $${amount}`);
  }
  
  public logPaymentCreated(orderId: number, paymentUrl: string) {
    this.fastify.log.info(`PAYMENT_URL_CREATED: Order=${orderId}, URL=${paymentUrl}`);
  }
  
  public logPaymentCreationError(orderId: number, error: any) {
    const message = `PAYMENT_CREATION_ERROR: Order=${orderId}, Error=${JSON.stringify(error)}`;
    this.fastify.log.error(message);
    this.sendTelegramNotification(`PAYMENT_CREATION_ERROR\nOrder: ${orderId}\nError: ${JSON.stringify(error, null, 2)}`);
  }
  
  public logWebhookReceived(data: any) {
    this.fastify.log.info(`WEBHOOK_RECEIVED: ${JSON.stringify(data, null, 2)}`);
  }
  
  public logPaymentSuccess(orderId: string, webhookData: any) {
    const amount = webhookData.amount_crypto;
    const currency = webhookData.currency;
    const amountUSD = webhookData.invoice_info?.amount_usd;
    const fee = webhookData.invoice_info?.fee_usd;
    const received = webhookData.invoice_info?.received_usd;
    const status = webhookData.invoice_info?.status || 'paid';
    
    const telegramMessage = `PAYMENT_SUCCESS
      Order: ${orderId}
      Amount: ${amount} ${currency}
      USD: $${amountUSD}
      Received: $${received}
      Fee: $${fee}
      Status: ${status}
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
