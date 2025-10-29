import React from "react";
import { Route, Routes } from "react-router-dom";
import Dashboard from "../screens/Dashboard";
import Signup from "../screens/Signup";
import Login from "../screens/Login";
import EmailAuth from "../screens/EmailAuth";
import ForgetPassowrd from "../screens/ForgetPassword";
import ForgetEmailAuth from "../screens/ForgetEmailAuth";
import ResetPassword from "../screens/ResetPassword";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/email/auth" element={<EmailAuth />} />
        <Route path="/forget/password" element={<ForgetPassowrd />} />
        <Route
          path="/forget/password/email/auth"
          element={<ForgetEmailAuth />}
        />
        <Route path="/reset/password" element={<ResetPassword />} />
      </Routes>
    </>
  );
};

export default App;
