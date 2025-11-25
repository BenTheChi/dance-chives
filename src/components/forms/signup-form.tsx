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
import DateInput from "../ui/dateinput";
import { z } from "zod";
import { signup, updateUserProfile } from "@/lib/server_actions/auth_actions";
import { useSession } from "next-auth/react";
import { Badge } from "@/components/ui/badge";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { CitySearchInput } from "@/components/CitySearchInput";
import { City } from "@/types/city";

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
  date: z.string().min(1, "Date of birth is required"),
  city: citySchema,
  styles: z.array(z.string()).optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  isCreator: z.boolean().optional(),
});

const editSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  date: z.string().optional(),
  city: citySchema,
  styles: z.array(z.string()).optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
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
  const { data: session, update } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState<
    string | null
  >(currentUser?.image || null);

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
        }
      : {
          displayName: "",
          username: "",
          date: "",
          city: undefined as City | undefined, // Required field, will be validated on submit
          styles: [],
          isCreator: false,
        },
  });

  // Check if this is an admin user
  const isAdminUser = session?.user?.email === "benthechi@gmail.com";

  return (
    <Card className={isEditMode ? "w-full max-w-2xl" : "w-3/4"}>
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
            className="space-y-4"
            action={async (formData: FormData) => {
              // Validate form before submission
              const isValid = await form.trigger();
              if (!isValid) {
                setIsSubmitting(false);
                toast.error("Please fill in all required fields");
                return;
              }

              setIsSubmitting(true);
              try {
                if (isEditMode) {
                  // Edit mode - use updateUserProfile
                  if (!userId) {
                    toast.error("User ID is required");
                    return;
                  }

                  // Get styles from form state and add to formData
                  const styles = form.getValues("styles") || [];
                  if (styles.length > 0) {
                    formData.set("Dance Styles", JSON.stringify(styles));
                  }

                  const result = await updateUserProfile(userId, formData);

                  if (result.success) {
                    // Refresh the session to get updated user data
                    await update();
                    toast.success("Profile updated successfully!");
                    // Small delay to show toast before redirect
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    // Use hard redirect to ensure session is fully refreshed
                    // Get username from currentUser to redirect
                    const username = currentUser?.username;
                    if (username) {
                      window.location.href = `/profiles/${username}`;
                    } else {
                      window.location.href = "/dashboard";
                    }
                  } else {
                    toast.error(result.error || "Failed to update profile");
                  }
                } else {
                  // Signup mode - use signup
                  // Get the date value from the form
                  const date = formData.get("date") as string;
                  // Validate the date format
                  if (
                    !date ||
                    !/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(
                      date
                    )
                  ) {
                    form.setError("date", {
                      type: "manual",
                      message: "Please enter a valid date in MM/DD/YYYY format",
                    });
                    return;
                  }
                  // Get styles from form state and add to formData
                  const styles = form.getValues("styles") || [];
                  if (styles.length > 0) {
                    formData.set("Dance Styles", JSON.stringify(styles));
                  }
                  // Get isCreator from form state and add to formData
                  const isCreator = form.getValues("isCreator") || false;
                  formData.set("isCreator", isCreator.toString());
                  await signup(formData);
                }
              } catch (error) {
                toast.error(
                  error instanceof Error ? error.message : "An error occurred"
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
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
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Profile Picture {isEditMode ? "" : "(Optional)"}
              </label>
              {profilePicturePreview && (
                <div className="mb-2">
                  <Image
                    src={profilePicturePreview}
                    alt="Profile preview"
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                    unoptimized
                  />
                </div>
              )}
              {!isEditMode &&
                session?.user?.image &&
                !profilePicturePreview && (
                  <div className="mb-2">
                    <Image
                      src={session.user.image}
                      alt="Current OAuth profile"
                      width={80}
                      height={80}
                      className="w-20 h-20 rounded-full object-cover"
                      unoptimized
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Current profile picture from OAuth
                    </p>
                  </div>
                )}
              <Input
                type="file"
                name="profilePicture"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setProfilePicturePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold"
              />
            </div>
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
              value={form.watch("city")}
              onChange={(city) => {
                if (city !== null && city !== undefined) {
                  form.setValue("city", city);
                }
              }}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date of Birth</FormLabel>
                  <FormControl>
                    <DateInput {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
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
                      className="resize-none"
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

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting
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
