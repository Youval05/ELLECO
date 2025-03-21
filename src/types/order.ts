export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'à planifier' | 'planifiée' | 'livrée' | 'archivée';

export interface Order {
  id: string;
  reference?: string;
  plannedDeliveryDate?: Date | null;
  pallets?: Pallet[];
  commercial?: string;
  clientName?: string;
  client?: string;
  address?: string;
  products?: string[];
  comments?: string;
  status?: OrderStatus;
  preparateur?: string;
  version?: number;
  archived?: boolean;
  archivedAt?: string;
}

export interface Pallet {
  dimensions: string;
  weight: number;
  height: number;
}
