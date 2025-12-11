import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LandingIntro from "./LandingIntro";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Employee");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch(
        `${process.env.REACT_APP_BASE_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, role }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      alert("Registration successful! Please login.");
      navigate("/login");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center">
      <div className="card mx-auto w-full max-w-5xl shadow-xl">
        <div className="grid md:grid-cols-2 grid-cols-1 bg-base-100 rounded-xl">
          <div>
            <LandingIntro />
          </div>
          <div className="py-24 px-10">
            <form
              onSubmit={handleSubmit}
              className=" shadow-lg rounded-xl p-6 w-full max-w-md mx-auto"
            >
              <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

              {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

              <input
                type="text"
                placeholder="Full Name"
                className="w-full border p-2 mb-3 rounded"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <input
                type="email"
                placeholder="Email"
                className="w-full border p-2 mb-3 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <input
                type="password"
                placeholder="Password"
                className="w-full border p-2 mb-3 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <select
                className="w-full border p-2 mb-4 rounded"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="Employee">Employee</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Admin">Admin</option>
              </select>

              <button
                type="submit"
                className="bg-green-500 text-white w-full p-2 rounded hover:bg-green-600"
              >
                Register
              </button>

              <p className="mt-3 text-center text-sm">
                Already have an account?{" "}
                <span
                  className="text-blue-400 cursor-pointer"
                  onClick={() => navigate("/login")}
                >
                  Login
                </span>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
