import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export class PaymentLogger {
  private fastify: FastifyInstance;
  private telegramEnabled: boolean;
  private telegramToken: string | undefined;
  private telegramChatId: string | undefined;
  
  constructor(fastify: FastifyInstance) {
    this.fastify = fastify;
    
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = process.env.TELEGRAM_ENABLED === 'true' && !!this.telegramToken && !!this.telegramChatId;
    
    if (this.telegramEnabled) {
      this.fastify.log.info('Telegram payment notifications enabled');
    }
  }
  
  public logPaymentCreation(orderId: number, amount: number, email: string) {
    const message = `Payment creation initiated: OrderID=${orderId}, Amount=${amount}, Email=${email}`;
    this.fastify.log.info(message);
  }
  
  public logPaymentCreated(orderId: number, paymentUrl: string) {
    const message = `Payment URL created: OrderID=${orderId}, URL=${paymentUrl}`;
    this.fastify.log.info(message);
  }
  
  public logPaymentCreationError(orderId: number, error: any) {
    const message = `❌ Payment creation failed: OrderID=${orderId}, Error=${JSON.stringify(error)}`;
    this.fastify.log.error(message);
    this.sendTelegramNotification(message);
  }
  
  public logWebhookReceived(data: any) {
    const message = `Payment webhook received: ${JSON.stringify(data)}`;
    this.fastify.log.info(message);
  }
  
  public logPaymentSuccess(orderId: string) {
    const message = `✅ Payment successful: OrderID=${orderId}`;
    this.fastify.log.info(message);
    this.sendTelegramNotification(message);
  }
  
  private async sendTelegramNotification(message: string) {
    if (!this.telegramEnabled) return;
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.telegramChatId,
          text: `🔔 *ThunderStore Payment Alert*\n\n${message}`,
          parse_mode: 'Markdown'
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        this.fastify.log.error(`Failed to send Telegram notification: ${result.description}`);
      }
    } catch (error) {
      this.fastify.log.error(`Error sending Telegram notification: ${error}`);
    }
  }
}
