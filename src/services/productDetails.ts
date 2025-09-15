// Product details service - extracts mattress configuration logic
// Keeps checkout components lean and focused on conversion

import { mattressLayers } from '@/data/mattressLayers';

export interface MattressLayerInfo {
  model: string;
  firmness: number;
  mainSpringLayer: string;
  springsPosition: string;
  layer5?: string;
  layer4?: string;
  layer3?: string;
  layer2?: string;
}

export interface ProductDetails {
  name: string;
  sku: string;
  quantity: number;
  price: number;
  layerInfo?: MattressLayerInfo;
}

// Get mattress layer configuration based on SKU and name
export function getMattressLayerInfo(sku: string, name: string): MattressLayerInfo | null {
  if (!sku || !name) return null;
  
  const lowerSku = sku.toLowerCase();
  const lowerName = name.toLowerCase();
  
  // Check if this is a mattress product
  const isCloudMattress = lowerSku.includes('cloud');
  const isAuroraMattress = lowerSku.includes('aurora');
  const isCooperMattress = lowerSku.includes('cooper');
  
  if (!isCloudMattress && !isAuroraMattress && !isCooperMattress) {
    return null;
  }
  
  // Determine model
  const model = isCloudMattress ? 'cloud' : 
                isAuroraMattress ? 'aurora' : 
                'cooper';
  
  // Extract firmness from name (looking for numbers 1-16)
  const firmnessMatch = lowerName.match(/\b(\d+)\b/);
  if (!firmnessMatch) return null;
  
  const firmness = parseInt(firmnessMatch[1]);
  if (firmness < 1 || firmness > 16) return null;
  
  // Find matching layer configuration
  const layerInfo = mattressLayers.find(
    m => m.model === model && m.firmness === firmness
  );
  
  return layerInfo || null;
}

// Format product details with layer information
export function enrichProductWithLayers(item: any): ProductDetails {
  const baseProduct: ProductDetails = {
    name: item.name || '',
    sku: item.sku || '',
    quantity: parseInt(item.quantity || 1),
    price: parseFloat(item.price || 0)
  };
  
  // Add layer information if applicable
  const layerInfo = getMattressLayerInfo(baseProduct.sku, baseProduct.name);
  if (layerInfo) {
    baseProduct.layerInfo = layerInfo;
  }
  
  return baseProduct;
}

