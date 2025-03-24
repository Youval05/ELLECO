'use client';

import { useState } from 'react';
import { useStore } from '../store/store';
import { Order } from '../types/order';
import { convertLegacyOrder } from '../utils/orderConverter';

interface OrderFormProps {
  mode: 'create' | 'edit';
  initialOrder?: Order;
  onClose: () => void;
}

interface FormData {
  client: string;
  address: string;
  products: string[];
  comments: string;
  commercial: string;
}

const COMMERCIALS = ['En attente', 'Jordan', 'Jérôme', 'Rudy', 'Carlo'];

const OrderForm = ({ mode, initialOrder, onClose }: OrderFormProps) => {
  const { addOrder, updateOrder } = useStore();
  
  const initialOrderWithConverter = initialOrder ? convertLegacyOrder(initialOrder) : null;

  const [formData, setFormData] = useState<FormData>({
    client: initialOrderWithConverter?.client || '',
    address: initialOrderWithConverter?.address || '',
    products: initialOrderWithConverter?.products || [],
    comments: initialOrderWithConverter?.comments || '',
    commercial: initialOrderWithConverter?.commercial || 'En attente'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const orderData: Partial<Order> = {
      client: formData.client,
      address: formData.address,
      products: formData.products,
      comments: formData.comments,
      commercial: formData.commercial
    };

    if (mode === 'create') {
      await addOrder(orderData);
    } else if (mode === 'edit' && initialOrderWithConverter?.id) {
      await updateOrder(initialOrderWithConverter.id, orderData);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {mode === 'create' ? 'Nouvelle Commande' : 
             mode === 'edit' ? 'Modifier la Commande' : 
             'Détails de la Commande'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Client</label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Commercial</label>
            <select
              value={formData.commercial}
              onChange={(e) => setFormData({ ...formData, commercial: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            >
              {COMMERCIALS.map(commercial => (
                <option key={commercial} value={commercial}>
                  {commercial}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Adresse</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Produits (séparés par des virgules)</label>
            <input
              type="text"
              value={formData.products.join(', ')}
              onChange={(e) => setFormData({ ...formData, products: e.target.value.split(',').map(p => p.trim()).filter(p => p) })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Commentaires</label>
            <textarea
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {mode === 'create' ? 'Créer' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OrderForm;
