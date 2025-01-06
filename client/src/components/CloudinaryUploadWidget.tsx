import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    cloudinary: any;
  }
}

interface CloudinaryUploadWidgetProps {
  uwConfig: object;
  setPublicId: (publicId: string) => void;
  setImageUrl: (imageUrl: string) => void;
}

const CloudinaryUploadWidget: React.FC<CloudinaryUploadWidgetProps> = ({
  uwConfig,
  setPublicId,
  setImageUrl,
}) => {
  const uploadWidgetRef = useRef<any>(null);
  const uploadButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const initializeUploadWidget = () => {
      if (window.cloudinary && uploadButtonRef.current) {
        // Create upload widget
        uploadWidgetRef.current = window.cloudinary.createUploadWidget(
          uwConfig,
          (error: any, result: any) => {
            if (!error && result && result.event === 'success') {
              console.log('Upload successful:', result.info);
              setPublicId(result.info.public_id);
              setImageUrl(result.info.secure_url);
            }
          }
        );

        // Add click event to open widget
        const handleUploadClick = () => {
          if (uploadWidgetRef.current) {
            uploadWidgetRef.current.open();
          }
        };

        const buttonElement = uploadButtonRef.current;
        buttonElement.addEventListener('click', handleUploadClick);

        // Cleanup
        return () => {
          buttonElement.removeEventListener('click', handleUploadClick);
        };
      }
    };

    initializeUploadWidget();
  }, [uwConfig, setPublicId]);

  return (
    <button ref={uploadButtonRef} id="upload_widget" className="cloudinary-button">
      Upload
    </button>
  );
};

export default CloudinaryUploadWidget;
