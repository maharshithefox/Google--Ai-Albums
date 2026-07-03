import React, { useState } from "react";
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "../lib/firebase";
import { Sparkles, Mail, ShieldAlert, KeyRound, Loader2, RefreshCw, AlertCircle, CheckCircle, ArrowRight, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthScreenProps {
  onSuccess: (user: { email: string; displayName: string; photoURL?: string }) => void;
}

export default function AuthScreen({ onSuccess }: AuthScreenProps) {
  const [authMode, setAuthMode] = useState<"options" | "otp" | "password">("options");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [generatedOtp, setGeneratedOtp] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        onSuccess({
          email: result.user.email || "",
          displayName: result.user.displayName || "Google User",
          photoURL: result.user.photoURL || undefined
        });
      }
    } catch (err: any) {
      console.error("Google Auth error:", err);
      // Since we are running inside an iframe, let's gracefully handle the popup blocked or domain auth error
      let errMsg = err?.message || "Google authentication failed.";
      if (err?.code === "auth/popup-blocked" || err?.code === "auth/operation-not-allowed" || err?.message?.includes("iframe")) {
        errMsg = "Popups are restricted in the preview iframe. Click below to use secure Sandbox Bypass Mode.";
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSandboxBypass = () => {
    // Elegant bypass for testing auth in sandboxed iframe previews
    onSuccess({
      email: "demo.photographer@onboardstudio.com",
      displayName: "Alex Mercer",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120"
    });
  };

  const handleSendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError(null);

    // Simulate OTP generation with standard delay
    setTimeout(() => {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(code);
      setOtpSent(true);
      setLoading(false);
    }, 1200);
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    const enteredCode = otpDigits.join("");
    if (enteredCode.length < 6) {
      setError("Please enter all 6 digits of your OTP code.");
      return;
    }

    setLoading(true);
    setError(null);

    setTimeout(() => {
      if (enteredCode === generatedOtp || enteredCode === "123456") {
        onSuccess({
          email: email,
          displayName: email.split("@")[0].toUpperCase() + " (OTP User)"
        });
      } else {
        setError("Invalid verification code. Please check and try again.");
        setLoading(false);
      }
    }, 1000);
  };

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        onSuccess({
          email: result.user.email || "",
          displayName: email.split("@")[0]
        });
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        onSuccess({
          email: result.user.email || "",
          displayName: result.user.displayName || email.split("@")[0]
        });
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Authentication failed.";
      if (err.code === "auth/wrong-password" || err.code === "auth/user-not-found") {
        msg = "Invalid email or password.";
      } else if (err.code === "auth/email-already-in-use") {
        msg = "Email address is already in use.";
      } else {
        msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background glowing ambient elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />

      {/* Brand logo top */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-10 h-10 rounded bg-gradient-to-br from-white to-gray-600 flex items-center justify-center shadow-2xl">
          <div className="w-5 h-5 border-2 border-black rotate-45"></div>
        </div>
        <div>
          <span className="font-sans text-xl font-light tracking-widest text-white uppercase">ONBOARD STUDIO</span>
          <p className="text-[10px] text-white/40 tracking-wider uppercase font-mono">Premium Album Designer</p>
        </div>
      </motion.div>

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6 relative z-10"
      >
        <div className="text-center space-y-2">
          <h2 className="text-xl font-light tracking-wide text-white">
            {authMode === "options" && "Access Workspace"}
            {authMode === "otp" && (otpSent ? "Enter verification code" : "Secure OTP Access")}
            {authMode === "password" && (isSignUp ? "Create Account" : "Sign In")}
          </h2>
          <p className="text-xs text-white/40">
            {authMode === "options" && "Choose an authentication method to continue"}
            {authMode === "otp" && (otpSent ? `We simulated an OTP code to ${email}` : "Verify using single-use 6-digit passcode")}
            {authMode === "password" && "Enter your email and credentials"}
          </p>
        </div>

        {/* Error notification */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-950/20 border border-red-500/30 p-3.5 rounded-xl text-xs text-red-400 flex flex-col gap-3"
            >
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
              
              {/* Offer sandbox bypass option if we hit popup block issues or environment constraints */}
              {(error.includes("iframe") || error.includes("popup") || error.includes("Sandbox")) && (
                <button
                  type="button"
                  onClick={handleSandboxBypass}
                  className="px-3 py-1.5 bg-white text-black font-semibold text-[10px] rounded hover:bg-white/90 transition w-fit self-end font-mono"
                >
                  Launch Sandbox Bypass Mode →
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 1. Main Options View */}
        {authMode === "options" && (
          <div className="space-y-3.5">
            {/* Google provider */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/90 transition flex items-center justify-center gap-2.5 shadow-xl disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Chrome className="w-4 h-4" />
              )}
              Continue with Google Account
            </button>

            {/* OTP provider button */}
            <button
              onClick={() => {
                setError(null);
                setAuthMode("otp");
              }}
              className="w-full py-3 bg-[#111] border border-white/10 text-white font-semibold text-xs rounded-full hover:bg-white/5 transition flex items-center justify-center gap-2.5"
            >
              <Mail className="w-4 h-4 text-white/60" />
              Access with Email OTP
            </button>

            {/* Email/Password provider button */}
            <button
              onClick={() => {
                setError(null);
                setAuthMode("password");
              }}
              className="w-full py-3 text-white/50 hover:text-white text-xs font-mono transition text-center"
            >
              Use Email & Password credentials
            </button>

            <div className="pt-4 border-t border-white/5 text-center">
              <button
                type="button"
                onClick={handleSandboxBypass}
                className="text-[10px] font-mono text-white/40 hover:text-white transition"
              >
                Developer? Use instant Sandbox Bypass mode
              </button>
            </div>
          </div>
        )}

        {/* 2. OTP Code Access */}
        {authMode === "otp" && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="photographer@onboardstudio.com"
                      className="w-full bg-[#111] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20 transition"
                    />
                    <Mail className="w-4 h-4 text-white/30 absolute left-3 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>Send Passcode <ArrowRight className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                {/* Visual OTP instruction panel */}
                <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-center space-y-1.5">
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-wider">Simulated OTP Sent!</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm font-mono font-bold tracking-widest text-emerald-400">{generatedOtp}</span>
                  </div>
                  <p className="text-[9px] text-white/50">For convenience, enter this code or use 123456.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold block text-center">Enter 6-Digit Passcode</label>
                  <div className="flex justify-center gap-2.5">
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        id={`otp-input-${idx}`}
                        type="text"
                        pattern="[0-9]*"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        className="w-10 h-12 bg-[#111] border border-white/10 rounded-xl text-center text-lg font-mono text-white focus:outline-none focus:border-white/30 focus:bg-white/5 transition"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Verify & Access Workspace"
                  )}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                    }}
                    className="text-[10px] font-mono text-white/40 hover:text-white transition"
                  >
                    Resend passcode to different email
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={() => {
                setError(null);
                setAuthMode("options");
              }}
              className="w-full text-center text-[10px] font-mono text-white/40 hover:text-white transition block mt-2"
            >
              ← Back to login options
            </button>
          </div>
        )}

        {/* 3. Password Auth View */}
        {authMode === "password" && (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="photographer@onboardstudio.com"
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20 transition"
                />
                <Mail className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest font-bold">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#111] border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/20 transition"
                />
                <KeyRound className="w-4 h-4 text-white/30 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black font-semibold text-xs rounded-full hover:bg-white/95 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isSignUp ? "Register Account" : "Login Securely"
              )}
            </button>

            <div className="flex justify-between items-center text-[10px] font-mono text-white/40 pt-2">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="hover:text-white transition"
              >
                {isSignUp ? "Already have an account? Sign in" : "Create new account"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setAuthMode("options");
                }}
                className="hover:text-white transition"
              >
                ← Other methods
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
