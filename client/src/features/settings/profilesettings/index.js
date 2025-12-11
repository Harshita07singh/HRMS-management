import { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import TitleCard from "../../../components/Cards/TitleCard";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/api/employees/me`
      );
      setProfile(res.data);
    } catch (err) {
      console.error("Failed to load profile:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  const avatar = profile.fullname
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <TitleCard title="My Profile" topMargin="mt-2">
      <div className="flex gap-6 items-center mb-8">
        <div className="w-20 h-20 bg-primary text-white rounded-full flex items-center justify-center text-3xl font-bold shadow">
          {avatar}
        </div>

        <div>
          <h2 className="text-xl font-bold">{profile.fullname}</h2>
          <p className="text-gray-500">{profile.email}</p>
          <span className="badge badge-primary mt-2">{profile.role}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 bg-base-200 rounded-lg shadow">
          <h3 className="font-bold mb-3 text-lg">Personal Details</h3>
          <p>
            <strong>Employee ID:</strong> {profile.employee_id}
          </p>
          <p>
            <strong>Gender:</strong> {profile.gender}
          </p>
          <p>
            <strong>DOB:</strong> {moment(profile.DOB).format("DD MMM YYYY")}
          </p>
          <p>
            <strong>Mobile:</strong> {profile.mobile_num}
          </p>
          <p>
            <strong>Status:</strong> {profile.status}
          </p>
        </div>

        <div className="p-5 bg-base-200 rounded-lg shadow">
          <h3 className="font-bold mb-3 text-lg">Work Details</h3>
          <p>
            <strong>Department:</strong> {profile.department}
          </p>
          <p>
            <strong>Designation:</strong> {profile.designation}
          </p>
          <p>
            <strong>Reporting Manager:</strong>{" "}
            {profile.reportingmanager || "—"}
          </p>
          <p>
            <strong>Employment Type:</strong> {profile.emplymenttype}
          </p>
          <p>
            <strong>Joining Date:</strong>{" "}
            {moment(profile.joining_date).format("DD MMM YYYY")}
          </p>
        </div>

        <div className="p-5 bg-base-200 rounded-lg shadow col-span-1 md:col-span-2">
          <h3 className="font-bold mb-3 text-lg">Leave Details</h3>
          <p>
            <strong>Available PL:</strong> {profile.available_PL}
          </p>
        </div>
      </div>
    </TitleCard>
  );
}
