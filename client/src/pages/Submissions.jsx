import React, { useState } from 'react';

export default function StudentSubmit() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [submissionData, setSubmissionData] = useState({
    projectTitle: 'Advanced Machine Learning Algorithms for Predictive Maintenance',
    versionNumber: 'v1.2',
    submissionType: 'Draft / Milestone',
    description: '',
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Fadlan kaliya soo upload-gareey PDF file!');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Fadlan dooro feyl PDF ah ka hor intaad submitting samayn!');
      return;
    }
    alert(`Mashruuca waa la soo gudbiyay! File-ka: ${selectedFile.name}`);
  };

  return (
    <div className="max-w-4xl space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-extrabold text-slate-800">Submit Project Work</h2>
        <p className="text-xs text-slate-500">Upload your latest deliverables and update your project status.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SUBMISSION DETAILS CARD */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">Submission Details</h3>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Project Title</label>
            <input
              type="text"
              value={submissionData.projectTitle}
              disabled
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Version Number *</label>
              <input
                type="text"
                placeholder="e.g. v1.2"
                value={submissionData.versionNumber}
                onChange={(e) => setSubmissionData({ ...submissionData, versionNumber: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Submission Type *</label>
              <select
                value={submissionData.submissionType}
                onChange={(e) => setSubmissionData({ ...submissionData, submissionType: e.target.value })}
                className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
              >
                <option value="Draft / Milestone">Draft / Milestone</option>
                <option value="Final Thesis">Final Thesis</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Submission Description *</label>
            <textarea
              rows="3"
              placeholder="Briefly describe the contents of this submission..."
              value={submissionData.description}
              onChange={(e) => setSubmissionData({ ...submissionData, description: e.target.value })}
              className="w-full border border-slate-200 rounded-xl p-2.5 text-xs"
              required
            ></textarea>
          </div>
        </div>

        {/* FILE UPLOAD BOX */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">File Upload</h3>

          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-slate-50 transition flex flex-col items-center justify-center space-y-3">
            <span className="text-4xl">☁️</span>
            <div>
              <p className="text-xs font-semibold text-slate-700">Drag and drop your project PDF file here</p>
              <p className="text-[11px] text-slate-400">or click to browse from your computer</p>
            </div>

            <input
              type="file"
              accept="application/pdf"
              id="pdf-upload"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="pdf-upload"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs py-2 px-5 rounded-xl cursor-pointer shadow-md shadow-blue-500/20"
            >
              Browse PDF File
            </label>

            {selectedFile && (
              <div className="mt-2 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                ✅ Selected File: {selectedFile.name}
              </div>
            )}
          </div>
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-3 px-6 rounded-xl shadow-md cursor-pointer"
          >
            🚀 Submit Project
          </button>
        </div>
      </form>
    </div>
  );
}