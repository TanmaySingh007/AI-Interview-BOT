import React, { useState, useEffect } from 'react';
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
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/get-report/${interviewId}`);
      
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
  useEffect(() => {
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

  const renderQuestionReport = (question, index) => {
    if (!question) return null;

    const evaluation = question.evaluation || {};
    const transcription = question.transcription || 'No transcription available';
    const summary = question.summary || 'No summary available';

    return (
      <div key={index} className="question-report">
        <h4>Question {index + 1}: {question.question_text || 'Unknown question'}</h4>
        
        <div className="question-details">
          <div className="detail-section">
            <h5>Video Transcription:</h5>
            <p>{transcription}</p>
          </div>
          
          <div className="detail-section">
            <h5>AI Summary:</h5>
            <p>{summary}</p>
          </div>
          
          <div className="detail-section">
            <h5>AI Evaluation:</h5>
            {evaluation && typeof evaluation === 'object' ? (
              <div className="evaluation-details">
                <div className="evaluation-item">
                  <strong>Skills Demonstrated:</strong>
                  <ul>
                    {(evaluation.skills_demonstrated || []).map((skill, i) => (
                      <li key={i}>{skill}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="evaluation-item">
                  <strong>Strengths:</strong>
                  <ul>
                    {(evaluation.strengths || []).map((strength, i) => (
                      <li key={i}>{strength}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="evaluation-item">
                  <strong>Areas for Improvement:</strong>
                  <ul>
                    {(evaluation.weaknesses || []).map((weakness, i) => (
                      <li key={i}>{weakness}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="evaluation-item">
                  <strong>Overall Assessment:</strong>
                  <span className={`assessment-badge ${evaluation.overall_assessment?.toLowerCase() || 'unknown'}`}>
                    {evaluation.overall_assessment || 'Not assessed'}
                  </span>
                </div>
                
                {evaluation.justification && (
                  <div className="evaluation-item">
                    <strong>Justification:</strong>
                    <p>{evaluation.justification}</p>
                  </div>
                )}
              </div>
            ) : (
              <p>Evaluation not available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOverallSummary = () => {
    if (!report.overall_evaluation) {
      return (
        <div className="overall-summary">
          <h3>Overall Summary</h3>
          <p>Overall evaluation is still being generated. Please wait a moment and refresh.</p>
        </div>
      );
    }

    const evaluation = report.overall_evaluation;
    
    return (
      <div className="overall-summary">
        <h3>Overall Interview Summary</h3>
        
        <div className="summary-section">
          <h4>Overall Assessment: {evaluation.overall_assessment}</h4>
          
          <div className="summary-grid">
            <div className="summary-item">
              <h5>Key Insights:</h5>
              <ul>
                {(evaluation.key_insights || []).map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            </div>
            
            <div className="summary-item">
              <h5>Recommendations:</h5>
              <ul>
                {(evaluation.recommendations || []).map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
            
            <div className="summary-item">
              <h5>Strengths:</h5>
              <ul>
                {(evaluation.strengths || []).map((strength, i) => (
                  <li key={i}>{strength}</li>
                ))}
              </ul>
            </div>
            
            <div className="summary-item">
              <h5>Areas for Improvement:</h5>
              <ul>
                {(evaluation.areas_for_improvement || []).map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="final-recommendation">
            <h5>Final Recommendation:</h5>
            <p className="recommendation-text">{evaluation.final_recommendation}</p>
          </div>
        </div>
      </div>
    );
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
          <div className="report-header-info">
            <h3>Interview Report</h3>
            <div className="report-meta">
              <p><strong>Interview ID:</strong> {report.interview_id}</p>
              <p><strong>Role:</strong> {report.role_title}</p>
              <p><strong>Status:</strong> {report.ai_processing_complete ? 'Completed' : 'Processing'}</p>
              <p><strong>Questions:</strong> {report.completed_questions || 0} / {report.total_questions || 0}</p>
            </div>
          </div>

          {report.greeting_text && (
            <div className="greeting-section">
              <h4>Interview Greeting:</h4>
              <p>{report.greeting_text}</p>
            </div>
          )}

          {report.questions && report.questions.length > 0 && (
            <div className="questions-section">
              <h4>Question Responses:</h4>
              {report.questions.map((question, index) => renderQuestionReport(question, index))}
            </div>
          )}

          {renderOverallSummary()}
        </div>
      )}
    </div>
  );
};

export default RecruiterReport;
