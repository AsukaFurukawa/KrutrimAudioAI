#!/usr/bin/env python3

import requests
import json

def test_server():
    print('🧪 Testing Server with Mermaid Support...')
    
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
            
            print('✅ Server is working!')
            print('📝 Response length:', len(content))
            
            has_mermaid = '```mermaid' in content
            has_flowchart = 'flowchart' in content
            has_mindmap = 'mindmap' in content
            
            print('🔄 Mermaid blocks:', '✅ YES' if has_mermaid else '❌ NO')
            print('🔄 Flowchart:', '✅ YES' if has_flowchart else '❌ NO')
            print('🧠 Mindmap:', '✅ YES' if has_mindmap else '❌ NO')
            
            if has_mermaid:
                print('\n🎉 SUCCESS! Mermaid diagrams are being generated!')
                import re
                diagrams = re.findall(r'```mermaid[\s\S]*?```', content)
                print(f'Found {len(diagrams)} Mermaid diagram(s)')
            else:
                print('\n❌ No Mermaid diagrams found')
                print('First 500 chars:')
                print(content[:500])
            
            return True
        else:
            print('❌ Server error:', response.status_code)
            print('Response:', response.text[:200])
            return False
            
    except Exception as e:
        print('❌ Connection error:', str(e))
        return False

if __name__ == '__main__':
    test_server()
