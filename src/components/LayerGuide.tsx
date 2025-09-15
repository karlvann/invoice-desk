import React, { useState } from 'react';
import { Layers, Filter, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { mattressLayers } from '../data/mattressLayers';

const LayerGuide: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const models = ['all', 'cloud', 'aurora', 'cooper'];
  
  const filteredLayers = mattressLayers.filter(layer => {
    const modelMatch = selectedModel === 'all' || layer.model === selectedModel;
    const searchMatch = searchTerm === '' || 
      layer.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      layer.firmness.toString().includes(searchTerm) ||
      Object.values(layer).some(val => 
        val.toString().toLowerCase().includes(searchTerm.toLowerCase())
      );
    return modelMatch && searchMatch;
  });

  const toggleRow = (index: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedRows(newExpanded);
  };

  const getLayerDisplay = (layer: string) => {
    if (layer === '-' || !layer) return null;
    return layer;
  };

  const getLayerSummary = (layer: any) => {
    const layers = [];
    if (layer.layer5 && layer.layer5 !== '-') layers.push(layer.layer5);
    if (layer.layer4 && layer.layer4 !== '-') layers.push(layer.layer4);
    if (layer.layer3 && layer.layer3 !== '-') layers.push(layer.layer3);
    if (layer.layer2 && layer.layer2 !== '-') layers.push(layer.layer2);
    
    // Count occurrences
    const counts: { [key: string]: number } = {};
    layers.forEach(l => {
      counts[l] = (counts[l] || 0) + 1;
    });
    
    return Object.entries(counts)
      .map(([layer, count]) => count > 1 ? `${count} ${layer}` : layer)
      .join(' + ');
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Mattress Layer Guide</h1>
          </div>
          <div className="text-sm text-gray-500">
            {filteredLayers.length} configurations
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b px-6 py-4">
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {models.map(model => (
                <option key={model} value={model}>
                  {model === 'all' ? 'All Models' : model.charAt(0).toUpperCase() + model.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search layers, firmness, or components..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-full">
          <table className="w-full bg-white">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Firmness
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Layer Configuration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Spring
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Position
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredLayers.map((layer, index) => (
                <React.Fragment key={index}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        layer.model === 'cloud' ? 'bg-blue-100 text-blue-800' :
                        layer.model === 'aurora' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {layer.model.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-2xl font-bold text-gray-900">{layer.firmness}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {getLayerSummary(layer) || 'No comfort layers'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">
                        {layer.mainSpringLayer}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        layer.springsPosition.includes('soft') ? 'bg-yellow-100 text-yellow-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {layer.springsPosition}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleRow(index)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {expandedRows.has(index) ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedRows.has(index) && (
                    <tr className="bg-gray-50">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="grid grid-cols-2 gap-6">
                          {/* Comfort Layers */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Comfort Layers (Top to Bottom)</h4>
                            <div className="space-y-2">
                              {layer.layer5 && layer.layer5 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Layer 5:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.layer5}
                                  </span>
                                </div>
                              )}
                              {layer.layer4 && layer.layer4 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Layer 4:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.layer4}
                                  </span>
                                </div>
                              )}
                              {layer.layer3 && layer.layer3 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Layer 3:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.layer3}
                                  </span>
                                </div>
                              )}
                              {layer.layer2 && layer.layer2 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Layer 2:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.layer2}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Spring & Under Spring Layers */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Spring Configuration</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Main Spring:</span>
                                <span className="px-2 py-1 bg-blue-100 rounded text-sm font-medium text-blue-800">
                                  {layer.mainSpringLayer}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-500">Position:</span>
                                <span className="px-2 py-1 bg-yellow-100 rounded text-sm font-medium text-yellow-800">
                                  {layer.springsPosition}
                                </span>
                              </div>
                              {layer.underSprings1 && layer.underSprings1 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Under Spring 1:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.underSprings1}
                                  </span>
                                </div>
                              )}
                              {layer.underSprings2 && layer.underSprings2 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Under Spring 2:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.underSprings2}
                                  </span>
                                </div>
                              )}
                              {layer.underSprings3 && layer.underSprings3 !== '-' && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-gray-500">Under Spring 3:</span>
                                  <span className="px-2 py-1 bg-white rounded text-sm font-medium text-gray-900">
                                    {layer.underSprings3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Production Label Preview */}
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-2">Production Label will show:</h4>
                          <div className="bg-white border-2 border-gray-300 rounded-lg p-3 font-mono text-sm">
                            <div className="font-bold">{getLayerSummary(layer) || 'NO COMFORT LAYERS'}</div>
                            <div className="text-gray-600">{layer.mainSpringLayer.toUpperCase()} ({layer.springsPosition.toUpperCase()})</div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {filteredLayers.length === 0 && (
            <div className="text-center py-12">
              <Layers className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No layer configurations found matching your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LayerGuide;