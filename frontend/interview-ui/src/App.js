import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  Video, 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft,
  Trophy,
  Star,
  Zap,
  Target,
  Users,
  Briefcase,
  Sparkles,
  Rocket
} from 'lucide-react';
import VideoRecorder from './VideoRecorder';
import RecruiterReport from './RecruiterReport';
import ParticleBackground from './ParticleBackground';
import './App.css';

const App = () => {
  const [currentView, setCurrentView] = useState('start');
  const [selectedRole, setSelectedRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [useCustomRole, setUseCustomRole] = useState(false);
  const [interviewData, setInterviewData] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [uploadedVideoPath, setUploadedVideoPath] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleDescriptions, setRoleDescriptions] = useState({});
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Predefined roles with stunning descriptions
  const predefinedRoles = [
    {
      title: "Software Engineer",
      description: "We're seeking a brilliant Software Engineer to join our innovative team. You'll be crafting cutting-edge applications, solving complex technical challenges, and contributing to products that impact millions of users worldwide. Experience with modern frameworks, cloud technologies, and a passion for clean code is essential.",
      icon: "💻",
      color: "#8B5CF6"
    },
    {
      title: "Data Scientist",
      description: "Join our data-driven revolution! We need a Data Scientist who can transform raw data into actionable insights. You'll be building machine learning models, conducting advanced analytics, and helping us make data-informed decisions that drive business growth.",
      icon: "📊",
      color: "#10B981"
    },
    {
      title: "Product Manager",
      description: "Lead the future of product development! As a Product Manager, you'll be the bridge between business strategy and technical execution. You'll define product vision, prioritize features, and work with cross-functional teams to deliver exceptional user experiences.",
      icon: "🎯",
      color: "#F59E0B"
    },
    {
      title: "UX Designer",
      description: "Create experiences that users love! We're looking for a UX Designer who can craft intuitive, beautiful, and functional interfaces. You'll conduct user research, create wireframes and prototypes, and ensure our products are both aesthetically pleasing and highly usable.",
      icon: "🎨",
      color: "#F87171"
    },
    {
      title: "DevOps Engineer",
      description: "Build the infrastructure that powers our future! As a DevOps Engineer, you'll design and maintain our cloud infrastructure, implement CI/CD pipelines, and ensure our systems are scalable, secure, and reliable. Experience with AWS, Docker, and Kubernetes is a plus.",
      icon: "⚡",
      color: "#14B8A6"
    }
  ];

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/roles');
      const data = await response.json();
      if (data.status === 'success') {
        setRoles(data.roles);
        setRoleDescriptions(data.role_descriptions);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const startInterview = async () => {
    setLoading(true);
    try {
      const roleTitle = useCustomRole ? customRole : selectedRole;
      const roleDescription = useCustomRole ? customDescription : roleDescriptions[selectedRole];

      console.log('Starting interview with:', { roleTitle, roleDescription });

      // First, test if backend is reachable
      try {
        const healthCheck = await fetch('http://localhost:5000/health');
        if (!healthCheck.ok) {
          throw new Error(`Backend health check failed: ${healthCheck.status}`);
        }
        console.log('Backend health check passed');
      } catch (healthError) {
        console.error('Backend health check failed:', healthError);
        throw new Error('Cannot connect to backend. Please ensure the backend server is running on port 5000.');
      }

      const response = await fetch('http://localhost:5000/api/start-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role_title: roleTitle, role_description: roleDescription })
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (data.status === 'success') {
        console.log('Interview started successfully:', data);
        setInterviewData({
          interview_id: data.interview_id,
          greeting: data.greeting,
          questions: data.questions,
          role_title: roleTitle,
          role_description: roleDescription
        });
        setCurrentView('interview');
        setProgress(0);
      } else {
        console.error('Interview start failed:', data);
        throw new Error(data.error || 'Failed to start interview');
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      let errorMessage = error.message;
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Cannot connect to backend server. Please ensure:\n1. Backend is running on port 5000\n2. No firewall is blocking the connection\n3. Both frontend and backend are running';
      }
      
      alert(`Failed to start interview:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoUploaded = (videoPath) => {
    setUploadedVideoPath(videoPath);
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setUploadedVideoPath(null);
    }
  };

  const submitAnswer = async () => {
    if (!uploadedVideoPath) return;

    try {
      const response = await fetch(`http://localhost:5000/api/submit-answer/${interviewData.interview_id}/${currentQuestionIndex}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_path: uploadedVideoPath })
      });

      const data = await response.json();
      if (data.status === 'success') {
        if (currentQuestionIndex < interviewData.questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setUploadedVideoPath(null);
          setProgress(((currentQuestionIndex + 1) / interviewData.questions.length) * 100);
        } else {
          await generateOverallSummary();
          setCurrentView('completion');
        }
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
    }
  };

  const generateOverallSummary = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/generate-overall-summary/${interviewData.interview_id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Overall summary generated:', data);
      }
    } catch (err) {
      console.error('Error generating overall summary:', err);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    setUseCustomRole(false);
  };

  const handleCustomRoleToggle = () => {
    setUseCustomRole(!useCustomRole);
    if (!useCustomRole) {
      setSelectedRole('');
    } else {
      setCustomRole('');
      setCustomDescription('');
    }
  };

  const renderStartView = () => (
    <motion.div 
      className="start-view"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* Back button - only show when coming from other views */}
      {currentView === 'start' && (
        <motion.div 
          className="start-back-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button 
            className="back-btn"
            onClick={() => window.location.reload()}
          >
            ← Restart Application
          </button>
        </motion.div>
      )}

      <motion.div 
        className="hero-section"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1, delay: 0.2 }}
      >
        <motion.div 
          className="hero-icon"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          <Rocket size={80} />
        </motion.div>
        <h1 className="hero-title">
          <motion.span
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            AI Interview
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="highlight"
          >
            Bot
          </motion.span>
        </h1>
        <motion.p 
          className="hero-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          Experience the future of interviewing with AI-powered questions, real-time analysis, and instant feedback
        </motion.p>
      </motion.div>

      <motion.div 
        className="role-selection"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1 }}
      >
        <div className="section-header">
          <Target className="section-icon" />
          <h2>Choose Your Role</h2>
        </div>

        <div className="custom-role-toggle">
          <motion.button
            className={`toggle-btn ${useCustomRole ? 'active' : ''}`}
            onClick={handleCustomRoleToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Sparkles size={20} />
            {useCustomRole ? 'Custom Role' : 'Use Custom Role'}
          </motion.button>
        </div>

        {useCustomRole ? (
          <motion.div 
            className="custom-role-form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            transition={{ duration: 0.5 }}
          >
            <div className="form-group">
              <label>Role Title</label>
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g., Senior Frontend Developer"
                className="custom-input"
              />
            </div>
            <div className="form-group">
              <label>Role Description</label>
              <textarea
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="custom-textarea"
                rows={4}
              />
            </div>
          </motion.div>
        ) : (
          <div className="role-grid">
            {predefinedRoles.map((role, index) => (
              <motion.div
                key={role.title}
                className={`role-card ${selectedRole === role.title ? 'selected' : ''}`}
                onClick={() => handleRoleChange(role.title)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                style={{ '--role-color': role.color }}
              >
                <div className="role-icon">{role.icon}</div>
                <h3>{role.title}</h3>
                <p>{role.description.substring(0, 120)}...</p>
                <motion.div 
                  className="selection-indicator"
                  initial={{ scale: 0 }}
                  animate={{ scale: selectedRole === role.title ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CheckCircle size={24} />
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}

        <motion.button
          className="start-btn"
          onClick={startInterview}
          disabled={loading || (!useCustomRole && !selectedRole) || (useCustomRole && (!customRole || !customDescription))}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          {loading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap size={24} />
            </motion.div>
          ) : (
            <>
              <Play size={24} />
              Start Interview
            </>
          )}
        </motion.button>

        <motion.button
          className="view-reports-btn"
          onClick={() => setCurrentView('report')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.7 }}
        >
          <Users size={20} />
          View Reports
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const renderInterviewView = () => (
    <motion.div 
      className="interview-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="interview-header">
        <button 
          className="back-btn"
          onClick={() => setCurrentView('start')}
        >
          ← Back to Home
        </button>
        <h2>Interview in Progress</h2>
        <div className="role-badge">
          {interviewData.role_title}
        </div>
      </div>
      
      <div className="progress-container">
        <motion.div 
          className="progress-bar"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8 }}
        />
        <span className="progress-text">
          Question {currentQuestionIndex + 1} of {interviewData.questions.length}
        </span>
      </div>

      <motion.div 
        className="greeting-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="ai-avatar">
          <motion.div 
            className="avatar-glow"
            animate={{ 
              boxShadow: [
                "0 0 20px rgba(255, 215, 0, 0.5)",
                "0 0 40px rgba(255, 215, 0, 0.8)",
                "0 0 20px rgba(255, 215, 0, 0.5)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles size={32} />
          </motion.div>
        </div>
        <motion.p 
          className="greeting-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {interviewData.greeting}
        </motion.p>
      </motion.div>

      <motion.div 
        className="question-section"
        key={currentQuestionIndex}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.5 }}
      >
        <div className="question-header">
          <motion.div 
            className="question-number"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {currentQuestionIndex + 1}
          </motion.div>
          <h2 className="question-text">
            {interviewData.questions[currentQuestionIndex]}
          </h2>
        </div>

        <VideoRecorder 
          onVideoUploaded={handleVideoUploaded}
          onRecordingComplete={() => {}}
          onBack={() => handlePreviousQuestion()}
          showBackButton={currentQuestionIndex > 0}
        />

        <motion.button
          className="submit-btn"
          onClick={submitAnswer}
          disabled={!uploadedVideoPath}
          whileHover={{ scale: uploadedVideoPath ? 1.05 : 1 }}
          whileTap={{ scale: uploadedVideoPath ? 0.95 : 1 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          {currentQuestionIndex < interviewData.questions.length - 1 ? (
            <>
              Next Question
              <ArrowRight size={20} />
            </>
          ) : (
            <>
              <Trophy size={20} />
              Complete Interview
            </>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const renderCompletionView = () => (
    <motion.div 
      className="completion-view"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div 
        className="completion-header"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <button 
          className="back-btn"
          onClick={() => setCurrentView('start')}
        >
          ← Back to Home
        </button>
        <motion.div 
          className="success-icon"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring" }}
        >
          <Trophy size={80} />
        </motion.div>
        <h2>🎉 Interview Completed!</h2>
        <p>Congratulations! You've successfully completed your AI interview. Your responses have been analyzed and a comprehensive report has been generated.</p>
      </motion.div>

      <motion.div 
        className="interview-id-section"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
      >
        <h3>📋 Your Interview ID</h3>
        <div className="interview-id-display">
          <input 
            type="text" 
            value={interviewData.interview_id} 
            readOnly 
            className="interview-id-input" 
          />
          <motion.button 
            onClick={() => navigator.clipboard.writeText(interviewData.interview_id)}
            className="copy-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            📋 Copy ID
          </motion.button>
        </div>
        <p className="id-instructions">
          <strong>Share this ID with your recruiter</strong> to access your interview report and AI analysis.
        </p>
      </motion.div>

      <motion.div 
        className="summary-preview"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.1 }}
      >
        <h3>📊 Interview Summary</h3>
        <div className="summary-stats">
          <motion.div 
            className="stat-item"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.3 }}
          >
            <span className="stat-number">{interviewData.questions.length}</span>
            <span className="stat-label">Questions Answered</span>
          </motion.div>
          <motion.div 
            className="stat-item"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 1.5 }}
          >
            <span className="stat-number">{interviewData.role_title}</span>
            <span className="stat-label">Position Applied</span>
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="completion-actions"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 1.4 }}
      >
        <motion.button 
          onClick={() => setCurrentView('start')}
          className="primary-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Rocket size={20} />
          Start New Interview
        </motion.button>
        <motion.button 
          onClick={() => setCurrentView('report')}
          className="secondary-btn"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Star size={20} />
          View My Report
        </motion.button>
      </motion.div>
    </motion.div>
  );

  const renderReportView = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <RecruiterReport onBack={() => setCurrentView('start')} />
    </motion.div>
  );

  return (
    <div className="App">
      <ParticleBackground />
      <AnimatePresence mode="wait">
        {currentView === 'start' && renderStartView()}
        {currentView === 'interview' && renderInterviewView()}
        {currentView === 'completion' && renderCompletionView()}
        {currentView === 'report' && renderReportView()}
      </AnimatePresence>
    </div>
  );
};

export default App;
