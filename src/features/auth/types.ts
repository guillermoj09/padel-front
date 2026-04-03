export type AuthUser = {
  sub?: string;
  id?: string | number;
  email?: string;
  name?: string;
  username?: string;
  roles?: string[];
  [key: string]: unknown;
};

export type AuthMeResponse = {
  user: AuthUser | null;
};

export type AuthLoginResponse = {
  access_token?: string;
  message?: string;
};
