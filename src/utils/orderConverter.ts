import { Order, Pallet } from '../types/order';

export const convertLegacyOrder = (legacyOrder: Partial<Order>): Order => {
  const pallets = legacyOrder.pallets?.map((pallet: Partial<Pallet>): Pallet => ({
    dimensions: pallet.dimensions || '80x120',
    weight: typeof pallet.weight === 'number' ? pallet.weight : 0,
    height: typeof pallet.height === 'number' ? pallet.height : 0
  })) || [];

  return {
    id: legacyOrder.id || '',
    reference: legacyOrder.reference,
    plannedDeliveryDate: legacyOrder.plannedDeliveryDate || null,
    pallets,
    commercial: legacyOrder.commercial,
    clientName: legacyOrder.clientName,
    client: legacyOrder.client,
    address: legacyOrder.address,
    products: legacyOrder.products || [],
    comments: legacyOrder.comments,
    status: legacyOrder.status,
    preparateur: legacyOrder.preparateur,
    version: legacyOrder.version || 0
  };
};
