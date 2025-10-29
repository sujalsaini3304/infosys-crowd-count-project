import { useState, useRef, useEffect } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useStore from "../store";
import axios from "axios";

export default function ForgetEmailAuth() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { server } = useStore();

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [serverVerificationCode, setServerVerificationCode] = useState(
    String(state?.verificationCode || "")
  );
  const inputRefs = useRef([]);

  // Extract from navigation state
  const username = state?.username || "";
  const email = state?.email || "";

  useEffect(() => {
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  }, []);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setMessage({ text: "", type: "" });

    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    if (e.key === "v" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const digits = text.replace(/\D/g, "").slice(0, 6).split("");
        const newCode = [...code];
        digits.forEach((digit, i) => {
          if (i < 6) newCode[i] = digit;
        });
        setCode(newCode);
        const lastIndex = Math.min(digits.length, 5);
        inputRefs.current[lastIndex]?.focus();
      });
    }
  };

  const handleVerify = async () => {
    const enteredCode = code.join("");

    // Validate input
    if (enteredCode.length !== 6) {
      setMessage({ text: "Please enter all 6 digits.", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Compare entered code with serverVerificationCode
      if (enteredCode !== serverVerificationCode) {
        setMessage({
          text: "Invalid verification code. Please try again.",
          type: "error",
        });
        return;
      }

      setTimeout(
        () =>
          navigate("/reset/password", {
            replace: true,
            state: {
              username: username,
              email: email,
            },
          }),
        2000
      );
    } catch (error) {
      console.error("Signup Error:", error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        "An error occurred. Please try again.";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(
        `${server}/api/send/auth/reset/password/email`,
        {
          username,
          email,
        }
      );

      const result = response.data;

      setMessage({
        text: result.message || "Code resent successfully! 🎉",
        type: "success",
      });

      // Reset inputs
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      // If backend sends new code, update it
      if (result.code) {
        console.log("New verification code:", result.code);
        setServerVerificationCode(String(result.code));
      }
    } catch (error) {
      console.error("Error resending code:", error);
      const message =
        error.response?.data?.message || "An error occurred. Please try again.";
      setMessage({ text: message, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Back Button */}
          <Link
            to="/forget/password"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back
          </Link>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Mail className="text-blue-600" size={32} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Verify Your Email
            </h1>
            <p className="text-gray-600 text-sm">
              We've sent a 6-digit verification code to
            </p>
            <p className="text-gray-900 font-medium mt-1">{email}</p>
          </div>

          {/* Code Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
              Enter Verification Code
            </label>
            <div className="flex justify-center gap-2 md:gap-3">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={isLoading}
                  className="w-12 h-14 md:w-14 md:h-16 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                />
              ))}
            </div>
          </div>

          {/* Message */}
          {message.text && (
            <div
              className={`mb-6 ${
                message.type === "success"
                  ? "bg-green-50 border-green-200 text-green-700"
                  : "bg-red-50 border-red-200 text-red-700"
              } border px-4 py-3 rounded-md text-sm text-center`}
            >
              {message.text}
            </div>
          )}

          {/* Verify Button */}
          <button
            onClick={handleVerify}
            disabled={isLoading || code.some((digit) => !digit)}
            className="cursor-pointer w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center mb-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin mr-2" size={20} />
                Verifying...
              </>
            ) : (
              "Verify Email"
            )}
          </button>

          {/* Resend Code */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={isLoading}
              className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Resend Code
            </button>
          </div>

          {/* Tip */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <p className="text-xs text-gray-600 text-center">
              💡 Tip: You must check the spam folder sometime mail arrives
              there.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
