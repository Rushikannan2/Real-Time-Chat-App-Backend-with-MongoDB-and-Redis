import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useChatStore from '../../store/chatStore';
import { getRoomParticipants } from '../../services/api';

const ChatHeader = ({ room }) => {
  const { onlineUsers, typingUsers } = useChatStore();
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isLoadingParticipants, setIsLoadingParticipants] = useState(false);

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

  const handleShowParticipants = async () => {
    if (!room._id) return;
    
    setShowParticipants(true);
    setIsLoadingParticipants(true);
    
    try {
      console.log('[ChatHeader] Fetching participants for room:', room._id);
      const response = await getRoomParticipants(room._id);
      console.log('[ChatHeader] Participants:', response.participants);
      setParticipants(response.participants || []);
    } catch (error) {
      console.error('[ChatHeader] Failed to fetch participants:', error);
      alert('Failed to load participants');
      setShowParticipants(false);
    } finally {
      setIsLoadingParticipants(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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
        <button 
          onClick={handleShowParticipants}
          className="p-2 hover:bg-zinc-800 rounded-lg transition" 
          title="View participants"
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </button>
      </div>

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowParticipants(false)}>
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Room Participants
              </h3>
              <button
                onClick={() => setShowParticipants(false)}
                className="p-1 hover:bg-zinc-800 rounded-lg transition"
              >
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-80px)]">
              {isLoadingParticipants ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-3"></div>
                  <p className="text-sm text-zinc-500">Loading participants...</p>
                </div>
              ) : participants.length === 0 ? (
                <p className="text-center text-zinc-500 py-8">No participants found</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-zinc-500 mb-3">
                    {participants.length} member{participants.length !== 1 ? 's' : ''} in this room
                  </p>
                  {participants.map((participant) => {
                    const isOnline = onlineUsers.has(participant._id);
                    return (
                      <div
                        key={participant._id}
                        className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition"
                      >
                        {/* Avatar */}
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {getInitials(participant.name)}
                          </div>
                          {/* Online indicator */}
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-zinc-900"></div>
                          )}
                        </div>

                        {/* User info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {participant.name}
                          </p>
                          <p className="text-xs text-zinc-500 truncate">
                            {participant.email}
                          </p>
                        </div>

                        {/* Status badge */}
                        <div className="flex-shrink-0">
                          {isOnline ? (
                            <span className="text-xs text-green-500 font-medium">Online</span>
                          ) : (
                            <span className="text-xs text-zinc-600">Offline</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatHeader;
