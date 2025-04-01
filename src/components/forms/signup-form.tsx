import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

//The fields on this form may need to be conditional based on the user's OAuth provider
//For example, if the user signs up with Instagram, we will not have an email address
//UserInfo has any because I'm not sure what fields will be passed in depending on the OAuth provider
export default function SignUpForm(userInfo: any) {
  return (
    <Card className="w-3/4">
      <CardHeader>
        <CardTitle className="text-xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action="">
          <div className="grid gap-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="display-name">Display Name</Label>
                <Input
                  name="display-name"
                  id="display-name"
                  placeholder="Will be displayed publicly. Can be changed."
                  required
                />
              </div>
            </div>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  name="username"
                  id="username"
                  placeholder="Unique identifier. Cannot change."
                  required
                />
              </div>
            </div>
            {/* <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div> */}

            <Button formAction="" type="submit" className="w-full">
              Create an account
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
