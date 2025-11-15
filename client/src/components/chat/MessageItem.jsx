import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';

const MessageItem = ({ message }) => {
  const currentUser = useAuthStore((state) => state.user);
  const currentUserId = currentUser?.id || currentUser?._id;
  const messageSenderId = message.sender?._id || message.sender?.id;
  const isOwnMessage = messageSenderId === currentUserId;

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (error) {
      console.error('[MessageItem] Error formatting time:', error);
      return '';
    }
  };

  return (
    <div className={`flex items-start gap-3 mb-4 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
        isOwnMessage ? 'bg-blue-600 text-white' : 'bg-zinc-700 text-zinc-300'
      }`}>
        {getInitials(message.sender?.name)}
      </div>

      {/* Message Content */}
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Sender Name */}
        {!isOwnMessage && (
          <span className="text-xs text-zinc-400 mb-1 px-1">
            {message.sender?.name || 'Unknown'}
          </span>
        )}

        {/* Message Bubble */}
        <div className={`rounded-2xl px-4 py-2 ${
          isOwnMessage
            ? 'bg-blue-600 text-white rounded-tr-sm'
            : 'bg-zinc-800 text-zinc-100 rounded-tl-sm'
        }`}>
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {message.attachments.map((attachment, idx) => (
                <a
                  key={idx}
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs underline opacity-80 hover:opacity-100"
                >
                  📎 {attachment.url}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp and Status */}
        <div className={`flex items-center gap-2 mt-1 px-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
          <span className="text-xs text-zinc-500">
            {formatTime(message.createdAt)}
          </span>
          
          {isOwnMessage && (
            <span className="text-xs text-zinc-500">
              {message.deliveredTo && message.deliveredTo.length > 0 ? (
                <span title="Delivered">✓✓</span>
              ) : (
                <span title="Sent">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageItem;
