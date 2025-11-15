import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import useAuthStore from '../../store/authStore';
import useChatStore from '../../store/chatStore';
import { createRoom, getAvailableRooms, joinRoom } from '../../services/api';

const Sidebar = ({ onSelectRoom }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { rooms, currentRoom, isLoadingRooms, onlineUsers, fetchRooms } = useChatStore();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;

    setIsCreating(true);
    try {
      console.log('[Sidebar] Creating room:', roomName);
      const newRoom = await createRoom({ name: roomName.trim() });
      console.log('[Sidebar] Room created:', newRoom);
      
      // Refresh rooms list
      await fetchRooms();
      
      // Reset form
      setRoomName('');
      setShowCreateRoom(false);
    } catch (error) {
      console.error('[Sidebar] Failed to create room:', error);
      alert('Failed to create room. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleShowJoinRoom = async () => {
    setShowJoinRoom(true);
    setShowCreateRoom(false);
    setIsLoadingAvailable(true);
    
    try {
      console.log('[Sidebar] Fetching available rooms');
      const response = await getAvailableRooms();
      console.log('[Sidebar] Available rooms:', response.rooms);
      setAvailableRooms(response.rooms || []);
    } catch (error) {
      console.error('[Sidebar] Failed to fetch available rooms:', error);
      alert('Failed to load available rooms');
      setShowJoinRoom(false);
    } finally {
      setIsLoadingAvailable(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    setJoiningRoomId(roomId);
    try {
      console.log('[Sidebar] Joining room:', roomId);
      await joinRoom(roomId);
      console.log('[Sidebar] Successfully joined room');
      
      // Refresh rooms list
      await fetchRooms();
      
      // Close dialog
      setShowJoinRoom(false);
      setAvailableRooms([]);
    } catch (error) {
      console.error('[Sidebar] Failed to join room:', error);
      alert(error.response?.data?.error || 'Failed to join room');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleLogout = () => {
    console.log('[Sidebar] Logging out');
    logout();
    window.location.href = '/login';
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch (error) {
      console.error('[Sidebar] Error formatting time:', error);
      return '';
    }
  };

  const getOnlineCount = (room) => {
    if (!room.participants) return 0;
    return room.participants.filter(p => 
      onlineUsers.has(p._id || p)
    ).length;
  };

  return (
    <div className="w-80 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Chats</h1>
          <div className="flex gap-1">
            <button
              onClick={handleShowJoinRoom}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
              title="Join a room"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </button>
            <button
              onClick={() => {
                setShowCreateRoom(!showCreateRoom);
                setShowJoinRoom(false);
              }}
              className="p-2 hover:bg-zinc-800 rounded-lg transition"
              title="Create new room"
            >
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between bg-zinc-900/50 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-zinc-500">Online</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-zinc-800 rounded-lg transition"
            title="Logout"
          >
            <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>

      {/* Create Room Form (if shown) */}
      {showCreateRoom && (
        <div className="p-4 bg-zinc-900 border-b border-zinc-800">
          <form onSubmit={handleCreateRoom} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">
                Room Name
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="Enter room name"
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition"
                disabled={isCreating}
                autoFocus
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!roomName.trim() || isCreating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateRoom(false);
                  setRoomName('');
                }}
                className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition"
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Join Room Dialog */}
      {showJoinRoom && (
        <div className="p-4 bg-zinc-900 border-b border-zinc-800 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-zinc-300">Available Rooms</h3>
            <button
              onClick={() => {
                setShowJoinRoom(false);
                setAvailableRooms([]);
              }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {isLoadingAvailable ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
              <p className="text-xs text-zinc-500 mt-2">Loading rooms...</p>
            </div>
          ) : availableRooms.length === 0 ? (
            <p className="text-sm text-zinc-500 text-center py-4">No available rooms to join</p>
          ) : (
            <div className="space-y-2">
              {availableRooms.map((room) => (
                <div
                  key={room._id}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-white">{room.name || 'Unnamed Room'}</h4>
                    <p className="text-xs text-zinc-500">
                      {room.participants?.length || 0} member{room.participants?.length !== 1 ? 's' : ''}
                      {room.isMember && ' • Already joined'}
                    </p>
                  </div>
                  {!room.isMember && (
                    <button
                      onClick={() => handleJoinRoom(room._id)}
                      disabled={joiningRoomId === room._id}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {joiningRoomId === room._id ? 'Joining...' : 'Join'}
                    </button>
                  )}
                  {room.isMember && (
                    <span className="text-xs text-green-500">✓ Joined</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rooms List */}
      <div className="flex-1 overflow-y-auto">
        {isLoadingRooms ? (
          <div className="p-4 text-center text-zinc-500">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mb-2"></div>
            <p className="text-sm">Loading rooms...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="p-4 text-center text-zinc-500">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-sm">No rooms yet</p>
            <p className="text-xs mt-1 text-zinc-600">Create a room to start chatting</p>
          </div>
        ) : (
          <div className="p-2">
            {rooms.map((room) => {
              const isSelected = currentRoom?._id === room._id;
              const onlineCount = getOnlineCount(room);
              
              return (
                <div
                  key={room._id}
                  onClick={() => onSelectRoom(room)}
                  className={`p-3 rounded-lg cursor-pointer transition mb-1 ${
                    isSelected 
                      ? 'bg-blue-600/20 border border-blue-600/30' 
                      : 'hover:bg-zinc-800/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <h3 className={`font-medium ${isSelected ? 'text-blue-400' : 'text-white'}`}>
                      {room.name}
                    </h3>
                    {room.lastMessageAt && (
                      <span className="text-xs text-zinc-500">
                        {formatLastMessageTime(room.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  
                  {room.lastMessage && (
                    <p className="text-sm text-zinc-400 truncate">
                      {room.lastMessage.sender?.name}: {room.lastMessage.content}
                    </p>
                  )}
                  
                  {/* Online status */}
                  {onlineCount > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-zinc-500">
                        {onlineCount} online
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
