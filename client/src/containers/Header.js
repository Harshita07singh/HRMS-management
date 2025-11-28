import { themeChange } from "theme-change";
import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import BellIcon from "@heroicons/react/24/outline/BellIcon";
import Bars3Icon from "@heroicons/react/24/outline/Bars3Icon";
import MoonIcon from "@heroicons/react/24/outline/MoonIcon";
import SunIcon from "@heroicons/react/24/outline/SunIcon";
import { openRightDrawer } from "../features/common/rightDrawerSlice";
import { RIGHT_DRAWER_TYPES } from "../utils/globalConstantUtil";
import { Link, useNavigate } from "react-router-dom";

function Header() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { noOfNotifications, pageTitle } = useSelector((state) => state.header);

  const [currentTheme, setCurrentTheme] = useState(
    localStorage.getItem("theme")
  );
  const [profile, setProfile] = useState(null);
  const prevRoleRef = useRef(localStorage.getItem("role"));

  // Fetch logged-in employee profile
  const getProfile = async () => {
    try {
      const token = localStorage.getItem("token");

      const res = await fetch("http://localhost:4000/api/employees/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) setProfile(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    }
  };

  useEffect(() => {
    getProfile();
  }, []);

  // Listen for role changes and refresh profile
  useEffect(() => {
    const checkRoleChange = () => {
      const currentRole = localStorage.getItem("role");
      if (currentRole && currentRole !== prevRoleRef.current) {
        prevRoleRef.current = currentRole;
        getProfile();
      }
    };

    const interval = setInterval(checkRoleChange, 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    themeChange(false);
    if (!currentTheme) {
      const prefersDark =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      setCurrentTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  const openNotification = () => {
    dispatch(
      openRightDrawer({
        header: "Notifications",
        bodyType: RIGHT_DRAWER_TYPES.NOTIFICATION,
      })
    );
  };

  const logoutUser = () => {
    localStorage.clear();
    navigate("/login");
  };

  // Generate initials avatar
  const avatar =
    profile?.fullname
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "";

  return (
    <>
      <div className="navbar sticky top-0 bg-base-100 z-10 shadow-md">
        <div className="flex-1">
          <label
            htmlFor="left-sidebar-drawer"
            className="btn btn-primary drawer-button lg:hidden"
          >
            <Bars3Icon className="h-5 inline-block w-5" />
          </label>
          <h1 className="text-2xl font-semibold ml-2">{pageTitle}</h1>
        </div>

        <div className="flex-none">
          {/* THEME TOGGLE */}
          <label className="swap">
            <input type="checkbox" />
            <SunIcon
              data-set-theme="light"
              className={
                "fill-current w-6 h-6 " +
                (currentTheme === "dark" ? "swap-on" : "swap-off")
              }
            />
            <MoonIcon
              data-set-theme="dark"
              className={
                "fill-current w-6 h-6 " +
                (currentTheme === "light" ? "swap-on" : "swap-off")
              }
            />
          </label>

          {/* Notification */}
          <button
            className="btn btn-ghost ml-4 btn-circle"
            onClick={openNotification}
          >
            <div className="indicator">
              <BellIcon className="h-6 w-6" />
              {noOfNotifications > 0 && (
                <span className="indicator-item badge badge-secondary badge-sm">
                  {noOfNotifications}
                </span>
              )}
            </div>
          </button>

          {/* Profile Image / Initials */}
          <div className="dropdown dropdown-end ml-4">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center overflow-hidden">
                {profile?.profileImage ? (
                  <img src={profile.profileImage} alt="profile" />
                ) : (
                  <span className="text-lg font-semibold">{avatar}</span>
                )}
              </div>
            </label>

            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link to="/app/settings-profile">My Profile</Link>
              </li>
              <div className="divider my-0"></div>
              <li>
                <a onClick={logoutUser}>Logout</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

export default Header;
