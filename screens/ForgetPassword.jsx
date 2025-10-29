import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import useStore from "../store";
import logo from "./../assets/logo_icon.png";
import axios from "axios";

export default function ForgetPassowrd() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const { server } = useStore();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ text: "", type: "" });
  };

  const handleForgetPassword = async () => {
    if (!formData.email) {
      setMessage({ text: "Email field is required", type: "error" });
      return;
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await axios.post(
        `${server}/api/send/auth/reset/password/email`,
        { email: formData.email }
      );

      const result = response.data;

      if (result.success) {
        setMessage({
          text:
            result.message ||
            "A password reset code has been sent to your email.",
          type: "success",
        });

        console.log("Server response:", result);

        // Wait briefly
        setTimeout(() => {
          navigate("/forget/password/email/auth", {
            replace: true,
            state: {
              username: result.data.username,
              email: formData.email,
              verificationCode: result.code,
            },
          });
        }, 1500);
      } else {
        setMessage({
          text: result.message || "Something went wrong. Please try again.",
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error during password reset request:", err);

      if (err.response) {
        setMessage({
          text:
            err.response.data.detail ||
            err.response.data.message ||
            "Failed to send reset email. Please try again.",
          type: "error",
        });
      } else {
        // Handle network or unknown errors
        setMessage({
          text:
            err.message ||
            "An unexpected error occurred while processing your request.",
          type: "error",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          {/* Back Button */}
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-600 hover:text-blue-600 mb-6 transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Login
          </Link>

          <img
            src={logo}
            style={{ height: "38px", width: "160px" }}
            className="justify-self-center mb-2"
          />

          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            Forget Password
          </h1>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
            </div>

            {message.text && (
              <div
                className={`${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                } border px-4 py-3 rounded-md text-sm`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={handleForgetPassword}
              disabled={isLoading}
              className="cursor-pointer w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
