export interface AuthPayload {
  userId: string;
  email: string;
  role: 'player' | 'creator' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}
