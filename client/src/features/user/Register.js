// import { useState, useRef } from "react";
// import { Link } from "react-router-dom";
// import LandingIntro from "./LandingIntro";
// import ErrorText from "../../components/Typography/ErrorText";
// import InputText from "../../components/Input/InputText";

// function Register() {
//   const INITIAL_REGISTER_OBJ = {
//     name: "",
//     password: "",
//     email: "",
//   };

//   const [loading, setLoading] = useState(false);
//   const [errorMessage, setErrorMessage] = useState("");
//   const [registerObj, setRegisterObj] = useState(INITIAL_REGISTER_OBJ);

//   const submitForm = async (e) => {
//     e.preventDefault();
//     setErrorMessage("");

//     if (registerObj.name.trim() === "")
//       return setErrorMessage("Name is required!");
//     if (registerObj.email.trim() === "")
//       return setErrorMessage("Email Id is required!");
//     if (registerObj.password.trim() === "")
//       return setErrorMessage("Password is required!");

//     try {
//       setLoading(true);

//       const response = await fetch("http://localhost:4000/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           name: registerObj.name,
//           email: registerObj.email,
//           password: registerObj.password,
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || "Registration failed");
//       }

//       localStorage.setItem("token", data.token);
//       window.location.href = "/app/welcome";
//     } catch (err) {
//       setErrorMessage(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };
//   const updateFormValue = ({ updateType, value }) => {
//     setErrorMessage("");
//     setRegisterObj({ ...registerObj, [updateType]: value });
//   };

//   return (
// <div className="min-h-screen bg-base-200 flex items-center">
//   <div className="card mx-auto w-full max-w-5xl  shadow-xl">
//     <div className="grid  md:grid-cols-2 grid-cols-1  bg-base-100 rounded-xl">
//       <div className="">
//         <LandingIntro />
//       </div>
//       <div className="py-24 px-10">
//             <h2 className="text-2xl font-semibold mb-2 text-center">
//               Register
//             </h2>
//             <form onSubmit={(e) => submitForm(e)}>
//               <div className="mb-4">
//                 <InputText
//                   defaultValue={registerObj.name}
//                   updateType="name"
//                   containerStyle="mt-4"
//                   labelTitle="Name"
//                   updateFormValue={updateFormValue}
//                 />

//                 <InputText
//                   defaultValue={registerObj.email}
//                   updateType="email"
//                   containerStyle="mt-4"
//                   labelTitle="Email Id"
//                   updateFormValue={updateFormValue}
//                 />

//                 <InputText
//                   defaultValue={registerObj.password}
//                   type="password"
//                   updateType="password"
//                   containerStyle="mt-4"
//                   labelTitle="Password"
//                   updateFormValue={updateFormValue}
//                 />
//               </div>

//               <ErrorText styleClass="mt-8">{errorMessage}</ErrorText>
//               <button
//                 type="submit"
//                 className={
//                   "btn mt-2 w-full btn-primary" + (loading ? " loading" : "")
//                 }
//               >
//                 Register
//               </button>

//               <div className="text-center mt-4">
//                 Already have an account?{" "}
//                 <Link to="/login">
//                   <span className="  inline-block  hover:text-primary hover:underline hover:cursor-pointer transition duration-200">
//                     Login
//                   </span>
//                 </Link>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Register;

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
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

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
      <div className="card mx-auto w-full max-w-5xl  shadow-xl">
        <div className="grid  md:grid-cols-2 grid-cols-1  bg-base-100 rounded-xl">
          <div className="">
            <LandingIntro />
          </div>
          <div className="py-24 px-10">
            <form
              onSubmit={handleSubmit}
              className="bg-white shadow-lg rounded-xl p-6 w-80"
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
                  className="text-blue-600 cursor-pointer"
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
