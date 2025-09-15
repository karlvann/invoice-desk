// CRITICAL: THIS FILE IS ESSENTIAL FOR KARL TO UNDERSTAND THE SYSTEM
// DO NOT DELETE - Karl needs this visual map to debug connection issues
// This shows how all three apps connect and provides live health monitoring

'use client';

import { useEffect } from 'react';

export default function ConnectionsPage() {
  useEffect(() => {
    // Check health immediately and then every 30 seconds
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    const apps = [
      {
        id: 'astro',
        url: 'http://localhost:4321/api/health',
        name: 'Astro Frontend'
      },
      {
        id: 'payment',
        url: 'https://make-payments.vercel.app/api/health',
        name: 'Payment Server'
      },
      {
        id: 'invoice',
        url: 'http://localhost:3006/api/health',
        name: 'Invoice App'
      }
    ];
    
    let hasErrors = false;
    
    for (const app of apps) {
      const statusEl = document.getElementById(app.id + '-status');
      const boxEl = document.getElementById(app.id);
      
      if (!statusEl || !boxEl) continue;
      
      try {
        const response = await fetch(app.url, {
          method: 'GET',
          mode: 'no-cors'
        });
        
        statusEl.className = 'status-indicator healthy';
        boxEl.classList.remove('error');
        boxEl.classList.add('healthy');
      } catch (error) {
        console.error(`${app.name} health check failed:`, error);
        statusEl.className = 'status-indicator error';
        boxEl.classList.remove('healthy');
        boxEl.classList.add('error');
        hasErrors = true;
        
        localStorage.setItem('connection_error', 'true');
        localStorage.setItem('failed_service', app.name);
      }
    }
    
    if (!hasErrors) {
      localStorage.removeItem('connection_error');
      localStorage.removeItem('failed_service');
    }
    
    const now = new Date().toLocaleTimeString();
    const lastCheckEl = document.getElementById('last-check');
    if (lastCheckEl) {
      lastCheckEl.textContent = `Last health check: ${now}`;
    }
  };

  const toggleDetails = (appId: string) => {
    const details = document.getElementById(appId + '-details');
    if (details) {
      details.classList.toggle('show');
    }
  };

  return (
    <>
      <style jsx global>{`
        /* KARL'S VISUAL CONNECTION MAP - DO NOT REMOVE */
        .connections-page {
          font-family: monospace;
          background: #1a1a1a;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          min-height: 100vh;
        }
        
        .connections-page h1 {
          margin-bottom: 30px;
          color: #4ade80;
        }
        
        .connection-map {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 800px;
          width: 100%;
        }
        
        .app-box {
          background: #2a2a2a;
          border: 3px solid #444;
          border-radius: 10px;
          padding: 20px;
          position: relative;
          transition: all 0.3s;
          cursor: pointer;
        }
        
        .app-box.current {
          border-color: #4ade80;
          box-shadow: 0 0 20px #4ade80;
          background: #1e3a1e;
        }
        
        .app-box.healthy {
          border-left: 5px solid #4ade80;
        }
        
        .app-box.error {
          border-left: 5px solid #ef4444;
          animation: pulse 1s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        
        .app-title {
          font-size: 1.5em;
          font-weight: bold;
          margin-bottom: 10px;
        }
        
        .status-indicator {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          margin-left: 10px;
        }
        
        .status-indicator.healthy {
          background: #4ade80;
        }
        
        .status-indicator.error {
          background: #ef4444;
          animation: blink 0.5s infinite;
        }
        
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .app-details {
          margin-top: 10px;
          font-size: 0.9em;
          color: #aaa;
        }
        
        .connection-details {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: #1a1a1a;
          border-radius: 5px;
          border: 1px solid #444;
        }
        
        .connection-details.show {
          display: block;
        }
        
        .detail-item {
          margin: 5px 0;
          display: flex;
          align-items: center;
        }
        
        .detail-label {
          color: #4ade80;
          margin-right: 10px;
          min-width: 100px;
        }
        
        .detail-value {
          color: #fff;
          font-family: 'Courier New', monospace;
          background: #333;
          padding: 2px 8px;
          border-radius: 3px;
        }
        
        .arrow {
          text-align: center;
          font-size: 2em;
          color: #4ade80;
          margin: -10px 0;
        }
        
        .current-label {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #4ade80;
          color: #000;
          padding: 5px 10px;
          border-radius: 5px;
          font-weight: bold;
          font-size: 0.8em;
        }
        
        .last-check {
          margin-top: 30px;
          color: #666;
          text-align: center;
        }
        
        .legend {
          margin-top: 30px;
          padding: 20px;
          background: #2a2a2a;
          border-radius: 10px;
          display: flex;
          gap: 30px;
          justify-content: center;
        }
        
        .legend-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>
      
      <div className="connections-page">
        <h1>🗺️ System Connection Map</h1>
        
        <div className="connection-map">
          {/* CUSTOMER */}
          <div className="app-box" id="customer">
            <div className="app-title">👤 CUSTOMER BROWSER</div>
            <div className="app-details">Where customers place orders</div>
          </div>
          
          <div className="arrow">↓</div>
          
          {/* ASTRO FRONTEND */}
          <div className="app-box" id="astro" onClick={() => toggleDetails('astro')}>
            <div className="app-title">
              🛍️ ASTRO FRONTEND
              <span className="status-indicator healthy" id="astro-status"></span>
            </div>
            <div className="app-details">Port: 4321 | The main website</div>
            <div className="connection-details" id="astro-details">
              <div className="detail-item">
                <span className="detail-label">URL:</span>
                <span className="detail-value">http://localhost:4321</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Sends to:</span>
                <span className="detail-value">POST /api/create-payment</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Health Check:</span>
                <span className="detail-value">/api/health</span>
              </div>
            </div>
          </div>
          
          <div className="arrow">↓</div>
          
          {/* PAYMENT SERVER */}
          <div className="app-box" id="payment" onClick={() => toggleDetails('payment')}>
            <div className="app-title">
              💳 PAYMENT SERVER
              <span className="status-indicator healthy" id="payment-status"></span>
            </div>
            <div className="app-details">Vercel | Handles Stripe payments</div>
            <div className="connection-details" id="payment-details">
              <div className="detail-item">
                <span className="detail-label">URL:</span>
                <span className="detail-value">https://make-payments.vercel.app</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">API Key:</span>
                <span className="detail-value">ausbeds_WIOLQS...gTGgA</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Webhook to:</span>
                <span className="detail-value">invoice-app/api/create-paid-invoice</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stripe Key:</span>
                <span className="detail-value">pk_live_51Q...</span>
              </div>
            </div>
          </div>
          
          <div className="arrow">↓</div>
          
          {/* INVOICE APP - THIS ONE IS HIGHLIGHTED */}
          <div className="app-box current" id="invoice" onClick={() => toggleDetails('invoice')}>
            <div className="current-label">YOU ARE HERE</div>
            <div className="app-title">
              📧 INVOICE APP
              <span className="status-indicator healthy" id="invoice-status"></span>
            </div>
            <div className="app-details">Port: 3006 | Sends invoices & emails</div>
            <div className="connection-details" id="invoice-details">
              <div className="detail-item">
                <span className="detail-label">URL:</span>
                <span className="detail-value">http://localhost:3006</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Receives:</span>
                <span className="detail-value">Stripe webhooks</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email API:</span>
                <span className="detail-value">Resend API</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Health Check:</span>
                <span className="detail-value">/api/health</span>
              </div>
            </div>
          </div>
          
          <div className="arrow">↓</div>
          
          {/* CUSTOMER EMAIL */}
          <div className="app-box" id="email">
            <div className="app-title">📬 CUSTOMER EMAIL</div>
            <div className="app-details">Final invoice delivered</div>
          </div>
        </div>
        
        <div className="last-check" id="last-check">Last health check: Never</div>
        
        <div className="legend">
          <div className="legend-item">
            <span className="status-indicator healthy"></span>
            <span>Connected & Working</span>
          </div>
          <div className="legend-item">
            <span className="status-indicator error"></span>
            <span>Connection Error</span>
          </div>
        </div>
      </div>
    </>
  );
}