import React from 'react';
import InvoiceList from './InvoiceList';
import { Invoice } from '../../types/invoice';

interface PaidInvoicesViewProps {
  invoices: Invoice[];
  onCreateNewInvoice: () => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoices: (quoteNumbers: string[]) => Promise<any>;
  onSyncToSheets: () => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  loading?: boolean;
}

const PaidInvoicesView: React.FC<PaidInvoicesViewProps> = ({
  invoices,
  onCreateNewInvoice,
  onSelectInvoice,
  onDeleteInvoices,
  onSyncToSheets,
  syncStatus,
  showToast,
  loading = false
}) => {
  return (
    <div className="space-y-6">
      {/* Content Area */}
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-12">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading invoices...</p>
          </div>
        </div>
      ) : (
        <InvoiceList
          invoices={invoices}
          title="Paid Invoices"
          filterPaid={true}
          onCreateNewInvoice={onCreateNewInvoice}
          onSelectInvoice={onSelectInvoice}
          onDeleteInvoices={onDeleteInvoices}
          onSyncToSheets={onSyncToSheets}
          syncStatus={syncStatus}
          showToast={showToast}
        />
      )}
    </div>
  );
};

export default PaidInvoicesView;