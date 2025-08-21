
interface Maildata {
  sender: string | undefined;
  receiver: string;
  subject: string;
  text: string;
}

export async function sendmail(maildata: Maildata, apikey: string) {
  try {
    const payload = {
      sender: maildata.sender,
      receiver: maildata.receiver,
      subject: maildata.subject,
      text: maildata.text,
    };

    const response = await fetch(
      "https://qoverflow.api.hscc.bdpa.org/v1/mail",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apikey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const result: any = await response.json()
    console.log(result)
    if (result.ok) {
        console.log("Mail sent good job")
        return result
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}

export async function getmail(username: string ,apikey: string) {
  try {

    const response = await fetch(
      `https://qoverflow.api.hscc.bdpa.org/v1/mail/${username}`,
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
        console.log("you got all the mailr")
        return result
    } else{
        console.log(`ERROR: ${result.error}`)
        return result
    }
  } catch (err) {
    console.log(err);
  }
}


  
