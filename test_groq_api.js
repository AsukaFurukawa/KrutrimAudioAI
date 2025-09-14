#!/usr/bin/env node

/**
 * Test script to verify Groq API integration
 */

const fetch = require('node-fetch');

async function testGroqAPI() {
    console.log('🧪 Testing Groq API Integration...');
    
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
                        content: 'Generate a short note about machine learning in 2-3 sentences.'
                    }
                ],
                temperature: 0.3,
                max_tokens: 200
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Groq API call successful!');
            console.log('📝 Response:', data.choices?.[0]?.message?.content || 'No content received');
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

async function testBackendAPI() {
    console.log('\n🔌 Testing Backend API...');
    
    try {
        const response = await fetch('http://localhost:8080/v1/turbolearn/take-notes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                files: [{ name: 'test.mp3', url: '/uploads/test.mp3' }],
                prompt: 'Generate notes about artificial intelligence'
            })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend API call successful!');
            console.log('📝 Generated content length:', data.content?.length || 0, 'characters');
            console.log('📊 Content preview:', data.content?.substring(0, 200) + '...');
            return true;
        } else {
            console.log('❌ Backend API call failed:', response.status);
            const errorText = await response.text();
            console.log('Error details:', errorText);
            return false;
        }
    } catch (error) {
        console.log('❌ Error calling Backend API:', error.message);
        console.log('💡 Make sure the backend server is running on port 8080');
        return false;
    }
}

async function main() {
    console.log('🚀 Note-Taking Agent API Test');
    console.log('=' * 40);
    
    // Test Groq API directly
    const groqSuccess = await testGroqAPI();
    
    // Test Backend API (if server is running)
    const backendSuccess = await testBackendAPI();
    
    console.log('\n' + '=' * 40);
    console.log('📊 Test Results:');
    console.log(`Groq API: ${groqSuccess ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Backend API: ${backendSuccess ? '✅ PASS' : '❌ FAIL'}`);
    
    if (groqSuccess) {
        console.log('\n🎉 Groq API is working! The note-taking agent will generate real content.');
    } else {
        console.log('\n⚠️ Groq API is not working. Check your API key and network connection.');
    }
    
    if (backendSuccess) {
        console.log('🎉 Backend API is working! The server is ready to process requests.');
    } else {
        console.log('⚠️ Backend API is not working. Start the server with: node server.js');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testGroqAPI, testBackendAPI };
