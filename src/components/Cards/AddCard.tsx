import React, { useState } from 'react';
import { IconCirclePlus, IconPhoto, IconUpload, IconX } from '@tabler/icons-react';
import { Button, Card, Group, Input, rem, Text, Title } from '@mantine/core';
import { Dropzone, IMAGE_MIME_TYPE } from '@mantine/dropzone';

interface AddCardProps {
  type: string;
}

export function AddCard({ type }: AddCardProps) {
  const [showForm, setShowForm] = useState(false);

  const handleClick = () => {
    setShowForm(true);
  };

  if (showForm) {
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
      </Card>
    );
  } else {
    return (
      <Button onClick={handleClick} variant="outline" h="350" w="460">
        <Group align="center" justify="space-between">
          <IconCirclePlus size={100} />
          <Title order={4}>Add {type}</Title>
        </Group>
      </Button>
    );
  }
}
