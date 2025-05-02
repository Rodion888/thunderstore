import { FastifyInstance } from 'fastify';
import { Product } from '../types/index.js';

import fetch from 'node-fetch';
import path from 'path';
import sharp from 'sharp';
import fs from 'fs/promises';

interface ProductCreationState {
  step: 'name' | 'price' | 'stock' | 'front_image' | 'back_image' | 'complete' | 'front_image_name' | 'back_image_name';
  data: Partial<Product>;
  chatId: string;
}

interface ProductEditingState {
  productId: number;
  step: 'selecting' | 'name' | 'price' | 'stock' | 'front_image' | 'back_image';
  data: Partial<Product>;
  chatId: string;
}

export class TelegramBot {
  private fastify: FastifyInstance;
  private telegramEnabled: boolean;
  private telegramToken: string | undefined;
  private telegramChatId: string | undefined;
  private pool: any;
  
  // Store product creation/editing state
  private productCreationStates: Map<string, ProductCreationState> = new Map();
  private productEditingStates: Map<string, ProductEditingState> = new Map();

  // File storage paths
  private uploadsDir: string;
  private staticDir: string;

  constructor(fastify: FastifyInstance, pool: any) {
    this.fastify = fastify;
    this.pool = pool;
    
    this.telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    this.telegramChatId = process.env.TELEGRAM_CHAT_ID;
    this.telegramEnabled = process.env.TELEGRAM_ENABLED === 'true' && !!this.telegramToken && !!this.telegramChatId;
    
    // Initialize storage paths
    this.uploadsDir = path.join(process.cwd(), '..', 'uploads', 'products');
    this.staticDir = path.join(process.cwd(), '..', 'client', 'src', 'assets', 'static');
    
    if (this.telegramEnabled) {
      this.fastify.log.info('Telegram bot enabled with token: ' + this.telegramToken?.substring(0, 5) + '...' + this.telegramToken?.substring(this.telegramToken.length - 5));
      this.fastify.log.info('Telegram chat ID: ' + this.telegramChatId);
      this.fastify.log.info('Uploads directory: ' + this.uploadsDir);
      this.fastify.log.info('Static directory: ' + this.staticDir);
      this.setupWebhook();
      this.initializeStorage().catch(err => {
        this.fastify.log.error(`Failed to initialize storage: ${err}`);
      });
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
          return this.sendMessage('👋 *Welcome to ThunderStore Management Bot!*\n\n' +
            '*Available Commands:*\n\n' +
            '📦 *Products Management:*\n' +
            '/products - View all products\n' +
            '/product [id] - View product details\n' +
            '/addproduct - Add new product\n' +
            '/editproduct [id] - Edit product\n' +
            '/deleteproduct [id] - Delete product\n\n' +
            '🛍️ *Orders:*\n' +
            '/orders - View recent orders\n' +
            '/order [id] - View order details\n\n' +
            'Use /help for detailed command information', chatId);
        
        case '/help':
          return this.sendHelp(chatId);
        
        case '/orders':
          return this.getOrders(chatId);
        
        case '/order':
          if (parts.length < 2) {
            return this.sendMessage('⚠️ Please specify the order ID\n' +
              '*Usage:* /order [id]\n' +
              '*Example:* /order 123', chatId);
          }
          return this.getOrder(parseInt(parts[1]), chatId);
        
        case '/products':
          return this.getProducts(chatId);
        
        case '/product':
          if (parts.length < 2) {
            return this.sendMessage('⚠️ Please specify the product ID\n' +
              '*Usage:* /product [id]\n' +
              '*Example:* /product 1', chatId);
          }
          return this.getProduct(parseInt(parts[1]), chatId);

        case '/addproduct':
          return this.startProductCreation(chatId);

        case '/editproduct':
          if (parts.length < 2) {
            return this.sendMessage('⚠️ Please specify the product ID\n' +
              '*Usage:* /editproduct [id]\n' +
              '*Example:* /editproduct 1', chatId);
          }
          return this.startProductEditing(parseInt(parts[1]), chatId);

        case '/deleteproduct':
          if (parts.length < 2) {
            return this.sendMessage('⚠️ Please specify the product ID to delete\n' +
              '*Usage:* /deleteproduct [id]\n' +
              '*Example:* /deleteproduct 1', chatId);
          }
          return this.deleteProduct(parseInt(parts[1]), chatId);
        
        default:
          return this.sendMessage('⚠️ Unknown command\n\n' +
            'Use /help to see all available commands\n' +
            'Or /start for a quick overview', chatId);
      }
    } catch (error) {
      this.fastify.log.error(`Error handling command ${command}: ${error}`);
      return this.sendMessage(`❌ An error occurred while processing your command.\n\nError details: ${error}`, chatId);
    }
  }
  
  // Handle incoming messages (not commands)
  public async handleMessage(message: any) {
    const chatId = message.chat.id;
    this.fastify.log.info('[handleMessage] message:', JSON.stringify(message, null, 2));
    
    // Check if we're in product creation process
    const creationState = this.productCreationStates.get(chatId);
    if (creationState) {
      return this.handleProductCreation(message, creationState);
    }

    // Check if we're in product editing process
    const editingState = this.productEditingStates.get(chatId);
    if (editingState) {
      return this.handleProductEditing(message, editingState);
    }
  }

  // Start product creation process
  private async startProductCreation(chatId: string) {
    this.productCreationStates.set(chatId, {
      step: 'name',
      data: {},
      chatId
    });

    return this.sendMessage('🆕 *Creating a new product*\n\n' +
      'Please send the product name:', chatId);
  }

  // Handle product creation steps
  private async handleProductCreation(message: any, state: ProductCreationState) {
    const chatId = state.chatId;
    this.fastify.log.info(`[handleProductCreation] step: ${state.step}, message:`, JSON.stringify(message, null, 2));
    try {
      switch (state.step) {
        case 'name':
          this.fastify.log.info('[handleProductCreation] Got product name:', message.text);
          state.data.name = message.text;
          state.step = 'front_image_name';
          return this.sendMessage('📝 Please send the filename for the front image (without extension):', chatId);
        case 'front_image_name':
          this.fastify.log.info('[handleProductCreation] Got front image name:', message.text);
          state.data.frontImageName = message.text;
          state.step = 'front_image';
          return this.sendMessage('🖼 Please send the front image of the product:', chatId);
        case 'front_image':
          this.fastify.log.info('[handleProductCreation] Waiting for front image, message:', JSON.stringify(message, null, 2));
          if (!message.photo) {
            this.fastify.log.warn('[handleProductCreation] No photo found in message!');
            return this.sendMessage('⚠️ Please send an image:', chatId);
          }
          const frontImage = await this.handleProductImage(message.photo, 'front', state);
          state.data.images = { front: frontImage, back: '' };
          state.step = 'back_image_name';
          return this.sendMessage('📝 Please send the filename for the back image (without extension):', chatId);
        case 'back_image_name':
          this.fastify.log.info('[handleProductCreation] Got back image name:', message.text);
          state.data.backImageName = message.text;
          state.step = 'back_image';
          return this.sendMessage('🖼 Please send the back image of the product:', chatId);
        case 'back_image':
          this.fastify.log.info('[handleProductCreation] Waiting for back image, message:', JSON.stringify(message, null, 2));
          if (!message.photo) {
            this.fastify.log.warn('[handleProductCreation] No photo found in message!');
            return this.sendMessage('⚠️ Please send an image:', chatId);
          }
          const backImage = await this.handleProductImage(message.photo, 'back', state);
          if (state.data.images) {
            state.data.images.back = backImage;
          }
          state.step = 'price';
          return this.sendMessage('💰 Please send the product price (number only):', chatId);
        case 'price':
          this.fastify.log.info('[handleProductCreation] Got price:', message.text);
          const price = parseInt(message.text);
          if (isNaN(price)) {
            this.fastify.log.warn('[handleProductCreation] Invalid price:', message.text);
            return this.sendMessage('⚠️ Please send a valid number for price:', chatId);
          }
          state.data.price = price;
          state.step = 'stock';
          return this.sendMessage('📦 Please send the stock information in format:\n' +
            'S:10, M:15, L:20, XL:10', chatId);
        case 'stock':
          this.fastify.log.info('[handleProductCreation] Got stock:', message.text);
          try {
            const stock = this.parseStockInput(message.text);
            state.data.stock = stock;
            await this.saveNewProduct(state.data);
            this.productCreationStates.delete(chatId);
            this.fastify.log.info('[handleProductCreation] Product successfully created!');
            return this.sendMessage('✅ Product successfully created!', chatId);
          } catch (error) {
            this.fastify.log.error('[handleProductCreation] Invalid stock format:', error);
            return this.sendMessage('⚠️ Invalid stock format. Please use format:\nS:10, M:15, L:20, XL:10', chatId);
          }
      }
    } catch (error) {
      this.fastify.log.error('[handleProductCreation] Error:', error);
      this.productCreationStates.delete(chatId);
      return this.sendMessage(`❌ Error creating product: ${error}`, chatId);
    }
  }

  // Parse stock input from string to object
  private parseStockInput(input: string): Record<string, number> {
    const stock: Record<string, number> = {};
    const pairs = input.split(',').map(pair => pair.trim());
    
    for (const pair of pairs) {
      const [size, quantity] = pair.split(':').map(part => part.trim());
      const quantityNum = parseInt(quantity);
      
      if (!size || isNaN(quantityNum)) {
        throw new Error('Invalid stock format');
      }
      
      stock[size] = quantityNum;
    }
    
    return stock;
  }

  // Handle product image upload
  private async handleProductImage(photos: any[], type: 'front' | 'back', state: ProductCreationState | ProductEditingState): Promise<string> {
    try {
      // Get the highest quality photo
      const photo = photos[photos.length - 1];
      
      // Get file path from Telegram
      const fileResponse = await fetch(
        `https://api.telegram.org/bot${this.telegramToken}/getFile?file_id=${photo.file_id}`
      );
      const fileData = await fileResponse.json();
      
      if (!fileData.ok || !fileData.result.file_path) {
        throw new Error('Failed to get file path');
      }

      // Download file from Telegram
      const fileUrl = `https://api.telegram.org/file/bot${this.telegramToken}/${fileData.result.file_path}`;
      const imageResponse = await fetch(fileUrl);
      const imageBuffer = await imageResponse.arrayBuffer();

      // Use custom filename if provided, otherwise generate from product name
      const filename = type === 'front' 
        ? `${state.data.frontImageName || state.data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.webp`
        : `${state.data.backImageName || state.data.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-back.webp`;
      
      const savePath = path.join(this.uploadsDir, filename);

      // Convert to webp and save
      await sharp(Buffer.from(imageBuffer))
        .webp({ quality: 80 }) // Optimize quality
        .toFile(savePath);
      
      this.fastify.log.info(`Saved image to ${savePath}`);
      
      return filename;
    } catch (error) {
      throw new Error(`Failed to process image: ${error}`);
    }
  }

  // Save new product to database
  private async saveNewProduct(productData: Partial<Product>) {
    try {
      // Get max product ID
      const maxIdResult = await this.pool.query('SELECT MAX(id) FROM products');
      const nextId = (maxIdResult.rows[0].max || 0) + 1;

      // Insert new product
      await this.pool.query(
        'INSERT INTO products (id, name, price, stock, images) VALUES ($1, $2, $3, $4, $5)',
        [nextId, productData.name, productData.price, productData.stock, productData.images]
      );
    } catch (error) {
      throw new Error(`Failed to save product: ${error}`);
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
        SELECT id, name, price, stock
        FROM products
        WHERE id = $1
      `, [productId]);
      
      if (result.rows.length === 0) {
        return this.sendMessage(`❌ Product #${productId} not found.`, chatId);
      }
      
      const product = result.rows[0];
      
      let message = `📦 *Product Information #${product.id}*\n\n`;
      message += `📌 *Name:* ${product.name}\n`;
      message += `💰 *Price:* ${product.price} ₽\n\n`;
      
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
  
  // Send command help
  private async sendHelp(chatId: string) {
    const message = `
🔍 *Available Commands:*

📦 *Products Management:*
/products - List all products
/product [id] - View product details
/addproduct - Add new product
/editproduct [id] - Edit existing product
/deleteproduct [id] - Delete product

🛍️ *Orders:*
/orders - List recent orders
/order [id] - View order details

*Examples:*
• View product: /product 1
• Add product: /addproduct
• Edit product: /editproduct 1
• Delete product: /deleteproduct 1
• View order: /order 123
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

  // Start product editing process
  private async startProductEditing(productId: number, chatId: string) {
    try {
      // Get existing product
      const result = await this.pool.query('SELECT * FROM products WHERE id = $1', [productId]);
      const product = result.rows[0];
      
      if (!product) {
        return this.sendMessage(`❌ Product with ID ${productId} not found`, chatId);
      }

      this.productEditingStates.set(chatId, {
        productId,
        step: 'selecting',
        data: { ...product },
        chatId
      });

      return this.sendMessage('🔄 *Editing product*\n\n' +
        'What would you like to edit?\n\n' +
        '1️⃣ Name\n' +
        '2️⃣ Price\n' +
        '3️⃣ Stock\n' +
        '4️⃣ Front image\n' +
        '5️⃣ Back image\n\n' +
        'Send the number of what you want to edit:', chatId);
    } catch (error) {
      return this.sendMessage(`❌ Error starting product edit: ${error}`, chatId);
    }
  }

  // Handle product editing steps
  private async handleProductEditing(message: any, state: ProductEditingState) {
    const chatId = state.chatId;

    try {
      if (state.step === 'selecting') {
        switch (message.text) {
          case '1':
            state.step = 'name';
            return this.sendMessage('✏️ Please send the new product name:', chatId);
          case '2':
            state.step = 'price';
            return this.sendMessage('💰 Please send the new price (number only):', chatId);
          case '3':
            state.step = 'stock';
            return this.sendMessage('📦 Please send the new stock information in format:\n' +
              'S:10, M:15, L:20, XL:10', chatId);
          case '4':
            state.step = 'front_image';
            return this.sendMessage('🖼 Please send the new front image:', chatId);
          case '5':
            state.step = 'back_image';
            return this.sendMessage('🖼 Please send the new back image:', chatId);
          default:
            return this.sendMessage('⚠️ Please send a number between 1 and 5:', chatId);
        }
      }

      switch (state.step) {
        case 'name':
          state.data.name = message.text;
          break;

        case 'price':
          const price = parseInt(message.text);
          if (isNaN(price)) {
            return this.sendMessage('⚠️ Please send a valid number for price:', chatId);
          }
          state.data.price = price;
          break;

        case 'stock':
          try {
            state.data.stock = this.parseStockInput(message.text);
          } catch (error) {
            return this.sendMessage('⚠️ Invalid stock format. Please use format:\nS:10, M:15, L:20, XL:10', chatId);
          }
          break;

        case 'front_image':
          if (!message.photo) {
            return this.sendMessage('⚠️ Please send an image:', chatId);
          }
          const frontImage = await this.handleProductImage(message.photo, 'front', state);
          state.data.images = { 
            front: frontImage,
            back: state.data.images?.back || '' 
          };
          break;

        case 'back_image':
          if (!message.photo) {
            return this.sendMessage('⚠️ Please send an image:', chatId);
          }
          const backImage = await this.handleProductImage(message.photo, 'back', state);
          state.data.images = { 
            front: state.data.images?.front || '',
            back: backImage 
          };
          break;
      }

      // Save changes and clear state
      await this.updateProduct(state.productId, state.data);
      this.productEditingStates.delete(chatId);
      
      return this.sendMessage('✅ Product successfully updated!\n\n' +
        'You can continue editing by using /editproduct command again.', chatId);

    } catch (error) {
      this.productEditingStates.delete(chatId);
      return this.sendMessage(`❌ Error updating product: ${error}`, chatId);
    }
  }

  // Update existing product
  private async updateProduct(productId: number, productData: Partial<Product>) {
    try {
      await this.pool.query(
        'UPDATE products SET name = $1, price = $2, stock = $3, images = $4 WHERE id = $5',
        [productData.name, productData.price, productData.stock, productData.images, productId]
      );
    } catch (error) {
      throw new Error(`Failed to update product: ${error}`);
    }
  }

  // Delete product
  private async deleteProduct(productId: number, chatId: string) {
    try {
      // Check if product exists
      const result = await this.pool.query('SELECT * FROM products WHERE id = $1', [productId]);
      if (result.rows.length === 0) {
        return this.sendMessage(`❌ Product with ID ${productId} not found`, chatId);
      }

      // Delete product
      await this.pool.query('DELETE FROM products WHERE id = $1', [productId]);
      
      // Delete product images
      const product = result.rows[0];
      await this.deleteProductImages(product);
      
      return this.sendMessage('✅ Product successfully deleted!', chatId);
    } catch (error) {
      return this.sendMessage(`❌ Error deleting product: ${error}`, chatId);
    }
  }

  // Delete product images
  private async deleteProductImages(product: Product) {
    if (!product.images) return;

    try {
      if (product.images.front) {
        const frontPath = path.join(this.uploadsDir, product.images.front);
        await fs.unlink(frontPath).catch(err => {
          this.fastify.log.error(`Failed to delete front image: ${err}`);
        });
      }
      if (product.images.back) {
        const backPath = path.join(this.uploadsDir, product.images.back);
        await fs.unlink(backPath).catch(err => {
          this.fastify.log.error(`Failed to delete back image: ${err}`);
        });
      }
    } catch (error) {
      this.fastify.log.error(`Failed to delete product images: ${error}`);
    }
  }

  // Initialize storage
  private async initializeStorage() {
    // Ensure uploads directory exists
    await fs.mkdir(this.uploadsDir, { recursive: true });
    await fs.mkdir(this.staticDir, { recursive: true });
  }
} 