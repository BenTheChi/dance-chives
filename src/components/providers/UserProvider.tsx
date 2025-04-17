import { createContext, useContext, useState } from "react";
import { User, RegisteredUser } from "@/types/user";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isRegistered: boolean;
  setIsRegistered: (isRegistered: boolean) => void;
}

const UserContext = createContext<UserContextType | null>(null);

interface UserProviderProps {
  initialUser: User | null;
  children: React.ReactNode;
}

export function UserProvider({ initialUser, children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [isRegistered, setIsRegistered] = useState(false);

  return (
    <UserContext.Provider
      value={{ user, setUser, isRegistered, setIsRegistered }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }
  return context;
}
