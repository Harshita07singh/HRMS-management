import moment from "moment";
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import TitleCard from "../../../components/Cards/TitleCard";
import { openModal } from "../../common/modalSlice";
import { deleteLead, getLeadsContent } from "../../leads/leadSlice";
import {
  CONFIRMATION_MODAL_CLOSE_TYPES,
  MODAL_BODY_TYPES,
} from "../../../utils/globalConstantUtil";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { showNotification } from "../../common/headerSlice";
import { useState } from "react";

const TopSideButtons = () => {
  const role = localStorage.getItem("role");
  const dispatch = useDispatch();
};

function Leads() {
  const { leads } = useSelector((state) => state.lead);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const prevRoleRef = useRef(localStorage.getItem("role"));

  useEffect(() => {
    dispatch(getLeadsContent());
  }, []);

  // Refresh data when user role changes (e.g., after login with different role)
  useEffect(() => {
    const checkRoleChange = () => {
      const currentRole = localStorage.getItem("role");
      if (currentRole && currentRole !== prevRoleRef.current) {
        prevRoleRef.current = currentRole;
        dispatch(getLeadsContent());
      }
    };

    const interval = setInterval(checkRoleChange, 500);
    return () => clearInterval(interval);
  }, [dispatch]);

  return (
    <>
      <TitleCard
        title="Current Employees"
        topMargin="mt-2"
        TopSideButtons={<TopSideButtons />}
      >
        <div className="overflow-x-auto w-full h-96 overflow-y-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Full Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Email</th>
                <th>Mobile No.</th>
                <th>Joining Date</th>
                <th>Department</th>
                <th>Designation</th>
                <th>Reporting Manager</th>
                <th>Roles</th>
                <th>Employment Type</th>
                <th>Status</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              {leads
                .filter((l) => {
                  const query = searchQuery.toLowerCase();
                  return (
                    l.employee_id?.toLowerCase().includes(query) ||
                    l.fullname?.toLowerCase().includes(query) ||
                    l.email?.toLowerCase().includes(query)
                  );
                })
                .map((l, k) => (
                  <tr key={k}>
                    <td>{l.employee_id}</td>
                    <td>{l.fullname}</td>
                    <td>{l.gender}</td>
                    <td>{moment(l.DOB).format("DD MMM YY")}</td>
                    <td>{l.email}</td>
                    <td>{l.mobile_num}</td>
                    <td>{moment(l.joining_date).format("DD MMM YY")}</td>
                    <td>{l.department}</td>
                    <td>{l.designation}</td>
                    <td>{l.reportingmanager}</td>
                    <td>{l.role}</td>
                    <td>{l.emplymenttype}</td>
                    <td>
                      <div className="badge">{l.status || "N/A"}</div>
                    </td>
                    <td>{l.document}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </TitleCard>
    </>
  );
}

export default Leads;
