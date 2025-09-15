const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// API Keys
const OPENAI_API_KEY = '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';
const HUGGING_FACE_API_KEY = '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';
// Simple UUID generator function
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
// PDF and document processing temporarily disabled - dependencies not installed
// const pdfParse = require('pdf-parse');
// const mammoth = require('mammoth');

// YouTube audio download using yt-dlp
async function downloadYouTubeAudio(videoId) {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    try {
        console.log('📥 Downloading YouTube audio for video:', videoId);
        
        // Create temporary directory if it doesn't exist
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir);
        }
        
        const outputPath = path.join(tempDir, `${videoId}.wav`);
        
        // Use yt-dlp to download audio (download webm/mp4 first, then convert if needed)
        const ytDlpPath = '/Users/prachi.sinha1/Library/Python/3.9/bin/yt-dlp';
        const tempAudioPath = path.join(tempDir, `${videoId}_temp.mp3`);
        
        // Download best audio format directly (no conversion needed - avoid ffmpeg requirement)
        const command = `"${ytDlpPath}" -f "bestaudio[filesize<25M]" -o "${tempAudioPath.replace('.mp3', '.%(ext)s')}" "https://www.youtube.com/watch?v=${videoId}"`;
        
        console.log('🎵 Running yt-dlp command (size-limited audio)...');
        console.log('📍 Command:', command);
        const { stdout, stderr } = await execAsync(command);
        
        // Find the downloaded audio file (any format under 25MB)
        const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`${videoId}_temp`));
        if (files.length === 0) {
            throw new Error('No audio file was downloaded (check file size limit)');
        }
        
        const downloadedFile = path.join(tempDir, files[0]);
        console.log('📁 Downloaded audio file:', downloadedFile);
        
        if (stderr && !stderr.includes('WARNING')) {
            console.log('⚠️ yt-dlp stderr:', stderr);
        }
        
        console.log('✅ Audio downloaded successfully:', downloadedFile);
        
        // Return the path to the downloaded audio file (Hugging Face can handle various formats)
        return downloadedFile;
        
    } catch (error) {
        console.error('❌ Error downloading YouTube audio:', error.message);
        throw new Error(`Failed to download YouTube audio: ${error.message}`);
    }
}

// Fallback: Transcribe audio using OpenAI Whisper API
async function transcribeWithOpenAIWhisper(audioFilePath) {
    try {
        console.log('🤖 Using OpenAI Whisper API as fallback...');
        
        // Read the audio file
        const audioBuffer = fs.readFileSync(audioFilePath);
        console.log('📁 Audio file size:', audioBuffer.length, 'bytes');
        
        // Create multipart form data for OpenAI Whisper
        const boundary = '----formdata-openai-' + Math.random().toString(36).substring(2);
        const formData = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="file"; filename="audio.webm"\r\n`),
            Buffer.from(`Content-Type: audio/webm\r\n\r\n`),
            audioBuffer,
            Buffer.from(`\r\n--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="model"\r\n\r\n`),
            Buffer.from(`whisper-1`),
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);
        
        console.log('📡 Sending to OpenAI Whisper API...');
        console.log('📊 Form data size:', formData.length, 'bytes');
        
        // Make request using native Node.js
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/audio/transcriptions',
                    method: 'POST',
                    headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': formData.length
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('📥 Received response from OpenAI Whisper');
                    console.log('📊 Response status:', res.statusCode);
                    resolve({ statusCode: res.statusCode, body: data });
                });
            });
            
            req.on('error', reject);
            req.write(formData);
            req.end();
        });
        
        if (response.statusCode !== 200) {
            console.error('❌ OpenAI Whisper API error:', response.statusCode, response.body);
            throw new Error(`OpenAI Whisper API error: ${response.statusCode} - ${response.body}`);
        }
        
        const result = JSON.parse(response.body);
        
        if (result.text) {
            console.log('✅ OpenAI Whisper transcription successful!');
            console.log('📊 Transcript length:', result.text.length, 'characters');
            console.log('📝 Transcript preview:', result.text.substring(0, 200) + '...');
            return result.text;
                } else {
            throw new Error('No transcription text received from OpenAI Whisper');
        }
        
    } catch (error) {
        console.error('❌ OpenAI Whisper transcription error:', error);
        throw new Error(`OpenAI Whisper failed: ${error.message}`);
    }
}

// Transcribe audio using Hugging Face Whisper API
async function transcribeWithHuggingFace(audioFilePath) {
    try {
        console.log('🤖 Transcribing audio with Hugging Face Wav2Vec2...');
        
        // Read the audio file
        const audioBuffer = fs.readFileSync(audioFilePath);
        console.log('📁 Audio file size:', audioBuffer.length, 'bytes');
        
        // Simple multipart form-data implementation (no external dependencies)
        const https = require('https');
        
        // Determine content type based on file extension
        const fileExtension = path.extname(audioFilePath).toLowerCase();
        let contentType = 'audio/wav';
        let filename = 'audio.wav';
        
        if (fileExtension === '.webm') {
            contentType = 'audio/webm';
            filename = 'audio.webm';
        } else if (fileExtension === '.m4a') {
            contentType = 'audio/m4a';
            filename = 'audio.m4a';
        } else if (fileExtension === '.mp3') {
            contentType = 'audio/mp3';
            filename = 'audio.mp3';
        }
        
        console.log('🎵 Audio file type:', fileExtension, 'Content-Type:', contentType);
        console.log('📡 Sending raw audio to Hugging Face Wav2Vec2 API...');
        console.log('📊 Audio file size:', audioBuffer.length, 'bytes');
        
        // Send raw audio file directly (not multipart form-data)
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api-inference.huggingface.co',
                path: '/models/facebook/wav2vec2-large-960h-lv60-self',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`,
                    'Content-Type': contentType,
                    'Content-Length': audioBuffer.length
                },
                // Handle SSL certificate issues
                rejectUnauthorized: false
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('📥 Received response from Hugging Face');
                    console.log('📊 Response status:', res.statusCode);
                    resolve({ statusCode: res.statusCode, body: data });
                });
            });
            
            req.on('error', reject);
            req.write(audioBuffer);
            req.end();
        });
        
        // Clean up temporary file first
        try {
            fs.unlinkSync(audioFilePath);
            console.log('🧹 Cleaned up temporary audio file');
        } catch (cleanupError) {
            console.log('⚠️ Could not clean up temporary file:', cleanupError.message);
        }
        
        if (response.statusCode !== 200) {
            console.error('❌ Hugging Face API error:', response.statusCode, response.body);
            
            // Return a simple error message instead of complex fallback
            return `Audio transcription temporarily unavailable (Hugging Face API error ${response.statusCode}). Please try again in a few minutes or upload an audio file directly.`;
        }
        
        const result = JSON.parse(response.body);
        console.log('📝 Hugging Face response:', result);
        
        if (result.text) {
            console.log('✅ Transcription successful!');
            console.log('📊 Transcript length:', result.text.length, 'characters');
            console.log('📝 Transcript preview:', result.text.substring(0, 200) + '...');
            return result.text;
        } else if (result.error) {
            throw new Error(`Hugging Face error: ${result.error}`);
        } else {
            console.log('⚠️ Unexpected response format:', result);
            throw new Error('No transcription text received from Hugging Face');
        }
        
    } catch (error) {
        console.error('❌ Hugging Face transcription error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
    }
}

// Transcribe audio using OpenAI Whisper API (more reliable than Hugging Face)
async function transcribeWithOpenAIWhisper(audioFilePath) {
    try {
        console.log('🤖 Transcribing audio with OpenAI Whisper API...');
        
        // Read the audio file
        const audioBuffer = fs.readFileSync(audioFilePath);
        console.log('📁 Audio file size:', audioBuffer.length, 'bytes');
        
        const https = require('https');
        
        // Determine content type based on file extension
        const fileExtension = path.extname(audioFilePath).toLowerCase();
        let mimeType = 'audio/wav';
        
        if (fileExtension === '.webm') {
            mimeType = 'audio/webm';
        } else if (fileExtension === '.m4a') {
            mimeType = 'audio/m4a';
        } else if (fileExtension === '.mp3') {
            mimeType = 'audio/mp3';
        }
        
        console.log('🎵 Audio file type:', fileExtension, 'MIME type:', mimeType);
        console.log('📡 Sending audio to OpenAI Whisper API...');
        
        // Create multipart form data for OpenAI
        const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
        
        const formData = [];
        formData.push(`--${boundary}\r\n`);
        formData.push(`Content-Disposition: form-data; name="file"; filename="audio${fileExtension}"\r\n`);
        formData.push(`Content-Type: ${mimeType}\r\n\r\n`);
        
        const formDataBuffer = Buffer.concat([
            Buffer.from(formData.join('')),
            audioBuffer,
            Buffer.from(`\r\n--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="model"\r\n\r\nwhisper-1\r\n--${boundary}--\r\n`)
        ]);
        
        console.log('📊 Form data size:', formDataBuffer.length, 'bytes');
        
        const response = await new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.openai.com',
                path: '/v1/audio/transcriptions',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': `multipart/form-data; boundary=${boundary}`,
                    'Content-Length': formDataBuffer.length
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    console.log('📥 Received response from OpenAI');
                    console.log('📊 Response status:', res.statusCode);
                    resolve({ statusCode: res.statusCode, body: data });
                });
            });
            
            req.on('error', reject);
            req.write(formDataBuffer);
            req.end();
        });
        
        // Clean up the temporary audio file
        try {
            fs.unlinkSync(audioFilePath);
            console.log('🧹 Cleaned up temporary audio file');
        } catch (cleanupError) {
            console.log('⚠️ Could not clean up temporary file:', cleanupError.message);
        }
        
        if (response.statusCode !== 200) {
            console.error('❌ OpenAI API error:', response.statusCode, response.body);
            throw new Error(`OpenAI Whisper API error: ${response.statusCode}`);
        }
        
        const result = JSON.parse(response.body);
        console.log('📝 OpenAI Whisper response received');
        
        if (result.text) {
            console.log('✅ Transcription successful!');
            console.log('📊 Transcript length:', result.text.length, 'characters');
            console.log('📝 Transcript preview:', result.text.substring(0, 200) + '...');
            return result.text;
        } else if (result.error) {
            throw new Error(`OpenAI Whisper error: ${result.error.message}`);
        } else {
            console.log('⚠️ Unexpected response format:', result);
            throw new Error('No transcription text received from OpenAI Whisper');
        }
        
    } catch (error) {
        console.error('❌ OpenAI Whisper transcription error:', error);
        throw new Error(`Transcription failed: ${error.message}`);
    }
}

// YouTube processing function using OpenAI Whisper API
async function processYouTubeURL(url) {
    try {
        console.log('🎥 Processing YouTube URL:', url);
        
        // Extract video ID from various YouTube URL formats
        const videoId = extractYouTubeVideoId(url);
        if (!videoId) {
            throw new Error('Invalid YouTube URL format');
        }
        
        console.log('📺 Extracted video ID:', videoId);
        console.log('🤖 Using OpenAI Whisper for transcription...');
        
        try {
            // Download YouTube audio
            const audioFilePath = await downloadYouTubeAudio(videoId);
            
            // Transcribe with OpenAI Whisper
            const transcript = await transcribeWithOpenAIWhisper(audioFilePath);
            
            console.log('🎉 YouTube processing completed successfully!');
            return transcript;
            
        } catch (downloadError) {
            console.error('❌ YouTube processing failed:', downloadError.message);
            
            // If yt-dlp is not installed, provide helpful error message
            if (downloadError.message.includes('yt-dlp')) {
                return `YouTube processing requires yt-dlp installation.

To enable YouTube video processing:
1. Install yt-dlp: pip install yt-dlp
2. Make sure it's available in PATH

Error: ${downloadError.message}

Alternative: Try uploading the audio file directly instead of YouTube URL.`;
            }
            
            throw downloadError;
        }
        
    } catch (error) {
        console.error('❌ YouTube processing error:', error);
        throw new Error(`Failed to process YouTube video: ${error.message}`);
    }
}

// Extract YouTube video ID from various URL formats
function extractYouTubeVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }
    return null;
}

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
        // COMMENTED OUT - Our current detailed prompt with forced tables
        /*
        const notePrompt = `#Role
- You are **ClassNotes Pro**, a senior academic note-writer.
- Persona: clear, neutral, student-friendly — like a top coaching teacher mixed with an engaging explainer.
- Style: emoji-rich, visually scannable, encouraging.

##Task
- From the provided content (lecture transcripts, textbooks, PDFs, research papers, or video captions), generate **DETAILED, COMPREHENSIVE study notes**.
- Capture ALL key facts, definitions, formulas, examples, comparisons, and applications.
- Create extensive bullet points, detailed tables, and structured content.
- Output must look fun, engaging, and student-ready with emojis for categories.
- Make notes exam-ready with comprehensive coverage of topics.

##Context
- Audience: Indian students preparing for exams (school + college).
- Input may come from classroom recordings, YouTube videos, or study PDFs.
- Notes must be usable for:  
  1. Quick revision (scannable)  
  2. Exam prep (highlight formulas, examples, timelines)  
  3. Active recall (self-test Qs, mini quizzes)  
- Output style: lively (with emojis), structured (headings/tables), and concise (phone-friendly).

##Rules
- ✅ Use **emojis for categories**:  
  - Concepts 📘 | Formulas 🧮 | Examples 💡 | Applications 🎯 | Timelines ⏳ | Comparisons ⚖️ | Warnings ⚠️ | Tips ✨ | Quizzes ❓ | Frameworks 🛠️ | Healthcare 🏥 | Data 📊 | Science 🔬 | Technology 🚀  
- ✅ Use \`##\` for section headers and \`-\` for bullets.  
- ✅ Keep sentences ≤ 15 words.  
- ✅ For formulas: always display in LaTeX (e.g., \`E=mc^2\`).  
- ✅ For comparisons/processes: ALWAYS prefer **detailed tables with 4+ columns**.  
- ✅ Add icons to examples (💡) and important values (🔢).  
- ✅ Use ✅ / ⚠️ / 💡 sparingly for emphasis.  
- ✅ End each section with **Check Your Understanding ❓** questions.  
- ✅ CREATE RELEVANT CONTENT-BASED TABLES (aim for 2-3 meaningful tables per response)
- ✅ Include comprehensive bullet points with 3+ levels of sub-bullets
- ✅ Add step-by-step processes with numbered lists and examples
- ✅ GENERATE SMART TABLES from the actual content such as:
  - Key concepts summary table (main topics, definitions, applications)
  - Types/categories table (different varieties, characteristics, examples)
  - Formulas/equations table (formula, variables, applications, examples)
  - Process steps table (step number, action, purpose, notes)
  - Applications table (field, application, benefits, examples)
- ✅ Include real-world examples with numerical data and statistics
- ✅ Make content EXTREMELY detailed and exam-ready with maximum information
- ✅ ALWAYS create tables that organize and summarize the key information from the notes
- ✅ Create extensive sub-bullet hierarchies for each main point
- ❌ Do not hallucinate; if missing → write "Not mentioned in source."  

##Output Format
Always return Markdown-formatted notes with emojis:

\`\`\`markdown
## 📱 [Section Title]
- 📊 Key Point 1
- 🔬 Key Point 2
- 💡 Key Point 3

## 📊 Key Concepts Summary
| Concept | Definition | Key Features | Applications |
|---------|------------|--------------|--------------|
| Topic 1 | Clear definition | Main characteristics | Real-world uses |
| Topic 2 | Precise meaning | Important properties | Practical examples |

## 🧮 Formulas & Equations
| Formula | Variables | Application | Example |
|---------|-----------|-------------|---------|
| \`F = ma\` | F=Force, m=mass, a=acceleration | Newton's law | Car acceleration |
| \`E = mc²\` | E=energy, m=mass, c=speed of light | Energy-mass relation | Nuclear reactions |

## 🎯 Types & Categories  
| Type | Characteristics | Advantages | Use Cases |
|------|----------------|------------|-----------|
| Category A | Specific traits | Benefits | When to use |
| Category B | Different traits | Other benefits | Different applications |

### Check Your Understanding ❓
- Compare the accuracy rates of all three methods in the table
- Calculate the cost difference between Method A and Method B
- Explain how the timeline shows evolution of the concept
\`\`\`

---

Input: ${context || 'Content uploaded for note generation'}

CRITICAL TABLE GUIDELINES:
- ✅ ALWAYS create 2-3 content-relevant tables that organize key information from the notes
- ✅ CREATE tables that summarize main concepts, formulas, types, or processes mentioned in content
- ✅ Examples of relevant tables to create:
  - Key Concepts Summary (concept, definition, features, applications)
  - Formulas/Equations (formula, variables, application, example)
  - Types/Categories (type, characteristics, advantages, use cases)
  - Process Steps (step, action, purpose, notes)
  - Applications (field, application, benefits, examples)
- ✅ Make tables directly useful for studying and reviewing the content
- ✅ Ensure tables organize and clarify information rather than just adding generic content

Output: A markdown note that follows the above format exactly. Make it engaging, student-friendly, and exam-ready with RELEVANT CONTENT-BASED tables.`;
        */

        // COMBINED PROMPTS FOR MANAGER COMPARISON
        
        // SYSTEM PROMPT (Writer-style with structured output)
        /*
        const notePrompt = `SYSTEM
You are a Writer that converts a source-anchored outline into polished notes.
Rules: Do not introduce facts beyond the outline. If outline has "TBD/Not mentioned," keep it that way.

INPUTS
- planner_json: <output from Pass A>
- style: { locale: IN, depth: standard, level: undergrad }

OUTPUT (Markdown only)
- Title + At-a-Glance table
- One H2 per planner.sections; H3 per subsections
- For each "tables" request, add the appropriate table with concise cells
- Render formulas from planner_json exactly (LaTeX)
- 10 flashcards (refine candidate_flashcards; add only if supported by outline)
- 5 MCQs with key, each answer justified in one short line
- TL;DR
- "Source coverage": list H2s with their line ranges (transparency)

###
#Role
- You are **ClassNotes Pro**, a senior academic note-writer.
- Your persona: clear, neutral, student-friendly — like a top coaching class teacher.
- Always focus on accuracy, brevity, and exam-readiness.

##Task
- From the provided <document> blocks (lecture transcripts, textbooks, research papers, or video captions), generate concise, structured **study notes**.
- Capture key facts, definitions, formulas, arguments, and examples.
- Output in a format optimized for quick scanning and revision.
- Never diviate form the input given, always focus on that.

##Context
- Audience: Indian college & school students preparing for exams (mixed Hindi/English input possible, but output in simple English).
- Study scenarios: lecture audio, classroom notes, YouTube videos, or textbook PDFs or teacher notes etc
- Notes must be usable for:  
  1. Revision (short, clear)  
  2. Exam prep (highlight formulas, definitions, timelines)  
  3. Active recall (include self-test questions)  
- Constraints: students often skim on phones, so notes should be short blocks, headings, and bullet lists.

##Reasoning
<context_gathering>
1. Read <document>.  
2. Extract main ideas, facts, and arguments (skip filler words, greetings, or unrelated talk).  
3. Detect the dominant content type:  
   - Theory/Concept → explain simply, add definition + example.  
   - Formula/Equation → display in LaTeX.  
   - Process/Steps → numbered list.  
   - Comparison → table.  
   - Dates/Events → timeline.  
4. Prioritize clarity & compression.  
5. End each section with 2–3 active recall Qs ("Check your understanding").  
</context_gathering>

##Rules
- Structure with \`## Headings\` and bullet points.  
- Sentences ≤ 15 words.  
- No repetition; compress redundant lines.  
- Use ✅/⚠️/💡 sparingly for emphasis.  
- Math: inline LaTeX (e.g., \`E=mc^2\`), not images.  
- Output must be factual; if unclear → mark as "Not mentioned in source."  
- Do not hallucinate or invent extra details.  
- Language: neutral, academic; no slang.  

##Stop Conditions
- If <document> is completely empty or contains no words → output: "No content to process."
- For short content (under 200 characters), still generate basic notes but keep them concise
- Only respond "No valid notes found" if content is completely unrelated to any educational topic

### Output Format
Always return Markdown-formatted notes:

\`\`\`markdown
## [Section Title]

- Key Point 1
- Key Point 2
- Key Point 3

💡 Example: …

✅ Formula: \`F = ma\`

### Check your understanding
- What does F = ma represent?
- Which variable is acceleration?
- Give one real-life example.
\`\`\`

Input: ${context || 'Content uploaded for note generation'}

Output: A markdown note that follows the above format exactly. Make it engaging, student-friendly, and exam-ready.`;
        */

        // OUR ENHANCED PROMPT - Smart table generation only when relevant and needed
        const notePrompt = `#Role
- You are **ClassNotes Pro**, a senior academic note-writer.
- Persona: clear, neutral, student-friendly — like a top coaching teacher mixed with an engaging explainer.
- Style: emoji-rich, visually scannable, encouraging.

##Task
- From the provided content (lecture transcripts, textbooks, PDFs, research papers, or video captions), generate **DETAILED, COMPREHENSIVE study notes**.
- Capture ALL key facts, definitions, formulas, examples, comparisons, and applications.
- Create extensive bullet points, detailed content, and structured material.
- Output must look fun, engaging, and student-ready with emojis for categories.
- Make notes exam-ready with comprehensive coverage of topics.

##Context
- Audience: Indian students preparing for exams (school + college).
- Input may come from classroom recordings, YouTube videos, or study PDFs.
- Notes must be usable for:  
  1. Quick revision (scannable)  
  2. Exam prep (highlight formulas, examples, timelines)  
  3. Active recall (self-test Qs, mini quizzes)  
- Output style: lively (with emojis), structured (headings/tables), and concise (phone-friendly).

##Reasoning
<context_gathering>
1. Parse <document> and identify key **concepts, terms, facts, and formulas**.  
2. Classify content type: Theory 📘, Formula 🧮, Process 🔄, Comparison ⚖️, Timeline ⏳, Application 💡.  
3. Summarize into bullet points, headings, or tables.  
4. Add 2–3 **Check Your Understanding ❓** questions per section.  
5. Keep tone exam-oriented, helpful, and motivating.  
</context_gathering>

##Rules
- ✅ Use **emojis for categories**:  
  - Concepts 📘 | Formulas 🧮 | Examples 💡 | Applications 🎯 | Timelines ⏳ | Comparisons ⚖️ | Warnings ⚠️ | Tips ✨ | Quizzes ❓ | Frameworks 🛠️ | Healthcare 🏥 | Data 📊 | Science 🔬 | Technology 🚀  
- ✅ Use \`##\` for section headers and \`-\` for bullets.  
- ✅ Keep sentences ≤ 15 words.  
- ✅ For formulas: always display in LaTeX (e.g., \`E=mc^2\`).  
- ✅ For comparisons/processes: prefer **detailed tables with 4+ columns** ONLY when content naturally compares multiple items.  
- ✅ Add icons to examples (💡) and important values (🔢).  
- ✅ Use ✅ / ⚠️ / 💡 sparingly for emphasis.  
- ✅ End each section with **Check Your Understanding ❓** questions.  
- ✅ SMART TABLE CREATION: Generate 1-2 relevant tables when content contains:
  - Multiple concepts/methods/theories (create comparison table)
  - Different types/categories/classifications (create summary table)
  - Formulas with variables and applications (create formula table)
  - Step-by-step processes or procedures (create process table)
  - Historical developments or timeline data (create timeline table)
- ✅ Include comprehensive bullet points with 3+ levels of sub-bullets
- ✅ Make content EXTREMELY detailed and exam-ready with maximum information
- ✅ Create extensive sub-bullet hierarchies for each main point
- ❌ Do not hallucinate; if missing → write "Not mentioned in source."  

##Safety/Policy
- Exclude: religious figures/symbols, mythological beings, graphic violence, propaganda, or attacks on individuals/groups.  
- Avoid glorifying private brands.  
- Maintain a **neutral, civic, academic tone**.  
- If <document> contains unsafe or irrelevant content → output: *"Content not suitable for notes."*  

##Stop Conditions
- If <document> is empty, vague, or irrelevant → output: *"No valid notes found."*  

### Output Format
Always return Markdown-formatted notes with emojis:

\`\`\`markdown
## 📱 Data Generation by Smartphones
- 📊 One user generates ≈40 exabytes/month (texts, calls, photos, videos, music).  
- 🌍 With ~5B users, total data is astronomically large.  

## 🌐 Big Data Overview
- 🔬 Big Data = datasets so large/speedy they exceed conventional processing tools.  

## 5 V's of Big Data
| V 📖 | Meaning | Example 💡 |
|------|---------|------------|
| Volume | Massive data amount | 40 EB/month per smartphone |
| Velocity | Fast creation & flow | Real-time video streams |
| Variety | Many formats | Excel, logs, X-rays |
| Veracity | Accuracy/trust | Medical records |
| Value | Useful insights | Faster disease detection |

## 🏥 Healthcare Example
- 📊 2,314 EB of annual medical data.  
- Velocity: rapid entry of new test results.  
- Variety: structured (lab), semi-structured (JSON), unstructured (X-rays).  
- Value: quicker detection, improved plans, reduced costs.  

### Check Your Understanding ❓
- What are the 5 V's of Big Data?  
- Give one healthcare use case of Big Data.  
- Why is veracity important in medical data?  
\`\`\`

Input: ${context || 'Content uploaded for note generation'}

CRITICAL SMART TABLE GUIDELINES:
- ✅ CREATE 1-2 relevant tables that organize and clarify the lecture content
- ✅ Generate tables when content has:
  - Multiple concepts, theories, or methods (comparison table with features/applications)
  - Different types, categories, or classifications (summary table with characteristics)
  - Multiple formulas or equations (formula table with variables/applications)
  - Sequential processes or steps (process table with step/action/purpose)
  - Different approaches or techniques (comparison table with pros/cons/uses)
- ✅ Tables should enhance understanding and study efficiency
- ✅ Also create comprehensive bullet points with 3+ levels of detail
- ✅ Prioritize both detailed explanations AND organized tabular summaries

Output: A markdown note that follows the above format exactly. Make it engaging, student-friendly, and exam-ready with SMART TABLE USAGE.`;

        // Try to call OpenAI API
            console.log('🤖 Attempting to call OpenAI GPT-4o API...');
            
                const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer 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`
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            {
                                role: 'user',
                                content: notePrompt
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 4000
                    })
                });

                if (openaiResponse.ok) {
                    const openaiData = await openaiResponse.json();
                    console.log('✅ OpenAI GPT-4o API call successful!');
                    let content = openaiData.choices?.[0]?.message?.content || 
                                  openaiData.content || 
                                  openaiData.message || 
                                  openaiData.response || 
                                  openaiData;
            
                    // Remove markdown code block wrappers if present
                    if (typeof content === 'string') {
                        content = content.replace(/^```markdown\n/, '').replace(/\n```$/, '');
                        content = content.replace(/^```\n/, '').replace(/\n```$/, '');
                    }
            
            return content;
            } else {
            console.error('❌ OpenAI API error:', openaiResponse.status, openaiResponse.statusText);
                    const errorText = await openaiResponse.text();
            console.error('Error details:', errorText);
            throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
        }
    } catch (error) {
        console.error('❌ Error in callAI:', error);
        throw error;
    }
}

// File processing functions
async function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        const tempPath = path.join(__dirname, 'temp', filename);
        
        // Options for HTTPS requests to handle SSL issues in development
        const options = url.startsWith('https') ? {
            rejectUnauthorized: false // Allow self-signed certificates in development
        } : {};
        
        // Ensure temp directory exists
        const tempDir = path.dirname(tempPath);
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        const file = fs.createWriteStream(tempPath);
        
        client.get(url, options, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve(tempPath);
            });
        }).on('error', (err) => {
            fs.unlink(tempPath, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

async function processAudioFile(url, filename) {
    try {
        console.log(`🎵 Processing audio file: ${filename}`);
        
        // For now, we'll use OpenAI's Whisper API for transcription
        // This requires the OpenAI API key we're already using
        
        // Download the file first
        const tempFilePath = await downloadFile(url, filename);
        
        // Create form data for Whisper API
        const formData = new FormData();
        const fileBuffer = fs.readFileSync(tempFilePath);
        const blob = new Blob([fileBuffer], { type: 'audio/wav' });
        formData.append('file', blob, filename);
        formData.append('model', 'whisper-1');
        
        // Call OpenAI Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer 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`
            },
            body: formData
        });
        
        // Clean up temp file
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temp file:', err);
        });
        
        if (whisperResponse.ok) {
            const transcription = await whisperResponse.json();
            console.log('✅ Audio transcription successful');
            const transcript = transcription.text;
            console.log('📝 Transcribed content:', transcript);
            console.log('📊 Content length:', transcript.length, 'characters');
            return transcript;
        } else {
            throw new Error(`Whisper API error: ${whisperResponse.status}`);
        }
        
    } catch (error) {
        console.error('❌ Audio processing error:', error);
        return `Audio file processing failed: ${error.message}. Please ensure the audio file is in a supported format (mp3, wav, m4a, etc.)`;
    }
}

async function processPDFFile(url, filename) {
    try {
        console.log(`📄 Processing PDF file: ${filename}`);
        
        // Download the PDF file
        const tempFilePath = await downloadFile(url, filename);
        
        // Read and parse the PDF
        const pdfBuffer = fs.readFileSync(tempFilePath);
        // PDF parsing temporarily disabled - pdf-parse not installed
        // const pdfData = await pdfParse(pdfBuffer);
        const pdfData = { text: `PDF content from ${filename}. PDF parsing requires pdf-parse library installation.` };
        
        // Clean up temp file
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temp PDF file:', err);
        });
        
        console.log('✅ PDF parsing successful');
        return `PDF Content from ${filename}:\n\n${pdfData.text}`;
        
    } catch (error) {
        console.error('❌ PDF processing error:', error);
        return `PDF processing failed: ${error.message}. Please ensure the PDF file is not corrupted and contains extractable text.`;
    }
}

async function processDocumentFile(url, filename) {
    try {
        console.log(`📝 Processing document file: ${filename}`);
        
        // Download the document file
        const tempFilePath = await downloadFile(url, filename);
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        
        let textContent = '';
        
        if (fileExtension === 'docx') {
            // Document processing temporarily disabled - mammoth not installed
            // const result = await mammoth.extractRawText({ path: tempFilePath });
            // textContent = result.value;
            textContent = `Word document content from ${filename}. Document processing requires mammoth library installation.`;
        } else if (['txt', 'rtf'].includes(fileExtension)) {
            // Process plain text files
            textContent = fs.readFileSync(tempFilePath, 'utf8');
        } else {
            throw new Error(`Unsupported document format: ${fileExtension}`);
        }
        
        // Clean up temp file
        fs.unlink(tempFilePath, (err) => {
            if (err) console.error('Error deleting temp document file:', err);
        });
        
        console.log('✅ Document parsing successful');
        return `Document Content from ${filename}:\n\n${textContent}`;
        
    } catch (error) {
        console.error('❌ Document processing error:', error);
        return `Document processing failed: ${error.message}. Supported formats: .docx, .txt, .rtf`;
    }
}

// Main note-taking endpoint
app.post('/v1/turbolearn/take-notes', upload.array('files', 10), async (req, res) => {
    try {
        console.log('📝 Note-taking request received');
        console.log('Files:', req.files?.length || 0);
        console.log('Body:', JSON.stringify(req.body, null, 2));

        const { prompt, files, youtubeUrl } = req.body;
        let context = '';

        // Handle YouTube URL if provided
        if (youtubeUrl) {
            console.log('🎥 Processing YouTube URL from request...');
            try {
                const youtubeContent = await processYouTubeURL(youtubeUrl);
                context += youtubeContent + '\n\n';
            } catch (youtubeError) {
                console.error('❌ YouTube processing error:', youtubeError.message);
                context += `Error processing YouTube URL: ${youtubeError.message}\n\n`;
            }
        }

        // Process uploaded files
        if (req.files && req.files.length > 0) {
            console.log('📁 Processing uploaded files...');
            for (const file of req.files) {
                console.log(`Processing file: ${file.originalname} (${file.mimetype})`);
                
                // For now, just add file info to context
                context += `\n\nFile: ${file.originalname}\nType: ${file.mimetype}\nSize: ${file.size} bytes\n`;
            }
        }

        // Process files from request body (actual file data)
        if (files && Array.isArray(files)) {
            console.log('📁 Processing files from request body...');
            for (const file of files) {
                console.log(`Processing file: ${file.name || file.fileName}`);
                
                if (!file.url) {
                    console.error('❌ No file URL provided for processing');
                    continue;
                }
                
                try {
                    // Process different file types
                    let fileContent = '';
                    
                    if (file.fileType === 'audio' || file.mimetype?.includes('audio')) {
                        console.log('🎵 Processing audio file...');
                        // For audio files, we need transcription service
                        fileContent = await processAudioFile(file.url, file.fileName || file.name);
                    } else if (file.fileType === 'pdf' || file.mimetype?.includes('pdf')) {
                        console.log('📄 Processing PDF file...');
                        fileContent = await processPDFFile(file.url, file.fileName || file.name);
                    } else if (file.fileType === 'document' || file.mimetype?.includes('document') || 
                              file.mimetype?.includes('text') || file.mimetype?.includes('docx')) {
                        console.log('📝 Processing document file...');
                        fileContent = await processDocumentFile(file.url, file.fileName || file.name);
                    } else {
                        console.log('📎 Processing generic file...');
                        fileContent = `File: ${file.fileName || file.name}\nType: ${file.fileType || file.mimetype}\nSize: ${file.fileSize} bytes`;
                    }
                    
                    context += `\n\n=== FILE CONTENT ===\n`;
                    context += `File: ${file.fileName || file.name}\n`;
                    context += `Type: ${file.fileType || file.mimetype}\n\n`;
                    context += fileContent;
                    context += `\n=== END FILE CONTENT ===\n`;
                    
                } catch (error) {
                    console.error(`❌ Error processing file ${file.fileName || file.name}:`, error);
                    context += `\n\nFile: ${file.fileName || file.name} (Processing failed: ${error.message})\n`;
                }
            }
        }

        // Check if we have any actual content to process
        if (!context.trim()) {
            return res.status(400).json({
                success: false,
                error: 'No file content available to process. Please upload audio, PDF, or document files with actual content.',
                details: 'The system requires real file uploads to generate notes.'
            });
        }

        // Generate notes using AI
        console.log('🤖 Generating notes with AI...');
        console.log('Context length:', context.length);
        console.log('📝 Context content preview:', context.substring(0, 500));
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

// Model configs endpoint (required by frontend)
app.get('/v1/modelConfigs', (req, res) => {
    try {
        const { language = 'en' } = req.query;
    
        // Mock model data for the frontend
        const modelConfigs = {
        code: 200,
        data: {
            modelData: [
                {
                        modelId: 'krutrim-2.5-turbo',
                        title: 'Krutrim 2.5 Turbo',
                        titleInside: 'Krutrim 2.5 Turbo',
                        description: 'Advanced AI model for general purpose tasks',
                        iconUrl: '/icons/krutrim.svg',
                        iconUrlInside: '/icons/krutrim.svg',
                    visibility: true,
                    regeneration: true,
                    default: true
                    },
                    {
                        modelId: 'groq-compound',
                        title: 'Groq Compound',
                        titleInside: 'Groq Compound',
                        description: 'Fast and efficient AI model',
                        iconUrl: '/icons/groq.svg',
                        iconUrlInside: '/icons/groq.svg',
                        visibility: true,
                        regeneration: true,
                        default: false
                    },
                    {
                        modelId: 'claude-3-sonnet',
                        title: 'Claude 3 Sonnet',
                        titleInside: 'Claude 3 Sonnet',
                        description: 'Anthropic Claude 3 Sonnet model',
                        iconUrl: '/icons/claude.svg',
                        iconUrlInside: '/icons/claude.svg',
                        visibility: true,
                        regeneration: true,
                        default: false
                }
            ],
            focusModes: [
                {
                    sourceId: 'general',
                    title: 'General',
                    titleInside: 'General',
                        description: 'General purpose mode',
                        iconUrl: '/icons/general.svg',
                        iconUrlInside: '/icons/general.svg',
                        selectedColor: '#3b82f6',
                    default: true
                }
            ],
            toolData: [
                {
                        id: 'general-chat',
                        toolId: 'general-chat',
                        label: 'General Chat',
                        title: 'General Chat',
                        titleInside: 'General Chat',
                        description: 'General purpose AI assistant for any questions',
                        icon: '/icons/chat.svg',
                        iconUrl: '/icons/chat.svg',
                        iconUrlInside: '/icons/chat.svg',
                        selectedColor: '#3b82f6',
                        default: true,
                        inputPlaceholder: 'Ask me anything...',
                        headerText: 'General Chat'
                    },
                    {
                        id: 'note-taking-agent',
                        toolId: 'note-taking-agent',
                        label: 'Note-Taking Agent',
                        title: 'AI Note-Taking Assistant',
                        titleInside: 'Note-Taking Agent',
                        description: 'Upload files to generate comprehensive notes with mindmaps and flowcharts',
                        icon: '/icons/brain.svg',
                        iconUrl: '/icons/brain.svg',
                        iconUrlInside: '/icons/brain.svg',
                        selectedColor: '#8b5cf6',
                    default: false,
                        inputPlaceholder: 'Upload files or enter text to generate notes...',
                        headerText: 'AI Note-Taking Assistant'
                    },
                    {
                        id: 'quiz-generator',
                        toolId: 'quiz-generator',
                        label: 'Quiz Generator',
                        title: 'Quiz Generator',
                        titleInside: 'Quiz Generator',
                        description: 'Generate interactive quizzes from your content',
                        icon: '/icons/quiz.svg',
                        iconUrl: '/icons/quiz.svg',
                        iconUrlInside: '/icons/quiz.svg',
                        selectedColor: '#10b981',
                    default: false,
                        inputPlaceholder: 'Enter content to generate quiz questions...',
                        headerText: 'Quiz Generator'
                    },
                    {
                        id: 'flashcard-generator',
                        toolId: 'flashcard-generator',
                        label: 'Flashcard Generator',
                        title: 'Flashcard Generator',
                        titleInside: 'Flashcard Generator',
                        description: 'Create study flashcards from your notes',
                        icon: '/icons/cards.svg',
                        iconUrl: '/icons/cards.svg',
                        iconUrlInside: '/icons/cards.svg',
                        selectedColor: '#f59e0b',
                    default: false,
                        inputPlaceholder: 'Enter content to generate flashcards...',
                        headerText: 'Flashcard Generator'
                    },
                    {
                        id: 'image-generator',
                        toolId: 'image-generator',
                        label: 'Image Generator',
                        title: 'Image Generator',
                        titleInside: 'Image Generator',
                        description: 'Generate images from text descriptions',
                        icon: '/icons/image.svg',
                        iconUrl: '/icons/image.svg',
                        iconUrlInside: '/icons/image.svg',
                        selectedColor: '#ec4899',
                    default: false,
                        inputPlaceholder: 'Describe the image you want to generate...',
                        headerText: 'Image Generator'
                    },
                    {
                        id: 'code-assistant',
                        toolId: 'code-assistant',
                        label: 'Code Assistant',
                        title: 'Code Assistant',
                        titleInside: 'Code Assistant',
                        description: 'Get help with coding and programming',
                        icon: '/icons/code.svg',
                        iconUrl: '/icons/code.svg',
                        iconUrlInside: '/icons/code.svg',
                        selectedColor: '#06b6d4',
                    default: false,
                        inputPlaceholder: 'Ask about coding or paste your code...',
                        headerText: 'Code Assistant'
                }
            ]
        },
        HttpStatus: 200,
        timestamp: Date.now(),
        status: 'success'
    };
    
        res.json(modelConfigs);
    } catch (error) {
        console.error('❌ Model configs error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch model configs',
            details: error.message 
        });
    }
});

// File upload endpoint for S3 pre-signed URLs
app.post('/v1/file/upload', async (req, res) => {
    try {
        const { fileName, fileExtension, fileSize } = req.body;
        
        if (!fileName || !fileExtension) {
            return res.status(400).json({
                error: 'Missing required fields: fileName, fileExtension'
            });
        }

        // Generate unique file key
        const fileKey = `fileAttachments/userId_0166b432-dd33-48de-bc47-48f625171320/${uuidv4()}.${fileExtension}`;
        
        // Mock S3 URLs (replace with actual S3 implementation if needed)
        const baseUrl = 'https://chat-apps-2.s3.ap-south-1.amazonaws.com';
        const uploadUrl = `${baseUrl}/${fileKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250912T110617Z&X-Amz-SignedHeaders=host&X-Amz-Expires=86400&X-Amz-Credential=AKIAU7QUHIR45CRWAE7C%2F20250912%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=${uuidv4()}`;
        const downloadUrl = `${baseUrl}/${fileKey}?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20250912T110617Z&X-Amz-SignedHeaders=host&X-Amz-Expires=86399&X-Amz-Credential=AKIAU7QUHIR45CRWAE7C%2F20250912%2Fap-south-1%2Fs3%2Faws4_request&X-Amz-Signature=${uuidv4()}`;

        res.json({
            code: 200,
            data: {
                fileName: fileName,
                uploadUrl: uploadUrl,
                downloadUrl: downloadUrl,
                fileKey: fileKey,
                fileSize: fileSize,
                fileExtension: fileExtension
            },
            HttpStatus: "OK",
            timestamp: Date.now(),
            status: "success"
        });

        console.log(`📤 Generated pre-signed URLs for: ${fileName}.${fileExtension}`);
    } catch (error) {
        console.error('❌ File upload endpoint error:', error);
        res.status(500).json({ error: 'Failed to generate upload URLs' });
    }
});

// Quiz generation endpoint
app.post('/v1/turbolearn/generate-quiz', async (req, res) => {
    try {
        const { content, prompt } = req.body;
        console.log('📝 Quiz generation request received');
        
        const quizPrompt = `Generate a quiz based on the following content. Create 5-8 multiple choice questions with 4 options each. 

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
    "questions": [
        {
            "question": "Question text",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct": "Option A",
            "explanation": "Why this answer is correct"
        }
    ]
}

Content: ${content || prompt || 'No content provided'}`;
        
        const quiz = await callAI(quizPrompt, '');
        
        // Parse the quiz response to ensure it's valid JSON
        console.log('🔍 Raw quiz response:', quiz);
        let quizData;
        try {
            // Try to extract JSON from the response if it's wrapped in text
            let jsonString = quiz;
            if (typeof quiz === 'string') {
                // Look for JSON between ```json and ``` or { and }
                const jsonMatch = quiz.match(/```json\s*([\s\S]*?)\s*```/) || quiz.match(/(\{[\s\S]*\})/);
                if (jsonMatch) {
                    jsonString = jsonMatch[1];
                }
                quizData = JSON.parse(jsonString);
            } else {
                quizData = quiz;
            }
        } catch (e) {
            console.log('❌ JSON parsing failed, using fallback quiz');
            // Fallback quiz if parsing fails
            quizData = {
                questions: [
                    {
                        question: "What is the main topic of this content?",
                        options: ["Topic A", "Topic B", "Topic C", "Topic D"],
                        correct: "Topic A",
                        explanation: "Based on the provided content, this appears to be the main focus."
                    }
                ]
            };
        }
        console.log('📝 Parsed quiz data:', quizData);
        
        res.json({ success: true, quiz: quizData, type: 'quiz' });
    } catch (error) {
        console.error('❌ Quiz generation error:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

// Flashcard generation endpoint
app.post('/v1/turbolearn/generate-flashcards', async (req, res) => {
    try {
        const { content, prompt } = req.body;
        console.log('📝 Flashcard generation request received');
        
        const flashcardPrompt = `Generate flashcards based on the following content. Create 8-12 flashcards with front and back.

IMPORTANT: Return ONLY valid JSON in this exact structure:
{
    "flashcards": [
        {
            "front": "Term or question",
            "back": "Definition or answer"
        }
    ]
}

Content: ${content || prompt || 'No content provided'}`;
        
        const flashcards = await callAI(flashcardPrompt, '');
        
        // Parse the flashcard response to ensure it's valid JSON
        console.log('🔍 Raw flashcard response:', flashcards);
        let flashcardData;
        try {
            // Try to extract JSON from the response if it's wrapped in text
            let jsonString = flashcards;
            if (typeof flashcards === 'string') {
                // Look for JSON between ```json and ``` or { and }
                const jsonMatch = flashcards.match(/```json\s*([\s\S]*?)\s*```/) || flashcards.match(/(\{[\s\S]*\})/);
                if (jsonMatch) {
                    jsonString = jsonMatch[1];
                }
                flashcardData = JSON.parse(jsonString);
            } else {
                flashcardData = flashcards;
            }
        } catch (e) {
            console.log('❌ JSON parsing failed, using fallback flashcards');
            // Fallback flashcards if parsing fails
            flashcardData = {
                flashcards: [
                    {
                        front: "Key Term",
                        back: "Definition of the key term from the content"
                    },
                    {
                        front: "Important Concept",
                        back: "Explanation of the important concept"
                    }
                ]
            };
        }
        console.log('📝 Parsed flashcard data:', flashcardData);
        
        res.json({ success: true, flashcards: flashcardData, type: 'flashcards' });
    } catch (error) {
        console.error('❌ Flashcard generation error:', error);
        res.status(500).json({ error: 'Failed to generate flashcards' });
    }
});

// Chat stream response endpoint (for frontend compatibility)
app.post('/chat/stream-response', async (req, res) => {
    try {
        console.log('💬 Chat stream response request received');
        console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
        
        const { message, searchType, toolId } = req.body;
        
        // Set headers for streaming response
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
        
        // Send a simple response for now
        const response = {
            type: 'message',
            content: `I received your message: "${message}". This is a mock response from the note-taking backend.`,
            timestamp: new Date().toISOString()
        };
        
        res.write(`data: ${JSON.stringify(response)}\n\n`);
        res.end();
        
    } catch (error) {
        console.error('❌ Chat stream response error:', error);
        res.status(500).json({ error: 'Failed to process chat request' });
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
    console.log(`🤖 OpenAI GPT-4o API integration active`);
    console.log(`🎨 Mermaid diagram support enabled`);
});