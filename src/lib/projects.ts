export type ProjectStatus = "active" | "completed" | "on_hold";
export type TaskStatus = "not_started" | "in_progress" | "completed" | "blocked";
export type TaskMode = "sequential" | "parallel";
export type PunchStatus = "open" | "in_progress" | "resolved";
export type PunchPriority = "low" | "medium" | "high";

export interface PunchItem {
  id: string;
  title: string;
  status: PunchStatus;
  priority: PunchPriority;
  createdAt: string;
  dueDate?: string;
  assignee?: string;
}

export interface Task {
  id: string;
  title: string;
  mode: TaskMode;
  status: TaskStatus;
  startDate: string;
  endDate: string;
  dependencyTaskIds: string[];
  punchItems: PunchItem[];
  lastMessage?: string;
  lastMessageFrom?: string;
  lastMessageAt?: string;
  chatMessages?: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  from: "agent" | "sub";
  text: string;
  timestamp: string;
}

export interface Trade {
  id: string;
  name: string;
  tasks: Task[];
}

export interface Project {
  id: string;
  name: string;
  address: string;
  status: ProjectStatus;
  startDate: string;
  endDate?: string;
  trades: Trade[];
}

export const STORAGE_KEY = "gc-tracker-projects";
const STORAGE_VERSION = "v14";

export const statusColors: Record<ProjectStatus, string> = {
  active: "bg-emerald-700 text-emerald-100 ring-1 ring-emerald-500",
  completed: "bg-cyan-700 text-cyan-100 ring-1 ring-cyan-500",
  on_hold: "bg-amber-700 text-amber-100 ring-1 ring-amber-500",
};

export const taskStatusColors: Record<TaskStatus, string> = {
  not_started: "bg-slate-700 text-slate-200 ring-1 ring-slate-500",
  in_progress: "bg-blue-700 text-blue-100 ring-1 ring-blue-500",
  completed: "bg-emerald-700 text-emerald-100 ring-1 ring-emerald-500",
  blocked: "bg-rose-700 text-rose-100 ring-1 ring-rose-500",
};

export const punchStatusColors: Record<PunchStatus, string> = {
  open: "bg-rose-700 text-rose-100 ring-1 ring-rose-500",
  in_progress: "bg-amber-700 text-amber-100 ring-1 ring-amber-500",
  resolved: "bg-slate-700 text-slate-200 ring-1 ring-slate-500",
};

export const priorityColors: Record<PunchPriority, string> = {
  low: "bg-emerald-800 text-emerald-100 ring-1 ring-emerald-500",
  medium: "bg-amber-800 text-amber-100 ring-1 ring-amber-500",
  high: "bg-rose-800 text-rose-100 ring-1 ring-rose-500",
};

export const defaultProjects: Project[] = [
  {
    id: "1",
    name: "Riverside Office Renovation",
    address: "123 Main St, Austin, TX",
    status: "active",
    startDate: "2026-02-01",
    endDate: "2026-04-15",
    trades: [
      {
        id: "tr-1",
        name: "Electrical",
        tasks: [
          {
            id: "t-1",
            title: "Main panel upgrade",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-01",
            endDate: "2026-02-10",
            dependencyTaskIds: [],
            lastMessage: "All done. Passed inspection. Panel is 200amp as requested.",
            lastMessageFrom: "Mike T. (Sparkline Electric)",
            lastMessageAt: "2026-02-10T14:00:00",
            chatMessages: [
              { id: "e1", from: "agent", text: "Mike, main panel upgrade scheduled for Feb 1. Any concerns?", timestamp: "2026-02-01T07:00:00" },
              { id: "e2", from: "sub", text: "Just need access to the meter. City said they'd be here at 8am.", timestamp: "2026-02-01T07:30:00" },
              { id: "e3", from: "agent", text: "Perfect. I'll make sure the area is clear. How long do you think?", timestamp: "2026-02-01T07:31:00" },
              { id: "e4", from: "sub", text: "Panel swap probably 4 hours. Then inspection same day if we're lucky.", timestamp: "2026-02-01T08:00:00" },
              { id: "e5", from: "agent", text: "Great! Panel is in. City passed inspection. 200amp service confirmed.", timestamp: "2026-02-10T14:00:00" },
            ],
            punchItems: [
              {
                id: "p-1",
                title: "Label all breakers",
                status: "resolved",
                priority: "medium",
                createdAt: "2026-02-08T10:00:00",
                dueDate: "2026-02-10",
                assignee: "Sparkline Electric",
              },
            ],
          },
          {
            id: "t-2",
            title: "Rough-in wiring",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-05",
            endDate: "2026-02-15",
            dependencyTaskIds: [],
            lastMessage: "Rough in complete. All boxes mounted and wires pulled. Ready for inspection.",
            lastMessageFrom: "Mike T. (Sparkline Electric)",
            lastMessageAt: "2026-02-15T16:30:00",
            chatMessages: [
              { id: "e6", from: "agent", text: "Mike, rough-in wiring starts Monday. Need anything from the GC?", timestamp: "2026-02-05T07:00:00" },
              { id: "e7", from: "sub", text: "Floor plans with outlet locations would help but I can work from the spec.", timestamp: "2026-02-05T08:00:00" },
              { id: "e8", from: "agent", text: "I'll have those sent over. Any material concerns?", timestamp: "2026-02-05T08:05:00" },
              { id: "e9", from: "sub", text: "Got all the Romex and boxes. Should be good.", timestamp: "2026-02-05T09:00:00" },
              { id: "e10", from: "sub", text: "Rough in complete. All boxes mounted and wires pulled. Ready for inspection.", timestamp: "2026-02-15T16:30:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-3",
            title: "Lighting fixture install",
            mode: "parallel",
            status: "in_progress",
            startDate: "2026-02-16",
            endDate: "2026-02-28",
            dependencyTaskIds: ["t-2"],
            lastMessage: "I'll be there Monday and be done by end of week",
            lastMessageFrom: "Mike T. (Sparkline Electric)",
            lastMessageAt: "2026-02-14T08:30:00",
            chatMessages: [
              { id: "m1", from: "agent", text: "Hi Mike, this is your automated project check-in for the Riverside Office job. Are you ready to start lighting fixture install on Monday, Feb 16?", timestamp: "2026-02-14T07:00:00" },
              { id: "m2", from: "sub", text: "Yes I'll be there monday morning", timestamp: "2026-02-14T08:15:00" },
              { id: "m3", from: "agent", text: "Great! And when do you expect to finish?", timestamp: "2026-02-14T08:16:00" },
              { id: "m4", from: "sub", text: "I'll be there Monday and be done by end of week", timestamp: "2026-02-14T08:30:00" },
            ],
            punchItems: [
              {
                id: "p-2",
                title: "Pendant fixtures at lobby misaligned",
                status: "in_progress",
                priority: "high",
                createdAt: "2026-02-13T11:30:00",
                dueDate: "2026-02-22",
                assignee: "Mike T.",
              },
              {
                id: "p-3",
                title: "Conference room cans need adjusting",
                status: "open",
                priority: "medium",
                createdAt: "2026-02-14T09:00:00",
                dueDate: "2026-02-25",
                assignee: "Sparkline Electric",
              },
            ],
          },
          {
            id: "t-4",
            title: "Final trim and testing",
            mode: "parallel",
            status: "not_started",
            startDate: "2026-02-26",
            endDate: "2026-03-05",
            dependencyTaskIds: ["t-3"],
            lastMessage: "I'll bring extra dimmers. Should be 3 days max once we start.",
            lastMessageFrom: "Mike T. (Sparkline Electric)",
            lastMessageAt: "2026-02-20T10:00:00",
            chatMessages: [
              { id: "e11", from: "agent", text: "Mike, final trim and testing is scheduled to start Feb 26. We'll need all fixtures, switches, and dimmers.", timestamp: "2026-02-20T07:00:00" },
              { id: "e12", from: "sub", text: "Got the list. Just confirming - are we doing smart switches in the conference room?", timestamp: "2026-02-20T08:30:00" },
              { id: "e13", from: "agent", text: "Yes, the owner wants Lutron Caseta in the main office and conference room. Regular switches elsewhere.", timestamp: "2026-02-20T08:45:00" },
              { id: "e14", from: "sub", text: "I'll bring extra dimmers. Should be 3 days max once we start.", timestamp: "2026-02-20T10:00:00" },
            ],
            punchItems: [],
          },
        ],
      },
      {
        id: "tr-2",
        name: "Plumbing",
        tasks: [
          {
            id: "t-5",
            title: "Water main reroute",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-01",
            endDate: "2026-02-08",
            dependencyTaskIds: [],
            lastMessage: "Water main is live. All connections sealed and pressure tested. Ready for inspection.",
            lastMessageFrom: "Carlos (Allied Plumbing)",
            lastMessageAt: "2026-02-08T15:00:00",
            chatMessages: [
              { id: "p1", from: "agent", text: "Carlos, water main reroute starts Feb 1. Need the building shut down for about 4 hours. Will you coordinate with the building manager?", timestamp: "2026-01-31T14:00:00" },
              { id: "p2", from: "sub", text: "Already talked to them. They're giving us the 6am-10am window Tuesday.", timestamp: "2026-01-31T15:00:00" },
              { id: "p3", from: "agent", text: "Perfect. Any permits needed?", timestamp: "2026-01-31T15:05:00" },
              { id: "p4", from: "sub", text: "City already approved the permit. Picking it up Monday.", timestamp: "2026-01-31T16:00:00" },
              { id: "p5", from: "agent", text: "Water main is live. All connections sealed and pressure tested. Ready for inspection.", timestamp: "2026-02-08T15:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-6",
            title: "Restroom fixture install",
            mode: "parallel",
            status: "in_progress",
            startDate: "2026-02-09",
            endDate: "2026-02-20",
            dependencyTaskIds: ["t-5"],
            lastMessage: "Waiting on part, should have it tomorrow",
            lastMessageFrom: "Carlos (Allied Plumbing)",
            lastMessageAt: "2026-02-13T14:22:00",
            chatMessages: [
              { id: "m5", from: "agent", text: "Carlos, checking in on restroom fixtures. Any issues?", timestamp: "2026-02-13T09:00:00" },
              { id: "m6", from: "sub", text: "I need a part for the men's room lavatory. Put in order this morning.", timestamp: "2026-02-13T11:30:00" },
              { id: "m7", from: "agent", text: "Got it. When do you expect the part?", timestamp: "2026-02-13T11:31:00" },
              { id: "m8", from: "sub", text: "Waiting on part, should have it tomorrow", timestamp: "2026-02-13T14:22:00" },
            ],
            punchItems: [
              {
                id: "p-4",
                title: "Men's room lavatory leak",
                status: "open",
                priority: "high",
                createdAt: "2026-02-11T09:15:00",
                dueDate: "2026-02-17",
                assignee: "Allied Plumbing",
              },
              {
                id: "p-5",
                title: "Toilet in women's room running",
                status: "in_progress",
                priority: "medium",
                createdAt: "2026-02-12T14:00:00",
                dueDate: "2026-02-19",
                assignee: "Allied Plumbing",
              },
            ],
          },
          {
            id: "t-7",
            title: "Kitchenette rough-in",
            mode: "sequential",
            status: "in_progress",
            startDate: "2026-02-15",
            endDate: "2026-02-22",
            dependencyTaskIds: [],
            lastMessage: "Got the specs. Customer approved the dishwasher submittal. PDF attached.",
            lastMessageFrom: "Carlos (Allied Plumbing)",
            lastMessageAt: "2026-02-14T11:00:00",
            chatMessages: [
              { id: "m9", from: "agent", text: "Carlos, kitchenette rough-in is scheduled to start Feb 15. Are your materials ready?", timestamp: "2026-02-14T07:00:00" },
              { id: "m10", from: "sub", text: "I don't have the dishwasher specs yet. Can't start without them.", timestamp: "2026-02-14T09:30:00" },
              { id: "m11", from: "agent", text: "I'll follow up with the GC. Can you start once we have them?", timestamp: "2026-02-14T09:31:00" },
              { id: "m12", from: "sub", text: "Can't start until I get the dishwasher specs from you", timestamp: "2026-02-14T10:15:00" },
              { id: "m13", from: "agent", text: "Got the specs. Customer approved the dishwasher submittal. PDF attached.", timestamp: "2026-02-14T11:00:00" },
            ],
            punchItems: [
              {
                id: "p-6",
                title: "Waiting on dishwasher specs from GC",
                status: "open",
                priority: "high",
                createdAt: "2026-02-14T10:00:00",
                assignee: "Allied Plumbing",
              },
            ],
          },
        ],
      },
      {
        id: "tr-3",
        name: "HVAC",
        tasks: [
          {
            id: "t-8",
            title: "Ductwork rough-in",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-03",
            endDate: "2026-02-12",
            dependencyTaskIds: [],
            lastMessage: "All ductwork installed and sealed. Ready for the HVAC unit install next week.",
            lastMessageFrom: "Tom (Cool Air HVAC)",
            lastMessageAt: "2026-02-12T14:00:00",
            chatMessages: [
              { id: "h1", from: "agent", text: "Tom, HVAC rough-in scheduled to start Feb 3. Can you bring extra flex duct?", timestamp: "2026-02-02T10:00:00" },
              { id: "h2", from: "sub", text: "Already loading the truck. Will have everything we need.", timestamp: "2026-02-02T11:00:00" },
              { id: "h3", from: "agent", text: "Great. Any access issues with the ceiling?", timestamp: "2026-02-03T07:00:00" },
              { id: "h4", from: "sub", text: "A few tight spots but nothing we can't handle. Might need one more helper.", timestamp: "2026-02-03T08:00:00" },
              { id: "h5", from: "sub", text: "All ductwork installed and sealed. Ready for the HVAC unit install next week.", timestamp: "2026-02-12T14:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-9",
            title: "VAV box install",
            mode: "parallel",
            status: "in_progress",
            startDate: "2026-02-13",
            endDate: "2026-02-20",
            dependencyTaskIds: ["t-8"],
            lastMessage: "Half the VAV boxes installed. Should finish by Thursday if materials show up.",
            lastMessageFrom: "Tom (Cool Air HVAC)",
            lastMessageAt: "2026-02-17T11:00:00",
            chatMessages: [
              { id: "h6", from: "agent", text: "Tom, VAV box install can start today. The units arrived yesterday.", timestamp: "2026-02-13T07:00:00" },
              { id: "h7", from: "sub", text: "Perfect. I'll bring my installer. How many units?", timestamp: "2026-02-13T07:30:00" },
              { id: "h8", from: "agent", text: "8 VAV boxes total. Floor plans show locations in the specs.", timestamp: "2026-02-13T07:45:00" },
              { id: "h9", from: "sub", text: "Half the VAV boxes installed. Should finish by Thursday if materials show up.", timestamp: "2026-02-17T11:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-10",
            title: "Thermostat programming",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-02-21",
            endDate: "2026-02-25",
            dependencyTaskIds: ["t-9"],
            lastMessage: "I'll need the WiFi credentials and thermostat locations before we start programming.",
            lastMessageFrom: "Tom (Cool Air HVAC)",
            lastMessageAt: "2026-02-18T09:00:00",
            chatMessages: [
              { id: "h10", from: "agent", text: "Tom, thermostat programming is scheduled for Feb 21. Do you have the controls?", timestamp: "2026-02-18T07:00:00" },
              { id: "h11", from: "sub", text: "The Nest Pros are in my truck. Just need the WiFi credentials.", timestamp: "2026-02-18T08:00:00" },
              { id: "h12", from: "agent", text: "I'll get those from the owner. Any other prerequisites?", timestamp: "2026-02-18T08:30:00" },
              { id: "h13", from: "sub", text: "I'll need the WiFi credentials and thermostat locations before we start programming.", timestamp: "2026-02-18T09:00:00" },
            ],
            punchItems: [
              {
                id: "p-7",
                title: "Program thermostats for occupancy schedule",
                status: "open",
                priority: "low",
                createdAt: "2026-02-14T11:00:00",
                dueDate: "2026-02-28",
                assignee: "Cool Air HVAC",
              },
            ],
          },
        ],
      },
      {
        id: "tr-4",
        name: "Drywall",
        tasks: [
          {
            id: "t-11",
            title: "Hang drywall - floors 1-2",
            mode: "sequential",
            status: "in_progress",
            startDate: "2026-02-10",
            endDate: "2026-02-24",
            dependencyTaskIds: [],
            lastMessage: "Floor 1 is 80% done. Moving to floor 2 Monday. Crew of 4 on site.",
            lastMessageFrom: "Ricky (Austin Drywall)",
            lastMessageAt: "2026-02-17T15:00:00",
            chatMessages: [
              { id: "d1", from: "agent", text: "Ricky, drywall crew can start Feb 10. We need 5/8\" type X on the ceiling and 1/2\" on walls.", timestamp: "2026-02-08T10:00:00" },
              { id: "d2", from: "sub", text: "Got it. I'll bring 200 sheets of 5/8\" and 150 of 1/2\".", timestamp: "2026-02-08T11:00:00" },
              { id: "d3", from: "agent", text: "Any special instructions for the fire-rated walls?", timestamp: "2026-02-08T11:30:00" },
              { id: "d4", from: "sub", text: "Just the mechanical room needs type X. Rest is standard.", timestamp: "2026-02-08T12:00:00" },
              { id: "d5", from: "sub", text: "Floor 1 is 80% done. Moving to floor 2 Monday. Crew of 4 on site.", timestamp: "2026-02-17T15:00:00" },
            ],
            punchItems: [
              {
                id: "p-8",
                title: "Corner bead needed at stairwell",
                status: "open",
                priority: "medium",
                createdAt: "2026-02-13T08:00:00",
                dueDate: "2026-02-20",
                assignee: "Austin Drywall",
              },
            ],
          },
          {
            id: "t-12",
            title: "Tape and mud",
            mode: "parallel",
            status: "not_started",
            startDate: "2026-02-20",
            endDate: "2026-03-03",
            dependencyTaskIds: ["t-11"],
            lastMessage: "We can start taping once the second coat is done on floor 2. Probably Feb 22.",
            lastMessageFrom: "Ricky (Austin Drywall)",
            lastMessageAt: "2026-02-18T10:00:00",
            chatMessages: [
              { id: "d6", from: "agent", text: "Ricky, tape and mud starts right after drywall is done. Any delay expected?", timestamp: "2026-02-18T07:00:00" },
              { id: "d7", from: "sub", text: "We're running about a day ahead. Should be done hanging by Feb 19.", timestamp: "2026-02-18T08:00:00" },
              { id: "d8", from: "agent", text: "Great. Do you need the mud and tape delivered?", timestamp: "2026-02-18T08:30:00" },
              { id: "d9", from: "sub", text: "We can start taping once the second coat is done on floor 2. Probably Feb 22.", timestamp: "2026-02-18T10:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-13",
            title: "Sand and finish",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-03-01",
            endDate: "2026-03-10",
            dependencyTaskIds: ["t-12"],
            lastMessage: "I'll need the dust collection system set up before we start sanding.",
            lastMessageFrom: "Ricky (Austin Drywall)",
            lastMessageAt: "2026-02-25T09:00:00",
            chatMessages: [
              { id: "d10", from: "agent", text: "Ricky, sand and finish is scheduled for March 1. Do you have a vacuum system?", timestamp: "2026-02-25T07:00:00" },
              { id: "d11", from: "sub", text: "Got my Festool system. Works great for dust control.", timestamp: "2026-02-25T08:00:00" },
              { id: "d12", from: "agent", text: "Perfect. The owner is sensitive to dust. Will need plastic on all vents.", timestamp: "2026-02-25T08:30:00" },
              { id: "d13", from: "sub", text: "I'll need the dust collection system set up before we start sanding.", timestamp: "2026-02-25T09:00:00" },
            ],
            punchItems: [],
          },
        ],
      },
      {
        id: "tr-5",
        name: "Flooring",
        tasks: [
          {
            id: "t-14",
            title: "Subfloor prep",
            mode: "sequential",
            status: "completed",
            startDate: "2026-02-05",
            endDate: "2026-02-08",
            dependencyTaskIds: [],
            lastMessage: "Subfloor is level and ready. All squeaks addressed. Ready for LVP.",
            lastMessageFrom: "Marcus (TX Flooring)",
            lastMessageAt: "2026-02-08T12:00:00",
            chatMessages: [
              { id: "f1", from: "agent", text: "Marcus, subfloor prep starts Feb 5. Need to check for squeaks and levelness.", timestamp: "2026-02-04T10:00:00" },
              { id: "f2", from: "sub", text: "I'll bring my squeak kit and a level. Any areas of concern?", timestamp: "2026-02-04T11:00:00" },
              { id: "f3", from: "agent", text: "The conference room has a couple soft spots. Might need Sister joists.", timestamp: "2026-02-04T11:30:00" },
              { id: "f4", from: "sub", text: "Checked it out. Just needs blocking. Easy fix.", timestamp: "2026-02-05T08:00:00" },
              { id: "f5", from: "sub", text: "Subfloor is level and ready. All squeaks addressed. Ready for LVP.", timestamp: "2026-02-08T12:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-15",
            title: "LVP installation - floor 1",
            mode: "sequential",
            status: "in_progress",
            startDate: "2026-02-09",
            endDate: "2026-02-18",
            dependencyTaskIds: ["t-14"],
            lastMessage: "Break room is done. Moving to the main office tomorrow. About 60% complete.",
            lastMessageFrom: "Marcus (TX Flooring)",
            lastMessageAt: "2026-02-16T14:00:00",
            chatMessages: [
              { id: "f6", from: "agent", text: "Marcus, LVP install can start Monday Feb 9. Acclimate the material for 48 hours.", timestamp: "2026-02-07T09:00:00" },
              { id: "f7", from: "sub", text: "Material is in the building. Starting the acclimation process now.", timestamp: "2026-02-07T10:00:00" },
              { id: "f8", from: "agent", text: "Great. Any concerns about the pattern layout?", timestamp: "2026-02-09T07:00:00" },
              { id: "f9", from: "sub", text: "I'll do a brick pattern. Looks better and uses less waste.", timestamp: "2026-02-09T07:30:00" },
              { id: "f10", from: "sub", text: "Break room is done. Moving to the main office tomorrow. About 60% complete.", timestamp: "2026-02-16T14:00:00" },
            ],
            punchItems: [
              {
                id: "p-9",
                title: "Transition strip needed at hallway",
                status: "in_progress",
                priority: "medium",
                createdAt: "2026-02-14T13:00:00",
                dueDate: "2026-02-19",
                assignee: "TX Flooring",
              },
              {
                id: "p-10",
                title: "Tile chip in break room - replace plank",
                status: "open",
                priority: "high",
                createdAt: "2026-02-14T15:30:00",
                dueDate: "2026-02-17",
                assignee: "TX Flooring",
              },
            ],
          },
          {
            id: "t-16",
            title: "LVP installation - floor 2",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-02-19",
            endDate: "2026-02-28",
            dependencyTaskIds: ["t-15"],
            lastMessage: "We'll need the elevator access confirmed for Feb 19. Can't carry all the material up stairs.",
            lastMessageFrom: "Marcus (TX Flooring)",
            lastMessageAt: "2026-02-17T10:00:00",
            chatMessages: [
              { id: "f11", from: "agent", text: "Marcus, floor 2 LVP starts right after floor 1 is done. Any special needs?", timestamp: "2026-02-17T07:00:00" },
              { id: "f12", from: "sub", text: "Same as floor 1. Just need confirmation on the elevator.", timestamp: "2026-02-17T08:00:00" },
              { id: "f13", from: "agent", text: "Building manager confirmed elevator access from 7am-5pm daily.", timestamp: "2026-02-17T09:00:00" },
              { id: "f14", from: "sub", text: "We'll need the elevator access confirmed for Feb 19. Can't carry all the material up stairs.", timestamp: "2026-02-17T10:00:00" },
            ],
            punchItems: [],
          },
        ],
      },
      {
        id: "tr-6",
        name: "Painting",
        tasks: [
          {
            id: "t-17",
            title: "Prime walls",
            mode: "parallel",
            status: "not_started",
            startDate: "2026-03-05",
            endDate: "2026-03-10",
            dependencyTaskIds: ["t-13"],
            lastMessage: "I'll need the paint specifications. Primer or primer-sealer?",
            lastMessageFrom: "Steve (Austin Pro Paint)",
            lastMessageAt: "2026-03-01T08:00:00",
            chatMessages: [
              { id: "pn1", from: "agent", text: "Steve, prime walls scheduled for March 5. The drywall should be ready by then.", timestamp: "2026-03-01T07:00:00" },
              { id: "pn2", from: "sub", text: "I'll bring my crew of 3. Will we have access to water for cleanup?", timestamp: "2026-03-01T07:30:00" },
              { id: "pn3", from: "agent", text: "Yes, there's a utility sink in the basement. Will mark it on the floor plan.", timestamp: "2026-03-01T08:00:00" },
              { id: "pn4", from: "sub", text: "I'll need the paint specifications. Primer or primer-sealer?", timestamp: "2026-03-01T09:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-18",
            title: "Finish coat - neutral",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-03-11",
            endDate: "2026-03-18",
            dependencyTaskIds: ["t-17"],
            lastMessage: "What color is the \"neutral\"? I have Sherwin Williams ready but need the code.",
            lastMessageFrom: "Steve (Austin Pro Paint)",
            lastMessageAt: "2026-03-08T09:00:00",
            chatMessages: [
              { id: "pn5", from: "agent", text: "Steve, finish coat starts March 11. Owner picked a neutral white.", timestamp: "2026-03-08T07:00:00" },
              { id: "pn6", from: "sub", text: "Great. Eggshell or satin?", timestamp: "2026-03-08T07:30:00" },
              { id: "pn7", from: "agent", text: "Eggshell in offices, satin in hallways and restrooms.", timestamp: "2026-03-08T08:00:00" },
              { id: "pn8", from: "sub", text: "What color is the \"neutral\"? I have Sherwin Williams ready but need the code.", timestamp: "2026-03-08T09:00:00" },
            ],
            punchItems: [],
          },
          {
            id: "t-19",
            title: "Accent walls - brand colors",
            mode: "sequential",
            status: "not_started",
            startDate: "2026-03-19",
            endDate: "2026-03-25",
            dependencyTaskIds: ["t-18"],
            lastMessage: "Got the brand colors from the owner. Navy blue and forest green. Need sample chips first.",
            lastMessageFrom: "Steve (Austin Pro Paint)",
            lastMessageAt: "2026-03-12T10:00:00",
            chatMessages: [
              { id: "pn9", from: "agent", text: "Steve, accent walls start March 19. Owner wants their company colors.", timestamp: "2026-03-12T07:00:00" },
              { id: "pn10", from: "sub", text: "Great. Can you get me the color codes?", timestamp: "2026-03-12T08:00:00" },
              { id: "pn11", from: "agent", text: "I'll have them by end of week. The owner is sending the brand guidelines.", timestamp: "2026-03-12T09:00:00" },
              { id: "pn12", from: "sub", text: "Got the brand colors from the owner. Navy blue and forest green. Need sample chips first.", timestamp: "2026-03-12T10:00:00" },
            ],
            punchItems: [],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "Downtown Loft Build",
    address: "456 Congress Ave, Austin, TX",
    status: "active",
    startDate: "2026-02-05",
    endDate: "2026-06-01",
    trades: [],
  },
];

const toIsoDate = (value: unknown, fallback: string) => {
  if (typeof value !== "string" || value.length < 10) {
    return fallback;
  }
  return value.slice(0, 10);
};

const toArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : []);

const normalizePunch = (raw: unknown, index: number): PunchItem => {
  const entry = (raw as Record<string, unknown>) ?? {};
  return {
    id: typeof entry.id === "string" ? entry.id : `p-${index + 1}`,
    title:
      typeof entry.title === "string"
        ? entry.title
        : typeof entry.description === "string"
          ? entry.description
          : `Punch Item ${index + 1}`,
    status:
      entry.status === "in_progress" || entry.status === "resolved" || entry.status === "open"
        ? entry.status
        : "open",
    priority: entry.priority === "low" || entry.priority === "high" ? entry.priority : "medium",
    createdAt:
      typeof entry.createdAt === "string"
        ? entry.createdAt
        : typeof entry.timestamp === "string"
          ? entry.timestamp
          : new Date().toISOString(),
    dueDate: typeof entry.dueDate === "string" ? entry.dueDate.slice(0, 10) : undefined,
    assignee: typeof entry.assignee === "string" ? entry.assignee : undefined,
  };
};

const normalizeTask = (raw: unknown, index: number, projectStartDate: string): Task => {
  const entry = (raw as Record<string, unknown>) ?? {};

  const startDate = toIsoDate(entry.startDate, projectStartDate);
  const endDate = toIsoDate(entry.endDate, startDate);

  return {
    id: typeof entry.id === "string" ? entry.id : `t-${index + 1}`,
    title:
      typeof entry.title === "string"
        ? entry.title
        : typeof entry.description === "string"
          ? entry.description
          : `Task ${index + 1}`,
    mode: entry.mode === "parallel" || entry.type === "parallel" ? "parallel" : "sequential",
    status:
      entry.status === "in_progress" ||
      entry.status === "completed" ||
      entry.status === "blocked" ||
      entry.status === "not_started"
        ? entry.status
        : "not_started",
    startDate,
    endDate,
    dependencyTaskIds: toArray<string>(entry.dependencyTaskIds).filter(
      (dependencyId): dependencyId is string => typeof dependencyId === "string"
    ),
    lastMessage: typeof entry.lastMessage === "string" ? entry.lastMessage : undefined,
    lastMessageFrom: typeof entry.lastMessageFrom === "string" ? entry.lastMessageFrom : undefined,
    lastMessageAt: typeof entry.lastMessageAt === "string" ? entry.lastMessageAt : undefined,
    chatMessages: toArray(entry.chatMessages)
      .map((message, messageIndex) => {
        const messageEntry = (message as Record<string, unknown>) ?? {};
        const from = messageEntry.from;
        if (from !== "agent" && from !== "sub") {
          return null;
        }
        const text = typeof messageEntry.text === "string" ? messageEntry.text : "";
        if (!text.trim()) {
          return null;
        }
        return {
          id:
            typeof messageEntry.id === "string"
              ? messageEntry.id
              : `m-${index + 1}-${messageIndex + 1}`,
          from,
          text,
          timestamp:
            typeof messageEntry.timestamp === "string"
              ? messageEntry.timestamp
              : new Date().toISOString(),
        };
      })
      .filter((message): message is ChatMessage => Boolean(message)),
    punchItems: toArray(entry.punchItems).map(normalizePunch),
  };
};

const migrateTradeTasksFromScopes = (
  scopes: unknown[],
  projectStartDate: string,
  tradeId: string
): Task[] => {
  const tasks: Task[] = [];

  scopes.forEach((scopeRaw, scopeIndex) => {
    const scope = (scopeRaw as Record<string, unknown>) ?? {};
    const scopeName = typeof scope.name === "string" ? scope.name : `Scope ${scopeIndex + 1}`;

    const scopeTasks = toArray(scope.tasks).map((task, taskIndex) =>
      normalizeTask(task, taskIndex, projectStartDate)
    );

    tasks.push(...scopeTasks);

    const scopePunch = toArray(scope.punchItems).map(normalizePunch);
    if (scopePunch.length > 0) {
      tasks.push({
        id: `${tradeId}-scope-${scopeIndex + 1}-punch`,
        title: `${scopeName} Punch List`,
        mode: "parallel",
        status: scopePunch.some((item) => item.status !== "resolved") ? "in_progress" : "completed",
        startDate: projectStartDate,
        endDate: projectStartDate,
        dependencyTaskIds: [],
        punchItems: scopePunch,
      });
    }
  });

  return tasks;
};

const normalizeTrade = (raw: unknown, index: number, projectStartDate: string): Trade => {
  const entry = (raw as Record<string, unknown>) ?? {};
  const id = typeof entry.id === "string" ? entry.id : `tr-${index + 1}`;

  const directTasks = toArray(entry.tasks).map((task, taskIndex) =>
    normalizeTask(task, taskIndex, projectStartDate)
  );

  const scopedTasks = migrateTradeTasksFromScopes(toArray(entry.scopes), projectStartDate, id);

  return {
    id,
    name: typeof entry.name === "string" ? entry.name : `Trade ${index + 1}`,
    tasks: [...directTasks, ...scopedTasks],
  };
};

const normalizeProject = (raw: unknown, index: number): Project => {
  const entry = (raw as Record<string, unknown>) ?? {};
  const startDate = toIsoDate(entry.startDate, new Date().toISOString().slice(0, 10));

  const tradesRaw = entry.trades ?? entry.subs;

  return {
    id: typeof entry.id === "string" ? entry.id : `${index + 1}`,
    name: typeof entry.name === "string" ? entry.name : `Project ${index + 1}`,
    address: typeof entry.address === "string" ? entry.address : "",
    status:
      entry.status === "completed" || entry.status === "on_hold" || entry.status === "active"
        ? entry.status
        : "active",
    startDate,
    endDate: typeof entry.endDate === "string" ? entry.endDate.slice(0, 10) : undefined,
    trades: toArray(tradesRaw).map((trade, tradeIndex) =>
      normalizeTrade(trade, tradeIndex, startDate)
    ),
  };
};

export const formatLabel = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const getProjectPunchItems = (project: Project) =>
  project.trades.flatMap((trade) => trade.tasks.flatMap((task) => task.punchItems));

export const isOverdue = (item: PunchItem) => {
  if (!item.dueDate || item.status === "resolved") {
    return false;
  }

  return item.dueDate < new Date().toISOString().slice(0, 10);
};

export const loadProjects = (): Project[] => {
  if (typeof window === "undefined") {
    return defaultProjects;
  }

  const version = window.localStorage.getItem("gc-tracker-version");
  if (version !== STORAGE_VERSION) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProjects));
    window.localStorage.setItem("gc-tracker-version", STORAGE_VERSION);
    return defaultProjects;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return defaultProjects;
  }

  try {
    const parsed = JSON.parse(saved) as unknown;
    if (!Array.isArray(parsed)) {
      return defaultProjects;
    }
    return parsed.map(normalizeProject);
  } catch {
    return defaultProjects;
  }
};

export const saveProjects = (projects: Project[]) => {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};
