// Adds `userId` to Express' Request type. It is set by the requireAuth middleware.
declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

export {};
