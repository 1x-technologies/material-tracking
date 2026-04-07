import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/base/buttons/button";
import { CloseButton } from "@/components/base/buttons/close-button";
import { Image01 } from "@untitledui/icons";

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
              <CloseButton
                size="xs"
                label={`Remove photo ${i + 1}`}
                isDisabled={disabled}
                onPress={() => handleRemove(i)}
                className="absolute -top-2 -right-2 !size-5 !p-0 rounded-full bg-red-500 text-white hover:bg-red-600"
              />
            </div>
          ))}
        </div>
      )}

      <label
        className={[
          "inline-flex cursor-pointer",
          disabled ? "pointer-events-none opacity-50" : "",
        ].join(" ")}
      >
        <Button
          size="sm"
          color="secondary"
          iconLeading={Image01}
          isDisabled={disabled}
          className="pointer-events-none"
        >
          Add Photo
        </Button>
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
