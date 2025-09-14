#!/usr/bin/env node

/**
 * MCP Server for Note-Taking Agent with Mindmaps and Flowcharts
 * This is a proper MCP server implementation following the MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import mermaid from 'mermaid';

class NoteTakingMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'note-taking-agent',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
    
    // Initialize Mermaid
    mermaid.initialize({ startOnLoad: false });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generate_notes',
            description: 'Generate comprehensive notes with mindmaps and flowcharts from audio, video, or text content',
            inputSchema: {
              type: 'object',
              properties: {
                content: {
                  type: 'string',
                  description: 'The content to generate notes from'
                },
                contentType: {
                  type: 'string',
                  enum: ['audio', 'video', 'text', 'youtube'],
                  description: 'Type of content being processed'
                },
                prompt: {
                  type: 'string',
                  description: 'Custom prompt for note generation'
                },
                includeDiagrams: {
                  type: 'boolean',
                  description: 'Include Mermaid diagrams (mindmaps and flowcharts)',
                  default: true
                }
              },
              required: ['content', 'contentType']
            }
          },
          {
            name: 'generate_mindmap',
            description: 'Generate a Mermaid mindmap from notes content',
            inputSchema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  description: 'The notes content to create mindmap from'
                },
                focus: {
                  type: 'string',
                  description: 'Specific focus area for the mindmap'
                }
              },
              required: ['notes']
            }
          },
          {
            name: 'generate_flowchart',
            description: 'Generate a Mermaid flowchart from notes content',
            inputSchema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  description: 'The notes content to create flowchart from'
                },
                processType: {
                  type: 'string',
                  enum: ['decision', 'sequence', 'workflow', 'algorithm'],
                  description: 'Type of process to diagram'
                }
              },
              required: ['notes']
            }
          },
          {
            name: 'generate_quiz',
            description: 'Generate a quiz from notes content',
            inputSchema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  description: 'The notes content to generate quiz from'
                },
                questionCount: {
                  type: 'number',
                  description: 'Number of questions to generate (default: 5)'
                }
              },
              required: ['notes']
            }
          },
          {
            name: 'generate_flashcards',
            description: 'Generate flashcards from notes content',
            inputSchema: {
              type: 'object',
              properties: {
                notes: {
                  type: 'string',
                  description: 'The notes content to generate flashcards from'
                },
                cardCount: {
                  type: 'number',
                  description: 'Number of flashcards to generate (default: 8)'
                }
              },
              required: ['notes']
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generate_notes':
            return await this.generateNotes(args);
          case 'generate_mindmap':
            return await this.generateMindmap(args);
          case 'generate_flowchart':
            return await this.generateFlowchart(args);
          case 'generate_quiz':
            return await this.generateQuiz(args);
          case 'generate_flashcards':
            return await this.generateFlashcards(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`
            }
          ],
          isError: true
        };
      }
    });
  }

  async generateNotes(args) {
    const { content, contentType, prompt, includeDiagrams = true } = args;
    
    const enhancedPrompt = `You are a smart note-taking assistant. 
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

4. 🔄 Flowchart
   - If a process or sequence exists, generate a Mermaid flowchart in markdown.
   - Example:
     \`\`\`mermaid
     flowchart TD
       A[Start] --> B{Decision}
       B -->|Yes| C[Do Action]
       B -->|No| D[Stop]
     \`\`\`

5. 🧠 Mindmap
   - Summarize the high-level structure or relationships as a Mermaid mindmap.
   - Example:
     \`\`\`mermaid
     mindmap
       root((Main Idea))
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

Input: ${content}

Output: A markdown note that includes all of the above (title, metadata, sections, tables, flowchart, mindmap, takeaways, quiz, flashcards). 
Make it visually appealing, well-organized, and easy to scan.`;
    
    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'user',
            content: enhancedPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const notes = data.choices?.[0]?.message?.content || 'No content generated';

    return {
      content: [
        {
          type: 'text',
          text: notes
        }
      ]
    };
  }

  async generateMindmap(args) {
    const { notes, focus } = args;
    
    const prompt = `Create a Mermaid mindmap from these notes. Focus on ${focus || 'the main concepts and their relationships'}.

Notes: ${notes}

Generate a Mermaid mindmap that shows the hierarchical structure and relationships between concepts. Use this format:

\`\`\`mermaid
mindmap
  root((Main Topic))
    Branch 1
      Sub-branch 1.1
      Sub-branch 1.2
    Branch 2
      Sub-branch 2.1
      Sub-branch 2.2
\`\`\``;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const mindmap = data.choices?.[0]?.message?.content || 'No mindmap generated';

    return {
      content: [
        {
          type: 'text',
          text: mindmap
        }
      ]
    };
  }

  async generateFlowchart(args) {
    const { notes, processType = 'sequence' } = args;
    
    const prompt = `Create a Mermaid flowchart from these notes. Focus on ${processType} processes.

Notes: ${notes}

Generate a Mermaid flowchart that shows the process flow. Use this format:

\`\`\`mermaid
flowchart TD
  A[Start] --> B{Decision}
  B -->|Yes| C[Action 1]
  B -->|No| D[Action 2]
  C --> E[End]
  D --> E
\`\`\``;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const flowchart = data.choices?.[0]?.message?.content || 'No flowchart generated';

    return {
      content: [
        {
          type: 'text',
          text: flowchart
        }
      ]
    };
  }

  async generateQuiz(args) {
    const { notes, questionCount = 5 } = args;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'user',
            content: `Generate ${questionCount} quiz questions from these notes:

${notes}

Format as JSON with questions, options, correct answers, and explanations.`
          }
        ],
        temperature: 0.3,
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const quiz = data.choices?.[0]?.message?.content || 'No quiz generated';

    return {
      content: [
        {
          type: 'text',
          text: quiz
        }
      ]
    };
  }

  async generateFlashcards(args) {
    const { notes, cardCount = 8 } = args;
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        model: 'groq/compound',
        messages: [
          {
            role: 'user',
            content: `Generate ${cardCount} flashcards from these notes:

${notes}

Format as JSON with front and back for each card.`
          }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    const flashcards = data.choices?.[0]?.message?.content || 'No flashcards generated';

    return {
      content: [
        {
          type: 'text',
          text: flashcards
        }
      ]
    };
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Note-taking MCP server with mindmaps and flowcharts running on stdio');
  }
}

// Start the server
const server = new NoteTakingMCPServer();
server.run().catch(console.error);