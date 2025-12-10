'use client';

import { Look } from '@/lib/types';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';

interface LookCardProps {
  look: Look;
}

export default function LookCard({ look }: LookCardProps) {
  const itemsByRecipient = look.items.reduce((acc, item) => {
    if (!acc[item.for]) {
      acc[item.for] = [];
    }
    acc[item.for].push(item);
    return acc;
  }, {} as Record<string, typeof look.items>);

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{look.name}</h3>
          <p className="mt-1 text-2xl font-bold text-teal-600">
            {formatPrice(look.total_price)}
          </p>
        </div>
      </div>

      <p className="mb-6 text-sm italic text-gray-600">{look.reason}</p>

      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(itemsByRecipient).map(([recipient, items]) => (
          <div key={recipient}>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-700">
              For {recipient}
            </h4>
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.product_id} className="flex gap-3 rounded-lg border border-gray-100 p-2">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-xs text-gray-600">{item.brand}</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
