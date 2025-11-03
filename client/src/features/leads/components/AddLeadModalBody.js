import { useState } from "react";
import { useDispatch } from "react-redux";
import InputText from "../../../components/Input/InputText";
import ErrorText from "../../../components/Typography/ErrorText";
import { showNotification } from "../../common/headerSlice";
import { addNewLead } from "../leadSlice";
import { useEffect } from "react";

const INITIAL_LEAD_OBJ = {
  employee_id: "",
  fullname: "",
  gender: "",
  DOB: "",
  email: "",
  mobile_num: "",
  joining_date: "",
  department: "",
  designation: "",
  reportingmanager: "",
  emplymenttype: "",
  status: "",
  document: "",
  role: "",
};

function AddLeadModalBody({ closeModal }) {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [leadObj, setLeadObj] = useState(INITIAL_LEAD_OBJ);
  const [managers, setManagers] = useState([]);
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetch(
          "http://localhost:4000/api/employees/project-managers"
        );

        if (!response.ok) {
          throw new Error(`Server error: ${response.status}`);
        }

        const data = await response.json();

        const filteredManagers = data.filter((emp) =>
          ["Project Manager"].includes(emp.role)
        );

        setManagers(filteredManagers);
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    };

    fetchManagers();
  }, []);

  const saveNewLead = async () => {
    if (leadObj.fullname.trim() === "") {
      return setErrorMessage("Fullname is required!");
    } else if (leadObj.email.trim() === "") {
      return setErrorMessage("Email id is required!");
    } else {
      setLoading(true);
      setErrorMessage("");

      const newLeadObj = {
        ...leadObj,
        id: Date.now(),
        employee_id: leadObj.employee_id,
        email: leadObj.email,
        fullname: leadObj.fullname,
        gender: leadObj.gender,
        DOB: leadObj.DOB,
        mobile_num: leadObj.mobile_num,
        joining_date: leadObj.joining_date,
        department: leadObj.department,
        designation: leadObj.designation,
        reportingmanager: leadObj.reportingmanager,
        emplymenttype: leadObj.emplymenttype,
        status: leadObj.status,
        document: leadObj.document,
        role: leadObj.role, // or use UUID
      };

      try {
        const response = await fetch("http://localhost:4000/api/employees", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newLeadObj),
        });

        if (!response.ok) {
          throw new Error("Failed to save lead");
        }

        const result = await response.json();

        dispatch(addNewLead({ newLeadObj: result }));
        dispatch(showNotification({ message: "New Lead Added!", status: 1 }));
        closeModal();
      } catch (error) {
        setErrorMessage(error.message || "Something went wrong!");
      } finally {
        setLoading(false);
      }
    }
  };

  const updateFormValue = ({ updateType, value }) => {
    setErrorMessage("");
    setLeadObj({ ...leadObj, [updateType]: value });
  };

  return (
    <>
      <InputText
        type="auto"
        defaultValue={leadObj.employee_id}
        updateType="employee_id"
        containerStyle="mt-4"
        labelTitle="Employee ID"
        updateFormValue={updateFormValue}
      />
      <InputText
        type="text"
        defaultValue={leadObj.fullname}
        updateType="fullname"
        containerStyle="mt-4"
        labelTitle="Full Name"
        updateFormValue={updateFormValue}
      />

      <InputText
        type="email"
        defaultValue={leadObj.email}
        updateType="email"
        containerStyle="mt-4"
        labelTitle="Email Id"
        updateFormValue={updateFormValue}
      />

      <InputText
        type="number"
        defaultValue={leadObj.mobile_num}
        updateType="mobile_num"
        containerStyle="mt-4"
        labelTitle="Mobile Number"
        updateFormValue={updateFormValue}
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Gender
        </label>
        <select
          value={leadObj.gender}
          onChange={(e) =>
            updateFormValue({ updateType: "gender", value: e.target.value })
          }
          className="input input-bordered w-full"
        >
          <option value="">Select Gender</option>
          <option value="Male">Male</option>
          <option value="Female">Female</option>
          <option value="Other">Other</option>
        </select>
      </div>

      <InputText
        type="date"
        defaultValue={leadObj.DOB}
        updateType="DOB"
        containerStyle="mt-4"
        labelTitle="Date of Birth"
        updateFormValue={updateFormValue}
      />

      <InputText
        type="date"
        defaultValue={leadObj.joining_date}
        updateType="joining_date"
        containerStyle="mt-4"
        labelTitle="Joining Date"
        updateFormValue={updateFormValue}
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Department
        </label>
        <select
          value={leadObj.department}
          onChange={(e) =>
            updateFormValue({ updateType: "department", value: e.target.value })
          }
          className="input input-bordered w-full"
        >
          <option value="">Select Department</option>
          <option value="Development">Development</option>
          <option value="Marketing">Marketing</option>
          <option value="Human Resource">Human Resource</option>
          <option value="Sales">Sales</option>
        </select>
      </div>

      <InputText
        type="text"
        defaultValue={leadObj.designation}
        updateType="designation"
        containerStyle="mt-4"
        labelTitle="Designation"
        updateFormValue={updateFormValue}
      />

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Reporting Manager
        </label>
        <select
          value={leadObj.reportingmanager}
          onChange={(e) =>
            updateFormValue({
              updateType: "reportingmanager",
              value: e.target.value,
            })
          }
          className="input input-bordered w-full"
        >
          <option value="">Select Reporting Manager</option>
          {managers.map((manager) => (
            <option key={manager.id} value={manager.fullname}>
              {manager.fullname}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Employment Type
        </label>
        <select
          value={leadObj.emplymenttype}
          onChange={(e) =>
            updateFormValue({
              updateType: "emplymenttype",
              value: e.target.value,
            })
          }
          className="input input-bordered w-full"
        >
          <option value="">Select Employment Type</option>
          <option value="FullTime">Full-time</option>
          <option value="Intern">Intern</option>
          <option value="Contract">Contract</option>
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Status
        </label>
        <select
          value={leadObj.status}
          onChange={(e) =>
            updateFormValue({ updateType: "status", value: e.target.value })
          }
          className="input input-bordered w-full"
        >
          <option value="">Select Status</option>
          <option value="Active">Active</option>
          <option value="On Notice">On Notice</option>
          <option value="Resigned">Resigned</option>
        </select>
      </div>

      <InputText
        type="file"
        defaultValue={leadObj.document}
        updateType="document"
        containerStyle="mt-4"
        labelTitle="Document"
        updateFormValue={updateFormValue}
      />
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Roles
        </label>
        <select
          value={leadObj.role}
          onChange={(e) =>
            updateFormValue({
              updateType: "role",
              value: e.target.value,
            })
          }
          className="input  w-full"
        >
          <option value=""> Select Roles</option>
          <option value="Employee">Employee</option>
          <option value="Team Lead">Team Lead</option>
          <option value="Project Manager">Project Manager</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      <ErrorText styleClass="mt-16">{errorMessage}</ErrorText>
      <div className="modal-action">
        <button className="btn btn-ghost" onClick={() => closeModal()}>
          Cancel
        </button>
        <button className="btn btn-primary px-6" onClick={() => saveNewLead()}>
          Save
        </button>
      </div>
    </>
  );
}

export default AddLeadModalBody;
