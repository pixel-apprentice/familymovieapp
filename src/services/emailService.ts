import emailjs from '@emailjs/browser';

// These IDs should be replaced with your actual EmailJS service/template/user IDs
// You can get these from https://dashboard.emailjs.com/admin
const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const isEmailConfigured = () => !!(SERVICE_ID && TEMPLATE_ID && PUBLIC_KEY);

export async function sendRequestEmail(type: 'movie' | 'pizza', details: string, subject?: string): Promise<boolean> {
  try {
    if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) {
      console.error('[Email Service] Missing EmailJS environment variables:', {
        SERVICE_ID: !!SERVICE_ID,
        TEMPLATE_ID: !!TEMPLATE_ID,
        PUBLIC_KEY: !!PUBLIC_KEY
      });
      return false;
    }

    // We don't need to expose the destination email here.
    // The destination is configured in the EmailJS template dashboard.
    // This keeps your personal email private in the client-side code.
    
    const templateParams = {
      subject: subject || `New ${type} request`,
      message: details,
      type: type,
    };

    const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);

    if (response.status === 200) {
      console.log('[Email Service] Email sent successfully!');
      return true;
    } else {
      console.error('[Email Service] Failed to send email:', response);
      return false;
    }
  } catch (error) {
    console.error('[Email Service] Error sending email:', error);
    return false;
  }
}
