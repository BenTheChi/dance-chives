"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "../ui/date-picker";
import { z } from "zod";
import { signup, updateUserProfile } from "@/lib/server_actions/auth_actions";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";
import { CitySearchInput } from "@/components/CitySearchInput";
import { City } from "@/types/city";
import { FieldErrors } from "react-hook-form";
import { UploadProfilePicture } from "@/components/UploadProfilePicture";

//Implement a zod validator for all the fields on this form except for the date input
//I need to search the DB for uniqueness for username in the validation
const citySchema = z.object({
  id: z.number(),
  name: z.string(),
  region: z.string(),
  countryCode: z.string(),
  population: z.number(),
  timezone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const signupSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  username: z.string().min(1, "Username is required"),
  date: z
    .string()
    .min(1, "Date of birth is required")
    .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/, {
      message: "Date must be in MM/DD/YYYY format",
    }),
  city: citySchema,
  styles: z.array(z.string()).optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  isCreator: z.boolean().optional(),
  profilePicture: z.instanceof(File).nullable().optional(),
  avatarPicture: z.instanceof(File).nullable().optional(),
});

const editSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  date: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/, {
      message: "Date must be in MM/DD/YYYY format",
    })
    .optional()
    .or(z.literal("")),
  city: citySchema,
  styles: z.array(z.string()).optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  profilePicture: z.instanceof(File).nullable().optional(),
  avatarPicture: z.instanceof(File).nullable().optional(),
});

interface SignUpFormProps {
  isEditMode?: boolean;
  currentUser?: {
    displayName?: string;
    username?: string;
    bio?: string;
    instagram?: string;
    website?: string;
    city?: City | string | null;
    date?: string;
    styles?: string[];
    image?: string;
    avatar?: string;
  };
  userId?: string;
}

//The fields on this form may need to be conditional based on the user's OAuth provider
//For example, if the user signs up with Instagram, we will not have an email address
//UserInfo has any because I'm not sure what fields will be passed in depending on the OAuth provider
export default function SignUpForm({
  isEditMode = false,
  currentUser,
  userId,
}: SignUpFormProps = {}) {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(currentUser?.image || null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(
    null
  );
  const [avatarPictureFile, setAvatarPictureFile] = useState<File | null>(null);

  const schema = isEditMode ? editSchema : signupSchema;

  // Parse city from currentUser - handle both City object and string
  const parseCity = (city: City | string | null | undefined): City | null => {
    if (!city) return null;
    if (typeof city === "string") {
      try {
        return JSON.parse(city);
      } catch {
        return null;
      }
    }
    return city;
  };

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    mode: "onSubmit",
    defaultValues: isEditMode
      ? {
          displayName: currentUser?.displayName || "",
          date: currentUser?.date || "",
          city: parseCity(currentUser?.city) || undefined,
          styles: currentUser?.styles || [],
          bio: currentUser?.bio || "",
          instagram: currentUser?.instagram || "",
          website: currentUser?.website || "",
          profilePicture: null,
          avatarPicture: null,
        }
      : {
          displayName: "",
          username: "",
          date: "",
          city: undefined as City | undefined, // Required field, will be validated on submit
          styles: [],
          isCreator: false,
          profilePicture: null,
          avatarPicture: null,
        },
  });

  const { handleSubmit } = form;

  // Check if this is an admin user
  const isAdminUser = session?.user?.email === "benthechi@gmail.com";

  // Convert form data to FormData in the same format as before
  const convertToFormData = (data: z.infer<typeof schema>): FormData => {
    const formData = new FormData();

    // Add basic fields
    formData.set("displayName", data.displayName);
    if (!isEditMode && "username" in data) {
      formData.set("username", data.username);
    }
    if (data.date) {
      formData.set("date", data.date);
    }
    if (data.city) {
      formData.set("city", JSON.stringify(data.city));
    }

    // Add optional fields
    if (data.bio) {
      formData.set("bio", data.bio);
    }
    if (data.instagram) {
      formData.set("instagram", data.instagram);
    }
    if (data.website) {
      formData.set("website", data.website);
    }

    // Add styles as JSON string
    if (data.styles && data.styles.length > 0) {
      formData.set("Dance Styles", JSON.stringify(data.styles));
    }

    // Add isCreator (only for signup)
    if (!isEditMode && "isCreator" in data) {
      formData.set("isCreator", (data.isCreator || false).toString());
    }

    // Add profile and avatar pictures if provided (use state files if available)
    const profileFile = profilePictureFile || data.profilePicture;
    const avatarFile = avatarPictureFile || data.avatarPicture;

    if (profileFile && profileFile instanceof File) {
      formData.set("profilePicture", profileFile);
    }
    if (avatarFile && avatarFile instanceof File) {
      formData.set("avatarPicture", avatarFile);
    }

    return formData;
  };

  const onSubmit = async (data: z.infer<typeof schema>) => {
    setIsSubmitting(true);
    try {
      const formData = convertToFormData(data);

      if (isEditMode) {
        // Edit mode - use updateUserProfile
        if (!userId) {
          toast.error("User ID is required");
          return;
        }

        const result = await updateUserProfile(userId, formData);

        if (result.success) {
          // Update session to refresh avatar in navbar
          await updateSession();
          toast.success("Profile updated successfully!");
          router.replace("/dashboard");
        } else {
          toast.error(result.error || "Failed to update profile");
        }
      } else {
        // Signup mode - use signup
        const result = await signup(formData);
        if (result.success) {
          // Update session to reflect account verification status
          await updateSession();
          toast.success("Account created successfully!");
          setIsNavigating(true);
          router.push("/dashboard");
        } else {
          toast.error(result.error || "Failed to create account");
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onError = (errors: FieldErrors<z.infer<typeof schema>>) => {
    console.error("Form validation errors:", errors);
    toast.error("Please fix the errors in the form");
  };

  return (
    <Card className={isEditMode ? "w-full max-w-2xl" : "w-full max-w-2xl"}>
      <CardHeader>
        <CardTitle className="text-xl">
          {isEditMode ? "Edit Profile" : "Complete Your Registration"}
        </CardTitle>
        <CardDescription>
          {isEditMode
            ? "Update your profile information"
            : "You've signed in with OAuth. Complete your profile to verify your account and access all features."}
          {!isEditMode && isAdminUser && (
            <div className="mt-2">
              <Badge variant="default" className="text-xs">
                🔑 Admin Account Detected - Super Admin privileges will be
                automatically assigned
              </Badge>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-3"
            onSubmit={handleSubmit(onSubmit, onError)}
          >
            {/* Username field - only show in signup mode */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Unique identifier. Cannot change."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Username display - only show in edit mode */}
            {isEditMode && currentUser?.username && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Username
                </label>
                <Input value={currentUser.username} disabled />
                <p className="text-xs text-gray-500">
                  Username cannot be changed
                </p>
              </div>
            )}

            {/* Profile Picture */}
            <FormField
              control={form.control}
              name="profilePicture"
              render={({ field: { onChange } }) => (
                <FormItem>
                  <FormLabel>
                    Profile Picture {isEditMode ? "" : "(Optional)"}
                  </FormLabel>
                  <FormControl>
                    <UploadProfilePicture
                      onImagesReady={(profileBlob, avatarBlob) => {
                        // Convert blobs to Files
                        const profileFile = new File(
                          [profileBlob],
                          "profile.webp",
                          { type: "image/webp" }
                        );
                        const avatarFile = new File(
                          [avatarBlob],
                          "avatar.png",
                          { type: "image/png" }
                        );
                        setProfilePictureFile(profileFile);
                        setAvatarPictureFile(avatarFile);
                        onChange(profileFile);
                        form.setValue("avatarPicture", avatarFile);

                        // Update previews
                        const profileUrl = URL.createObjectURL(profileBlob);
                        const avatarUrl = URL.createObjectURL(avatarBlob);
                        setProfilePicturePreview(profileUrl);
                      }}
                      currentProfileImage={currentUser?.image || null}
                      currentAvatarImage={currentUser?.avatar || null}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Hidden field for avatar picture */}
            <FormField
              control={form.control}
              name="avatarPicture"
              render={() => <></>}
            />
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Will be displayed publicly. Can be changed."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <CitySearchInput
              control={form.control}
              name="city"
              label="City"
              placeholder="Search for a city..."
              required
            />
            <DatePicker
              control={form.control}
              name="date"
              label="Date of Birth"
            />
            <FormField
              control={form.control}
              name="styles"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dance Styles (Optional)</FormLabel>
                  <FormControl>
                    <StyleMultiSelect
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Event Creator Switch - only show on first-time signup (not in edit mode) */}
            {!isEditMode && (
              <FormField
                control={form.control}
                name="isCreator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Do you want to create events?</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          No
                        </span>
                        <Switch
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                        />
                        <span className="text-sm text-muted-foreground">
                          Yes
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Bio field */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell us about yourself..."
                      className="resize-none min-h-[80px]"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instagram field */}
            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Username (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="@username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Website field */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isNavigating}
            >
              {isSubmitting || isNavigating
                ? isEditMode
                  ? "Updating..."
                  : "Processing..."
                : isEditMode
                ? "Update Profile"
                : "Complete Registration & Verify Account"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
