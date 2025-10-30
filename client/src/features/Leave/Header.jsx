// src/components/Header.jsx
import { apiFetch } from "./api";

const Header = ({ onLogout }) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const doLogout = async () => {
    await fetch(
      `${
        process.env.REACT_APP_API_BASE || "http://localhost:4000"
      }/api/auth/logout`,
      { method: "POST", credentials: "include" }
    );
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    onLogout();
  };

  return (
    <header className="p-4 bg-base-200 flex justify-between">
      <div className="font-bold">Leave System</div>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div>
              {user.name} ({user.role})
            </div>
            <button className="btn btn-outline btn-sm" onClick={doLogout}>
              Logout
            </button>
          </>
        ) : null}
      </div>
    </header>
  );
};

export default Header;
