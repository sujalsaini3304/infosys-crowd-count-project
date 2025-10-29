import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import useStore from "../store";
import { Link, useNavigate } from "react-router-dom";
import DeleteModal from "../components/DeleteModal";
import LogoutModal from "../components/LogoutModal";

const Dashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { username, server, set_username, set_user_email, user_email } =
    useStore();
  const navigate = useNavigate();
  const [currentFile, setCurrentFile] = useState(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: "", type: "" });
  const [progress, setProgress] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [stats, setStats] = useState({
    totalDetected: 0,
    confidence: 0,
    processingTime: "0.0",
    density: "-",
  });

  useEffect(() => {
    if (
      localStorage.getItem("username") &&
      localStorage.getItem("user_email") &&
      localStorage.getItem("isLogin") === "true"
    ) {
      set_username(localStorage.getItem("username"));
      set_user_email(localStorage.getItem("user_email"));
    } else {
      if (!username && !user_email) {
        navigate("/login", { replace: true });
      }
    }
  }, [username, user_email, navigate, set_username, set_user_email]);

  const [detailedDetections, setDetailedDetections] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const API_URL = `${server}/upload`;
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const formatBytes = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  }, []);

  const showAlert = useCallback((message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
  }, []);

  const handleFile = useCallback(
    (file) => {
      if (!file) return;

      if (file.size > MAX_FILE_SIZE) {
        showAlert("File size exceeds 100MB limit", "error");
        return;
      }

      const fileType = file.type;

      if (fileType.startsWith("image/")) {
        setIsVideo(false);
        setCurrentFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
        showAlert("Image uploaded successfully. Ready for analysis.", "info");
      } else if (fileType.startsWith("video/")) {
        setIsVideo(true);
        setCurrentFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
        showAlert("Video uploaded successfully. Ready for analysis.", "info");
      } else {
        showAlert(
          "Invalid file format. Please upload an image or video.",
          "error"
        );
      }
    },
    [showAlert]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
      }
    },
    [handleFile]
  );

  const handleFileInputChange = useCallback(
    (e) => {
      if (e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    },
    [handleFile]
  );

  const animateProgress = useCallback(() => {
    setProgress(0);
    let currentProgress = 0;

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      currentProgress += 2;
      setProgress(Math.min(currentProgress, 100));
      if (currentProgress >= 100) {
        clearInterval(progressIntervalRef.current);
      }
    }, 50);
  }, []);

  const calculateDensity = useCallback((count) => {
    if (count <= 30) return "Low";
    if (count <= 60) return "Medium";
    return "High";
  }, []);

  const updateStats = useCallback(
    (count, time, detections = [], avgConfidence = 0) => {
      const density = calculateDensity(count);

      setStats({
        totalDetected: count,
        confidence: avgConfidence,
        processingTime: time,
        density: density,
      });

      setShowResults(true);
    },
    [calculateDensity]
  );

  const parseDetectionHeader = useCallback((headerValue) => {
    if (!headerValue || headerValue === "No detection") {
      return { detections: [], totalCount: 0, avgConfidence: 0 };
    }

    try {
      // Parse JSON array from backend
      const detectionsArray = JSON.parse(headerValue);

      if (!Array.isArray(detectionsArray) || detectionsArray.length === 0) {
        return { detections: [], totalCount: 0, avgConfidence: 0 };
      }

      // Map to standardized format
      const detections = detectionsArray.map((item) => ({
        object: item.object || "Unknown",
        count: item.count || 0,
        confidence: item.avg_confidence || 0,
      }));

      // Calculate total count
      const totalCount = detections.reduce((sum, det) => sum + det.count, 0);

      // Calculate weighted average confidence
      const totalWeightedConfidence = detections.reduce(
        (sum, det) => sum + det.confidence * det.count,
        0
      );
      const avgConfidence =
        totalCount > 0 ? (totalWeightedConfidence / totalCount).toFixed(1) : 0;

      return { detections, totalCount, avgConfidence };
    } catch (error) {
      console.error("Error parsing detection header:", error);
      return { detections: [], totalCount: 0, avgConfidence: 0 };
    }
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!currentFile) return;

    const startTime = Date.now();
    setIsProcessing(true);
    setShowResults(false);
    animateProgress();

    try {
      const formData = new FormData();
      formData.append("file", currentFile);

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      // Get detection summary from response headers
      const detectionSummary =
        response.headers.get("x-detection-summary") ||
        response.headers.get("x-detection-results") ||
        "No detection";

      console.log(detectionSummary);
      console.log("Response headers:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });

      // Parse detection data
      const { detections, totalCount, avgConfidence } =
        parseDetectionHeader(detectionSummary);

      console.log("Parsed detections:", detections);
      console.log("Total count:", totalCount);
      console.log("Average confidence:", avgConfidence);

      // Get the processed image/video blob
      const blob = await response.blob();
      console.log("Received blob:", {
        type: blob.type,
        size: blob.size,
        isVideo: isVideo,
      });

      // If blob doesn't have a type, set it based on file type
      let finalBlob = blob;
      if (!blob.type || blob.type === "application/octet-stream") {
        const mimeType = isVideo ? "video/mp4" : "image/png";
        finalBlob = new Blob([blob], { type: mimeType });
        console.log("Created new blob with type:", mimeType);
      }

      const objectUrl = URL.createObjectURL(finalBlob);
      console.log("Created object URL:", objectUrl);

      // Clean up previous object URL to prevent memory leaks
      if (processedImageUrl) {
        URL.revokeObjectURL(processedImageUrl);
      }

      setProcessedImageUrl(objectUrl);

      // Update stats with parsed data
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
      updateStats(totalCount, processingTime, detections, avgConfidence);
      setDetailedDetections(detections);

      // Create summary message
      const summaryMessage =
        detections.length > 0
          ? `Detected ${totalCount} objects: ${detections
              .map((d) => `${d.count} ${d.object}`)
              .join(", ")}`
          : "No objects detected";

      showAlert(summaryMessage, "success");
    } catch (err) {
      console.error("Analysis error:", err);
      showAlert("Error: " + err.message, "error");
    } finally {
      setIsProcessing(false);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [
    currentFile,
    animateProgress,
    parseDetectionHeader,
    updateStats,
    showAlert,
    processedImageUrl,
  ]);

  const handleClear = useCallback(() => {
    // Clean up object URLs
    if (processedImageUrl) {
      URL.revokeObjectURL(processedImageUrl);
    }
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setCurrentFile(null);
    setIsVideo(false);
    setProcessedImageUrl(null);
    setPreviewUrl(null);
    setShowResults(false);
    setProgress(0);
    setAlert({ show: false, message: "", type: "" });
    setDetailedDetections([]);
    setStats({
      totalDetected: 0,
      confidence: 0,
      processingTime: "0.0",
      density: "-",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  }, [processedImageUrl, previewUrl]);

  const handleRemoveFile = useCallback(() => {
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }

    setCurrentFile(null);
    setPreviewUrl(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [previewUrl]);

  const handleDownload = useCallback(() => {
    if (processedImageUrl) {
      const link = document.createElement("a");
      link.download =
        "crowd-analysis-" + Date.now() + (isVideo ? ".mp4" : ".png");
      link.href = processedImageUrl;
      link.click();
      showAlert("File downloaded successfully!", "success");
    } else {
      showAlert("No processed file available to download", "error");
    }
  }, [processedImageUrl, isVideo, showAlert]);

  // Memoized upload zone class
  const uploadZoneClass = useMemo(() => {
    const base =
      "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all";
    if (isDragging) return `${base} border-blue-600 bg-blue-50`;
    if (currentFile) return `${base} border-green-600 bg-green-50`;
    return `${base} border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-gray-100`;
  }, [isDragging, currentFile]);

  // Memoized alert class
  const alertClass = useMemo(() => {
    const base = "mt-5 px-4 py-3.5 rounded-lg text-sm";
    if (alert.type === "error")
      return `${base} bg-red-50 text-red-900 border border-red-200`;
    if (alert.type === "success")
      return `${base} bg-green-50 text-green-900 border border-green-200`;
    return `${base} bg-blue-50 text-blue-900 border border-blue-200`;
  }, [alert.type]);

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50">
        {/* Logo + Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-base">
            CA
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">
            Crowd Analytics
          </span>
        </div>

        {/* Desktop Buttons */}
        <div className="hidden md:flex gap-4 items-center">
          <button className="cursor-pointer px-5 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 text-slate-600 transition-all">
            Documentation
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="cursor-pointer w-full px-4 py-2 bg-transparent border border-red-400 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            Delete Account
          </button>
          <button
            // onClick={() => {
            //   set_username(null);
            //   navigate("/login", { replace: true });
            // }}
            onClick={() => setIsLogoutModalOpen(true)}
            className="cursor-pointer px-5 py-2 bg-blue-600 text-white border border-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Logout
          </button>
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden">
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <svg
              className="w-6 h-6 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Menu (visible when toggled) */}
      {menuOpen && (
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3 shadow-sm sticky top-16 z-50">
          <button className="cursor-pointer w-full px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
            Documentation
          </button>
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="cursor-pointer w-full px-4 py-2 bg-transparent border border-red-400 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            Delete Account
          </button>
          <button
            // onClick={() => {
            //   set_username(null);
            //   navigate("/login", { replace: true });
            // }}
            onClick={() => setIsLogoutModalOpen(true)}
            className="cursor-pointer w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Logout
          </button>
        </div>
      )}

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
      />

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-6 md:py-8">
        {/* Page Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            {`HELLO 👋 ! ${username}`}
          </h1>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            YOLO Detection Dashboard
          </h1>
          <p className="text-sm md:text-base text-slate-600">
            Upload and analyze images or videos for object detection
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Total Detected
              </span>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                👥
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 leading-none">
              {stats.totalDetected}
            </div>
            <div className="text-xs text-green-600 mt-2">Ready to analyze</div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Confidence
              </span>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                🎯
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 leading-none">
              {stats.confidence}%
            </div>
            <div className="text-xs text-green-600 mt-2">Average accuracy</div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Processing Time
              </span>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                ⚡
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 leading-none">
              {stats.processingTime}s
            </div>
            <div className="text-xs text-green-600 mt-2">Last analysis</div>
          </div>

          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                Density
              </span>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                📊
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 leading-none">
              {stats.density}
            </div>
            <div className="text-xs text-green-600 mt-2">
              Crowd density level
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 md:gap-6">
          {/* Upload Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-slate-900">
                Upload Media
              </h2>
            </div>
            <div className="p-5 md:p-6">
              <div
                className={uploadZoneClass}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-5">
                  <span className="text-2xl md:text-3xl">📁</span>
                </div>
                <div className="text-base font-semibold text-slate-900 mb-2">
                  Select or drop file
                </div>
                <div className="text-sm text-slate-600 mb-4">
                  Click to browse or drag and drop
                </div>
                <div className="text-xs text-slate-500">
                  Supported: JPG, PNG, MP4, WebM
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileInputChange}
                accept="image/*,video/*"
                className="hidden"
              />

              {currentFile && (
                <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-900 truncate">
                      {currentFile.name}
                    </div>
                    <div className="text-xs text-slate-600">
                      {formatBytes(currentFile.size)}
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="px-3 py-1.5 bg-red-50 text-red-900 rounded text-xs font-medium hover:bg-red-100 transition-all"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAnalyze}
                  disabled={!currentFile || isProcessing}
                  className="cursor-pointer w-full px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                >
                  {isProcessing ? "Analyzing..." : "Analyze Media"}
                </button>
                <button
                  onClick={handleClear}
                  className="w-full px-5 py-3 bg-white text-slate-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  Clear All
                </button>
              </div>

              {alert.show && <div className={alertClass}>{alert.message}</div>}

              {isProcessing && (
                <div className="mt-6 p-8 text-center">
                  <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-5"></div>
                  <div className="text-base font-medium text-slate-900 mb-2">
                    Processing with YOLO Model
                  </div>
                  <div className="text-sm text-slate-600 mb-5">
                    Detecting objects and analyzing crowd metrics
                  </div>
                  <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {showResults && (
                <div className="mt-6">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">
                        Total Objects
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {stats.totalDetected}
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">
                        Avg Confidence
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {stats.confidence}%
                      </span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
                      <span className="text-sm text-slate-600 font-medium">
                        Density
                      </span>
                      <span className="text-lg font-semibold text-slate-900">
                        {stats.density}
                      </span>
                    </div>
                  </div>

                  {detailedDetections.length > 0 && (
                    <div className="mt-4">
                      <div className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                        Detection Breakdown
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {detailedDetections.map((detection, index) => (
                          <div
                            key={index}
                            className="p-3 bg-white border border-gray-200 rounded-lg"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-sm font-medium text-slate-900 capitalize">
                                {detection.object}
                              </span>
                              <span className="text-sm font-semibold text-blue-600">
                                {detection.count}x
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 rounded-full"
                                  style={{ width: `${detection.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-slate-600">
                                {detection.confidence.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wide">
                  System Information
                </div>
                <ul className="space-y-2">
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    Model: YOLOv8n Object Detection
                  </li>
                  {/* <li className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    Resolution: Up to 4K supported
                  </li> */}
                  {/* <li className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    Max file size: 100MB
                  </li> */}
                  <li className="text-xs text-slate-600 flex items-center gap-2">
                    <span className="text-blue-600 font-bold">•</span>
                    Processing: Server-side analysis
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-slate-900">
                Detection Preview
              </h2>
            </div>
            <div className="p-5 md:p-6">
              <div className="bg-black rounded-lg min-h-[400px] md:min-h-[600px] flex items-center justify-center relative overflow-hidden">
                {processedImageUrl ? (
                  isVideo ? (
                    <video
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="max-w-full max-h-[650px] block mx-auto"
                      src={processedImageUrl}
                      onError={(e) => {
                        console.error("Video error:", e);
                        console.error("Video error details:", e.target.error);
                      }}
                      onLoadedMetadata={(e) => {
                        console.log("Video loaded:", {
                          duration: e.target.duration,
                          videoWidth: e.target.videoWidth,
                          videoHeight: e.target.videoHeight,
                        });
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={processedImageUrl}
                      alt="Processed Result"
                      className="max-w-full max-h-[650px] block mx-auto"
                      onError={(e) => console.error("Image error:", e)}
                    />
                  )
                ) : previewUrl && !isProcessing ? (
                  isVideo ? (
                    <video
                      controls
                      // muted
                      playsInline
                      className="max-w-full max-h-[650px] block mx-auto"
                      src={previewUrl}
                      onError={(e) => console.error("Preview video error:", e)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Upload Preview"
                      className="max-w-full max-h-[650px] block mx-auto"
                      onError={(e) => console.error("Preview image error:", e)}
                    />
                  )
                ) : (
                  <div className="text-center text-slate-600 p-10">
                    <div className="text-6xl mb-4 opacity-30">🖼️</div>
                    <div className="text-base">
                      Processed media will be displayed here
                    </div>
                  </div>
                )}
              </div>

              {processedImageUrl && (
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
                  >
                    Download Result
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
