"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { CitySearchInput } from "@/components/CitySearchInput";
import { City } from "@/types/city";
import { FieldErrors } from "react-hook-form";
import { UploadProfilePicture } from "@/components/UploadProfilePicture";
import {
  SUPER_ADMIN_EMAIL,
  SUPER_ADMIN_USERNAME,
  isReservedUsername,
  canUseReservedUsername,
} from "@/lib/utils/admin-user-constants";

//Implement a zod validator for all the fields on this form except for the date input
//I need to search the DB for uniqueness for username in the validation
const citySchema = z.object({
  id: z.string().min(1, "City ID is required"),
  name: z.string(),
  region: z.string(),
  countryCode: z.string(),
  timezone: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const signupSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
  username: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username must be 50 characters or less")
    .regex(
      /^[a-z0-9]+$/,
      "Username can only contain lowercase letters and numbers"
    )
    .refine(
      (username) => {
        // Reserved username validation will be handled in the signup action
        // This just ensures the format is correct
        return true;
      },
      {
        message: "Username format is invalid",
      }
    ),
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
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms of service and privacy policy",
  }),
  contentUsageAccepted: z.boolean().refine((val) => val === true, {
    message: "You must agree to the content usage and marketing policy",
  }),
  newsletterSubscribed: z.boolean().optional(),
});

const editSchema = z.object({
  displayName: z
    .string()
    .min(1, "Display name is required")
    .max(50, "Display name must be 50 characters or less"),
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

  // Check if this is the super admin user
  const isAdminUser =
    session?.user?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

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
          username: isAdminUser ? SUPER_ADMIN_USERNAME : "",
          date: "",
          city: undefined as City | undefined, // Required field, will be validated on submit
          styles: [],
          isCreator: false,
          profilePicture: null,
          avatarPicture: null,
          termsAccepted: false,
          contentUsageAccepted: false,
          newsletterSubscribed: false,
        },
  });

  const { handleSubmit } = form;

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

    // Add agreement checkboxes (only for signup)
    if (!isEditMode && "termsAccepted" in data) {
      formData.set("termsAccepted", (data.termsAccepted || false).toString());
    }
    if (!isEditMode && "contentUsageAccepted" in data) {
      formData.set(
        "contentUsageAccepted",
        (data.contentUsageAccepted || false).toString()
      );
    }
    if (!isEditMode && "newsletterSubscribed" in data) {
      formData.set(
        "newsletterSubscribed",
        (data.newsletterSubscribed || false).toString()
      );
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
    <div className="w-full max-w-xl flex flex-col items-center">
      <h1 className="text-xl font-semibold mb-6">
        {isEditMode ? "Edit Profile" : "Registration"}
      </h1>
      <section className="w-full border-2 border-black rounded-sm p-4 bg-primary">
        {!isEditMode && isAdminUser && (
          <div className="mb-6">
            <Badge variant="default" className="text-xs">
              🔑 Super Admin Account Detected - The username "
              {SUPER_ADMIN_USERNAME}" will be automatically assigned and Super
              Admin privileges will be granted
            </Badge>
          </div>
        )}
        <div>
          <Form {...form}>
            <form
              className="space-y-7"
              onSubmit={handleSubmit(onSubmit, onError)}
            >
              {/* Email field - only show in signup mode, read-only */}
              {!isEditMode && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Email
                  </label>
                  <Input
                    value={session?.user?.email || ""}
                    disabled
                    className="bg-muted/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email is set from your account and cannot be changed
                  </p>
                </div>
              )}

              {/* Username field - only show in signup mode */}
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => {
                    // For admin user, automatically set username to "admin"
                    const isAdmin = isAdminUser;
                    const currentValue = isAdmin
                      ? SUPER_ADMIN_USERNAME
                      : field.value;

                    return (
                      <FormItem>
                        <FormLabel required>Username</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Unique identifier. Cannot change."
                            {...field}
                            value={currentValue ?? ""}
                            disabled={isAdmin}
                            onChange={(e) => {
                              if (isAdmin) {
                                // Admin user cannot change username
                                return;
                              }
                              // Normalize to lowercase and filter out invalid characters
                              const value = e.target.value
                                .toLowerCase()
                                .replace(/[^a-z0-9]/g, "");
                              field.onChange(value);
                            }}
                            maxLength={50}
                          />
                        </FormControl>
                        {isAdmin && (
                          <p className="text-xs text-muted-foreground">
                            Username is reserved for super admin account
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              )}

              {/* Username display - only show in edit mode */}
              {isEditMode && currentUser?.username && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white">
                    Username
                  </label>
                  <Input value={currentUser.username ?? ""} disabled />
                  <p className="text-xs">Username cannot be changed</p>
                </div>
              )}

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel required>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Will be displayed publicly. Can be changed."
                        {...field}
                        value={field.value ?? ""}
                        maxLength={50}
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
                required={!isEditMode}
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
                          <span className="text-sm text-white">No</span>
                          <Switch
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                          />
                          <span className="text-sm text-white">Yes</span>
                        </div>
                      </FormControl>
                      {field.value && (
                        <div className="mt-3 p-4 bg-secondary-dark/50 border-2 border-secondary-light rounded-sm">
                          <p className="text-sm text-white leading-relaxed">
                            <strong className="font-semibold">
                              Important: Content Ownership
                            </strong>
                            <br />
                            <br />
                            By creating events, you represent and warrant that{" "}
                            <strong>
                              you own or have rights to all content
                            </strong>{" "}
                            you post, including event descriptions, images, and
                            related materials. Your content must not infringe on
                            third-party rights, and you must have obtained any
                            necessary permissions (such as model releases).
                            <br />
                            <br />
                            When you post your own content, you grant Dance
                            Chives a non-exclusive license to use it on the
                            platform and in marketing materials. You retain full
                            ownership and can opt out of marketing use in your
                            account settings. For complete details, see our{" "}
                            <Link
                              href="/content-usage"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-light hover:text-white underline"
                            >
                              Content Usage and Marketing Policy
                            </Link>
                            .
                          </p>
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <hr className="my-10 border-black" />
              <FormField
                control={form.control}
                name="styles"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dance Styles</FormLabel>
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

              {/* Bio field */}
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none min-h-[80px]"
                        rows={3}
                        {...field}
                        value={field.value ?? ""}
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
                    <FormLabel>Instagram Username</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="username"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <hr className="my-10 border-black" />
              {/* Profile Picture */}
              <FormField
                control={form.control}
                name="profilePicture"
                render={({ field: { onChange } }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
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

              {/* Website field */}
              {/* <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}
              <hr className="my-10 border-black" />

              {/* Terms and Privacy Policy Checkbox - only show in signup mode */}
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="termsAccepted"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormLabel className="!font-normal text-sm leading-relaxed flex-1 pointer-events-none !text-white data-[error=true]:!text-white">
                          By checking this box, you agree to the{" "}
                          <Link
                            href="/terms"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-light hover:text-white underline pointer-events-auto"
                          >
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link
                            href="/privacy"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-light hover:text-white underline pointer-events-auto"
                          >
                            Privacy Policy
                          </Link>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Content Usage and Marketing Checkbox - only show in signup mode */}
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="contentUsageAccepted"
                  render={({ field }) => (
                    <FormItem className="mb-2">
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="mt-0.5"
                          />
                        </FormControl>
                        <FormLabel className="!font-normal leading-relaxed text-sm pointer-events-none !text-white data-[error=true]:!text-white">
                          <span className="block mb-1">
                            By checking this box, you agree to the:
                          </span>
                          <Link
                            href="/content-usage"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-light hover:text-white underline font-medium pointer-events-auto"
                          >
                            Content Usage and Marketing Policy
                          </Link>
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              )}

              {/* Newsletter Subscription Checkbox - only show in signup mode */}
              {!isEditMode && (
                <FormField
                  control={form.control}
                  name="newsletterSubscribed"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-start gap-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value || false}
                            onCheckedChange={field.onChange}
                            className="mt-1"
                          />
                        </FormControl>
                        <FormLabel className="!font-normal text-sm leading-relaxed flex-1 pointer-events-none !text-white data-[error=true]:!text-white">
                          Subscribe to our newsletter for updates on events, new
                          features, and community highlights
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
                  : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </div>
      </section>
    </div>
  );
}
