import { ProjectDefinition } from "./ProjectDefinition";
import { Day } from "../journal/types";
import { calculateTaskEstimate } from "./util";
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
    let iterationCounter = 0;
    while (incompleteTasks.length > 0 && iterationCounter < 1000) {
      iterationCounter++;

      const sortedIncompleteTasks = this.sortedTasksByFloats(
        incompleteTasks,
        floats,
      );
      let advancedATask = false;
      const advanceResult = this.advanceNextTask(
        sortedIncompleteTasks,
        checkpoints,
        nextCheckpointId,
        floats,
        currentPersonCheckpoints,
        taskCheckpoints,
        incompleteTasks,
        advancedATask,
      );
      nextCheckpointId = advanceResult.nextCheckpointId;
      advancedATask = advanceResult.advancedATask;

      if (!advancedATask) {
        nextCheckpointId = this.waitForDependencies(
          sortedIncompleteTasks,
          taskCheckpoints,
          currentPersonCheckpoints,
          nextCheckpointId,
          checkpoints,
        );
      }
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
    advancedATask: boolean,
  ) {
    taskLoop: for (const taskId of sortedIncompleteTasks) {
      const task = this.project.tasks[taskId];
      for (const checkpoint of checkpoints) {
        const hasAllDependencies = task.dependencies.every((dep) =>
          checkpoint.completedTasks.includes(dep),
        );
        if (hasAllDependencies) {
          const freePeople = this.personIds.filter(
            (personId) =>
              currentPersonCheckpoints.get(personId)?.id === checkpoint.id,
          );
          const outcome = this.simulateTask(taskId, checkpoint.day, freePeople);
          if (outcome != null) {
            const newCheckpoint: Checkpoint = {
              id: nextCheckpointId++,
              day: outcome.endDay,
              completedTasks: checkpoint.completedTasks.concat(taskId),
              incoming: [],
              outgoing: [],
            };
            const execution: TaskExecution = {
              ...outcome,
              float: floats.get(taskId)!,
              estimate: calculateTaskEstimate(task.estimate_days),
              from: checkpoint.id,
              to: newCheckpoint.id,
            };
            newCheckpoint.incoming.push(execution);
            checkpoint.outgoing.push(execution);
            checkpoints.push(newCheckpoint);
            currentPersonCheckpoints.set(outcome.personId, newCheckpoint);
            newCheckpoint.completedTasks.forEach((taskId) => {
              taskCheckpoints.get(taskId)!.push(newCheckpoint);
            });
            incompleteTasks.splice(incompleteTasks.indexOf(taskId), 1);
            advancedATask = true;
            break taskLoop;
          }
        }
      }
    }
    return { nextCheckpointId, advancedATask };
  }

  private waitForDependencies(
    sortedIncompleteTasks: Array<string>,
    taskCheckpoints: Map<string, Array<Checkpoint>>,
    currentPersonCheckpoints: Map<string, Checkpoint>,
    nextCheckpointId: number,
    checkpoints: Checkpoint[],
  ) {
    for (const taskId of sortedIncompleteTasks) {
      const task = this.project.tasks[taskId];
      const isTaskReady = task.dependencies.every(
        (dependency) => taskCheckpoints.get(dependency)!.length > 0,
      );
      if (!isTaskReady) {
        continue;
      }

      const ownerCheckpoint = task.owners
        .map((ownerId) => ({
          owner: ownerId,
          checkpoint: currentPersonCheckpoints.get(ownerId)!,
        }))
        .sort((a, b) => compareDays(a.checkpoint.day, b.checkpoint.day))[0];
      if (!ownerCheckpoint.checkpoint) {
        continue;
      }

      const newCheckpoint: Checkpoint = {
        id: nextCheckpointId++,
        day: ownerCheckpoint.checkpoint.day,
        completedTasks: Array.from(ownerCheckpoint.checkpoint.completedTasks),
        incoming: [],
        outgoing: [],
      };
      const waitEvent: TaskExecution = {
        from: ownerCheckpoint.checkpoint.id,
        to: newCheckpoint.id,
        personId: ownerCheckpoint.owner,
        startDay: ownerCheckpoint.checkpoint.day,
        endDay: ownerCheckpoint.checkpoint.day,
      };
      newCheckpoint.incoming.push(waitEvent);
      ownerCheckpoint.checkpoint.outgoing.push(waitEvent);
      checkpoints.push(newCheckpoint);
      currentPersonCheckpoints.set(ownerCheckpoint.owner, newCheckpoint);

      let iterationCounter2 = 0;
      let missingDependencies = task.dependencies.filter(
        (dependency) => !newCheckpoint.completedTasks.includes(dependency),
      );
      while (missingDependencies.length > 0 && iterationCounter2 < 100) {
        iterationCounter2++;

        const dependency = missingDependencies[0];
        const sourceCheckpoint = taskCheckpoints.get(dependency)![0];
        const [earliestDay, latestDay] =
          compareDays(newCheckpoint.day, sourceCheckpoint.day) < 0
            ? [newCheckpoint.day, sourceCheckpoint.day]
            : [sourceCheckpoint.day, newCheckpoint.day];
        const sourceWaitEvent: TaskExecution = {
          from: sourceCheckpoint.id,
          to: newCheckpoint.id,
          startDay: earliestDay,
          endDay: latestDay,
        };
        newCheckpoint.day = latestDay;
        newCheckpoint.incoming.push(sourceWaitEvent);
        newCheckpoint.completedTasks = newCheckpoint.completedTasks.concat(
          sourceCheckpoint.completedTasks.filter(
            (task) => !newCheckpoint.completedTasks.includes(task),
          ),
        );
        sourceCheckpoint.outgoing.push(sourceWaitEvent);

        missingDependencies = task.dependencies.filter(
          (dependency) => !newCheckpoint.completedTasks.includes(dependency),
        );
      }

      newCheckpoint.completedTasks.forEach((taskId) => {
        taskCheckpoints.get(taskId)!.push(newCheckpoint);
      });

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
    for (const ownerId of this.project.tasks[taskId].owners) {
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
