import React, { createContext, useContext, useEffect, useState } from "react";
import hashEmail from "@/utility/emailhash";
import level from "@/api/levelSys";
import { getallusers } from "@/views/auth/signup/backendauth";
import { apikey } from "@/api/apikey";

// ✅ In-memory persistent cache
let cachedUsers: Record<string, any> = {};
let cachedHashedEmails: Record<string, string> = {};
let cachedLevels: Record<string, number> = {};
let hasFetchedOnce = false;
let isCurrentlyFetching = false; // Prevent multiple simultaneous fetches

interface UserCache {
  users: Record<string, any>;
  hashedEmails: Record<string, string>;
  levels: Record<string, number>;
  loading: boolean;
  error: string | null;
  isCached: boolean;
  // Helper functions to get specific user data
  getUserByUsername: (username: string) => any | null;
  getUserLevel: (username: string) => number | null;
  getUserHashedEmail: (username: string) => string | null;
  getAllUsernames: () => string[];
  refreshCache: () => Promise<void>; // Optional: force refresh if needed
}

const UserCacheContext = createContext<UserCache>({
  users: {},
  hashedEmails: {},
  levels: {},
  loading: true,
  error: null,
  isCached: false,
  getUserByUsername: () => null,
  getUserLevel: () => null,
  getUserHashedEmail: () => null,
  getAllUsernames: () => [],
  refreshCache: async () => {},
});

export function UserCacheProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState(cachedUsers);
  const [hashedEmails, setHashedEmails] = useState(cachedHashedEmails);
  const [levels, setLevels] = useState(cachedLevels);
  const [loading, setLoading] = useState(!hasFetchedOnce);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(hasFetchedOnce);

  const fetchUsers = async () => {
    if (hasFetchedOnce || isCurrentlyFetching) return;
    
    isCurrentlyFetching = true;
    setLoading(true);
    setError(null);

    try {
      const allUsers = await getallusers(apikey);

      const userMap: Record<string, any> = {};
      const emailMap: Record<string, string> = {};
      const levelMap: Record<string, number> = {};

      for (const user of allUsers) {
        userMap[user.username] = user;
        emailMap[user.username] = await hashEmail(user.email);
        levelMap[user.username] = level(user.points);
      }

      // Update cache
      cachedUsers = userMap;
      cachedHashedEmails = emailMap;
      cachedLevels = levelMap;
      hasFetchedOnce = true;

      // Update state
      setUsers(userMap);
      setHashedEmails(emailMap);
      setLevels(levelMap);
      setIsCached(true);
    } catch (err: any) {
      setError(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
      isCurrentlyFetching = false;
    }
  };

  // Force refresh function (optional)
  const refreshCache = async () => {
    hasFetchedOnce = false;
    isCurrentlyFetching = false;
    await fetchUsers();
  };

  useEffect(() => {
    // If data is already cached, use it immediately
    if (hasFetchedOnce) {
      setUsers(cachedUsers);
      setHashedEmails(cachedHashedEmails);
      setLevels(cachedLevels);
      setIsCached(true);
      setLoading(false);
      return;
    }

    fetchUsers();
  }, []);

  // Helper functions for easy data access
  const getUserByUsername = (username: string) => {
    return users[username] || null;
  };

  const getUserLevel = (username: string) => {
    return levels[username] ?? null;
  };

  const getUserHashedEmail = (username: string) => {
    return hashedEmails[username] || null;
  };

  const getAllUsernames = () => {
    return Object.keys(users);
  };

  return (
    <UserCacheContext.Provider
      value={{ 
        users, 
        hashedEmails, 
        levels, 
        loading, 
        error, 
        isCached,
        getUserByUsername,
        getUserLevel,
        getUserHashedEmail,
        getAllUsernames,
        refreshCache
      }}
    >
      {children}
    </UserCacheContext.Provider>
  );
}

export function useUserCache() {
  return useContext(UserCacheContext);
}

// Optional: Export individual hooks for specific data
export function useUserInfo(username: string) {
  const { getUserByUsername, loading, error } = useUserCache();
  return {
    user: getUserByUsername(username),
    loading,
    error
  };
}

export function useUserLevel(username: string) {
  const { getUserLevel, loading, error } = useUserCache();
  return {
    level: getUserLevel(username),
    loading,
    error
  };
}
