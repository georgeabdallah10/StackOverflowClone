import deriveKeyWithSalt from "@/utility/passhash";

interface FormData {
  email: string;
  username: string;
  password: string;
}

interface ApiResponse {
  message: string;
  [key: string]: any;
}

export async function handleSubmit(
  form: FormData,
  responseMSg: (msg: string) => void,
  apikey: string
): Promise<void> {
  try {
    const { key, salt } = await deriveKeyWithSalt(form.password);

    const payload = {
      email: form.email,
      username: form.username,
      key: key, // derived key
      salt: salt, // base64 encoded salt
    };

    const response = await fetch(
      "https://qoverflow.api.hscc.bdpa.org/v1/users",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result: ApiResponse = await response.json();

    if (response.ok) {
      responseMSg("✅ User created successfully!");
    } else {
      responseMSg(`❌ Error: ${result.error || "Unknown error"}`);
      return;
    }
  } catch (error) {
    console.error(error);
    responseMSg("❌ Error creating user.");
  }
}

export async function getuserobj(
  form: string,
  apikey: string,
  list?: string[],
  value?: string | string[]
): Promise<any> {
  if (list && list.length > 0) {
    const results = await Promise.all(
      list.map(async (username: string) => {
        try {
          const response = await fetch(
            `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${apikey}`,
                "Content-Type": "application/json",
              },
            }
          );

          const result = await response.json();
          const user = result.user ?? null;

          if (!user) return null;

          if (Array.isArray(value)) {
            const selected: Record<string, any> = { username };
            for (const v of value) {
              selected[v] = user[v] ?? null;
            }
            return selected;
          } else if (value) {
            return { username, [value]: user[value] ?? null };
          } else {
            return user;
          }
        } catch (err) {
          console.error("Fetch error for user", username, err);
          return null;
        }
      })
    );

    return results.filter((r) => r != null);
  } else {
    try {
      const response = await fetch(
        `https://qoverflow.api.hscc.bdpa.org/v1/users/${form}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apikey}`,
            "Content-Type": "application/json",
          },
        }
      );

      const result = await response.json();
      const user = result.user;
      console.log(user);
      return user;

      /*if (Array.isArray(value)) {
        const selected: Record<string, any> = {};
        for (const v of value) {
          selected[v] = user[v] ?? null;
        }
        return selected;
      } else if (value) {
        return { [value]: user[value] ?? null };
      } else {
        return user;
      }*/
    } catch (err) {
      console.error(err);
      return null;
    }
  }
}

export async function login(
  password: string,
  username: string,
  apikey: string,
  salt: string,
  loginstatus: (msg: boolean) => void
): Promise<any> {
  try {
    const key = await deriveKeyWithSalt(password, salt);

    const payload = {
      key: key.key, // derived login key
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}/auth`,
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

    if (result.success) {
      console.log("GREAT, you are logged in");
      loginstatus(true);
      return result;
    }
  } catch (error) {
    console.error(error);
    loginstatus(false);
  }
}
// api/users.ts

export async function getallusers(apikey: string) {
  const allUsers: any[] = [];
  let after: string | undefined = undefined;
  let hasMore = true;

  try {
    const url = new URL("https://qoverflow.api.hscc.bdpa.org/v1/users");
    if (after) {
      url.searchParams.append("after", after);
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apikey}`,
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success && Array.isArray(result.users)) {
      console.log(`Fetched ${result.users.length} users`);

      allUsers.push(...result.users);

      // If less than 100 users returned, there's nothing more to paginate
      if (result.users.length < 100) {
        hasMore = false;
      } else {
        // Get the user_id of the last user for the `after` param
        after = result.users[result.users.length - 1].user_id;
      }
    } else {
      console.log(`ERROR: ${result.error || "Unknown error"}`);
      hasMore = false;
    }

    console.log(`✅ Total users fetched: ${allUsers.length}`);
    return allUsers;
  } catch (err) {
    console.error("❌ Failed to fetch users:", err);
    return [];
  }
}
