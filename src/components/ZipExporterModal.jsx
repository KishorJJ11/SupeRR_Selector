import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, CheckCircle2, Loader2, FolderArchive } from 'lucide-react';

export default function ZipExporterModal({ isOpen, onClose }) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const handleDownloadZip = async () => {
    setIsExporting(true);
    setIsDone(false);

    try {
      const link = document.createElement('a');
      link.href = '/superr-selector-codebase.zip';
      link.download = 'superr-selector-codebase.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        setIsDone(true);
        setIsExporting(false);
      }, 500);
    } catch (err) {
      console.error('ZIP download error:', err);
      setIsExporting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="relative w-full max-w-md rounded-3xl bg-[#050D2B] p-6 sm:p-7 border border-white/20 shadow-2xl text-white"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-[#EA1A85] text-white/80 hover:text-white transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA1A85]"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3.5 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-[#EA1A85]/20 border border-[#EA1A85]/50 flex items-center justify-center text-[#EA1A85] shadow-xs shrink-0">
              <FolderArchive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white font-display uppercase tracking-tight">
                Export Complete Codebase
              </h3>
              <p className="text-xs text-[#FDE4F1] font-ui font-medium">
                Download ready-to-run ZIP archive
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0A1A52]/70 border border-white/10 space-y-2 mb-6 text-xs text-slate-200 shadow-inner">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10e588]" />
              <span>Full React JSX + Tailwind CSS components</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10e588]" />
              <span>Rajasthan Royals brand theme &amp; assets</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10e588]" />
              <span>Python T20 ML Pressure Engine script</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#10e588]" />
              <span>Express backend &amp; production server scaffold</span>
            </div>
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-display uppercase tracking-wider font-bold text-white bg-[#EA1A85] hover:bg-[#C4106C] shadow-lg shadow-[#EA1A85]/30 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Packaging Codebase ZIP...</span>
              </>
            ) : isDone ? (
              <>
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span>Downloaded Successfully! Download Again</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Download SupeRR-Selector.zip</span>
              </>
            )}
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
