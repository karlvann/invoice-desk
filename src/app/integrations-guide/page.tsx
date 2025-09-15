'use client';

import { useState } from 'react';
import { ChefHat, Webhook, Mail, FileSpreadsheet, Zap, ShoppingCart, Users, AlertCircle, CheckCircle, Info, Database } from 'lucide-react';

export default function IntegrationsGuide() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const integrations = [
    {
      id: 'stripe',
      name: 'Stripe Payment Processing',
      icon: '💳',
      chefAnalogy: 'Your Payment Sous Chef',
      description: 'Like a trusted sous chef who handles all the money at the register while you cook',
      howItWorks: [
        'Customer pays on checkout page (like ordering at the counter)',
        'Stripe processes the card (counts the money, checks it&apos;s real)',
        'Sends a "ticket" to our kitchen (webhook to payment-app)',
        'Payment-app passes the order to invoice-app (like kitchen printer)',
        'Invoice gets created and emailed automatically'
      ],
      whenUsed: 'Every time a customer pays online',
      troubleshooting: [
        'If payment fails: Check Stripe Dashboard like checking the till',
        'If no invoice created: Check webhook logs (the kitchen printer tape)',
        'Manual recovery: Use Stripe Dashboard to resend events'
      ],
      envVars: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'API_SECRET_KEY'],
      status: 'critical'
    },
    {
      id: 'email',
      name: 'Email System (Nodemailer + Gmail)',
      icon: '📧',
      chefAnalogy: 'Your Front of House Manager',
      description: 'Like the person who talks to customers, takes reservations, and sends thank you notes',
      howItWorks: [
        'Invoice created triggers email (like order ready bell)',
        'Nodemailer connects to Gmail (picks up the phone)',
        'Sends professional HTML email (delivers the message)',
        'Customer gets quote/invoice link (like a reservation confirmation)'
      ],
      whenUsed: 'After every quote creation or payment',
      troubleshooting: [
        'Email not sending: Check Gmail app password (like phone line is down)',
        'Wrong recipient: Verify customer email in database',
        'Formatting issues: Check HTML template in emailTemplates.ts'
      ],
      envVars: ['GMAIL_USER', 'GMAIL_APP_PASSWORD'],
      status: 'critical'
    },
    {
      id: 'sheets',
      name: 'Google Sheets Sync',
      icon: '📊',
      chefAnalogy: 'Your Recipe Book & Inventory List',
      description: 'Like keeping a handwritten log of all orders in a big ledger book for backup',
      howItWorks: [
        'Manual sync button triggers update (like end-of-day reconciliation)',
        'Reads all invoices from database (gathering all order tickets)',
        'Writes to Google Sheets row by row (copying to ledger)',
        'Useful for accounting and backup (like keeping paper records)'
      ],
      whenUsed: 'Manual trigger only - when you want to update spreadsheet',
      troubleshooting: [
        'Auth fails: Check service account JSON (like losing your ledger key)',
        'Sheet not found: Verify GOOGLE_SHEETS_ID',
        'Columns mismatch: Check sheet structure matches expected format'
      ],
      envVars: ['GOOGLE_SHEETS_ID', 'GOOGLE_SHEETS_CREDENTIALS'],
      status: 'optional'
    },
    {
      id: 'activecampaign',
      name: 'ActiveCampaign CRM',
      icon: '👥',
      chefAnalogy: 'Your Customer Loyalty Program',
      description: 'Like keeping track of regular customers, their preferences, and sending them special offers',
      howItWorks: [
        'Customer makes purchase (joins the loyalty program)',
        'Details sent to ActiveCampaign (added to customer book)',
        'Can trigger email campaigns (like birthday discounts)',
        'Tracks customer lifetime value (how much they&apos;ve spent)'
      ],
      whenUsed: 'After successful payments (optional)',
      troubleshooting: [
        'Contact not created: Check API key (like membership card reader broken)',
        'Wrong list: Verify list ID in ActiveCampaign',
        'Duplicate contacts: Check email merge settings'
      ],
      envVars: ['ACTIVECAMPAIGN_URL', 'ACTIVECAMPAIGN_API_KEY'],
      status: 'optional'
    },
    {
      id: 'zapier',
      name: 'Zapier Webhook',
      icon: '⚡',
      chefAnalogy: 'Your Kitchen Runner',
      description: 'Like having a runner who takes orders to different stations - connects to 5000+ other apps',
      howItWorks: [
        'Invoice created/paid triggers webhook (order ready)',
        'Zapier receives the data (runner picks up ticket)',
        'Can trigger any automation (deliver to any station):',
        '- Add to accounting software',
        '- Create calendar event for delivery',
        '- Post to Slack channel',
        '- Whatever you configure in Zapier'
      ],
      whenUsed: 'Configurable - whatever you set up in Zapier',
      troubleshooting: [
        'Webhook not firing: Check Zapier webhook URL',
        'Data missing: Verify payload structure matches Zap',
        'Test mode: Use Zapier&apos;s test feature to debug'
      ],
      envVars: ['ZAPIER_WEBHOOK_URL'],
      status: 'optional'
    },
    {
      id: 'woocommerce',
      name: 'WooCommerce Sync',
      icon: '🛒',
      chefAnalogy: 'Your Sister Restaurant',
      description: 'Like having another restaurant location that needs to know about orders from the main kitchen',
      howItWorks: [
        'Order comes from WooCommerce (sister restaurant order)',
        'Endpoint receives order data (fax from other location)',
        'Creates invoice in our system (adds to our order list)',
        'Keeps both systems in sync (both kitchens know the order)'
      ],
      whenUsed: 'When orders come from WooCommerce shop',
      troubleshooting: [
        'Orders not syncing: Check WooCommerce webhook settings',
        'Authentication fails: Verify shared API key',
        'Duplicate orders: Check idempotency handling'
      ],
      envVars: ['WOOCOMMERCE_WEBHOOK_SECRET'],
      status: 'optional'
    }
  ];

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'optional': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'critical': return 'Critical - Must Work';
      case 'optional': return 'Optional - Nice to Have';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
          <div className="flex items-center gap-4 mb-6">
            <ChefHat className="w-10 h-10 text-orange-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Karl&apos;s Integration Kitchen
              </h1>
              <p className="text-gray-600 mt-1">
                Understanding Your Digital Kitchen Equipment - A Chef&apos;s Guide to App Integrations
              </p>
            </div>
          </div>
          
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="text-sm text-gray-700">
                  <strong>Hey Karl!</strong> Think of these integrations like your kitchen equipment. 
                  Some are critical (like your stove - can&apos;t cook without it), others are nice-to-have 
                  (like that fancy mandoline slicer). Each integration is a specialized tool that helps 
                  your business run smoothly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integration Cards */}
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === integration.id ? null : integration.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{integration.icon}</span>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                    <p className="text-sm text-gray-600">{integration.chefAnalogy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(integration.status)}`}>
                    {getStatusLabel(integration.status)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      expandedSection === integration.id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedSection === integration.id && (
                <div className="px-6 pb-6 border-t">
                  <div className="mt-4 space-y-4">
                    {/* Description */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{integration.description}</p>
                    </div>

                    {/* How It Works */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <span className="text-lg">🔧</span> How It Works (Kitchen Process)
                      </h4>
                      <ol className="space-y-2">
                        {integration.howItWorks.map((step, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 bg-orange-100 text-orange-700 rounded-full flex items-center justify-center text-sm font-medium">
                              {index + 1}
                            </span>
                            <span className="text-gray-700 text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* When Used */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <span className="text-lg">⏰</span> When It&apos;s Used
                      </h4>
                      <p className="text-gray-700 text-sm">{integration.whenUsed}</p>
                    </div>

                    {/* Troubleshooting */}
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        If Something Goes Wrong (Equipment Failure)
                      </h4>
                      <ul className="space-y-1">
                        {integration.troubleshooting.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-yellow-600 mt-1">•</span>
                            <span className="text-gray-700 text-sm">{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Environment Variables */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Configuration Keys (Your Recipe Secrets)
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {integration.envVars.map((envVar) => (
                          <code key={envVar} className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs">
                            {envVar}
                          </code>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Quick Reference */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <span className="text-3xl">📋</span>
            Quick Reference - Your Kitchen Prep List
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Daily Operations (Your Mise en Place)
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>✅ Stripe processes payments automatically</li>
                <li>✅ Emails send to customers automatically</li>
                <li>✅ Invoices create automatically after payment</li>
                <li>✅ Database stores everything locally</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-blue-600" />
                Manual Tasks (Your Special Prep)
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>🔄 Sync to Google Sheets (when needed)</li>
                <li>📧 Send follow-up emails (optional)</li>
                <li>🔗 Configure Zapier automations</li>
                <li>📊 Check ActiveCampaign campaigns</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>Chef&apos;s Tip:</strong> Start with the critical integrations (Stripe & Email). 
              Once those are running smoothly, add the optional ones as needed. It&apos;s like learning 
              to make a perfect omelette before attempting a soufflé!
            </p>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            Remember Karl: These integrations are your digital kitchen tools. Keep the critical ones 
            sharp and working, and the optional ones are there when you need to scale up service!
          </p>
          <p className="mt-2">
            Need help? Check the <code className="px-2 py-1 bg-gray-200 rounded">.env.example</code> file 
            for all configuration options.
          </p>
        </div>
      </div>
    </div>
  );
}