'use client';

import Image from 'next/image';
import { useContext, useState } from 'react';
import { CartDispatchContext } from '@/components/CartProvider';
import { getShortName, toCurrency, getNoHtml } from '@/utils/convert';

interface Props {
  product: models.Product;
  cardColorCss?: string
}

export default function ProductCard({ product, cardColorCss }: Props) {
  const cartDispatch = useContext(CartDispatchContext);
  const [showImageSummary, setShowImageSummary] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const toggleImageSummary = () => {
    if (product.imageSummary) {
      setShowImageSummary(!showImageSummary);
    }
  };
  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  return (
    <div className="flex justify-center">
      <div className="max-w-sm w-full rounded-xl bg-white shadow-card border border-terracotta-100/70 flex flex-col overflow-hidden hover:shadow-lg transition-shadow">

        {!showImageSummary &&
          <Image
            className={`w-auto mx-auto ${product.imageSummary ? 'cursor-pointer' : ''}`}
            style={{ height: '160px' }}
            src={product.styleImages_default_imageURL}
            alt={product.productDisplayName}
            width={480}
            height={640}
            onClick={toggleImageSummary}
          />
        }
        {product.imageSummary && showImageSummary &&

          <div className="flex p-2 justify-center cursor-pointer"
            style={{ height: '160px', overflowY: 'auto' }}
            onClick={toggleImageSummary}>
            <div className='mb-4 text-base text-ink-600'>
              {product?.imageSummary}
            </div>
          </div>
        }
        <hr className="border-terracotta-100" />
        <div className={`${cardColorCss ? cardColorCss : 'bg-cream-100'} p-6 flex-grow flex flex-col`}>
          <h5 className="mb-2 h-16 text-lg font-display font-semibold leading-tight text-ink-800">
            {product.productDisplayName}
          </h5>
          <div className="mb-4 text-sm text-ink-600 flex-grow overflow-y-auto h-24 cursor-pointer">
            {!showFullDescription &&
              <div onClick={toggleDescription}>{getShortName(product.productDescriptors_description_value)}</div>
            }
            {showFullDescription &&
              <div onClick={toggleDescription}>{getNoHtml(product.productDescriptors_description_value)}</div>
            }
          </div>
          <p className="mb-4 text-sm font-semibold text-ink-700 flex justify-between">
            <span>Price: {toCurrency(product.price)} </span>

            <span>Stock Qty: {Number(product.stockQty)} </span>
          </p>
          {product?.storeName && product?.distInMiles &&
            <p className="mb-4 text-sm font-semibold text-ink-700">
              <span>
                Store: {product.storeName} ({Math.round(Number(product.distInMiles))}mi)
              </span>
            </p>
          }
          <button
            type="button"
            onClick={() => {
              cartDispatch({
                item: { product: product, quantity: 1 },
                type: 'add_to_cart',
              });
            }}
            className="inline-block rounded-full bg-terracotta-500 hover:bg-terracotta-600 px-6 pt-2.5 pb-2 text-xs font-semibold uppercase tracking-wide leading-normal text-white transition-colors">
            Add to cart
          </button>

          {product?.similarityScore &&

            <div className="flex-grow flex p-2 justify-center">
              <div className='text-sm font-semibold text-ink-600'>Match: {(product?.similarityScore).toFixed(4)}
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  );
}
