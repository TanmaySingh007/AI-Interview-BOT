import os
import json
import asyncio
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AIService:
    def __init__(self):
        api_key = os.getenv('OPENAI_API_KEY')
        if api_key and api_key != 'your_openai_api_key_here':
            self.client = OpenAI(api_key=api_key)
            self.has_api_key = True
        else:
            self.client = None
            self.has_api_key = False
            print("Warning: OpenAI API key not set. AI features will use fallback content.")
        
        self.company_name = os.getenv('COMPANY_NAME', 'TechCorp')
        self.openai_model = os.getenv('OPENAI_MODEL', 'gpt-3.5-turbo')
        self.whisper_model = os.getenv('WHISPER_MODEL', 'whisper-1')

    def generate_interview_greeting(self, role_title):
        """Generate a role-specific interview greeting using OpenAI GPT."""
        if not self.has_api_key:
            # Fallback greeting when no API key is available
            return f"Hello! Welcome to your interview for the {role_title} position at {self.company_name}. I'm excited to learn more about your experience and skills. Let's begin with some questions to better understand your background and capabilities."
        
        try:
            prompt = f"""You are an AI Interview Bot designed to greet candidates for a first-round interview. Your tone should be professional, welcoming, and encouraging. Based on the following role details, generate a concise, 2-3 sentence introduction for the candidate.

Role Title: {role_title}
Company: {self.company_name}

Generate a warm, professional greeting that:
1. Welcomes the candidate
2. Mentions the role they're interviewing for
3. Sets a positive, encouraging tone
4. Explains what to expect in the interview process

Keep it concise and friendly."""

            response = self.client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are a professional AI interview assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=200,
                temperature=0.7
            )

            greeting = response.choices[0].message.content.strip()
            return greeting

        except Exception as e:
            print(f"Error generating greeting: {e}")
            # Fallback greeting
            return f"Hello! Welcome to your interview for the {role_title} position at {self.company_name}. I'm excited to learn more about your experience and skills. Let's begin with some questions to better understand your background and capabilities."

    def generate_interview_questions(self, role_title, role_description):
        """Generate role-specific interview questions using OpenAI GPT."""
        if not self.has_api_key:
            # Use fallback questions when no API key is available
            return self._get_fallback_questions(role_title)
        
        try:
            # Add randomization to ensure different questions each time
            import random
            random_seed = random.randint(1, 1000)
            
            prompt = f"""You are an expert interviewer specializing in {role_title} roles. Based on the provided job description, generate 5 to 7 unique interview questions. Ensure a mix of:

1. Technical questions assessing core skills
2. Behavioral questions exploring past experiences (e.g., STAR method)
3. Situational questions testing problem-solving
4. Questions probing cultural fit

IMPORTANT: Generate completely different questions than typical interviews. Be creative and unique.
Random seed: {random_seed}

Job Description: {role_description}

Generate questions that are:
- Specific to the role and industry
- Varied in difficulty and type
- Designed to assess both technical and soft skills
- Professional and appropriate for a first-round interview
- Unique and creative (avoid common interview questions)

Return only the questions, one per line, without numbering or additional text."""

            response = self.client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are an expert HR interviewer. Always generate unique, creative questions."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=600,
                temperature=0.9  # Higher temperature for more creativity
            )

            questions_text = response.choices[0].message.content.strip()
            # Split by lines and clean up
            questions = [q.strip() for q in questions_text.split('\n') if q.strip()]
            
            # Ensure we have 5-7 questions
            if len(questions) < 5:
                questions.extend(self._get_fallback_questions(role_title))
            elif len(questions) > 7:
                questions = questions[:7]

            return questions

        except Exception as e:
            print(f"Error generating questions: {e}")
            return self._get_fallback_questions(role_title)

    def transcribe_video(self, video_path):
        """Transcribe audio from video file using OpenAI Whisper."""
        if not self.has_api_key:
            return "[DEMO_MODE] Video transcription would be processed here with OpenAI Whisper API."
        
        try:
            with open(video_path, "rb") as video_file:
                transcript = self.client.audio.transcriptions.create(
                    model=self.whisper_model,
                    file=video_file,
                    response_format="text",
                    language="en"  # Specify language for faster processing
                )
            return transcript.strip()

        except Exception as e:
            print(f"Error transcribing video: {e}")
            return "[TRANSCRIPTION_ERROR] Unable to transcribe the video."

    def generate_answer_summary(self, question_text, transcription):
        """Generate a concise summary of the candidate's answer."""
        if not self.has_api_key:
            return f"[DEMO_MODE] Summary: The candidate provided a response to the question about {question_text[:50]}..."
        
        try:
            # Truncate transcription if too long to speed up processing
            max_transcription_length = 1000
            if len(transcription) > max_transcription_length:
                transcription = transcription[:max_transcription_length] + "..."
            
            prompt = f"""Summarize this interview answer in 1-2 sentences. Focus on key points only.

Question: {question_text}
Answer: {transcription}

Summary:"""

            response = self.client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are a concise HR analyst. Keep summaries brief and focused."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=100,
                temperature=0.3
            )

            summary = response.choices[0].message.content.strip()
            return summary

        except Exception as e:
            print(f"Error generating summary: {e}")
            return f"Summary: The candidate provided a response to the question about {question_text[:50]}..."

    def generate_evaluation(self, role_description, question_text, transcription):
        """Generate a structured skill evaluation of the candidate's answer."""
        if not self.has_api_key:
            return {
                "skills_demonstrated": ["Communication", "Problem Solving"],
                "strengths": ["Clear articulation", "Relevant experience"],
                "weaknesses": ["Could provide more specific examples"],
                "overall_assessment": "Demo Mode",
                "justification": "This is a demo evaluation. With OpenAI API key, you would get AI-powered analysis."
            }
        
        try:
            # Truncate transcription if too long to speed up processing
            max_transcription_length = 800
            if len(transcription) > max_transcription_length:
                transcription = transcription[:max_transcription_length] + "..."
            
            prompt = f"""Evaluate this interview answer quickly. Return JSON with: skills_demonstrated (2-3 skills), strengths (2-3 points), weaknesses (1-2 points), overall_assessment (Strong/Moderate/Needs Development), justification (brief reason).

Question: {question_text}
Answer: {transcription}
Role: {role_description[:200]}..."""

            response = self.client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are a fast HR evaluator. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=300,
                temperature=0.2
            )

            evaluation_text = response.choices[0].message.content.strip()
            
            # Try to parse JSON
            try:
                evaluation = json.loads(evaluation_text)
                return evaluation
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "skills_demonstrated": ["Communication", "Problem Solving"],
                    "strengths": ["Clear articulation", "Relevant experience"],
                    "weaknesses": ["Could provide more specific examples"],
                    "overall_assessment": "Moderate Fit",
                    "justification": "The candidate provided a reasonable response but could benefit from more detailed examples."
                }

        except Exception as e:
            print(f"Error generating evaluation: {e}")
            return {
                "skills_demonstrated": ["Communication"],
                "strengths": ["Attempted to answer the question"],
                "weaknesses": ["Limited detail provided"],
                "overall_assessment": "Needs Development",
                "justification": "The response was minimal and lacked specific details or examples."
            }

    def generate_overall_summary(self, role_title, role_description, transcriptions, evaluations):
        """Generate an overall summary of the candidate's interview performance."""
        if not self.has_api_key:
            return {
                "overall_assessment": "Demo Mode - Overall Assessment",
                "key_insights": [
                    "Candidate completed all interview questions",
                    "Video responses were recorded successfully",
                    "AI analysis would provide detailed insights with API key"
                ],
                "recommendations": [
                    "Review individual question responses for detailed evaluation",
                    "Consider technical skills demonstrated in responses",
                    "Assess communication and problem-solving abilities"
                ],
                "strengths": ["Completed interview process", "Provided video responses"],
                "areas_for_improvement": ["Detailed analysis requires OpenAI API key"],
                "final_recommendation": "Proceed with manual review of responses"
            }
        
        try:
            # Truncate and combine transcriptions for faster processing
            combined_text = ""
            for i, trans in enumerate(transcriptions):
                if len(trans) > 300:  # Limit each transcription
                    trans = trans[:300] + "..."
                combined_text += f"Q{i+1}: {trans}\n"
            
            # Extract key metrics from evaluations
            all_skills = []
            all_strengths = []
            all_weaknesses = []
            
            for eval_data in evaluations:
                if isinstance(eval_data, dict):
                    all_skills.extend(eval_data.get('skills_demonstrated', []))
                    all_strengths.extend(eval_data.get('strengths', []))
                    all_weaknesses.extend(eval_data.get('weaknesses', []))
            
            prompt = f"""Quick overall assessment. Return JSON with: overall_assessment (Strong/Moderate/Needs Development), key_insights (3 points), recommendations (3 points), strengths (3 points), areas_for_improvement (3 points), final_recommendation (Proceed/Reject/Further evaluation).

Role: {role_title}
Responses: {combined_text[:1000]}...
Skills: {', '.join(set(all_skills))}
Strengths: {', '.join(set(all_strengths))}
Weaknesses: {', '.join(set(all_weaknesses))}"""

            response = self.client.chat.completions.create(
                model=self.openai_model,
                messages=[
                    {"role": "system", "content": "You are a fast HR analyst. Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=400,
                temperature=0.2
            )

            summary_text = response.choices[0].message.content.strip()
            
            try:
                summary = json.loads(summary_text)
                return summary
            except json.JSONDecodeError:
                # Fallback if JSON parsing fails
                return {
                    "overall_assessment": "Moderate Fit",
                    "key_insights": ["Candidate provided responses to all questions", "Video format allows for communication assessment"],
                    "recommendations": ["Review individual question responses", "Consider technical assessment if needed"],
                    "strengths": ["Completed interview process"],
                    "areas_for_improvement": ["Detailed analysis requires manual review"],
                    "final_recommendation": "Proceed with manual review"
                }

        except Exception as e:
            print(f"Error generating overall summary: {e}")
            return {
                "overall_assessment": "Unable to Assess",
                "key_insights": ["Technical error in summary generation"],
                "recommendations": ["Manual review required"],
                "strengths": ["Completed interview"],
                "areas_for_improvement": ["Summary generation failed"],
                "final_recommendation": "Manual review needed"
            }

    def _get_fallback_questions(self, role_title):
        """Fallback questions if AI generation fails."""
        fallback_questions = {
            "Software Engineer": [
                "Can you walk us through a challenging technical problem you've solved recently?",
                "How do you approach debugging complex issues in production?",
                "What's your experience with version control systems like Git?",
                "How do you stay updated with the latest technologies and best practices?",
                "Can you describe a time when you had to work with a difficult team member?"
            ],
            "Data Scientist": [
                "Can you explain a machine learning project you've worked on from start to finish?",
                "How do you handle missing or inconsistent data in your analysis?",
                "What's your experience with different machine learning algorithms?",
                "How do you validate your models and ensure they're not overfitting?",
                "Can you describe a time when your analysis led to actionable business insights?"
            ],
            "Product Manager": [
                "Can you walk us through a product you've managed from conception to launch?",
                "How do you prioritize features when resources are limited?",
                "What's your approach to gathering and analyzing user feedback?",
                "How do you handle conflicts between different stakeholders?",
                "Can you describe a time when you had to make a difficult product decision?"
            ],
            "UX Designer": [
                "Can you walk us through your design process for a recent project?",
                "How do you conduct user research and incorporate findings into your designs?",
                "What's your approach to creating wireframes and prototypes?",
                "How do you handle feedback from stakeholders and users?",
                "Can you describe a time when you had to design for accessibility?"
            ],
            "DevOps Engineer": [
                "Can you describe your experience with CI/CD pipelines?",
                "How do you handle infrastructure scaling and monitoring?",
                "What's your experience with containerization and orchestration tools?",
                "How do you approach security in your infrastructure setup?",
                "Can you describe a time when you had to troubleshoot a production issue?"
            ]
        }
        
        return fallback_questions.get(role_title, [
            "Can you tell us about your relevant experience for this position?",
            "What are your key strengths that make you a good fit for this role?",
            "How do you handle challenges and pressure in the workplace?",
            "Can you describe a time when you had to learn something new quickly?",
            "What are your career goals and how does this position align with them?"
        ])

# Create a global instance
ai_service = AIService()
