#!/usr/bin/env node

/**
 * Note-Taking Agent Evaluation Test Script
 * 
 * This script tests the note-taking agent with the evaluation dataset
 * to ensure all features work correctly and generate quality outputs.
 */

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuration
const CONFIG = {
  backendUrl: 'http://localhost:8080',
  frontendUrl: 'http://localhost:3000',
  testTimeout: 30000, // 30 seconds per test
  maxRetries: 3
};

// Load evaluation dataset
const evaluationDataset = JSON.parse(fs.readFileSync('./evaluation_dataset.json', 'utf8'));

class NoteTakingAgentTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }

  async runAllTests() {
    console.log('🚀 Starting Note-Taking Agent Evaluation Tests');
    console.log(`📊 Dataset: ${evaluationDataset.total_samples} samples across ${Object.keys(evaluationDataset.categories).length} categories`);
    console.log('=' * 60);

    // Test 1: Backend Health Check
    await this.testBackendHealth();

    // Test 2: Basic Note Generation
    await this.testBasicNoteGeneration();

    // Test 3: Study Material Generation
    await this.testStudyMaterialGeneration();

    // Test 4: YouTube Processing
    await this.testYouTubeProcessing();

    // Test 5: File Upload Processing
    await this.testFileUploadProcessing();

    // Test 6: Error Handling
    await this.testErrorHandling();

    // Test 7: Performance Testing
    await this.testPerformance();

    // Generate Report
    this.generateReport();
  }

  async testBackendHealth() {
    console.log('\n🔍 Testing Backend Health...');
    
    try {
      const response = await fetch(`${CONFIG.backendUrl}/actuator/health`);
      const data = await response.json();
      
      if (data.status === 'UP') {
        console.log('✅ Backend is healthy');
        this.results.push({ test: 'backend_health', status: 'PASS', message: 'Backend is running' });
      } else {
        throw new Error('Backend status is not UP');
      }
    } catch (error) {
      console.log('❌ Backend health check failed:', error.message);
      this.results.push({ test: 'backend_health', status: 'FAIL', message: error.message });
    }
  }

  async testBasicNoteGeneration() {
    console.log('\n📝 Testing Basic Note Generation...');
    
    const testCases = [
      {
        name: 'Machine Learning Lecture',
        prompt: 'Generate notes about machine learning fundamentals including supervised and unsupervised learning',
        expectedTopics: ['machine learning', 'supervised learning', 'unsupervised learning']
      },
      {
        name: 'Climate Change Discussion',
        prompt: 'Create notes about climate change, renewable energy, and environmental policies',
        expectedTopics: ['climate change', 'renewable energy', 'environmental policy']
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${CONFIG.backendUrl}/v1/turbolearn/take-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: [],
            prompt: testCase.prompt
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content || data.notes || '';
          
          // Check if expected topics are covered
          const topicsFound = testCase.expectedTopics.filter(topic => 
            content.toLowerCase().includes(topic.toLowerCase())
          );

          if (topicsFound.length >= testCase.expectedTopics.length * 0.8) {
            console.log(`✅ ${testCase.name}: Generated comprehensive notes`);
            this.results.push({ 
              test: `note_generation_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
              status: 'PASS', 
              message: `Generated notes covering ${topicsFound.length}/${testCase.expectedTopics.length} expected topics` 
            });
          } else {
            console.log(`⚠️ ${testCase.name}: Notes missing some expected topics`);
            this.results.push({ 
              test: `note_generation_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
              status: 'PARTIAL', 
              message: `Only covered ${topicsFound.length}/${testCase.expectedTopics.length} expected topics` 
            });
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ${error.message}`);
        this.results.push({ 
          test: `note_generation_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
          status: 'FAIL', 
          message: error.message 
        });
      }
    }
  }

  async testStudyMaterialGeneration() {
    console.log('\n🧠 Testing Study Material Generation...');
    
    const studyMaterials = ['quiz', 'flashcards', 'summary', 'action-items', 'key-points'];
    const testNotes = 'Machine learning is a subset of artificial intelligence that enables computers to learn from data without being explicitly programmed. It includes supervised learning, unsupervised learning, and reinforcement learning.';

    for (const material of studyMaterials) {
      try {
        const response = await fetch(`${CONFIG.backendUrl}/v1/turbolearn/generate-${material}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: testNotes })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data[material] || data.content || '';
          
          if (content && content.length > 50) {
            console.log(`✅ ${material}: Generated successfully`);
            this.results.push({ 
              test: `study_material_${material}`, 
              status: 'PASS', 
              message: `Generated ${material} with ${content.length} characters` 
            });
          } else {
            console.log(`⚠️ ${material}: Generated but content seems too short`);
            this.results.push({ 
              test: `study_material_${material}`, 
              status: 'PARTIAL', 
              message: `Generated ${material} but content is shorter than expected` 
            });
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        console.log(`❌ ${material}: ${error.message}`);
        this.results.push({ 
          test: `study_material_${material}`, 
          status: 'FAIL', 
          message: error.message 
        });
      }
    }
  }

  async testYouTubeProcessing() {
    console.log('\n📺 Testing YouTube Processing...');
    
    const testCases = [
      {
        name: 'Educational Video',
        youtubeUrl: 'https://www.youtube.com/watch?v=kBdfcR-8hEY', // Khan Academy video
        expectedTopics: ['education', 'learning', 'knowledge']
      }
    ];

    for (const testCase of testCases) {
      try {
        const response = await fetch(`${CONFIG.backendUrl}/v1/turbolearn/youtube-notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtubeUrl: testCase.youtubeUrl,
            videoId: 'kBdfcR-8hEY',
            prompt: 'Generate comprehensive notes from this educational video'
          })
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.content || data.notes || '';
          
          if (content && content.length > 100) {
            console.log(`✅ ${testCase.name}: YouTube processing successful`);
            this.results.push({ 
              test: `youtube_processing_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
              status: 'PASS', 
              message: `Processed YouTube video and generated ${content.length} characters of notes` 
            });
          } else {
            console.log(`⚠️ ${testCase.name}: YouTube processing completed but content seems insufficient`);
            this.results.push({ 
              test: `youtube_processing_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
              status: 'PARTIAL', 
              message: `Processed YouTube video but generated only ${content.length} characters` 
            });
          }
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ${error.message}`);
        this.results.push({ 
          test: `youtube_processing_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
          status: 'FAIL', 
          message: error.message 
        });
      }
    }
  }

  async testFileUploadProcessing() {
    console.log('\n📁 Testing File Upload Processing...');
    
    // This would test actual file uploads in a real scenario
    // For now, we'll test the endpoint structure
    try {
      const response = await fetch(`${CONFIG.backendUrl}/v1/turbolearn/take-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: [{ name: 'test_audio.mp3', url: '/uploads/test_audio.mp3' }],
          prompt: 'Generate notes from this audio file'
        })
      });

      if (response.ok) {
        console.log('✅ File upload processing endpoint is working');
        this.results.push({ 
          test: 'file_upload_processing', 
          status: 'PASS', 
          message: 'File upload processing endpoint is functional' 
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }
    } catch (error) {
      console.log(`❌ File upload processing: ${error.message}`);
      this.results.push({ 
        test: 'file_upload_processing', 
        status: 'FAIL', 
        message: error.message 
      });
    }
  }

  async testErrorHandling() {
    console.log('\n⚠️ Testing Error Handling...');
    
    const errorTestCases = [
      {
        name: 'Invalid YouTube URL',
        endpoint: '/v1/turbolearn/youtube-notes',
        body: { youtubeUrl: 'invalid-url', videoId: 'invalid' },
        expectedStatus: 400
      },
      {
        name: 'Missing Notes for Study Material',
        endpoint: '/v1/turbolearn/generate-quiz',
        body: {},
        expectedStatus: 400
      },
      {
        name: 'Empty File Upload',
        endpoint: '/v1/turbolearn/take-notes',
        body: { files: [], prompt: '' },
        expectedStatus: 400
      }
    ];

    for (const testCase of errorTestCases) {
      try {
        const response = await fetch(`${CONFIG.backendUrl}${testCase.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCase.body)
        });

        if (response.status === testCase.expectedStatus) {
          console.log(`✅ ${testCase.name}: Error handled correctly`);
          this.results.push({ 
            test: `error_handling_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
            status: 'PASS', 
            message: `Correctly returned ${response.status} status` 
          });
        } else {
          console.log(`⚠️ ${testCase.name}: Expected ${testCase.expectedStatus}, got ${response.status}`);
          this.results.push({ 
            test: `error_handling_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
            status: 'PARTIAL', 
            message: `Expected ${testCase.expectedStatus}, got ${response.status}` 
          });
        }
      } catch (error) {
        console.log(`❌ ${testCase.name}: ${error.message}`);
        this.results.push({ 
          test: `error_handling_${testCase.name.toLowerCase().replace(/\s+/g, '_')}`, 
          status: 'FAIL', 
          message: error.message 
        });
      }
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance...');
    
    const performanceTests = [
      {
        name: 'Note Generation Speed',
        endpoint: '/v1/turbolearn/take-notes',
        body: { files: [], prompt: 'Generate notes about artificial intelligence' },
        maxTime: 10000 // 10 seconds
      },
      {
        name: 'Quiz Generation Speed',
        endpoint: '/v1/turbolearn/generate-quiz',
        body: { notes: 'Machine learning is a subset of AI that enables computers to learn from data.' },
        maxTime: 5000 // 5 seconds
      }
    ];

    for (const test of performanceTests) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${CONFIG.backendUrl}${test.endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(test.body)
        });
        const endTime = Date.now();
        const duration = endTime - startTime;

        if (response.ok && duration <= test.maxTime) {
          console.log(`✅ ${test.name}: Completed in ${duration}ms`);
          this.results.push({ 
            test: `performance_${test.name.toLowerCase().replace(/\s+/g, '_')}`, 
            status: 'PASS', 
            message: `Completed in ${duration}ms (max: ${test.maxTime}ms)` 
          });
        } else if (response.ok) {
          console.log(`⚠️ ${test.name}: Completed in ${duration}ms (exceeded ${test.maxTime}ms)`);
          this.results.push({ 
            test: `performance_${test.name.toLowerCase().replace(/\s+/g, '_')}`, 
            status: 'PARTIAL', 
            message: `Completed in ${duration}ms (exceeded ${test.maxTime}ms)` 
          });
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (error) {
        console.log(`❌ ${test.name}: ${error.message}`);
        this.results.push({ 
          test: `performance_${test.name.toLowerCase().replace(/\s+/g, '_')}`, 
          status: 'FAIL', 
          message: error.message 
        });
      }
    }
  }

  generateReport() {
    const endTime = Date.now();
    const totalTime = (endTime - this.startTime) / 1000;
    
    const passed = this.results.filter(r => r.status === 'PASS').length;
    const partial = this.results.filter(r => r.status === 'PARTIAL').length;
    const failed = this.results.filter(r => r.status === 'FAIL').length;
    const total = this.results.length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 EVALUATION REPORT');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Test Time: ${totalTime.toFixed(2)} seconds`);
    console.log(`✅ Passed: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    console.log(`⚠️  Partial: ${partial}/${total} (${((partial/total)*100).toFixed(1)}%)`);
    console.log(`❌ Failed: ${failed}/${total} (${((failed/total)*100).toFixed(1)}%)`);
    console.log('='.repeat(60));

    // Detailed results
    console.log('\n📋 DETAILED RESULTS:');
    this.results.forEach(result => {
      const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'PARTIAL' ? '⚠️' : '❌';
      console.log(`${statusIcon} ${result.test}: ${result.message}`);
    });

    // Save results to file
    const reportData = {
      timestamp: new Date().toISOString(),
      totalTime: totalTime,
      summary: {
        passed,
        partial,
        failed,
        total
      },
      results: this.results
    };

    fs.writeFileSync('evaluation_report.json', JSON.stringify(reportData, null, 2));
    console.log('\n💾 Detailed report saved to evaluation_report.json');

    // Overall assessment
    if (passed >= total * 0.8) {
      console.log('\n🎉 OVERALL ASSESSMENT: EXCELLENT - Ready for production!');
    } else if (passed >= total * 0.6) {
      console.log('\n👍 OVERALL ASSESSMENT: GOOD - Minor improvements needed');
    } else {
      console.log('\n🔧 OVERALL ASSESSMENT: NEEDS WORK - Significant improvements required');
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new NoteTakingAgentTester();
  tester.runAllTests().catch(console.error);
}

module.exports = NoteTakingAgentTester;
