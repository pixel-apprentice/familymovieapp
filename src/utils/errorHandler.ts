import { toast } from 'sonner';
import { logger } from './logger';

export const handleError = async (error: any, contextMessage: string) => {
  // Use our enhanced logger which handles persistence and detail extraction
  logger.error(contextMessage, error);
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  toast.error(`${contextMessage}: ${errorMessage}`);
};
