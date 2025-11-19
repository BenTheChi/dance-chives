"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { UseFormRegister, FieldValues, Path } from "react-hook-form";
import Image from "next/image";
import { Picture } from "@/types/event";
import { toast } from "sonner";

interface UploadFileProps<T extends FieldValues> {
  register: UseFormRegister<T>;
  name: Path<T>;
  onFileChange: (files: Picture[] | Picture | null) => void;
  className?: string;
  maxFiles: number;
  files: Picture[] | Picture | null;
}

export default function UploadFile<T extends FieldValues>({
  register,
  name,
  onFileChange,
  maxFiles = 1,
  files,
}: UploadFileProps<T>) {
  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB in bytes

    // Check file sizes before processing
    const fileArray = Array.from(selectedFiles || []);
    const oversizedFiles = fileArray.filter(
      (file) => file.size > MAX_FILE_SIZE
    );

    if (oversizedFiles.length > 0) {
      const fileNames = oversizedFiles.map((f) => f.name).join(", ");
      toast.error(
        `File(s) too large: ${fileNames}. Maximum file size is 8MB. Please select smaller files.`
      );
      // Reset input value so user can try again
      e.target.value = "";
      return;
    }

    //convert File to Picture
    const newPictures = fileArray.map((file) => ({
      id: crypto.randomUUID(),
      title: file.name,
      url: "",
      type: "poster",
      file: file,
    }));

    if (maxFiles > 1) {
      // For galleries: merge with existing files
      const currentFiles = Array.isArray(files) ? files : [];
      const totalFiles = currentFiles.length + newPictures.length;

      // Validate limit - reject entire selection if it would exceed limit
      if (totalFiles > maxFiles) {
        toast.error(
          `Cannot add ${newPictures.length} file(s). Maximum of ${maxFiles} photos allowed. You currently have ${currentFiles.length} photo(s).`
        );
        // Reset input value so user can try again
        e.target.value = "";
        return;
      }

      // Merge new files with existing
      onFileChange([...currentFiles, ...newPictures] as Picture[]);
    } else {
      // For single file uploads (posters): replace
      onFileChange(newPictures[0] as Picture);
    }

    // Reset input value to allow selecting the same file again
    e.target.value = "";
  };

  const removeFile = (fileToRemove: Picture) => {
    //Make an api call to delete the file here if the url exists
    if (fileToRemove.url) {
      //delete the file from the DB api call
    }

    if (files && Array.isArray(files)) {
      const updatedFiles = files.filter((file) => file !== fileToRemove);
      onFileChange(updatedFiles.length > 0 ? updatedFiles : []);
    } else {
      onFileChange(null);
    }
  };

  // Calculate current file count and check if at limit
  const currentFileCount = Array.isArray(files) ? files.length : files ? 1 : 0;
  const isAtLimit = currentFileCount >= maxFiles;
  const isGallery = maxFiles > 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a File</CardTitle>
        <CardDescription>
          {isGallery
            ? `Select files to upload. ${currentFileCount}/${maxFiles} photos.`
            : "Select a file to upload and click the submit button."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <hr />

        <div className="flex flex-row gap-2 flex-wrap">
          {files &&
            Array.isArray(files) &&
            files.map((file) => (
              <div key={file.id} className="relative group">
                {file.file ? (
                  <>
                    <Image
                      key={file.id}
                      src={URL.createObjectURL(file.file as File)}
                      alt={file.title}
                      width={200}
                      height={200}
                      className="m-4 w-full max-w-[200px] h-auto object-contain"
                    />
                    <button
                      onClick={() => removeFile(file)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <Image
                      key={file.id}
                      src={file.url}
                      alt={file.title}
                      width={200}
                      height={200}
                      className="m-4 w-full max-w-[200px] h-auto object-contain"
                    />
                    <button
                      onClick={() => removeFile(file)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </>
                )}
              </div>
            ))}
          {files && !Array.isArray(files) && (
            <div key={files.id} className="relative group">
              {files.file ? (
                <>
                  <Image
                    key={files.id}
                    src={URL.createObjectURL(files.file as File)}
                    alt={files.title}
                    width={200}
                    height={200}
                    className="m-4 w-full max-w-[200px] h-auto object-contain"
                  />
                  <button
                    onClick={() => removeFile(files)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </>
              ) : (
                <>
                  <Image
                    key={files.id}
                    src={files.url}
                    alt={files.title}
                    width={200}
                    height={200}
                    className="m-4 w-full max-w-[200px] h-auto object-contain"
                  />
                  <button
                    onClick={() => removeFile(files)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        <div className="grid gap-4">
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className={`flex flex-col items-center justify-center w-full h-40 px-4 border-2 border-dashed rounded-lg ${
                isAtLimit
                  ? "border-gray-200 bg-gray-100 cursor-not-allowed opacity-60 dark:bg-gray-800 dark:border-gray-700"
                  : "border-gray-300 cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadIcon
                  className={`w-10 h-10 ${
                    isAtLimit ? "text-gray-300" : "text-gray-400"
                  }`}
                />
                {isAtLimit ? (
                  <>
                    <p className="mb-2 text-sm text-gray-400 dark:text-gray-500">
                      <span className="font-semibold">
                        Maximum of {maxFiles} photos reached
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Remove photos to add more
                    </p>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Click to upload</span> or
                      drag and drop
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {maxFiles > 1
                        ? `SVG, PNG, JPG or GIF (MAX. 800x400px) (MAX. ${maxFiles} files)`
                        : "SVG, PNG, JPG or GIF (MAX. 800x400px) (MAX. 1 file)"}
                    </p>
                  </>
                )}
              </div>
              <input
                id="dropzone-file"
                type="file"
                className="hidden"
                {...register(name)}
                onChange={handleFilesChange}
                multiple={maxFiles > 1 ? true : false}
                disabled={isAtLimit}
                onClick={(e) => {
                  if (isAtLimit) {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
              />
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </svg>
  );
}
