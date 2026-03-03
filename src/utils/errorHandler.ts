import { toast } from 'sonner';

export const handleError = async (error: any, contextMessage: string) => {
  console.error(`${contextMessage}:`, error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  const fullLog = `${contextMessage}\nTime: ${new Date().toISOString()}\nError: ${errorMessage}\nStack: ${error instanceof Error ? error.stack : 'N/A'}`;
  
  try {
    await navigator.clipboard.writeText(fullLog);
    toast.error(`${contextMessage}: ${errorMessage}. Error log copied to clipboard.`);
  } catch (clipboardError) {
    console.error('Failed to copy error to clipboard:', clipboardError);
    toast.error(`${contextMessage}: ${errorMessage}.`);
  }
};
