import {
  TaskEstimate,
  TasksSection,
  ProjectDefinition,
} from "./ProjectDefinition";

/** Calculate an overall estimate using the PERT formula */
export function calculateTaskEstimate(taskEstimate: TaskEstimate): number {
  return (taskEstimate.min + taskEstimate.max + 4 * taskEstimate.expected) / 6;
}

export function calculateTotalEstimate(
  taskIds: string[],
  tasks: TasksSection,
): number {
  return taskIds.reduce((total, taskId) => {
    const task = tasks[taskId];
    if (!task) return total;
    return total + calculateTaskEstimate(task.estimate_days);
  }, 0);
}

/**
 * Determine if an identifier refers to a person (exists in project.admin.person)
 * or a role (does not exist in project.admin.person)
 */
export function isPersonId(
  identifier: string,
  project: ProjectDefinition,
): boolean {
  return identifier in project.admin.person;
}

/**
 * Resolve a role identifier to all people who have that role
 */
export function resolvePeopleWithRole(
  role: string,
  project: ProjectDefinition,
): string[] {
  const peopleWithRole: string[] = [];

  for (const [personId, person] of Object.entries(project.admin.person)) {
    if (person.roles && person.roles.includes(role)) {
      peopleWithRole.push(personId);
    }
  }

  return peopleWithRole;
}

/**
 * Expand a list of task owners (which may include both person IDs and role IDs)
 * to a list containing only person IDs
 */
export function expandTaskOwners(
  owners: string[],
  project: ProjectDefinition,
): string[] {
  const expandedOwners: string[] = [];

  for (const owner of owners) {
    if (isPersonId(owner, project)) {
      // It's a person ID
      expandedOwners.push(owner);
    } else {
      // It's a role ID - find all people with this role
      const peopleWithRole = resolvePeopleWithRole(owner, project);
      expandedOwners.push(...peopleWithRole);
    }
  }

  // Remove duplicates
  return [...new Set(expandedOwners)];
}
