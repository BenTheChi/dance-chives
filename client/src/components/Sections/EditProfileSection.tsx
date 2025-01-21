import { useEffect, useState } from 'react';
import { useMutation } from '@apollo/client';
import { Cloudinary } from '@cloudinary/url-gen';
import { Avatar, Button, Card, Group, Stack, Text, TextInput } from '@mantine/core';
import { UPDATE_USER } from '@/gql/returnQueries';
import CloudinaryUploadWidget from '../CloudinaryUploadWidget';
import CountryCitySelector from '../Inputs/CountryCitySelector';
import { useUserContext } from '../Providers/UserProvider';

export function EditProfileSection({
  setEditProfile,
  setUserData,
  currUserData,
}: {
  setEditProfile: (value: boolean) => void;
  setUserData: (value: any) => void;
  currUserData: any;
}) {
  const { userData, updateUserData } = useUserContext();

  const [updateUser, { data, loading, error }] = useMutation(UPDATE_USER);

  const [formData, setFormData] = useState({
    displayName: userData.displayName || '',
    username: userData.username || '',
    aboutme: userData.aboutme || '',
    image: userData.image || '',
    city: userData.city || { name: '', country: '' },
    socials: userData.socials || [],
  });

  // Cloudinary Configuration
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_UPLOAD_PRESET;
  const [publicId, setPublicId] = useState('');

  const cld = new Cloudinary({
    cloud: {
      cloudName,
    },
  });

  // Upload Widget Configuration
  const uwConfig = {
    cloudName,
    uploadPreset,
    cropping: true,
    showAdvancedOptions: false,
    sources: ['local', 'url'],
    multiple: false,
    maxImageFileSize: 5000000,
    folder: 'profiles',
    callbacks: {
      onSuccess: (result: any) => {
        const uploadInfo = result.info;
        setPublicId(uploadInfo.public_id);
        setFormData((prev) => ({
          ...prev,
          image: uploadInfo.secure_url,
        }));
      },
    },
  };

  const handleSubmit = async () => {
    updateUser({
      variables: {
        where: { username: userData.username },
        update: {
          displayName: formData.displayName,
          username: formData.username,
          aboutme: formData.aboutme,
          image: formData.image,
          socials: formData.socials,
          city: {
            disconnect: {},
            connectOrCreate: {
              where: {
                node: {
                  name: formData.city.name,
                },
              },
              onCreate: {
                node: {
                  name: formData.city.name,
                  country: formData.city.country,
                },
              },
            },
          },
        },
      },
    });
  };

  const handleCancel = () => {
    setEditProfile(false);
  };

  useEffect(() => {
    if (!loading && data) {
      let newData = data.updateUsers.users[0];
      setFormData(newData);
      setEditProfile(false);
      console.log(newData);
      updateUserData(newData);
      setUserData({ ...currUserData, ...newData });
    }
  }, [loading, data]);

  return (
    <Card withBorder shadow="sm" radius="md" m="md">
      <Group align="flex-start" wrap="nowrap">
        <Stack>
          <Avatar size={150} src={formData.image} alt={formData.displayName} radius="md" />
          <CloudinaryUploadWidget
            uwConfig={uwConfig}
            setPublicId={setPublicId}
            setImageUrl={(imageUrl: string) => {
              setFormData((prev) => ({ ...prev, image: imageUrl }));
            }}
          />
        </Stack>

        <Stack style={{ flex: 1 }}>
          <TextInput
            label="Display Name"
            value={formData.displayName}
            onChange={(e) => setFormData((prev) => ({ ...prev, displayName: e.target.value }))}
          />

          <TextInput
            label="Username"
            value={formData.username}
            onChange={(e) => setFormData((prev) => ({ ...prev, username: e.target.value }))}
          />

          <TextInput
            label="About Me"
            value={formData.aboutme}
            onChange={(e) => setFormData((prev) => ({ ...prev, aboutme: e.target.value }))}
          />

          <Text size="sm" fw={500}>
            Location
          </Text>
          <CountryCitySelector
            onChange={(name, country) => {
              setFormData((prev) => ({ ...prev, city: { name, country } }));
            }}
            selectedCountry={formData.city.country}
            selectedCity={formData.city.name}
          />

          <TextInput
            label="Social Media Links"
            placeholder="Add social media links"
            value={formData.socials.join(', ')}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                socials: e.target.value.split(',').map((s) => s.trim()),
              }))
            }
          />

          <Group mt="md">
            <Button color="green" onClick={handleSubmit}>
              Save
            </Button>
            <Button color="red" onClick={handleCancel}>
              Cancel
            </Button>
          </Group>
        </Stack>
      </Group>
    </Card>
  );
}
