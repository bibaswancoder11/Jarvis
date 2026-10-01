import React, { useState } from 'react';
import { 
  Database, 
  Search, 
  Plus, 
  FileText, 
  Tag, 
  Calendar, 
  HardDrive, 
  ShieldCheck, 
  FolderPlus,
  BookOpen
} from 'lucide-react';
import { KnowledgeDocument } from '../types';
import { playTechBeep, playAuthSuccessSound } from '../utils/audio';

interface KnowledgeMemoryViewProps {
  documents: KnowledgeDocument[];
  onSearch: (query: string) => void;
  onAddDocument: (doc: Partial<KnowledgeDocument>) => void;
}

export const KnowledgeMemoryView: React.FC<KnowledgeMemoryViewProps> = ({
  documents,
  onSearch,
  onAddDocument,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState<KnowledgeDocument['category']>('notes');
  const [docContent, setDocContent] = useState('');
  const [docTags, setDocTags] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    playTechBeep(1200, 0.02);
    onSearch(searchQuery);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) return;

    onAddDocument({
      title: docTitle.trim(),
      category: docCategory,
      content: docContent.trim(),
      tags: docTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
    });

    playAuthSuccessSound();
    setShowAddModal(false);
    setDocTitle('');
    setDocContent('');
    setDocTags('');
  };

  const filteredDocs = selectedCategory === 'all'
    ? documents
    : documents.filter((d) => d.category === selectedCategory);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <Database className="w-4 h-4 text-cyan-400" />
            </div>
            <h2 className="font-sans font-bold text-base text-slate-100 tracking-wider uppercase">
              SOVEREIGN LOCAL KNOWLEDGE BASE & CONTEXT VAULT
            </h2>
          </div>
          <p className="text-xs text-slate-400 font-sans mt-1">
            Locally indexed vector embeddings, personal preferences, device manuals, and sovereign memory logs.
          </p>
        </div>

        <button
          onClick={() => {
            playTechBeep(1400, 0.03);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-sans font-bold text-xs transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>INGEST MEMORY NODE</span>
        </button>
      </div>

      {/* Add Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950/80 backdrop-blur-2xl border border-white/15 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-sans font-bold text-sm text-cyan-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                INGEST LOCAL KNOWLEDGE DOCUMENT
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-xs font-mono-tech"
              >
                ✕ CANCEL
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4 text-xs font-sans">
              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Document Title:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Laboratory Power Grid & Solar Inverter Specs"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono-tech"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Category:</label>
                  <select
                    value={docCategory}
                    onChange={(e: any) => setDocCategory(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-3.5 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono-tech"
                  >
                    <option value="personal_context">Personal Context & Profile</option>
                    <option value="system_docs">System Architecture</option>
                    <option value="notes">Laboratory Notes</option>
                    <option value="device_manual">Device Manual</option>
                    <option value="workflow_rule">Workflow Protocol Rule</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1.5">Tags (comma-separated):</label>
                  <input
                    type="text"
                    placeholder="e.g. power, hardware, backup"
                    value={docTags}
                    onChange={(e) => setDocTags(e.target.value)}
                    className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono-tech"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1.5">Document Content / Knowledge Chunk:</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Enter context, operational parameters, or instructions for JARVIS to retrieve..."
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-sans text-xs leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-sans shadow-[0_0_15px_rgba(6,182,212,0.4)]"
                >
                  INDEX & STORE IN MEMORY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search Bar & Category Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Semantic vector query across local documents..."
            className="w-full bg-white/[0.04] backdrop-blur-md border border-white/10 focus:border-cyan-400 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-mono-tech"
          />
          <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3" />
        </form>

        <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs font-sans">
          {['all', 'personal_context', 'system_docs', 'notes'].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                playTechBeep(1200, 0.02);
                setSelectedCategory(cat);
              }}
              className={`px-3.5 py-2 rounded-xl uppercase whitespace-nowrap tracking-wider transition-all text-xs font-medium ${
                selectedCategory === cat
                  ? 'bg-cyan-500/15 text-cyan-200 border border-cyan-400/40 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDocs.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-3xl bg-white/[0.04] backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-[10px] uppercase font-mono-tech px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300">
                  {doc.category.replace('_', ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono-tech">
                  {doc.sizeKb} KB
                </span>
              </div>

              <h3 className="font-sans font-bold text-xs text-slate-100 tracking-wide mb-2">
                {doc.title}
              </h3>

              <p className="text-xs text-slate-300 font-sans line-clamp-4 leading-relaxed mb-4">
                {doc.content}
              </p>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono-tech">
              <div className="flex items-center gap-1.5 flex-wrap">
                {doc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
              <span className="text-slate-400">
                {new Date(doc.indexedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
