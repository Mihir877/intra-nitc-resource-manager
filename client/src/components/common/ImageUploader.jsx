import {
  forwardRef,
  useRef,
  useState,
  useImperativeHandle,
  useEffect,
} from "react";
import { Plus, Upload, X } from "lucide-react";

const ImageUploader = forwardRef(
  (
    { onChange, title = "Upload Images", maxFiles = 10, existingImages = [] },
    ref
  ) => {
    const inputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState([]); // File[]
    const [previewUrls, setPreviewUrls] = useState(existingImages || []); // string[]
    const [removedUrls, setRemovedUrls] = useState([]); // Track deleted existing URLs

    useEffect(() => {
      if (existingImages && existingImages.length > 0) {
        setPreviewUrls(existingImages);
      }
    }, [existingImages]);

    useImperativeHandle(ref, () => ({
      getFiles: () => files,
      clear: () => {
        setFiles([]);
        setPreviewUrls([]);
        setRemovedUrls([]);
      },
    }));

    const notifyParent = (updatedFiles, updatedUrls, removed = removedUrls) => {
      if (onChange) onChange(updatedFiles, updatedUrls, removed);
    };

    const addFiles = (newFiles) => {
      const filtered = Array.from(newFiles).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!filtered.length) return;

      const combinedFiles = [...files, ...filtered];
      const combinedUrls = [
        ...previewUrls,
        ...filtered.map((f) => URL.createObjectURL(f)),
      ];

      setFiles(combinedFiles);
      setPreviewUrls(combinedUrls);
      notifyParent(combinedFiles, combinedUrls);
    };

    const handleSelectFiles = (e) => {
      addFiles(e.target.files);
      setIsDragging(false);
    };

    const handleDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
      if (!isDragging) setIsDragging(true);
    };

    const handleDragLeave = () => setIsDragging(false);

    const openFileDialog = () => inputRef.current?.click();

    const removeImage = (index) => {
      const removedUrl = previewUrls[index];
      const isExisting = existingImages.includes(removedUrl);

      const updatedFiles = files.filter((_, i) => i !== index);
      const updatedUrls = previewUrls.filter((_, i) => i !== index);

      if (isExisting) {
        setRemovedUrls((prev) => [...prev, removedUrl]);
      }

      setFiles(updatedFiles);
      setPreviewUrls(updatedUrls);
      notifyParent(updatedFiles, updatedUrls, [
        ...removedUrls,
        ...(isExisting ? [removedUrl] : []),
      ]);
    };

    return (
      <div className="w-full">
        <p className="font-medium text-sm text-foreground mb-3">{title}</p>

        {previewUrls.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-8 cursor-pointer transition-all duration-200 ${
              isDragging
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/60 hover:bg-muted/60"
            }`}
            onClick={openFileDialog}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleSelectFiles}
              className="hidden"
            />
            <div className="flex flex-col items-center text-center select-none">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/15 mb-2">
                <Upload className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm text-foreground font-medium">
                Click or drag images here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports JPG, PNG, WEBP
              </p>
            </div>
          </div>
        )}

        {previewUrls.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {previewUrls.map((url, i) => (
              <div
                key={i}
                className="relative group overflow-hidden rounded-lg border border-border bg-card text-card-foreground "
              >
                <img
                  src={url}
                  alt={`preview-${i}`}
                  className="w-full h-24 object-cover group-hover:scale-105 transition-transform"
                />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-background/90 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="Remove"
                >
                  <X className="w-4 h-4 text-destructive" />
                </button>
              </div>
            ))}

            {previewUrls.length < maxFiles && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleSelectFiles}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={openFileDialog}
                  className="border-2 border-dashed border-border rounded-lg flex items-center justify-center hover:border-primary/60 hover:bg-muted/60 "
                  title="Add more images"
                >
                  <Plus className="w-6 h-6 text-primary" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
);

ImageUploader.displayName = "ImageUploader";
export default ImageUploader;
