import React, { useState } from 'react';
import { SearchPanel } from '../components/SearchPanel';
import { MovieList } from '../components/MovieList';
import { sendRequestEmail } from '../services/emailService';
import { useModal } from '../contexts/ModalContext';

export function HomePage() {
  const { showModal } = useModal();
  const [isSending, setIsSending] = useState(false);

  const handlePizzaRequest = async () => {
    const details = await showModal({
      type: 'prompt',
      title: 'Pizza Request 🍕',
      message: 'What kind of pizza are we feeling for movie night?',
      confirmText: 'Send Request',
      cancelText: 'Cancel',
      placeholder: 'e.g., Pepperoni, Cheese, Hawaiian...'
    });

    if (!details) return;

    setIsSending(true);
    const success = await sendRequestEmail('pizza', details);
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
    <>
      <SearchPanel />
      <MovieList />

      <button
        onClick={handlePizzaRequest}
        disabled={isSending}
        className="fixed bottom-6 right-6 w-14 h-14 bg-amber-500 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 hover:bg-amber-600 transition-all z-50 group disabled:opacity-50 disabled:hover:scale-100"
        title="Request Pizza for Movie Night"
      >
        <span className="text-2xl group-hover:animate-bounce">🍕</span>
      </button>
    </>
  );
}
