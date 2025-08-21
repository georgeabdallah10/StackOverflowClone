import type { Question } from "@/types/questions";
import { apikey } from "@/api/apikey";

export async function getQAquestion(questionsID: string, apikey: string) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json();

    if (result.success) {
      console.log("you got all of your questions");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getQAanswers(
  questionsID: string | undefined,
  apikey: string
) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/answers`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.success) {
      console.log("you got all of your questions");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getQAcomments(
  questionsID: string | undefined,
  apikey: string
) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/comments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.success) {
      console.log("you got all of your questions");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getQAanswersComments(
  questionsID: string | undefined,
  answer_id: string | undefined,
  apikey: string
) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/answers/${answer_id}/comments`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.success) {
      console.log("you got all of your questions");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function createAnswer(
  questionsID: string | undefined,
  creator: string,
  text: string,
  apikey: string
) {
  const payload = {
    creator: creator,
    text: text,
  };
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/answers`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.success) {
      console.log("you successfully created an answer");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function createCommentforQuestion(
  questionsID: string | undefined,
  creator: string,
  text: string,
  apikey: string
) {
  const payload = {
    creator: creator,
    text: text,
  };
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.success) {
      console.log("you successfully created an answer");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function createCommentForAnswer(
  questionsID: string | undefined,
  answer_id: string,
  creator: string,
  text: string,
  apikey: string
) {
  const payload = {
    creator: creator,
    text: text,
  };
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/answers/${answer_id}/comments`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.success) {
      console.log("you successfully created an answer");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function checkQuestionVoted(
  questionsID: string,
  username: string,
  apikey: string
) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/vote/${username}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.vote) {
      console.log("You already voted this questions");
    } else {
      console.log("You didn't vote this question yet.");
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updateQuestionVote(
  question_id: string,
  operation: string,
  username: string,
  target: string
) {

  try {
    const payload = {
      operation: operation,
      target: target,
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${question_id}/vote/${username}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const status_code = response;
    console.log(status_code.status);
    const result: any = await response.json();
    console.log(result);

    if (status_code.status == 200) {
      console.log("Great, you updated that question's vote");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updateQuestionViews(question_id: string, value: string) {

  try {
    const payload = {
      views: value,
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${question_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const status_code = response;
    console.log(status_code.status);
    const result: any = await response.json();
    console.log(result);

    if (status_code.status == 200) {
      console.log("Great, you updated that question's vote");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}
export async function checkCommentVote(
  questionsID: string,
  comment_id: string,
  username: string,
  apikey: string
) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/comments/${comment_id}/vote/${username}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json();
    console.log(result);

    if (result.vote) {
      console.log("You already voted this questions");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updateCommentsVote(
  question_id: string,
  comment_id: string,
  operation: string,
  username: string,
  target: string
) {

  try {
    const payload = {
      operation: operation,
      target: target,
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${question_id}/comments/${comment_id}/vote/${username}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const status_code = response;
    console.log(status_code.status);
    const result: any = await response.json();
    console.log(result);

    if (status_code.status == 200) {
      console.log("Great, you updated that comment's vote");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function checkAnswersVote(
  questionsID: string,
  answer_id: string,
  username: string,
  apikey: string
) {
  try {
    const response = await fetch(
      `
https://qoverflow.api.hscc.bdpa.org/v1/questions/${questionsID}/answers/${answer_id}/vote/${username}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );
    const result: any = await response.json();
    console.log(result);

    if (result.vote) {
      console.log("You already voted this questions");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updateAnswersVote(
  question_id: string,
  answer_id: string,
  operation: string,
  username: string,
  target: string
) {

  try {
    const payload = {
      operation: operation,
      target: target,
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${question_id}/answers/${answer_id}/vote/${username}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const status_code = response;
    console.log(status_code.status);
    const result: any = await response.json();
    console.log(result);
    if (status_code.status == 200) {
      console.log("Great, you updated that comment's vote");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updateAnswerStatus(
  question_id: string,
  answer_id: string,
  status: boolean
) {

  try {
    const payload = {
      accepted: status,
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${question_id}/answers/${answer_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );
    const result: any = await response.json();
    console.log(result);
    if (result.success) {
      console.log("Great, you updated that answer's status");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}

type VoteType = "open" | "closed" | "protected" | null;

export function getOngoingVoteType(question: Question): VoteType {
  if (
    question.protectedVotes &&
    question.protectedVotes > 0 &&
    question.protectedVotes < 3
  ) {
    return "protected";
  }
  if (
    question.closedVotes &&
    question.closedVotes > 0 &&
    question.closedVotes < 3
  ) {
    return "closed";
  }
  if (question.openVotes && question.openVotes > 0 && question.openVotes < 3) {
    return "open";
  }
  return null;
}

export async function updateQuestionStatus(
  question_id: string,
  status: "open" | "closed" | "protected"
) {
  try {
    const payload = { status: status };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${question_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    if (result.success) {
      console.log("✅ Status updated successfully");
    } else {
      console.log("❌ Error updating status:", result.error);
    }
    return result;
  } catch (err) {
    console.error("❌ Network error:", err);
  }
}
export async function deleteComment(quesionId: string,commentId: string, apikey: string) {
  try {
    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/questions/${quesionId}/comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },

      }
    );

    const result: any = await response.json()
    console.log(result)

    if (result.success) {
        console.log("Great, you deleted the comment")
        return result;
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}