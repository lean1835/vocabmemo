import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button, Form, Input, Card, Typography, notification } from "antd";
import { BookOutlined } from "@ant-design/icons";
import { useLoginMutation } from "../services/authApi";
import { LogoBrand } from "../../../components/common/LogoBrand";

const { Text } = Typography;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();

  const onFinish = async (values: any) => {
    try {
      const result = await login(values).unwrap();
      if (result.success && result.data?.token) {
        localStorage.setItem("token", result.data.token);
        
        notification.success({
          message: "Đăng nhập thành công",
          description: `Chào mừng bạn quay trở lại, ${result.data.user.username}!`,
          placement: "topRight",
          className: "rounded-xl font-sans"
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      notification.error({
        message: "Đăng nhập thất bại",
        description: error?.data?.message || "Email hoặc mật khẩu không chính xác.",
        placement: "topRight",
        className: "rounded-xl font-sans"
      });
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center bg-slate-50 dark:bg-[#030712] px-4 overflow-hidden transition-colors duration-500">
      
      {/* Decorative ambient glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 dark:bg-blue-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-400/10 dark:bg-purple-600/5 blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-[400px] z-10 flex flex-col items-center">
        
        {/* Brand Icon & Logo */}
        <div className="text-center mb-8 flex flex-col items-center justify-center space-y-4 select-none">
          {/* Elegant blended logo badge */}
          <div className="relative group">
            {/* Soft pulsing glow behind logo */}
            <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/10 rounded-full blur-md group-hover:scale-110 transition-transform duration-500" />
            
            <div className="relative w-16 h-16 rounded-full bg-white dark:bg-white flex items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-slate-100 dark:border-white/10 overflow-hidden p-1.5 transition-all duration-300 group-hover:shadow-[0_8px_30px_rgba(59,130,246,0.2)] group-hover:scale-105">
              <img 
                src="/logomini.png" 
                alt="VocabMemo Icon" 
                className="w-full h-full object-contain rounded-full mix-blend-multiply" 
              />
            </div>
          </div>
          
          <LogoBrand size="xl" />
        </div>

        {/* Login Card */}
        <div className="w-full rounded-[2rem] border border-white/60 dark:border-slate-800/40 shadow-[0_20px_50px_rgba(8,_112,_184,_0.04)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-8 hover:border-slate-200/80 dark:hover:border-slate-700/60 transition-all duration-300">
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">Welcome back</h2>
            <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">Please enter your details to sign in.</p>
          </div>

          <Form
            name="login_form"
            layout="vertical"
            onFinish={onFinish}
            requiredMark={false}
            className="font-sans space-y-5"
          >
            <div>
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1.5 ml-0.5">Email Address</span>
              <Form.Item
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập Email!" },
                  { type: "email", message: "Email không đúng định dạng!" },
                ]}
                style={{ marginBottom: 0 }}
              >
                <Input
                  placeholder="name@example.com"
                  size="large"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white text-xs font-bold focus:border-blue-500 dark:focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all duration-200"
                />
              </Form.Item>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-0.5">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Password</span>
                <a href="#" className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline">Forgot Password?</a>
              </div>
              <Form.Item
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập Mật khẩu!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input.Password
                  placeholder="••••••••"
                  size="large"
                  className="h-11 rounded-xl border-slate-200 dark:border-slate-800 dark:bg-slate-950/50 dark:text-white text-xs font-bold focus:border-blue-500 dark:focus:border-blue-500 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] transition-all duration-200"
                />
              </Form.Item>
            </div>

            <Form.Item style={{ marginBottom: 0, paddingTop: 6 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none font-bold text-xs shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center"
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="text-center mt-8">
          <Text className="text-slate-400 dark:text-slate-500 text-xs font-semibold">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Sign Up
            </Link>
          </Text>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
