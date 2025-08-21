import { apikey } from "./apikey";

export async function updateUserPoints(
  username: string,
  operation: string,
  amount: number
) {
  try {
    const payload = {
      operation: operation,
      amount: amount,
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}/points`,
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
      console.log("Great, you updated ur password");
      return result;
    } else {
      console.log(`ERROR: ${result.error}`);
      return result;
    }
  } catch (err) {
    console.log(err);
  }
}
