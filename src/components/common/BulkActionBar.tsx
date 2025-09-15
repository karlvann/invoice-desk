import React from 'react';
import { Trash2 } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClearSelection: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({ 
  selectedCount, 
  onDelete, 
  onClearSelection 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white rounded-xl shadow-lg p-4 flex items-center gap-4 z-50">
      <span className="text-sm">
        {selectedCount} invoice{selectedCount > 1 ? 's' : ''} selected
      </span>
      <button
        onClick={onDelete}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-sm transition-colors flex items-center gap-2"
      >
        <Trash2 className="w-4 h-4" />
        Delete Selected
      </button>
      <button
        onClick={onClearSelection}
        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-medium text-sm transition-colors"
      >
        Cancel
      </button>
    </div>
  );
};

export default BulkActionBar;
