import { SHOP_CONFIG } from '../config/shop';
import { GuestDetails } from '../types';

export interface CartItem {
  product: {
    id: string;
    name: string;
    priceMonthly: number;
  };
  quantity: number;
}

export interface WhatsAppPayload {
  orderId: string;
  items: CartItem[];
  total: number;
  guest: GuestDetails;
  storePhone: string;
}

export function buildWhatsAppLink({
  orderId,
  items,
  total,
  guest,
  storePhone,
}: WhatsAppPayload): string {
  const itemLines = items
    .map(
      (item) =>
        `• ${item.product.name} x${item.quantity}: ${SHOP_CONFIG.localization.currencySymbol}${(item.product.priceMonthly * item.quantity).toFixed(2)}`
    )
    .join("%0A");

  const message = encodeURIComponent(
    [
      `Hi, I would like to confirm my order #${orderId}.`,
      "",
      "Items:",
      itemLines,
      "",
      `Total: ${SHOP_CONFIG.localization.currencySymbol}${total.toFixed(2)}`,
      "",
      "Delivery Details:",
      `Name: ${guest.fullName}`,
      `Phone: ${guest.phone}`,
      `Address: ${guest.address}, ${guest.city}`,
      guest.notes ? `Notes: ${guest.notes}` : "",
      "",
      "Please confirm availability and delivery timeline. Thank you!",
    ]
      .filter((line) => line !== "")
      .join("\n")
  );

  const phone = storePhone.replace(/[^0-9]/g, "");

  return `https://wa.me/${phone}?text=${message}`;
}
