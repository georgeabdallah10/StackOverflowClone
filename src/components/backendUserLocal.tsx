import type UserLocal  from "@/types/userlocal";

export const getUserLocal = (): UserLocal | null => {
  try {
    const userLocal =
      localStorage.getItem("User_logged") || sessionStorage.getItem("User_logged");
    if (!userLocal) {
      return null;
    }

    const user = JSON.parse(userLocal) as UserLocal;
    // Strict validation of required fields

      return user;
  } catch (error) {
    console.error("Error parsing user from storage:", error);
    return null;
  }
};

const updateUserStorageField = (field: string, value: any) => {
  const sessionUser = sessionStorage.getItem('User_logged');
  const localUser = localStorage.getItem('User_logged');

  if (sessionUser) {
    const userObj = JSON.parse(sessionUser);
    userObj[field] = value;
    sessionStorage.setItem('User_logged', JSON.stringify(userObj));
    console.log(`Updated ${field} in sessionStorage`);
  } else if (localUser) {
    const userObj = JSON.parse(localUser);
    userObj[field] = value;
    localStorage.setItem('User_logged', JSON.stringify(userObj));
    console.log(`Updated ${field} in localStorage`);
  } else {
    console.log('No user found in sessionStorage or localStorage.');
  }
};

export default updateUserStorageField;

