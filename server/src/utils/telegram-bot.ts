import { FastifyInstance } from 'fastify';

import fetch from 'node-fetch';

export class TelegramBot {
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
      this.fastify.log.info('Telegram notifications enabled');
      this.setupWebhook();
    } else {
      this.fastify.log.info('Telegram notifications disabled');
    }
  }
  
  private async setupWebhook() {
    try {
      const baseUrl = process.env.APP_URL;
      if (!baseUrl) {
        this.fastify.log.error('APP_URL not set, cannot setup webhook');
        return;
      }
      
      await fetch(`https://api.telegram.org/bot${this.telegramToken}/deleteWebhook`);
      
      const webhookUrl = `${baseUrl}/api/telegram/webhook`;
      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        this.sendMessage('SYSTEM_STARTUP\nBot initialized successfully');
      } else {
        this.fastify.log.error(`Failed to set Telegram webhook: ${result.description}`);
      }
    } catch (error) {
      this.fastify.log.error(`Error setting Telegram webhook: ${error}`);
    }
  }
  
  public async handleCommand(text: string, chatId: string) {
    if (String(chatId) !== String(this.telegramChatId)) {
      return this.sendMessage(`ACCESS_DENIED\nYour Chat ID: ${chatId}`, chatId);
    }
    
    const command = text.toLowerCase();
    
    switch (command) {
      case '/start':
        return this.sendMessage('THUNDERSTORE_BOT\n\nAvailable commands:\n/status - System status\n/chatid - Get chat ID', chatId);
      
      case '/chatid':
        return this.sendMessage(`CHAT_ID\nYour ID: ${chatId}\nConfigured ID: ${this.telegramChatId}`, chatId);
      
      case '/status':
        return this.sendSystemStatus(chatId);
      
      default:
        return this.sendMessage('UNKNOWN_COMMAND\nUse /start for help', chatId);
    }
  }
  
  private async sendSystemStatus(chatId: string) {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    const message = `SYSTEM_STATUS
      Uptime: ${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m
      Memory: ${Math.round(memory.heapUsed / 1024 / 1024)}MB / ${Math.round(memory.heapTotal / 1024 / 1024)}MB
      Node: ${process.version}
      Environment: ${process.env.NODE_ENV || 'development'}
    `;
    
    return this.sendMessage(message, chatId);
  }
  
  public async sendDeploymentNotification(status: 'success' | 'failed', details?: string) {
    const message = `DEPLOYMENT_${status.toUpperCase()}
      Status: ${status}
      Time: ${new Date().toISOString()}${details ? `\nDetails: ${details}` : ''}
    `;
    
    return this.sendMessage(message);
  }
  
  public async sendErrorNotification(error: string, context?: string) {
    const message = `BACKEND_ERROR
      Error: ${error}${context ? `\nContext: ${context}` : ''}
      Time: ${new Date().toISOString()}
    `;
    
    return this.sendMessage(message);
  }
  
  public async sendMessage(message: string, chatId: string = this.telegramChatId!) {
    if (!this.telegramEnabled || !this.telegramToken) return;
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });
      
      const result = await response.json();
      
      if (!result.ok) {
        this.fastify.log.error(`Failed to send Telegram message: ${result.description}`);
      }
      
      return result;
    } catch (error) {
      this.fastify.log.error(`Error sending Telegram message: ${error}`);
    }
  }
} 