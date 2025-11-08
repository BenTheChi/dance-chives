// A User is not registered until they sign up.  They only have OAuth credentials.
export interface User {
  id: string;
  email: string;
  name: string;
  image: string;
}

export interface RegisteredUser extends User {
  username: string;
  displayName?: string;
  bio?: string;
  dob: Date;
  createdAt: Date;
  ig?: string;
  website?: string;
  city?: string;
}

export interface UserSearchItem {
  id: string;
  username: string;
  displayName: string;
  role?: string; // Optional role property (e.g., "DANCER" for video tags)
}
