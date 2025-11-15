import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';
import useSocket from '../hooks/useSocket';
import Sidebar from '../components/chat/Sidebar';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';

const Chat = () => {
  const user = useAuthStore((state) => state.user);
  const { 
    rooms, 
    currentRoom, 
    messages, 
    fetchRooms, 
    fetchMessages,
    setCurrentRoom,
    isLoadingRooms,
    isLoadingMessages 
  } = useChatStore();
  
  const { isConnected, joinRoom, leaveRoom } = useSocket();
  const [previousRoomId, setPreviousRoomId] = useState(null);

  // Fetch rooms on mount
  useEffect(() => {
    console.log('[Chat] Component mounted, fetching rooms');
    fetchRooms().catch(err => {
      console.error('[Chat] Failed to fetch rooms:', err);
    });
  }, [fetchRooms]);

  // Handle room selection
  const handleSelectRoom = async (room) => {
    console.log('[Chat] Selecting room:', room._id);
    
    // Leave previous room
    if (previousRoomId && previousRoomId !== room._id) {
      console.log('[Chat] Leaving previous room:', previousRoomId);
      leaveRoom(previousRoomId);
    }

    // Set current room
    setCurrentRoom(room);
    setPreviousRoomId(room._id);

    // Join the room via Socket.IO
    if (isConnected) {
      console.log('[Chat] Joining room via socket:', room._id);
      joinRoom(room._id);
    }

    // Fetch messages for this room
    try {
      await fetchMessages(room._id);
    } catch (error) {
      console.error('[Chat] Failed to fetch messages:', error);
    }
  };

  // Join current room when socket connects
  useEffect(() => {
    if (isConnected && currentRoom) {
      console.log('[Chat] Socket connected, joining current room:', currentRoom._id);
      joinRoom(currentRoom._id);
    }
  }, [isConnected, currentRoom, joinRoom]);

  // Get messages for current room
  const currentMessages = currentRoom ? messages[currentRoom._id] || [] : [];
  
  console.log('[Chat] Render state:', {
    hasCurrentRoom: !!currentRoom,
    roomId: currentRoom?._id,
    messageCount: currentMessages.length,
    isLoadingMessages,
    isConnected
  });

  return (
    <div className="h-screen bg-zinc-900 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar onSelectRoom={handleSelectRoom} />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            {/* Chat Header */}
            <ChatHeader room={currentRoom} />

            {/* Connection Status */}
            {!isConnected && (
              <div className="bg-yellow-600/20 border-b border-yellow-600/30 px-4 py-2">
                <p className="text-sm text-yellow-500 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting to server...
                </p>
              </div>
            )}

            {/* Messages */}
            <MessageList messages={currentMessages} isLoading={isLoadingMessages} />

            {/* Message Input */}
            <MessageInput roomId={currentRoom._id} />
          </>
        ) : (
          // Empty state
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-zinc-500">
              <svg className="w-20 h-20 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-lg mb-2">Welcome, {user?.name}!</p>
              <p>Select a room from the sidebar to start chatting</p>
              {!isConnected && (
                <p className="text-sm text-yellow-500 mt-4">
                  Connecting to server...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
