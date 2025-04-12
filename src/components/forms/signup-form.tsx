"use client";

import Link from "next/link";
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
import { signup } from "@/lib/server_actions/auth_actions";
// import { signup } from "@/lib/auth-actions";

// username: string! @unique
// displayName: string!
// email: String! @unique
// fname: string!
// lname: string!
// dob: string!
// registeredAt: BigInt!
// auth: String!
// aboutme: String
// ig: String

//Implement a zod validator for all the fields on this form except for the date input
//I need to search the DB for uniqueness for username in the validation
const signupSchema = z.object({
  displayName: z.string().min(1),
  username: z.string().min(1),
  date: z.string().min(1),
  auth: z.string().min(1),
});

//The fields on this form may need to be conditional based on the user's OAuth provider
//For example, if the user signs up with Instagram, we will not have an email address
//UserInfo has any because I'm not sure what fields will be passed in depending on the OAuth provider
export default function SignUpForm(userInfo: any) {
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      displayName: "",
      username: "",
      date: "",
      auth: "",
    },
  });

  return (
    <Card className="w-3/4">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            className="space-y-4"
            action={async (formData: FormData) => {
              // Get the date value from the form
              const date = formData.get("date") as string;
              // Validate the date format
              if (
                !date ||
                !/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(date)
              ) {
                form.setError("date", {
                  type: "manual",
                  message: "Please enter a valid date in MM/DD/YYYY format",
                });
                return;
              }
              await signup(formData);
            }}
          >
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
              name="auth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Auth Code (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Auth code" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              Create an account
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
