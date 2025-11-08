"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Checkbox } from "@/components/ui/checkbox";

interface CityManagementCardProps {
  username?: string;
}

export function CityManagementCard({ username }: CityManagementCardProps) {
  const { data: session } = useSession();
  const [targetUsername, setTargetUsername] = useState(username || "");
  const [cityId, setCityId] = useState<string>("");
  const [allCityAccess, setAllCityAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchUserCity = async () => {
    if (!targetUsername) {
      toast.error("Please enter a username");
      return;
    }

    setFetching(true);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(targetUsername)}/cities`);
      const data = await response.json();

      if (data.success) {
        setCityId(data.city || "");
        setAllCityAccess(data.user.allCityAccess || false);
        toast.success(`Loaded city for user ${data.user.email}`);
      } else {
        toast.error(data.error || "Failed to fetch user city");
      }
    } catch (error) {
      console.error("Failed to fetch user city:", error);
      toast.error("Failed to fetch user city");
    } finally {
      setFetching(false);
    }
  };

  const handleUpdate = async () => {
    if (!targetUsername) {
      toast.error("Please enter a username");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(targetUsername)}/cities`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cityId: cityId.trim() || null,
          allCityAccess,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("User city updated successfully");
        setCityId(data.city || "");
        setAllCityAccess(data.user.allCityAccess || false);
      } else {
        toast.error(data.error || "Failed to update user city");
      }
    } catch (error) {
      console.error("Failed to update user city:", error);
      toast.error("Failed to update user city");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (username) {
      setTargetUsername(username);
      fetchUserCity();
    }
  }, [username]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage User City</CardTitle>
        <CardDescription>
          Update user city and global edit flag. Only admins can access this
          feature.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex gap-2">
            <Input
              id="username"
              value={targetUsername}
              onChange={(e) => setTargetUsername(e.target.value)}
              placeholder="Enter username"
              disabled={loading || fetching}
            />
            <Button
              onClick={fetchUserCity}
              disabled={loading || fetching || !targetUsername}
            >
              {fetching ? "Loading..." : "Load"}
            </Button>
          </div>
        </div>

        {targetUsername && (
          <>
            <div className="space-y-2">
              <Label>Can Edit All Cities</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allCityAccess"
                  checked={allCityAccess}
                  onCheckedChange={(checked) =>
                    setAllCityAccess(checked === true)
                  }
                  disabled={loading}
                />
                <label
                  htmlFor="allCityAccess"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Allow user to edit events in all cities (overrides assigned
                  cities)
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assigned City</Label>
              <Input
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                placeholder="Enter city ID"
                disabled={loading}
              />
              <p className="text-sm text-muted-foreground">
                {cityId
                  ? `User will be assigned to city: ${cityId}`
                  : "No city assigned. User will be restricted to their profile city."}
              </p>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={loading || fetching}
              className="w-full"
            >
              {loading ? "Updating..." : "Update User City"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
