const axios = require('axios');

/**
 * Generate tasks from meeting transcript using Google Gemini (FREE) - Direct API Call
 */
async function generateTasksFromTranscript(transcript) {
  const prompt = `You are an AI assistant that converts meeting transcripts into structured tasks with dependencies.

Analyze the following meeting transcript and extract all actionable tasks. For each task:
1. Assign a unique ID in the format "task-1", "task-2", etc.
2. Write a clear description
3. Assign a priority (low, medium, high, or urgent)
4. Identify dependencies (which other tasks must be completed first)

Return ONLY a valid JSON array with this exact structure:
[
  {
    "id": "task-1",
    "description": "Task description",
    "priority": "high",
    "dependencies": []
  }
]

IMPORTANT RULES:
- IDs must be in format "task-X" where X is a number
- Dependencies array should only contain IDs of tasks that exist in your response
- If a task has no dependencies, use an empty array []
- Priority must be one of: low, medium, high, urgent
- Return ONLY the JSON array, no additional text

Meeting Transcript:
${transcript}`;

  try {
    // Use Gemini REST API directly (v1 stable endpoint)
    if (process.env.GEMINI_API_KEY) {
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      
      const response = await axios.post(GEMINI_API_URL, {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8000,  // Increased for longer transcripts
        }
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      console.log('✅ Gemini API response received');
      
      // Check if response has the expected structure
      if (!response.data || !response.data.candidates || !response.data.candidates[0]) {
        console.error('❌ Invalid Gemini response structure:', JSON.stringify(response.data));
        throw new Error('Invalid response from Gemini API');
      }

      const content = response.data.candidates[0].content.parts[0].text.trim();
      console.log('📝 Gemini response length:', content.length);
      console.log('📝 First 200 chars:', content.substring(0, 200));
      
      // Remove markdown code blocks if present
      const jsonStr = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

      console.log('🔍 Cleaned JSON length:', jsonStr.length);
      console.log('🔍 Cleaned JSON preview:', jsonStr.substring(0, 100));

      const tasks = JSON.parse(jsonStr);

      // Validate structure
      if (!Array.isArray(tasks)) {
        throw new Error('LLM response is not an array');
      }

      tasks.forEach((task, idx) => {
        if (!task.id || !task.description) {
          throw new Error(`Task at index ${idx} missing required fields`);
        }
        if (!task.priority) {
          task.priority = 'medium';
        }
        if (!task.dependencies) {
          task.dependencies = [];
        }
      });

      return tasks;
    }
    
    // Fallback to OpenAI if no Gemini key
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a task extraction assistant. Always respond with valid JSON only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const content = response.choices[0].message.content.trim();
    
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const tasks = JSON.parse(jsonStr);

    if (!Array.isArray(tasks)) {
      throw new Error('LLM response is not an array');
    }

    tasks.forEach((task, idx) => {
      if (!task.id || !task.description) {
        throw new Error(`Task at index ${idx} missing required fields`);
      }
      if (!task.priority) {
        task.priority = 'medium';
      }
      if (!task.dependencies) {
        task.dependencies = [];
      }
    });

    return tasks;

  } catch (error) {
    console.error('❌ LLM API Error:', error.response?.data || error.message);
    throw new Error(`Failed to generate tasks: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
  generateTasksFromTranscript
};
