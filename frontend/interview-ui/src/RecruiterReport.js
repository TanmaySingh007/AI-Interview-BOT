import React, { useState } from 'react';
import './RecruiterReport.css';

const RecruiterReport = ({ onBack }) => {
  const [interviewId, setInterviewId] = useState('');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchReport = async () => {
    if (!interviewId.trim()) {
      setError('Please enter an interview ID');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`http://localhost:5000/api/get-report/${interviewId}`);
      
      if (!response.ok) {
        throw new Error('Interview not found');
      }

      const data = await response.json();
      setReport(data);
      
      // Check if AI processing is still ongoing
      if (data.ai_processing_complete === false) {
        setProcessingStatus('AI processing in progress...');
        setAutoRefresh(true);
      } else {
        setProcessingStatus(null);
        setAutoRefresh(false);
      }
    } catch (err) {
      setError(err.message);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh when AI processing is ongoing
  React.useEffect(() => {
    let interval;
    if (autoRefresh && interviewId) {
      interval = setInterval(() => {
        fetchReport();
      }, 3000); // Check every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, interviewId]);

  const formatPercentage = (percentage) => {
    return Math.round(percentage);
  };

  return (
    <div className="recruiter-report">
      <div className="report-header">
        <button 
          className="back-btn"
          onClick={onBack}
        >
          ← Back to Home
        </button>
        <h2>Interview Report Viewer</h2>
      </div>
      
      <div className="report-fetch-section">
        <div className="input-group">
          <input
            type="text"
            value={interviewId}
            onChange={(e) => setInterviewId(e.target.value)}
            placeholder="Enter Interview ID"
            className="interview-id-input"
          />
          <button 
            onClick={fetchReport}
            disabled={loading}
            className="fetch-btn"
          >
            {loading ? 'Loading...' : 'Fetch Report'}
          </button>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {processingStatus && (
          <div className="processing-status">
            <div className="processing-spinner"></div>
            <span>{processingStatus}</span>
          </div>
        )}
      </div>

      {report && (
        <div className="report-content">
          <div className="report-header">
            <h3>Interview Report</h3>
            <div className="completion-status">
              <span className="status-label">Completion:</span>
              <span className="status-value">
                {report.completion_status.completed} of {report.completion_status.total} questions 
                ({formatPercentage(report.completion_status.percentage)}%)
              </span>
            </div>
          </div>

          <div className="interview-info">
            <div className="info-item">
              <strong>Role:</strong> {report.interview_data.role_title}
            </div>
            <div className="info-item">
              <strong>Interview ID:</strong> {report.interview_data.interview_id}
            </div>
            <div className="info-item">
              <strong>Candidate ID:</strong> {report.interview_data.candidate_id}
            </div>
          </div>

          <div className="greeting-section">
            <h4>AI Greeting</h4>
            <p className="greeting-text">{report.interview_data.greeting_text}</p>
          </div>

          <div className="questions-section">
            <h4>Interview Questions & Answers</h4>
            {report.interview_data.questions.map((question, index) => (
              <div key={index} className="question-item">
                <div className="question-header">
                  <h5>Question {index + 1}</h5>
                  {question.video_path && (
                    <span className="status-badge completed">Completed</span>
                  )}
                </div>
                
                <p className="question-text">{question.question_text}</p>
                
                {question.video_path ? (
                  <div className="answer-details">
                    <div className="video-section">
                      <h6>Recorded Answer:</h6>
                      <video 
                        controls 
                        className="answer-video"
                        src={`http://localhost:5000/${question.video_path}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    
                    <div className="ai-analysis">
                      <div className="analysis-item">
                        <h6>Transcription:</h6>
                        <p>{question.transcription}</p>
                      </div>
                      
                      <div className="analysis-item">
                        <h6>Summary:</h6>
                        <p>{question.summary}</p>
                      </div>
                      
                      <div className="analysis-item">
                        <h6>Evaluation:</h6>
                        {typeof question.evaluation === 'object' ? (
                          <div className="evaluation-details">
                            {question.evaluation.overall_assessment && (
                              <div className="eval-item">
                                <strong>Assessment:</strong> {question.evaluation.overall_assessment}
                              </div>
                            )}
                            {question.evaluation.skills_demonstrated && (
                              <div className="eval-item">
                                <strong>Skills:</strong> {question.evaluation.skills_demonstrated.join(', ')}
                              </div>
                            )}
                            {question.evaluation.strengths && (
                              <div className="eval-item">
                                <strong>Strengths:</strong> {question.evaluation.strengths.join(', ')}
                              </div>
                            )}
                            {question.evaluation.weaknesses && (
                              <div className="eval-item">
                                <strong>Areas for Improvement:</strong> {question.evaluation.weaknesses.join(', ')}
                              </div>
                            )}
                            {question.evaluation.justification && (
                              <div className="eval-item">
                                <strong>Justification:</strong> {question.evaluation.justification}
                              </div>
                            )}
                          </div>
                        ) : (
                          <p>{question.evaluation}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="no-answer">
                    <p>No answer recorded for this question.</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {report.interview_data.overall_evaluation && (
            <div className="overall-evaluation">
              <h4>Overall Evaluation</h4>
              {typeof report.interview_data.overall_evaluation === 'object' ? (
                <div className="evaluation-details">
                  <div className="evaluation-item">
                    <h5>Overall Assessment</h5>
                    <p className="assessment">{report.interview_data.overall_evaluation.overall_assessment}</p>
                  </div>
                  
                  {report.interview_data.overall_evaluation.key_insights && (
                    <div className="evaluation-item">
                      <h5>Key Insights</h5>
                      <ul>
                        {report.interview_data.overall_evaluation.key_insights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.interview_data.overall_evaluation.recommendations && (
                    <div className="evaluation-item">
                      <h5>Recommendations</h5>
                      <ul>
                        {report.interview_data.overall_evaluation.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.interview_data.overall_evaluation.strengths && (
                    <div className="evaluation-item">
                      <h5>Strengths</h5>
                      <ul>
                        {report.interview_data.overall_evaluation.strengths.map((strength, index) => (
                          <li key={index}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.interview_data.overall_evaluation.areas_for_improvement && (
                    <div className="evaluation-item">
                      <h5>Areas for Improvement</h5>
                      <ul>
                        {report.interview_data.overall_evaluation.areas_for_improvement.map((area, index) => (
                          <li key={index}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {report.interview_data.overall_evaluation.final_recommendation && (
                    <div className="evaluation-item">
                      <h5>Final Recommendation</h5>
                      <p className="final-recommendation">{report.interview_data.overall_evaluation.final_recommendation}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p>{report.interview_data.overall_evaluation}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecruiterReport;
