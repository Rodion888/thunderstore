import { FastifyInstance } from 'fastify';
import fetch from 'node-fetch';
import { Pool } from 'pg';

export class TelegramBot {
  private fastify: FastifyInstance;
  private telegramEnabled: boolean;
  private telegramToken: string | undefined;
  private telegramChatId: string | undefined;
  private pool: Pool;
  
  constructor(fastify: FastifyInstance, pool: Pool) {
    this.fastify = fastify;
    this.pool = pool;
    
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = process.env.TELEGRAM_ENABLED === 'true' && !!this.telegramToken && !!this.telegramChatId;
    
    if (this.telegramEnabled) {
      this.fastify.log.info('Telegram bot enabled');
      this.setupWebhook();
    }
  }
  
  // Настраиваем вебхук для получения сообщений от бота
  private async setupWebhook() {
    try {
      const baseUrl = process.env.APP_URL;
      if (!baseUrl) {
        this.fastify.log.error('APP_URL not set, cannot setup webhook');
        return;
      }
      
      const webhookUrl = `${baseUrl}/api/telegram/webhook`;
      const response = await fetch(`https://api.telegram.org/bot${this.telegramToken}/setWebhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookUrl })
      });
      
      const result = await response.json();
      
      if (result.ok) {
        this.fastify.log.info(`Telegram webhook set to ${webhookUrl}`);
      } else {
        this.fastify.log.error(`Failed to set Telegram webhook: ${result.description}`);
      }
    } catch (error) {
      this.fastify.log.error(`Error setting Telegram webhook: ${error}`);
    }
  }
  
  // Обработка входящих команд от бота
  public async handleCommand(text: string, chatId: string) {
    // Проверяем, имеет ли пользователь доступ к командам
    if (chatId !== this.telegramChatId) {
      return this.sendMessage('У вас нет доступа к этой команде.', chatId);
    }
    
    // Разбиваем команду на части
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    
    try {
      switch (command) {
        case '/start':
          return this.sendMessage('👋 Привет! Я бот для управления ThunderStore.\n\nДоступные команды:\n/orders - список последних заказов\n/order [id] - информация о заказе\n/products - список товаров\n/help - список всех команд', chatId);
        
        case '/help':
          return this.sendHelp(chatId);
        
        case '/orders':
          return this.getOrders(chatId);
        
        case '/order':
          if (parts.length < 2) return this.sendMessage('⚠️ Укажите ID заказа: /order [id]', chatId);
          return this.getOrder(parseInt(parts[1]), chatId);
        
        case '/products':
          return this.getProducts(chatId);
        
        case '/product':
          if (parts.length < 2) return this.sendMessage('⚠️ Укажите ID товара: /product [id]', chatId);
          return this.getProduct(parseInt(parts[1]), chatId);
        
        case '/status':
          if (parts.length < 3) return this.sendMessage('⚠️ Укажите ID заказа и статус: /status [id] [status]', chatId);
          return this.updateOrderStatus(parseInt(parts[1]), parts[2], chatId);
        
        case '/stats':
          return this.getStats(parts[1] || 'today', chatId);
        
        default:
          return this.sendMessage('⚠️ Неизвестная команда. Используйте /help для списка команд.', chatId);
      }
    } catch (error) {
      this.fastify.log.error(`Error handling command ${command}: ${error}`);
      return this.sendMessage(`❌ Произошла ошибка: ${error}`, chatId);
    }
  }
  
  // Получение списка последних заказов
  private async getOrders(chatId: string) {
    try {
      const result = await this.pool.query(`
        SELECT o.id, o.status, o.total_price, o.created_at, u.email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
        LIMIT 10
      `);
      
      if (result.rows.length === 0) {
        return this.sendMessage('📊 Заказов пока нет.', chatId);
      }
      
      let message = '📋 *Последние заказы:*\n\n';
      
      result.rows.forEach(order => {
        const date = new Date(order.created_at).toLocaleString('ru');
        const statusEmoji = this.getStatusEmoji(order.status);
        
        message += `🔹 *Заказ #${order.id}*\n`;
        message += `${statusEmoji} Статус: ${order.status}\n`;
        message += `💰 Сумма: ${order.total_price} ₽\n`;
        message += `📅 Дата: ${date}\n`;
        message += `✉️ Email: ${order.email || 'не указан'}\n\n`;
      });
      
      message += 'Для подробностей используйте /order [id]';
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting orders: ${error}`);
      return this.sendMessage(`❌ Ошибка при получении заказов: ${error}`, chatId);
    }
  }
  
  // Получение информации о конкретном заказе
  private async getOrder(orderId: number, chatId: string) {
    try {
      const orderResult = await this.pool.query(`
        SELECT o.id, o.status, o.total_price, o.created_at, o.shipping_address, u.email, u.phone
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.id = $1
      `, [orderId]);
      
      if (orderResult.rows.length === 0) {
        return this.sendMessage(`❌ Заказ #${orderId} не найден.`, chatId);
      }
      
      const order = orderResult.rows[0];
      
      // Получаем товары в заказе
      const itemsResult = await this.pool.query(`
        SELECT oi.quantity, oi.price, oi.size, p.name, p.id as product_id
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = $1
      `, [orderId]);
      
      const date = new Date(order.created_at).toLocaleString('ru');
      const statusEmoji = this.getStatusEmoji(order.status);
      
      let message = `🛍️ *Информация о заказе #${order.id}*\n\n`;
      message += `${statusEmoji} *Статус:* ${order.status}\n`;
      message += `💰 *Сумма:* ${order.total_price} ₽\n`;
      message += `📅 *Дата:* ${date}\n`;
      message += `✉️ *Email:* ${order.email || 'не указан'}\n`;
      message += `📞 *Телефон:* ${order.phone || 'не указан'}\n`;
      message += `🏠 *Адрес:* ${order.shipping_address || 'не указан'}\n\n`;
      
      message += `📦 *Товары в заказе:*\n`;
      
      itemsResult.rows.forEach(item => {
        message += `▫️ ${item.name} (ID: ${item.product_id})\n`;
        message += `   Размер: ${item.size}, Количество: ${item.quantity}, Цена: ${item.price} ₽\n`;
      });
      
      message += '\n*Управление заказом:*\n';
      message += 'Изменить статус: /status ' + order.id + ' [new_status]\n';
      message += 'Доступные статусы: pending, paid, shipped, delivered, cancelled';
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting order ${orderId}: ${error}`);
      return this.sendMessage(`❌ Ошибка при получении заказа #${orderId}: ${error}`, chatId);
    }
  }
  
  // Обновление статуса заказа
  private async updateOrderStatus(orderId: number, newStatus: string, chatId: string) {
    const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(newStatus)) {
      return this.sendMessage(`❌ Недопустимый статус. Используйте один из: ${validStatuses.join(', ')}`, chatId);
    }
    
    try {
      const result = await this.pool.query(`
        UPDATE orders SET status = $1 WHERE id = $2 RETURNING id
      `, [newStatus, orderId]);
      
      if (result.rows.length === 0) {
        return this.sendMessage(`❌ Заказ #${orderId} не найден.`, chatId);
      }
      
      const statusEmoji = this.getStatusEmoji(newStatus);
      return this.sendMessage(`✅ Статус заказа #${orderId} обновлен на ${statusEmoji} ${newStatus}`, chatId);
    } catch (error) {
      this.fastify.log.error(`Error updating order status ${orderId}: ${error}`);
      return this.sendMessage(`❌ Ошибка при обновлении статуса заказа #${orderId}: ${error}`, chatId);
    }
  }
  
  // Получение списка товаров
  private async getProducts(chatId: string) {
    try {
      const result = await this.pool.query(`
        SELECT id, name, price, array_to_string(categories, ', ') as categories
        FROM products
        ORDER BY id
        LIMIT 10
      `);
      
      if (result.rows.length === 0) {
        return this.sendMessage('📊 Товаров пока нет.', chatId);
      }
      
      let message = '🛍️ *Список товаров:*\n\n';
      
      result.rows.forEach(product => {
        message += `🔸 *${product.name}* (ID: ${product.id})\n`;
        message += `💰 Цена: ${product.price} ₽\n`;
        message += `🏷️ Категории: ${product.categories || 'не указаны'}\n\n`;
      });
      
      message += 'Для подробностей используйте /product [id]';
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting products: ${error}`);
      return this.sendMessage(`❌ Ошибка при получении товаров: ${error}`, chatId);
    }
  }
  
  // Получение информации о конкретном товаре
  private async getProduct(productId: number, chatId: string) {
    try {
      const result = await this.pool.query(`
        SELECT id, name, price, description, array_to_string(categories, ', ') as categories, stock
        FROM products
        WHERE id = $1
      `, [productId]);
      
      if (result.rows.length === 0) {
        return this.sendMessage(`❌ Товар #${productId} не найден.`, chatId);
      }
      
      const product = result.rows[0];
      
      let message = `📦 *Информация о товаре #${product.id}*\n\n`;
      message += `📌 *Название:* ${product.name}\n`;
      message += `💰 *Цена:* ${product.price} ₽\n`;
      message += `🏷️ *Категории:* ${product.categories || 'не указаны'}\n`;
      message += `📝 *Описание:* ${(product.description || '').substring(0, 100)}${product.description && product.description.length > 100 ? '...' : ''}\n\n`;
      
      message += `🗃️ *Наличие:*\n`;
      
      // Преобразуем JSON объект stock в читаемый формат
      const stock = product.stock ? product.stock : {};
      Object.entries(stock).forEach(([size, quantity]) => {
        message += `▫️ ${size}: ${quantity}\n`;
      });
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting product ${productId}: ${error}`);
      return this.sendMessage(`❌ Ошибка при получении товара #${productId}: ${error}`, chatId);
    }
  }
  
  // Получение статистики
  private async getStats(period: string, chatId: string) {
    try {
      let timeCondition = '';
      let periodName = '';
      
      switch (period.toLowerCase()) {
        case 'today':
          timeCondition = 'created_at >= CURRENT_DATE';
          periodName = 'сегодня';
          break;
        case 'yesterday':
          timeCondition = 'created_at >= CURRENT_DATE - INTERVAL \'1 day\' AND created_at < CURRENT_DATE';
          periodName = 'вчера';
          break;
        case 'week':
          timeCondition = 'created_at >= CURRENT_DATE - INTERVAL \'7 days\'';
          periodName = 'за неделю';
          break;
        case 'month':
          timeCondition = 'created_at >= CURRENT_DATE - INTERVAL \'30 days\'';
          periodName = 'за месяц';
          break;
        default:
          timeCondition = 'created_at >= CURRENT_DATE';
          periodName = 'сегодня';
      }
      
      // Общая статистика заказов
      const orderStats = await this.pool.query(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN status = 'paid' OR status = 'shipped' OR status = 'delivered' THEN 1 END) as completed_orders,
          COALESCE(SUM(CASE WHEN status = 'paid' OR status = 'shipped' OR status = 'delivered' THEN total_price ELSE 0 END), 0) as revenue
        FROM orders
        WHERE ${timeCondition}
      `);
      
      // Статистика по статусам
      const statusStats = await this.pool.query(`
        SELECT status, COUNT(*) as count
        FROM orders
        WHERE ${timeCondition}
        GROUP BY status
        ORDER BY count DESC
      `);
      
      const stats = orderStats.rows[0];
      
      let message = `📊 *Статистика ${periodName}*\n\n`;
      message += `🛒 *Всего заказов:* ${stats.total_orders}\n`;
      message += `✅ *Выполнено:* ${stats.completed_orders}\n`;
      message += `💰 *Выручка:* ${stats.revenue} ₽\n\n`;
      
      if (statusStats.rows.length > 0) {
        message += `📋 *Статусы заказов:*\n`;
        statusStats.rows.forEach(row => {
          const statusEmoji = this.getStatusEmoji(row.status);
          message += `${statusEmoji} ${row.status}: ${row.count}\n`;
        });
      }
      
      return this.sendMessage(message, chatId);
    } catch (error) {
      this.fastify.log.error(`Error getting stats for ${period}: ${error}`);
      return this.sendMessage(`❌ Ошибка при получении статистики: ${error}`, chatId);
    }
  }
  
  // Отправка справки о командах
  private async sendHelp(chatId: string) {
    const message = `
🔍 *Доступные команды:*

*Заказы:*
/orders - список последних заказов
/order [id] - информация о заказе
/status [id] [status] - изменить статус заказа

*Товары:*
/products - список товаров
/product [id] - информация о товаре

*Статистика:*
/stats today - статистика за сегодня
/stats week - статистика за неделю
/stats month - статистика за месяц

*Прочее:*
/help - список команд
`;
    
    return this.sendMessage(message, chatId);
  }
  
  // Вспомогательная функция для эмодзи статусов
  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'pending': return '⏳';
      case 'paid': return '💵';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '❓';
    }
  }
  
  // Отправка сообщения в Telegram
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
  
  // Отправка уведомления о платеже (используется с существующим PaymentLogger)
  public async sendPaymentNotification(message: string) {
    return this.sendMessage(message);
  }
} 