const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Transcript = require('../models/Transcript');
const { generateTasksFromTranscript } = require('../services/llmService');
const {
  generateTranscriptHash,
  sanitizeDependencies,
  detectCycles,
  markCyclicTasks
} = require('../utils/taskValidator');

/**
 * POST /api/transcripts
 * Submit a transcript and get a jobId (Level 2: Async processing)
 */
router.post('/', async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required'
      });
    }

    // Level 2: Idempotency check
    const transcriptHash = generateTranscriptHash(transcript);
    
    // Check if we've processed this exact transcript before
    const existingTranscript = await Transcript.findOne({ transcriptHash });
    
    if (existingTranscript) {
      console.log('✅ Idempotent request detected - returning existing result');
      
      // If completed, include the data
      if (existingTranscript.status === 'completed') {
        return res.json({
          success: true,
          jobId: existingTranscript.transcriptId,
          status: existingTranscript.status,
          message: 'This transcript was already processed',
          cached: true,
          data: {
            tasks: existingTranscript.tasks,
            hasCycles: existingTranscript.hasCycles,
            cycleDetails: existingTranscript.cycleDetails,
            completedAt: existingTranscript.completedAt
          }
        });
      }
      
      // Otherwise just return status
      return res.json({
        success: true,
        jobId: existingTranscript.transcriptId,
        status: existingTranscript.status,
        message: 'This transcript was already processed',
        cached: true
      });
    }

    // Create new job
    const transcriptId = uuidv4();
    
    const newTranscript = new Transcript({
      transcriptId,
      originalTranscript: transcript,
      transcriptHash,
      status: 'processing'
    });

    await newTranscript.save();

    // Level 2: Process asynchronously
    processTranscriptAsync(transcriptId, transcript);

    res.status(202).json({
      success: true,
      jobId: transcriptId,
      status: 'processing',
      message: 'Transcript is being processed. Use the jobId to check status.'
    });

  } catch (error) {
    console.error('Error submitting transcript:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Async processing function (runs in background)
 */
async function processTranscriptAsync(transcriptId, transcript) {
  try {
    console.log(`⏳ Processing transcript ${transcriptId}...`);

    // Step 1: Generate tasks using LLM
    let tasks = await generateTasksFromTranscript(transcript);
    console.log(`✅ Generated ${tasks.length} tasks`);

    // Step 2: Sanitize dependencies (Level 1 validation)
    tasks = sanitizeDependencies(tasks);
    console.log('✅ Dependencies sanitized');

    // Step 3: Detect cycles (Level 1 cycle detection)
    const { hasCycles, cycleDetails } = detectCycles(tasks);
    
    if (hasCycles) {
      console.warn(`⚠️  Cycles detected: ${cycleDetails.join(', ')}`);
      tasks = markCyclicTasks(tasks, cycleDetails);
    }

    // Step 4: Update database
    await Transcript.findOneAndUpdate(
      { transcriptId },
      {
        tasks,
        hasCycles,
        cycleDetails,
        status: 'completed',
        completedAt: new Date()
      }
    );

    console.log(`✅ Transcript ${transcriptId} processed successfully`);

  } catch (error) {
    console.error(`❌ Error processing transcript ${transcriptId}:`, error);
    
    await Transcript.findOneAndUpdate(
      { transcriptId },
      {
        status: 'failed',
        errorMessage: error.message
      }
    );
  }
}

module.exports = router;
