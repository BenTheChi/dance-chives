import { IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { Card, Group, Input, rem, Text } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';

interface EditCardProps {
  type: string;
  fields: { [key: string]: any }[];
}

//The fields need to be passed and changeable through Context

export function EditCard({ type, fields }: EditCardProps) {
  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="460">
      {type === 'image' ? (
        // Fix any type for Dropzone files
        <Dropzone
          onDrop={(files: any) => console.log('accepted files', files)}
          onReject={(files: any) => console.log('rejected files', files)}
          maxSize={5 * 1024 ** 2}
          accept={IMAGE_MIME_TYPE}
        >
          <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
            <Dropzone.Accept>
              <IconUpload
                style={{ width: rem(20), height: rem(20), color: 'var(--mantine-color-blue-6)' }}
                stroke={1.5}
              />
            </Dropzone.Accept>
            <Dropzone.Reject>
              <IconX
                style={{ width: rem(20), height: rem(20), color: 'var(--mantine-color-red-6)' }}
                stroke={1.5}
              />
            </Dropzone.Reject>
            <Dropzone.Idle>
              <IconPhoto
                style={{ width: rem(20), height: rem(20), color: 'var(--mantine-color-dimmed)' }}
                stroke={1.5}
              />
            </Dropzone.Idle>

            <div>
              <Text size="md" inline>
                Drag image here (JPG or PNG) or click to select file
              </Text>
            </div>
          </Group>
        </Dropzone>
      ) : (
        <Input.Wrapper label="Youtube Embed" error="Input error">
          <Input placeholder="Paste URL today" />
        </Input.Wrapper>
      )}

      {fields.map((field) => {
        const [key, value] = Object.entries(field)[0];

        return (
          <Input.Wrapper variant="unstyled" key={key} label={key}>
            <Input placeholder={value} />
          </Input.Wrapper>
        );
      })}
    </Card>
  );
}
