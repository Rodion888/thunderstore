import { DeliveryType, PaymentMethod } from "../types/order.types";

export const DeliveryOptions = {
  [DeliveryType.PICKUP]: 'Самовывоз в Краснодаре',
  [DeliveryType.COURIER]: 'Курьер по Краснодару',
  [DeliveryType.CDEK]: 'СДЭК до ПВЗ',
};

export const PaymentOptions = {
  [PaymentMethod.ONLINE]: 'Онлайн-оплата (VISA / MASTERCARD / МИР / СБП / T-PAY/ SBERPAY)',
  [PaymentMethod.CRYPTO]: 'Crypto & Bank Card - Bank Card, BTC, ETH, USDT',
};

export const ErrorMessages = {
  required: 'Это поле обязательно',
  email: 'Введите корректный email',
  pattern: 'Неверный формат',
  invalid: 'Некорректное значение',
};
