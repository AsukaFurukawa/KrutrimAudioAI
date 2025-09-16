const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const https = require('https');

// Create axios instance with SSL configuration
const axiosInstance = axios.create({
    httpsAgent: new https.Agent({
        rejectUnauthorized: false // Allow self-signed certificates in development
    }),
    timeout: 300000 // 5 minutes timeout
});

class GladiaService {
    constructor() {
        this.apiKey = process.env.GLADIA_API_KEY;
        
        if (!this.apiKey) {
            console.warn('⚠️  GLADIA_API_KEY not found - using fallback transcription');
        }
        
        this.baseUrl = 'https://api.gladia.io/v2';
    }

    /**
     * Transcribe YouTube video using Gladia API with direct URL
     * @param {string} youtubeUrl - YouTube video URL
     * @param {Object} options - Transcription options
     * @returns {Promise<Object>} Transcription result
     */
    async transcribeYouTubeVideo(youtubeUrl, options = {}) {
        try {
            console.log('🎤 Starting Gladia YouTube transcription:', youtubeUrl);
            
            // Set default options
            const transcriptionOptions = {
                language: options.language || 'auto',
                model: options.model || 'large-v2',
                task: options.task || 'transcribe',
                diarization: options.diarization || false,
                speaker_detection: options.speaker_detection || false,
                ...options
            };

            console.log('⚙️  Transcription options:', transcriptionOptions);

            // Use Gladia REST API for YouTube URL transcription
            const requestBody = {
                audio_url: youtubeUrl,
                language_config: {
                    languages: transcriptionOptions.language === 'auto' ? [] : [transcriptionOptions.language]
                },
                diarization: transcriptionOptions.diarization
            };

            console.log('📤 Sending request to Gladia API:', JSON.stringify(requestBody, null, 2));

            const response = await axiosInstance.post(`${this.baseUrl}/pre-recorded`, requestBody, {
                headers: {
                    'x-gladia-key': this.apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Gladia API response received');
            console.log('📊 Response status:', response.status);
            console.log('📝 Response data:', response.data);

            // Check if we got a transcription ID (async processing)
            if (response.data && response.data.id && response.data.result_url) {
                console.log('🔄 Transcription submitted, polling for results...');
                return await this.pollTranscriptionResult(response.data.id);
            }

            return {
                success: true,
                data: response.data,
                status: response.status
            };

        } catch (error) {
            console.error('❌ Gladia API error:', error.message);
            
            if (error.response) {
                console.error('📊 Error response status:', error.response.status);
                console.error('📝 Error response data:', error.response.data);
                
                return {
                    success: false,
                    error: `Gladia API error: ${error.response.status} - ${error.response.data?.message || error.message}`,
                    status: error.response.status,
                    details: error.response.data
                };
            } else {
                return {
                    success: false,
                    error: `Network error: ${error.message}`,
                    details: error.message
                };
            }
        }
    }

    /**
     * Poll for transcription result
     * @param {string} transcriptionId - Transcription ID to poll
     * @returns {Promise<Object>} Transcription result
     */
    async pollTranscriptionResult(transcriptionId) {
        const maxAttempts = 30; // 5 minutes max (10 seconds * 30)
        const pollInterval = 10000; // 10 seconds
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} for transcription: ${transcriptionId}`);
                
                const response = await axiosInstance.get(`${this.baseUrl}/pre-recorded/${transcriptionId}`, {
                    headers: {
                        'x-gladia-key': this.apiKey
                    }
                });

                console.log('📊 Polling response status:', response.data.status);

                if (response.data.status === 'done') {
                    console.log('✅ Transcription completed!');
                    return {
                        success: true,
                        data: response.data,
                        status: 'completed'
                    };
                } else if (response.data.status === 'error') {
                    console.error('❌ Transcription failed:', response.data.error_code);
                    return {
                        success: false,
                        error: `Transcription failed: ${response.data.error_code}`,
                        details: response.data
                    };
                } else if (response.data.status === 'processing') {
                    console.log('⏳ Still processing... waiting 10 seconds');
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                } else {
                    console.log('⏳ Status:', response.data.status, '... waiting 10 seconds');
                    await new Promise(resolve => setTimeout(resolve, pollInterval));
                }

            } catch (error) {
                console.error(`❌ Polling error (attempt ${attempt}):`, error.message);
                if (attempt === maxAttempts) {
                    return {
                        success: false,
                        error: `Polling failed after ${maxAttempts} attempts: ${error.message}`,
                        details: error.message
                    };
                }
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }

        return {
            success: false,
            error: `Transcription timeout after ${maxAttempts} attempts`,
            details: 'Transcription took too long to complete'
        };
    }

    /**
     * Format transcription result for our application
     * @param {Object} gladiaResult - Raw result from Gladia API
     * @returns {Object} Formatted transcription result
     */
    formatTranscriptionResult(gladiaResult) {
        console.log('🔍 Formatting result:', JSON.stringify(gladiaResult, null, 2));
        
        if (!gladiaResult.success || !gladiaResult.data) {
            return {
                success: false,
                error: gladiaResult.error || 'Transcription failed',
                details: gladiaResult.details
            };
        }

        const { data } = gladiaResult;
        
        // Extract transcript text from Gladia API response
        let transcriptText = '';
        console.log('🔍 Raw Gladia response:', JSON.stringify(data, null, 2));
        
        // Check for full_transcript in the result.transcription object
        if (data.result && data.result.transcription && data.result.transcription.full_transcript) {
            transcriptText = data.result.transcription.full_transcript;
            console.log('✅ Found full_transcript:', transcriptText.substring(0, 100) + '...');
        } else if (data.result && data.result.transcription && data.result.transcription.utterances) {
            // Fallback: combine utterances if full_transcript not available
            transcriptText = data.result.transcription.utterances
                .map(utterance => utterance.text || '')
                .join(' ')
                .trim();
            console.log('✅ Combined utterances:', transcriptText.substring(0, 100) + '...');
        } else if (data.transcript) {
            transcriptText = data.transcript;
        } else if (data.text) {
            transcriptText = data.text;
        } else if (data.transcription) {
            transcriptText = data.transcription;
        } else if (data.segments && Array.isArray(data.segments)) {
            // Combine segments if available
            transcriptText = data.segments
                .map(segment => segment.text || segment.transcript || '')
                .join(' ')
                .trim();
        } else if (data.result && data.result.transcript) {
            transcriptText = data.result.transcript;
        } else if (data.result && data.result.text) {
            transcriptText = data.result.text;
        } else {
            // Fallback: try to extract any text content
            transcriptText = JSON.stringify(data).substring(0, 500) + '...';
        }

        // Extract metadata from Gladia response
        const metadata = {
            language: data.result?.transcription?.languages?.[0] || data.language || 'unknown',
            duration: data.file?.audio_duration || data.duration || 0,
            model: 'gladia-api',
            confidence: data.result?.transcription?.utterances?.[0]?.confidence || data.confidence || 0,
            segments: data.result?.transcription?.utterances || data.segments || [],
            words: data.result?.transcription?.utterances?.flatMap(u => u.words || []) || data.words || [],
            status: data.status || 'completed',
            videoTitle: data.file?.filename || 'Unknown',
            audioDuration: data.file?.audio_duration || 0
        };

        return {
            success: true,
            transcript: transcriptText,
            metadata: metadata,
            raw: data // Include raw data for debugging
        };
    }
}

module.exports = GladiaService;
