import type { Question } from "./questions";

export interface ReadMessages{
    userID: string,
    readMessagesID: string
}

export interface Tag {
  tag: string;              // name of the tag
  questionIDs: string[];    // array of question IDs
}

export interface Tags {
  taggedQuestions: Tag[];   // array of Tag objects
}

export interface tagsByQuestion {
  questionID: string;
  tags: string[];
}
export interface questionsByTag{
  tag: string;
  question: Question[];
}