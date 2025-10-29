import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";

const LogoutModal = ({ isOpen, onClose }) => {
  const { set_username, set_user_email } = useStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setLoading(true);

    try {
      // Clear session data
      set_user_email(null);
      set_username(null);

      // Optional: clear local/session storage
      localStorage.clear();
      sessionStorage.clear();

      // Close modal immediately for better UX
      onClose();

      // Navigate to login after short delay
      setTimeout(() => {
        navigate("/login", { replace: true });
        setLoading(false);
      }, 800);
    } catch (error) {
      console.error("Logout error:", error);
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white text-black rounded-lg shadow-xl w-[90%] max-w-sm p-6 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Confirm Logout</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer text-gray-500 hover:text-black transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm mb-6 leading-relaxed text-gray-800">
          Are you sure you want to log out? You’ll need to sign in again to access your account.
        </p>

        {/* Footer */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="cursor-pointer px-4 py-2 text-sm font-medium border border-gray-400 rounded-md hover:bg-gray-100 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`cursor-pointer px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md flex items-center justify-center gap-2 transition ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:bg-blue-700"
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Logout"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutModal;
