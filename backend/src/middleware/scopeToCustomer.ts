import { Request, Response, NextFunction } from 'express';

export function scopeToCustomer(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role === 'CLIENT' && req.user.customerId) {
    req.scopeFilter = { customerId: req.user.customerId };
  } else {
    req.scopeFilter = undefined;
  }
  next();
}
