"use client";

import { Session } from "next-auth";
import { createContext, useContext } from "react";

interface AuthContextType {
    session: Session | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
    session,
    children,
}: {
    session: Session | null;
    children: React.ReactNode;
}) {
    return (
        <AuthContext.Provider value={{ session }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
