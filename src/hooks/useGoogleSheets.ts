import { useState } from 'react';
import { Invoice } from '../types/invoice';

export const useGoogleSheets = () => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');

  const syncSingleInvoice = async (invoice: Invoice) => {
    setSyncStatus('syncing');
    
    try {
      const syncResponse = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync-single',
          invoice
        }),
      });
      
      const syncResult = await syncResponse.json();
      setSyncStatus(syncResult.success ? 'success' : 'error');
      
      return syncResult;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  const syncAllInvoices = async (invoices: Invoice[]) => {
    setSyncStatus('syncing');
    
    try {
      const syncResponse = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync-all',
          invoices
        }),
      });
      
      const result = await syncResponse.json();
      setSyncStatus(result.success ? 'success' : 'error');
      
      return result;
    } catch (error) {
      setSyncStatus('error');
      throw error;
    }
  };

  return {
    syncStatus,
    syncSingleInvoice,
    syncAllInvoices
  };
};
