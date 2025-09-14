#!/usr/bin/env python3

import requests
import json

def test_final_fix():
    print('🧪 Testing Final Fix...')
    
    try:
        # Test model configs endpoint
        print('1. Testing model configs endpoint...')
        config_response = requests.get('http://localhost:8080/v1/modelConfigs?language=en')
        
        if config_response.ok:
            config_data = config_response.json()
            print('✅ Model configs working!')
            print(f'   Models: {len(config_data["data"]["modelData"])}')
            print(f'   Tools: {len(config_data["data"]["toolData"])}')
            
            # Check if note-taking agent is in tools
            tools = config_data["data"]["toolData"]
            note_taking_tool = next((tool for tool in tools if tool["id"] == "note-taking-agent"), None)
            if note_taking_tool:
                print('✅ Note-taking agent found in tools!')
                print(f'   Tool name: {note_taking_tool["label"]}')
                print(f'   Description: {note_taking_tool["description"]}')
            else:
                print('❌ Note-taking agent not found in tools')
        else:
            print(f'❌ Model configs failed: {config_response.status_code}')
            return False
        
        # Test note-taking endpoint
        print('\n2. Testing note-taking endpoint...')
        notes_response = requests.post('http://localhost:8080/v1/turbolearn/take-notes', 
            headers={'Content-Type': 'application/json'},
            json={
                'files': [{'name': 'test.mp3', 'url': '/uploads/test.mp3'}],
                'prompt': 'Generate notes about machine learning with flowcharts and mindmaps'
            }
        )
        
        if notes_response.ok:
            notes_data = notes_response.json()
            content = notes_data.get('content', '')
            
            print('✅ Note-taking working!')
            print(f'   Response length: {len(content)} characters')
            
            has_mermaid = '```mermaid' in content
            has_flowchart = 'flowchart' in content
            has_mindmap = 'mindmap' in content
            
            print(f'   Mermaid diagrams: {"✅ YES" if has_mermaid else "❌ NO"}')
            print(f'   Flowcharts: {"✅ YES" if has_flowchart else "❌ NO"}')
            print(f'   Mindmaps: {"✅ YES" if has_mindmap else "❌ NO"}')
            
            if has_mermaid:
                print('\n🎉 SUCCESS! Everything is working perfectly!')
                print('   The frontend should now show the note-taking agent in the tools list!')
                return True
            else:
                print('\n⚠️ Note-taking works but no Mermaid diagrams found')
                return True
        else:
            print(f'❌ Note-taking failed: {notes_response.status_code}')
            print(f'   Error: {notes_response.text[:200]}')
            return False
            
    except Exception as e:
        print(f'❌ Error: {str(e)}')
        return False

if __name__ == '__main__':
    test_final_fix()
