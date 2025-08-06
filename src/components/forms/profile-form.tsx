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
import { z } from "zod";
import { updateUserProfile } from "@/lib/server_actions/user_actions";
import { useState } from "react";
import { toast } from "sonner";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  instagram: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  city: z.string().optional(),
});

interface ProfileFormProps {
  currentUser: {
    displayName?: string;
    bio?: string;
    instagram?: string;
    website?: string;
    city?: string;
    username: string;
    image?: string;
  };
}

export default function ProfileForm({ currentUser }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: currentUser?.displayName || "",
      bio: currentUser?.bio || "",
      instagram: currentUser?.instagram || "",
      website: currentUser?.website || "",
      city: currentUser?.city || "",
    },
  });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-xl">Edit Profile</CardTitle>
        <CardDescription>
          Update your profile information
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            action={async (formData: FormData) => {
              setIsSubmitting(true);
              try {
                await updateUserProfile(formData);
                toast.success("Profile updated successfully!");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update profile");
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            {/* Username (disabled) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Username</label>
              <Input value={currentUser.username} disabled />
              <p className="text-xs text-gray-500">Username cannot be changed</p>
            </div>

            {/* Profile Picture */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Profile Picture</label>
              {currentUser.image && (
                <div className="mb-2">
                  <img
                    src={currentUser.image}
                    alt="Current profile"
                    className="w-20 h-20 rounded-full object-cover"
                  />
                </div>
              )}
              <Input
                type="file"
                name="profilePicture"
                accept="image/*"
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
                      placeholder="Your display name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
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

            <FormField
              control={form.control}
              name="instagram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="@username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://yourwebsite.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your city"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}