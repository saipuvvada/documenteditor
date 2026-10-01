import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

export const DEMO_USERS: User[] = [
  { id: 'user-sai', name: 'Sai', email: 'sai@example.com' },
  { id: 'user-priya', name: 'Priya', email: 'priya@example.com' },
  { id: 'user-alex', name: 'Alex', email: 'alex@example.com' },
];

interface DemoUserContextType {
  currentUser: User;
  switchUser: (user: User) => void;
  availableUsers: User[];
}

const DemoUserContext = createContext<DemoUserContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'docu_editor_demo_user_id';

export const DemoUserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedUserId = localStorage.getItem(LOCAL_STORAGE_KEY);
    const found = DEMO_USERS.find((u) => u.id === savedUserId);
    return found || DEMO_USERS[0]; // Default to Sai
  });

  const switchUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(LOCAL_STORAGE_KEY, user.id);
  };

  return (
    <DemoUserContext.Provider value={{ currentUser, switchUser, availableUsers: DEMO_USERS }}>
      {children}
    </DemoUserContext.Provider>
  );
};

export const useDemoUser = () => {
  const context = useContext(DemoUserContext);
  if (!context) {
    throw new Error('useDemoUser must be used within a DemoUserProvider');
  }
  return context;
};
