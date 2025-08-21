export async function createQuestion(
  username: string | undefined,
  title: string,
  text: string,
  apikey: string
): Promise<void> {
  try {
    const payload = {
      creator: username,
      title: title,
      text: text,
    };

    const response = await fetch(
      "https://qoverflow.api.hscc.bdpa.org/v1/questions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log(result);

    if (response.ok) {
      console.log("Message created successfully");
      return result;
    } else {
      console.log("Nope");
    }
  } catch (error) {
    console.error(error);
  }
}
