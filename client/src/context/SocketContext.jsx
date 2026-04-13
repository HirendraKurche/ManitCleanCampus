import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (!user) {
            // Disconnect if user logs out
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
            return;
        }

        const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
            withCredentials: true,
        });

        newSocket.on('connect', () => {
            console.log('🔗 Connected to Socket.IO Server');
            // Join personal room to receive targeted notifications
            newSocket.emit('join_user_room', user._id);
            
            // Join role room
            if (user.role) {
                newSocket.emit('join_role_room', user.role);
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
