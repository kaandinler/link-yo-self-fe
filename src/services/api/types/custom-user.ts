// Custom user model for your own FastAPI backend
export type CustomUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  // Add any additional fields your backend returns
  username?: string;
  isActive?: boolean;
  role?: string;
};

// Custom tokens response from your backend
export type CustomTokens = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

// Response structure for login
export type CustomLoginResponse = {
  user: CustomUser;
  tokens: CustomTokens;
};
