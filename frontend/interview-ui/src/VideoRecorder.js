import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Video, Play, Pause, Square, CheckCircle, Upload, AlertCircle, Circle, RotateCcw, Loader } from 'lucide-react';
import './VideoRecorder.css';

const VideoRecorder = ({ onVideoUploaded, onRecordingComplete, onBack, showBackButton = false }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoReady, setVideoReady] = useState(false);
  const [stream, setStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  
  const videoRef = useRef(null);
  const chunksRef = useRef([]);
  const previewRef = useRef(null);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('Unable to access camera and microphone');
      console.error('Error accessing media devices:', err);
    }
  };

  const startRecording = () => {
    if (!stream) {
      setError('Camera not available');
      return;
    }

    try {
      chunksRef.current = [];
      setVideoReady(false);
      setError(null);
      setUploadProgress(0);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
        handleRecordingComplete(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      setError('Failed to start recording');
      console.error('Error starting recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleRecordingComplete = async (blob) => {
    setVideoReady(true);
    const filePath = await uploadVideo(blob);
    if (filePath) {
      console.log('Video uploaded successfully:', filePath);
    }
  };

  const uploadVideo = async () => {
    if (chunksRef.current.length === 0) {
      alert('No video recorded yet!');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create a blob from the recorded chunks
      const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
      
      // For deployment, we'll simulate the upload process
      // In a real deployment, you'd upload to a cloud service
      const formData = new FormData();
      formData.append('videoFile', videoBlob, `interview_answer_${Date.now()}.webm`);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Generate a mock file path for demo purposes
      const mockFilePath = `/tmp/interview_answer_${Date.now()}.webm`;
      
      // Call the callback with the file path
      onVideoUploaded(mockFilePath);
      
      // Reset recording state
      chunksRef.current = [];
      setIsUploading(false);
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error uploading video:', error);
      alert('Failed to upload video. Please try again.');
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const retryRecording = () => {
    setError(null);
    setVideoReady(false);
    setUploadProgress(0);
    setRecordedBlob(null);
    if (onVideoUploaded) {
      onVideoUploaded(null);
    }
  };

  return (
    <motion.div 
      className="video-recorder"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showBackButton && onBack && (
        <div className="recorder-back-section">
          <button 
            className="back-btn"
            onClick={onBack}
          >
            ← Previous Question
          </button>
        </div>
      )}
      
      <div className="recorder-container">
        <video
          ref={videoRef}
          autoPlay
          muted
          className="video-preview"
        />
        
        <AnimatePresence>
          {isRecording && (
            <motion.div 
              className="recording-indicator"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="recording-dot"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span>Recording...</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-message"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AlertCircle size={20} />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {uploadProgress > 0 && uploadProgress < 100 && (
            <motion.div 
              className="upload-progress"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Upload size={20} className="upload-icon" />
              <div className="progress-bar">
                <motion.div 
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <span>{Math.round(uploadProgress)}%</span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {videoReady && !isUploading && (
            <motion.div 
              className="video-ready"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
            >
              <CheckCircle size={24} />
              <span>Video recorded and uploaded successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="video-controls">
        <AnimatePresence mode="wait">
          {!isRecording && !videoReady ? (
            <motion.button
              key="start"
              className="record-btn start"
              onClick={startRecording}
              disabled={!stream}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Mic size={24} />
              Start Recording
            </motion.button>
          ) : isRecording ? (
            <motion.button
              key="stop"
              className="record-btn stop"
              onClick={stopRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Square size={24} />
              Stop Recording
            </motion.button>
          ) : (
            <motion.button
              key="retry"
              className="record-btn retry"
              onClick={retryRecording}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <Video size={24} />
              Record Again
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {recordedBlob && (
        <motion.div 
          className="recorded-video"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h4>Your Recorded Answer</h4>
          <video
            src={URL.createObjectURL(recordedBlob)}
            controls
            className="playback-video"
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default VideoRecorder;
