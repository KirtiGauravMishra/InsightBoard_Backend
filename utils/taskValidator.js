const crypto = require('crypto');

/**
 * Generate a hash for transcript content (for idempotency)
 */
function generateTranscriptHash(transcript) {
  return crypto.createHash('sha256').update(transcript.trim().toLowerCase()).digest('hex');
}

/**
 * Validate that all dependency IDs exist in the task list
 * Returns sanitized tasks with invalid dependencies removed
 */
function sanitizeDependencies(tasks) {
  const validIds = new Set(tasks.map(task => task.id));
  
  return tasks.map(task => ({
    ...task,
    dependencies: task.dependencies.filter(depId => {
      const isValid = validIds.has(depId);
      if (!isValid) {
        console.warn(`⚠️  Removed invalid dependency ${depId} from task ${task.id}`);
      }
      return isValid;
    })
  }));
}

/**
 * Detect cycles using DFS (Depth-First Search)
 * Returns { hasCycles: boolean, cycleDetails: string[] }
 */
function detectCycles(tasks) {
  const graph = new Map();
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const colors = new Map();
  const cycles = [];

  // Build adjacency list
  tasks.forEach(task => {
    graph.set(task.id, task.dependencies || []);
    colors.set(task.id, WHITE);
  });

  function dfs(nodeId, path = []) {
    if (colors.get(nodeId) === BLACK) return false;
    
    if (colors.get(nodeId) === GRAY) {
      // Found a cycle
      const cycleStart = path.indexOf(nodeId);
      const cycle = path.slice(cycleStart).concat(nodeId);
      cycles.push(`Cycle detected: ${cycle.join(' → ')}`);
      return true;
    }

    colors.set(nodeId, GRAY);
    path.push(nodeId);

    const neighbors = graph.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (graph.has(neighbor)) {
        dfs(neighbor, [...path]);
      }
    }

    colors.set(nodeId, BLACK);
    return false;
  }

  // Check all nodes
  for (const nodeId of graph.keys()) {
    if (colors.get(nodeId) === WHITE) {
      dfs(nodeId);
    }
  }

  return {
    hasCycles: cycles.length > 0,
    cycleDetails: cycles
  };
}

/**
 * Mark tasks as blocked/error if they're part of a cycle
 */
function markCyclicTasks(tasks, cycleDetails) {
  const cyclicTaskIds = new Set();
  
  cycleDetails.forEach(cycleStr => {
    const ids = cycleStr.match(/task-\d+/g) || [];
    ids.forEach(id => cyclicTaskIds.add(id));
  });

  return tasks.map(task => {
    if (cyclicTaskIds.has(task.id)) {
      return {
        ...task,
        status: 'error',
        errorMessage: 'Part of a circular dependency'
      };
    }
    
    // Check if dependencies are met
    const hasUnmetDeps = task.dependencies.some(depId => {
      const depTask = tasks.find(t => t.id === depId);
      return depTask && depTask.status !== 'completed';
    });

    return {
      ...task,
      status: hasUnmetDeps ? 'blocked' : 'ready'
    };
  });
}

module.exports = {
  generateTranscriptHash,
  sanitizeDependencies,
  detectCycles,
  markCyclicTasks
};
