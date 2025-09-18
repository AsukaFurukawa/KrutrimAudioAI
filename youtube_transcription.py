#!/usr/bin/env python3
"""
YouTube Transcription Service using youtube-transcript-api
This is a much faster alternative to the Gladia API for YouTube transcription.
"""

import sys
import json
import re
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.formatters import TextFormatter

def extract_video_id(url):
    """Extract video ID from various YouTube URL formats"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/v\/([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If no pattern matches, assume the input is already a video ID
    return url

def get_youtube_transcript(url, languages=['en']):
    """
    Get YouTube transcript using youtube-transcript-api
    
    Args:
        url (str): YouTube URL or video ID
        languages (list): List of language codes in priority order
    
    Returns:
        dict: Transcript data with success status and content
    """
    try:
        # Extract video ID from URL
        video_id = extract_video_id(url)
        print(f"🎥 Extracted video ID: {video_id}", file=sys.stderr)
        
        # Get transcript list to check available languages
        ytt_api = YouTubeTranscriptApi()
        transcript_list = ytt_api.list(video_id)
        
        # Try to find transcript in preferred languages
        transcript = None
        for lang in languages:
            try:
                transcript = transcript_list.find_transcript([lang])
                print(f"✅ Found transcript in language: {lang}", file=sys.stderr)
                break
            except:
                continue
        
        # If no preferred language found, get any available transcript
        if not transcript:
            transcript = transcript_list.find_manually_created_transcript(['en'])
            print(f"⚠️  Using fallback transcript in: {transcript.language_code}", file=sys.stderr)
        
        # Fetch the actual transcript data
        transcript_data = transcript.fetch()
        
        # Format as plain text
        formatter = TextFormatter()
        transcript_text = formatter.format_transcript(transcript_data)
        
        # Also get raw data for more detailed information
        raw_data = []
        for item in transcript_data:
            raw_data.append({
                'text': item.text,
                'start': item.start,
                'duration': item.duration
            })
        
        print(f"📊 Transcript length: {len(transcript_text)} characters", file=sys.stderr)
        print(f"📝 Transcript preview: {transcript_text[:100]}...", file=sys.stderr)
        
        return {
            'success': True,
            'transcript': transcript_text,
            'raw_data': raw_data,
            'video_id': video_id,
            'language': transcript.language_code,
            'is_generated': transcript.is_generated,
            'length': len(transcript_text)
        }
        
    except Exception as e:
        error_msg = str(e)
        print(f"❌ Error getting YouTube transcript: {error_msg}", file=sys.stderr)
        
        return {
            'success': False,
            'error': error_msg,
            'transcript': None,
            'raw_data': None
        }

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python youtube_transcription.py <youtube_url> [language_code]")
        print("Example: python youtube_transcription.py 'https://youtu.be/MHS-htjGgSY' en")
        sys.exit(1)
    
    url = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else 'en'
    
    result = get_youtube_transcript(url, [language])
    
    # Output JSON result
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()