import React, { createContext, useContext, useState } from "react";

interface UsersContextType {
  users: Record<string, any>;
  hashedEmail: Record<string, string>;
  level: Record<string, number>;
  setUsers: (users: Record<string, any>) => void;
  setHashedEmails: (hashed: Record<string, string>) => void;
  setLevels: (levels: Record<string, number>) => void;
}

const UsersContext = createContext<UsersContextType>({
  users: {},
  hashedEmail: {},
  level: {},
  setUsers: () => {},
  setHashedEmails: () => {},
  setLevels: () => {},
});

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
  const [users, setUsers] = useState<Record<string, any>>({});
  const [hashedEmail, setHashedEmails] = useState<Record<string, string>>({});
  const [level, setLevels] = useState<Record<string, number>>({});

  return (
    <UsersContext.Provider
      value={{
        users,
        hashedEmail: hashedEmail,
        level,
        setUsers,
        setHashedEmails,
        setLevels,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

export const useUsers = () => useContext(UsersContext);
