export interface TaskData {
  id: string;
  name: string;
  startDate: string;
  duration: number;
  tradeId: string;
  swimlaneId: string;
  crewSize: number;
  dependencies: string[];
  color: string;
  progress: number;
}

export interface SwimLaneData {
  id: string;
  name: string;
  order: number;
}

export interface ProjectData {
  id: string;
  name: string;
  startDate: string;
  tasks: TaskData[];
  swimlanes: SwimLaneData[];
  createdAt: string;
  updatedAt: string;
}
