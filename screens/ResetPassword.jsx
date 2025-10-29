import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useStore from "../store";
import logo from "./../assets/logo_icon.png";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { server } = useStore();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // Extract passed data from state (from previous page)
  const email = state?.email || "";
  const username = state?.username || "";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ text: "", type: "" });
  };

  const handleResetPassword = async () => {
    const { newPassword, confirmPassword } = formData;

    // Client-side validation
    if (!newPassword || !confirmPassword) {
      return setMessage({ text: "All fields are required", type: "error" });
    }

    if (newPassword.length < 6) {
      return setMessage({
        text: "Password must be at least 6 characters long",
        type: "error",
      });
    }

    if (newPassword !== confirmPassword) {
      return setMessage({ text: "Passwords do not match", type: "error" });
    }

    setIsLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch(`${server}/api/update/password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || data.message);

      setMessage({
        text: data.message || "Password updated successfully.",
        type: "success",
      });

      // Redirect after success
      setTimeout(() => navigate("/login", { replace: true }), 2500);
    } catch (err) {
      setMessage({
        text: err.message || "Something went wrong. Try again.",
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !isLoading) handleResetPassword();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-md p-8">
          <img
            src={logo}
            alt="Logo"
            className="justify-self-center mb-2 mx-auto"
            style={{ height: "38px", width: "160px" }}
          />
          <h1 className="text-2xl font-semibold text-gray-900 text-center mb-6">
            Reset Password
          </h1>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                placeholder="Enter new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                placeholder="Confirm new password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            {message.text && (
              <div
                className={`border px-4 py-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              onClick={handleResetPassword}
              disabled={isLoading}
              className="cursor-pointer w-full bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 transition flex items-center justify-center"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Submit"
              )}
            </button>

            <p className="text-center text-sm text-gray-600 mt-3">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
