#!/usr/bin/env python3

import requests
import json
import re

def test_mermaid_final():
    print('🧪 Testing Mermaid Diagrams Final...')
    
    try:
        response = requests.post('http://localhost:8080/v1/turbolearn/take-notes', 
            headers={'Content-Type': 'application/json'},
            json={
                'files': [{'name': 'test.mp3', 'url': '/uploads/test.mp3'}],
                'prompt': 'Generate notes about machine learning with flowcharts and mindmaps'
            }
        )

        if response.ok:
            data = response.json()
            content = data.get('content', '')
            
            print('✅ Note generation working!')
            print('📝 Response length:', len(content))
            
            # Check for Mermaid diagrams
            has_mermaid = '```mermaid' in content
            has_flowchart = 'flowchart' in content
            has_mindmap = 'mindmap' in content
            
            print('🔄 Mermaid blocks:', '✅ YES' if has_mermaid else '❌ NO')
            print('🔄 Flowchart:', '✅ YES' if has_flowchart else '❌ NO')
            print('🧠 Mindmap:', '✅ YES' if has_mindmap else '❌ NO')
            
            if has_mermaid:
                print('\n📊 Mermaid diagrams found!')
                diagrams = re.findall(r'```mermaid[\s\S]*?```', content)
                print(f'Found {len(diagrams)} Mermaid diagram(s)')
                
                for i, diagram in enumerate(diagrams):
                    print(f'\n--- Diagram {i+1} ---')
                    # Extract just the diagram content
                    diagram_content = diagram.replace('```mermaid', '').replace('```', '').strip()
                    print(diagram_content[:300] + '...' if len(diagram_content) > 300 else diagram_content)
            else:
                print('\n❌ No Mermaid diagrams found')
                print('First 500 chars:')
                print(content[:500])
            
            return True
        else:
            print('❌ Server error:', response.status_code)
            return False
            
    except Exception as e:
        print('❌ Error:', str(e))
        return False

if __name__ == '__main__':
    test_mermaid_final()
