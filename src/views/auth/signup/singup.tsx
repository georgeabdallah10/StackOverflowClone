import { useState, useEffect } from "react";
import { handleSubmit, getuserobj, login } from "./backendauth";
import deriveKeyWithSalt from "@/utility/passhash";
import ForgotPassword from "./forgotpass";
import { apikey } from "@/api/apikey";


interface CountdownTimerProps {
  targetTime: number; // timestamp in ms
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetTime }) => {
  const [timeLeft, setTimeLeft] = useState<number>(targetTime - Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(targetTime - Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  if (timeLeft <= 0)
    return <span className="text-green-500 font-medium">Unlocked</span>;

  const getFormattedTime = () => {
    const totalSeconds = Math.floor(timeLeft / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="px-4 py-2 rounded-xl shadow text-gray-800 text-center font-semibold w-max mx-auto mt-3 bg-[#F87171] border-2 border-red-500">
      Too many incorrect tries
      <br />
      You are locked for {getFormattedTime()}
    </div>
  );
};

export default function Signup() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    password: "",
  });
  const [user, setUser] = useState({
    username: "",
    email: "",
    salt: "",
    password: "",
    key: "",
    answers: 0,
    points: 0,
    questions: 0,
  });
  const [responsemsg, SetResponseMessage] = useState<string>("");
  const [captcha, setCaptcha] = useState("");
  const [captchaStatus, setCaptchaStatus] = useState<boolean | null>(null);
  const [loginstatus, setLoginStatus] = useState<boolean | null>(null);
  const [rememberme, Setrememberme] = useState<boolean>(false);
  const [tries, setTries] = useState(3);
  const [isLocked, setIsLocked] = useState(false);

  // Lockout duration 1 hour
  const LOCKOUT_DURATION = 60 * 60 * 1000;

  const getStrength = (pwd: string) => {
    if (pwd.length > 17) return "strong";
    if (pwd.length >= 11) return "moderate";
    if (pwd.length > 0) return "weak";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const handleChange2 = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  // Check for lockout on mount and setup unlock timer
  useEffect(() => {
    localStorage.removeItem("login_lockout"); // Clear any lockout stored
    setIsLocked(false); // Unlock the login form on page load
    setTries(3); // Reset tries as well if you want
  }, []);

  const handleFailedLogin = () => {
    const unlockTime = Date.now() + LOCKOUT_DURATION;
    localStorage.setItem("login_lockout", unlockTime.toString());
    setIsLocked(true);
  };

  const getuserinfo = async (username: string, password: string) => {
    const data = await getuserobj(username, apikey);
    const salt = data.salt;
    const key = await deriveKeyWithSalt(password, salt);
    console.log(data)
    const newUser = {
      username: data.username,
      email: data.email,
      password: password,
      salt: salt,
      key: key.key,
      answers: data.answers,
      points: data.points,
      questions: data .questions,
    };
    setUser(newUser);
    return newUser;
  };

  const loginfnc = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLocked) return; // Disable if locked

    try {
      const newUser = await getuserinfo(user.username, user.password);

      const status = await login(
        newUser.password,
        newUser.username,
        apikey,
        newUser.salt,
        setLoginStatus
      );

      if (status.success) {
        if (rememberme) {
          sessionStorage.setItem("User_logged", JSON.stringify(newUser));
        } else {
          localStorage.setItem("User_logged", JSON.stringify(newUser));
        }
        window.location.href = "/";
      } else {
        decrementTries();
        console.log(status)
      }
    } catch (err) {
      decrementTries();
      console.log(err)
    }
  };

  const decrementTries = () => {
    if (tries <= 1) {
      handleFailedLogin();
      setTries(0);
      setLoginStatus(false);
    } else {
      setTries(tries - 1);
      setLoginStatus(false);
    }
  };

  const strength = getStrength(form.password);
  const strengthStyle =
    {
      weak: "text-red-600 border-red-500",
      moderate: "text-yellow-600 border-yellow-500",
      strong: "text-green-600 border-green-500",
    }[strength as "weak" | "moderate" | "strong"] ||
    "text-gray-500 border-gray-300";

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (strength !== "weak") {
      if (captcha === "10") {
        setCaptchaStatus(true);
        handleSubmit(form, SetResponseMessage, apikey);
        setForm({
          email: "",
          username: "",
          password: "",
        });
        setCaptcha("");
      } else {
        SetResponseMessage("Error, CAPTCHA is incorrect.");
      }
    } else {
      SetResponseMessage("Error, Password is too weak.");
    }
  };

  return (
    <>
      <div className="w-screen min-h-screen flex flex-col md:flex-row justify-around items-center p-4 gap-6">
        {/* Signup Section */}
        <div className="flex flex-col items-center justify-center p-3 w-full max-w-md gap-5 bg-white rounded-lg shadow-lg">
          <h1 className="text-center text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            <span className="text-[#7C3CED]">Create your account</span>
          </h1>
          <p className="text-center text-lg text-gray-700">
            Join us and unlock exclusive features!
          </p>

          <form onSubmit={onFormSubmit} className="flex flex-col w-full gap-4">
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg transition"
              required
            />
            <input
              type="email"
              placeholder="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg transition"
              required
            />
            <div className="flex flex-col space-y-1">
              <input
                type="password"
                placeholder="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={`w-full py-3 px-4 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg transition ${strengthStyle}`}
                required
              />
              {strength && (
                <span
                  className={`text-sm font-medium w-max p-2 border-2 rounded-2xl mt-1 ${strengthStyle}`}
                >
                  {strength === "weak" &&
                    "Weak password (must be more than 10 characters)"}
                  {strength === "moderate" && "Moderate password"}
                  {strength === "strong" && "Strong password"}
                </span>
              )}
            </div>
            <div className="px-3 py-2 rounded-2xl bg-white border border-gray-300 text-gray-700 shadow-sm text-center text-base">
              CAPTCHA: What is 5 + 5 ?
            </div>
            <input
              type="text"
              placeholder="CAPTCHA"
              name="captcha"
              value={captcha}
              onChange={(e) => setCaptcha(e.target.value)}
              className="w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg transition"
              required
            />
            <button
              type="submit"
              className="bg-[#4C1D95] hover:bg-[#6728c7] text-white font-semibold py-3 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-lg mt-2"
            >
              Create an account
            </button>
          </form>
          {responsemsg === "✅ User created successfully!" ? (
            <div className="mt-4 px-4 py-2 rounded-lg bg-green-50 border border-green-400 text-green-700 text-center shadow transition-all duration-300">
              <span className="font-semibold">Success:</span> {responsemsg}
              <br />
              <span className="font-semibold">
                Please log in with your credentials in the login section
              </span>
            </div>
          ) : responsemsg ? (
            <div className="mt-4 px-4 py-2 rounded-lg bg-red-50 border border-red-400 text-red-700 text-center shadow transition-all duration-300">
              {responsemsg}
            </div>
          ) : null}
        </div>

        {/* Divider */}
        <div className="hidden md:block w-[2px] h-[80vh] bg-black mx-4" />

        {/* Login Section */}
        <div className="flex flex-col items-center justify-center p-3 w-full max-w-md gap-5 bg-white rounded-lg shadow-lg">
          <h1 className="text-center text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            <span className="text-[#7C3CED]">Already have an account?</span>
          </h1>
          <p className="text-center text-lg text-gray-700">Welcome back!</p>

          <form
            onSubmit={loginfnc}
            className="flex flex-col w-full gap-4"
            aria-disabled={isLocked}
          >
            <input
              type="text"
              placeholder="Username"
              name="username"
              value={user.username}
              onChange={handleChange2}
              disabled={isLocked}
              className={`w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg transition ${
                isLocked ? "cursor-not-allowed bg-gray-100" : ""
              }`}
              required
            />
            <input
              type="password"
              placeholder="Password"
              name="password"
              value={user.password}
              onChange={handleChange2}
              disabled={isLocked}
              className={`w-full py-3 px-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm hover:shadow-lg transition ${
                isLocked ? "cursor-not-allowed bg-gray-100" : ""
              }`}
              required
            />
            <div className="flex items-center gap-3 mb-3">
              <button
                type="button"
                disabled={isLocked}
                onClick={() => Setrememberme(!rememberme)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-all duration-300 ${
                  rememberme ? "bg-green-500" : "bg-gray-300"
                }`}
                aria-pressed={rememberme}
                aria-label="Toggle remember me"
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-all duration-300 ${
                    rememberme ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-gray-700 font-medium select-none">
                Remember Me
              </span>
            </div>
            <div className="px-3 py-1 mb-2 rounded-2xl border border-gray-300 text-gray-700 text-lg shadow-sm bg-white text-center">
              {tries} / 3 tries remaining
            </div>
            <ForgotPassword/>
            <button
              type="submit"
              disabled={isLocked}
              className={`w-full font-semibold py-3 rounded-lg shadow-md transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 text-lg mt-2 ${
                isLocked
                  ? "bg-gray-500 cursor-not-allowed hover:bg-gray-500"
                  : "bg-[#4C1D95] hover:bg-[#6728c7] text-white"
              }`}
            >
              Login
            </button>
          </form>
          <div className="w-full">
            {loginstatus ? (
              <div className="mt-4 px-4 py-2 rounded-lg bg-green-50 border border-green-400 text-green-700 text-center shadow transition-all duration-300">
                <span className="font-semibold">Great, you are logged in</span>
              </div>
            ) : loginstatus === false ? (
              isLocked ? (
                <CountdownTimer targetTime={Date.now() + LOCKOUT_DURATION} />
              ) : (
                <div className="mt-4 px-4 py-2 rounded-lg bg-red-50 border border-red-400 text-red-700 text-center shadow transition-all duration-300">
                  <span className="font-semibold">
                    Error, the username or password is incorrect.
                    <br />
                    {tries} tries remaining.
                  </span>
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
