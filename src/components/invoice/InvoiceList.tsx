import React, { useState } from 'react';
import { Plus, CloudUpload, FileDown, Square, CheckSquare } from 'lucide-react';
import { Invoice } from '../../types/invoice';
import BulkActionBar from '../common/BulkActionBar';
import DeleteConfirmModal from '../common/DeleteConfirmModal';
import { exportInvoicesToCSV } from '../../utils/csvExport';
import { isPaid } from '@/utils/paymentStatus';
import PaymentStatusBadge from '../PaymentStatusBadge';

interface InvoiceListProps {
  invoices: Invoice[];
  title: string;
  filterPaid?: boolean;
  onCreateNewInvoice: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoices: (quoteNumbers: string[]) => Promise<any>;
  onSyncToSheets: () => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

const getRelativeTime = (date: string | Date) => {
  if (!date) return '';
  
  const now = new Date();
  // Ensure the date is parsed as UTC if it's a string without timezone
  const then = typeof date === 'string' && !date.includes('Z') && !date.includes('+') 
    ? new Date(date + 'Z')  // Add Z to treat as UTC
    : new Date(date);
  
  // If the date is invalid, return empty string
  if (isNaN(then.getTime())) return '';
  
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  // Handle negative diff (future dates)
  if (diff < 0) return 'in the future';
  
  if (diff < 60) return 'just now';
  if (diff < 3600) {
    const mins = Math.floor(diff / 60);
    return `${mins} min${mins === 1 ? '' : 's'} ago`;
  }
  if (diff < 86400) {
    const hours = Math.floor(diff / 3600);
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }
  if (diff < 604800) {
    const days = Math.floor(diff / 86400);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }
  return then.toLocaleDateString('en-AU', { timeZone: 'Australia/Sydney' });
};

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  title,
  filterPaid = false,
  onCreateNewInvoice,
  onSelectInvoice,
  onDeleteInvoices,
  onSyncToSheets,
  syncStatus,
  showToast
}) => {
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const displayedInvoices = filterPaid 
    ? invoices.filter(invoice => isPaid(invoice))
    : invoices;

  const toggleInvoiceSelection = (quoteNumber: string) => {
    const newSelection = new Set(selectedInvoices);
    if (newSelection.has(quoteNumber)) {
      newSelection.delete(quoteNumber);
    } else {
      newSelection.add(quoteNumber);
    }
    setSelectedInvoices(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedInvoices.size === displayedInvoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(displayedInvoices.map(inv => inv.quote_number || '')));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;
    
    setIsDeleting(true);
    try {
      const result = await onDeleteInvoices(Array.from(selectedInvoices));
      setSelectedInvoices(new Set());
      setShowDeleteConfirm(false);
      showToast(`Successfully deleted ${result.deletedCount} invoice(s)`, 'success');
    } catch (error) {
      console.error('Error deleting invoices:', error);
      showToast('Failed to delete invoices. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    const csv = exportInvoicesToCSV(displayedInvoices);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showToast('CSV exported successfully!', 'success');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">{title}</h2>
        <div className="flex gap-3">
          {!filterPaid && (
            <>
              <button
                onClick={onSyncToSheets}
                disabled={syncStatus === 'syncing'}
                className="bg-[#FFE5E5] text-gray-900 px-4 py-2 rounded-xl hover:bg-[#FFD5E5] flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
              >
                <CloudUpload className="w-5 h-5" />
                {syncStatus === 'syncing' ? 'Syncing...' : 'Sync to Sheets'}
              </button>
              <button
                onClick={handleExportCSV}
                className="bg-[#E5FFE5] text-gray-900 px-4 py-2 rounded-xl hover:bg-[#D5FFD5] flex items-center gap-2 font-medium transition-colors"
              >
                <FileDown className="w-5 h-5" />
                Export CSV
              </button>
            </>
          )}
          <button
            onClick={onCreateNewInvoice}
            className="bg-[#E5E5FF] text-gray-900 px-4 py-2 rounded-xl hover:bg-[#D5D5FF] flex items-center gap-2 font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Invoice
          </button>
        </div>
      </div>

      {displayedInvoices.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {filterPaid ? 'No paid invoices yet.' : 'No invoices yet. Create your first invoice!'}
          </p>
        </div>
      ) : (
        <>
          {/* Select All Checkbox */}
          <div className="mb-4 flex items-center gap-3 pb-3 border-b border-gray-200">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              {selectedInvoices.size === displayedInvoices.length && displayedInvoices.length > 0 ? (
                <CheckSquare className="w-5 h-5 text-blue-600" />
              ) : (
                <Square className="w-5 h-5" />
              )}
              Select All
            </button>
            {selectedInvoices.size > 0 && (
              <span className="text-sm text-gray-500">
                {selectedInvoices.size} selected
              </span>
            )}
          </div>

          <div className="space-y-3">
            {displayedInvoices.map((invoice) => (
              <div 
                key={invoice.id} 
                className="border border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors flex items-center gap-4"
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleInvoiceSelection(invoice.quote_number || '');
                  }}
                  className="flex-shrink-0"
                >
                  {selectedInvoices.has(invoice.quote_number || '') ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                
                {/* Invoice Content */}
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => onSelectInvoice(invoice)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.customerName}</p>
                      <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                      <p className="text-xs text-gray-500">
                        {(() => {
                          // Database stores UTC timestamps, need to convert to local time
                          const utcDate = new Date(invoice.created_at || '');
                          // If the timestamp doesn't have timezone info, treat it as UTC
                          if (typeof invoice.created_at === 'string' && !invoice.created_at.includes('Z') && !invoice.created_at.includes('+')) {
                            // Parse as UTC by appending Z
                            const properUTC = new Date(invoice.created_at + 'Z');
                            return `${properUTC.toLocaleDateString('en-AU')} at ${properUTC.toLocaleTimeString('en-AU', {hour: '2-digit', minute:'2-digit'})} (${getRelativeTime(invoice.created_at || '')})`;
                          }
                          return `${utcDate.toLocaleDateString('en-AU')} at ${utcDate.toLocaleTimeString('en-AU', {hour: '2-digit', minute:'2-digit'})} (${getRelativeTime(invoice.created_at || '')})`;
                        })()}
                      </p>
                      {invoice.paymentMethod && invoice.paidAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Paid via {invoice.paymentMethod} on {new Date(invoice.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        ${parseFloat(invoice.total as any || 0).toFixed(2)}
                      </p>
                      <div className="flex items-center gap-2 justify-end mt-1">
                        <PaymentStatusBadge 
                          invoice={invoice}
                          showPayLink={true}
                          size="medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <BulkActionBar
        selectedCount={selectedInvoices.size}
        onDelete={() => setShowDeleteConfirm(true)}
        onClearSelection={() => setSelectedInvoices(new Set())}
      />

      <DeleteConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        isDeleting={isDeleting}
        itemCount={selectedInvoices.size}
      />
    </div>
  );
};

export default InvoiceList;
