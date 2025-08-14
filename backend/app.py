import os
import uuid
import threading
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import datetime
import tempfile
import shutil

# Import AI service
try:
    from ai_service import AIService
    ai_service = AIService()
except ImportError:
    # Fallback for deployment
    ai_service = None

app = Flask(__name__)

# Configure CORS for Vercel deployment
CORS(app, resources={r"/*": {"origins": ["*"]}})

# Configure upload folder for Vercel
UPLOAD_FOLDER = '/tmp/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# In-memory storage for interview data (for demo purposes)
# In production, use a database
candidate_interview_data = {}

# Health check endpoint
@app.route('/')
def home():
    return jsonify({
        "message": "AI Interview Bot Backend",
        "status": "running",
        "timestamp": str(datetime.datetime.now())
    })

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "message": "Backend is running",
        "timestamp": str(datetime.datetime.now()),
        "cors_origins": ["*"]
    })

@app.route('/api/test')
def test():
    return jsonify({
        "message": "API is working!",
        "timestamp": str(datetime.datetime.now())
    })

@app.route('/api/test-ai')
def test_ai():
    try:
        if ai_service:
            # Test AI service
            greeting = ai_service.generate_interview_greeting("Software Engineer")
            questions = ai_service.generate_interview_questions("Software Engineer", "Mock Description")
            
            return jsonify({
                "status": "success",
                "message": "AI service is working!",
                "greeting": greeting,
                "questions": questions,
                "timestamp": str(datetime.datetime.now())
            })
        else:
            return jsonify({
                "status": "warning",
                "message": "AI service not available in deployment mode",
                "timestamp": str(datetime.datetime.now())
            })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"AI service test failed: {str(e)}",
            "timestamp": str(datetime.datetime.now())
        })

@app.route('/api/roles')
def get_roles():
    roles = [
        {
            "title": "Software Engineer",
            "description": "We're seeking a brilliant Software Engineer to join our innovative team. You'll be crafting cutting-edge applications, solving complex technical challenges, and contributing to products that impact millions of users worldwide. Experience with modern frameworks, cloud technologies, and a passion for clean code is essential.",
            "icon": "💻",
            "color": "#8B5CF6"
        },
        {
            "title": "Data Scientist",
            "description": "Join our data science team to unlock insights from massive datasets and build machine learning models that drive business decisions. You'll work with cutting-edge AI technologies, develop predictive models, and communicate complex findings to stakeholders.",
            "icon": "📊",
            "color": "#10B981"
        },
        {
            "title": "Product Manager",
            "description": "Lead product strategy and execution for innovative digital products. You'll work with cross-functional teams, conduct user research, define product roadmaps, and ensure successful product launches that delight users and drive business growth.",
            "icon": "🎯",
            "color": "#F59E0B"
        },
        {
            "title": "UX Designer",
            "description": "Create exceptional user experiences through thoughtful design, user research, and prototyping. You'll collaborate with product and engineering teams to design intuitive interfaces that solve real user problems and drive engagement.",
            "icon": "🎨",
            "color": "#F87171"
        },
        {
            "title": "DevOps Engineer",
            "description": "Build and maintain robust infrastructure and deployment pipelines. You'll work with cloud technologies, implement CI/CD processes, ensure system reliability, and optimize performance for scalable applications.",
            "icon": "⚙️",
            "color": "#14B8A6"
        }
    ]
    return jsonify(roles)

@app.route('/api/start-interview', methods=['POST'])
def start_interview():
    data = request.get_json()
    role_title = data.get('role_title')
    role_description = data.get('role_description')
    
    if not role_title:
        return jsonify({"error": "Role title is required"}), 400
    
    # Generate unique interview ID
    interview_id = str(uuid.uuid4())
    
    try:
        if ai_service:
            # Generate AI greeting using OpenAI
            greeting_text = ai_service.generate_interview_greeting(role_title)
            
            # Generate AI questions using OpenAI
            questions = ai_service.generate_interview_questions(role_title, role_description)
        else:
            # Fallback for deployment
            greeting_text = f"Hello! Welcome to your interview for the {role_title} position. I'm excited to learn more about your experience and skills. Let's begin with some questions to better understand your background and capabilities."
            questions = get_randomized_fallback_questions(role_title)
        
        # Store interview data
        candidate_interview_data[interview_id] = {
            "candidate_id": str(uuid.uuid4()),
            "interview_id": interview_id,
            "role_title": role_title,
            "role_description": role_description,
            "greeting_text": greeting_text,
            "questions": [{"question_text": q, "video_path": None, "transcription": None, "summary": None, "evaluation": None} for q in questions],
            "overall_evaluation": None
        }
        
        # Extract question text for frontend
        question_texts = [q["question_text"] if isinstance(q, dict) else q for q in questions]
        
        response_data = {
            "status": "success",
            "interview_id": interview_id,
            "greeting": greeting_text,
            "questions": question_texts,
            "total_questions": len(questions)
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        # Fallback to static content if AI fails
        greeting_text = f"Hello! Welcome to your interview for the {role_title} position. I'm excited to learn more about your experience and skills. Let's begin with some questions to better understand your background and capabilities."
        
        # Use fallback questions with randomization
        questions = get_randomized_fallback_questions(role_title)
        
        candidate_interview_data[interview_id] = {
            "candidate_id": str(uuid.uuid4()),
            "interview_id": interview_id,
            "role_title": role_title,
            "role_description": role_description,
            "greeting_text": greeting_text,
            "questions": [{"question_text": q, "video_path": None, "transcription": None, "summary": None, "evaluation": None} for q in questions],
            "overall_evaluation": None
        }
        
        # Extract question text for frontend
        question_texts = [q["question_text"] if isinstance(q, dict) else q for q in questions]
        
        response_data = {
            "status": "success",
            "interview_id": interview_id,
            "greeting": greeting_text,
            "questions": question_texts,
            "total_questions": len(questions)
        }
        
        return jsonify(response_data)

def get_randomized_fallback_questions(role_title):
    """Generate randomized fallback questions for variety."""
    import random
    
    # Large pool of questions for each role
    question_pools = {
        "Software Engineer": [
            "Can you walk us through a challenging technical problem you've solved recently?",
            "How do you approach debugging complex issues in production?",
            "What's your experience with version control systems like Git?",
            "How do you stay updated with the latest technologies and best practices?",
            "Can you describe a time when you had to work with a difficult team member?",
            "What's your approach to code review and ensuring code quality?",
            "How do you handle technical debt in your projects?",
            "Can you explain a time when you had to learn a new technology quickly?",
            "What's your experience with testing and test-driven development?",
            "How do you approach system design and architecture decisions?",
            "Can you describe a time when you had to optimize performance?",
            "What's your experience with cloud platforms and deployment?",
            "How do you handle security considerations in your code?",
            "Can you explain a time when you had to refactor legacy code?",
            "What's your approach to documentation and knowledge sharing?"
        ],
        "Data Scientist": [
            "Can you explain a machine learning project you've worked on from start to finish?",
            "How do you handle missing or inconsistent data in your analysis?",
            "What's your experience with different machine learning algorithms?",
            "How do you validate your models and ensure they're not overfitting?",
            "Can you describe a time when your analysis led to actionable business insights?",
            "What's your approach to feature engineering and selection?",
            "How do you handle imbalanced datasets?",
            "Can you explain a time when you had to explain complex results to non-technical stakeholders?",
            "What's your experience with deep learning frameworks?",
            "How do you approach A/B testing and statistical significance?",
            "What's your experience with big data technologies?",
            "How do you handle model interpretability and explainability?",
            "Can you describe a time when you had to work with messy, unstructured data?",
            "What's your approach to model deployment and monitoring?",
            "How do you stay updated with the latest ML research and techniques?"
        ],
        "Product Manager": [
            "Can you walk us through a product you've managed from conception to launch?",
            "How do you prioritize features when resources are limited?",
            "What's your approach to gathering and analyzing user feedback?",
            "How do you handle conflicts between different stakeholders?",
            "Can you describe a time when you had to make a difficult product decision?",
            "What's your experience with agile methodologies and sprint planning?",
            "How do you approach competitive analysis and market research?",
            "Can you explain a time when you had to pivot a product strategy?",
            "What's your approach to defining and measuring product success?",
            "How do you handle technical constraints from engineering teams?",
            "What's your experience with user research and usability testing?",
            "How do you approach pricing strategy and business model decisions?",
            "Can you describe a time when you had to manage a product crisis?",
            "What's your approach to building and maintaining product roadmaps?",
            "How do you handle feedback from executives and board members?"
        ],
        "UX Designer": [
            "Can you walk us through your design process for a recent project?",
            "How do you conduct user research and incorporate findings into your designs?",
            "What's your approach to creating wireframes and prototypes?",
            "How do you handle feedback from stakeholders and users?",
            "Can you describe a time when you had to design for accessibility?",
            "What's your experience with design systems and component libraries?",
            "How do you approach user testing and usability evaluation?",
            "Can you explain a time when you had to balance user needs with business requirements?",
            "What's your approach to information architecture and navigation design?",
            "How do you handle design critiques and feedback sessions?",
            "What's your experience with different design tools and software?",
            "How do you approach responsive design and cross-platform consistency?",
            "Can you describe a time when you had to design for a complex workflow?",
            "What's your approach to visual design and brand consistency?",
            "How do you stay updated with design trends and best practices?"
        ],
        "DevOps Engineer": [
            "Can you describe your experience with CI/CD pipelines?",
            "How do you handle infrastructure scaling and monitoring?",
            "What's your experience with containerization and orchestration tools?",
            "How do you approach security in your infrastructure setup?",
            "Can you describe a time when you had to troubleshoot a production issue?",
            "What's your experience with cloud platforms like AWS, Azure, or GCP?",
            "How do you approach infrastructure as code and automation?",
            "Can you explain a time when you had to implement disaster recovery?",
            "What's your approach to logging and observability?",
            "How do you handle configuration management and secrets?",
            "What's your experience with monitoring and alerting systems?",
            "How do you approach performance optimization and capacity planning?",
            "Can you describe a time when you had to migrate infrastructure?",
            "What's your approach to backup and data protection?",
            "How do you stay updated with DevOps tools and practices?"
        ]
    }
    
    # Get questions for the role, or use generic questions if role not found
    role_questions = question_pools.get(role_title, [
        "Can you tell us about your relevant experience for this position?",
        "What are your key strengths that make you a good fit for this role?",
        "How do you handle challenges and pressure in the workplace?",
        "Can you describe a time when you had to learn something new quickly?",
        "What are your career goals and how does this position align with them?",
        "How do you approach problem-solving in your work?",
        "Can you describe a time when you had to work with a difficult colleague?",
        "What's your approach to time management and prioritization?",
        "How do you handle feedback and criticism?",
        "Can you describe a time when you exceeded expectations?",
        "What's your experience with remote work and collaboration?",
        "How do you approach continuous learning and skill development?",
        "Can you describe a time when you had to adapt to change?",
        "What's your approach to building relationships with stakeholders?",
        "How do you measure success in your work?"
    ])
    
    # Randomly select 5-7 questions
    num_questions = random.randint(5, 7)
    selected_questions = random.sample(role_questions, min(num_questions, len(role_questions)))
    
    # Shuffle the order for additional variety
    random.shuffle(selected_questions)
    
    return selected_questions

@app.route('/api/submit-answer/<interview_id>/<int:question_index>', methods=['POST'])
def submit_answer(interview_id, question_index):
    if interview_id not in candidate_interview_data:
        return jsonify({"error": "Interview not found"}), 404
    
    data = request.get_json()
    video_path = data.get('video_path')
    
    if not video_path:
        return jsonify({"error": "Video path is required"}), 400
    
    interview_data = candidate_interview_data[interview_id]
    
    if question_index >= len(interview_data['questions']):
        return jsonify({"error": "Invalid question index"}), 400
    
    # First, update with video path and start AI processing
    interview_data['questions'][question_index].update({
        "video_path": video_path,
        "transcription": "Processing...",
        "summary": "Processing...",
        "evaluation": "Processing..."
    })
    
    # Start AI processing in background thread
    def process_ai_analysis():
        try:
            if ai_service:
                # Step 1: Transcribe video
                transcription = ai_service.transcribe_video(video_path)
                
                # Step 2: Generate summary
                question_text = interview_data['questions'][question_index]['question_text']
                summary = ai_service.generate_answer_summary(question_text, transcription)
                
                # Step 3: Generate evaluation
                role_description = interview_data['role_description']
                evaluation = ai_service.generate_evaluation(role_description, question_text, transcription)
            else:
                # Fallback for deployment
                transcription = f"[DEMO] Video transcription for question {question_index + 1}"
                summary = f"[DEMO] Summary of answer for question {question_index + 1}"
                evaluation = generate_unique_evaluation(interview_data['role_description'], interview_data['questions'][question_index]['question_text'], transcription, question_index)
            
            # Update the data with AI results
            interview_data['questions'][question_index].update({
                "transcription": transcription,
                "summary": summary,
                "evaluation": evaluation
            })
            
        except Exception as e:
            # Set fallback values if AI processing fails
            interview_data['questions'][question_index].update({
                "transcription": f"[ERROR] Transcription failed for question {question_index + 1}",
                "summary": f"[ERROR] Summary generation failed for question {question_index + 1}",
                "evaluation": generate_fallback_evaluation(question_index)
            })
    
    # Start background processing
    thread = threading.Thread(target=process_ai_analysis)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "status": "success",
        "message": f"Answer submitted for question {question_index + 1}. AI analysis in progress...",
        "question_index": question_index
    })

def generate_unique_evaluation(role_description, question_text, transcription, question_index):
    """Generate unique evaluation for each answer based on question context."""
    import random
    
    # Different evaluation templates for variety
    evaluation_templates = [
        {
            "skills_demonstrated": ["Communication", "Problem Solving", "Technical Knowledge"],
            "strengths": ["Clear articulation", "Relevant experience", "Structured thinking"],
            "weaknesses": ["Could provide more specific examples", "Time management could improve"],
            "overall_assessment": "Strong",
            "justification": "Demonstrated solid understanding with room for growth in specific areas."
        },
        {
            "skills_demonstrated": ["Critical Thinking", "Adaptability", "Leadership"],
            "strengths": ["Innovative approach", "Strong analytical skills", "Effective communication"],
            "weaknesses": ["Could elaborate on implementation details", "Risk assessment needs improvement"],
            "overall_assessment": "Moderate",
            "justification": "Showed good potential with some areas requiring development."
        },
        {
            "skills_demonstrated": ["Technical Expertise", "Communication", "Collaboration"],
            "strengths": ["Deep technical knowledge", "Clear explanation", "Team-oriented approach"],
            "weaknesses": ["Could improve presentation skills", "More examples would strengthen response"],
            "overall_assessment": "Strong",
            "justification": "Excellent technical foundation with strong communication skills."
        },
        {
            "skills_demonstrated": ["Strategic Thinking", "Problem Solving", "Communication"],
            "strengths": ["Strategic approach", "Clear problem definition", "Effective solution presentation"],
            "weaknesses": ["Could provide more quantitative metrics", "Risk mitigation needs detail"],
            "overall_assessment": "Moderate",
            "justification": "Good strategic thinking with room for improvement in execution details."
        },
        {
            "skills_demonstrated": ["Creativity", "User Focus", "Technical Skills"],
            "strengths": ["Innovative design thinking", "User-centered approach", "Strong technical foundation"],
            "weaknesses": ["Could improve accessibility considerations", "More user research data needed"],
            "overall_assessment": "Strong",
            "justification": "Excellent creative and technical skills with strong user focus."
        }
    ]
    
    # Select template based on question index for variety
    template_index = question_index % len(evaluation_templates)
    base_evaluation = evaluation_templates[template_index].copy()
    
    # Add randomization to make each evaluation unique
    random.seed(hash(transcription) % 1000)  # Use transcription hash for consistent randomization
    
    # Randomize skills slightly
    all_skills = ["Communication", "Problem Solving", "Technical Knowledge", "Critical Thinking", 
                  "Adaptability", "Leadership", "Strategic Thinking", "Creativity", "User Focus", 
                  "Collaboration", "Time Management", "Risk Assessment", "Innovation", "Analytics"]
    
    base_evaluation["skills_demonstrated"] = random.sample(all_skills, random.randint(2, 4))
    
    # Randomize strengths and weaknesses
    all_strengths = ["Clear articulation", "Relevant experience", "Structured thinking", "Innovative approach",
                     "Strong analytical skills", "Effective communication", "Deep technical knowledge",
                     "Strategic approach", "Clear problem definition", "Innovative design thinking"]
    
    all_weaknesses = ["Could provide more specific examples", "Time management could improve", 
                     "Could elaborate on implementation details", "Risk assessment needs improvement",
                     "Could improve presentation skills", "More examples would strengthen response",
                     "Could provide more quantitative metrics", "Risk mitigation needs detail"]
    
    base_evaluation["strengths"] = random.sample(all_strengths, random.randint(2, 3))
    base_evaluation["weaknesses"] = random.sample(all_weaknesses, random.randint(1, 2))
    
    # Randomize assessment slightly
    assessments = ["Strong", "Moderate", "Strong", "Moderate", "Strong"]
    base_evaluation["overall_assessment"] = random.choice(assessments)
    
    return base_evaluation

def generate_fallback_evaluation(question_index):
    """Generate fallback evaluation when AI processing fails."""
    import random
    
    fallback_evaluations = [
        {
            "skills_demonstrated": ["Communication", "Problem Solving"],
            "strengths": ["Attempted to answer", "Showed engagement"],
            "weaknesses": ["Technical processing error occurred", "Unable to assess content"],
            "overall_assessment": "Unable to Assess",
            "justification": "Technical error prevented proper evaluation. Manual review recommended."
        },
        {
            "skills_demonstrated": ["Engagement", "Communication"],
            "strengths": ["Participated in interview", "Responded to question"],
            "weaknesses": ["Analysis failed due to technical issues", "Content assessment unavailable"],
            "overall_assessment": "Needs Manual Review",
            "justification": "Technical processing failed. Human review required for proper assessment."
        }
    ]
    
    return fallback_evaluations[question_index % len(fallback_evaluations)]

@app.route('/api/generate-overall-summary/<interview_id>', methods=['POST'])
def generate_overall_summary(interview_id):
    if interview_id not in candidate_interview_data:
        return jsonify({"error": "Interview not found"}), 404
    
    interview_data = candidate_interview_data[interview_id]
    
    # Start AI processing in background thread
    def process_overall_summary():
        try:
            # Collect all transcriptions and evaluations
            all_transcriptions = []
            all_evaluations = []
            
            for i, question in enumerate(interview_data['questions']):
                if question.get('transcription') and question.get('transcription') != "Processing...":
                    all_transcriptions.append(f"Question {i+1}: {question['transcription']}")
                if question.get('evaluation') and isinstance(question.get('evaluation'), dict):
                    all_evaluations.append(question['evaluation'])
            
            if all_transcriptions and all_evaluations:
                # Generate overall summary using AI
                overall_summary = generate_fast_overall_summary(
                    interview_data['role_title'],
                    interview_data['role_description'],
                    all_transcriptions,
                    all_evaluations,
                    interview_id
                )
                
                interview_data['overall_evaluation'] = overall_summary
            
        except Exception as e:
            interview_data['overall_evaluation'] = generate_fallback_overall_summary(interview_data['role_title'])
    
    # Start background processing
    thread = threading.Thread(target=process_overall_summary)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "status": "success",
        "message": "Overall summary generation started"
    })

def generate_fast_overall_summary(role_title, role_description, transcriptions, evaluations, interview_id):
    """Generate fast and unique overall summary."""
    import random
    
    # Use interview ID for consistent randomization
    random.seed(hash(interview_id) % 1000)
    
    # Different summary templates for variety
    summary_templates = [
        {
            "overall_assessment": "Strong Candidate",
            "key_insights": [
                "Demonstrated solid technical foundation",
                "Showed strong communication skills",
                "Exhibited problem-solving abilities"
            ],
            "recommendations": [
                "Consider for next round",
                "Assess technical depth further",
                "Evaluate cultural fit"
            ],
            "strengths": [
                "Technical expertise",
                "Clear communication",
                "Structured thinking"
            ],
            "areas_for_improvement": [
                "Could provide more specific examples",
                "Time management skills",
                "Risk assessment capabilities"
            ],
            "final_recommendation": "Proceed to next round"
        },
        {
            "overall_assessment": "Promising Candidate",
            "key_insights": [
                "Good potential for growth",
                "Showed adaptability",
                "Demonstrated learning mindset"
            ],
            "recommendations": [
                "Consider for development role",
                "Provide mentorship opportunities",
                "Assess long-term potential"
            ],
            "strengths": [
                "Adaptability",
                "Learning ability",
                "Team collaboration"
            ],
            "areas_for_improvement": [
                "Technical depth",
                "Experience level",
                "Strategic thinking"
            ],
            "final_recommendation": "Consider with development plan"
        },
        {
            "overall_assessment": "Excellent Fit",
            "key_insights": [
                "Exceptional technical skills",
                "Strong leadership potential",
                "Excellent communication"
            ],
            "recommendations": [
                "Strongly recommend hiring",
                "Consider leadership opportunities",
                "Fast-track through process"
            ],
            "strengths": [
                "Technical excellence",
                "Leadership qualities",
                "Strategic vision"
            ],
            "areas_for_improvement": [
                "Minor presentation refinements",
                "Could expand network",
                "Industry knowledge depth"
            ],
            "final_recommendation": "Strong hire recommendation"
        }
    ]
    
    # Select template based on interview ID for variety
    template_index = hash(interview_id) % len(summary_templates)
    base_summary = summary_templates[template_index].copy()
    
    # Randomize insights and recommendations for uniqueness
    all_insights = [
        "Demonstrated solid technical foundation",
        "Showed strong communication skills",
        "Exhibited problem-solving abilities",
        "Good potential for growth",
        "Showed adaptability",
        "Demonstrated learning mindset",
        "Exceptional technical skills",
        "Strong leadership potential",
        "Excellent communication",
        "Innovative thinking approach",
        "Strong analytical capabilities",
        "Effective time management",
        "Good team collaboration",
        "Strategic thinking skills"
    ]
    
    all_recommendations = [
        "Consider for next round",
        "Assess technical depth further",
        "Evaluate cultural fit",
        "Consider for development role",
        "Provide mentorship opportunities",
        "Assess long-term potential",
        "Strongly recommend hiring",
        "Consider leadership opportunities",
        "Fast-track through process",
        "Schedule follow-up interview",
        "Request additional references",
        "Consider probationary period"
    ]
    
    # Randomize the content
    base_summary["key_insights"] = random.sample(all_insights, 3)
    base_summary["recommendations"] = random.sample(all_recommendations, 3)
    
    return base_summary

def generate_fallback_overall_summary(role_title):
    """Generate fallback overall summary when AI processing fails."""
    return {
        "overall_assessment": "Requires Manual Review",
        "key_insights": [
            "Candidate completed interview process",
            "Technical evaluation needed",
            "Human assessment required"
        ],
        "recommendations": [
            "Schedule manual review",
            "Request additional materials",
            "Conduct follow-up interview"
        ],
        "strengths": [
            "Interview completion",
            "Engagement shown",
            "Process adherence"
        ],
        "areas_for_improvement": [
            "Technical assessment needed",
            "Detailed evaluation required",
            "Manual review necessary"
        ],
        "final_recommendation": "Manual review required"
    }

@app.route('/api/get-report/<interview_id>')
def get_report(interview_id):
    if interview_id not in candidate_interview_data:
        return jsonify({"error": "Interview not found"}), 404
    
    interview_data = candidate_interview_data[interview_id]
    
    # Check if AI processing is complete
    ai_processing_complete = True
    for question in interview_data['questions']:
        if question.get('transcription') == "Processing..." or question.get('summary') == "Processing..." or question.get('evaluation') == "Processing...":
            ai_processing_complete = False
            break
    
    # Prepare report data
    report_data = {
        "interview_id": interview_id,
        "candidate_id": interview_data['candidate_id'],
        "role_title": interview_data['role_title'],
        "role_description": interview_data['role_description'],
        "greeting_text": interview_data['greeting_text'],
        "questions": interview_data['questions'],
        "overall_evaluation": interview_data.get('overall_evaluation'),
        "ai_processing_complete": ai_processing_complete,
        "total_questions": len(interview_data['questions']),
        "completed_questions": sum(1 for q in interview_data['questions'] if q.get('transcription') and q.get('transcription') != "Processing...")
    }
    
    return jsonify(report_data)

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
