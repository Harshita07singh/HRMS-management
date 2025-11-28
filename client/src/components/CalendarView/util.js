const moment = require("moment");

module.exports = Object.freeze({
  CALENDAR_EVENT_STYLE: {
    // 🎯 Updated with attendance styles
    Present: "bg-green-200 dark:bg-green-600 dark:text-green-100",
    Leave: "bg-red-200 dark:bg-red-600 dark:text-red-100",
    Absent: "bg-red-300 dark:bg-red-700 dark:text-red-100",
    WeekOff: "bg-gray-300 dark:bg-gray-600 dark:text-gray-100",

    // Existing themes
    BLUE: "bg-blue-200 dark:bg-blue-600 dark:text-blue-100",
    GREEN: "bg-green-200 dark:bg-green-600 dark:text-green-100",
    PURPLE: "bg-purple-200 dark:bg-purple-600 dark:text-purple-100",
    ORANGE: "bg-orange-200 dark:bg-orange-600 dark:text-orange-100",
    PINK: "bg-pink-200 dark:bg-pink-600 dark:text-pink-100",
    MORE: "hover:underline cursor-pointer font-medium",
  },
});
