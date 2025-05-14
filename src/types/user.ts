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
