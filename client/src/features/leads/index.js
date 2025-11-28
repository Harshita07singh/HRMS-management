import moment from "moment";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import TitleCard from "../../components/Cards/TitleCard";
import Pagination from "../../components/Pagination";
import { openModal } from "../common/modalSlice";
import { deleteLeadFromServer, getLeadsContent } from "./leadSlice";
import {
  CONFIRMATION_MODAL_CLOSE_TYPES,
  MODAL_BODY_TYPES,
} from "../../utils/globalConstantUtil";
import TrashIcon from "@heroicons/react/24/outline/TrashIcon";
import { showNotification } from "../common/headerSlice";
import { useState } from "react";

const TopSideButtons = () => {
  const role = localStorage.getItem("role");
  const dispatch = useDispatch();

  const openAddNewLeadModal = () => {
    dispatch(
      openModal({
        title: "Add New Lead",
        bodyType: MODAL_BODY_TYPES.LEAD_ADD_NEW,
      })
    );
  };

  return (
    <div className="inline-block float-right">
      {role !== "Employee" && (
        <button
          className="btn px-6 btn-sm normal-case btn-primary"
          onClick={() => openAddNewLeadModal()}
        >
          Add New
        </button>
      )}
    </div>
  );
};

function Leads() {
  const { leads, pagination, isLoading } = useSelector((state) => state.lead);
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    dispatch(getLeadsContent({ page: 1, limit: 10 }));
  }, []);

  const handlePageChange = (newPage) => {
    dispatch(
      getLeadsContent({ page: newPage, limit: pagination.itemsPerPage })
    );
  };

  const getDummyStatus = (index) => {
    if (index % 5 === 0) return <div className="badge">Not Interested</div>;
    else if (index % 5 === 1)
      return <div className="badge badge-primary">In Progress</div>;
    else if (index % 5 === 2)
      return <div className="badge badge-secondary">Sold</div>;
    else if (index % 5 === 3)
      return <div className="badge badge-accent">Need Followup</div>;
    else return <div className="badge badge-ghost">Open</div>;
  };

  const deleteCurrentLead = (lead, index) => {
    dispatch(
      openModal({
        title: "Confirmation",
        bodyType: MODAL_BODY_TYPES.CONFIRMATION,
        extraObject: {
          message: `Are you sure you want to delete this lead?`,
          type: CONFIRMATION_MODAL_CLOSE_TYPES.LEAD_DELETE,
          index,
          _id: lead._id,
        },
      })
    );
  };

  // Filter leads based on search query
  const filteredLeads = leads.filter((l) => {
    const query = searchQuery.toLowerCase();
    return (
      l.employee_id?.toLowerCase().includes(query) ||
      l.fullname?.toLowerCase().includes(query) ||
      l.email?.toLowerCase().includes(query)
    );
  });

  return (
    <>
      <TitleCard
        title="Current Leads"
        topMargin="mt-2"
        TopSideButtons={<TopSideButtons />}
      >
        {/* Search and Loading */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex-1 max-w-xs">
            <input
              type="text"
              placeholder="Search by Employee ID, Name, or Email"
              className="input input-bordered w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {isLoading && (
            <div className="loading loading-spinner loading-sm"></div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
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
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan="15" className="text-center py-8">
                    {isLoading ? (
                      <div className="loading loading-spinner loading-md"></div>
                    ) : (
                      <div className="text-gray-500">
                        {searchQuery
                          ? "No leads found matching your search"
                          : "No leads found"}
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                filteredLeads.map((l, k) => (
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
                    <td>
                      <button
                        className="btn btn-square btn-ghost"
                        onClick={() => deleteCurrentLead(l, k)}
                      >
                        <TrashIcon className="w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 0 && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={pagination.totalItems}
            onPageChange={handlePageChange}
          />
        )}
      </TitleCard>
    </>
  );
}

export default Leads;
