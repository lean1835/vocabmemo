import { Request, Response } from "express";
import { catchAsync } from "@common/utils/catchAsync";
import { AuthService } from "./auth.service";

const authService = new AuthService();

export const register = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  res.status(200).json(result);
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = (req as any).user?.id;
  const result = await authService.getMe(userId);
  res.status(200).json(result);
});
