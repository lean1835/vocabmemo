import bcrypt from "bcrypt";
import UserModel from "./auth.model";
import { IUser } from "@common/interfaces/auth.interface";
import { ApiError } from "@common/utils/ApiError";
import { generateToken } from "@common/utils/token";
import { IApiResponse } from "@common/interfaces/response.interface";

export class AuthService {
  public async register(payload: any): Promise<IApiResponse<{ user: Partial<IUser>; token: string }>> {
    const { username, email, password } = payload;

    // Check if email already exists
    const existingEmail = await UserModel.findOne({ email });
    if (existingEmail) {
      throw new ApiError(400, "Email này đã được sử dụng");
    }

    // Check if username already exists
    const existingUsername = await UserModel.findOne({ username });
    if (existingUsername) {
      throw new ApiError(400, "Tên đăng nhập này đã được sử dụng");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await UserModel.create({
      username,
      email,
      password: hashedPassword,
    });

    const userObj = newUser.toObject();
    delete userObj.password;

    const token = generateToken({ userId: String(newUser._id) });

    return {
      success: true,
      message: "Đăng ký tài khoản thành công",
      data: {
        user: userObj,
        token,
      },
    };
  }

  public async login(payload: any): Promise<IApiResponse<{ user: Partial<IUser>; token: string }>> {
    const { email, password } = payload;

    // Find user
    const user = await UserModel.findOne({ email });
    if (!user) {
      throw new ApiError(401, "Email hoặc mật khẩu không chính xác");
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      throw new ApiError(401, "Email hoặc mật khẩu không chính xác");
    }

    const userObj = user.toObject();
    delete userObj.password;

    const token = generateToken({ userId: String(user._id) });

    return {
      success: true,
      message: "Đăng nhập thành công",
      data: {
        user: userObj,
        token,
      },
    };
  }

  public async getMe(userId: string): Promise<IApiResponse<Partial<IUser>>> {
    const user = await UserModel.findById(userId).select("-password").lean() as unknown as Partial<IUser>;
    if (!user) {
      throw new ApiError(404, "Không tìm thấy người dùng này");
    }

    return {
      success: true,
      message: "Lấy thông tin cá nhân thành công",
      data: user,
    };
  }
}
