// import React, {
//   useState,
//   useRef,
//   useCallback,
//   useMemo,
//   useEffect,
// } from "react";
// import useStore from "../store";
// import { Link, useNavigate } from "react-router-dom";
// import DeleteModal from "../components/DeleteModal";
// import LogoutModal from "../components/LogoutModal";

// const Dashboard = () => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
//   const { username, server, set_username, set_user_email, user_email } =
//     useStore();
//   const navigate = useNavigate();
//   const [currentFile, setCurrentFile] = useState(null);
//   const [isVideo, setIsVideo] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processedImageUrl, setProcessedImageUrl] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [alert, setAlert] = useState({ show: false, message: "", type: "" });
//   const [progress, setProgress] = useState(0);
//   const [showResults, setShowResults] = useState(false);
//   const [stats, setStats] = useState({
//     totalDetected: 0,
//     confidence: 0,
//     processingTime: "0.0",
//     density: "-",
//   });

//   useEffect(() => {
//     if (
//       localStorage.getItem("username") &&
//       localStorage.getItem("user_email") &&
//       localStorage.getItem("isLogin") === "true"
//     ) {
//       set_username(localStorage.getItem("username"));
//       set_user_email(localStorage.getItem("user_email"));
//     } else {
//       if (!username && !user_email) {
//         navigate("/login", { replace: true });
//       }
//     }
//   }, [username, user_email, navigate, set_username, set_user_email]);

//   const [detailedDetections, setDetailedDetections] = useState([]);
//   const [isDragging, setIsDragging] = useState(false);

//   const fileInputRef = useRef(null);
//   const progressIntervalRef = useRef(null);

//   const API_URL = `${server}/upload`;
//   const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

//   const formatBytes = useCallback((bytes) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
//   }, []);

//   const showAlert = useCallback((message, type) => {
//     setAlert({ show: true, message, type });
//     setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
//   }, []);

//   const handleFile = useCallback(
//     (file) => {
//       if (!file) return;

//       if (file.size > MAX_FILE_SIZE) {
//         showAlert("File size exceeds 100MB limit", "error");
//         return;
//       }

//       const fileType = file.type;

//       if (fileType.startsWith("image/")) {
//         setIsVideo(false);
//         setCurrentFile(file);
//         const reader = new FileReader();
//         reader.onload = (e) => setPreviewUrl(e.target.result);
//         reader.readAsDataURL(file);
//         showAlert("Image uploaded successfully. Ready for analysis.", "info");
//       } else if (fileType.startsWith("video/")) {
//         setIsVideo(true);
//         setCurrentFile(file);
//         const reader = new FileReader();
//         reader.onload = (e) => setPreviewUrl(e.target.result);
//         reader.readAsDataURL(file);
//         showAlert("Video uploaded successfully. Ready for analysis.", "info");
//       } else {
//         showAlert(
//           "Invalid file format. Please upload an image or video.",
//           "error"
//         );
//       }
//     },
//     [showAlert]
//   );

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   }, []);

//   const handleDragLeave = useCallback(() => {
//     setIsDragging(false);
//   }, []);

//   const handleDrop = useCallback(
//     (e) => {
//       e.preventDefault();
//       setIsDragging(false);
//       if (e.dataTransfer.files.length > 0) {
//         handleFile(e.dataTransfer.files[0]);
//       }
//     },
//     [handleFile]
//   );

//   const handleFileInputChange = useCallback(
//     (e) => {
//       if (e.target.files.length > 0) {
//         handleFile(e.target.files[0]);
//       }
//     },
//     [handleFile]
//   );

//   const animateProgress = useCallback(() => {
//     setProgress(0);
//     let currentProgress = 0;

//     if (progressIntervalRef.current) {
//       clearInterval(progressIntervalRef.current);
//     }

//     progressIntervalRef.current = setInterval(() => {
//       currentProgress += 2;
//       setProgress(Math.min(currentProgress, 100));
//       if (currentProgress >= 100) {
//         clearInterval(progressIntervalRef.current);
//       }
//     }, 50);
//   }, []);

//   const calculateDensity = useCallback((count) => {
//     if (count <= 30) return "Low";
//     if (count <= 60) return "Medium";
//     return "High";
//   }, []);

//   const updateStats = useCallback(
//     (count, time, detections = [], avgConfidence = 0) => {
//       const density = calculateDensity(count);

//       setStats({
//         totalDetected: count,
//         confidence: avgConfidence,
//         processingTime: time,
//         density: density,
//       });

//       setShowResults(true);
//     },
//     [calculateDensity]
//   );

//   const parseDetectionHeader = useCallback((headerValue) => {
//     if (!headerValue || headerValue === "No detection") {
//       return { detections: [], totalCount: 0, avgConfidence: 0 };
//     }

//     try {
//       // Parse JSON array from backend
//       const detectionsArray = JSON.parse(headerValue);

//       if (!Array.isArray(detectionsArray) || detectionsArray.length === 0) {
//         return { detections: [], totalCount: 0, avgConfidence: 0 };
//       }

//       // Map to standardized format
//       const detections = detectionsArray.map((item) => ({
//         object: item.object || "Unknown",
//         count: item.count || 0,
//         confidence: item.avg_confidence || 0,
//       }));

//       // Calculate total count
//       const totalCount = detections.reduce((sum, det) => sum + det.count, 0);

//       // Calculate weighted average confidence
//       const totalWeightedConfidence = detections.reduce(
//         (sum, det) => sum + det.confidence * det.count,
//         0
//       );
//       const avgConfidence =
//         totalCount > 0 ? (totalWeightedConfidence / totalCount).toFixed(1) : 0;

//       return { detections, totalCount, avgConfidence };
//     } catch (error) {
//       console.error("Error parsing detection header:", error);
//       return { detections: [], totalCount: 0, avgConfidence: 0 };
//     }
//   }, []);

//   const handleAnalyze = useCallback(async () => {
//     if (!currentFile) return;

//     const startTime = Date.now();
//     setIsProcessing(true);
//     setShowResults(false);
//     animateProgress();

//     try {
//       const formData = new FormData();
//       formData.append("file", currentFile);

//       const response = await fetch(API_URL, {
//         method: "POST",
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error(`Server error: ${response.status}`);
//       }

//       // Get detection summary from response headers
//       const detectionSummary =
//         response.headers.get("x-detection-summary") ||
//         response.headers.get("x-detection-results") ||
//         "No detection";

//       console.log(detectionSummary);
//       console.log("Response headers:", {
//         contentType: response.headers.get("content-type"),
//         contentLength: response.headers.get("content-length"),
//       });

//       // Parse detection data
//       const { detections, totalCount, avgConfidence } =
//         parseDetectionHeader(detectionSummary);

//       console.log("Parsed detections:", detections);
//       console.log("Total count:", totalCount);
//       console.log("Average confidence:", avgConfidence);

//       // Get the processed image/video blob
//       const blob = await response.blob();
//       console.log("Received blob:", {
//         type: blob.type,
//         size: blob.size,
//         isVideo: isVideo,
//       });

//       // If blob doesn't have a type, set it based on file type
//       let finalBlob = blob;
//       if (!blob.type || blob.type === "application/octet-stream") {
//         const mimeType = isVideo ? "video/mp4" : "image/png";
//         finalBlob = new Blob([blob], { type: mimeType });
//         console.log("Created new blob with type:", mimeType);
//       }

//       const objectUrl = URL.createObjectURL(finalBlob);
//       console.log("Created object URL:", objectUrl);

//       // Clean up previous object URL to prevent memory leaks
//       if (processedImageUrl) {
//         URL.revokeObjectURL(processedImageUrl);
//       }

//       setProcessedImageUrl(objectUrl);

//       // Update stats with parsed data
//       const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);
//       updateStats(totalCount, processingTime, detections, avgConfidence);
//       setDetailedDetections(detections);

//       // Create summary message
//       const summaryMessage =
//         detections.length > 0
//           ? `Detected ${totalCount} objects: ${detections
//               .map((d) => `${d.count} ${d.object}`)
//               .join(", ")}`
//           : "No objects detected";

//       showAlert(summaryMessage, "success");
//     } catch (err) {
//       console.error("Analysis error:", err);
//       showAlert("Error: " + err.message, "error");
//     } finally {
//       setIsProcessing(false);
//       if (progressIntervalRef.current) {
//         clearInterval(progressIntervalRef.current);
//       }
//     }
//   }, [
//     currentFile,
//     animateProgress,
//     parseDetectionHeader,
//     updateStats,
//     showAlert,
//     processedImageUrl,
//   ]);

//   const handleClear = useCallback(() => {
//     // Clean up object URLs
//     if (processedImageUrl) {
//       URL.revokeObjectURL(processedImageUrl);
//     }
//     if (previewUrl && previewUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(previewUrl);
//     }

//     setCurrentFile(null);
//     setIsVideo(false);
//     setProcessedImageUrl(null);
//     setPreviewUrl(null);
//     setShowResults(false);
//     setProgress(0);
//     setAlert({ show: false, message: "", type: "" });
//     setDetailedDetections([]);
//     setStats({
//       totalDetected: 0,
//       confidence: 0,
//       processingTime: "0.0",
//       density: "-",
//     });

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }

//     if (progressIntervalRef.current) {
//       clearInterval(progressIntervalRef.current);
//     }
//   }, [processedImageUrl, previewUrl]);

//   const handleRemoveFile = useCallback(() => {
//     if (previewUrl && previewUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(previewUrl);
//     }

//     setCurrentFile(null);
//     setPreviewUrl(null);

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   }, [previewUrl]);

//   const handleDownload = useCallback(() => {
//     if (processedImageUrl) {
//       const link = document.createElement("a");
//       link.download =
//         "crowd-analysis-" + Date.now() + (isVideo ? ".mp4" : ".png");
//       link.href = processedImageUrl;
//       link.click();
//       showAlert("File downloaded successfully!", "success");
//     } else {
//       showAlert("No processed file available to download", "error");
//     }
//   }, [processedImageUrl, isVideo, showAlert]);

//   // Memoized upload zone class
//   const uploadZoneClass = useMemo(() => {
//     const base =
//       "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all";
//     if (isDragging) return `${base} border-blue-600 bg-blue-50`;
//     if (currentFile) return `${base} border-green-600 bg-green-50`;
//     return `${base} border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-gray-100`;
//   }, [isDragging, currentFile]);

//   // Memoized alert class
//   const alertClass = useMemo(() => {
//     const base = "mt-5 px-4 py-3.5 rounded-lg text-sm";
//     if (alert.type === "error")
//       return `${base} bg-red-50 text-red-900 border border-red-200`;
//     if (alert.type === "success")
//       return `${base} bg-green-50 text-green-900 border border-green-200`;
//     return `${base} bg-blue-50 text-blue-900 border border-blue-200`;
//   }, [alert.type]);

//   return (
//     <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
//       {/* Top Navigation */}
//       <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50">
//         {/* Logo + Title */}
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-base">
//             CA
//           </div>
//           <span className="text-lg font-semibold text-slate-900 tracking-tight">
//             Crowd Analytics
//           </span>
//         </div>

//         {/* Desktop Buttons */}
//         <div className="hidden md:flex gap-4 items-center">
//           <button className="cursor-pointer px-5 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 text-slate-600 transition-all">
//             Documentation
//           </button>
//           <button
//             onClick={() => setIsDeleteModalOpen(true)}
//             className="cursor-pointer w-full px-4 py-2 bg-transparent border border-red-400 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
//           >
//             Delete Account
//           </button>
//           <button
//             // onClick={() => {
//             //   set_username(null);
//             //   navigate("/login", { replace: true });
//             // }}
//             onClick={() => setIsLogoutModalOpen(true)}
//             className="cursor-pointer px-5 py-2 bg-blue-600 text-white border border-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
//           >
//             Logout
//           </button>
//         </div>

//         {/* Mobile Hamburger */}
//         <div className="md:hidden">
//           <button
//             onClick={() => setMenuOpen((prev) => !prev)}
//             className="p-2 rounded-md hover:bg-gray-100 transition"
//           >
//             <svg
//               className="w-6 h-6 text-gray-700"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           </button>
//         </div>
//       </nav>

//       {/* Mobile Menu (visible when toggled) */}
//       {menuOpen && (
//         <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3 shadow-sm sticky top-16 z-50">
//           <button className="cursor-pointer w-full px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
//             Documentation
//           </button>
//           <button
//             onClick={() => setIsDeleteModalOpen(true)}
//             className="cursor-pointer w-full px-4 py-2 bg-transparent border border-red-400 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
//           >
//             Delete Account
//           </button>
//           <button
//             // onClick={() => {
//             //   set_username(null);
//             //   navigate("/login", { replace: true });
//             // }}
//             onClick={() => setIsLogoutModalOpen(true)}
//             className="cursor-pointer w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
//           >
//             Logout
//           </button>
//         </div>
//       )}

//       <DeleteModal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//       />

//       <LogoutModal
//         isOpen={isLogoutModalOpen}
//         onClose={() => setIsLogoutModalOpen(false)}
//       />

//       <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-6 md:py-8">
//         {/* Page Header */}
//         <div className="mb-6 md:mb-8">
//           <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
//             {`HELLO 👋 ! ${username}`}
//           </h1>
//           <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
//             YOLO Detection Dashboard
//           </h1>
//           <p className="text-sm md:text-base text-slate-600">
//             Upload and analyze images or videos for object detection
//           </p>
//         </div>

//         {/* Stats Overview */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Total Detected
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 👥
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.totalDetected}
//             </div>
//             <div className="text-xs text-green-600 mt-2">Ready to analyze</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Confidence
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 🎯
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.confidence}%
//             </div>
//             <div className="text-xs text-green-600 mt-2">Average accuracy</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Processing Time
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 ⚡
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.processingTime}s
//             </div>
//             <div className="text-xs text-green-600 mt-2">Last analysis</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Density
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 📊
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.density}
//             </div>
//             <div className="text-xs text-green-600 mt-2">
//               Crowd density level
//             </div>
//           </div>
//         </div>

//         {/* Main Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 md:gap-6">
//           {/* Upload Panel */}
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Upload Media
//               </h2>
//             </div>
//             <div className="p-5 md:p-6">
//               <div
//                 className={uploadZoneClass}
//                 onClick={() => fileInputRef.current?.click()}
//                 onDragOver={handleDragOver}
//                 onDragLeave={handleDragLeave}
//                 onDrop={handleDrop}
//               >
//                 <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-5">
//                   <span className="text-2xl md:text-3xl">📁</span>
//                 </div>
//                 <div className="text-base font-semibold text-slate-900 mb-2">
//                   Select or drop file
//                 </div>
//                 <div className="text-sm text-slate-600 mb-4">
//                   Click to browse or drag and drop
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   Supported: JPG, PNG, MP4, WebM
//                 </div>
//               </div>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleFileInputChange}
//                 accept="image/*,video/*"
//                 className="hidden"
//               />

//               {currentFile && (
//                 <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-3">
//                   <span className="text-2xl">📄</span>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-sm font-semibold text-slate-900 truncate">
//                       {currentFile.name}
//                     </div>
//                     <div className="text-xs text-slate-600">
//                       {formatBytes(currentFile.size)}
//                     </div>
//                   </div>
//                   <button
//                     onClick={handleRemoveFile}
//                     className="px-3 py-1.5 bg-red-50 text-red-900 rounded text-xs font-medium hover:bg-red-100 transition-all"
//                   >
//                     Remove
//                   </button>
//                 </div>
//               )}

//               <div className="flex flex-col gap-3 mt-6">
//                 <button
//                   onClick={handleAnalyze}
//                   disabled={!currentFile || isProcessing}
//                   className="cursor-pointer w-full px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
//                 >
//                   {isProcessing ? "Analyzing..." : "Analyze Media"}
//                 </button>
//                 <button
//                   onClick={handleClear}
//                   className="w-full px-5 py-3 bg-white text-slate-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
//                 >
//                   Clear All
//                 </button>
//               </div>

//               {alert.show && <div className={alertClass}>{alert.message}</div>}

//               {isProcessing && (
//                 <div className="mt-6 p-8 text-center">
//                   <div className="w-12 h-12 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-5"></div>
//                   <div className="text-base font-medium text-slate-900 mb-2">
//                     Processing with YOLO Model
//                   </div>
//                   <div className="text-sm text-slate-600 mb-5">
//                     Detecting objects and analyzing crowd metrics
//                   </div>
//                   <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
//                     <div
//                       className="h-full bg-blue-600 transition-all duration-300"
//                       style={{ width: `${progress}%` }}
//                     ></div>
//                   </div>
//                 </div>
//               )}

//               {showResults && (
//                 <div className="mt-6">
//                   <div className="grid grid-cols-1 gap-3">
//                     <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
//                       <span className="text-sm text-slate-600 font-medium">
//                         Total Objects
//                       </span>
//                       <span className="text-lg font-semibold text-slate-900">
//                         {stats.totalDetected}
//                       </span>
//                     </div>
//                     <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
//                       <span className="text-sm text-slate-600 font-medium">
//                         Avg Confidence
//                       </span>
//                       <span className="text-lg font-semibold text-slate-900">
//                         {stats.confidence}%
//                       </span>
//                     </div>
//                     <div className="p-4 bg-gray-50 rounded-lg flex justify-between items-center">
//                       <span className="text-sm text-slate-600 font-medium">
//                         Density
//                       </span>
//                       <span className="text-lg font-semibold text-slate-900">
//                         {stats.density}
//                       </span>
//                     </div>
//                   </div>

//                   {detailedDetections.length > 0 && (
//                     <div className="mt-4">
//                       <div className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">
//                         Detection Breakdown
//                       </div>
//                       <div className="space-y-2 max-h-[300px] overflow-y-auto">
//                         {detailedDetections.map((detection, index) => (
//                           <div
//                             key={index}
//                             className="p-3 bg-white border border-gray-200 rounded-lg"
//                           >
//                             <div className="flex justify-between items-center mb-1">
//                               <span className="text-sm font-medium text-slate-900 capitalize">
//                                 {detection.object}
//                               </span>
//                               <span className="text-sm font-semibold text-blue-600">
//                                 {detection.count}x
//                               </span>
//                             </div>
//                             <div className="flex items-center gap-2">
//                               <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
//                                 <div
//                                   className="h-full bg-blue-600 rounded-full"
//                                   style={{ width: `${detection.confidence}%` }}
//                                 ></div>
//                               </div>
//                               <span className="text-xs text-slate-600">
//                                 {detection.confidence.toFixed(1)}%
//                               </span>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
//                 <div className="text-xs font-semibold text-slate-900 mb-3 uppercase tracking-wide">
//                   System Information
//                 </div>
//                 <ul className="space-y-2">
//                   <li className="text-xs text-slate-600 flex items-center gap-2">
//                     <span className="text-blue-600 font-bold">•</span>
//                     Model: YOLOv8n Object Detection
//                   </li>
//                   {/* <li className="text-xs text-slate-600 flex items-center gap-2">
//                     <span className="text-blue-600 font-bold">•</span>
//                     Resolution: Up to 4K supported
//                   </li> */}
//                   {/* <li className="text-xs text-slate-600 flex items-center gap-2">
//                     <span className="text-blue-600 font-bold">•</span>
//                     Max file size: 100MB
//                   </li> */}
//                   <li className="text-xs text-slate-600 flex items-center gap-2">
//                     <span className="text-blue-600 font-bold">•</span>
//                     Processing: Server-side analysis
//                   </li>
//                 </ul>
//               </div>
//             </div>
//           </div>

//           {/* Preview Panel */}
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Detection Preview
//               </h2>
//             </div>
//             <div className="p-5 md:p-6">
//               <div className="bg-black rounded-lg min-h-[400px] md:min-h-[600px] flex items-center justify-center relative overflow-hidden">
//                 {processedImageUrl ? (
//                   isVideo ? (
//                     <video
//                       controls
//                       autoPlay
//                       muted
//                       loop
//                       playsInline
//                       className="max-w-full max-h-[650px] block mx-auto"
//                       src={processedImageUrl}
//                       onError={(e) => {
//                         console.error("Video error:", e);
//                         console.error("Video error details:", e.target.error);
//                       }}
//                       onLoadedMetadata={(e) => {
//                         console.log("Video loaded:", {
//                           duration: e.target.duration,
//                           videoWidth: e.target.videoWidth,
//                           videoHeight: e.target.videoHeight,
//                         });
//                       }}
//                     >
//                       Your browser does not support the video tag.
//                     </video>
//                   ) : (
//                     <img
//                       src={processedImageUrl}
//                       alt="Processed Result"
//                       className="max-w-full max-h-[650px] block mx-auto"
//                       onError={(e) => console.error("Image error:", e)}
//                     />
//                   )
//                 ) : previewUrl && !isProcessing ? (
//                   isVideo ? (
//                     <video
//                       controls
//                       // muted
//                       playsInline
//                       className="max-w-full max-h-[650px] block mx-auto"
//                       src={previewUrl}
//                       onError={(e) => console.error("Preview video error:", e)}
//                     >
//                       Your browser does not support the video tag.
//                     </video>
//                   ) : (
//                     <img
//                       src={previewUrl}
//                       alt="Upload Preview"
//                       className="max-w-full max-h-[650px] block mx-auto"
//                       onError={(e) => console.error("Preview image error:", e)}
//                     />
//                   )
//                 ) : (
//                   <div className="text-center text-slate-600 p-10">
//                     <div className="text-6xl mb-4 opacity-30">🖼️</div>
//                     <div className="text-base">
//                       Processed media will be displayed here
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {processedImageUrl && (
//                 <div className="flex gap-3 mt-5">
//                   <button
//                     onClick={handleDownload}
//                     className="flex-1 px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all"
//                   >
//                     Download Result
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;

// import React, {
//   useState,
//   useRef,
//   useCallback,
//   useMemo,
//   useEffect,
// } from "react";

// const Dashboard = () => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [username] = useState("User");
//   const [currentFile, setCurrentFile] = useState(null);
//   const [isVideo, setIsVideo] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processedImageUrl, setProcessedImageUrl] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [alert, setAlert] = useState({ show: false, message: "", type: "" });
//   const [progress, setProgress] = useState(0);
//   const [showResults, setShowResults] = useState(false);
//   const [stats, setStats] = useState({
//     totalDetected: 0,
//     confidence: 0,
//     processingTime: "0.0",
//     density: "-",
//   });
//   const [detailedDetections, setDetailedDetections] = useState([]);
//   const [isDragging, setIsDragging] = useState(false);

//   // Zone drawing states
//   const [isDrawingMode, setIsDrawingMode] = useState(false);
//   const [zones, setZones] = useState([]);
//   const [currentRect, setCurrentRect] = useState(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [showZoneForm, setShowZoneForm] = useState(false);
//   const [tempRect, setTempRect] = useState(null);
//   const [zoneForm, setZoneForm] = useState({
//     name: "",
//     color: "#3B82F6",
//     thickness: 3,
//     description: "",
//     alertThreshold: "",
//   });

//   const fileInputRef = useRef(null);
//   const progressIntervalRef = useRef(null);
//   const canvasRef = useRef(null);
//   const videoRef = useRef(null);

//   const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

//   const formatBytes = useCallback((bytes) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
//   }, []);

//   const showAlert = useCallback((message, type) => {
//     setAlert({ show: true, message, type });
//     setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
//   }, []);

//   const handleFile = useCallback(
//     (file) => {
//       if (!file) return;

//       if (file.size > MAX_FILE_SIZE) {
//         showAlert("File size exceeds 100MB limit", "error");
//         return;
//       }

//       const fileType = file.type;

//       if (fileType.startsWith("image/")) {
//         setIsVideo(false);
//         setCurrentFile(file);
//         const reader = new FileReader();
//         reader.onload = (e) => setPreviewUrl(e.target.result);
//         reader.readAsDataURL(file);
//         showAlert("Image uploaded successfully. Ready for analysis.", "info");
//         setZones([]);
//       } else if (fileType.startsWith("video/")) {
//         setIsVideo(true);
//         setCurrentFile(file);
//         const reader = new FileReader();
//         reader.onload = (e) => setPreviewUrl(e.target.result);
//         reader.readAsDataURL(file);
//         showAlert(
//           "Video uploaded successfully. Ready for zone drawing.",
//           "info"
//         );
//         setZones([]);
//       } else {
//         showAlert(
//           "Invalid file format. Please upload an image or video.",
//           "error"
//         );
//       }
//     },
//     [showAlert]
//   );

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   }, []);

//   const handleDragLeave = useCallback(() => {
//     setIsDragging(false);
//   }, []);

//   const handleDrop = useCallback(
//     (e) => {
//       e.preventDefault();
//       setIsDragging(false);
//       if (e.dataTransfer.files.length > 0) {
//         handleFile(e.dataTransfer.files[0]);
//       }
//     },
//     [handleFile]
//   );

//   const handleFileInputChange = useCallback(
//     (e) => {
//       if (e.target.files.length > 0) {
//         handleFile(e.target.files[0]);
//       }
//     },
//     [handleFile]
//   );

//   // Initialize canvas for zone drawing
//   useEffect(() => {
//     if (canvasRef.current && previewUrl && isVideo) {
//       const canvas = canvasRef.current;
//       const video = videoRef.current;

//       if (video) {
//         const updateCanvasSize = () => {
//           const rect = video.getBoundingClientRect();
//           canvas.width = video.videoWidth || rect.width;
//           canvas.height = video.videoHeight || rect.height;
//           canvas.style.width = `${rect.width}px`;
//           canvas.style.height = `${rect.height}px`;
//           drawZones();
//         };

//         video.addEventListener("loadedmetadata", updateCanvasSize);
//         video.addEventListener("resize", updateCanvasSize);

//         return () => {
//           video.removeEventListener("loadedmetadata", updateCanvasSize);
//           video.removeEventListener("resize", updateCanvasSize);
//         };
//       }
//     }
//   }, [previewUrl, isVideo]);

//   // Draw zones on canvas
//   const drawZones = useCallback(() => {
//     if (!canvasRef.current) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Draw all completed zones
//     zones.forEach((zone) => {
//       ctx.strokeStyle = zone.color;
//       ctx.lineWidth = zone.thickness;
//       ctx.fillStyle = zone.color + "20"; // Semi-transparent fill

//       ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
//       ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

//       // Draw zone name
//       // if (zone.name) {
//       //   const centerX = zone.x + zone.width / 2;
//       //   const centerY = zone.y + zone.height / 2;

//       //   ctx.fillStyle = zone.color;
//       //   ctx.font = "bold 16px sans-serif";
//       //   ctx.textAlign = "center";
//       //   ctx.fillText(zone.name, centerX, centerY);
//       // }

//       if (zone.name) {
//         ctx.font = "bold 18px sans-serif";
//         ctx.fillStyle = zone.color; // or "#fff" for white text
//         ctx.textBaseline = "bottom";

//         // Add small padding so the text is slightly above the rectangle
//         const textX = zone.x + 16;
//         const textY = zone.y - 6;

//         ctx.fillText(zone.name, textX, textY);
//       }
//     });

//     // Draw current rectangle being drawn
//     if (currentRect) {
//       ctx.strokeStyle = zoneForm.color;
//       ctx.lineWidth = zoneForm.thickness;
//       ctx.fillStyle = zoneForm.color + "20";

//       ctx.fillRect(
//         currentRect.x,
//         currentRect.y,
//         currentRect.width,
//         currentRect.height
//       );
//       ctx.strokeRect(
//         currentRect.x,
//         currentRect.y,
//         currentRect.width,
//         currentRect.height
//       );
//     }
//   }, [zones, currentRect, zoneForm]);

//   useEffect(() => {
//     drawZones();
//   }, [drawZones]);

//   // Handle mouse down - start drawing rectangle
//   const handleMouseDown = useCallback(
//     (e) => {
//       if (!isDrawingMode || !canvasRef.current) return;

//       const canvas = canvasRef.current;
//       const rect = canvas.getBoundingClientRect();
//       const scaleX = canvas.width / rect.width;
//       const scaleY = canvas.height / rect.height;

//       const x = (e.clientX - rect.left) * scaleX;
//       const y = (e.clientY - rect.top) * scaleY;

//       setCurrentRect({ x, y, width: 0, height: 0 });
//       setIsDrawing(true);
//     },
//     [isDrawingMode]
//   );

//   // Handle mouse move - update rectangle size
//   const handleMouseMove = useCallback(
//     (e) => {
//       if (!isDrawing || !currentRect || !canvasRef.current) return;

//       const canvas = canvasRef.current;
//       const rect = canvas.getBoundingClientRect();
//       const scaleX = canvas.width / rect.width;
//       const scaleY = canvas.height / rect.height;

//       const currentX = (e.clientX - rect.left) * scaleX;
//       const currentY = (e.clientY - rect.top) * scaleY;

//       const width = currentX - currentRect.x;
//       const height = currentY - currentRect.y;

//       setCurrentRect({
//         ...currentRect,
//         width,
//         height,
//       });
//     },
//     [isDrawing, currentRect]
//   );

//   // Handle mouse up - finish drawing rectangle
//   const handleMouseUp = useCallback(() => {
//     if (!isDrawing || !currentRect) return;

//     // Only save if rectangle has meaningful size
//     if (Math.abs(currentRect.width) > 10 && Math.abs(currentRect.height) > 10) {
//       // Normalize rectangle (handle negative width/height)
//       const normalizedRect = {
//         x:
//           currentRect.width < 0
//             ? currentRect.x + currentRect.width
//             : currentRect.x,
//         y:
//           currentRect.height < 0
//             ? currentRect.y + currentRect.height
//             : currentRect.y,
//         width: Math.abs(currentRect.width),
//         height: Math.abs(currentRect.height),
//       };

//       setTempRect(normalizedRect);
//       setShowZoneForm(true);
//     } else {
//       setCurrentRect(null);
//     }

//     setIsDrawing(false);
//   }, [isDrawing, currentRect]);

//   // Save zone with form data
//   const handleSaveZone = useCallback(() => {
//     if (!tempRect || !zoneForm.name) {
//       showAlert("Please enter a zone name", "error");
//       return;
//     }

//     const newZone = {
//       ...tempRect,
//       ...zoneForm,
//       id: Date.now(),
//     };

//     setZones([...zones, newZone]);
//     setCurrentRect(null);
//     setTempRect(null);
//     setShowZoneForm(false);
//     setZoneForm({
//       name: "",
//       color: "#3B82F6",
//       thickness: 3,
//       description: "",
//       alertThreshold: "",
//     });
//     showAlert(`Zone "${newZone.name}" created successfully`, "success");
//   }, [tempRect, zoneForm, zones, showAlert]);

//   // Cancel zone drawing
//   const handleCancelZone = useCallback(() => {
//     setCurrentRect(null);
//     setTempRect(null);
//     setShowZoneForm(false);
//     setIsDrawing(false);
//     drawZones();
//   }, [drawZones]);

//   // Delete zone
//   const handleDeleteZone = useCallback(
//     (index) => {
//       setZones(zones.filter((_, i) => i !== index));
//       showAlert("Zone deleted", "info");
//     },
//     [zones, showAlert]
//   );

//   // Send zones to server
//   const handleAnalyzeWithZones = useCallback(async () => {
//     if (!currentFile) {
//       showAlert("Please upload a file first", "error");
//       return;
//     }

//     if (zones.length === 0) {
//       showAlert("Please draw at least one zone", "error");
//       return;
//     }

//     setIsProcessing(true);
//     setShowResults(false);

//     try {
//       const formData = new FormData();
//       formData.append("file", currentFile);

//       // Prepare zone data with rectangle coordinates
//       const zoneData = zones.map((zone) => {
//         const x1 = Math.round(zone.x);
//         const y1 = Math.round(zone.y);
//         const x2 = Math.round(zone.x + zone.width);
//         const y2 = Math.round(zone.y + zone.height);

//         return {
//           name: zone.name,
//           top_left: { x: x1, y: y1 },
//           bottom_right: { x: x2, y: y2 },
//           color: zone.color,
//           thickness: zone.thickness,
//           description: zone.description,
//           alertThreshold: zone.alertThreshold,
//         };
//       });

//       formData.append("zones", JSON.stringify(zoneData));

//       console.log("Sending zones to server:", zoneData);

//       // Replace with your actual API endpoint
//       // const response = await fetch("YOUR_API_ENDPOINT", {
//       //   method: "POST",
//       //   body: formData,
//       // });

//       // Simulate API call
//       await new Promise((resolve) => setTimeout(resolve, 2000));

//       showAlert("Analysis with zones completed successfully!", "success");
//       setShowResults(true);
//       setStats({
//         totalDetected: 42,
//         confidence: 87.5,
//         processingTime: "2.3",
//         density: "Medium",
//       });
//     } catch (err) {
//       console.error("Analysis error:", err);
//       showAlert("Error: " + err.message, "error");
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [currentFile, zones, showAlert]);

//   const handleClear = useCallback(() => {
//     if (processedImageUrl) {
//       URL.revokeObjectURL(processedImageUrl);
//     }
//     if (previewUrl && previewUrl.startsWith("blob:")) {
//       URL.revokeObjectURL(previewUrl);
//     }

//     setCurrentFile(null);
//     setIsVideo(false);
//     setProcessedImageUrl(null);
//     setPreviewUrl(null);
//     setShowResults(false);
//     setProgress(0);
//     setAlert({ show: false, message: "", type: "" });
//     setDetailedDetections([]);
//     setZones([]);
//     setCurrentRect(null);
//     setIsDrawingMode(false);
//     setShowZoneForm(false);
//     setStats({
//       totalDetected: 0,
//       confidence: 0,
//       processingTime: "0.0",
//       density: "-",
//     });

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   }, [processedImageUrl, previewUrl]);

//   const uploadZoneClass = useMemo(() => {
//     const base =
//       "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all";
//     if (isDragging) return `${base} border-blue-600 bg-blue-50`;
//     if (currentFile) return `${base} border-green-600 bg-green-50`;
//     return `${base} border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-gray-100`;
//   }, [isDragging, currentFile]);

//   const alertClass = useMemo(() => {
//     const base = "mt-5 px-4 py-3.5 rounded-lg text-sm";
//     if (alert.type === "error")
//       return `${base} bg-red-50 text-red-900 border border-red-200`;
//     if (alert.type === "success")
//       return `${base} bg-green-50 text-green-900 border border-green-200`;
//     return `${base} bg-blue-50 text-blue-900 border border-blue-200`;
//   }, [alert.type]);

//   return (
//     <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
//       {/* Top Navigation */}
//       <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50">
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-base">
//             CA
//           </div>
//           <span className="text-lg font-semibold text-slate-900 tracking-tight">
//             Crowd Analytics
//           </span>
//         </div>

//         <div className="hidden md:flex gap-4 items-center">
//           <button className="cursor-pointer px-5 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 text-slate-600 transition-all">
//             Documentation
//           </button>
//           <button className="cursor-pointer px-5 py-2 bg-blue-600 text-white border border-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-all">
//             Logout
//           </button>
//         </div>

//         <div className="md:hidden">
//           <button
//             onClick={() => setMenuOpen((prev) => !prev)}
//             className="p-2 rounded-md hover:bg-gray-100 transition"
//           >
//             <svg
//               className="w-6 h-6 text-gray-700"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           </button>
//         </div>
//       </nav>

//       {menuOpen && (
//         <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3 shadow-sm sticky top-16 z-50">
//           <button className="cursor-pointer w-full px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
//             Documentation
//           </button>
//           <button className="cursor-pointer w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all">
//             Logout
//           </button>
//         </div>
//       )}

//       <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-6 md:py-8">
//         {/* Page Header */}
//         <div className="mb-6 md:mb-8">
//           <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
//             HELLO 👋 ! {username}
//           </h1>
//           <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
//             YOLO Detection Dashboard with Zone Drawing
//           </h1>
//           <p className="text-sm md:text-base text-slate-600">
//             Upload videos, draw rectangular zones, and analyze crowd behavior in
//             specific areas
//           </p>
//         </div>

//         {/* Stats Overview */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Total Detected
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 👥
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.totalDetected}
//             </div>
//             <div className="text-xs text-green-600 mt-2">Ready to analyze</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Zones Created
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 🎯
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {zones.length}
//             </div>
//             <div className="text-xs text-green-600 mt-2">
//               Active monitoring zones
//             </div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Processing Time
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 ⚡
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.processingTime}s
//             </div>
//             <div className="text-xs text-green-600 mt-2">Last analysis</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Density
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 📊
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.density}
//             </div>
//             <div className="text-xs text-green-600 mt-2">
//               Crowd density level
//             </div>
//           </div>
//         </div>

//         {/* Main Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 md:gap-6">
//           {/* Upload Panel */}
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Upload & Configure
//               </h2>
//             </div>
//             <div className="p-5 md:p-6">
//               <div
//                 className={uploadZoneClass}
//                 onClick={() => fileInputRef.current?.click()}
//                 onDragOver={handleDragOver}
//                 onDragLeave={handleDragLeave}
//                 onDrop={handleDrop}
//               >
//                 <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-5">
//                   <span className="text-2xl md:text-3xl">📁</span>
//                 </div>
//                 <div className="text-base font-semibold text-slate-900 mb-2">
//                   Select or drop file
//                 </div>
//                 <div className="text-sm text-slate-600 mb-4">
//                   Click to browse or drag and drop
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   Supported: JPG, PNG, MP4, WebM
//                 </div>
//               </div>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleFileInputChange}
//                 accept="image/*,video/*"
//                 className="hidden"
//               />

//               {currentFile && (
//                 <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-3">
//                   <span className="text-2xl">📄</span>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-sm font-semibold text-slate-900 truncate">
//                       {currentFile.name}
//                     </div>
//                     <div className="text-xs text-slate-600">
//                       {formatBytes(currentFile.size)}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Zone Drawing Controls */}
//               {isVideo && previewUrl && (
//                 <div className="mt-6">
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-sm font-semibold text-slate-900">
//                       Zone Drawing
//                     </h3>
//                     <button
//                       onClick={() => setIsDrawingMode(!isDrawingMode)}
//                       className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
//                         isDrawingMode
//                           ? "bg-green-600 text-white hover:bg-green-700"
//                           : "bg-gray-200 text-slate-700 hover:bg-gray-300"
//                       }`}
//                     >
//                       {isDrawingMode ? "✓ Drawing Active" : "Start Drawing"}
//                     </button>
//                   </div>

//                   {isDrawingMode && (
//                     <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3">
//                       Click and drag on the video to draw rectangular zones.
//                     </div>
//                   )}

//                   {/* Zone List */}
//                   {zones.length > 0 && (
//                     <div className="mt-4">
//                       <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">
//                         Created Zones ({zones.length})
//                       </h4>
//                       <div className="space-y-2 max-h-[200px] overflow-y-auto">
//                         {zones.map((zone, index) => (
//                           <div
//                             key={zone.id}
//                             className="p-3 bg-white border border-gray-200 rounded-lg"
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <div className="flex items-center gap-2">
//                                 <div
//                                   className="w-4 h-4 rounded"
//                                   style={{ backgroundColor: zone.color }}
//                                 />
//                                 <span className="text-sm font-medium text-slate-900">
//                                   {zone.name}
//                                 </span>
//                               </div>
//                               <button
//                                 onClick={() => handleDeleteZone(index)}
//                                 className="text-red-600 hover:text-red-800 text-xs"
//                               >
//                                 Delete
//                               </button>
//                             </div>
//                             {zone.description && (
//                               <p className="text-xs text-slate-600 mt-1">
//                                 {zone.description}
//                               </p>
//                             )}
//                             <div className="text-xs text-slate-500 mt-1">
//                               Position: ({Math.round(zone.x)},{" "}
//                               {Math.round(zone.y)}) | Size:{" "}
//                               {Math.round(zone.width)}×{Math.round(zone.height)}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               <div className="flex flex-col gap-3 mt-6">
//                 <button
//                   onClick={handleAnalyzeWithZones}
//                   disabled={!currentFile || isProcessing || zones.length === 0}
//                   className="cursor-pointer w-full px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
//                 >
//                   {isProcessing
//                     ? "Analyzing..."
//                     : `Analyze with ${zones.length} Zone${
//                         zones.length !== 1 ? "s" : ""
//                       }`}
//                 </button>
//                 <button
//                   onClick={handleClear}
//                   className="w-full px-5 py-3 bg-white text-slate-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
//                 >
//                   Clear All
//                 </button>
//               </div>

//               {alert.show && <div className={alertClass}>{alert.message}</div>}
//             </div>
//           </div>

//           {/* Preview Panel */}
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Video Preview & Zone Drawing
//               </h2>
//             </div>
//             <div className="p-5 md:p-6">
//               <div className="bg-black rounded-lg min-h-[400px] md:min-h-[600px] flex items-center justify-center relative overflow-hidden">
//                 {previewUrl && isVideo ? (
//                   <div className="relative w-full h-full flex items-center justify-center">
//                     <video
//                       ref={videoRef}
//                       controls={!isDrawingMode}
//                       muted
//                       playsInline
//                       className="max-w-full max-h-[650px] block"
//                       src={previewUrl}
//                       style={{ pointerEvents: isDrawingMode ? "none" : "auto" }}
//                     />
//                     <canvas
//                       ref={canvasRef}
//                       onMouseDown={handleMouseDown}
//                       onMouseMove={handleMouseMove}
//                       onMouseUp={handleMouseUp}
//                       onMouseLeave={handleMouseUp}
//                       className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
//                       style={{
//                         cursor: isDrawingMode ? "crosshair" : "default",
//                         pointerEvents: isDrawingMode ? "auto" : "none",
//                       }}
//                     />
//                   </div>
//                 ) : previewUrl && !isVideo ? (
//                   <img
//                     src={previewUrl}
//                     alt="Upload Preview"
//                     className="max-w-full max-h-[650px] block mx-auto"
//                   />
//                 ) : (
//                   <div className="text-center text-slate-600 p-10">
//                     <div className="text-6xl mb-4 opacity-30">🖼️</div>
//                     <div className="text-base">
//                       Upload a video to start drawing zones
//                     </div>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Zone Form Modal */}
//       {showZoneForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
//             <h3 className="text-xl font-semibold text-slate-900 mb-4">
//               Configure Zone
//             </h3>

//             <div className="space-y-4">
//               {/* Zone Name */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Zone Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={zoneForm.name}
//                   onChange={(e) =>
//                     setZoneForm({ ...zoneForm, name: e.target.value })
//                   }
//                   placeholder="e.g., Entry Gate, Exit Area"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                 />
//               </div>

//               {/* Zone Color */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Border Color
//                 </label>
//                 <div className="flex gap-3 items-center">
//                   <input
//                     type="color"
//                     value={zoneForm.color}
//                     onChange={(e) =>
//                       setZoneForm({ ...zoneForm, color: e.target.value })
//                     }
//                     className="w-16 h-10 rounded cursor-pointer"
//                   />
//                   <input
//                     type="text"
//                     value={zoneForm.color}
//                     onChange={(e) =>
//                       setZoneForm({ ...zoneForm, color: e.target.value })
//                     }
//                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Border Thickness */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Border Thickness: {zoneForm.thickness}px
//                 </label>
//                 <input
//                   type="range"
//                   min="1"
//                   max="10"
//                   value={zoneForm.thickness}
//                   onChange={(e) =>
//                     setZoneForm({
//                       ...zoneForm,
//                       thickness: parseInt(e.target.value),
//                     })
//                   }
//                   className="w-full"
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   value={zoneForm.description}
//                   onChange={(e) =>
//                     setZoneForm({ ...zoneForm, description: e.target.value })
//                   }
//                   placeholder="Add notes about this zone..."
//                   rows="3"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
//                 />
//               </div>

//               {/* Alert Threshold */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Alert Threshold (optional)
//                 </label>
//                 <input
//                   type="number"
//                   value={zoneForm.alertThreshold}
//                   onChange={(e) =>
//                     setZoneForm({ ...zoneForm, alertThreshold: e.target.value })
//                   }
//                   placeholder="e.g., 50 (max people allowed)"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                 />
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3 mt-6">
//               <button
//                 onClick={handleCancelZone}
//                 className="flex-1 px-4 py-2 bg-gray-200 text-slate-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveZone}
//                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
//               >
//                 Save Zone
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Dashboard;


// import React, {
//   useState,
//   useRef,
//   useCallback,
//   useMemo,
//   useEffect,
// } from "react";
// import useStore from "../store";
// import { Link, useNavigate } from "react-router-dom";
// import DeleteModal from "../components/DeleteModal";
// import LogoutModal from "../components/LogoutModal";

// const Dashboard = () => {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const [currentFile, setCurrentFile] = useState(null);
//   const [isVideo, setIsVideo] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [processedImageUrl, setProcessedImageUrl] = useState(null);
//   const [previewUrl, setPreviewUrl] = useState(null);
//   const [alert, setAlert] = useState({ show: false, message: "", type: "" });
//   const [progress, setProgress] = useState(0);
//   const [showResults, setShowResults] = useState(false);
//   const [stats, setStats] = useState({
//     totalDetected: 0,
//     confidence: 0,
//     processingTime: "0.0",
//     density: "-",
//   });
//   const [detailedDetections, setDetailedDetections] = useState([]);
//   const [isDragging, setIsDragging] = useState(false);
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
//   const { username, server, set_username, set_user_email, user_email } =
//     useStore();
//   const navigate = useNavigate();

//   useEffect(() => {
//     if (
//       localStorage.getItem("username") &&
//       localStorage.getItem("user_email") &&
//       localStorage.getItem("isLogin") === "true"
//     ) {
//       set_username(localStorage.getItem("username"));
//       set_user_email(localStorage.getItem("user_email"));
//     } else {
//       if (!username && !user_email) {
//         navigate("/login", { replace: true });
//       }
//     }
//   }, [username, user_email, navigate, set_username, set_user_email]);

//   // Zone drawing states
//   const [isDrawingMode, setIsDrawingMode] = useState(false);
//   const [zones, setZones] = useState([]);
//   const [currentRect, setCurrentRect] = useState(null);
//   const [isDrawing, setIsDrawing] = useState(false);
//   const [showZoneForm, setShowZoneForm] = useState(false);
//   const [tempRect, setTempRect] = useState(null);
//   const [zoneForm, setZoneForm] = useState({
//     name: "",
//     color: "#3B82F6",
//     thickness: 3,
//     description: "",
//     alertThreshold: "",
//   });

//   const fileInputRef = useRef(null);
//   const progressIntervalRef = useRef(null);
//   const canvasRef = useRef(null);
//   const videoRef = useRef(null);

//   const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

//   const formatBytes = useCallback((bytes) => {
//     if (bytes === 0) return "0 Bytes";
//     const k = 1024;
//     const sizes = ["Bytes", "KB", "MB", "GB"];
//     const i = Math.floor(Math.log(bytes) / Math.log(k));
//     return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
//   }, []);

//   const showAlert = useCallback((message, type) => {
//     setAlert({ show: true, message, type });
//     setTimeout(() => setAlert({ show: false, message: "", type: "" }), 5000);
//   }, []);

//   const handleFile = useCallback(
//     (file) => {
//       if (!file) return;

//       if (file.size > MAX_FILE_SIZE) {
//         showAlert("File size exceeds 100MB limit", "error");
//         return;
//       }

//       const fileType = file.type;

//       if (fileType.startsWith("image/")) {
//         setIsVideo(false);
//         setCurrentFile(file);
//         const reader = new FileReader();
//         reader.onload = (e) => setPreviewUrl(e.target.result);
//         reader.readAsDataURL(file);
//         showAlert("Image uploaded successfully. Ready for analysis.", "info");
//         setZones([]);
//       } else if (fileType.startsWith("video/")) {
//         setIsVideo(true);
//         setCurrentFile(file);
//         const reader = new FileReader();
//         reader.onload = (e) => setPreviewUrl(e.target.result);
//         reader.readAsDataURL(file);
//         showAlert(
//           "Video uploaded successfully. Ready for zone drawing.",
//           "info"
//         );
//         setZones([]);
//       } else {
//         showAlert(
//           "Invalid file format. Please upload an image or video.",
//           "error"
//         );
//       }
//     },
//     [showAlert]
//   );

//   const handleDragOver = useCallback((e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   }, []);

//   const handleDragLeave = useCallback(() => {
//     setIsDragging(false);
//   }, []);

//   const handleDrop = useCallback(
//     (e) => {
//       e.preventDefault();
//       setIsDragging(false);
//       if (e.dataTransfer.files.length > 0) {
//         handleFile(e.dataTransfer.files[0]);
//       }
//     },
//     [handleFile]
//   );

//   const handleFileInputChange = useCallback(
//     (e) => {
//       if (e.target.files.length > 0) {
//         handleFile(e.target.files[0]);
//       }
//     },
//     [handleFile]
//   );

//   // Initialize canvas for zone drawing
//   useEffect(() => {
//     if (canvasRef.current && previewUrl && isVideo) {
//       const canvas = canvasRef.current;
//       const video = videoRef.current;

//       if (video) {
//         const updateCanvasSize = () => {
//           const rect = video.getBoundingClientRect();
//           // Use video natural size if available, else bounding rect
//           canvas.width = video.videoWidth || rect.width;
//           canvas.height = video.videoHeight || rect.height;
//           canvas.style.width = `${rect.width}px`;
//           canvas.style.height = `${rect.height}px`;
//           drawZones();
//         };

//         video.addEventListener("loadedmetadata", updateCanvasSize);
//         video.addEventListener("resize", updateCanvasSize);

//         // If metadata already loaded, call once
//         setTimeout(updateCanvasSize, 100);

//         return () => {
//           video.removeEventListener("loadedmetadata", updateCanvasSize);
//           video.removeEventListener("resize", updateCanvasSize);
//         };
//       }
//     }
//   }, [previewUrl, isVideo]);

//   // Draw zones on canvas
//   const drawZones = useCallback(() => {
//     if (!canvasRef.current) return;

//     const canvas = canvasRef.current;
//     const ctx = canvas.getContext("2d");
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     // Draw all completed zones
//     zones.forEach((zone) => {
//       ctx.strokeStyle = zone.color;
//       ctx.lineWidth = zone.thickness;
//       // attempt hex8 (e.g., #RRGGBB20) to add alpha; fallback to rgba if needed
//       const fillColor =
//         zone.color.length === 7 ? zone.color + "20" : zone.color;
//       ctx.fillStyle = fillColor;

//       ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
//       ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

//       if (zone.name) {
//         ctx.font = "bold 18px sans-serif";
//         ctx.fillStyle = zone.color;
//         ctx.textBaseline = "bottom";
//         const textX = zone.x + 16;
//         const textY = zone.y - 6;
//         ctx.fillText(zone.name, textX, textY);
//       }
//     });

//     // Draw current rectangle being drawn
//     if (currentRect) {
//       ctx.strokeStyle = zoneForm.color;
//       ctx.lineWidth = zoneForm.thickness;
//       const fillColor =
//         zoneForm.color.length === 7 ? zoneForm.color + "20" : zoneForm.color;
//       ctx.fillStyle = fillColor;

//       ctx.fillRect(
//         currentRect.x,
//         currentRect.y,
//         currentRect.width,
//         currentRect.height
//       );
//       ctx.strokeRect(
//         currentRect.x,
//         currentRect.y,
//         currentRect.width,
//         currentRect.height
//       );
//     }
//   }, [zones, currentRect, zoneForm]);

//   useEffect(() => {
//     drawZones();
//   }, [drawZones]);

//   // Handle mouse down - start drawing rectangle
//   const handleMouseDown = useCallback(
//     (e) => {
//       if (!isDrawingMode || !canvasRef.current) return;

//       const canvas = canvasRef.current;
//       const rect = canvas.getBoundingClientRect();
//       const scaleX = canvas.width / rect.width;
//       const scaleY = canvas.height / rect.height;

//       const x = (e.clientX - rect.left) * scaleX;
//       const y = (e.clientY - rect.top) * scaleY;

//       setCurrentRect({ x, y, width: 0, height: 0 });
//       setIsDrawing(true);
//     },
//     [isDrawingMode]
//   );

//   // Handle mouse move - update rectangle size
//   const handleMouseMove = useCallback(
//     (e) => {
//       if (!isDrawing || !currentRect || !canvasRef.current) return;

//       const canvas = canvasRef.current;
//       const rect = canvas.getBoundingClientRect();
//       const scaleX = canvas.width / rect.width;
//       const scaleY = canvas.height / rect.height;

//       const currentX = (e.clientX - rect.left) * scaleX;
//       const currentY = (e.clientY - rect.top) * scaleY;

//       const width = currentX - currentRect.x;
//       const height = currentY - currentRect.y;

//       setCurrentRect({
//         ...currentRect,
//         width,
//         height,
//       });
//     },
//     [isDrawing, currentRect]
//   );

//   // Handle mouse up - finish drawing rectangle
//   const handleMouseUp = useCallback(() => {
//     if (!isDrawing || !currentRect) return;

//     // Only save if rectangle has meaningful size
//     if (Math.abs(currentRect.width) > 10 && Math.abs(currentRect.height) > 10) {
//       // Normalize rectangle (handle negative width/height)
//       const normalizedRect = {
//         x:
//           currentRect.width < 0
//             ? currentRect.x + currentRect.width
//             : currentRect.x,
//         y:
//           currentRect.height < 0
//             ? currentRect.y + currentRect.height
//             : currentRect.y,
//         width: Math.abs(currentRect.width),
//         height: Math.abs(currentRect.height),
//       };

//       setTempRect(normalizedRect);
//       setShowZoneForm(true);
//     } else {
//       setCurrentRect(null);
//     }

//     setIsDrawing(false);
//   }, [isDrawing, currentRect]);

//   // Save zone with form data
//   const handleSaveZone = useCallback(() => {
//     if (!tempRect || !zoneForm.name) {
//       showAlert("Please enter a zone name", "error");
//       return;
//     }

//     const newZone = {
//       ...tempRect,
//       ...zoneForm,
//       id: Date.now(),
//     };

//     setZones([...zones, newZone]);
//     setCurrentRect(null);
//     setTempRect(null);
//     setShowZoneForm(false);
//     setZoneForm({
//       name: "",
//       color: "#3B82F6",
//       thickness: 3,
//       description: "",
//       alertThreshold: "",
//     });
//     showAlert(`Zone "${newZone.name}" created successfully`, "success");
//   }, [tempRect, zoneForm, zones, showAlert]);

//   // Cancel zone drawing
//   const handleCancelZone = useCallback(() => {
//     setCurrentRect(null);
//     setTempRect(null);
//     setShowZoneForm(false);
//     setIsDrawing(false);
//     drawZones();
//   }, [drawZones]);

//   // Delete zone
//   const handleDeleteZone = useCallback(
//     (index) => {
//       setZones(zones.filter((_, i) => i !== index));
//       showAlert("Zone deleted", "info");
//     },
//     [zones, showAlert]
//   );

//   // ---- NEW: Send zones to server and handle response ----
//   const handleAnalyzeWithZones = useCallback(async () => {
//     if (!currentFile) {
//       showAlert("Please upload a file first", "error");
//       return;
//     }

//     // At least one zone for video processing (you already check before enabling button)
//     if (isVideo && zones.length === 0) {
//       showAlert("Please draw at least one zone for video analysis", "error");
//       return;
//     }

//     setIsProcessing(true);
//     setShowResults(false);
//     setProgress(0);

//     // Revoke previous processed blob URL
//     if (processedImageUrl) {
//       try {
//         URL.revokeObjectURL(processedImageUrl);
//       } catch (e) {}
//       setProcessedImageUrl(null);
//     }

//     try {
//       const formData = new FormData();
//       formData.append("file", currentFile);

//       // Prepare zone data with rectangle coordinates (absolute pixels)
//       const zoneData = zones.map((zone) => {
//         const x1 = Math.round(zone.x);
//         const y1 = Math.round(zone.y);
//         const x2 = Math.round(zone.x + zone.width);
//         const y2 = Math.round(zone.y + zone.height);

//         return {
//           name: zone.name,
//           top_left: { x: x1, y: y1 },
//           bottom_right: { x: x2, y: y2 },
//           color: zone.color,
//           thickness: zone.thickness,
//           description: zone.description,
//           alertThreshold: zone.alertThreshold,
//         };
//       });

//       formData.append("zones", JSON.stringify(zoneData));

//       // Use XMLHttpRequest to get upload progress and blob response
//       const uploadPromise = new Promise((resolve, reject) => {
//         const xhr = new XMLHttpRequest();
//         // Adjust path if your API is on a different base URL
//         xhr.open("POST", "http://localhost:8000/new/upload");

//         xhr.responseType = "blob";

//         xhr.upload.onprogress = (e) => {
//           if (e.lengthComputable) {
//             const percent = Math.round((e.loaded / e.total) * 100);
//             setProgress(percent);
//           }
//         };

//         xhr.onerror = () => {
//           reject(new Error("Network error during upload"));
//         };

//         xhr.onload = () => {
//           if (xhr.status >= 200 && xhr.status < 300) {
//             const blob = xhr.response;
//             const contentType = xhr.getResponseHeader("Content-Type") || "";
//             const summaryHeader = xhr.getResponseHeader("X-Detection-Summary");
//             const zoneSummaryHeader = xhr.getResponseHeader("X-Zone-Summary");
//             const processingTimeHeader = xhr.getResponseHeader("X-Processing-Time");

//             let parsedSummary = [];
//             let parsedZoneSummary = [];
//             let processingTime = "0.0";

//             try {
//               if (summaryHeader) parsedSummary = JSON.parse(summaryHeader);
//               if (processingTimeHeader) processingTime = processingTimeHeader;
//             } catch (err) {
//               // ignore parse errors
//               parsedSummary = [];
//             }

//             try {
//               if (zoneSummaryHeader)
//                 parsedZoneSummary = JSON.parse(zoneSummaryHeader);
//             } catch (err) {
//               parsedZoneSummary = [];
//             }

//             resolve({ blob, contentType, parsedSummary, parsedZoneSummary , processingTime });
//           } else {
//             // try to read text error from blob
//             const blob = xhr.response;
//             if (blob && blob.size) {
//               const reader = new FileReader();
//               reader.onload = () => {
//                 reject(
//                   new Error(
//                     reader.result || `Upload failed with status ${xhr.status}`
//                   )
//                 );
//               };
//               reader.onerror = () =>
//                 reject(new Error(`Upload failed with status ${xhr.status}`));
//               reader.readAsText(blob);
//             } else {
//               reject(new Error(`Upload failed with status ${xhr.status}`));
//             }
//           }
//         };

//         xhr.send(formData);
//       });

//       const { blob, contentType, processingTime , parsedSummary, parsedZoneSummary } =
//         await uploadPromise;

//       // Create object URL to preview annotated output
//       const objectUrl = URL.createObjectURL(blob);
//       setProcessedImageUrl(objectUrl);
//       setShowResults(true);
//       setProgress(100);

//       // Update detection summary & stats
//       setDetailedDetections(parsedSummary || []);

//       // derive totalDetected (prefer person count if available)
//       let total = 0;
//       if (parsedSummary && parsedSummary.length > 0) {
//         // If there's a "person" row, use it, else sum counts
//         const personRow = parsedSummary.find(
//           (r) => r.object?.toLowerCase() === "person"
//         );
//         if (personRow) {
//           total = personRow.count || 0;
//         } else {
//           total = parsedSummary.reduce((acc, r) => acc + (r.count || 0), 0);
//         }
//       }

//       // compute avg confidence if available
//       let avgConf = 0;
//       if (parsedSummary && parsedSummary.length > 0) {
//         const confValues = parsedSummary
//           .map((r) =>
//             r.avg_confidence || r.avg_confidence === 0 ? r.avg_confidence : null
//           )
//           .filter((c) => c !== null);
//         if (confValues.length > 0) {
//           avgConf =
//             Math.round(
//               (confValues.reduce((a, b) => a + b, 0) / confValues.length) * 100
//             ) / 100;
//         }
//       }

//       // If backend sent zone summary, you can compute density or show it
//       let density = "Unknown";
//       if (parsedZoneSummary && parsedZoneSummary.length > 0) {
//         density = parsedZoneSummary
//           .map((z) => `${z.zone_name}: ${z.total_count}`)
//           .join(", ");
//       }

//       setStats((prev) => ({
//         ...prev,
//         totalDetected: total,
//         confidence: avgConf,
//         processingTime: processingTime || "0.0", // backend doesn't currently return time in header; keep previous or update if provided
//         density:
//           parsedZoneSummary && parsedZoneSummary.length > 0
//             ? "See zone summary"
//             : prev.density,
//       }));

//       // Optionally, save zone summary somewhere visible
//       if (parsedZoneSummary && parsedZoneSummary.length > 0) {
//         // for now show as an alert (short)
//         showAlert("Zone summary received from server", "success");
//       }
//     } catch (err) {
//       console.error("Analysis error:", err);
//       showAlert("Error: " + (err.message || "Unknown error"), "error");
//     } finally {
//       setIsProcessing(false);
//     }
//   }, [currentFile, zones, isVideo, processedImageUrl, showAlert]);

//   const handleClear = useCallback(() => {
//     if (processedImageUrl) {
//       try {
//         URL.revokeObjectURL(processedImageUrl);
//       } catch (e) {}
//     }
//     if (previewUrl && previewUrl.startsWith("blob:")) {
//       try {
//         URL.revokeObjectURL(previewUrl);
//       } catch (e) {}
//     }

//     setCurrentFile(null);
//     setIsVideo(false);
//     setProcessedImageUrl(null);
//     setPreviewUrl(null);
//     setShowResults(false);
//     setProgress(0);
//     setAlert({ show: false, message: "", type: "" });
//     setDetailedDetections([]);
//     setZones([]);
//     setCurrentRect(null);
//     setIsDrawingMode(false);
//     setShowZoneForm(false);
//     setStats({
//       totalDetected: 0,
//       confidence: 0,
//       processingTime: "0.0",
//       density: "-",
//     });

//     if (fileInputRef.current) {
//       fileInputRef.current.value = "";
//     }
//   }, [processedImageUrl, previewUrl]);

//   const uploadZoneClass = useMemo(() => {
//     const base =
//       "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all";
//     if (isDragging) return `${base} border-blue-600 bg-blue-50`;
//     if (currentFile) return `${base} border-green-600 bg-green-50`;
//     return `${base} border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-gray-100`;
//   }, [isDragging, currentFile]);

//   const alertClass = useMemo(() => {
//     const base = "mt-5 px-4 py-3.5 rounded-lg text-sm";
//     if (alert.type === "error")
//       return `${base} bg-red-50 text-red-900 border border-red-200`;
//     if (alert.type === "success")
//       return `${base} bg-green-50 text-green-900 border border-green-200`;
//     return `${base} bg-blue-50 text-blue-900 border border-blue-200`;
//   }, [alert.type]);

//   return (
//     <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
//       {/* Top Navigation */}
//       <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50">
//         {/* Logo + Title */}
//         <div className="flex items-center gap-3">
//           <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-base">
//             CA
//           </div>
//           <span className="text-lg font-semibold text-slate-900 tracking-tight">
//             Crowd Analytics
//           </span>
//         </div>

//         {/* Desktop Buttons */}
//         <div className="hidden md:flex gap-4 items-center">
//           <button className="cursor-pointer px-5 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium hover:bg-gray-50 hover:border-gray-300 text-slate-600 transition-all">
//             Documentation
//           </button>
//           <button
//             onClick={() => setIsDeleteModalOpen(true)}
//             className="cursor-pointer w-full px-4 py-2 bg-transparent border border-red-400 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
//           >
//             Delete Account
//           </button>
//           <button
//             // onClick={() => {
//             //   set_username(null);
//             //   navigate("/login", { replace: true });
//             // }}
//             onClick={() => setIsLogoutModalOpen(true)}
//             className="cursor-pointer px-5 py-2 bg-blue-600 text-white border border-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
//           >
//             Logout
//           </button>
//         </div>

//         {/* Mobile Hamburger */}
//         <div className="md:hidden">
//           <button
//             onClick={() => setMenuOpen((prev) => !prev)}
//             className="p-2 rounded-md hover:bg-gray-100 transition"
//           >
//             <svg
//               className="w-6 h-6 text-gray-700"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth={2}
//                 d="M4 6h16M4 12h16M4 18h16"
//               />
//             </svg>
//           </button>
//         </div>
//       </nav>

//       {/* Mobile Menu (visible when toggled) */}
//       {menuOpen && (
//         <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3 shadow-sm sticky top-16 z-50">
//           <button className="cursor-pointer w-full px-4 py-2 bg-transparent border border-gray-200 rounded-md text-sm font-medium text-slate-600 hover:bg-gray-50 transition-all">
//             Documentation
//           </button>
//           <button
//             onClick={() => setIsDeleteModalOpen(true)}
//             className="cursor-pointer w-full px-4 py-2 bg-transparent border border-red-400 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
//           >
//             Delete Account
//           </button>
//           <button
//             // onClick={() => {
//             //   set_username(null);
//             //   navigate("/login", { replace: true });
//             // }}
//             onClick={() => setIsLogoutModalOpen(true)}
//             className="cursor-pointer w-full px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
//           >
//             Logout
//           </button>
//         </div>
//       )}

//       <DeleteModal
//         isOpen={isDeleteModalOpen}
//         onClose={() => setIsDeleteModalOpen(false)}
//       />

//       <LogoutModal
//         isOpen={isLogoutModalOpen}
//         onClose={() => setIsLogoutModalOpen(false)}
//       />

//       <div className="max-w-[1600px] mx-auto px-6 md:px-10 py-6 md:py-8">
//         {/* Page Header */}

//         <div className="mb-6 md:mb-8">
//           <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
//             {`HELLO 👋 ! ${username}`}
//           </h1>
//           <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
//             YOLO Detection Dashboard
//           </h1>
//           <p className="text-sm md:text-base text-slate-600">
//             Upload and analyze images or videos for object detection
//           </p>
//         </div>

//         {/* Stats Overview */}
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Total Detected
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 👥
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.totalDetected}
//             </div>
//             <div className="text-xs text-green-600 mt-2">Ready to analyze</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Zones Created
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 🎯
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {zones.length}
//             </div>
//             <div className="text-xs text-green-600 mt-2">
//               Active monitoring zones
//             </div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Processing Time
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 ⚡
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.processingTime}s
//             </div>
//             <div className="text-xs text-green-600 mt-2">Last analysis</div>
//           </div>

//           <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
//             <div className="flex justify-between items-center mb-3">
//               <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
//                 Density
//               </span>
//               <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
//                 📊
//               </div>
//             </div>
//             <div className="text-3xl font-bold text-slate-900 leading-none">
//               {stats.density}
//             </div>
//             <div className="text-xs text-green-600 mt-2">
//               Crowd density level
//             </div>
//           </div>
//         </div>

//         {/* Main Grid */}
//         <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 md:gap-6">
//           {/* Upload Panel */}
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Upload & Configure
//               </h2>
//             </div>
//             <div className="p-5 md:p-6">
//               <div
//                 className={uploadZoneClass}
//                 onClick={() => fileInputRef.current?.click()}
//                 onDragOver={handleDragOver}
//                 onDragLeave={handleDragLeave}
//                 onDrop={handleDrop}
//               >
//                 <div className="w-14 h-14 md:w-16 md:h-16 bg-indigo-100 rounded-xl flex items-center justify-center mx-auto mb-4 md:mb-5">
//                   <span className="text-2xl md:text-3xl">📁</span>
//                 </div>
//                 <div className="text-base font-semibold text-slate-900 mb-2">
//                   Select or drop file
//                 </div>
//                 <div className="text-sm text-slate-600 mb-4">
//                   Click to browse or drag and drop
//                 </div>
//                 <div className="text-xs text-slate-500">
//                   Supported: JPG, PNG, MP4, WebM
//                 </div>
//               </div>
//               <input
//                 type="file"
//                 ref={fileInputRef}
//                 onChange={handleFileInputChange}
//                 accept="image/*,video/*"
//                 className="hidden"
//               />

//               {currentFile && (
//                 <div className="mt-4 p-3 bg-white border border-gray-200 rounded-lg flex items-center gap-3">
//                   <span className="text-2xl">📄</span>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-sm font-semibold text-slate-900 truncate">
//                       {currentFile.name}
//                     </div>
//                     <div className="text-xs text-slate-600">
//                       {formatBytes(currentFile.size)}
//                     </div>
//                   </div>
//                 </div>
//               )}

//               {/* Zone Drawing Controls */}
//               {isVideo && previewUrl && (
//                 <div className="mt-6">
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-sm font-semibold text-slate-900">
//                       Zone Drawing
//                     </h3>
//                     <button
//                       onClick={() => setIsDrawingMode(!isDrawingMode)}
//                       className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
//                         isDrawingMode
//                           ? "bg-green-600 text-white hover:bg-green-700"
//                           : "bg-gray-200 text-slate-700 hover:bg-gray-300"
//                       }`}
//                     >
//                       {isDrawingMode ? "✓ Drawing Active" : "Start Drawing"}
//                     </button>
//                   </div>

//                   {isDrawingMode && (
//                     <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3">
//                       Click and drag on the video to draw rectangular zones.
//                     </div>
//                   )}

//                   {/* Zone List */}
//                   {zones.length > 0 && (
//                     <div className="mt-4">
//                       <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">
//                         Created Zones ({zones.length})
//                       </h4>
//                       <div className="space-y-2 max-h-[200px] overflow-y-auto">
//                         {zones.map((zone, index) => (
//                           <div
//                             key={zone.id}
//                             className="p-3 bg-white border border-gray-200 rounded-lg"
//                           >
//                             <div className="flex justify-between items-start mb-2">
//                               <div className="flex items-center gap-2">
//                                 <div
//                                   className="w-4 h-4 rounded"
//                                   style={{ backgroundColor: zone.color }}
//                                 />
//                                 <span className="text-sm font-medium text-slate-900">
//                                   {zone.name}
//                                 </span>
//                               </div>
//                               <button
//                                 onClick={() => handleDeleteZone(index)}
//                                 className="text-red-600 hover:text-red-800 text-xs"
//                               >
//                                 Delete
//                               </button>
//                             </div>
//                             {zone.description && (
//                               <p className="text-xs text-slate-600 mt-1">
//                                 {zone.description}
//                               </p>
//                             )}
//                             <div className="text-xs text-slate-500 mt-1">
//                               Position: ({Math.round(zone.x)},{" "}
//                               {Math.round(zone.y)}) | Size:{" "}
//                               {Math.round(zone.width)}×{Math.round(zone.height)}
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}

//               <div className="flex flex-col gap-3 mt-6">
//                 <button
//                   onClick={handleAnalyzeWithZones}
//                   disabled={
//                     !currentFile ||
//                     isProcessing ||
//                     (isVideo && zones.length === 0)
//                   }
//                   className="cursor-pointer w-full px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
//                 >
//                   {isProcessing
//                     ? `Uploading... ${progress}%`
//                     : `Analyze with ${zones.length} Zone${
//                         zones.length !== 1 ? "s" : ""
//                       }`}
//                 </button>
//                 <button
//                   onClick={handleClear}
//                   className="w-full px-5 py-3 bg-white text-slate-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
//                 >
//                   Clear All
//                 </button>
//               </div>

//               {alert.show && <div className={alertClass}>{alert.message}</div>}
//             </div>
//           </div>

//           {/* Preview Panel */}
//           <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
//             <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
//               <h2 className="text-base font-semibold text-slate-900">
//                 Video Preview & Zone Drawing
//               </h2>
//             </div>
//             <div className="p-5 md:p-6">
//               <div className="bg-black rounded-lg min-h-[400px] md:min-h-[600px] flex items-center justify-center relative overflow-hidden">
//                 {previewUrl && isVideo ? (
//                   <div className="relative w-full h-full flex items-center justify-center">
//                     <video
//                       ref={videoRef}
//                       controls={!isDrawingMode}
//                       muted
//                       playsInline
//                       className="max-w-full max-h-[650px] block"
//                       src={previewUrl}
//                       style={{ pointerEvents: isDrawingMode ? "none" : "auto" }}
//                     />
//                     <canvas
//                       ref={canvasRef}
//                       onMouseDown={handleMouseDown}
//                       onMouseMove={handleMouseMove}
//                       onMouseUp={handleMouseUp}
//                       onMouseLeave={handleMouseUp}
//                       className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
//                       style={{
//                         cursor: isDrawingMode ? "crosshair" : "default",
//                         pointerEvents: isDrawingMode ? "auto" : "none",
//                       }}
//                     />
//                   </div>
//                 ) : previewUrl && !isVideo ? (
//                   <img
//                     src={previewUrl}
//                     alt="Upload Preview"
//                     className="max-w-full max-h-[650px] block mx-auto"
//                   />
//                 ) : (
//                   <div className="text-center text-slate-600 p-10">
//                     <div className="text-6xl mb-4 opacity-30">🖼️</div>
//                     <div className="text-base">
//                       Upload a video to start drawing zones
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Processed result preview & download */}
//               {showResults && processedImageUrl && (
//                 <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
//                   <div className="flex items-center justify-between mb-3">
//                     <h3 className="text-sm font-semibold text-slate-900">
//                       Processed Output
//                     </h3>
//                     <div className="flex items-center gap-2">
//                       <a
//                         href={processedImageUrl}
//                         download={
//                           currentFile
//                             ? `annotated_${currentFile.name}`
//                             : "annotated_output"
//                         }
//                         className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
//                       >
//                         Download
//                       </a>
//                       <button
//                         onClick={() => {
//                           // open in new tab
//                           window.open(processedImageUrl, "_blank");
//                         }}
//                         className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
//                       >
//                         Open
//                       </button>
//                     </div>
//                   </div>

//                   <div className="mb-3">
//                     {processedImageUrl &&
//                       (!isVideo ? (
//                         <img
//                           src={processedImageUrl}
//                           alt="Processed"
//                           className="w-full rounded"
//                         />
//                       ) : (
//                         <video
//                           src={processedImageUrl}
//                           controls
//                           className="w-full rounded"
//                         />
//                       ))}
//                   </div>

//                   {!isVideo && (
//                     <div>
//                       <div className="text-xs text-slate-600 mb-2">
//                         Detection summary:
//                       </div>
//                       <div className="grid grid-cols-2 gap-2">
//                         {detailedDetections.length === 0 ? (
//                           <div className="text-xs text-slate-500">
//                             No detailed detections returned
//                           </div>
//                         ) : (
//                           detailedDetections.map((d, idx) => (
//                             <div
//                               key={idx}
//                               className="p-2 border border-gray-100 rounded text-xs bg-gray-50"
//                             >
//                               <div className="font-medium">{d.object}</div>
//                               <div>Count: {d.count}</div>
//                               <div>Avg conf: {d.avg_confidence}</div>
//                             </div>
//                           ))
//                         )}
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Zone Form Modal */}
//       {showZoneForm && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
//           <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
//             <h3 className="text-xl font-semibold text-slate-900 mb-4">
//               Configure Zone
//             </h3>

//             <div className="space-y-4">
//               {/* Zone Name */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Zone Name *
//                 </label>
//                 <input
//                   type="text"
//                   value={zoneForm.name}
//                   onChange={(e) =>
//                     setZoneForm({ ...zoneForm, name: e.target.value })
//                   }
//                   placeholder="e.g., Entry Gate, Exit Area"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                 />
//               </div>

//               {/* Zone Color */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Border Color
//                 </label>
//                 <div className="flex gap-3 items-center">
//                   <input
//                     type="color"
//                     value={zoneForm.color}
//                     onChange={(e) =>
//                       setZoneForm({ ...zoneForm, color: e.target.value })
//                     }
//                     className="w-16 h-10 rounded cursor-pointer"
//                   />
//                   <input
//                     type="text"
//                     value={zoneForm.color}
//                     onChange={(e) =>
//                       setZoneForm({ ...zoneForm, color: e.target.value })
//                     }
//                     className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                   />
//                 </div>
//               </div>

//               {/* Border Thickness */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Border Thickness: {zoneForm.thickness}px
//                 </label>
//                 <input
//                   type="range"
//                   min="1"
//                   max="10"
//                   value={zoneForm.thickness}
//                   onChange={(e) =>
//                     setZoneForm({
//                       ...zoneForm,
//                       thickness: parseInt(e.target.value),
//                     })
//                   }
//                   className="w-full"
//                 />
//               </div>

//               {/* Description */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Description
//                 </label>
//                 <textarea
//                   value={zoneForm.description}
//                   onChange={(e) =>
//                     setZoneForm({ ...zoneForm, description: e.target.value })
//                   }
//                   placeholder="Add notes about this zone..."
//                   rows="3"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
//                 />
//               </div>

//               {/* Alert Threshold */}
//               <div>
//                 <label className="block text-sm font-medium text-slate-700 mb-2">
//                   Alert Threshold (optional)
//                 </label>
//                 <input
//                   type="number"
//                   value={zoneForm.alertThreshold}
//                   onChange={(e) =>
//                     setZoneForm({ ...zoneForm, alertThreshold: e.target.value })
//                   }
//                   placeholder="e.g., 50 (max people allowed)"
//                   className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
//                 />
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex gap-3 mt-6">
//               <button
//                 onClick={handleCancelZone}
//                 className="flex-1 px-4 py-2 bg-gray-200 text-slate-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleSaveZone}
//                 className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
//               >
//                 Save Zone
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
// export default Dashboard;

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
    densityLevel: "-",
  });
  const [detailedDetections, setDetailedDetections] = useState([]);
  const [zoneSummary, setZoneSummary] = useState([]);
  const [zoneDensities, setZoneDensities] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const { username, server, set_username, set_user_email, user_email } =
    useStore();
  const navigate = useNavigate();

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

  // Helper function to determine density level
  const getDensityLevel = useCallback((density) => {
    if (density === null || density === undefined) return "-";

    const numDensity = parseFloat(density);
    if (numDensity < 0.0001) return "Low";
    if (numDensity < 0.001) return "Medium";
    return "High";
  }, []);

  // Helper function to get person count only
  const getPersonCount = useCallback((detectionSummary) => {
    if (!detectionSummary || !Array.isArray(detectionSummary)) return 0;

    const personData = detectionSummary.find(
      (item) => item.object?.toLowerCase() === "person"
    );
    return personData ? personData.count : 0;
  }, []);

  // Helper function to get total object count (for images)
  const getTotalObjectCount = useCallback((detectionSummary) => {
    if (!detectionSummary || !Array.isArray(detectionSummary)) return 0;

    return detectionSummary.reduce(
      (total, item) => total + (item.count || 0),
      0
    );
  }, []);

  // Helper function to get person confidence
  const getPersonConfidence = useCallback((detectionSummary) => {
    if (!detectionSummary || !Array.isArray(detectionSummary)) return 0;

    const personData = detectionSummary.find(
      (item) => item.object?.toLowerCase() === "person"
    );
    return personData ? Math.round(personData.avg_confidence * 100) / 100 : 0;
  }, []);

  // Zone drawing states
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [zones, setZones] = useState([]);
  const [currentRect, setCurrentRect] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showZoneForm, setShowZoneForm] = useState(false);
  const [tempRect, setTempRect] = useState(null);
  const [zoneForm, setZoneForm] = useState({
    name: "",
    color: "#3B82F6",
    thickness: 3,
    description: "",
    alertThreshold: "",
  });

  const fileInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

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
        setZones([]);
      } else if (fileType.startsWith("video/")) {
        setIsVideo(true);
        setCurrentFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setPreviewUrl(e.target.result);
        reader.readAsDataURL(file);
        showAlert(
          "Video uploaded successfully. Ready for zone drawing.",
          "info"
        );
        setZones([]);
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

  // Initialize canvas for zone drawing
  useEffect(() => {
    if (canvasRef.current && previewUrl && isVideo) {
      const canvas = canvasRef.current;
      const video = videoRef.current;

      if (video) {
        const updateCanvasSize = () => {
          const rect = video.getBoundingClientRect();
          canvas.width = video.videoWidth || rect.width;
          canvas.height = video.videoHeight || rect.height;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
          drawZones();
        };

        video.addEventListener("loadedmetadata", updateCanvasSize);
        video.addEventListener("resize", updateCanvasSize);

        setTimeout(updateCanvasSize, 100);

        return () => {
          video.removeEventListener("loadedmetadata", updateCanvasSize);
          video.removeEventListener("resize", updateCanvasSize);
        };
      }
    }
  }, [previewUrl, isVideo]);

  // Draw zones on canvas
  const drawZones = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    zones.forEach((zone) => {
      ctx.strokeStyle = zone.color;
      ctx.lineWidth = zone.thickness;
      const fillColor =
        zone.color.length === 7 ? zone.color + "20" : zone.color;
      ctx.fillStyle = fillColor;

      ctx.fillRect(zone.x, zone.y, zone.width, zone.height);
      ctx.strokeRect(zone.x, zone.y, zone.width, zone.height);

      if (zone.name) {
        ctx.font = "bold 18px sans-serif";
        ctx.fillStyle = zone.color;
        ctx.textBaseline = "bottom";
        const textX = zone.x + 16;
        const textY = zone.y - 6;
        ctx.fillText(zone.name, textX, textY);
      }
    });

    if (currentRect) {
      ctx.strokeStyle = zoneForm.color;
      ctx.lineWidth = zoneForm.thickness;
      const fillColor =
        zoneForm.color.length === 7 ? zoneForm.color + "20" : zoneForm.color;
      ctx.fillStyle = fillColor;

      ctx.fillRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
      ctx.strokeRect(
        currentRect.x,
        currentRect.y,
        currentRect.width,
        currentRect.height
      );
    }
  }, [zones, currentRect, zoneForm]);

  useEffect(() => {
    drawZones();
  }, [drawZones]);

  const handleMouseDown = useCallback(
    (e) => {
      if (!isDrawingMode || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      setCurrentRect({ x, y, width: 0, height: 0 });
      setIsDrawing(true);
    },
    [isDrawingMode]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDrawing || !currentRect || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const currentX = (e.clientX - rect.left) * scaleX;
      const currentY = (e.clientY - rect.top) * scaleY;

      const width = currentX - currentRect.x;
      const height = currentY - currentRect.y;

      setCurrentRect({
        ...currentRect,
        width,
        height,
      });
    },
    [isDrawing, currentRect]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !currentRect) return;

    if (Math.abs(currentRect.width) > 10 && Math.abs(currentRect.height) > 10) {
      const normalizedRect = {
        x:
          currentRect.width < 0
            ? currentRect.x + currentRect.width
            : currentRect.x,
        y:
          currentRect.height < 0
            ? currentRect.y + currentRect.height
            : currentRect.y,
        width: Math.abs(currentRect.width),
        height: Math.abs(currentRect.height),
      };

      setTempRect(normalizedRect);
      setShowZoneForm(true);
    } else {
      setCurrentRect(null);
    }

    setIsDrawing(false);
  }, [isDrawing, currentRect]);

  const handleSaveZone = useCallback(() => {
    if (!tempRect || !zoneForm.name) {
      showAlert("Please enter a zone name", "error");
      return;
    }

    const newZone = {
      ...tempRect,
      ...zoneForm,
      id: Date.now(),
    };

    setZones([...zones, newZone]);
    setCurrentRect(null);
    setTempRect(null);
    setShowZoneForm(false);
    setZoneForm({
      name: "",
      color: "#3B82F6",
      thickness: 3,
      description: "",
      alertThreshold: "",
    });
    showAlert(`Zone "${newZone.name}" created successfully`, "success");
  }, [tempRect, zoneForm, zones, showAlert]);

  const handleCancelZone = useCallback(() => {
    setCurrentRect(null);
    setTempRect(null);
    setShowZoneForm(false);
    setIsDrawing(false);
    drawZones();
  }, [drawZones]);

  const handleDeleteZone = useCallback(
    (index) => {
      setZones(zones.filter((_, i) => i !== index));
      showAlert("Zone deleted", "info");
    },
    [zones, showAlert]
  );

  const handleAnalyzeWithZones = useCallback(async () => {
    if (!currentFile) {
      showAlert("Please upload a file first", "error");
      return;
    }

    if (isVideo && zones.length === 0) {
      showAlert("Please draw at least one zone for video analysis", "error");
      return;
    }

    setIsProcessing(true);
    setShowResults(false);
    setProgress(0);

    if (processedImageUrl) {
      try {
        URL.revokeObjectURL(processedImageUrl);
      } catch (e) {}
      setProcessedImageUrl(null);
    }

    try {
      const formData = new FormData();
      formData.append("file", currentFile);

      const zoneData = zones.map((zone) => {
        const x1 = Math.round(zone.x);
        const y1 = Math.round(zone.y);
        const x2 = Math.round(zone.x + zone.width);
        const y2 = Math.round(zone.y + zone.height);

        return {
          name: zone.name,
          top_left: { x: x1, y: y1 },
          bottom_right: { x: x2, y: y2 },
          color: zone.color,
          thickness: zone.thickness,
          description: zone.description,
          alertThreshold: zone.alertThreshold,
        };
      });

      formData.append("zones", JSON.stringify(zoneData));

      const uploadPromise = new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "http://localhost:8000/new/upload");

        xhr.responseType = "blob";

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            setProgress(percent);
          }
        };

        xhr.onerror = () => {
          reject(new Error("Network error during upload"));
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const blob = xhr.response;
            const contentType = xhr.getResponseHeader("Content-Type") || "";
            const summaryHeader = xhr.getResponseHeader("X-Detection-Summary");
            const zoneSummaryHeader = xhr.getResponseHeader("X-Zone-Summary");
            const processingTimeHeader =
              xhr.getResponseHeader("X-Processing-Time");
            const frameDensityHeader = xhr.getResponseHeader("X-Frame-Density");
            const zoneDensityHeader = xhr.getResponseHeader("X-Zone-Density");

            let parsedSummary = [];
            let parsedZoneSummary = [];
            let parsedZoneDensity = [];
            let processingTime = "0.0";
            let frameDensity = null;

            try {
              if (summaryHeader) parsedSummary = JSON.parse(summaryHeader);
              if (processingTimeHeader) processingTime = processingTimeHeader;
              if (frameDensityHeader)
                frameDensity = parseFloat(frameDensityHeader);
              if (zoneSummaryHeader)
                parsedZoneSummary = JSON.parse(zoneSummaryHeader);
              if (zoneDensityHeader)
                parsedZoneDensity = JSON.parse(zoneDensityHeader);
            } catch (err) {
              console.error("Error parsing headers:", err);
            }

            resolve({
              blob,
              contentType,
              parsedSummary,
              parsedZoneSummary,
              parsedZoneDensity,
              processingTime,
              frameDensity,
            });
          } else {
            const blob = xhr.response;
            if (blob && blob.size) {
              const reader = new FileReader();
              reader.onload = () => {
                reject(
                  new Error(
                    reader.result || `Upload failed with status ${xhr.status}`
                  )
                );
              };
              reader.onerror = () =>
                reject(new Error(`Upload failed with status ${xhr.status}`));
              reader.readAsText(blob);
            } else {
              reject(new Error(`Upload failed with status ${xhr.status}`));
            }
          }
        };

        xhr.send(formData);
      });

      const {
        blob,
        contentType,
        processingTime,
        parsedSummary,
        parsedZoneSummary,
        parsedZoneDensity,
        frameDensity,
      } = await uploadPromise;

      const objectUrl = URL.createObjectURL(blob);
      setProcessedImageUrl(objectUrl);
      setShowResults(true);
      setProgress(100);

      setDetailedDetections(parsedSummary || []);
      setZoneSummary(parsedZoneSummary || []);
      setZoneDensities(parsedZoneDensity || []);

      // Calculate stats correctly
      let totalCount = 0;
      if (isVideo) {
        // For videos, show only person count
        totalCount = getPersonCount(parsedSummary);
      } else {
        // For images, show total object count
        totalCount = getTotalObjectCount(parsedSummary);
      }

      const personConfidence = getPersonConfidence(parsedSummary);

      // Handle density display
      let densityDisplay = "-";
      let densityLevel = "-";

      if (frameDensity !== null && frameDensity !== undefined) {
        densityDisplay = frameDensity.toExponential(3);
        densityLevel = getDensityLevel(frameDensity);
      } else if (parsedZoneDensity && parsedZoneDensity.length > 0) {
        // Use the first zone density if frame density not available
        const zoneDensity = parsedZoneDensity[0]?.zone_density;
        if (zoneDensity !== undefined) {
          densityDisplay = zoneDensity.toExponential(3);
          densityLevel = getDensityLevel(zoneDensity);
        } else {
          densityDisplay = "See zone summary";
        }
      } else if (parsedZoneSummary && parsedZoneSummary.length > 0) {
        densityDisplay = "See zone summary";
      }

      setStats({
        totalDetected: totalCount,
        confidence: personConfidence,
        processingTime: processingTime || "0.0",
        density: densityDisplay,
        densityLevel: densityLevel,
      });

      if (parsedZoneSummary && parsedZoneSummary.length > 0) {
        showAlert("Zone summary received from server", "success");
      } else {
        showAlert("Analysis complete!", "success");
      }
    } catch (err) {
      console.error("Analysis error:", err);
      showAlert("Error: " + (err.message || "Unknown error"), "error");
    } finally {
      setIsProcessing(false);
    }
  }, [
    currentFile,
    zones,
    isVideo,
    processedImageUrl,
    showAlert,
    getPersonCount,
    getTotalObjectCount,
    getPersonConfidence,
    getDensityLevel,
  ]);

  const handleClear = useCallback(() => {
    if (processedImageUrl) {
      try {
        URL.revokeObjectURL(processedImageUrl);
      } catch (e) {}
    }
    if (previewUrl && previewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(previewUrl);
      } catch (e) {}
    }

    setCurrentFile(null);
    setIsVideo(false);
    setProcessedImageUrl(null);
    setPreviewUrl(null);
    setShowResults(false);
    setProgress(0);
    setAlert({ show: false, message: "", type: "" });
    setDetailedDetections([]);
    setZoneSummary([]);
    setZoneDensities([]);
    setZones([]);
    setCurrentRect(null);
    setIsDrawingMode(false);
    setShowZoneForm(false);
    setStats({
      totalDetected: 0,
      confidence: 0,
      processingTime: "0.0",
      density: "-",
      densityLevel: "-",
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [processedImageUrl, previewUrl]);

  const uploadZoneClass = useMemo(() => {
    const base =
      "border-2 border-dashed rounded-xl p-8 md:p-12 text-center cursor-pointer transition-all";
    if (isDragging) return `${base} border-blue-600 bg-blue-50`;
    if (currentFile) return `${base} border-green-600 bg-green-50`;
    return `${base} border-gray-300 bg-gray-50 hover:border-blue-600 hover:bg-gray-100`;
  }, [isDragging, currentFile]);

  const alertClass = useMemo(() => {
    const base = "mt-5 px-4 py-3.5 rounded-lg text-sm";
    if (alert.type === "error")
      return `${base} bg-red-50 text-red-900 border border-red-200`;
    if (alert.type === "success")
      return `${base} bg-green-50 text-green-900 border border-green-200`;
    return `${base} bg-blue-50 text-blue-900 border border-blue-200`;
  }, [alert.type]);

  // Get density badge color based on level
  const getDensityBadgeColor = (level) => {
    switch (level.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "high":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-6 md:px-10 h-16 flex items-center justify-between shadow-sm sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-base">
            CA
          </div>
          <span className="text-lg font-semibold text-slate-900 tracking-tight">
            Crowd Analytics
          </span>
        </div>

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
            onClick={() => setIsLogoutModalOpen(true)}
            className="cursor-pointer px-5 py-2 bg-blue-600 text-white border border-blue-600 rounded-md text-sm font-medium hover:bg-blue-700 transition-all"
          >
            Logout
          </button>
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mb-6 md:mb-8">
          <div className="bg-white p-5 md:p-6 rounded-xl border border-gray-200 transition-all hover:shadow-lg hover:-translate-y-1">
            <div className="flex justify-between items-center mb-3">
              <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                {isVideo ? "People Detected" : "Total Objects"}
              </span>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                {isVideo ? "👥" : "🔍"}
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
                Avg Confidence
              </span>
              <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                🎯
              </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 leading-none">
              {stats.confidence}%
            </div>
            <div className="text-xs text-green-600 mt-2">
              Detection accuracy
            </div>
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
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-slate-900 leading-none">
                {stats.densityLevel}
              </div>
              {stats.densityLevel !== "-" && (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${getDensityBadgeColor(
                    stats.densityLevel
                  )}`}
                >
                  {stats.density}
                </span>
              )}
            </div>
            <div className="text-xs text-green-600 mt-2">
              Frame density level
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-5 md:gap-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-slate-900">
                Upload & Configure
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
                </div>
              )}

              {isVideo && previewUrl && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Zone Drawing
                    </h3>
                    <button
                      onClick={() => setIsDrawingMode(!isDrawingMode)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                        isDrawingMode
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-gray-200 text-slate-700 hover:bg-gray-300"
                      }`}
                    >
                      {isDrawingMode ? "✓ Drawing Active" : "Start Drawing"}
                    </button>
                  </div>

                  {isDrawingMode && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 mb-3">
                      Click and drag on the video to draw rectangular zones.
                    </div>
                  )}

                  {zones.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-xs font-semibold text-slate-900 mb-2 uppercase tracking-wide">
                        Created Zones ({zones.length})
                      </h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {zones.map((zone, index) => (
                          <div
                            key={zone.id}
                            className="p-3 bg-white border border-gray-200 rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded"
                                  style={{ backgroundColor: zone.color }}
                                />
                                <span className="text-sm font-medium text-slate-900">
                                  {zone.name}
                                </span>
                              </div>
                              <button
                                onClick={() => handleDeleteZone(index)}
                                className="text-red-600 hover:text-red-800 text-xs"
                              >
                                Delete
                              </button>
                            </div>
                            {zone.description && (
                              <p className="text-xs text-slate-600 mt-1">
                                {zone.description}
                              </p>
                            )}
                            <div className="text-xs text-slate-500 mt-1">
                              Position: ({Math.round(zone.x)},{" "}
                              {Math.round(zone.y)}) | Size:{" "}
                              {Math.round(zone.width)}×{Math.round(zone.height)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-col gap-3 mt-6">
                <button
                  onClick={handleAnalyzeWithZones}
                  disabled={
                    !currentFile ||
                    isProcessing ||
                    (isVideo && zones.length === 0)
                  }
                  className="cursor-pointer w-full px-5 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:opacity-60 transition-all"
                >
                  {isProcessing
                    ? `Uploading... ${progress}%`
                    : `Analyze with ${zones.length} Zone${
                        zones.length !== 1 ? "s" : ""
                      }`}
                </button>
                <button
                  onClick={handleClear}
                  className="w-full px-5 py-3 bg-white text-slate-600 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all"
                >
                  Clear All
                </button>
              </div>

              {alert.show && <div className={alertClass}>{alert.message}</div>}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 md:px-6 py-4 md:py-5 border-b border-gray-200 bg-gray-50">
              <h2 className="text-base font-semibold text-slate-900">
                {isVideo
                  ? "Video Preview & Zone Drawing"
                  : "Image Preview & Analysis"}
              </h2>
            </div>
            <div className="p-5 md:p-6">
              <div className="bg-black rounded-lg min-h-[400px] md:min-h-[600px] flex items-center justify-center relative overflow-hidden">
                {previewUrl && isVideo ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                    <video
                      ref={videoRef}
                      controls={!isDrawingMode}
                      muted
                      playsInline
                      className="max-w-full max-h-[650px] block"
                      src={previewUrl}
                      style={{ pointerEvents: isDrawingMode ? "none" : "auto" }}
                    />
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        cursor: isDrawingMode ? "crosshair" : "default",
                        pointerEvents: isDrawingMode ? "auto" : "none",
                      }}
                    />
                  </div>
                ) : previewUrl && !isVideo ? (
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-w-full max-h-[650px] block mx-auto"
                  />
                ) : (
                  <div className="text-center text-slate-600 p-10">
                    <div className="text-6xl mb-4 opacity-30">🖼️</div>
                    <div className="text-base">
                      {isVideo
                        ? "Upload a video to start drawing zones"
                        : "Upload an image for analysis"}
                    </div>
                  </div>
                )}
              </div>

              {showResults && processedImageUrl && (
                <div className="mt-4 bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      Processed Output
                    </h3>
                    <div className="flex items-center gap-2">
                      <a
                        href={processedImageUrl}
                        download={
                          currentFile
                            ? `annotated_${currentFile.name}`
                            : "annotated_output"
                        }
                        className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => {
                          window.open(processedImageUrl, "_blank");
                        }}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Open
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    {processedImageUrl &&
                      (!isVideo ? (
                        <img
                          src={processedImageUrl}
                          alt="Processed"
                          className="w-full rounded"
                        />
                      ) : (
                        <video
                          src={processedImageUrl}
                          controls
                          className="w-full rounded"
                        />
                      ))}
                  </div>

                  {/* Detection Summary */}
                  {!isVideo && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        Detection Summary
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {detailedDetections.length === 0 ? (
                          <div className="text-xs text-slate-500">
                            No detailed detections returned
                          </div>
                        ) : (
                          detailedDetections.map((d, idx) => (
                            <div
                              key={idx}
                              className="p-2 border border-gray-100 rounded text-xs bg-gray-50"
                            >
                              <div className="font-medium">{d.object}</div>
                              <div>Count: {d.count}</div>
                              <div>Avg conf: {d.avg_confidence}%</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Zone Summary */}
                  {zoneSummary.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        Zone Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {zoneSummary.map((zone, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-gray-200 rounded-lg bg-white"
                          >
                            <div className="font-medium text-sm mb-1">
                              {zone.zone_name}
                            </div>
                            <div className="text-xs text-slate-600">
                              Total Count: {zone.total_count}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Zone Densities */}
                  {zoneDensities.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 mb-2">
                        Zone Densities
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {zoneDensities.map((zone, idx) => (
                          <div
                            key={idx}
                            className="p-3 border border-gray-200 rounded-lg bg-white"
                          >
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-sm">
                                {zone.zone_name}
                              </div>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${getDensityBadgeColor(
                                  getDensityLevel(zone.zone_density)
                                )}`}
                              >
                                {getDensityLevel(zone.zone_density)}
                              </span>
                            </div>
                            <div className="text-xs text-slate-600">
                              Density: {zone.zone_density?.toExponential(3)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showZoneForm && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-semibold text-slate-900 mb-4">
              Configure Zone
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Zone Name *
                </label>
                <input
                  type="text"
                  value={zoneForm.name}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, name: e.target.value })
                  }
                  placeholder="e.g., Entry Gate, Exit Area"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Border Color
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="color"
                    value={zoneForm.color}
                    onChange={(e) =>
                      setZoneForm({ ...zoneForm, color: e.target.value })
                    }
                    className="w-16 h-10 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={zoneForm.color}
                    onChange={(e) =>
                      setZoneForm({ ...zoneForm, color: e.target.value })
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Border Thickness: {zoneForm.thickness}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={zoneForm.thickness}
                  onChange={(e) =>
                    setZoneForm({
                      ...zoneForm,
                      thickness: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Description
                </label>
                <textarea
                  value={zoneForm.description}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, description: e.target.value })
                  }
                  placeholder="Add notes about this zone..."
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Alert Threshold (optional)
                </label>
                <input
                  type="number"
                  value={zoneForm.alertThreshold}
                  onChange={(e) =>
                    setZoneForm({ ...zoneForm, alertThreshold: e.target.value })
                  }
                  placeholder="e.g., 50 (max people allowed)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCancelZone}
                className="flex-1 px-4 py-2 bg-gray-200 text-slate-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveZone}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
              >
                Save Zone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
