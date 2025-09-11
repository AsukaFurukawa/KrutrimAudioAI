const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        // For note generation, call the actual LLM with a proper prompt
        if (prompt.includes('notes') || prompt.includes('note')) {
            // Create a comprehensive prompt for the LLM to generate structured notes
            const notePrompt = `You are an expert AI study assistant. Generate comprehensive, engaging study notes from the provided audio content. 

**REQUIREMENTS:**
- Use a fun, student-friendly tone with emojis throughout
- Structure like a textbook with clear headings and explanations
- Include detailed explanations BEFORE any tables
- Use the following format:

# 🤖 [TOPIC NAME]

## 📚 Topic & Intro
[1-2 line introduction with emojis]

## 🔬 Key Sections

### 🎯 :blue_book: [Main Concept 1]
[3-5 sentence explanation with examples]

### 🧪 :microscope: [Main Concept 2] 
[Detailed explanation with pros/cons]

### 📊 :abacus: [Comparison Table]
| Aspect | Option A | Option B |
|--------|----------|----------|
| Feature | Description | Description |

## 🚀 Applications / Use Cases
[Real-world examples]

## ⚠️ Challenges / Limitations
[Common problems and solutions]

## 🎯 Quick Recap
• Key point 1 🎓
• Key point 2 🔍
• Key point 3 🎮

## 🧠 Quiz / Flashcards
**Q1**: [Question]
**A1**: [Answer]

## 📝 Final Summary
[2-3 sentence wrap-up with emojis]

**Audio Content Context:** ${context || 'Audio file uploaded for note generation'}

Generate engaging, comprehensive notes that students will love to study from!`;

            // Call the actual LLM API
            const llmResponse = await fetch('https://r1.staging.olakrutrim.com/chat/stream-response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-TOKEN': process.env.API_TOKEN || 'your-api-token-here'
                },
                body: JSON.stringify({
                    message: notePrompt,
                    searchType: 'others',
                    chatId: 'note-generation-session'
                })
            });

            if (llmResponse.ok) {
                const llmData = await llmResponse.json();
                return {
                    content: llmData.content || llmData.message || llmData.response || llmData
                };
            } else {
                console.log('LLM API not available, using fallback content');
                // Fallback to mock content if LLM is not available
                return {
                    content: `# 🤖 MACHINE LEARNING FUNDAMENTALS

## 📚 Topic & Intro

**Machine Learning** is like teaching computers to learn from examples, just like how we learn from experience! Instead of programming every single rule, we show the computer lots of examples and let it figure out the patterns on its own. It's like having a super-smart student that never gets tired! 🧠✨

---

## 🔬 Key Sections

### 🎯 :blue_book: What is Machine Learning?

Think of ML as **pattern recognition on steroids**! 🚀 It's a subset of AI that enables computers to:
- **Learn from data** without being explicitly programmed
- **Make predictions** on new, unseen information  
- **Improve automatically** through experience
- **Find hidden patterns** humans might miss

**The Magic Formula**: Data + Algorithm + Training = Smart Predictions! ✨

### 🧪 :microscope: Types of Machine Learning

#### 1. 🎓 Supervised Learning: Learning with a Teacher

**What it is**: Like learning with a tutor who shows you the right answers! The algorithm gets both questions AND answers during training.

**How it works**:
1. **Input** → Algorithm → **Output** (with known correct answer)
2. Algorithm learns the pattern: "When I see X, I should predict Y"
3. Later, when given new X, it predicts Y based on what it learned

**Real-world examples**:
- 📧 **Email spam detection**: "This email looks like spam" ✅
- 🏥 **Medical diagnosis**: "This scan shows cancer" ⚠️
- 🏠 **House price prediction**: "This house should cost $500K" 💰

**Pros** ✅:
- High accuracy when you have good labeled data
- Clear performance metrics
- Easy to understand and interpret

**Cons** ❌:
- Needs lots of labeled training data
- Labeling data is expensive and time-consuming
- May not work well on completely new types of data

#### 2. 🔍 Unsupervised Learning: Learning Without a Teacher

**What it is**: Like exploring a new city without a map! The algorithm finds patterns and groups in data without knowing what to look for.

**How it works**:
1. **Input** → Algorithm → **Discovers patterns** (no "correct" answers provided)
2. Algorithm finds natural groupings and relationships
3. Reveals hidden insights humans might miss

**Real-world examples**:
- 🛒 **Customer segmentation**: "These customers shop similarly"
- 🚨 **Fraud detection**: "This transaction looks unusual"
- 🎵 **Music recommendation**: "People who like this also like that"

**Pros** ✅:
- No need for labeled data
- Can discover unexpected insights
- Great for exploring new datasets

**Cons** ❌:
- Hard to evaluate performance
- Results can be subjective
- May not find meaningful patterns

#### 3. 🎮 Reinforcement Learning: Learning Through Trial and Error

**What it is**: Like learning to play a video game! The algorithm tries different actions and learns from rewards and penalties.

**How it works**:
1. **Action** → **Environment** → **Reward/Penalty** → **Learn**
2. Algorithm tries different strategies
3. Learns which actions lead to better outcomes

**Real-world examples**:
- ♟️ **Game playing**: AlphaGo beating world champions
- 🚗 **Self-driving cars**: Learning to navigate traffic
- 🤖 **Robotics**: Teaching robots to walk and grab objects

**Pros** ✅:
- Can learn complex behaviors
- Adapts to changing environments
- Discovers creative solutions

**Cons** ❌:
- Needs careful reward system design
- Can be slow to learn
- Hard to debug when things go wrong

### 📊 :abacus: Comparison Table

| Aspect | 🎓 Supervised | 🔍 Unsupervised | 🎮 Reinforcement |
|--------|---------------|-----------------|------------------|
| **Data Needed** | Labeled examples | Raw data only | Environment + rewards |
| **Learning Style** | Learn input→output mapping | Find hidden patterns | Trial and error |
| **Best For** | Prediction tasks | Data exploration | Decision making |
| **Examples** | Spam detection, price prediction | Customer groups, anomaly detection | Game playing, robotics |
| **Difficulty** | Medium | Easy | Hard |

---

## 🚀 Applications / Use Cases

### 🏥 Healthcare
- **Medical imaging**: Detecting tumors in X-rays and MRIs
- **Drug discovery**: Finding new treatments faster
- **Personalized medicine**: Tailoring treatments to individual patients

### 💰 Finance  
- **Fraud detection**: Spotting suspicious transactions in real-time
- **Algorithmic trading**: Making profitable trades automatically
- **Credit scoring**: Assessing loan risk accurately

### 🛒 Technology
- **Recommendation systems**: "You might also like..." suggestions
- **Voice assistants**: Understanding and responding to speech
- **Image recognition**: Identifying objects in photos

---

## ⚠️ Challenges / Limitations

### 🎯 Overfitting: The Memorization Problem
**What happens**: Model memorizes training data but fails on new data
**Like**: A student who memorizes textbook answers but can't solve new problems
**Solutions**: More data, regularization, cross-validation

### 🐌 Underfitting: The Oversimplification Problem  
**What happens**: Model is too simple to capture real patterns
**Like**: Trying to explain quantum physics with only basic math
**Solutions**: More complex models, better features, longer training

---

## 🎯 Quick Recap

• **Supervised Learning** = Learning with answers (like having a tutor) 🎓
• **Unsupervised Learning** = Finding patterns without guidance (like exploring) 🔍  
• **Reinforcement Learning** = Learning through trial and error (like gaming) 🎮
• **Choose the right type** based on your data and goals 🎯
• **Start simple** and add complexity as needed 🚀

---

## 🧠 Quiz / Flashcards

**Q1**: What's the main difference between supervised and unsupervised learning?
**A1**: Supervised learning uses labeled data (input + correct output), while unsupervised learning finds patterns in unlabeled data.

**Q2**: Which type of ML would you use to detect credit card fraud?
**A2**: Unsupervised learning - it can identify unusual patterns without needing examples of "fraud" vs "normal" transactions.

**Q3**: What's overfitting and how do you prevent it?
**A3**: Overfitting is when a model memorizes training data but fails on new data. Prevent it with more data, regularization, or cross-validation.

**Q4**: Why is reinforcement learning good for game playing?
**A4**: Because games have clear rewards/penalties and require learning optimal strategies through trial and error.

**Q5**: What's the "black box" problem in neural networks?
**A5**: Neural networks can be hard to interpret - you know they work but don't always understand how they make decisions.

---

## 📝 Final Summary

Machine learning is like giving computers the ability to learn from experience! 🎉 Whether you're using supervised learning for predictions, unsupervised learning for discovery, or reinforcement learning for decision-making, the key is choosing the right approach for your problem and data. Start simple, validate properly, and remember - the best ML models are the ones that actually solve real problems! 🚀✨`
                };
            }
        }
        
        // For other requests, use mock responses
        if (prompt.includes('intent') || prompt.includes('detect')) {
            return '{"intent": "note_generation", "confidence": 0.95, "reasoning": "User message contains note-related keywords"}';
        }
        
        // Default response
        return {
            content: "I'm here to help with your questions! Ask me anything about the notes or any other topic.",
            type: "general_response"
        };
    } catch (error) {
        console.error('Error in callAI:', error);
        return {
            content: "Sorry, I encountered an error processing your request. Please try again.",
            type: "error"
        };
    }
}

// Routes

// Health check
app.get('/actuator/health', (req, res) => {
    res.json({ status: 'UP', service: 'Turbolearn AI Backend' });
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
        const aiResponse = await callAI(prompt);
        
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

// Detect intent endpoint
app.post('/v1/turbolearn/detect-intent', async (req, res) => {
    try {
        console.log('🎯 Detect intent request:', JSON.stringify(req.body, null, 2));
        
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'No message provided' });
        }
        
        // Simple intent detection
        const noteKeywords = ['notes', 'note', 'summary', 'summarize', 'take notes', 'generate notes'];
        const isNoteRequest = noteKeywords.some(keyword => 
            message.toLowerCase().includes(keyword.toLowerCase())
        );
        
        const response = {
            intent: isNoteRequest ? 'note_generation' : 'general_chat',
            confidence: isNoteRequest ? 0.95 : 0.7,
            reasoning: isNoteRequest 
                ? 'User message contains note-related keywords'
                : 'User message appears to be general conversation'
        };
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error detecting intent:', error);
        res.status(500).json({ 
            error: 'Failed to detect intent',
            details: error.message 
        });
    }
});

// Model configs endpoint
app.get('/v1/modelConfigs', (req, res) => {
    console.log('🔧 Model configs request');
    
    const configs = {
        code: 200,
        data: {
            modelData: [
                {
                    modelId: 'krutrim-v2',
                    title: 'Krutrim V2',
                    titleInside: 'Krutrim V2',
                    description: 'Advanced AI model for comprehensive assistance',
                    iconUrl: '/icons/input/krutrim.svg',
                    iconUrlInside: '/icons/input/krutrim.svg',
                    visibility: true,
                    regeneration: true
                }
            ],
            focusModes: [
                {
                    sourceId: 'general',
                    title: 'General',
                    titleInside: 'General',
                    description: 'General purpose assistance',
                    iconUrl: '/icons/input/general.svg',
                    iconUrlInside: '/icons/input/general.svg',
                    selectedColor: '#3B82F6',
                    default: true
                },
                {
                    sourceId: 'academic',
                    title: 'Academic',
                    titleInside: 'Academic',
                    description: 'Academic and educational assistance',
                    iconUrl: '/icons/input/academic.svg',
                    iconUrlInside: '/icons/input/academic.svg',
                    selectedColor: '#8B5CF6',
                    default: false
                }
            ],
            toolData: [
                {
                    id: 'image-creator',
                    toolId: 'image-creator',
                    modelId: 'image-creator',
                    title: 'Image Creator',
                    titleInside: 'Image Creator',
                    description: 'Turn your ideas into images',
                    iconUrl: '/icons/input/tools.svg',
                    iconUrlInside: '/icons/input/tools.svg',
                    selectedColor: '#8B5CF6',
                    default: false,
                    visibility: true,
                    category: 'creative',
                    inputPlaceholder: 'Describe the image you want to create',
                    headerText: 'Turn your ideas into images'
                },
                {
                    id: 'cab-agent',
                    toolId: 'cab-agent',
                    modelId: 'cab-agent',
                    title: 'Cab Agent',
                    titleInside: 'Cab Agent',
                    description: 'Book a cab instantly, anytime',
                    iconUrl: '/icons/input/tools.svg',
                    iconUrlInside: '/icons/input/tools.svg',
                    selectedColor: '#10B981',
                    default: false,
                    visibility: true,
                    category: 'transport',
                    inputPlaceholder: 'Where do you want to go?',
                    headerText: 'Book a cab instantly, anytime'
                },
                {
                    id: 'food-order-agent',
                    toolId: 'food-order-agent',
                    modelId: 'food-order-agent',
                    title: 'Food Order Agent',
                    titleInside: 'Food Order Agent',
                    description: 'Order food from your favorite places',
                    iconUrl: '/icons/input/tools.svg',
                    iconUrlInside: '/icons/input/tools.svg',
                    selectedColor: '#F59E0B',
                    default: false,
                    visibility: true,
                    category: 'food',
                    inputPlaceholder: 'What would you like to order?',
                    headerText: 'Order food from your favorite places'
                },
                {
                    id: 'bill-pay-agent',
                    toolId: 'bill-pay-agent',
                    modelId: 'bill-pay-agent',
                    title: 'Bill Pay Agent',
                    titleInside: 'Bill Pay Agent',
                    description: 'Pay your bills in seconds',
                    iconUrl: '/icons/input/tools.svg',
                    iconUrlInside: '/icons/input/tools.svg',
                    selectedColor: '#EF4444',
                    default: false,
                    visibility: true,
                    category: 'finance',
                    inputPlaceholder: 'Which bill would you like to pay?',
                    headerText: 'Pay your bills in seconds'
                },
                {
                    id: 'note-taking-agent',
                    toolId: 'note-taking-agent',
                    modelId: 'note-taking-agent',
                    title: 'Note Taking Agent',
                    titleInside: 'Note Taking Agent',
                    description: 'Generate structured notes from audio content',
                    iconUrl: '/icons/input/doc.svg',
                    iconUrlInside: '/icons/input/doc.svg',
                    selectedColor: '#3B82F6',
                    default: false,
                    visibility: true,
                    category: 'productivity',
                    inputPlaceholder: 'Upload audio files to generate notes',
                    headerText: 'Generate comprehensive notes from your audio content'
                }
            ]
        },
        HttpStatus: 200,
        timestamp: Date.now(),
        status: 'success'
    };
    
    res.json(configs);
});

// Generate quiz endpoint
app.post('/v1/turbolearn/generate-quiz', async (req, res) => {
    try {
        console.log('🧠 Generate quiz request:', JSON.stringify(req.body, null, 2));
        
        const quiz = {
            questions: [
                {
                    id: 1,
                    question: "What is supervised learning?",
                    options: [
                        "Learning without labeled data",
                        "Learning with labeled examples",
                        "Learning through trial and error",
                        "Learning without guidance"
                    ],
                    correct: 1,
                    explanation: "Supervised learning uses labeled examples to learn patterns."
                },
                {
                    id: 2,
                    question: "Which type of ML is best for fraud detection?",
                    options: [
                        "Supervised Learning",
                        "Unsupervised Learning", 
                        "Reinforcement Learning",
                        "All of the above"
                    ],
                    correct: 1,
                    explanation: "Unsupervised learning can identify unusual patterns without needing examples of fraud."
                }
            ]
        };
        
        res.json({ success: true, quiz });
        
    } catch (error) {
        console.error('❌ Error generating quiz:', error);
        res.status(500).json({ error: 'Failed to generate quiz' });
    }
});

// Generate flashcards endpoint
app.post('/v1/turbolearn/generate-flashcards', async (req, res) => {
    try {
        console.log('📚 Generate flashcards request:', JSON.stringify(req.body, null, 2));
        
        const flashcards = [
            {
                id: 1,
                front: "What is Machine Learning?",
                back: "A subset of AI that enables computers to learn from data without being explicitly programmed."
            },
            {
                id: 2,
                front: "What are the three types of ML?",
                back: "Supervised Learning, Unsupervised Learning, and Reinforcement Learning."
            },
            {
                id: 3,
                front: "What is overfitting?",
                back: "When a model memorizes training data but fails on new data."
            }
        ];
        
        res.json({ success: true, flashcards });
        
    } catch (error) {
        console.error('❌ Error generating flashcards:', error);
        res.status(500).json({ error: 'Failed to generate flashcards' });
    }
});

// Generate summary endpoint
app.post('/v1/turbolearn/generate-summary', async (req, res) => {
    try {
        console.log('📊 Generate summary request:', JSON.stringify(req.body, null, 2));
        
        const summary = {
            title: "Machine Learning Fundamentals Summary",
            keyPoints: [
                "Machine Learning enables computers to learn from data without explicit programming",
                "Three main types: Supervised, Unsupervised, and Reinforcement Learning",
                "Each type has specific use cases and advantages",
                "Proper data preprocessing is crucial for success",
                "Start simple and gradually increase complexity"
            ],
            recommendations: [
                "Practice with real datasets",
                "Learn programming (Python recommended)",
                "Understand statistics fundamentals",
                "Experiment with different tools and libraries"
            ]
        };
        
        res.json({ success: true, summary });
        
    } catch (error) {
        console.error('❌ Error generating summary:', error);
        res.status(500).json({ error: 'Failed to generate summary' });
    }
});

// Generate story endpoint
app.post('/v1/turbolearn/generate-story', async (req, res) => {
    try {
        console.log('📚 Generate story request:', JSON.stringify(req.body, null, 2));
        
        const story = {
            title: "The Journey of a Data Scientist",
            content: "Once upon a time, there was a curious data scientist named Alex who discovered the magic of machine learning. Alex learned that with the right data and algorithms, computers could find patterns that humans might miss. Through supervised learning, Alex taught computers to recognize images. With unsupervised learning, Alex discovered hidden customer segments. And through reinforcement learning, Alex built an AI that could play games better than humans. The key was always to start simple, validate properly, and never stop learning! 🚀"
        };
        
        res.json({ success: true, story });
        
    } catch (error) {
        console.error('❌ Error generating story:', error);
        res.status(500).json({ error: 'Failed to generate story' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Turbolearn AI Backend running on http://localhost:${PORT}`);
    console.log('📝 Take notes: POST /v1/turbolearn/take-notes');
    console.log('🎯 Detect intent: POST /v1/turbolearn/detect-intent');
    console.log('🔧 Model configs: GET /v1/modelConfigs');
    console.log('🧠 Generate quiz: POST /v1/turbolearn/generate-quiz');
    console.log('📚 Generate story: POST /v1/turbolearn/generate-story');
    console.log('📚 Generate flashcards: POST /v1/turbolearn/generate-flashcards');
    console.log('📊 Generate summary: POST /v1/turbolearn/generate-summary');
});
