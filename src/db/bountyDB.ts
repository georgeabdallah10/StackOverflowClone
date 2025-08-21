import Dexie from "dexie";
import type { Table } from "dexie";

export interface User {
  id: string;
  username: string;
  points: number;
}

export interface Bounty {
  questionId: string;
  amount: number;
  addedByUserId: string;
  createdAt: number;
  awardedToUserId?: string;
  awardedAt?: number;
}

class BountyDB extends Dexie {
  users!: Table<User, string>;       // key = userId
  bounties!: Table<Bounty, string>;  // key = questionId

  constructor() {
    super("BountyDB");
    this.version(1).stores({
      users: "id",
      bounties: "questionId"
    });
  }
}

export const bountyDB = new BountyDB();