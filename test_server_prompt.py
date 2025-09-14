#!/usr/bin/env python3

import requests
import json

def test_server_prompt():
    print('🧪 Testing Server Prompt Directly...')
    
    # This is the exact prompt from the server
    notePrompt = """You are a smart note-taking assistant. 
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
     ```mermaid
     flowchart TD
       A[Start] --> B{Decision}
       B -->|Yes| C[Do Action]
       B -->|No| D[Stop]
     ```

5. 🧠 Mindmap
   - ALWAYS generate a Mermaid mindmap to show the high-level structure and relationships.
   - Use this exact format:
     ```mermaid
     mindmap
       root((Main Topic))
         Subtopic A
           Detail 1
           Detail 2
         Subtopic B
           Detail 3
     ```

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
Make it visually appealing, well-organized, and easy to scan."""

    try:
        response = requests.post('https://api.groq.com/openai/v1/chat/completions', 
            headers={
                'Content-Type': 'application/json',
                'Authorization': 'Bearer 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'
            },
            json={
                'model': 'groq/compound',
                'messages': [
                    {
                        'role': 'user',
                        'content': notePrompt
                    }
                ],
                'temperature': 0.3,
                'max_tokens': 8000
            }
        )

        if response.ok:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            print('✅ API call successful!')
            print('📝 Response length:', len(content))
            
            has_mermaid = '```mermaid' in content
            has_flowchart = 'flowchart' in content
            has_mindmap = 'mindmap' in content
            
            print('🔄 Mermaid blocks:', '✅ YES' if has_mermaid else '❌ NO')
            print('🔄 Flowchart:', '✅ YES' if has_flowchart else '❌ NO')
            print('🧠 Mindmap:', '✅ YES' if has_mindmap else '❌ NO')
            
            if has_mermaid:
                print('\n📊 Mermaid diagrams found!')
                import re
                diagrams = re.findall(r'```mermaid[\s\S]*?```', content)
                for i, diagram in enumerate(diagrams):
                    print(f'\n--- Diagram {i+1} ---')
                    print(diagram)
            else:
                print('\n❌ No Mermaid diagrams found')
                print('First 1000 chars:')
                print(content[:1000])
            
            return True
        else:
            print('❌ API failed:', response.status_code)
            return False
            
    except Exception as e:
        print('❌ Error:', str(e))
        return False

if __name__ == '__main__':
    test_server_prompt()
