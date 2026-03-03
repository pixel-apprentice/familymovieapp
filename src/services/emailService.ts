export const isEmailConfigured = () => true; // Handled on backend

export async function sendRequestEmail(type: 'movie' | 'pizza', details: string, subject?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, details, subject }),
    });

    if (response.ok) {
      console.log('[Email Service] Email sent successfully!');
      return true;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('[Email Service] Failed to send email:', errorData);
      alert(`EmailJS Error: ${errorData.error || 'Unknown error'}`);
      return false;
    }
  } catch (error: any) {
    console.error('[Email Service] Error sending email:', error);
    alert(`EmailJS Exception: ${error?.message || 'Check console for details'}`);
    return false;
  }
}
