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
  userId?: string;
}

export function CityManagementCard({ userId }: CityManagementCardProps) {
  const { data: session } = useSession();
  const [targetUserId, setTargetUserId] = useState(userId || "");
  const [cityId, setCityId] = useState<string>("");
  const [allCityAccess, setAllCityAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchUserCity = async () => {
    if (!targetUserId) {
      toast.error("Please enter a user ID");
      return;
    }

    setFetching(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/cities`);
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
    if (!targetUserId) {
      toast.error("Please enter a user ID");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/cities`, {
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
    if (userId) {
      setTargetUserId(userId);
      fetchUserCity();
    }
  }, [userId]);

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
          <Label htmlFor="userId">User ID</Label>
          <div className="flex gap-2">
            <Input
              id="userId"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              placeholder="Enter user ID"
              disabled={loading || fetching}
            />
            <Button
              onClick={fetchUserCity}
              disabled={loading || fetching || !targetUserId}
            >
              {fetching ? "Loading..." : "Load"}
            </Button>
          </div>
        </div>

        {targetUserId && (
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
