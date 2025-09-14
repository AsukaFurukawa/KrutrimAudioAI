const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads');
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
            
            return content;
        } else {
            console.error('❌ Groq API error:', groqResponse.status, groqResponse.statusText);
            const errorText = await groqResponse.text();
            console.error('Error details:', errorText);
            throw new Error(`Groq API error: ${groqResponse.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Error in callAI:', error);
        throw error;
    }
}

// Main note-taking endpoint
app.post('/v1/turbolearn/take-notes', upload.array('files', 10), async (req, res) => {
    try {
        console.log('📝 Note-taking request received');
        console.log('Files:', req.files?.length || 0);
        console.log('Body:', JSON.stringify(req.body, null, 2));

        const { prompt, files } = req.body;
        let context = '';

        // Process uploaded files
        if (req.files && req.files.length > 0) {
            console.log('📁 Processing uploaded files...');
            for (const file of req.files) {
                console.log(`Processing file: ${file.originalname} (${file.mimetype})`);
                
                // For now, just add file info to context
                context += `\n\nFile: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes\n`;
            }
        }

        // Process files from request body
        if (files && Array.isArray(files)) {
            console.log('📁 Processing files from request body...');
            for (const file of files) {
                console.log(`Processing file: ${file.name}`);
                context += `\n\nFile: ${file.name}\nURL: ${file.url}\n`;
            }
        }

        // Generate notes using AI
        console.log('🤖 Generating notes with AI...');
        const notes = await callAI(prompt || 'Generate comprehensive notes from the uploaded content', context);

        res.json({
            success: true,
            content: notes,
            notes: notes,
            type: 'structured_notes',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Note-taking error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate notes',
            details: error.message 
        });
    }
});

// Quiz generation endpoint
app.post('/v1/turbolearn/generate-quiz', async (req, res) => {
    try {
        const { notes, questionCount = 5 } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes content is required' });
        }

        const quizPrompt = `Generate ${questionCount} quiz questions from these notes:

${notes}

Format as JSON with questions, options, correct answers, and explanations.`;

        const quiz = await callAI(quizPrompt, notes);
        
        res.json({
            success: true,
            content: quiz,
            type: 'quiz',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Quiz generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate quiz',
            details: error.message 
        });
    }
});

// Flashcards generation endpoint
app.post('/v1/turbolearn/generate-flashcards', async (req, res) => {
    try {
        const { notes, cardCount = 8 } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes content is required' });
        }

        const flashcardPrompt = `Generate ${cardCount} flashcards from these notes:

${notes}

Format as JSON with front and back for each card.`;

        const flashcards = await callAI(flashcardPrompt, notes);
        
        res.json({
            success: true,
            content: flashcards,
            type: 'flashcards',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Flashcard generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate flashcards',
            details: error.message 
        });
    }
});

// Summary generation endpoint
app.post('/v1/turbolearn/generate-summary', async (req, res) => {
    try {
        const { notes } = req.body;
        
        if (!notes) {
            return res.status(400).json({ error: 'Notes content is required' });
        }

        const summaryPrompt = `Generate a concise summary of these notes:

${notes}

Focus on key points and main concepts.`;

        const summary = await callAI(summaryPrompt, notes);
        
        res.json({
            success: true,
            content: summary,
            type: 'summary',
            timestamp: Date.now()
        });

    } catch (error) {
        console.error('❌ Summary generation error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate summary',
            details: error.message 
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Note-taking server is running',
        timestamp: Date.now()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Note-taking agent ready!`);
    console.log(`🤖 Groq API integration active`);
    console.log(`🎨 Mermaid diagram support enabled`);
});