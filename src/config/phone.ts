/**
 * Phone number configuration for WhatsApp integration
 * Customize these values for your country/region
 */

export const phoneConfig = {
  // Default country code (Argentina)
  defaultCountryCode: "54",
  
  // Country code with WhatsApp prefix (9 for mobile in Argentina)
  whatsappCountryCode: "549",
  
  // Area codes that need special handling
  areaCodes: {
    buenosAires: "11",
  },
  
  // Mobile prefixes (Argentina uses 15 for mobile numbers)
  mobilePrefixes: ["15"],
  
  // Maximum length for local numbers (without country code)
  maxLocalLength: 10,
} as const

/**
 * Clean and format phone number for WhatsApp
 * Handles Argentina-specific formatting rules
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Remove everything except digits
  let cleaned = phone.replace(/\D/g, "")

  // If starts with mobile prefix (15), add country code
  if (phoneConfig.mobilePrefixes.some(prefix => cleaned.startsWith(prefix))) {
    cleaned = phoneConfig.whatsappCountryCode + cleaned.substring(2)
  }
  // If starts with Buenos Aires area code (11), add country code
  else if (cleaned.startsWith(phoneConfig.areaCodes.buenosAires) && cleaned.length === phoneConfig.maxLocalLength) {
    cleaned = phoneConfig.whatsappCountryCode + cleaned
  }
  // If doesn't start with country code, assume local number
  else if (!cleaned.startsWith(phoneConfig.defaultCountryCode) && cleaned.length <= phoneConfig.maxLocalLength) {
    cleaned = phoneConfig.whatsappCountryCode + cleaned
  }

  return cleaned
}
