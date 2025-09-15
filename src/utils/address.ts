// Utility functions for address parsing

export const extractSuburb = (address: string): string => {
  if (!address) return '';
  
  // Common Australian address format: Street, Suburb STATE Postcode
  // Example: "123 Main St, Marrickville NSW 2204"
  
  const lines = address.split('\n');
  const lastLine = lines[lines.length - 1].trim();
  
  // Try to match suburb from common patterns
  // Pattern 1: "Suburb STATE Postcode"
  const pattern1 = /^([^,]+),?\s+([A-Z]{2,3})\s+\d{4}$/;
  const match1 = lastLine.match(pattern1);
  if (match1) {
    return match1[1].trim();
  }
  
  // Pattern 2: If address has comma, take the part after first comma and before state
  const parts = address.split(',');
  if (parts.length >= 2) {
    const afterComma = parts[1].trim();
    // Remove state and postcode if present
    const suburbMatch = afterComma.match(/^([^A-Z]+)(?:\s+[A-Z]{2,3}\s+\d{4})?/);
    if (suburbMatch) {
      return suburbMatch[1].trim();
    }
  }
  
  // Pattern 3: Multi-line address - suburb is usually on second line
  if (lines.length >= 2) {
    const secondLine = lines[1].trim();
    const match = secondLine.match(/^([^,]+?)(?:\s+[A-Z]{2,3}\s+\d{4})?$/);
    if (match) {
      return match[1].trim();
    }
  }
  
  // Fallback: return the last line without state/postcode
  const fallbackMatch = lastLine.match(/^(.+?)\s+[A-Z]{2,3}\s+\d{4}$/);
  if (fallbackMatch) {
    return fallbackMatch[1].trim();
  }
  
  return lastLine; // Return whatever we have as last resort
};

// Extract first name from full name
export const extractFirstName = (fullName: string): string => {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  return parts[0] || '';
};
