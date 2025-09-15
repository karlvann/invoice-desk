import React from 'react';
import { extractSuburb, extractFirstName } from '../utils/address';
import { mattressLayers } from '../data/mattressLayers';

interface LabelItem {
  productName: string;
  customerName: string;
  customerAddress: string;
  size: string;
  model: number;
  range: string;
}

interface ProductionLabelProps {
  items: LabelItem[];
}

const ProductionLabel: React.FC<ProductionLabelProps> = ({ items }) => {
  const getLayerConfiguration = (range: string, model: number) => {
    const rangeLower = range.toLowerCase();
    const layerData = mattressLayers.find(
      layer => layer.model === rangeLower && layer.firmness === model
    );
    
    if (!layerData) {
      return "CONFIGURATION NOT FOUND";
    }
    
    // Build the layer configuration string
    const layers = [];
    
    // Add top layers (layer5 to layer2)
    if (layerData.layer5 && layerData.layer5 !== '-') layers.push(layerData.layer5.toUpperCase());
    if (layerData.layer4 && layerData.layer4 !== '-') layers.push(layerData.layer4.toUpperCase());
    if (layerData.layer3 && layerData.layer3 !== '-') layers.push(layerData.layer3.toUpperCase());
    if (layerData.layer2 && layerData.layer2 !== '-') layers.push(layerData.layer2.toUpperCase());
    
    // Format the output
    const layerCounts: { [key: string]: number } = {};
    layers.forEach(layer => {
      layerCounts[layer] = (layerCounts[layer] || 0) + 1;
    });
    
    const formattedLayers = Object.entries(layerCounts)
      .map(([layer, count]) => count > 1 ? `${count} ${layer}` : layer)
      .join(' + ');
    
    // Add spring information
    const springInfo = `${layerData.mainSpringLayer.toUpperCase()} (${layerData.springsPosition.toUpperCase()})`;
    
    return formattedLayers + '\n' + springInfo;
  };
  return (
    <div className="print:block">
      {items.map((item, index) => (
        <div 
          key={index} 
          className="production-label"
          style={{
            pageBreakAfter: index < items.length - 1 ? 'always' : 'auto',
            width: '100%',
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            fontFamily: 'Arial, sans-serif'
          }}
        >
          <div style={{
            border: '4px solid #000',
            padding: '3rem',
            width: '80%',
            maxWidth: '600px',
            textAlign: 'center'
          }}>
            {/* Product Name - Large */}
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              marginBottom: '2rem',
              textTransform: 'uppercase'
            }}>
              {item.range} {item.model} {item.size}
            </h1>
            
            {/* Customer Name */}
            <div style={{
              fontSize: '36px',
              fontWeight: 'bold',
              marginBottom: '1rem'
            }}>
              {extractFirstName(item.customerName).toUpperCase()}
            </div>
            
            {/* Suburb */}
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '2rem'
            }}>
              {extractSuburb(item.customerAddress).toUpperCase()}
            </div>
            
            {/* Size */}
            <div style={{
              fontSize: '28px',
              marginBottom: '2rem',
              fontWeight: 'bold'
            }}>
              SIZE: {item.size.toUpperCase()}
            </div>
            
            {/* Components */}
            <div style={{
              fontSize: '24px',
              fontWeight: 'bold',
              border: '2px solid #000',
              padding: '1rem',
              backgroundColor: '#f0f0f0',
              whiteSpace: 'pre-line'
            }}>
              {getLayerConfiguration(item.range, item.model)}
            </div>
          </div>
        </div>
      ))}
      
      {/* Print styles */}
      <style jsx>{`
        @media print {
          .production-label {
            page-break-after: always;
          }
          
          body {
            margin: 0;
            padding: 0;
          }
          
          @page {
            margin: 0;
            size: A4;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductionLabel;
