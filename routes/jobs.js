const express = require('express');
const router = express.Router();
const Transcript = require('../models/Transcript');

/**
 * GET /api/jobs/:jobId
 * Check the status of a processing job (Level 2)
 */
router.get('/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;

    const transcript = await Transcript.findOne({ transcriptId: jobId });

    if (!transcript) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    const response = {
      success: true,
      jobId: transcript.transcriptId,
      status: transcript.status,
      createdAt: transcript.createdAt
    };

    if (transcript.status === 'completed') {
      response.data = {
        tasks: transcript.tasks,
        hasCycles: transcript.hasCycles,
        cycleDetails: transcript.cycleDetails,
        completedAt: transcript.completedAt
      };
    } else if (transcript.status === 'failed') {
      response.error = transcript.errorMessage;
    }

    res.json(response);

  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/jobs/:jobId/tasks/:taskId/complete
 * Mark a task as completed (Level 3: Interactive state)
 */
router.put('/:jobId/tasks/:taskId/complete', async (req, res) => {
  try {
    const { jobId, taskId } = req.params;

    const transcript = await Transcript.findOne({ transcriptId: jobId });

    if (!transcript) {
      return res.status(404).json({
        success: false,
        error: 'Job not found'
      });
    }

    // Find and update the task
    const taskIndex = transcript.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    transcript.tasks[taskIndex].status = 'completed';

    // Update dependent tasks - mark as ready if all dependencies are completed
    transcript.tasks.forEach((task, idx) => {
      if (task.status === 'blocked' && task.dependencies.includes(taskId)) {
        const allDepsCompleted = task.dependencies.every(depId => {
          const depTask = transcript.tasks.find(t => t.id === depId);
          return depTask && depTask.status === 'completed';
        });

        if (allDepsCompleted) {
          transcript.tasks[idx].status = 'ready';
        }
      }
    });

    await transcript.save();

    res.json({
      success: true,
      message: 'Task marked as completed',
      updatedTasks: transcript.tasks
    });

  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/jobs
 * List all jobs (for debugging)
 */
router.get('/', async (req, res) => {
  try {
    const transcripts = await Transcript.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select('transcriptId status hasCycles createdAt completedAt');

    res.json({
      success: true,
      jobs: transcripts
    });

  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
