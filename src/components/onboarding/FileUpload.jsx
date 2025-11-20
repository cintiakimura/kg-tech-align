import React, { useState } from 'react';
import { Upload, X, CheckCircle, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { useLanguage } from '../LanguageContext';

export default function FileUpload({ 
  label, 
  value, 
  onChange, 
  accept = "image/*", 
  helperText,
  required = false
}) {
  const { t } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onChange(file_url);
    } catch (err) {
      console.error("Upload failed", err);
      setError("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    onChange("");
  };

  const isImage = accept.startsWith("image");

  return (
    <div className="w-full space-y-2">
      <label className="block text-sm font-medium mb-1">
        {label} {required && <span className="text-[#00C600]">*</span>}
      </label>
      
      {!value ? (
        <div className={cn(
          "relative group cursor-pointer border-2 border-dashed rounded-xl transition-all duration-300",
          "hover:border-[#00C600] hover:bg-[#00C600]/5",
          "border-gray-300 dark:border-gray-700 bg-white dark:bg-[#2a2a2a]",
          "flex items-center justify-center h-32"
        )}>
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleFileChange}
            accept={accept}
            disabled={isUploading}
          />
          
          <div className="text-center px-4">
            {isUploading ? (
              <div className="flex flex-col items-center gap-2 text-[#00C600]">
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs font-medium">{t('uploading') || 'Uploading...'}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400 group-hover:text-[#00C600] transition-colors">
                {isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                <span className="text-xs font-medium">{t('upload_click') || 'Click to upload'}</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={cn(
          "relative rounded-xl overflow-hidden border transition-all",
          "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#2a2a2a]",
          "flex items-center p-3 gap-3"
        )}>
          {isImage ? (
             <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0 border dark:border-gray-600">
               <img src={value} alt="Preview" className="h-full w-full object-cover" />
             </div>
          ) : (
             <div className="h-12 w-12 rounded-lg bg-[#00C600]/10 flex items-center justify-center flex-shrink-0 text-[#00C600]">
               <FileText className="w-6 h-6" />
             </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-gray-900 dark:text-gray-100">
              {t('file_uploaded') || 'File uploaded'}
            </p>
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-[#00C600] hover:underline">
              {t('view_file') || 'View file'}
            </a>
          </div>

          <button
            onClick={clearFile}
            className="p-1.5 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 transition-colors"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {(helperText || error) && (
        <p className={cn("text-xs", error ? "text-red-500" : "text-gray-500 dark:text-gray-400")}>
          {error || helperText}
        </p>
      )}
    </div>
  );
}