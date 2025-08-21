import deriveKeyWithSalt from "@/utility/passhash";

export async function getquestions(username: string ,apikey: string) {
  try {

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}/questions`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json()
    console.log(result)

    if (result.success) {
        console.log("you got all of your questions")
        return result;
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getanswers(username: string ,apikey: string) {
  try {

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}/answers`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result: any = await response.json()
    console.log(result)

    if (result.success) {
        console.log("you got all of your answers")
        return result;
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updatepassword(username: string, password: string ,apikey: string) {
  try {
    const { key, salt } = await deriveKeyWithSalt(password);


    const payload = {
      key: key,   // derived key
      salt: salt, // base64 encoded salt
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),

      }
    );

    const result: any = await response.json()
    console.log(result)

    if (result.success) {
        console.log("Great, you updated ur password")
        return result;
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}

export async function updateEmail(username: string, email: string,apikey: string) {
  try {


    const payload = {
        email: email
    };

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),

      }
    );

    const result: any = await response.json()
    console.log(result)

    if (result.success) {
        console.log("Great, you updated ur password")
        return result;
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}

export async function deleteAccount(username: string, apikey: string) {
  try {
    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/users/${username}`,
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
        console.log("Great, you deleted your account")
        return result;
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}