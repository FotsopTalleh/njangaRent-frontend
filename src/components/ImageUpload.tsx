import { useCallback, useState, useRef } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  label?: string;
  maxFiles?: number;
  maxSizeMb?: number;
  accept?: string;
  onChange: (files: File[]) => void;
  className?: string;
  id?: string;
}

const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  label = "Upload images",
  maxFiles = 8,
  maxSizeMb = 5,
  accept = "image/jpeg,image/png,image/webp",
  onChange,
  className,
  id = "image-upload",
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    (incoming: FileList | File[]) => {
      const arr = Array.from(incoming);
      const newErrors: string[] = [];
      const valid: File[] = [];

      for (const file of arr) {
        if (!ALLOWED_MIME.includes(file.type)) {
          newErrors.push(`${file.name}: unsupported type (JPEG, PNG, WebP only)`);
          continue;
        }
        if (file.size > maxSizeMb * 1024 * 1024) {
          newErrors.push(`${file.name}: exceeds ${maxSizeMb} MB limit`);
          continue;
        }
        if (previews.length + valid.length >= maxFiles) {
          newErrors.push(`Maximum ${maxFiles} images allowed`);
          break;
        }
        valid.push(file);
      }

      if (valid.length > 0) {
        const newPreviews = valid.map((file) => ({
          file,
          url: URL.createObjectURL(file),
        }));
        setPreviews((p) => {
          const updated = [...p, ...newPreviews];
          onChange(updated.map((x) => x.file));
          return updated;
        });
      }

      setErrors(newErrors);
    },
    [previews.length, maxFiles, maxSizeMb, onChange],
  );

  const remove = (index: number) => {
    setPreviews((p) => {
      const updated = [...p];
      URL.revokeObjectURL(updated[index].url);
      updated.splice(index, 1);
      onChange(updated.map((x) => x.file));
      return updated;
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <p className="text-sm font-medium text-foreground">{label}</p>
      )}

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label={`${label} — drag and drop or click to browse`}
        id={id}
        className={cn(
          "border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          processFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
      >
        <Upload className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
        <p className="text-sm text-muted-foreground text-center">
          Drag images here or <span className="text-primary font-medium">click to browse</span>
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP — max {maxSizeMb} MB each, up to {maxFiles} images
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="sr-only"
          aria-hidden="true"
          onChange={(e) => e.target.files && processFiles(e.target.files)}
        />
      </div>

      {/* Error messages */}
      {errors.length > 0 && (
        <ul className="space-y-1" role="alert" aria-live="polite">
          {errors.map((err, i) => (
            <li key={i} className="flex items-start gap-1.5 text-xs text-destructive">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              {err}
            </li>
          ))}
        </ul>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2" role="list" aria-label="Selected images">
          {previews.map((p, i) => (
            <div key={i} role="listitem" className="relative group aspect-square rounded-lg overflow-hidden border border-border">
              <img
                src={p.url}
                alt={`Preview ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                aria-label={`Remove image ${i + 1}`}
                onClick={(e) => { e.stopPropagation(); remove(i); }}
                className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
