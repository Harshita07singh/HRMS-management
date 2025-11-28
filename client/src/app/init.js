import axios from "axios";

const initializeApp = () => {
  // Setting base URL for all API request via axios
  axios.defaults.baseURL = process.env.REACT_APP_BASE_URL;

  // Disable caching for all requests
  axios.defaults.headers.common["Cache-Control"] =
    "no-cache, no-store, must-revalidate";
  axios.defaults.headers.common["Pragma"] = "no-cache";
  axios.defaults.headers.common["Expires"] = "0";

  if (!process.env.NODE_ENV || process.env.NODE_ENV === "development") {
    // dev code
  } else {
    // Prod build code

    // Removing console.log from prod
    console.log = () => {};

    // init analytics here
  }
};

export default initializeApp;
