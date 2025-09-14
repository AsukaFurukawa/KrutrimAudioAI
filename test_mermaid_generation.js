#!/usr/bin/env node

/**
 * Test script to verify Mermaid diagram generation
 */

const fetch = require('node-fetch');

async function testMermaidGeneration() {
    console.log('🧪 Testing Mermaid Diagram Generation...');
    
    try {
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
                        content: `You are a smart note-taking assistant. 
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

Input: Artificial Intelligence is a field of computer science that focuses on creating machines that can perform tasks that typically require human intelligence. It includes machine learning, natural language processing, computer vision, and robotics.

Output: A markdown note that includes all of the above (title, metadata, sections, tables, flowchart, mindmap, takeaways, quiz, flashcards). 
Make it visually appealing, well-organized, and easy to scan.`
                    }
                ],
                temperature: 0.3,
                max_tokens: 8000
            })
        });

        if (response.ok) {
            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || 'No content received';
            
            console.log('✅ Groq API call successful!');
            console.log('📝 Response length:', content.length, 'characters');
            
            // Check for Mermaid diagrams
            const hasFlowchart = content.includes('```mermaid') && content.includes('flowchart');
            const hasMindmap = content.includes('```mermaid') && content.includes('mindmap');
            
            console.log('🔄 Flowchart found:', hasFlowchart ? '✅ YES' : '❌ NO');
            console.log('🧠 Mindmap found:', hasMindmap ? '✅ YES' : '❌ NO');
            
            if (hasFlowchart || hasMindmap) {
                console.log('\n📊 Mermaid diagrams found in response!');
                const mermaidSections = content.match(/```mermaid[\s\S]*?```/g);
                if (mermaidSections) {
                    console.log('Found', mermaidSections.length, 'Mermaid diagram(s):');
                    mermaidSections.forEach((diagram, index) => {
                        console.log(`\n--- Diagram ${index + 1} ---`);
                        console.log(diagram);
                    });
                }
            } else {
                console.log('\n❌ No Mermaid diagrams found in response');
                console.log('📝 First 500 characters of response:');
                console.log(content.substring(0, 500) + '...');
            }
            
            return true;
        } else {
            console.log('❌ Groq API call failed:', response.status);
            const errorText = await response.text();
            console.log('Error details:', errorText);
            return false;
        }
    } catch (error) {
        console.log('❌ Error calling Groq API:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Testing Mermaid Diagram Generation');
    console.log('=' * 50);
    
    const success = await testMermaidGeneration();
    
    console.log('\n' + '=' * 50);
    if (success) {
        console.log('🎉 Test completed successfully!');
    } else {
        console.log('⚠️ Test failed. Check the errors above.');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testMermaidGeneration };
