import { useState, useRef, useCallback } from 'react';
import useSocket from '../../hooks/useSocket';

const MessageInput = ({ roomId }) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef(null);
  const { sendMessage, sendTyping } = useSocket();

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!roomId) return;

    // Send typing indicator
    sendTyping(roomId, true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing after 2 seconds
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(roomId, false);
    }, 2000);
  }, [roomId, sendTyping]);

  const handleChange = (e) => {
    setMessage(e.target.value);
    handleTyping();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !roomId || isSending) {
      return;
    }

    const messageToSend = message.trim();
    console.log('[MessageInput] Sending message:', messageToSend);

    setIsSending(true);
    setMessage(''); // Clear input immediately for better UX

    try {
      await sendMessage(roomId, messageToSend);
      console.log('[MessageInput] Message sent successfully');
      
      // Stop typing indicator
      sendTyping(roomId, false);
      
      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    } catch (error) {
      console.error('[MessageInput] Failed to send message:', error);
      // Restore message on error
      setMessage(messageToSend);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-zinc-800 p-4 bg-zinc-900/50">
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        {/* Text Input */}
        <div className="flex-1">
          <textarea
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows={1}
            disabled={isSending}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Send Button */}
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </form>

      {/* Tips */}
      <p className="text-xs text-zinc-600 mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  );
};

export default MessageInput;
