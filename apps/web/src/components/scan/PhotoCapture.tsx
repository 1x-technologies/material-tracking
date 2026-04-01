import { useCallback, useEffect, useRef, useState } from "react";

interface PhotoCaptureProps {
  onPhotosChange: (files: File[]) => void;
  disabled?: boolean;
}

export function PhotoCapture({ onPhotosChange, disabled }: PhotoCaptureProps) {
  const [photos, setPhotos] = useState<File[]>([]);
  const previewUrls = useRef<string[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      for (const url of previewUrls.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const syncPreviews = useCallback((files: File[]) => {
    for (const url of previewUrls.current) {
      URL.revokeObjectURL(url);
    }
    const urls = files.map((f) => URL.createObjectURL(f));
    previewUrls.current = urls;
    setPreviews(urls);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const next = [...photos, file];
    setPhotos(next);
    syncPreviews(next);
    onPhotosChange(next);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(index: number) {
    const next = photos.filter((_, i) => i !== index);
    setPhotos(next);
    syncPreviews(next);
    onPhotosChange(next);
  }

  return (
    <div className="space-y-2">
      {previews.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {previews.map((url, i) => (
            <div key={url} className="relative">
              <img src={url} alt={`Photo ${i + 1}`} className="h-16 w-16 rounded object-cover" />
              <button
                type="button"
                onClick={() => handleRemove(i)}
                disabled={disabled}
                className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white hover:bg-red-600 transition-colors"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <label
        className={[
          "inline-flex items-center gap-2 rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors cursor-pointer",
          disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-neutral-50",
        ].join(" ")}
      >
        <span>📸 Add Photo</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          disabled={disabled}
          className="hidden"
        />
      </label>
    </div>
  );
}
