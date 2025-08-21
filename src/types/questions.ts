export interface Question {
    creator: string;
    title: string;
    createdAt: number;
    text: string;
    status: string;
    hasAcceptedAnswer: boolean;
    upvotes: number;
    downvotes: number;
    answers: number;
    views: number;
    comments: number;
    question_id: string;
    acceptedAnswerId: boolean;
    closedVotes: number | null;
    protectedVotes: number| null;
    openVotes: number| null;
    bounty: boolean;
    bountyValue: number;
}

