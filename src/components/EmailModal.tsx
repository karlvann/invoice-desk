import React from 'react';
import { Mail, Send, X, Info } from 'lucide-react';

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientEmail: string;
  onRecipientEmailChange: (email: string) => void;
  message: string;
  onMessageChange: (message: string) => void;
  onSend: () => void;
  isSending: boolean;
}

const EmailModal: React.FC<EmailModalProps> = ({
  isOpen,
  onClose,
  recipientEmail,
  onRecipientEmailChange,
  message,
  onMessageChange,
  onSend,
  isSending
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E5E5FF] to-[#FFE5F5] p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Send Quote
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              disabled={isSending}
            >
              <X className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Email</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => onRecipientEmailChange(e.target.value)}
                placeholder="customer@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personal Message (Optional)</label>
              <textarea
                value={message}
                onChange={(e) => onMessageChange(e.target.value)}
                placeholder="Add a personal message to your quote..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#E5E5FF] focus:border-transparent transition-all resize-none"
              />
            </div>
            
            <div className="bg-[#E5FFE5] rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-900 mb-2">This email will include:</p>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Professional quote with all item details</li>
                    <li>• Direct payment link for easy checkout</li>
                    <li>• Your business contact information</li>
                    <li>• 30-day quote validity period</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 font-medium transition-colors"
              disabled={isSending}
            >
              Cancel
            </button>
            <button
              onClick={onSend}
              disabled={isSending || !recipientEmail}
              className="flex-1 bg-[#E5E5FF] text-gray-900 px-6 py-3 rounded-xl hover:bg-[#D5D5FF] disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2 transition-colors"
            >
              {isSending ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Quote
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
