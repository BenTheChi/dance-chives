export const AUTH_LEVELS = {
  BASE_USER: 0,
  CREATOR: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
} as const;

export type AuthLevelKey = keyof typeof AUTH_LEVELS;
