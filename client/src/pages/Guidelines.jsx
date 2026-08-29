import React, { useState } from 'react';

export default function Guidelines() {
  const [milestones, setMilestones] = useState([
    {
      id: 1,
      title: 'Chapter 1: Introduction & Background',
      description: 'Define problem statement, scope, and objectives.',
      deadline: '2026-09-15',
      status: 'Published',
      pdfName: 'Chapter1_Template.pdf',
    },
    {
      id: 2,
      title: 'Chapter 2: Literature Review',
      description: 'Review related systems and existing academic publications.',
      deadline: '2026-10-01',
      status: 'Published',
      pdfName: 'Literature_Review_Format.pdf',
    },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    status: 'Published',
  });

  const handleOpenCreateModal = () => {
    setEditingId(null);
    setPdfFile(null);
    setFormData({ title: '', description: '', deadline: '', status: 'Published' });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingId(item.id);
    setPdfFile(null);
    setFormData({
      title: item.title,
      description: item.description,
      deadline: item.deadline,
      status: item.status,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.deadline) return;

    const newGuidelineData = {
      ...formData,
      pdfName: pdfFile ? pdfFile.name : (editingId ? milestones.find(m => m.id === editingId)?.pdfName : null),
    };

    if (editingId) {
      setMilestones(
        milestones.map((m) => (m.id === editingId ? { ...m, ...newGuidelineData } : m))
      );
    } else {
      setMilestones([
        ...milestones,
        {
          id: Date.now(),
          ...newGuidelineData,
        },
      ]);
    }

    setShowModal(false);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Project Guidelines & Milestones</h2>
          <p className="text-xs text-slate-500">Create milestone guidelines and upload instruction PDF files for students.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 px-4 rounded-xl shadow-sm transition"
        >
          ➕ New Guideline
        </button>
      </div>

      {/* GUIDELINES LIST */}
      <div className="space-y-4">
        {milestones.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm">{item.title}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-slate-500">{item.description}</p>
              
              {/* PDF ATTACHMENT DISPLAY */}
              {item.pdfName && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 pt-1">
                  <span>📄 PDF Instruction:</span>
                  <span className="font-semibold underline cursor-pointer">{item.pdfName}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleOpenEditModal(item)}
              className="px-3 py-1.5 border border-slate-200 text-xs font-medium rounded-xl hover:bg-slate-50"
            >
              ✏️ Edit
            </button>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL WITH PDF INPUT */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md p-6 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-sm font-bold text-slate-800">
                {editingId ? 'Edit Guideline' : 'Create New Guideline'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Guideline Title</label>
                <input
                  type="text"
                  placeholder="e.g. Chapter 4: Implementation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:border-blue-500"
                  required
                ></textarea>
              </div>

              {/* UPLOAD GUIDELINE PDF ATTACHMENT */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Upload Guideline PDF (Optional)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Deadline Date</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium shadow-md shadow-blue-500/20"
                >
                  {editingId ? 'Update Guideline' : 'Save & Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}