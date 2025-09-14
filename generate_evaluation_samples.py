#!/usr/bin/env python3
"""
Generate 100 evaluation samples for the note-taking agent
"""

import json
import random

def generate_sample(id, category, content_type, subject, difficulty):
    """Generate a single evaluation sample"""
    
    # Base templates for different content types
    templates = {
        "lecture_audio": {
            "titles": [
                "Introduction to {subject}",
                "{subject} Fundamentals",
                "Advanced {subject} Concepts",
                "{subject} Applications",
                "Understanding {subject}"
            ],
            "descriptions": [
                "Audio lecture covering basic {subject} concepts and practical applications",
                "Educational audio content explaining {subject} principles and real-world examples",
                "Comprehensive {subject} lecture with detailed explanations and case studies"
            ]
        },
        "podcast": {
            "titles": [
                "{subject} Discussion",
                "Exploring {subject}",
                "{subject} Insights",
                "Deep Dive into {subject}",
                "{subject} Perspectives"
            ],
            "descriptions": [
                "Podcast discussion about {subject} trends, challenges, and future outlook",
                "Expert panel discussion on {subject} topics and industry insights",
                "Interview-based content exploring {subject} from multiple angles"
            ]
        },
        "educational_video": {
            "titles": [
                "{subject} Tutorial",
                "Learn {subject}",
                "{subject} Explained",
                "Mastering {subject}",
                "{subject} Guide"
            ],
            "descriptions": [
                "Educational video explaining {subject} concepts with visual aids and examples",
                "Step-by-step tutorial covering {subject} fundamentals and advanced topics",
                "Comprehensive video guide to understanding {subject} principles"
            ]
        },
        "research_paper": {
            "titles": [
                "Research in {subject}",
                "{subject} Study",
                "Advances in {subject}",
                "{subject} Analysis",
                "Exploring {subject}"
            ],
            "descriptions": [
                "Academic paper discussing {subject} research findings and implications",
                "Scientific study analyzing {subject} phenomena and applications",
                "Research publication presenting new insights in {subject} field"
            ]
        },
        "tutorial_video": {
            "titles": [
                "{subject} Tutorial",
                "How to {subject}",
                "{subject} Step-by-Step",
                "Learn {subject}",
                "{subject} Workshop"
            ],
            "descriptions": [
                "YouTube tutorial covering {subject} basics and practical implementation",
                "Educational video teaching {subject} concepts through hands-on examples",
                "Comprehensive guide to learning {subject} from beginner to advanced"
            ]
        }
    }
    
    # Subject-specific concepts
    subject_concepts = {
        "Computer Science": ["algorithms", "data structures", "programming", "software engineering", "artificial intelligence"],
        "Mathematics": ["calculus", "algebra", "statistics", "geometry", "probability"],
        "Physics": ["mechanics", "thermodynamics", "electromagnetism", "quantum physics", "optics"],
        "Chemistry": ["organic chemistry", "inorganic chemistry", "physical chemistry", "biochemistry", "analytical chemistry"],
        "Biology": ["cell biology", "genetics", "ecology", "evolution", "molecular biology"],
        "History": ["ancient history", "medieval history", "modern history", "world wars", "civilizations"],
        "Economics": ["microeconomics", "macroeconomics", "finance", "trade", "development"],
        "Psychology": ["cognitive psychology", "behavioral psychology", "social psychology", "developmental psychology", "clinical psychology"],
        "Business": ["management", "marketing", "finance", "strategy", "entrepreneurship"],
        "Environmental Science": ["climate change", "sustainability", "ecology", "conservation", "renewable energy"]
    }
    
    template = templates.get(content_type, templates["lecture_audio"])
    title = random.choice(template["titles"]).format(subject=subject)
    description = random.choice(template["descriptions"]).format(subject=subject)
    
    # Generate expected structure based on subject
    concepts = subject_concepts.get(subject, ["general concepts", "key principles", "main topics"])
    main_topics = random.sample(concepts, min(4, len(concepts)))
    key_concepts = random.sample(concepts, min(6, len(concepts)))
    
    return {
        "id": id,
        "category": category,
        "content_type": content_type,
        "title": title,
        "description": description,
        "expected_notes_structure": {
            "main_topics": main_topics,
            "key_concepts": key_concepts,
            "examples": [f"{concept} example" for concept in main_topics[:3]]
        },
        "expected_study_materials": {
            "quiz_questions": random.randint(5, 15),
            "flashcards": random.randint(8, 20),
            "key_points": random.randint(6, 12),
            "action_items": random.randint(4, 10)
        },
        "difficulty_level": difficulty,
        "subject": subject
    }

def main():
    """Generate 100 evaluation samples"""
    
    # Define categories and their distributions
    categories = {
        "audio_content": 25,
        "video_content": 25,
        "document_content": 25,
        "youtube_content": 25
    }
    
    # Content types for each category
    content_types = {
        "audio_content": ["lecture_audio", "podcast", "interview", "conference_presentation"],
        "video_content": ["educational_video", "documentary", "tutorial_video", "lecture_video"],
        "document_content": ["research_paper", "textbook_chapter", "article", "report"],
        "youtube_content": ["tutorial_video", "lecture_video", "educational_video", "documentary"]
    }
    
    # Subjects and difficulties
    subjects = [
        "Computer Science", "Mathematics", "Physics", "Chemistry", "Biology",
        "History", "Economics", "Psychology", "Business", "Environmental Science"
    ]
    
    difficulties = ["beginner", "intermediate", "advanced"]
    
    # Generate samples
    samples = []
    sample_id = 1
    
    for category, count in categories.items():
        for i in range(count):
            content_type = random.choice(content_types[category])
            subject = random.choice(subjects)
            difficulty = random.choice(difficulties)
            
            sample = generate_sample(sample_id, category, content_type, subject, difficulty)
            samples.append(sample)
            sample_id += 1
    
    # Create the complete dataset
    dataset = {
        "dataset_name": "Note-Taking Agent Evaluation Dataset",
        "version": "1.0.0",
        "description": "Comprehensive evaluation dataset for testing note-taking agent capabilities across different content types and study material generation",
        "total_samples": 100,
        "categories": categories,
        "samples": samples,
        "evaluation_criteria": {
            "note_quality": {
                "structure": "Notes should have clear headings, logical flow, and proper organization",
                "completeness": "All key concepts and main topics should be covered",
                "accuracy": "Information should be factually correct and well-explained",
                "clarity": "Notes should be easy to understand and student-friendly"
            },
            "study_materials": {
                "quiz_quality": "Questions should be relevant, challenging but fair, with clear explanations",
                "flashcard_effectiveness": "Cards should cover key terms and concepts for effective memorization",
                "summary_completeness": "Summary should capture all important points concisely",
                "action_items_practicality": "Action items should be specific, actionable, and relevant"
            },
            "content_processing": {
                "audio_transcription": "Audio content should be accurately transcribed and processed",
                "video_analysis": "Video content should be properly analyzed for educational value",
                "document_parsing": "Document content should be correctly extracted and structured",
                "youtube_processing": "YouTube videos should be processed with proper context and metadata"
            }
        },
        "test_scenarios": [
            {
                "scenario": "Mixed Content Processing",
                "description": "Test processing multiple file types in a single session",
                "files": ["lecture_audio.mp3", "slides.pdf", "youtube_video_url"],
                "expected_outcome": "Generate comprehensive notes combining all sources"
            },
            {
                "scenario": "Long Form Content",
                "description": "Test processing of lengthy content (2+ hours)",
                "files": ["long_lecture.mp4"],
                "expected_outcome": "Generate detailed, well-structured notes without information loss"
            },
            {
                "scenario": "Technical Content",
                "description": "Test processing of highly technical or specialized content",
                "files": ["research_paper.pdf"],
                "expected_outcome": "Generate accurate notes with proper technical terminology"
            },
            {
                "scenario": "Multilingual Content",
                "description": "Test processing of content in different languages",
                "files": ["spanish_lecture.mp3", "french_document.pdf"],
                "expected_outcome": "Generate notes in appropriate language with cultural context"
            },
            {
                "scenario": "Poor Quality Audio",
                "description": "Test processing of low-quality or noisy audio",
                "files": ["noisy_recording.wav"],
                "expected_outcome": "Generate usable notes despite audio quality issues"
            }
        ],
        "performance_metrics": {
            "processing_time": {
                "audio_1min": "< 30 seconds",
                "video_10min": "< 2 minutes",
                "document_10pages": "< 1 minute",
                "youtube_15min": "< 3 minutes"
            },
            "accuracy_metrics": {
                "transcription_accuracy": "> 90%",
                "key_concept_extraction": "> 85%",
                "study_material_relevance": "> 90%"
            },
            "user_satisfaction": {
                "note_quality_rating": "> 4.0/5.0",
                "study_material_usefulness": "> 4.0/5.0",
                "overall_satisfaction": "> 4.0/5.0"
            }
        }
    }
    
    # Write to file
    with open("evaluation_dataset.json", "w") as f:
        json.dump(dataset, f, indent=2)
    
    print(f"✅ Generated {len(samples)} evaluation samples")
    print(f"📊 Categories: {categories}")
    print(f"📝 Subjects: {len(subjects)} different subjects")
    print(f"🎯 Difficulty levels: {difficulties}")

if __name__ == "__main__":
    main()
