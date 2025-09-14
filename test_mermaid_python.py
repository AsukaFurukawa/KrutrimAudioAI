#!/usr/bin/env python3

"""
Test script to verify Mermaid diagram generation
"""

import requests
import json
import re

def test_mermaid_generation():
    print('🧪 Testing Mermaid Diagram Generation...')
    
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
                        'content': '''You are a smart note-taking assistant. 
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
     ```mermaid
     flowchart TD
       A[Start] --> B{Decision}
       B -->|Yes| C[Do Action]
       B -->|No| D[Stop]
     ```

5. 🧠 Mindmap
   - Summarize the high-level structure or relationships as a Mermaid mindmap.
   - Example:
     ```mermaid
     mindmap
       root((Main Idea))
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
Make it visually appealing, well-organized, and easy to scan.'''
                    }
                ],
                'temperature': 0.3,
                'max_tokens': 8000
            }
        )

        if response.ok:
            data = response.json()
            content = data['choices'][0]['message']['content']
            
            print('✅ Groq API call successful!')
            print('📝 Response length:', len(content), 'characters')
            
            # Check for Mermaid diagrams
            has_flowchart = '```mermaid' in content and 'flowchart' in content
            has_mindmap = '```mermaid' in content and 'mindmap' in content
            
            print('🔄 Flowchart found:', '✅ YES' if has_flowchart else '❌ NO')
            print('🧠 Mindmap found:', '✅ YES' if has_mindmap else '❌ NO')
            
            if has_flowchart or has_mindmap:
                print('\n📊 Mermaid diagrams found in response!')
                mermaid_sections = re.findall(r'```mermaid[\s\S]*?```', content)
                if mermaid_sections:
                    print('Found', len(mermaid_sections), 'Mermaid diagram(s):')
                    for i, diagram in enumerate(mermaid_sections):
                        print(f'\n--- Diagram {i + 1} ---')
                        print(diagram)
            else:
                print('\n❌ No Mermaid diagrams found in response')
                print('📝 First 500 characters of response:')
                print(content[:500] + '...')
            
            return True
        else:
            print('❌ Groq API call failed:', response.status_code)
            print('Error details:', response.text)
            return False
            
    except Exception as error:
        print('❌ Error calling Groq API:', str(error))
        return False

def main():
    print('🚀 Testing Mermaid Diagram Generation')
    print('=' * 50)
    
    success = test_mermaid_generation()
    
    print('\n' + '=' * 50)
    if success:
        print('🎉 Test completed successfully!')
    else:
        print('⚠️ Test failed. Check the errors above.')

if __name__ == '__main__':
    main()
