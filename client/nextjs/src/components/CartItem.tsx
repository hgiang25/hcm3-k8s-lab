import Image from 'next/image';
import { getShortName, toCurrency } from '@/utils/convert';

interface CartItemProps extends models.CartItem {
  handleChange: (value: number) => unknown;
  handleDelete: () => unknown;
}

export default function CartItem({
  product,
  quantity,
  handleChange,
  handleDelete,
}: CartItemProps) {
  return (
    <div className="mb-3 rounded-lg shadow-sm border border-terracotta-100 overflow-hidden bg-white">
      <div className="flex">
        <Image
          className=""
          style={{ height: '80px', width: 'auto' }}
          src={product.styleImages_default_imageURL}
          alt={product.productDisplayName}
          width={480}
          height={640}
        />
        <div className="flex-grow p-2">
          <h5 className="mb-1 font-semibold text-ink-800">{product.productDisplayName}</h5>
          <p className="text-ink-600 text-sm">
            {getShortName(product.productDescriptors_description_value)}
          </p>
        </div>
      </div>
      <div className="flex justify-between items-center px-2 py-1.5 text-sm bg-terracotta-100">
        <div className="font-bold text-ink-800">
          {toCurrency(product.price)}
        </div>
        <div className="text-ink-700">
          <input
            className="text-center w-12 rounded"
            type="number"
            value={quantity}
            onChange={(ev) => {
              handleChange(Number(ev.currentTarget.value));
            }}
            max={Number(product.stockQty)}
          />
          <span> of {Number(product.stockQty)}</span>
        </div>
        <div
          onClick={() => {
            handleDelete();
          }}
          className="fas fa-trash cursor-pointer text-terracotta-700 hover:text-terracotta-800"></div>
      </div>
    </div>
  );
}
