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
  const [cityIds, setCityIds] = useState<string[]>([]);
  const [allCityAccess, setAllCityAccess] = useState(false);
  const [newCityId, setNewCityId] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  const fetchUserCities = async () => {
    if (!targetUserId) {
      toast.error("Please enter a user ID");
      return;
    }

    setFetching(true);
    try {
      const response = await fetch(`/api/users/${targetUserId}/cities`);
      const data = await response.json();

      if (data.success) {
        setCityIds(data.cities || []);
        setAllCityAccess(data.user.allCityAccess || false);
        toast.success(`Loaded cities for user ${data.user.email}`);
      } else {
        toast.error(data.error || "Failed to fetch user cities");
      }
    } catch (error) {
      console.error("Failed to fetch user cities:", error);
      toast.error("Failed to fetch user cities");
    } finally {
      setFetching(false);
    }
  };

  const handleAddCity = () => {
    if (!newCityId.trim()) {
      toast.error("Please enter a city ID");
      return;
    }

    if (cityIds.includes(newCityId.trim())) {
      toast.error("City already added");
      return;
    }

    setCityIds([...cityIds, newCityId.trim()]);
    setNewCityId("");
  };

  const handleRemoveCity = (cityId: string) => {
    setCityIds(cityIds.filter((id) => id !== cityId));
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
          cityIds,
          allCityAccess,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("User cities updated successfully");
        setCityIds(data.cities || []);
        setAllCityAccess(data.user.allCityAccess || false);
      } else {
        toast.error(data.error || "Failed to update user cities");
      }
    } catch (error) {
      console.error("Failed to update user cities:", error);
      toast.error("Failed to update user cities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      setTargetUserId(userId);
      fetchUserCities();
    }
  }, [userId]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Manage User Cities</CardTitle>
        <CardDescription>
          Update user cities and global edit flag. Only admins can access this
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
              onClick={fetchUserCities}
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
              <Label>Assigned Cities</Label>
              <div className="flex gap-2">
                <Input
                  value={newCityId}
                  onChange={(e) => setNewCityId(e.target.value)}
                  placeholder="Enter city ID"
                  disabled={loading}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCity();
                    }
                  }}
                />
                <Button onClick={handleAddCity} disabled={loading}>
                  Add
                </Button>
              </div>

              {cityIds.length > 0 && (
                <div className="space-y-2 mt-2">
                  {cityIds.map((cityId) => (
                    <div
                      key={cityId}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <span className="text-sm">{cityId}</span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveCity(cityId)}
                        disabled={loading}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {cityIds.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No cities assigned. User will be restricted to their profile
                  city.
                </p>
              )}
            </div>

            <Button
              onClick={handleUpdate}
              disabled={loading || fetching}
              className="w-full"
            >
              {loading ? "Updating..." : "Update User Cities"}
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
