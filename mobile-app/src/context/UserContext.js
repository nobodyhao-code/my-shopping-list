import React, { createContext, useContext, useMemo, useState } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user?.username),
      signIn: (nextUser) => setUser(nextUser),
      signOut: () => setUser(null),
      updateUser: (patch) => setUser((current) => ({ ...(current || {}), ...(patch || {}) }))
    }),
    [user]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}
