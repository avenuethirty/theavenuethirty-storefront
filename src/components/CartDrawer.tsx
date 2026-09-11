import React, { useState } from 'react';
import { X, Trash2, Plus, Minus, ArrowRight, Check, Sparkles } from 'lucide-react';
import { CartItem, GuestDetails } from '../types';
import { buildWhatsAppLink } from '../utils/whatsapp';
import { SHOP_CONFIG } from '../config/shop';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  storePhone?: string;
}

type Slide = 'cart' | 'delivery' | 'confirmation';

const PAKISTANI_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Peshawar",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Quetta",
  "Hyderabad",
  "Bahawalpur",
  "Sargodha",
  "Sukkur",
  "Abbottabad",
  "Mardan",
  "Gujrat",
  "Sheikhupura",
] as const;

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  storePhone = SHOP_CONFIG.whatsapp.number,
}) => {
  const [slide, setSlide] = useState<Slide>('cart');
  const [orderComplete, setOrderComplete] = useState(false);
  const [guest, setGuest] = useState<GuestDetails>({
    fullName: '',
    phone: '',
    address: '',
    city: '',
    notes: '',
  });
  const [orderId, setOrderId] = useState('');
  const [checkoutStatus, setCheckoutStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.priceMonthly * item.quantity,
    0
  );

  const shippingFee = subtotal >= SHOP_CONFIG.shipping.freeShippingThreshold ? 0 : SHOP_CONFIG.shipping.defaultFee;
  const total = subtotal + shippingFee;
  const currencySymbol = SHOP_CONFIG.localization.currencySymbol;

  const generateOrderId = () => {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `AV30-${num}`;
  };

  const handleConfirmOrder = async () => {
    const newOrderId = generateOrderId();
    setOrderId(newOrderId);
    setOrderComplete(true);
    setSlide('confirmation');
    setCheckoutStatus(null);

    const itemsSummary = cartItems
      .map((item) => `${item.product.name} x${item.quantity}`)
      .join(', ');

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: guest.fullName,
          phone: guest.phone,
          email: '',
          city: guest.city,
          address: guest.address,
          totalAmount: total,
          itemsSummary,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setCheckoutStatus('Order synced successfully.');
      } else {
        const errorMsg = data.error || 'Unknown error';
        setCheckoutStatus(`Sync failed: ${errorMsg}`);
        console.error('Checkout sync failed:', errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Network error';
      setCheckoutStatus(`Sync failed: ${errorMsg}`);
      console.error('Checkout sync error:', err);
    }
  };

  const whatsappUrl = buildWhatsAppLink({
    orderId,
    items: cartItems,
    total,
    guest,
    storePhone,
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-fade-in flex justify-end">
      <div className="relative w-full max-w-md bg-white text-[#111110] h-full shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-black/5 flex items-center justify-between bg-[#FAFAF9]">
          <div className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <h3 className="font-medium text-lg text-[#1A1A1A]">
              {orderComplete ? 'Order Confirmed' : 'Your Cart'}
            </h3>
            {!orderComplete && cartItems.length > 0 && (
              <span className="text-xs bg-[#1A1A1A] text-white font-semibold px-2.5 py-0.5 rounded-full">
                {cartItems.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-neutral-200 flex items-center justify-center text-[#1A1A1A] border border-black/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {orderComplete ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto text-2xl">
                ✓
              </div>
              <h4 className="text-2xl font-bold text-[#111110]">Order Initiated!</h4>
              <p className="text-xs text-neutral-600 max-w-xs mx-auto leading-relaxed">
                Your order <span className="font-bold">{orderId}</span> is ready. Click below to confirm via WhatsApp.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-6 py-3 rounded-full transition-all"
              >
                <span>Message on WhatsApp</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <button
                onClick={() => {
                  setOrderComplete(false);
                  setSlide('cart');
                  onClose();
                }}
                className="mt-4 bg-[#111110] text-white text-xs font-semibold px-6 py-3 rounded-full hover:bg-black transition-all"
              >
                Return to Store
              </button>
              {checkoutStatus && (
                <p className="text-[11px] text-neutral-500 mt-2">{checkoutStatus}</p>
              )}
            </div>
          ) : slide === 'cart' ? (
            cartItems.length === 0 ? (
              <div className="py-20 text-center space-y-3">
                <Sparkles className="w-10 h-10 text-neutral-300 mx-auto" />
                <p className="text-sm font-semibold text-neutral-600">Your bag is empty.</p>
                <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                  Browse our skincare, bags, jewellery, and more.
                </p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-[#F8F7F4] border border-neutral-200"
                >
                  <img
                    src={item.product.imageUrl}
                    alt={item.product.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover border border-neutral-300 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[#111110] truncate">
                          {item.customFormulaName || item.product.name}
                        </h4>
                        <span className="text-[10px] uppercase font-bold text-neutral-600 bg-neutral-100 px-2 py-0.5 rounded-full">
                          {item.product.category}
                        </span>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="text-neutral-400 hover:text-rose-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center border border-neutral-300 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-neutral-600 hover:bg-neutral-100 text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-[#111110]">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="px-2 py-1 text-neutral-600 hover:bg-neutral-100 text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-bold text-sm text-[#111110]">
                        {currencySymbol}{(item.product.priceMonthly * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            <div className="space-y-5">
              <h4 className="text-sm font-bold text-[#111110]">Delivery Details</h4>
              <p className="text-xs text-neutral-500">
                Enter your details to complete the order via Cash on Delivery.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={guest.fullName}
                    onChange={(e) => setGuest({ ...guest, fullName: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Phone number</label>
                  <input
                    type="tel"
                    value={guest.phone}
                    onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800"
                    placeholder="03007172007"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Delivery Address</label>
                  <textarea
                    value={guest.address}
                    onChange={(e) => setGuest({ ...guest, address: e.target.value })}
                    className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800 resize-none"
                    rows={2}
                    placeholder="House, street, area"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">City</label>
                  <select
                    value={guest.city}
                    onChange={(e) => setGuest({ ...guest, city: e.target.value })}
                    className="w-full border border neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800 bg-white"
                  >
                    <option value="">Select city</option>
                    {PAKISTANI_CITIES.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">Delivery Notes (optional)</label>
                  <textarea
                    value={guest.notes}
                    onChange={(e) => setGuest({ ...guest, notes: e.target.value })}
                    className="w-full border border neutral-300 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-neutral-800 resize-none"
                    rows={2}
                    placeholder="Gate code, preferred delivery window..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {!orderComplete && cartItems.length > 0 && (
          <div className="p-6 border-t border-neutral-200 bg-[#F8F7F4] space-y-4">
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[#111110]">
                  {currencySymbol}{subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-bold text-emerald-700">
                  {shippingFee === 0 ? 'FREE' : `${currencySymbol}${shippingFee.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-[#111110] pt-2 border-t border-neutral-200">
                <span>Total</span>
                <span>
                  {currencySymbol}{total.toFixed(2)}
                </span>
              </div>
            </div>

            {slide === 'cart' ? (
              <button
                onClick={() => setSlide('delivery')}
                className="w-full bg-[#111110] hover:bg-black text-white font-semibold text-sm py-3.5 rounded-full transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => setSlide('cart')}
                  className="flex-1 border border-neutral-300 text-[#111110] font-semibold text-sm py-3.5 rounded-full hover:bg-neutral-100 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmOrder}
                  disabled={!guest.fullName.trim() || !guest.phone.trim() || !guest.address.trim() || !guest.city.trim()}
                  className="flex-1 bg-[#111110] hover:bg-black disabled:opacity-40 text-white font-semibold text-sm py-3.5 rounded-full transition-all flex items-center justify-center gap-2"
                >
                  <span>Confirm Order</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-500">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cash on Delivery</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
