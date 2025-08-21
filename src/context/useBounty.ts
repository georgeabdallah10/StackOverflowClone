import { useEffect, useState, useContext } from "react";
import { bountyDB } from "../db/bountyDB";
import type { Bounty, User } from "../db/bountyDB";
import { useUser } from "../context/UserContext";

export function useBounty(questionId: string) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const {user} = useUser();

  useEffect(() => {
    async function fetchBounty() {
      const foundBounty = await bountyDB.bounties.get(questionId);
      setBounty(foundBounty ?? null);
    }
    fetchBounty();
  }, [questionId]);

  async function addBounty(amount: number) {
    if (!user) throw new Error("User must be logged in to add a bounty");
    if (amount < 75 || amount > 500) throw new Error("Bounty must be between 75–500 pts");
    if (user.points - amount < 75) throw new Error("You must have at least 75 pts left after adding a bounty");

    const newBounty: Bounty = {
      questionId,
      amount,
      addedByUserId: user.user_id,
      createdAt: Date.now()
    };
    await bountyDB.bounties.put(newBounty);

    await bountyDB.users.put({ ...user, id: user.user_id,points: user.points - amount });
    setBounty(newBounty);
  }

  async function awardBounty(toUser: User) {
    if (!bounty) return;
    const awardedBounty = {
      ...bounty,
      awardedToUserId: toUser.id,
      awardedAt: Date.now()
    };
    await bountyDB.bounties.put(awardedBounty);
    await bountyDB.users.put({ ...toUser, points: toUser.points + bounty.amount });
    setBounty(awardedBounty);
  }

  return { bounty, addBounty, awardBounty };
}