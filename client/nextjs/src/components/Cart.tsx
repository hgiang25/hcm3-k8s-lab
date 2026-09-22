'use client';

import { CartContext, CartDispatchContext } from '@/components/CartProvider';
import Alert from '@/components/Alert';
import { createOrder } from '@/utils/services';
import {
  useContext, useRef, useState,
  //types
  Dispatch, SetStateAction
} from 'react';
import CartItem from './CartItem';
import { createPortal } from 'react-dom';

export interface CartProps {
  refreshProducts?: (searchData?: models.Product) => void;
  setAlertNotification?: Dispatch<SetStateAction<{
    title: string;
    message: string;
  }>>;
}


export default function Cart({ refreshProducts, setAlertNotification }: CartProps) {
  const [open, setOpen] = useState(false);
  const overlay = useRef<HTMLDivElement>(null);
  const cart = useContext(CartContext);
  const cartDispatch = useContext(CartDispatchContext);

  function toggleOpen() {
    if (open) {
      document.body.classList.remove('overflow-hidden');
    } else {
      document.body.classList.add('overflow-hidden');
    }
    setOpen(!open);
  }

  async function submitOrder() {
    if (setAlertNotification) {
      setAlertNotification({ title: '', message: '' });
    }

    try {
      const order = await createOrder(
        cart.map((item) => {
          return {
            productId: item.product.productId,
            qty: item.quantity,
            productPrice: item.product.price,
            storeId: item.product.storeId || ""
          };
        }),
      );

      if (order?.error) {
        throw new Error(String(order.error));
      }

      cartDispatch({
        type: 'clear_cart',
      });

      toggleOpen();

      if (setAlertNotification) {
        setAlertNotification({
          title: `Order #${order.data}`,
          message:
            'Order placed, click on the "Orders" tab to see your order status!',
        });
      }

      if (refreshProducts) {
        refreshProducts();
      }
    } catch (err: unknown) {
      if (setAlertNotification) {
        const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setAlertNotification({
          title: 'Order Failed',
          message,
        });
      }
    }
  }

  return (
    <>
      <div
        onClick={toggleOpen}
        className="fas fa-shopping-cart flex justify-center items-center w-12 h-12 rounded-full cursor-pointer fixed bottom-5 right-5 text-xl bg-terracotta-500 text-white shadow-lg hover:bg-terracotta-600 transition-colors z-30"
        style={{ display: 'flex' }}>
        <span className="flex justify-center items-center w-6 h-6 rounded-full bg-white text-terracotta-600 border-terracotta-500 border-2 text-xs absolute -top-2 -right-2">
          {cart.reduce((sum, item) => sum + item.quantity, 0)}
        </span>
      </div>
      {open && (
        <div
          ref={overlay}
          onClick={(ev) => {
            if (ev.target === overlay.current) {
              toggleOpen();
            }
          }}
          className="flex flex-col fixed top-0 bottom-0 left-0 right-0 bg-ink-900 bg-opacity-50 z-40">
          <div className="flex flex-col self-end flex-grow w-full md:w-1/3 bg-cream-50">
            <div className="flex justify-between items-center p-3 bg-terracotta-500 text-white text-md">
              <div>
                <i className="fas fa-shopping-cart mr-1" aria-hidden="true" />
                Cart
              </div>
              <div onClick={toggleOpen} className="cursor-pointer">
                <i className="fas fa-times cursor-pointer" aria-hidden="true" />
              </div>
            </div>
            <div className="flex flex-col flex-grow pt-4 px-4 overflow-y-auto h-px">
              {cart.map((item) => {
                return (
                  <CartItem
                    key={item.product.productId}
                    {...item}
                    handleChange={(value) => {
                      cartDispatch({
                        type: 'update_quantity',
                        item: {
                          product: item.product,
                          quantity: value,
                        },
                      });
                    }}
                    handleDelete={() => {
                      cartDispatch({
                        type: 'remove_from_cart',
                        item,
                      });
                    }}
                  />
                );
              })}
            </div>
            <button
              onClick={() => {
                void submitOrder();
              }}
              className="flex justify-center items-center self-center m-3 px-6 py-2.5 bg-terracotta-500 hover:bg-terracotta-600 text-white rounded-full font-semibold uppercase tracking-wide text-sm transition-colors">
              Buy Now
            </button>
          </div>
        </div>
      )}
    </>
  );
}
