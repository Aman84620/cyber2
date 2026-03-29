import emailjs from '@emailjs/browser';

/**
 * EMAIL FRAUD REPORT SERVICE
 * -----------------------------------------------------
 * INSTRUCTIONS:
 * 1. Create a free account at https://www.emailjs.com/
 * 2. Add: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID, VITE_EMAILJS_PUBLIC_KEY to your .env
 * -----------------------------------------------------
 */

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "";
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "";
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "";

export const sendComplaintForm = async (formData) => {
  console.log("[SYS] Preparing to transmit fraud report via EmailJS...", formData);

  if (!SERVICE_ID || !PUBLIC_KEY) {
    console.warn("EMAILJS KEYS MISSING: Falling back to local logging.");
    return { success: true, ref_id: `MOCK-${Math.floor(Math.random() * 10000)}` };
  }

  try {
    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      from_name: formData.name,
      from_email: formData.email,
      message_content: formData.details,
      case_id: formData.caseId || "N/A"
    }, PUBLIC_KEY);

    return { success: true, ref_id: response.text };
  } catch (error) {
    console.error("EmailJS Error:", error);
    return { success: false, error: error.message };
  }
};
