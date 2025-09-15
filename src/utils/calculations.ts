// Calculation utilities for invoice app
// All GST and price calculations in one place

// GST rate for Australia (10%)
export const GST_RATE = 10;

/**
 * Calculate GST component from a total price (GST inclusive)
 * Australian GST law: GST = Total ÷ 11
 * This is because GST is 1/11 of the GST-inclusive price
 */
export const calculateGSTComponent = (total: number): number => {
  return total / 11;
};

/**
 * Calculate price excluding GST from a GST-inclusive total
 * Ex-GST amount = Total - GST component
 */
export const calculateExGST = (total: number): number => {
  return total - calculateGSTComponent(total);
};

/**
 * Calculate subtotal from invoice items
 */
export const calculateSubtotal = (items: any[]): number => {
  return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
};

/**
 * Calculate total (for GST-inclusive pricing, this is the same as subtotal)
 */
export const calculateTotal = (items: any[]): number => {
  return calculateSubtotal(items);
};
