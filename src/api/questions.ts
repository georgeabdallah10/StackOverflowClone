import type { Question } from "@/types/questions";
import { apikey } from "./apikey";

const BASE_URL = "https://qoverflow.api.hscc.bdpa.org/v1";

export async function fetchQuestions(
  sorting: "d" | "u" | "uvc" | "uvac" = "d",
  afterId?: string,
  query?: string
): Promise<Question[]> {
  let url = `${BASE_URL}/questions/search?`;

  const params: string[] = [];
  if (sorting !== "d") {
    params.push(`sort=${sorting}`);
  }
  if (afterId) {
    params.push(`after=${afterId}`);
  }
  if (query && query.trim() !== "") {
    params.push(`q=${encodeURIComponent(query.trim())}`);
  }

  url += params.join("&");

  const response = await fetch(url, {
    headers: {
      Authorization: `bearer ${apikey}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch questions: ${response.statusText}`);
  }

  const data = await response.json();
  return data.questions ?? [];
}
