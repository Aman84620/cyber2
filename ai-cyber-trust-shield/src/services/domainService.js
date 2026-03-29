/**
 * DOMAIN VERIFICATION SERVICE (Tactical Registry Scan)
 * -----------------------------------------------------
 * INSTRUCTIONS:
 * 1. Get a Free Key from https://whois.whoisxmlapi.com/
 * 2. Add: VITE_WHOIS_API_KEY to your .env
 * -----------------------------------------------------
 */

const API_KEY = import.meta.env.VITE_WHOIS_API_KEY || "";

export const verifyDomain = async (domain) => {
  console.log(`[SYS] Scanning registry for domain: ${domain}...`);

  if (!API_KEY) {
    console.warn("WHOIS API KEY MISSING: Falling back to local data.");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isVerified: domain !== 'unknown.com',
          registrationDate: "2023-01-01",
          ownerInfo: "Hidden for privacy"
        });
      }, 1500);
    });
  }

  try {
    const response = await fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${API_KEY}&domainName=${domain}&outputFormat=JSON`);
    const data = await response.json();
    
    return {
      isVerified: !!data.WhoisRecord,
      registrationDate: data.WhoisRecord?.createdDate || "N/A",
      ownerInfo: data.WhoisRecord?.registrant?.organization || "Redacted / Proxy",
      raw: data
    };
  } catch (error) {
    console.error("Whois API Error:", error);
    return { isVerified: false, error: "API Failure" };
  }
};
