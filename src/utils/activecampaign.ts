// ActiveCampaign integration utilities

export const ACTIVECAMPAIGN_CONFIG = {
  apiUrl: process.env.NEXT_PUBLIC_ACTIVECAMPAIGN_API_URL || 'https://ausbeds80383.activehosted.com',
  listId: process.env.NEXT_PUBLIC_ACTIVECAMPAIGN_LIST_ID || '6',
  listName: 'Your mattress is coming tomorrow'
};

export interface ActiveCampaignData {
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  shippingAddress?: string;
  invoiceNumber: string;
  totalAmount: number;
  deliveryTime?: string;
}

export const formatDeliveryTime = (time: string): string => {
  // Clean up common delivery time formats
  if (!time) return '';
  
  // Examples: "11-3pm" → "11:00 AM - 3:00 PM"
  // "2pm" → "2:00 PM"
  // "morning" → "Morning delivery"
  
  const cleaned = time.trim().toLowerCase();
  
  if (cleaned.includes('morning')) return 'Morning delivery';
  if (cleaned.includes('afternoon')) return 'Afternoon delivery';
  if (cleaned.includes('evening')) return 'Evening delivery';
  
  // For now, return as-is. Can enhance formatting later
  return time;
};