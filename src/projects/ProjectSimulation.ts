import { ProjectDefinition } from "./ProjectDefinition";
import { Day } from "../journal/types";
import { calculateTaskEstimate, expandTaskOwners } from "./util";
import { compareDays } from "../util";

export type SimulatedProject = {
  checkpoints: Array<Checkpoint>;
};

export type Checkpoint = {
  id: number;
  day: Day;
  completedTasks: Array<string>;
  incoming: Array<TaskExecution>;
  outgoing: Array<TaskExecution>;
};

type TaskSimulationOutcome = {
  taskId: string;
  personId: string;
  startDay: Day;
  endDay: Day;
};

type TaskExecution = {
  taskId?: string;
  personId?: string;
  float?: number;
  estimate?: number;
  startDay: Day;
  endDay: Day;
  from: number;
  to: number;
};

export class ProjectSimulation {
  private readonly project: ProjectDefinition;
  private readonly workDayClassifier: (day: Day) => boolean;
  private readonly personIds: string[];
  private readonly taskIds: string[];
  private readonly taskDependencyGroups: Map<string, string[]>;

  public constructor(
    project: ProjectDefinition,
    workDayClassifier: (day: Day) => boolean,
  ) {
    this.project = project;
    this.workDayClassifier = workDayClassifier;
    this.personIds = Object.keys(project.admin.person);
    this.taskIds = Object.keys(project.tasks);
    this.taskDependencyGroups = this.calculateTaskDependencyGroups();
  }

  public run(): SimulatedProject {
    const checkpoints = new Array<Checkpoint>();
    this.createFirstCheckpoint(checkpoints);
    const currentPersonCheckpoints =
      this.initializePersonCheckpoints(checkpoints);
    const taskCheckpoints = this.initializeTaskCheckpoints();
    const floats = this.calculateFloats(); // TODO: This may need to be re-evaluated after each checkpoint
    const incompleteTasks = Array.from(this.taskIds);

    let nextCheckpointId = 1;
    while (incompleteTasks.length > 0) {
      const sortedIncompleteTasks = this.sortedTasksByFloats(
        incompleteTasks,
        floats,
      );
      const advancedCheckpointId = this.advanceNextTask(
        sortedIncompleteTasks,
        checkpoints,
        nextCheckpointId,
        floats,
        currentPersonCheckpoints,
        taskCheckpoints,
        incompleteTasks,
      );
      if (advancedCheckpointId === nextCheckpointId) {
        break;
      }
      nextCheckpointId = advancedCheckpointId;
    }

    return {
      checkpoints: this.optimizeCheckpoints(checkpoints),
    };
  }

  private initializeTaskCheckpoints() {
    const taskCheckpoints = new Map<string, Array<Checkpoint>>();
    this.taskIds.forEach((taskId) => {
      taskCheckpoints.set(taskId, new Array<Checkpoint>());
    });
    return taskCheckpoints;
  }

  private initializePersonCheckpoints(checkpoints: Checkpoint[]) {
    const currentPersonCheckpoints = new Map<string, Checkpoint>();
    this.personIds.forEach((personId) => {
      currentPersonCheckpoints.set(personId, checkpoints[0]);
    });
    return currentPersonCheckpoints;
  }

  private createFirstCheckpoint(checkpoints: Checkpoint[]) {
    checkpoints.push({
      id: 0,
      day: this.project.admin.start_date,
      completedTasks: [],
      incoming: [],
      outgoing: [],
    });
  }

  private advanceNextTask(
    sortedIncompleteTasks: Array<string>,
    checkpoints: Checkpoint[],
    nextCheckpointId: number,
    floats: Map<string, number>,
    currentPersonCheckpoints: Map<string, Checkpoint>,
    taskCheckpoints: Map<string, Array<Checkpoint>>,
    incompleteTasks: string[],
  ) {
    for (const taskId of sortedIncompleteTasks) {
      const task = this.project.tasks[taskId];
      const outcomes = checkpoints
        .filter((checkpoint) =>
          task.dependencies.every(
            (dep) =>
              checkpoint.completedTasks.includes(dep) ||
              taskCheckpoints
                .get(dep)
                ?.find(
                  (depCheckpoint) =>
                    compareDays(depCheckpoint.day, checkpoint.day) <= 0,
                ),
          ),
        )
        .map((checkpoint) => ({
          checkpoint,
          freePeople: this.personIds.filter((personId) => {
            const personCheckpoint = currentPersonCheckpoints.get(personId);
            if (!personCheckpoint) {
              return false;
            }
            return (
              personCheckpoint.id === checkpoint.id ||
              compareDays(personCheckpoint.day, checkpoint.day) <= 0
            );
          }),
        }))
        .map(({ checkpoint, freePeople }) => ({
          checkpoint,
          outcome: this.simulateTask(taskId, checkpoint.day, freePeople),
        }))
        .filter((it) => it.outcome != null)
        .sort((a, b) => compareDays(a.outcome!.endDay, b.outcome!.endDay));

      if (outcomes.length === 0) {
        continue;
      }
      const bestOutcome = outcomes[0].outcome!;
      const bestCheckpoint = outcomes[0].checkpoint;

      const newCheckpoint: Checkpoint = {
        id: nextCheckpointId++,
        day: bestOutcome.endDay,
        completedTasks: bestCheckpoint.completedTasks.concat(taskId),
        incoming: [],
        outgoing: [],
      };
      const execution: TaskExecution = {
        ...bestOutcome,
        float: floats.get(taskId)!,
        estimate: calculateTaskEstimate(task.estimate_days),
        from: bestCheckpoint.id,
        to: newCheckpoint.id,
      };
      bestCheckpoint.outgoing.push(execution);
      newCheckpoint.incoming.push(execution);
      checkpoints.push(newCheckpoint);

      const missingDependencies = task.dependencies.filter(
        (dep) => !bestCheckpoint?.completedTasks.includes(dep),
      );
      missingDependencies.forEach((dep) => {
        const depCheckpoint = taskCheckpoints
          .get(dep)!
          .filter((it) => compareDays(it.day, bestCheckpoint.day) <= 0)
          .sort((a, b) => compareDays(a.day, b.day))[0];
        const waitEvent: TaskExecution = {
          from: depCheckpoint.id,
          to: bestCheckpoint.id,
          startDay: depCheckpoint.day,
          endDay: bestCheckpoint.day,
        };
        depCheckpoint.outgoing.push(waitEvent);
        bestCheckpoint.incoming.push(waitEvent);
        bestCheckpoint.completedTasks.push(dep);
        newCheckpoint.completedTasks.push(dep);
      });

      const personOriginCheckpoint = currentPersonCheckpoints.get(
        bestOutcome.personId,
      )!;
      if (personOriginCheckpoint.id !== bestCheckpoint.id) {
        const waitEvent: TaskExecution = {
          from: personOriginCheckpoint.id,
          to: bestCheckpoint.id,
          personId: bestOutcome.personId,
          startDay: personOriginCheckpoint.day,
          endDay: bestCheckpoint.day,
        };
        personOriginCheckpoint.outgoing.push(waitEvent);
        bestCheckpoint.incoming.push(waitEvent);
      }
      currentPersonCheckpoints.set(bestOutcome.personId, newCheckpoint);
      newCheckpoint.completedTasks.forEach((taskId) => {
        taskCheckpoints.get(taskId)!.push(newCheckpoint);
      });
      incompleteTasks.splice(incompleteTasks.indexOf(taskId), 1);

      break;
    }
    return nextCheckpointId;
  }

  private sortedTasksByFloats(
    taskIds: Array<string>,
    floats: Map<string, number>,
  ): Array<string> {
    const sortedTasks = Array.from(taskIds);
    sortedTasks.sort((a, b) => {
      const aFloat = floats.get(a)!;
      const bFloat = floats.get(b)!;
      if (aFloat < bFloat) {
        return -1;
      } else if (aFloat > bFloat) {
        return 1;
      }
      return 0;
    });
    return sortedTasks;
  }

  private simulateTask(
    taskId: string,
    startDay: Day,
    freePeople: string[],
  ): TaskSimulationOutcome | null {
    let taskFinishDay: Day | null = null;
    let taskOwner: string | null = null;
    const expandedOwners = expandTaskOwners(
      this.project.tasks[taskId].owners,
      this.project,
    );
    for (const ownerId of expandedOwners) {
      if (freePeople.includes(ownerId)) {
        const proposedFinishDate = this.calculateFinishDate(
          taskId,
          ownerId,
          startDay,
        );
        if (
          proposedFinishDate &&
          (taskFinishDay === null ||
            compareDays(proposedFinishDate, taskFinishDay) < 0)
        ) {
          taskFinishDay = proposedFinishDate;
          taskOwner = ownerId;
        }
      }
    }

    return taskFinishDay != null
      ? { taskId, personId: taskOwner!, startDay, endDay: taskFinishDay }
      : null;
  }

  private calculateTaskDependencyGroups(): Map<string, string[]> {
    const groups = new Map<string, string[]>();
    for (const taskId of this.taskIds) {
      const dependencies = this.project.tasks[taskId].dependencies;
      if (dependencies.length > 0) {
        const dependencyGroup =
          this.calculateTaskDependencyGroupKey(dependencies);
        if (!groups.has(dependencyGroup)) {
          groups.set(dependencyGroup, []);
        } else {
          groups.get(dependencyGroup)!.push(taskId);
        }
      }
    }
    return groups;
  }

  private calculateTaskDependencyGroupKey(tasks: string[]): string {
    return Array.from(tasks).sort().join(",");
  }

  private getPersonHoursOnDay(personId: string, day: Day): number {
    const availability = this.project.admin.person[personId].availability;
    for (const range of availability) {
      if (this.isDayBetween(day, range.startDate, range.endDate)) {
        return range.hoursPerDay;
      }
    }
    return 0;
  }

  private isDayBetween(day: Day, start: Day, end: Day): boolean {
    return compareDays(day, start) >= 0 && compareDays(day, end) <= 0;
  }

  private calculateFloats(): Map<string, number> {
    type TaskData = {
      earlyStart: number;
      earlyFinish: number;
      lateStart: number;
      lateFinish: number;
      duration: number;
    };
    const taskData: Map<string, TaskData> = new Map<string, TaskData>();
    this.taskIds.forEach((taskId) => {
      taskData.set(taskId, {
        earlyStart: 0,
        earlyFinish: 0,
        lateStart: 0,
        lateFinish: 0,
        duration: calculateTaskEstimate(
          this.project.tasks[taskId].estimate_days,
        ),
      });
    });

    const sortedTasks = this.sortTasksByTopology();
    sortedTasks.forEach((taskId) => {
      const task = this.project.tasks[taskId];
      const taskDatum = taskData.get(taskId)!;
      if (task.dependencies.length === 0) {
        taskDatum.earlyStart = 0;
      } else {
        taskDatum.earlyStart = Math.max(
          ...task.dependencies.map(
            (dependency) => taskData.get(dependency)!.earlyFinish,
          ),
        );
      }

      taskDatum.earlyFinish = taskDatum.earlyStart + taskDatum.duration;
    });

    const totalDuration = Math.max(
      ...this.taskIds.map((taskId) => taskData.get(taskId)!.earlyFinish),
    );

    sortedTasks.reverse();

    sortedTasks.forEach((taskId) => {
      const taskDatum = taskData.get(taskId)!;
      const dependants = this.taskIds.filter((searchTaskId) =>
        this.project.tasks[searchTaskId].dependencies.includes(taskId),
      );
      if (dependants.length === 0) {
        taskDatum.lateFinish = totalDuration;
      } else {
        taskDatum.lateFinish = Math.min(
          ...dependants.map(
            (dependantId) => taskData.get(dependantId)!.lateStart,
          ),
        );
      }

      taskDatum.lateStart = taskDatum.lateFinish - taskDatum.duration;
    });

    const floats = new Map<string, number>();
    this.taskIds.forEach((taskId) => {
      const taskDatum = taskData.get(taskId)!;
      floats.set(
        taskId,
        Math.round(taskDatum.lateStart - taskDatum.earlyStart),
      );
    });

    return floats;
  }

  private sortTasksByTopology(): Array<string> {
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    this.taskIds.forEach((taskId) => {
      adjList.set(taskId, []);
      inDegree.set(taskId, 0);
    });
    this.taskIds.forEach((taskId) => {
      const task = this.project.tasks[taskId];
      task.dependencies.forEach((dependency) => {
        adjList.get(dependency)!.push(taskId);
        inDegree.set(taskId, (inDegree.get(taskId) || 0) + 1);
      });
    });
    const queue = new Array<string>();
    inDegree.forEach((value, taskId) => {
      if (value === 0) {
        queue.push(taskId);
      }
    });
    const sortedOrder = new Array<string>();
    while (queue.length > 0) {
      const taskId = queue.shift()!;
      sortedOrder.push(taskId);
      adjList.get(taskId)!.forEach((dependency) => {
        inDegree.set(dependency, inDegree.get(dependency)! - 1);
        if (inDegree.get(dependency) === 0) {
          queue.push(dependency);
        }
      });
    }
    if (sortedOrder.length !== this.taskIds.length) {
      throw new Error(
        "Failed to sort the project tasks. sortedOrder: " +
          JSON.stringify(sortedOrder) +
          ", number of tasks: " +
          this.taskIds.length,
      );
    }
    return sortedOrder;
  }

  private calculateFinishDate(
    taskId: string,
    personId: string,
    startDay: Day,
  ): Day | null {
    const taskEstimate = calculateTaskEstimate(
      this.project.tasks[taskId].estimate_days,
    );

    let loopCounter = 0;
    let endDay = startDay;
    let taskBurnUp = 0;
    while (taskBurnUp < taskEstimate && loopCounter < 100) {
      taskBurnUp += this.getPersonHoursOnDay(personId, endDay) / 8;
      endDay = this.nextBusinessDay(endDay);
      loopCounter++;
    }

    if (taskBurnUp >= taskEstimate) {
      return endDay;
    }
    return null;
  }

  private nextBusinessDay(day: Day): Day {
    let currentDay = this.incrementDay(day);
    while (!this.workDayClassifier(currentDay)) {
      currentDay = this.incrementDay(currentDay);
    }
    return currentDay;
  }

  private incrementDay(day: Day): Day {
    const dateValue = new Date(day.year, day.month - 1, day.day);
    dateValue.setDate(dateValue.getDate() + 1);
    return {
      year: dateValue.getFullYear(),
      month: dateValue.getMonth() + 1,
      day: dateValue.getDate(),
    };
  }

  private optimizeCheckpoints(
    checkpoints: Array<Checkpoint>,
  ): Array<Checkpoint> {
    const checkpointsToRemove = new Set<number>();

    checkpoints.forEach((checkpoint) => {
      if (
        checkpoint.outgoing.length == 1 &&
        checkpoint.outgoing[0].taskId === undefined &&
        checkpoint.outgoing[0].personId !== undefined
      ) {
        const taskExecution = checkpoint.outgoing[0];
        const targetCheckpoint = checkpoints.find(
          (searchCheckpoint) => searchCheckpoint.id == taskExecution.to,
        )!;
        const incomingTaskExecution = checkpoint.incoming.find(
          (task) => task.personId === taskExecution.personId,
        );
        if (incomingTaskExecution) {
          checkpoint.incoming.forEach((task) => {
            task.to = targetCheckpoint.id;
            task.endDay = targetCheckpoint.day;
            targetCheckpoint.incoming.push(task);
          });
          checkpointsToRemove.add(checkpoint.id);
        }
      }
    });

    return checkpoints.filter(
      (checkpoint) => !checkpointsToRemove.has(checkpoint.id),
    );
  }
}
