import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      pagination?: {
        page: number;
        limit: number;
        skip: number;
      };
    }
  }
}

export function paginate(req: Request, _res: Response, next: NextFunction): void {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10) || 50));
  const skip = (page - 1) * limit;

  req.pagination = { page, limit, skip };
  next();
}

export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): { data: T[]; total: number; page: number; limit: number; totalPages: number; hasMore: boolean } {
  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  };
}
