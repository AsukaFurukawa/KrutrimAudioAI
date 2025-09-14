#!/usr/bin/env python3

import requests
import json

def test_simple_mermaid():
    print('🧪 Testing Simple Mermaid Generation...')
    
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
                        'content': '''Create a comprehensive note about machine learning with:

1. Title and metadata
2. Structured content with headings
3. A Mermaid flowchart showing the ML workflow
4. A Mermaid mindmap of ML concepts
5. Key takeaways
6. Quiz questions

Use this exact format for Mermaid diagrams:
```mermaid
flowchart TD
  A[Data] --> B[Model]
  B --> C[Prediction]
```

```mermaid
mindmap
  root((ML))
    Supervised
    Unsupervised
    Reinforcement
```'''
                    }
                ],
                'temperature': 0.3,
                'max_tokens': 4000
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
    test_simple_mermaid()
