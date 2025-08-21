export default interface UserLocal {
  user_id: string;
  salt: string;
  key: string;
  username: string;
  email: string;
  points: number;
  level: number;
  pfp: string
}