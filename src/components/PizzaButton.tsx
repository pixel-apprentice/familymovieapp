import React, { useState } from 'react';
import { sendRequestEmail } from '../services/emailService';
import { useModal } from '../contexts/ModalContext';
import { hapticFeedback } from '../utils/haptics';
import { motion } from 'motion/react';

export function PizzaButton() {
  const { showModal } = useModal();
  const [isSending, setIsSending] = useState(false);

  const handlePizzaRequest = async () => {
    const details = await showModal({
      type: 'prompt',
      title: 'Pizza Request 🍕',
      message: 'What kind of pizza are we feeling for movie night?',
      confirmText: 'Send Request',
      cancelText: 'Cancel',
      placeholder: 'Thick, thin, personal sized.. etc'
    });

    if (!details) return;

    setIsSending(true);
    const success = await sendRequestEmail(
      'pizza', 
      details,
      'Pizza request from Family Movie App'
    );
    setIsSending(false);

    if (success) {
      showModal({
        type: 'alert',
        title: 'Request Sent!',
        message: 'Dad has been notified about the pizza request. 🍕',
        confirmText: 'Awesome'
      });
    } else {
      showModal({
        type: 'alert',
        title: 'Oops',
        message: 'Failed to send the request. Maybe tell him in person?',
        confirmText: 'Okay'
      });
    }
  };

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => { hapticFeedback.light(); handlePizzaRequest(); }}
      disabled={isSending}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-theme-muted hover:text-amber-500 hover:bg-amber-500/10 disabled:opacity-50`}
      title="Request Pizza"
    >
      <span className="text-sm">🍕</span>
      <span className="hidden sm:inline">Pizza</span>
    </motion.button>
  );
}
