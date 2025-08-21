import React, { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

// ----------------- Types -----------------

// The SubBadge interface remains the same
export interface SubBadge {
  title: string;
  description: string;
  completed: boolean | null;
}

// BadgeCategory defines the structure for a single badge group (e.g., "Gold")
export interface BadgeCategory {
  name: string;
  style: string; // e.g., "gold", "silver", "bronze"
  subbadges: Record<string, SubBadge>;
}

// BadgesMap defines the overall data structure, an object of BadgeCategory
type BadgesMap = {
  [key: string]: BadgeCategory;
};

// The context type now correctly uses BadgesMap
interface BadgeContextType {
  badges: BadgesMap;
  setBadges: React.Dispatch<React.SetStateAction<BadgesMap>>;
}

// ----------------- Initial Data -----------------
const initialBadges: BadgesMap = {
  Gold: {
    name: "Gold",
    style: "gold",
    subbadges: {
      "Great Question": {
        title: "Great Question",
        description: "Have a question with net total points of 100 > higher",
        completed: false,
      },
      "Great Answer": {
        title: "Great Answer",
        description: "Provided an answer with a score of 100 or more",
        completed: false,
      },
      Socratic: {
        title: "Socratic",
        description: "Have at least 10,000 points",
        completed: false,
      },
      Zombie: {
        title: "Zombie",
        description: "Have  question that is Reopened",
        completed: false,
      },
    },
  },
  Silver: {
    name: "Silver",
    style: "silver",
    subbadges: {
      "Good Question": {
        title: "Good Question",
        description: "Have a question with net total points 25 > higher",
        completed: false,
      },
      "Good Answer": {
        title: "Good Answer",
        description: "Provided an answer with a score of 25 or more",
        completed: false,
      },
      Inquisitive: {
        title: "Inquisitive",
        description: "Have at least 3,000 points",
        completed: false,
      },
      Protected: {
        title: "Protected",
        description: "Have a question that is protected",
        completed: false,
      },
    },
  },
  Bronze: {
    name: "Bronze",
    style: "bronze",
    subbadges: {
      "Nice Question": {
        title: "Nice Question",
        description: "Have a question with net total points 10 > higher",
        completed: false,
      },
      "Nice Answer": {
        title: "Nice Answer",
        description: "Provided an answer with a score of 10 or more",
        completed: false,
      },
      Curious: {
        title: "Curious",
        description: "Have at least 100 points",
        completed: false,
      },
      Scholar: {
        title: "Scholar",
        description: "Accept an answer",
        completed: false,
      },
    },
  },
};

// ----------------- Context -----------------
const BadgeContext = createContext<BadgeContextType | undefined>(undefined);

export const BadgeProvider = ({ children }: { children: ReactNode }) => {
  // Fix: The useState hook is now correctly typed as BadgesMap
  const [badges, setBadges] = useState<BadgesMap>(initialBadges);

  return (
    <BadgeContext.Provider value={{ badges, setBadges }}>
      {children}
    </BadgeContext.Provider>
  );
};

// ----------------- Hook -----------------
export const useBadges = () => {
  const context = useContext(BadgeContext);
  if (!context) {
    throw new Error("useBadges must be used within a BadgeProvider");
  }
  return context;
};
