const dummyResources = [
  {
    resourceId: "GPU-SRV1",
    name: "GPU Server 1",
    type: "GPU Server",
    description: "NVIDIA A100, 40GB, Ubuntu 22.04",
    location: "CS Dept. Server Room",
    availability: "Mon-Fri 09:00-22:00",
    status: "Available",
  },
  {
    resourceId: "LAB-ROOM2",
    name: "Lab Room 2",
    type: "Lab Room",
    description: "Computer Lab with 30 seats",
    location: "Building B Floor 1",
    availability: "Mon-Sat 08:00-20:00",
    status: "Available",
  },
  {
    resourceId: "CONF-RM3",
    name: "Conference Room 3",
    type: "Conference Room",
    description: "Seats 20, Projector available",
    location: "Building A Floor 3",
    availability: "Mon-Fri 09:00-18:00",
    status: "Booked",
  },
];

const dummyRequests = [
  {
    id: 1,
    resource: "GPU Server 1",
    user: "Alice",
    date: "2025-10-05",
    duration: 2,
    status: "Pending",
  },
  {
    id: 2,
    resource: "Lab Room 2",
    user: "Bob",
    date: "2025-10-06",
    duration: 3,
    status: "Approved",
  },
  {
    id: 3,
    resource: "Conference Room 3",
    user: "Charlie",
    date: "2025-10-07",
    duration: 1,
    status: "Pending",
  },
];

const dummyUsageHistory = [
  {
    id: 1,
    resource: "GPU Server 1",
    user: "Alice",
    date: "2025-09-10",
    duration: 2,
  },
  {
    id: 2,
    resource: "Lab Room 2",
    user: "Bob",
    date: "2025-09-12",
    duration: 3,
  },
  {
    id: 3,
    resource: "Conference Room 3",
    user: "Charlie",
    date: "2025-09-13",
    duration: 1,
  },
];

export { dummyResources, dummyRequests, dummyUsageHistory };
