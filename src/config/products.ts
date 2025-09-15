// Product inventory configuration for ausbeds
// This file contains all mattress models, sizes, and prices

export interface MattressModel {
  model: number;
  firmness: string;
}

export interface MattressRange {
  models: MattressModel[];
  sizes: {
    [key: string]: number;
  };
}

export interface InventoryData {
  [key: string]: MattressRange;
}

export const inventoryData: InventoryData = {
  Cloud: {
    models: [
      { model: 2, firmness: 'softer' },
      { model: 3, firmness: 'softer' },
      { model: 4, firmness: 'softer' },
      { model: 5, firmness: 'medium' },
      { model: 6, firmness: 'medium' },
      { model: 7, firmness: 'medium' },
      { model: 8, firmness: 'firmer' },
      { model: 9, firmness: 'firmer' },
      { model: 10, firmness: 'firmer' },
      { model: 11, firmness: 'very firm' },
      { model: 12, firmness: 'very firm' },
      { model: 13, firmness: 'very firm' }
    ],
    sizes: {
      'King': 3190,
      'Queen': 2940,
      'Double': 2650,
      'King Single': 2350,
      'Single': 1950
    }
  },
  Aurora: {
    models: [
      { model: 2, firmness: 'softer' },
      { model: 3, firmness: 'softer' },
      { model: 4, firmness: 'softer' },
      { model: 5, firmness: 'medium' },
      { model: 6, firmness: 'medium' },
      { model: 7, firmness: 'medium' },
      { model: 8, firmness: 'firmer' },
      { model: 9, firmness: 'firmer' },
      { model: 10, firmness: 'firmer' },
      { model: 11, firmness: 'very firm' },
      { model: 12, firmness: 'very firm' },
      { model: 13, firmness: 'very firm' },
      { model: 14, firmness: 'super firm' },
      { model: 15, firmness: 'super firm' },
      { model: 16, firmness: 'super firm' },
      { model: 17, firmness: 'firmest' },
      { model: 18, firmness: 'firmest' },
      { model: 19, firmness: 'firmest' }
    ],
    sizes: {
      'King': 2750,
      'Queen': 2450,
      'Double': 2350,
      'King Single': 1950,
      'Single': 1700
    }
  },
  Cooper: {
    models: [
      { model: 5, firmness: 'medium' },
      { model: 6, firmness: 'medium' },
      { model: 7, firmness: 'medium' },
      { model: 8, firmness: 'firmer' },
      { model: 9, firmness: 'firmer' },
      { model: 10, firmness: 'firmer' }
    ],
    sizes: {
      'King': 1750,
      'Queen': 1500,
      'Double': 1350,
      'King Single': 1150,
      'Single': 850
    }
  },
  ZTest: {
    models: [
      { model: 1, firmness: 'test' }
    ],
    sizes: {
      'King': 0.51,
      'Queen': 0.51,
      'Double': 0.51,
      'King Single': 0.51,
      'Single': 0.51
    }
  }
};

// Helper function to generate all products with SKUs
export const generateProducts = () => {
  const products: any[] = [];
  Object.entries(inventoryData).forEach(([range, data]) => {
    data.models.forEach(model => {
      Object.entries(data.sizes).forEach(([size, price]) => {
        const sku = `${range}${model.model}${size.toLowerCase().replace(/\s+/g, '')}`;
        products.push({
          sku: sku,
          name: `${range} ${model.model} - ${model.firmness} - ${size}`,
          price: price,
          range: range,
          model: model.model,
          firmness: model.firmness,
          size: size
        });
      });
    });
  });
  return products;
};
