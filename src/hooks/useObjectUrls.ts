import { useEffect, useMemo } from "react";

// Module-level store that persists across component lifecycles
const objectUrlStore = new Map<string, string>();

interface FileWithId {
  id: string;
  file?: File | null;
  url?: string;
}

export function useObjectUrls(
  files: FileWithId[] | null
): Map<string, string> {
  // Create object URLs for files that need them
  const imageSources = useMemo(() => {
    if (!files) return new Map<string, string>();

    const sources = new Map<string, string>();

    files.forEach((file) => {
      if (file.file) {
        // Create or reuse object URL from the persistent store
        if (!objectUrlStore.has(file.id)) {
          const url = URL.createObjectURL(file.file);
          objectUrlStore.set(file.id, url);
        }
        sources.set(file.id, objectUrlStore.get(file.id)!);
      } else if (file.url) {
        sources.set(file.id, file.url);
      }
    });

    return sources;
  }, [files]);

  // Cleanup object URLs for files that no longer exist in form state
  useEffect(() => {
    if (!files) {
      // If no files, don't clean up - they might be coming back
      return;
    }

    const currentFileIds = new Set(files.map((f) => f.id));

    // Only clean up URLs for files that are no longer in the form state
    objectUrlStore.forEach((url, fileId) => {
      if (!currentFileIds.has(fileId)) {
        URL.revokeObjectURL(url);
        objectUrlStore.delete(fileId);
      }
    });
  }, [files]);

  return imageSources;
}

