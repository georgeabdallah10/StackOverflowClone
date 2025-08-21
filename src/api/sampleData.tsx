import type { Question } from "@/types/questions"

export default function giveExampleQuestions(error: Error | null){
    if(error !== null && error.message === "request sender is rate limited"){
        return [
      {
        question_id: "5ec8adf06e38137ff2e58770",
        creator: "TheWatcher",
        createdAt: 1579489874164,
        status: "open",
        title: "Who watches the watchmen?",
        text: "Is this real life?",
        views: 64,
        answers: 2,
        comments: 0,
        upvotes: 25,
        downvotes: 5,
        hasAcceptedAnswer: false,
      },
      {
        question_id: "5ec8af2e58770df06e38137f",
        creator: "helloworld123",
        createdAt: 1579489416874,
        status: "protected",
        title: "Why is 2 + 2 = 4?",
        text: "As the title says.",
        views: 176,
        answers: 9,
        comments: 3,
        upvotes: 8,
        downvotes: 7,
        hasAcceptedAnswer: true,
      },
    ];
  }

  // Return an empty array or handle other error types if needed
  return [];
}

