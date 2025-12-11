import React, { useState, useEffect } from "react";
import axios from "axios";
import CalendarView from "../../components/CalendarView";
import moment from "moment";
import { useDispatch } from "react-redux";
import { openRightDrawer } from "../common/rightDrawerSlice";
import { RIGHT_DRAWER_TYPES } from "../../utils/globalConstantUtil";
import { showNotification } from "../common/headerSlice";

const API = axios.create({
  baseURL: `${process.env.REACT_APP_BASE_URL}/api`,
});
API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

function Calendar() {
  const dispatch = useDispatch();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchCalendarData();
  }, []);

  const fetchCalendarData = async (
    month = new Date().getMonth() + 1,
    year = new Date().getFullYear()
  ) => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      let attendanceRes, leavesRes;

      if (user.role === "Admin") {
        attendanceRes = await API.get(
          `/attendance?month=${month}&year=${year}&limit=1000`
        );
        leavesRes = await API.get(
          `/leaves?month=${month}&year=${year}&limit=1000`
        );
      } else {
        attendanceRes = await API.get(
          `/attendance/my?month=${month}&year=${year}&limit=100`
        );
        leavesRes = await API.get(
          `/leaves/my-leaves?month=${month}&year=${year}&limit=100`
        );
      }

      const calendarEvents = [];

      // ⭐ Attendance
      const attendanceData = attendanceRes.data.data || attendanceRes.data;
      attendanceData.forEach((att) => {
        calendarEvents.push({
          title: att.attendanceDay, // Present / Absent / WeekOff
          theme: att.attendanceDay, // 👌 Theme now directly matches CALENDAR_EVENT_STYLE key
          startTime: moment(att.date).startOf("day"),
          endTime: moment(att.date).endOf("day"),
        });
      });

      // ⭐ Leaves
      const leavesData = leavesRes.data.data || leavesRes.data;
      leavesData.forEach((lv) => {
        if (lv.status === "Approved") {
          calendarEvents.push({
            title: `Leave (${lv.reason})`,
            theme: "Leave", // 👌 Correct mapping
            startTime: moment(lv.startDate),
            endTime: moment(lv.endDate),
          });
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error("Calendar API Error:", error);
      dispatch(
        showNotification({ message: "Failed to load calendar data", status: 0 })
      );
    }
  };

  const openDayDetail = ({ filteredEvents, title }) => {
    dispatch(
      openRightDrawer({
        header: `Details for ${title}`,
        bodyType: RIGHT_DRAWER_TYPES.CALENDAR_EVENTS,
        extraObject: { filteredEvents },
      })
    );
  };

  return <CalendarView calendarEvents={events} openDayDetail={openDayDetail} />;
}

export default Calendar;
