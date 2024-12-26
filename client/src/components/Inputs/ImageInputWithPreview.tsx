//This file was generated using AI.  Need to review it more carefully.

import { useEffect, useState } from 'react';
import { IconSquareXFilled } from '@tabler/icons-react';
import { ActionIcon, FileInput, Group, Image, Stack } from '@mantine/core';

interface FormProps {
  values: {
    images: File[] | null;
  };
  getInputProps: (field: string) => any;
  setFieldValue: (field: string, value: any) => void;
}

const ImageInputWithPreview = ({ form }: { form: FormProps }) => {
  const [previews, setPreviews] = useState<string[]>([]);

  // Generate preview URLs whenever files change
  useEffect(() => {
    const files = form.values.images;
    if (!files) {
      setPreviews([]);
      return;
    }

    // Create preview URLs for all selected files
    const urls = Array.from(files).map((file) => URL.createObjectURL(file as Blob));
    setPreviews(urls);

    // Cleanup function to revoke URLs
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [form.values.images]);

  const handleDelete = (indexToDelete: number) => {
    // Get current files array
    const currentFiles = Array.from(form.values.images || []);

    // Remove the file at the specified index
    const newFiles = currentFiles.filter((_, index) => index !== indexToDelete);

    // Update form with new files array
    form.setFieldValue('images', newFiles);

    // Cleanup the preview URL being removed
    URL.revokeObjectURL(previews[indexToDelete]);
  };

  return (
    <>
      <FileInput
        {...form.getInputProps('images')}
        label="Upload images"
        placeholder="Upload images"
        multiple
        accept="image/png,image/jpeg,image/webp"
      />

      {previews.length > 0 && (
        <Group gap="md" mt="md" wrap="nowrap">
          {previews.map((url, index) => (
            <Stack key={index} pos="relative">
              <Image
                src={url}
                alt={`Preview ${index + 1}`}
                radius="md"
                w={120}
                h={120}
                fit="cover"
              />
              <ActionIcon
                color="red"
                variant="filled"
                size="sm"
                pos="absolute"
                top={-6}
                right={-6}
                onClick={() => handleDelete(index)}
              >
                <IconSquareXFilled size={14} />
              </ActionIcon>
            </Stack>
          ))}
        </Group>
      )}
    </>
  );
};

export default ImageInputWithPreview;
