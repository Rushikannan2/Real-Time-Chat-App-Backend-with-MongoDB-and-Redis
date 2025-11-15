import useChatStore from '../../store/chatStore';

const ChatHeader = ({ room }) => {
  const { onlineUsers, typingUsers } = useChatStore();

  if (!room) {
    return null;
  }

  const onlineParticipants = room.participants?.filter(p => 
    onlineUsers.has(p._id || p)
  ) || [];

  const roomTypingUsers = typingUsers[room._id] || new Set();
  const typingUsersList = Array.from(roomTypingUsers);

  const getTypingText = () => {
    if (typingUsersList.length === 0) return '';
    if (typingUsersList.length === 1) return 'Someone is typing...';
    if (typingUsersList.length === 2) return 'Two people are typing...';
    return 'Several people are typing...';
  };

  return (
    <div className="h-16 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-900/50">
      <div>
        <h2 className="text-lg font-semibold text-white">{room.name}</h2>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          {typingUsersList.length > 0 ? (
            <span className="text-blue-400 animate-pulse">{getTypingText()}</span>
          ) : (
            <>
              <span>{room.participants?.length || 0} members</span>
              {onlineParticipants.length > 0 && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>{onlineParticipants.length} online</span>
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Room Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 hover:bg-zinc-800 rounded-lg transition" title="Room info">
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
