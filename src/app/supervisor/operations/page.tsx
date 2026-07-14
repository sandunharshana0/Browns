'use client';

import { useState } from 'react';

export default function ReceiptUploader({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPreview(URL.createObjectURL(file));
      setUploading(true);

      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/upload/receipt', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();

        if (data.success) {
          onUploadSuccess(data.url);
          alert('📸 Receipt uploaded and synced with Admin dashboard!');
        } else {
          alert('Upload failed: ' + data.error);
        }
      } catch (err) {
        alert('System error during upload.');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200">
      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">📸 Upload Bill / Receipt Photo</label>
      
      {preview && (
        <img src={preview} alt="Receipt Preview" className="w-full h-40 object-cover rounded-xl mb-3 border" />
      )}

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" // Phone එකෙන් එකපාරම කැමරාව open වීමට
        onChange={handleImageChange}
        className="hidden" 
        id="mobile-camera-input"
      />
      
      <label 
        htmlFor="mobile-camera-input" 
        className={`w-full flex justify-center items-center p-3 rounded-xl font-bold text-xs text-center border cursor-pointer transition-all ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-white border-blue-500 text-blue-600 hover:bg-blue-50'}`}
      >
        {uploading ? 'Uploading to Browns Cloud...' : '📷 Open Camera / Choose Image'}
      </label>
    </div>
  );
}
