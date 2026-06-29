// Mock daily field reports, kept separate from the core entity data so the job
// detail view can grow a richer reporting model without bloating lib/data.ts.

import type { DailyReport } from "./types";

export const dailyReports: DailyReport[] = [
  // Riverside foundation dig
  {
    id: "DR-4201",
    jobId: "JOB-1042",
    date: "2026-06-28",
    submittedBy: "Maria Delgado",
    summary:
      "Cleared the clay seam on the north wall and exported 11 truckloads of spoil. Shoring inspected and approved.",
    weather: "Clear",
    tempHigh: 84,
    crewCount: 6,
    hoursWorked: 51,
  },
  {
    id: "DR-4202",
    jobId: "JOB-1042",
    date: "2026-06-27",
    submittedBy: "Maria Delgado",
    summary:
      "Continued bulk excavation on the east footprint. Dewatering pumps ran through the day after morning rain.",
    weather: "Light rain",
    tempHigh: 76,
    crewCount: 6,
    hoursWorked: 48,
  },
  {
    id: "DR-4203",
    jobId: "JOB-1042",
    date: "2026-06-26",
    submittedBy: "Darnell White",
    summary:
      "Set the next lift of trench boxes and trimmed subgrade along the south wall.",
    weather: "Cloudy",
    tempHigh: 79,
    crewCount: 5,
    hoursWorked: 42,
  },

  // Highway 9 culvert trenching
  {
    id: "DR-4301",
    jobId: "JOB-1043",
    date: "2026-06-27",
    submittedBy: "Tom Reyes",
    summary:
      "Bedded 120 LF of culvert and backfilled in lifts. Traffic control held all day with no incidents.",
    weather: "Clear",
    tempHigh: 88,
    crewCount: 5,
    hoursWorked: 44,
  },
  {
    id: "DR-4302",
    jobId: "JOB-1043",
    date: "2026-06-26",
    submittedBy: "Tom Reyes",
    summary:
      "Trenched the next 90 LF section. County inspector verified the trench box setup mid-morning.",
    weather: "Windy",
    tempHigh: 85,
    crewCount: 5,
    hoursWorked: 46,
  },

  // Northpoint warehouse pad
  {
    id: "DR-4701",
    jobId: "JOB-1047",
    date: "2026-06-28",
    submittedBy: "Lena Park",
    summary:
      "Placed and compacted structural fill on the east half. Geotech ran density tests — all passing.",
    weather: "Clear",
    tempHigh: 90,
    crewCount: 7,
    hoursWorked: 63,
  },
  {
    id: "DR-4702",
    jobId: "JOB-1047",
    date: "2026-06-27",
    submittedBy: "Wes Carter",
    summary:
      "Undercut unsuitable soils in the northeast corner and hauled to the spoil stockpile.",
    weather: "Cloudy",
    tempHigh: 82,
    crewCount: 7,
    hoursWorked: 60,
  },

  // Maple Street storm drain
  {
    id: "DR-4801",
    jobId: "JOB-1048",
    date: "2026-06-29",
    submittedBy: "Tom Reyes",
    summary:
      "Set the final catch basin and tied into the junction structure. Ready for paving sub on July 1.",
    weather: "Clear",
    tempHigh: 86,
    crewCount: 4,
    hoursWorked: 34,
  },
  {
    id: "DR-4802",
    jobId: "JOB-1048",
    date: "2026-06-26",
    submittedBy: "Aisha Bello",
    summary:
      "Installed 80 LF of pipe and the second catch basin. Backfilled and compacted the trench.",
    weather: "Light rain",
    tempHigh: 74,
    crewCount: 4,
    hoursWorked: 32,
  },

  // Old mill demolition prep (on hold)
  {
    id: "DR-4501",
    jobId: "JOB-1045",
    date: "2026-06-11",
    submittedBy: "Lena Park",
    summary:
      "Stripped and stockpiled topsoil across the south yard before the abatement hold took effect.",
    weather: "Cloudy",
    tempHigh: 77,
    crewCount: 4,
    hoursWorked: 30,
  },

  // Dockside retaining wall footing (completed)
  {
    id: "DR-3901",
    jobId: "JOB-1039",
    date: "2026-05-28",
    submittedBy: "Lena Park",
    summary:
      "Final survey as-builts shot and delivered. Demobilized equipment from Pier 4.",
    weather: "Clear",
    tempHigh: 71,
    crewCount: 3,
    hoursWorked: 22,
  },
];

/** Reports for a single job, most recent first. */
export function reportsForJob(jobId: string): DailyReport[] {
  return dailyReports
    .filter((report) => report.jobId === jobId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
