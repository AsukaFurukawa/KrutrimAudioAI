// Test script for Gladia integration
const axios = require('axios');

const BACKEND_URL = 'http://localhost:8080';
const TEST_YOUTUBE_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // Rick Roll for testing

async function testGladiaIntegration() {
    console.log('🧪 Testing Gladia YouTube Transcription Integration');
    console.log('=' .repeat(60));
    
    try {
        // Test 1: Check if server is running
        console.log('1️⃣ Testing server health...');
        const healthResponse = await axios.get(`${BACKEND_URL}/health`);
        console.log('✅ Server is running:', healthResponse.data);
        
        // Test 2: Check supported languages
        console.log('\n2️⃣ Testing supported languages...');
        const languagesResponse = await axios.get(`${BACKEND_URL}/v1/turbolearn/transcribe/languages`);
        console.log('✅ Supported languages:', languagesResponse.data.languages.length, 'languages');
        
        // Test 3: Check supported models
        console.log('\n3️⃣ Testing supported models...');
        const modelsResponse = await axios.get(`${BACKEND_URL}/v1/turbolearn/transcribe/models`);
        console.log('✅ Supported models:', modelsResponse.data.models.length, 'models');
        
        // Test 4: Test YouTube transcription (this will use fallback if no Gladia API key)
        console.log('\n4️⃣ Testing YouTube transcription...');
        console.log('📺 Test URL:', TEST_YOUTUBE_URL);
        
        const transcriptionResponse = await axios.post(`${BACKEND_URL}/v1/turbolearn/transcribe-youtube`, {
            url: TEST_YOUTUBE_URL,
            language: 'auto',
            model: 'large-v2',
            diarization: false
        });
        
        if (transcriptionResponse.data.success) {
            console.log('✅ YouTube transcription successful!');
            console.log('📊 Transcript length:', transcriptionResponse.data.transcript?.length || 0, 'characters');
            console.log('🤖 Transcription service:', transcriptionResponse.data.metadata?.transcriptionService || 'unknown');
            console.log('📝 Transcript preview:', transcriptionResponse.data.transcript?.substring(0, 200) + '...');
        } else {
            console.log('❌ YouTube transcription failed:', transcriptionResponse.data.error);
        }
        
        // Test 5: Test note generation from transcript
        console.log('\n5️⃣ Testing note generation from transcript...');
        if (transcriptionResponse.data.success && transcriptionResponse.data.transcript) {
            const notesResponse = await axios.post(`${BACKEND_URL}/v1/turbolearn/take-notes`, {
                content: transcriptionResponse.data.transcript,
                prompt: 'Generate comprehensive notes from this YouTube video transcript'
            });
            
            if (notesResponse.data.success) {
                console.log('✅ Note generation successful!');
                console.log('📊 Notes length:', notesResponse.data.notes?.length || 0, 'characters');
                console.log('📝 Notes preview:', notesResponse.data.notes?.substring(0, 300) + '...');
            } else {
                console.log('❌ Note generation failed:', notesResponse.data.error);
            }
        }
        
        console.log('\n🎉 Integration test completed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📊 Response status:', error.response.status);
            console.error('📝 Response data:', error.response.data);
        }
    }
}

// Run the test
testGladiaIntegration();
