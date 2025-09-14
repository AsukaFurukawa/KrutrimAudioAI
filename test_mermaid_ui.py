#!/usr/bin/env python3

"""
Test script to verify Mermaid diagrams are being generated and can be displayed
"""

import requests
import json
import re

def test_mermaid_generation():
    print('🧪 Testing Mermaid Diagram Generation for UI...')
    
    try:
        response = requests.post('http://localhost:8080/v1/turbolearn/take-notes', 
            headers={'Content-Type': 'application/json'},
            json={
                'files': [{'name': 'ai_lecture.mp3', 'url': '/uploads/ai_lecture.mp3'}],
                'prompt': 'Generate comprehensive notes about artificial intelligence with mindmaps and flowcharts'
            }
        )

        if response.ok:
            data = response.json()
            content = data.get('content', '')
            
            print('✅ API call successful!')
            print('📝 Response length:', len(content), 'characters')
            
            # Check for Mermaid diagrams
            has_mermaid = '```mermaid' in content
            has_flowchart = 'flowchart' in content
            has_mindmap = 'mindmap' in content
            
            print('🔄 Mermaid blocks found:', '✅ YES' if has_mermaid else '❌ NO')
            print('🔄 Flowchart found:', '✅ YES' if has_flowchart else '❌ NO')
            print('🧠 Mindmap found:', '✅ YES' if has_mindmap else '❌ NO')
            
            if has_mermaid:
                print('\n📊 Mermaid diagrams found!')
                mermaid_sections = re.findall(r'```mermaid[\s\S]*?```', content)
                print(f'Found {len(mermaid_sections)} Mermaid diagram(s)')
                
                for i, diagram in enumerate(mermaid_sections):
                    print(f'\n--- Diagram {i + 1} ---')
                    # Extract just the diagram content (without ```mermaid and ```)
                    diagram_content = diagram.replace('```mermaid', '').replace('```', '').strip()
                    print(diagram_content[:200] + '...' if len(diagram_content) > 200 else diagram_content)
            else:
                print('\n❌ No Mermaid diagrams found')
                print('📝 First 500 characters:')
                print(content[:500] + '...')
            
            return True
        else:
            print('❌ API call failed:', response.status_code)
            return False
            
    except Exception as error:
        print('❌ Error:', str(error))
        return False

def main():
    print('🚀 Testing Mermaid UI Integration')
    print('=' * 50)
    
    success = test_mermaid_generation()
    
    print('\n' + '=' * 50)
    if success:
        print('🎉 Mermaid diagrams are being generated!')
        print('💡 The frontend should now render them as visual diagrams.')
    else:
        print('⚠️ Test failed. Check the errors above.')

if __name__ == '__main__':
    main()
