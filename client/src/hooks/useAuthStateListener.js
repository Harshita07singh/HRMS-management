import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { getLeadsContent } from "../features/leads/leadSlice";

/**
 * Custom hook to listen for authentication state changes and refresh data
 * Triggers data refresh whenever user role changes in localStorage
 */
export const useAuthStateListener = () => {
  const dispatch = useDispatch();
  const prevRoleRef = useRef(localStorage.getItem("role"));

  useEffect(() => {
    const checkAuthState = () => {
      const currentRole = localStorage.getItem("role");
      const currentToken = localStorage.getItem("token");

      // If role changed, refresh all data
      if (currentRole && currentRole !== prevRoleRef.current) {
        prevRoleRef.current = currentRole;

        // Refresh employee data
        dispatch(getLeadsContent());
      }
    };

    // Check auth state changes every 300ms
    const interval = setInterval(checkAuthState, 300);

    return () => clearInterval(interval);
  }, [dispatch]);
};

export default useAuthStateListener;
