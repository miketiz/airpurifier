"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "@/styles/loginstyle.css";
import logo from "@/public/img/Logo/logo102.png";
import logogoogle from "@/public/google-icon.svg";
import logofacebook from "@/public/facebook.svg";
import { toast } from 'react-hot-toast';
import { signIn } from "next-auth/react";
import { Eye, EyeClosed, ArrowLeftToLine } from 'lucide-react';

export default function Login() {
    const router = useRouter();
    const [currentView, setCurrentView] = useState("login"); // "login", "register", "forgotPassword"
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [usernamelogin, setUsernamelogin] = useState("");
    const [passwordlogin, setPasswordlogin] = useState("");
    const [message, setMessage] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Smooth transition function
    const handleViewTransition = (newView: string) => {
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentView(newView);
            setIsTransitioning(false);
        }, 300); // Half of the transition duration
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            const result = await signIn("credentials", {
                username: usernamelogin,
                password: passwordlogin,
                redirect: false
            });

            if (result?.error) {
                console.error("Login failed:", result.error);
                toast.error("ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
            } else {
                console.log("Login successful!");
                toast.success("เข้าสู่ระบบสำเร็จ!");
                router.push("/");
            }
        } catch (error) {
            console.error("Login error:", error);
            toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
    };

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error("รหัสผ่านไม่ตรงกัน!");
            return;
        }

        const payload = {
            username: username,
            email: email,
            password: password,
        };

        console.log("Registering with payload:", payload);

        try {
            const response = await fetch("/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                try {
                    const emailResponse = await fetch("/api/sent-email", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email }),
                    });

                    if (!emailResponse.ok) {
                        console.error("ไม่สามารถส่งอีเมลต้อนรับได้");
                    }
                } catch (emailError) {
                    console.error("เกิดข้อผิดพลาดในการส่งอีเมล:", emailError);
                }

                toast.success("ลงทะเบียนสำเร็จ!");
                console.log("Server response:", data);

                setUsername("");
                setEmail("");
                setPassword("");
                setConfirmPassword("");
                handleViewTransition("login");
            } else {
                toast.error(data.message || "Registration failed");
            }
        } catch (error) {
            console.error("Error during registration:", error);
            toast.error("An error occurred during registration. Please try again.");
        }
    };

    const handleForgotPassword = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            setMessage("กำลังตรวจสอบอีเมล...");

            const response = await fetch("/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว");
                setEmail("");
                setMessage("");
            } else {
                toast.error(data.message || "ไม่พบอีเมลในระบบ");
                setMessage("");
            }
        } catch (error) {
            console.error("Error sending reset password email:", error);
            toast.error("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
            setMessage("");
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signIn("google", {
                callbackUrl: "/",
            });
        } catch (error) {
            console.error("Google login error:", error);
            toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google");
        }
    };

    const handleFacebookLogin = async () => {
        try {
            await signIn("facebook", {
                callbackUrl: "/",
            });
        } catch (error) {
            console.error("Facebook login error:", error);
            toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Facebook");
        }
    };

    const renderLoginForm = () => (
        <>
            <h1 className="h2-login">Login</h1>
            <form onSubmit={handleLogin}>
                <div className="input-field">
                    <label htmlFor="username">Username</label>
                    <input
                        id="username"
                        type="text"
                        placeholder="Enter your username"
                        value={usernamelogin}
                        onChange={(e) => setUsernamelogin(e.target.value)}
                        required
                    />
                </div>
                <div className="input-field">
                    <label htmlFor="password">Password</label>
                    <div className="password-input">
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={passwordlogin}
                            onChange={(e) => setPasswordlogin(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <Eye size={20} /> : <EyeClosed size={20} />}
                        </button>
                    </div>
                </div>
                <div className="forgot-password">
                    <button
                        type="button"
                        className="forgot-password-link"
                        onClick={() => handleViewTransition("forgotPassword")}
                    >
                        Forgot Password?
                    </button>
                </div>
                <div className="button-all">
                    <button type="submit" className="login-button">
                        Login
                    </button>
                </div>
            </form>
            <div className="social-login">
                <button
                    type="button"
                    className="google-login"
                    onClick={handleGoogleLogin}
                >
                    <Image src={logogoogle} alt="Google Logo" className="google-logo" />
                </button>
                <button
                    type="button"
                    className="facebook-login"
                    onClick={handleFacebookLogin}
                >
                    <Image src={logofacebook} alt="Facebook Logo" className="facebook-logo" />
                </button>
            </div>
            <div className="register-section">
                ยังไม่มีบัญชีผู้ใช้?
                <button
                    type="button"
                    className="register-button"
                    onClick={() => handleViewTransition("register")}
                >
                    สมัครที่นี่
                </button>
            </div>
        </>
    );

    const renderForgotPasswordForm = () => (
        <>
            <button
                type="button"
                className="back-to-login"
                onClick={() => handleViewTransition("login")}
            >
                <ArrowLeftToLine size={30} />
            </button>
            <h1 className="h2-login">Forgot Password</h1>
            <form onSubmit={handleForgotPassword}>
                <div className="input-field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="button-all">
                    <button type="submit" className="reset-password">
                        Reset Password
                    </button>
                </div>
            </form>
            {message && <p className="message">{message}</p>}
        </>
    );

    const renderRegisterForm = () => (
        <>
            <button
                type="button"
                className="back-to-login"
                onClick={() => handleViewTransition("login")}
            >
                <ArrowLeftToLine size={30} />
            </button>
            <h1 className="h2-register">Register</h1>
            <form onSubmit={handleRegister}>
                <div className="input-field">
                    <label htmlFor="new-username">Username</label>
                    <input
                        id="new-username"
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="input-field">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-field">
                    <label htmlFor="new-password">Password</label>
                    <input
                        id="new-password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="input-field">
                    <label htmlFor="confirm-password">Confirm Password</label>
                    <input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm your password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                </div>
                <div className="button-all">
                    <button type="submit" className="register-button-regis">
                        Register
                    </button>
                </div>
            </form>
        </>
    );

    return (
        <div className="login-page">
            <Image className="background-image" src={logo} alt="" />
            <div className="login-container">
                <div className="section-logo">
                    <Image src={logo} alt="Logo" />
                    <h1 className="h1-name">MM-AIR</h1>
                </div>
                <div className="section-form">
                    <div className={`login-bg ${isTransitioning ? 'transitioning' : ''}`}>
                        <div className="form-content">
                            {currentView === "login" && renderLoginForm()}
                            {currentView === "forgotPassword" && renderForgotPasswordForm()}
                            {currentView === "register" && renderRegisterForm()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}