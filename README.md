# Thunder Store

> **E-commerce Platform for Custom T-Shirts**  
> Angular & Node.js Application

[![Live Demo](https://img.shields.io/badge/Live_Demo-thunder--store.ru-blue?style=for-the-badge)](https://thunder-store.ru)
[![Angular](https://img.shields.io/badge/Angular-19.1.0-red?style=flat-square&logo=angular)](https://angular.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.2-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

---

## Overview

E-commerce platform for custom t-shirts with product catalog, shopping cart, and cryptocurrency payments.

**Live Demo:** [thunder-store.ru](https://thunder-store.ru)

---

## Features

### Frontend
- Standalone Angular components
- Responsive design for all devices
- Product catalog with size selection
- Shopping cart functionality
- Checkout process with form validation
- Three.js 3D elements
- Multi-language support

### Backend
- RESTful API with Fastify
- WebSocket for real-time updates
- PostgreSQL database
- Telegram bot for monitoring
- Payment processing with CryptoCloud
- Deployment notifications

### Security
- HTTPS/SSL encryption (Nginx)
- CORS protection (Fastify)
- SQL injection protection (PostgreSQL)
- Error monitoring (Telegram bot)
- Secure payment processing (CryptoCloud)

---

## Stack

### Frontend
- Angular 19.1.0
- TypeScript 5.7.2
- Three.js 0.175.0
- RxJS 7.8.0
- SCSS

### Backend
- Node.js 20.x
- Fastify 5.2.1
- PostgreSQL
- TypeScript 5.3.2

### DevOps
- Docker & Docker Compose
- Nginx
- GitHub Actions
- SSL/HTTPS

---

## Development

```bash
# Clone
git clone https://github.com/yourusername/thunderstore.git
cd thunderstore

# Install
cd server && npm install
cd ../client && npm install

# Environment
cp server/.env.example server/.env
# Configure .env

# Run
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
cd client && npm start
```

**Frontend:** http://localhost:4200  
**Backend:** http://localhost:3000

---

## Architecture

### Frontend Structure
- **Features**: Home, Product Detail, Cart, Checkout, Info Pages
- **Core**: Services, API, Types, Constants
- **Shared**: Components, Pipes, Directives
- **Standalone Components**: No NgModules
- **Reactive Forms**: Form validation
- **OnPush Strategy**: Performance optimization

### Backend Structure
- **Routes**: API endpoints
- **Services**: Business logic
- **Utils**: Helper functions
- **WebSocket**: Real-time updates
- **Telegram Bot**: Monitoring & notifications

---

## Links

- **Live:** [thunder-store.ru](https://thunder-store.ru)
- **Frontend:** [/client](./client)
- **Backend:** [/server](./server)
- **Docker:** [docker-compose.yml](./docker-compose.yml)

---

<div align="center">

**Thunder Store**

</div> 