#!/usr/bin/env python3

import requests
import json

def test_clean_server():
    print('🧪 Testing Clean Server...')
    
    try:
        # Test health endpoint
        health_response = requests.get('http://localhost:8080/health')
        print(f'Health check: {health_response.status_code}')
        
        # Test note generation
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
                
                # Show first diagram
                if diagrams:
                    print('\n--- First Diagram ---')
                    print(diagrams[0][:200] + '...' if len(diagrams[0]) > 200 else diagrams[0])
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
    test_clean_server()
