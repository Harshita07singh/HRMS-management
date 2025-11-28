import LeaveCard from "./components/LeaveCard";
import AttendanceCard from "./components/AttendanceCard";
import EmployeeCard from "./components/EmployeeCard";
import LineChart from "./components/LineChart";
import BarChart from "./components/BarChart";
import PageState from "./components/PageStats";
import { Doughnut } from "react-chartjs-2";
import Doughnutchart from "./components/DoughnutChart";
function Dashboard() {
  return (
    <>
      {/** ---------------------- Different cards ------------------------- */}
      <div className=" grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
        <EmployeeCard />
        <BarChart />
      </div>
      <div className=" grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
        <LeaveCard />
        <AttendanceCard />
      </div>
      <div className=" grid lg:grid-cols-2 mt-4 grid-cols-1 gap-6">
        <Doughnutchart />
        <LineChart />
      </div>
    </>
  );
}

export default Dashboard;
