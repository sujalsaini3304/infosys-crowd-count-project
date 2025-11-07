import React, { useState } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useStore from "../store";
import axios from "axios";

const DeleteModal = ({ isOpen, onClose }) => {
  const { user_email, set_user_email, set_username } = useStore();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setLoading(true);

      if (!user_email) {
        return;
      }

      console.log("Deleting user with email:", user_email);
      const response = await axios.post(
        "http://localhost:8000/api/delete/user",
        { email: user_email }, // ✅ matches Pydantic model
        {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        }
      );

      if (response.data?.success) {
        console.log("User deleted:", response.data.message);
        
        set_user_email(null);
        set_username(null);
        localStorage.clear();
        sessionStorage.clear();

        setTimeout(() => navigate("/login", { replace: true }), 1000);
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data?.message || "Unknown server response");
      }
    } catch (error) {
      console.error("Delete user error:", error);

      // Handle various error cases
      if (error.response) {
        // Server responded with an error status code
        const status = error.response.status;
        if (status === 404) {
          return { success: false, message: "User not found" };
        } else if (status === 400) {
          return { success: false, message: "Invalid email format" };
        } else if (status === 500) {
          return { success: false, message: "Internal server error" };
        } else {
          return {
            success: false,
            message: error.response.data?.detail || "Unexpected error",
          };
        }
      } else if (error.request) {
        // No response received
        return {
          success: false,
          message: "No response from server. Check your network.",
        };
      } else {
        // Something went wrong setting up the request
        return { success: false, message: "Request error: " + error.message };
      }
    } finally {
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
          <h2 className="text-lg font-semibold">Confirm Deletion</h2>
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
          Are you sure you want to permanently delete your account? This action
          cannot be undone and all associated data will be lost.
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
            className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md flex items-center justify-center gap-2 transition ${
              loading ? " opacity-80" : "hover:bg-red-700 cursor-pointer"
            }`}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Delete"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
