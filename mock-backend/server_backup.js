const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads'));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Real AI function that calls the actual LLM
async function callAI(prompt, context = '') {
    try {
        // Create a comprehensive prompt for the LLM to generate structured notes
        const notePrompt = `You are a smart note-taking assistant. 
Your job is to take raw text or transcripts and transform them into an engaging, structured markdown note. 
Always include the following:

1. 📌 Title & Metadata
   - Generate a concise and clear title.
   - Add metadata block with Date, Tags, Category.

2. 📝 Structured Content
   - Organize into sections with headings (#, ##, ###).
   - Use bullet points and numbered lists for clarity.
   - Write short explanations under each section.
   - Use a fun, student-friendly tone with emojis throughout.

3. 📊 Tables
   - If content has comparisons, tasks, or structured items, format them as markdown tables.
   - Example table formats:
     - Task tracker (Task | Owner | Deadline | Status)
     - Comparison (Feature | Option A | Option B)

4. 🔄 Flowchart
   - ALWAYS generate a Mermaid flowchart in markdown for any process, workflow, or sequence.
   - Use this exact format:
     \`\`\`mermaid
     flowchart TD
       A[Start] --> B{Decision}
       B -->|Yes| C[Do Action]
       B -->|No| D[Stop]
     \`\`\`

5. 🧠 Mindmap
   - ALWAYS generate a Mermaid mindmap to show the high-level structure and relationships.
   - Use this exact format:
     \`\`\`mermaid
     mindmap
       root((Main Topic))
         Subtopic A
           Detail 1
           Detail 2
         Subtopic B
           Detail 3
     \`\`\`

6. ✨ Key Takeaways
   - End with 3-5 bullet points of the most important insights.

7. 🧠 Quiz Section
   - Include 3-5 multiple choice questions based on the content
   - Format: **Q1**: [Question] **A1**: [Answer with explanation]

8. 📚 Flashcards
   - Create 5-8 key term flashcards
   - Format: **Front**: [Term] **Back**: [Definition]

---

Input: ${context || 'Content uploaded for note generation'}

Output: A markdown note that includes all of the above (title, metadata, sections, tables, flowchart, mindmap, takeaways, quiz, flashcards). 
Make it visually appealing, well-organized, and easy to scan.`;

        // Try to call Groq API
        console.log('🤖 Attempting to call Groq API...');
        
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer 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`
            },
            body: JSON.stringify({
                model: 'groq/compound',
                messages: [
                    {
                        role: 'user',
                        content: notePrompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 8000
            })
        });

        if (groqResponse.ok) {
            const groqData = await groqResponse.json();
            console.log('✅ Groq API call successful!');
            const content = groqData.choices?.[0]?.message?.content || 
                          groqData.content || 
                          groqData.message || 
                          groqData.response || 
                          groqData;
            return { content: content };
        } else {
            console.log('❌ Groq API call failed, status:', groqResponse.status);
            const errorText = await groqResponse.text();
            console.log('Error response:', errorText);
            throw new Error(`Groq API call failed with status ${groqResponse.status}: ${errorText}`);
        }
    } catch (error) {
        console.error('Error in callAI:', error);
        throw error; // Re-throw the error to be handled by the calling function
    }
}

// Routes

// Generate Quiz endpoint
app.post('/v1/turbolearn/generate-quiz', async (req, res) => {
    try {
        console.log('🧠 Generate quiz request:', JSON.stringify(req.body, null, 2));
        
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const quizPrompt = `You are an expert AI study assistant. Generate a comprehensive quiz from the provided notes.

**REQUIREMENTS:**
- Create 5-10 multiple choice questions
- Include 1-2 true/false questions
- Make questions challenging but fair
- Include explanations for each answer
- Use the following format:

{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Explanation of why this is correct"
    }
  ]
}

**Notes Content:** ${notes}

Generate an engaging quiz that tests understanding of the material!`;

        const aiResponse = await callAI(quizPrompt, notes);
        
        if (aiResponse.content) {
            let quizData;
            try {
                // Try to parse as JSON
                quizData = JSON.parse(aiResponse.content);
            } catch (e) {
                // If not JSON, create a structured response
                quizData = {
                    title: "Generated Quiz",
                    questions: [
                        {
                            question: "What is the main topic discussed in the notes?",
                            options: ["Option A", "Option B", "Option C", "Option D"],
                            correctAnswer: "Option A",
                            explanation: "Based on the content analysis"
                        }
                    ]
                };
            }
            
            res.json({
                success: true,
                quiz: quizData,
                timestamp: Date.now()
            });
        } else {
            throw new Error('No quiz generated');
        }
        
    } catch (error) {
        console.error('❌ Quiz generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate quiz',
            details: error.message 
        });
    }
});

// Generate Flashcards endpoint
app.post('/v1/turbolearn/generate-flashcards', async (req, res) => {
    try {
        console.log('📚 Generate flashcards request:', JSON.stringify(req.body, null, 2));
        
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const flashcardPrompt = `You are an expert AI study assistant. Generate flashcards from the provided notes.

**REQUIREMENTS:**
- Create 8-12 flashcards
- Front side: Key term, concept, or question
- Back side: Definition, explanation, or answer
- Make them concise but informative
- Use the following format:

{
  "flashcards": [
    {
      "front": "Term or Question",
      "back": "Definition or Answer"
    }
  ]
}

**Notes Content:** ${notes}

Generate useful flashcards for effective studying!`;

        const aiResponse = await callAI(flashcardPrompt, notes);
        
        if (aiResponse.content) {
            let flashcardData;
            try {
                // Try to parse as JSON
                flashcardData = JSON.parse(aiResponse.content);
            } catch (e) {
                // If not JSON, create a structured response
                flashcardData = {
                    flashcards: [
                        {
                            front: "Key Concept",
                            back: "Definition based on the notes"
                        }
                    ]
                };
            }
            
            res.json({
                success: true,
                flashcards: flashcardData.flashcards || flashcardData,
                timestamp: Date.now()
            });
        } else {
            throw new Error('No flashcards generated');
        }
        
    } catch (error) {
        console.error('❌ Flashcards generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate flashcards',
            details: error.message 
        });
    }
});

// Generate Summary endpoint
app.post('/v1/turbolearn/generate-summary', async (req, res) => {
    try {
        console.log('📝 Generate summary request:', JSON.stringify(req.body, null, 2));
        
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const summaryPrompt = `You are an expert AI study assistant. Generate a comprehensive summary from the provided notes.

**REQUIREMENTS:**
- Create a concise but complete summary
- Highlight the most important points
- Use clear, student-friendly language
- Include key takeaways
- Structure with headings and bullet points

**Notes Content:** ${notes}

Generate a helpful summary for quick review!`;

        const aiResponse = await callAI(summaryPrompt, notes);
        
        if (aiResponse.content) {
            res.json({
                success: true,
                summary: aiResponse.content,
                timestamp: Date.now()
            });
        } else {
            throw new Error('No summary generated');
        }
        
    } catch (error) {
        console.error('❌ Summary generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate summary',
            details: error.message 
        });
    }
});

// Generate Action Items endpoint
app.post('/v1/turbolearn/generate-action-items', async (req, res) => {
    try {
        console.log('✅ Generate action items request:', JSON.stringify(req.body, null, 2));
        
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const actionItemsPrompt = `You are an expert AI study assistant. Generate actionable items from the provided notes.

**REQUIREMENTS:**
- Create 5-8 specific, actionable items
- Include title and description for each
- Add priority level (High, Medium, Low)
- Make them practical and achievable
- Use the following format:

{
  "actionItems": [
    {
      "title": "Action Item Title",
      "description": "Detailed description of what to do",
      "priority": "High/Medium/Low"
    }
  ]
}

**Notes Content:** ${notes}

Generate practical action items for implementation!`;

        const aiResponse = await callAI(actionItemsPrompt, notes);
        
        if (aiResponse.content) {
            let actionItemsData;
            try {
                // Try to parse as JSON
                actionItemsData = JSON.parse(aiResponse.content);
            } catch (e) {
                // If not JSON, create a structured response
                actionItemsData = {
                    actionItems: [
                        {
                            title: "Review Key Concepts",
                            description: "Go through the main points discussed in the notes",
                            priority: "High"
                        }
                    ]
                };
            }
            
            res.json({
                success: true,
                actionItems: actionItemsData.actionItems || actionItemsData,
                timestamp: Date.now()
            });
        } else {
            throw new Error('No action items generated');
        }
        
    } catch (error) {
        console.error('❌ Action items generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate action items',
            details: error.message 
        });
    }
});

// Generate Key Points endpoint
app.post('/v1/turbolearn/generate-key-points', async (req, res) => {
    try {
        console.log('🔑 Generate key points request:', JSON.stringify(req.body, null, 2));
        
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes are required' });
        }

        const keyPointsPrompt = `You are an expert AI study assistant. Generate key points from the provided notes.

**REQUIREMENTS:**
- Create 6-10 key points
- Include title and description for each
- Focus on the most important concepts
- Make them clear and memorable
- Use the following format:

{
  "keyPoints": [
    {
      "title": "Key Point Title",
      "description": "Detailed explanation of the key point"
    }
  ]
}

**Notes Content:** ${notes}

Generate essential key points for understanding!`;

        const aiResponse = await callAI(keyPointsPrompt, notes);
        
        if (aiResponse.content) {
            let keyPointsData;
            try {
                // Try to parse as JSON
                keyPointsData = JSON.parse(aiResponse.content);
            } catch (e) {
                // If not JSON, create a structured response
                keyPointsData = {
                    keyPoints: [
                        {
                            title: "Main Concept",
                            description: "Key explanation based on the notes"
                        }
                    ]
                };
            }
            
            res.json({
                success: true,
                keyPoints: keyPointsData.keyPoints || keyPointsData,
                timestamp: Date.now()
            });
        } else {
            throw new Error('No key points generated');
        }
        
    } catch (error) {
        console.error('❌ Key points generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate key points',
            details: error.message 
        });
    }
});

// YouTube notes endpoint
app.post('/v1/turbolearn/youtube-notes', async (req, res) => {
    try {
        console.log('📺 YouTube notes request:', JSON.stringify(req.body, null, 2));
        
        const { youtubeUrl, videoId, prompt } = req.body;
        
        if (!youtubeUrl || !videoId) {
            return res.status(400).json({ error: 'YouTube URL and video ID are required' });
        }

        // Get video info (temporarily disabled)
        // const videoInfo = await ytdl.getInfo(youtubeUrl);
        // const videoTitle = videoInfo.videoDetails.title;
        // const videoDescription = videoInfo.videoDetails.description;
        // const videoDuration = videoInfo.videoDetails.lengthSeconds;
        
        const videoTitle = 'YouTube Video';
        const videoDescription = 'Video description not available';
        const videoDuration = 0;

        console.log(`📺 Processing YouTube video: ${videoTitle}`);

        // Create a more specific prompt for YouTube content
        const youtubePrompt = `You are an expert AI study assistant. Generate comprehensive, engaging study notes from this YouTube video.

**VIDEO INFORMATION:**
- Title: ${videoTitle}
- Duration: ${Math.floor(videoDuration / 60)} minutes
- Description: ${videoDescription.substring(0, 500)}...

**REQUIREMENTS:**
- Use a fun, student-friendly tone with emojis throughout
- Structure like a textbook with clear headings and explanations
- Include detailed explanations BEFORE any tables
- Focus on the main educational content from the video
- Use the following format:

# 📺 [VIDEO TITLE]

## 📚 Video Overview
[1-2 line introduction about what the video covers]

## 🔬 Key Sections

### 🎯 :blue_book: [Main Concept 1]
[3-5 sentence explanation with examples from the video]

### 🧪 :microscope: [Main Concept 2] 
[Detailed explanation with pros/cons mentioned in video]

### 📊 :abacus: [Comparison Table]
| Aspect | Option A | Option B |
|--------|----------|----------|
| Feature | Description | Description |

## 🚀 Applications / Use Cases
[Real-world examples mentioned in video]

## ⚠️ Challenges / Limitations
[Common problems and solutions discussed]

## 🎯 Quick Recap
• Key point 1 🎓
• Key point 2 🔍
• Key point 3 🎮

## 🧠 Quiz / Flashcards
**Q1**: [Question based on video content]
**A1**: [Answer]

## 📝 Final Summary
[2-3 sentence wrap-up with emojis]

**Video Context:** ${prompt || 'YouTube video uploaded for note generation'}

Generate engaging, comprehensive notes that students will love to study from!`;

        // Call AI to generate notes
        const aiResponse = await callAI(youtubePrompt, `YouTube Video: ${videoTitle}`);
        
        if (aiResponse.content) {
            // Process the content to ensure it's clean and student-friendly
            let processedContent = aiResponse.content;
            
            // Ensure it's a string
            if (typeof processedContent !== 'string') {
                processedContent = String(processedContent);
            }
            
            // Remove any generic analysis sections that students don't need
            const sectionsToRemove = [
                'Key Content Analysis',
                'Main Themes Identified', 
                'Important Insights',
                'Key Takeaways',
                'Overview',
                'Processing Time',
                'Status: Complete',
                'File Processed:'
            ];
            
            sectionsToRemove.forEach(section => {
                const regex = new RegExp(`.*${section}.*\\n`, 'gi');
                processedContent = processedContent.replace(regex, '');
            });
            
            // Clean up extra whitespace
            processedContent = processedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
            
            console.log('✅ YouTube notes generated successfully');
            
            res.json({
                success: true,
                content: processedContent,
                notes: processedContent,
                type: 'youtube_notes',
                videoTitle: videoTitle,
                videoId: videoId,
                timestamp: Date.now()
            });
        } else {
            throw new Error('No content generated');
        }
        
    } catch (error) {
        console.error('❌ YouTube notes generation error:', error);
        res.status(500).json({ 
            error: 'Failed to generate notes from YouTube video',
            details: error.message 
        });
    }
});

// Take notes endpoint
app.post('/v1/turbolearn/take-notes', async (req, res) => {
    try {
        console.log('📝 Take notes request:', JSON.stringify(req.body, null, 2));
        
        const { files, prompt } = req.body;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }
        
        // Call AI to generate notes
        const aiResponse = await callAI(prompt, `Files: ${files.map(f => f.name || f.url).join(', ')}`);
        
        if (aiResponse.content) {
            // Process the content to ensure it's clean and student-friendly
            let processedContent = aiResponse.content;
            
            // Ensure it's a string
            if (typeof processedContent !== 'string') {
                processedContent = String(processedContent);
            }
            
            // Remove any generic analysis sections that students don't need
            const sectionsToRemove = [
                'Key Content Analysis',
                'Main Themes Identified', 
                'Important Insights',
                'Key Takeaways',
                'Overview',
                'Processing Time',
                'Status: Complete',
                'File Processed:'
            ];
            
            sectionsToRemove.forEach(section => {
                const regex = new RegExp(`.*${section}.*\\n`, 'gi');
                processedContent = processedContent.replace(regex, '');
            });
            
            // Clean up extra whitespace
            processedContent = processedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
            
            console.log('✅ Notes generated successfully');
            
            res.json({
                success: true,
                content: processedContent,
                notes: processedContent,
                type: 'structured_notes',
                timestamp: Date.now()
            });
        } else {
            throw new Error('No content generated');
        }
        
    } catch (error) {
        console.error('❌ Error generating notes:', error);
        res.status(500).json({ 
            error: 'Failed to generate notes',
            details: error.message 
        });
    }
});

// Health check
app.get('/actuator/health', (req, res) => {
    res.json({ status: 'UP', service: 'Turbolearn AI Backend' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Note-taking agent ready!`);
    console.log(`🤖 Groq API integration active`);
});
