import { useEffect, useState, useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { getRooms, getMessages, sendMessage, createRoom } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import io from 'socket.io-client';

export default function Chat() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newRoomName, setNewRoomName] = useState('');
  const socketRef = useRef(null);

  useEffect(() => {
    fetchRooms();

    socketRef.current = io(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000');

    socketRef.current.on('connect', () => {
      console.log('Socket connected');
    });

    socketRef.current.on('newMessage', (message) => {
      if (message.room === selectedRoom?._id) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [selectedRoom]);

  async function fetchRooms() {
    try {
      const { data } = await getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms', error);
    }
  }

  async function handleSelectRoom(room) {
    setSelectedRoom(room);
    try {
      const { data } = await getMessages(room._id);
      setMessages(data);
      socketRef.current.emit('joinRoom', { roomId: room._id });
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  }

  async function handleSendMessage() {
    if (!newMessage.trim() || !selectedRoom) return;
    try {
      await sendMessage(selectedRoom._id, { message: newMessage });
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message', error);
    }
  }

  async function handleCreateRoom() {
    if (!newRoomName.trim()) return;
    try {
      await createRoom({ name: newRoomName });
      setNewRoomName('');
      fetchRooms();
    } catch (error) {
      console.error('Failed to create room', error);
    }
  }

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
        <ResizablePanel defaultSize={25}>
          <div className="flex flex-col h-full p-2">
            <div className="p-2">
              <Input
                placeholder="New room name"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
              />
              <Button onClick={handleCreateRoom} className="w-full mt-2">Create Room</Button>
            </div>
            <ScrollArea className="flex-grow">
              {rooms.map((room) => (
                <div
                  key={room._id}
                  className={`p-2 rounded-md cursor-pointer ${selectedRoom?._id === room._id ? 'bg-muted' : ''}`}
                  onClick={() => handleSelectRoom(room)}
                >
                  {room.name}
                </div>
              ))}
            </ScrollArea>
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={75}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <h2 className="text-xl font-semibold">{selectedRoom?.name || 'Select a room'}</h2>
            </div>
            <ScrollArea className="flex-grow p-4">
              {messages.map((msg) => (
                <div key={msg._id} className="flex items-start gap-4 mb-4">
                  <Avatar>
                    <AvatarImage src={`https://api.dicebear.com/6.x/initials/svg?seed=${msg.sender.name}`} />
                    <AvatarFallback>{msg.sender.name.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{msg.sender.name}</p>
                    <p>{msg.message}</p>
                    <p className="text-xs text-muted-foreground">{new Date(msg.createdAt).toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
            </ScrollArea>
            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                />
                <Button onClick={handleSendMessage}>Send</Button>
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
