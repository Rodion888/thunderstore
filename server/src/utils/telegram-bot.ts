import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';

export class TelegramBot {
  private fastify: FastifyInstance;
  private telegramEnabled: boolean;
  private telegramToken: string | undefined;
  private telegramChatId: string | undefined;
  private pool: any;
  
  constructor(fastify: FastifyInstance, pool: any) {
    this.fastify = fastify;
    this.pool = pool;
    
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = process.env.TELEGRAM_ENABLED === 'true' && !!this.telegramToken && !!this.telegramChatId;
    
    if (this.telegramEnabled) {
      this.fastify.log.info('Telegram bot enabled with token: ' + this.telegramToken?.substring(0, 5) + '...' + this.telegramToken?.substring(this.telegramToken.length - 5));
      this.fastify.log.info('Telegram chat ID: ' + this.telegramChatId);
      this.setupWebhook();
    } else {
      if (!process.env.TELEGRAM_ENABLED || process.env.TELEGRAM_ENABLED !== 'true') {
        this.fastify.log.info('Telegram bot disabled (TELEGRAM_ENABLED not set to true)');
      } else if (!this.telegramToken) {
        this.fastify.log.error('Telegram bot token missing (TELEGRAM_BOT_TOKEN not set)');
      } else if (!this.telegramChatId) {
        this.fastify.log.error('Telegram chat ID missing (TELEGRAM_CHAT_ID not set)');
      }
    }
  }
  
  // Setup webhook to receive messages from the bot
  private async setupWebhook() {
    try {
      const baseUrl = process.env.APP_URL;
      if (!baseUrl) {
        this.fastify.log.error('APP_URL not set, cannot setup webhook');
        return;
      }
      
      this.fastify.log.info('Setting up Telegram webhook with APP_URL: ' + baseUrl);
      
      // First delete the current webhook if it exists
      const deleteResponse = await fetch(`https://api.telegram.org/bot${this.telegramToken}/deleteWebhook`);
      const deleteResult = await deleteResponse.json();
      this.fastify.log.info('Delete webhook result:', deleteResult);
      
      // Add a small delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Set up a new webhook
      const webhookUrl = `${baseUrl}/api/telegram/webhook`;
      this.fastify.log.info('Setting webhook URL to: ' + webhookUrl);
      
      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      
      const result = await response.json();
      this.fastify.log.info('Set webhook result:', result);
      
      if (result.ok) {
        // Get information about the current webhook for verification
        const infoResponse = await fetch(`https://api.telegram.org/bot${this.telegramToken}/getWebhookInfo`);
        const infoResult = await infoResponse.json();
        this.fastify.log.info('Webhook info:', infoResult);
        
        // Send a test message
        if (this.telegramChatId) {
          this.sendMessage('🤖 *Bot initialized*\n\nWebhook configured at ' + webhookUrl);
        }
      } else {
        this.fastify.log.error(`Failed to set Telegram webhook: ${result.description}`);
      }
    } catch (error) {
      this.fastify.log.error(`Error setting Telegram webhook: ${error}`);
    }
  }
  
  // Process incoming bot commands
  public async handleCommand(text: string, chatId: string) {
    // Add diagnostic output with chat ID
    this.fastify.log.info(`Received command "${text}" from chat ID: ${chatId}`);
    this.fastify.log.info(`Expected chat ID from env: ${this.telegramChatId}`);
    this.fastify.log.info(`Chat IDs match: ${chatId === this.telegramChatId}`);

    // Special diagnostic command - always allow this
    if (text === '/chatid') {
      return this.sendMessage(`Your Chat ID: ${chatId}\nTELEGRAM_CHAT_ID from .env: ${this.telegramChatId}`, chatId);
    }

    // Check if the user has access to commands - convert both to strings for comparison
    if (String(chatId) !== String(this.telegramChatId)) {
      return this.sendMessage(`You don't have access to this command. Your Chat ID: ${chatId}`, chatId);
    }
    
    // Split the command into parts
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    
    try {
      switch (command) {
        case '/start':
          return this.sendMessage('👋 Hello! I am the ThunderStore management bot.\n\nAvailable commands:\n/orders - list of recent orders\n/order [id] - order information\n/products - list of products\n/help - list of all commands', chatId);
        
        case '/help':
          return this.sendHelp(chatId);
        
        case '/orders':
          return this.getOrders(chatId);
        
        case '/order':
          if (parts.length < 2) return this.sendMessage('⚠️ Please specify order ID: /order [id]', chatId);
          return this.getOrder(parseInt(parts[1]), chatId);
        
        case '/products':
          return this.getProducts(chatId);
        
        case '/product':
          if (parts.length < 2) return this.sendMessage('⚠️ Please specify product ID: /product [id]', chatId);
          return this.getProduct(parseInt(parts[1]), chatId);
        
        case '/status':
          if (parts.length < 3) return this.sendMessage('⚠️ Please specify order ID and status: /status [id] [status]', chatId);
          return this.updateOrderStatus(parseInt(parts[1]), parts[2], chatId);
        
        case '/stats':
          return this.getStats(parts[1] || 'today', chatId);
        
        default:
          return this.sendMessage('⚠️ Unknown command. Use /help for a list of commands.', chatId);
      }
    } catch (error) {
      this.fastify.log.error(`Error handling command ${command}: ${error}`);
      return this.sendMessage(`❌ An error occurred: ${error}`, chatId);
    }
  }
  
  // Get a list of recent orders
  private async getOrders(chatId: string) {
    try {
      this.fastify.log.info('Executing getOrders command');
      
      const result = await this.pool.query(`
        SELECT id, status, total_amount, created_at 
        FROM orders
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      this.fastify.log.info(`Found ${result.rows.length} orders`);
      
      if (result.rows.length === 0) {
        return this.sendMessage('📊 Orders are not available yet.', chatId);
      }
      
      let message = '📋 *Recent Orders:*\n\n';
      
      result.rows.forEach((order: { id: number; status: string; total_amount: number; created_at: string; }) => {
        const date = new Date(order.created_at).toLocaleString('en');
        const statusEmoji = this.getStatusEmoji(order.status);
        
        message += `🔹 *Order #${order.id}*\n`;
        message += `${statusEmoji} Status: ${order.status}\n`;
        message += `💰 Amount: ${order.total_amount} ₽\n`;
        message += `📅 Date: ${date}\n\n`;
      });
      
      message += 'For more details, use /order [id]';
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting orders: ${error}`);
      if (error instanceof Error) {
        this.fastify.log.error(`Error stack: ${error.stack}`);
      }
      return this.sendMessage(`❌ Error getting orders: ${error}`, chatId);
    }
  }
  
  // Get information about a specific order
  private async getOrder(orderId: number, chatId: string) {
    try {
      this.fastify.log.info(`Executing getOrder command for order ID: ${orderId}`);
      
      const orderResult = await this.pool.query(`
        SELECT id, status, total_amount, created_at, address, full_name, phone, email, city, comment, payment_method, delivery_type
        FROM orders
        WHERE id = $1
      `, [orderId]);
      
      this.fastify.log.info(`Order query result rows: ${orderResult.rows.length}`);
      
      if (orderResult.rows.length === 0) {
        return this.sendMessage(`❌ Order #${orderId} not found.`, chatId);
      }
      
      const order = orderResult.rows[0];
      this.fastify.log.debug(`Order object: ${JSON.stringify(order)}`);
      
      // Get items in the order from JSON field
      let orderItems = [];
      try {
        const itemsResult = await this.pool.query(`
          SELECT items FROM orders WHERE id = $1
        `, [orderId]);
        
        if (itemsResult.rows.length > 0 && itemsResult.rows[0].items) {
          orderItems = JSON.parse(itemsResult.rows[0].items);
          this.fastify.log.info(`Order items parsed, found ${orderItems.length} items`);
        }
      } catch (error) {
        this.fastify.log.error(`Error parsing order items for order ${orderId}: ${error}`);
        if (error instanceof Error) {
          this.fastify.log.error(`Error stack: ${error.stack}`);
        }
      }
      
      const date = new Date(order.created_at).toLocaleString('en');
      const statusEmoji = this.getStatusEmoji(order.status);
      
      let message = `🛍️ *Order Information #${order.id}*\n\n`;
      message += `${statusEmoji} *Status:* ${order.status}\n`;
      message += `💰 *Amount:* ${order.total_amount} ₽\n`;
      message += `📅 *Date:* ${date}\n\n`;
      
      message += `👤 *Recipient:* ${order.full_name}\n`;
      message += `📱 *Phone:* ${order.phone}\n`;
      message += `✉️ *Email:* ${order.email}\n`;
      message += `🏙️ *City:* ${order.city}\n`;
      message += `🏠 *Address:* ${order.address || 'not specified'}\n`;
      message += `🚚 *Delivery Type:* ${order.delivery_type}\n`;
      message += `💳 *Payment Method:* ${order.payment_method}\n`;
      
      if (order.comment) {
        message += `📝 *Comment:* ${order.comment}\n`;
      }
      
      message += `\n📦 *Items in Order:*\n`;
      
      if (orderItems.length > 0) {
        orderItems.forEach((item: any) => {
          message += `▫️ ${item.name} (ID: ${item.id})\n`;
          message += `   Size: ${item.size}, Quantity: ${item.quantity}, Price: ${item.price} ₽\n`;
        });
      } else {
        message += "Item information not available\n";
      }
      
      message += '\n*Order Management:*\n';
      message += 'Change status: /status ' + order.id + ' [new_status]\n';
      message += 'Available statuses: processing, pending, paid, shipped, delivered, cancelled';
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting order ${orderId}: ${error}`);
      return this.sendMessage(`❌ Error getting order #${orderId}: ${error}`, chatId);
    }
  }
  
  // Update order status
  private async updateOrderStatus(orderId: number, newStatus: string, chatId: string) {
    const validStatuses = ['processing', 'pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      return this.sendMessage(`❌ Invalid status. Use one of: ${validStatuses.join(', ')}`, chatId);
    }
    
    try {
      const result = await this.pool.query(`
        UPDATE orders SET status = $1 WHERE id = $2 RETURNING id
      `, [newStatus, orderId]);
      
      if (result.rows.length === 0) {
        return this.sendMessage(`❌ Order #${orderId} not found.`, chatId);
      }
      
      const statusEmoji = this.getStatusEmoji(newStatus);
      return this.sendMessage(`✅ Order #${orderId} status updated to ${statusEmoji} ${newStatus}`, chatId);
    } catch (error) {
      this.fastify.log.error(`Error updating order status ${orderId}: ${error}`);
      return this.sendMessage(`❌ Error updating order status #${orderId}: ${error}`, chatId);
    }
  }
  
  // Get a list of products
  private async getProducts(chatId: string) {
    try {
      const result = await this.pool.query(`
        SELECT id, name, price, stock
        FROM products
        ORDER BY id
        LIMIT 10
      `);
      
      if (result.rows.length === 0) {
        return this.sendMessage('📊 Products are not available yet.', chatId);
      }
      
      let message = '🛍️ *Product List:*\n\n';
      
      result.rows.forEach((product: { id: number; name: string; price: number; stock?: Record<string, number>; }) => {
        message += `🔸 *${product.name}* (ID: ${product.id})\n`;
        message += `💰 Price: ${product.price} ₽\n`;
        
        // Add information about available sizes
        if (product.stock && Object.keys(product.stock).length > 0) {
          message += `📊 Available Sizes: ${Object.keys(product.stock).join(', ')}\n`;
        }
        
        message += '\n';
      });
      
      message += 'For more details, use /product [id]';
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting products: ${error}`);
      return this.sendMessage(`❌ Error getting products: ${error}`, chatId);
    }
  }
  
  // Get information about a specific product
  private async getProduct(productId: number, chatId: string) {
    try {
      const result = await this.pool.query(`
        SELECT id, name, price, description, stock
        FROM products
        WHERE id = $1
      `, [productId]);
      
      if (result.rows.length === 0) {
        return this.sendMessage(`❌ Product #${productId} not found.`, chatId);
      }
      
      const product = result.rows[0];
      
      let message = `📦 *Product Information #${product.id}*\n\n`;
      message += `📌 *Name:* ${product.name}\n`;
      message += `💰 *Price:* ${product.price} ₽\n`;
      message += `📝 *Description:* ${(product.description || '').substring(0, 100)}${product.description && product.description.length > 100 ? '...' : ''}\n\n`;
      
      message += `🗃️ *Stock:*\n`;
      
      // Check that stock exists and is an object
      const stock = product.stock && typeof product.stock === 'object' ? product.stock : {};
      Object.entries(stock).forEach(([size, quantity]) => {
        message += `▫️ ${size}: ${quantity}\n`;
      });
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting product ${productId}: ${error}`);
      return this.sendMessage(`❌ Error getting product #${productId}: ${error}`, chatId);
    }
  }
  
  // Get statistics
  private async getStats(period: string, chatId: string) {
    try {
      this.fastify.log.info(`Executing getStats command for period: ${period}`);
      
      let timeCondition = '';
      let periodName = '';
      
      switch (period.toLowerCase()) {
        case 'today':
          timeCondition = 'created_at >= CURRENT_DATE';
          periodName = 'today';
          break;
        case 'yesterday':
          timeCondition = 'created_at >= CURRENT_DATE - INTERVAL \'1 day\' AND created_at < CURRENT_DATE';
          periodName = 'yesterday';
          break;
        case 'week':
          timeCondition = 'created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
          periodName = 'the week';
          break;
        case 'month':
          timeCondition = 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
          periodName = 'the month';
          break;
        default:
          timeCondition = 'created_at >= CURRENT_DATE';
          periodName = 'today';
      }
      
      // General order statistics
      const orderStats = await this.pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'paid' OR status = 'shipped' OR status = 'delivered' THEN 1 END) as completed_orders,
          COALESCE(SUM(CASE WHEN status = 'paid' OR status = 'shipped' OR status = 'delivered' THEN total_amount ELSE 0 END), 0) as revenue
        FROM orders
        WHERE ${timeCondition}
      `);
      
      // Status statistics
      const statusStats = await this.pool.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE ${timeCondition}
        GROUP BY status
        ORDER BY count DESC
      `);
      
      const stats = orderStats.rows[0];
      
      let message = `📊 *Statistics for ${periodName}*\n\n`;
      message += `🛒 *Total Orders:* ${stats.total_orders}\n`;
      message += `✅ *Completed Orders:* ${stats.completed_orders}\n`;
      message += `💰 *Revenue:* ${stats.revenue} ₽\n\n`;
      
      if (statusStats.rows.length > 0) {
        message += `📋 *Order Statuses:*\n`;
        statusStats.rows.forEach((row: { status: string; count: number }) => {
          const statusEmoji = this.getStatusEmoji(row.status);
          message += `${statusEmoji} ${row.status}: ${row.count}\n`;
        });
      }
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting stats for ${period}: ${error}`);
      return this.sendMessage(`❌ Error getting statistics: ${error}`, chatId);
    }
  }
  
  // Send command help
  private async sendHelp(chatId: string) {
    const message = `
🔍 *Available Commands:*

*Orders:*
/orders - list of recent orders
/order [id] - order information
/status [id] [status] - change order status

*Products:*
/products - list of products
/product [id] - product information

*Statistics:*
/stats today - statistics for today
/stats week - statistics for the week
/stats month - statistics for the month

*Order Statuses:*
processing - in progress
pending - waiting
paid - paid
shipped - shipped
delivered - delivered
cancelled - cancelled

*Other:*
/help - list of commands
`;
    
    return this.sendMessage(message, chatId);
  }
  
  // Helper function for status emojis
  private getStatusEmoji(status: string): string {
    if (!status) return '❓';
    
    switch (status.toLowerCase()) {
      case 'pending': return '⏳';
      case 'processing': return '🔄';
      case 'paid': return '💵';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  }
  
  // Send a message to Telegram
  public async sendMessage(message: string, chatId: string = this.telegramChatId!) {
    if (!this.telegramEnabled || !this.telegramToken) return;
    
    try {
      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
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
  
  // Send payment notification (used with existing PaymentLogger)
  public async sendPaymentNotification(message: string) {
    return this.sendMessage(message);
  }
} 