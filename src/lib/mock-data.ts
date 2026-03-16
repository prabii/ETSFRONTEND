export interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  phone: string;
  department: string;
  role: string;
  joiningDate: string;
  status: "active" | "inactive";
  avatar?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime: string;
  checkOutTime?: string;
  location: string;
  status: "present" | "late" | "absent";
  department: string;
}

export const mockEmployees: Employee[] = [
  { id: "1", name: "Arjun Patel", employeeId: "ZY001", email: "arjun@zenithyuga.com", phone: "+91 98765 43210", department: "Engineering", role: "Software Developer", joiningDate: "2024-01-15", status: "active" },
  { id: "2", name: "Priya Sharma", employeeId: "ZY002", email: "priya@zenithyuga.com", phone: "+91 98765 43211", department: "Design", role: "UI/UX Designer", joiningDate: "2024-02-01", status: "active" },
  { id: "3", name: "Rahul Verma", employeeId: "ZY003", email: "rahul@zenithyuga.com", phone: "+91 98765 43212", department: "Engineering", role: "Backend Developer", joiningDate: "2024-03-10", status: "active" },
  { id: "4", name: "Sneha Gupta", employeeId: "ZY004", email: "sneha@zenithyuga.com", phone: "+91 98765 43213", department: "HR", role: "HR Manager", joiningDate: "2023-11-20", status: "active" },
  { id: "5", name: "Vikram Singh", employeeId: "ZY005", email: "vikram@zenithyuga.com", phone: "+91 98765 43214", department: "Marketing", role: "Marketing Lead", joiningDate: "2024-04-05", status: "active" },
  { id: "6", name: "Ananya Das", employeeId: "ZY006", email: "ananya@zenithyuga.com", phone: "+91 98765 43215", department: "Engineering", role: "Frontend Developer", joiningDate: "2024-05-12", status: "inactive" },
  { id: "7", name: "Karan Mehta", employeeId: "ZY007", email: "karan@zenithyuga.com", phone: "+91 98765 43216", department: "Sales", role: "Sales Executive", joiningDate: "2024-06-01", status: "active" },
  { id: "8", name: "Divya Nair", employeeId: "ZY008", email: "divya@zenithyuga.com", phone: "+91 98765 43217", department: "Engineering", role: "QA Engineer", joiningDate: "2024-01-25", status: "active" },
];

export const mockAttendance: AttendanceRecord[] = [
  { id: "1", employeeId: "ZY001", employeeName: "Arjun Patel", date: "2026-03-12", checkInTime: "09:02", checkOutTime: "18:05", location: "Office - Verified", status: "present", department: "Engineering" },
  { id: "2", employeeId: "ZY002", employeeName: "Priya Sharma", date: "2026-03-12", checkInTime: "09:15", checkOutTime: "18:00", location: "Office - Verified", status: "present", department: "Design" },
  { id: "3", employeeId: "ZY003", employeeName: "Rahul Verma", date: "2026-03-12", checkInTime: "09:45", checkOutTime: "18:30", location: "Office - Verified", status: "late", department: "Engineering" },
  { id: "4", employeeId: "ZY004", employeeName: "Sneha Gupta", date: "2026-03-12", checkInTime: "08:55", checkOutTime: "17:50", location: "Office - Verified", status: "present", department: "HR" },
  { id: "5", employeeId: "ZY005", employeeName: "Vikram Singh", date: "2026-03-12", checkInTime: "", checkOutTime: "", location: "", status: "absent", department: "Marketing" },
  { id: "6", employeeId: "ZY007", employeeName: "Karan Mehta", date: "2026-03-12", checkInTime: "09:35", checkOutTime: "18:10", location: "Office - Verified", status: "late", department: "Sales" },
  { id: "7", employeeId: "ZY008", employeeName: "Divya Nair", date: "2026-03-12", checkInTime: "08:50", checkOutTime: "18:00", location: "Office - Verified", status: "present", department: "Engineering" },
  { id: "8", employeeId: "ZY001", employeeName: "Arjun Patel", date: "2026-03-11", checkInTime: "09:00", checkOutTime: "18:00", location: "Office - Verified", status: "present", department: "Engineering" },
  { id: "9", employeeId: "ZY002", employeeName: "Priya Sharma", date: "2026-03-11", checkInTime: "09:10", checkOutTime: "18:05", location: "Office - Verified", status: "present", department: "Design" },
  { id: "10", employeeId: "ZY003", employeeName: "Rahul Verma", date: "2026-03-11", checkInTime: "09:30", checkOutTime: "18:15", location: "Office - Verified", status: "late", department: "Engineering" },
];

export const weeklyAttendanceData = [
  { day: "Mon", present: 7, absent: 1, late: 0 },
  { day: "Tue", present: 6, absent: 1, late: 1 },
  { day: "Wed", present: 5, absent: 2, late: 1 },
  { day: "Thu", present: 7, absent: 0, late: 1 },
  { day: "Fri", present: 6, absent: 1, late: 1 },
];

export const monthlyAttendanceData = [
  { week: "Week 1", attendance: 92 },
  { week: "Week 2", attendance: 88 },
  { week: "Week 3", attendance: 95 },
  { week: "Week 4", attendance: 90 },
];

// Office location for geo-fencing (example: Bangalore)
export const OFFICE_LOCATION = {
  lat: 12.9716,
  lng: 77.5946,
  radius: 100, // meters
  name: "ZenithYuga Tech Pvt Ltd - Head Office",
};
