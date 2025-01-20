import { createContext, useContext, useEffect, useState } from 'react';
import { ICity, IUser } from '../../types/types';

// Define the full context type
interface UserContextType {
  userData: IUser;
  signup: boolean;
  loggedIn: boolean;
  setInitialUserData: (newUserData: INewUser) => void;
  logout: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (idToken: string) => Promise<void>;
}

// Create context with explicit type
const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  initialUser: IUser;
  children: React.ReactNode;
}

interface INewUser {
  displayName: string;
  username: string;
  fname: string;
  lname: string;
  dob: number;
  city: ICity;
  email: string;
  authCode: string;
}

// Function to fetch user info based on the session cookie
const fetchUserInfo = async (): Promise<IUser | null> => {
  try {
    const response = await fetch('http://localhost:4000/', {
      method: 'POST',
      credentials: 'include', // Ensure cookies are sent with the request
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Credentials': 'true',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch user data:', response.statusText);
      return null;
    }

    const data = await response.json();
    return data.user as IUser;
  } catch (error) {
    console.error('Error fetching user info:', error);
    return null;
  }
};

export function UserProvider({ initialUser, children }: UserProviderProps) {
  const [signup, setSignup] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [userData, setUserData] = useState(initialUser);

  useEffect(() => {
    console.log('User data check:', userData);

    // Check if userData.uuid is blank
    if (!userData.uuid) {
      console.log('Checking for session...');
      fetchUserInfo().then((fetchedUser) => {
        if (fetchedUser) {
          console.log('User data fetched successfully:', fetchedUser);
          setUserData(fetchedUser);
          setLoggedIn(true);
        } else {
          console.log('No valid session found, resetting userData...');
          setUserData(initialUser);
        }
      });
    }
  }, [userData.uuid, initialUser]);

  const setInitialUserData = (newUserData: INewUser) => {
    setUserData((prevState) => {
      return { ...prevState, ...newUserData };
    });

    setSignup(true);
  };

  const login = async (idToken: string, firebaseUid: string) => {
    try {
      const response = await fetch('http://localhost:4000/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken, firebaseUid }),
      });

      if (!response.ok) {
        console.error('Failed to log in:', response.statusText);
        return;
      }

      const result = await response.json();
      console.log('Login response:', result);

      const userData = result.user;

      setUserData(userData);
      setLoggedIn(true);

      console.log('Updated user data:', userData);
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  const register = async (idToken: string) => {
    const response = await fetch('http://localhost:4000/register', {
      method: 'POST',
      credentials: 'include', // Ensure cookies are included in the request
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken, ...userData }),
    });

    if (!response.ok) {
      console.error('Failed to register:', response.statusText);
      return;
    }

    const result = await response.json();
    console.log('User registered successfully:', result);

    setUserData((prevState) => {
      return { ...prevState, ...result };
    });
  };

  const logout = async () => {
    try {
      // Remove session server-side and reset userData
      await fetch('http://localhost:4000/logout', {
        method: 'POST',
        credentials: 'include', // Ensure cookies are included in the request
      });
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoggedIn(false);
      // Reset userData to initial values
      setUserData(initialUser);
      console.log('User logged out and userData reset');
    }
  };

  return (
    <UserContext.Provider
      value={{
        userData,
        signup,
        loggedIn,
        setInitialUserData,
        logout,
        login,
        register,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// Export the hook for using the context
export const useUserContext = () => {
  const context = useContext(UserContext);
  if (context === null) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
};
