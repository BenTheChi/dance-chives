"use client";

import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { UserBadge } from "@/components/ui/user-badge";
import { X, Check, ChevronsUpDown, Loader2, Search } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import { UserSearchItem } from "@/types/user";
import { InstagramInput } from "@/components/ui/input";

interface DebouncedSearchMultiUserSelectProps {
  onSearch: (query: string) => Promise<UserSearchItem[]>;
  placeholder?: string;
  onChange: (values: UserSearchItem[]) => void;
  value: UserSearchItem[];
  preexistingUsers?: UserSearchItem[];
  loadPreexistingUsers?: () => Promise<UserSearchItem[]>;
  name: string;
  label?: string;
  labelColor?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  debounceDelay?: number;
  context?: {
    role?: string;
    eventId?: string;
    sectionId?: string;
    videoId?: string;
  };
  onCreateUnclaimedUser?: (
    displayName: string,
    instagram: string
  ) => Promise<UserSearchItem | null>;
}

const getItemId = (item: UserSearchItem) => item.id || item.username;

export function DebouncedSearchMultiUserSelect({
  onSearch,
  placeholder = "Search...",
  onChange,
  value,
  preexistingUsers,
  loadPreexistingUsers,
  name,
  label,
  labelColor = "text-white",
  className,
  disabled = false,
  required = false,
  debounceDelay = 300,
  context,
  onCreateUnclaimedUser,
}: DebouncedSearchMultiUserSelectProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [addFormOpen, setAddFormOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIg, setNewIg] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string>("");

  const debouncedValue = useDebounce(inputValue, debounceDelay);

  const [preexistingSet, setPreexistingSet] = useState<Set<string>>(
    () => new Set((preexistingUsers || []).map((u) => getItemId(u)))
  );

  useEffect(() => {
    setPreexistingSet(
      new Set((preexistingUsers || []).map((u) => getItemId(u)))
    );
  }, [preexistingUsers]);

  useEffect(() => {
    if (!preexistingUsers && loadPreexistingUsers) {
      loadPreexistingUsers()
        .then((users) => {
          if (users) {
            setPreexistingSet(new Set(users.map((u) => getItemId(u))));
          }
        })
        .catch(() => {
          // non-fatal
        });
    }
  }, [preexistingUsers, loadPreexistingUsers]);

  const deduplicatedValue = useMemo(() => {
    const seen = new Map<string, UserSearchItem>();
    value.forEach((item) => {
      const itemId = getItemId(item);
      if (!seen.has(itemId)) {
        seen.set(itemId, item);
      }
    });
    return Array.from(seen.values());
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Check if click is outside the component
      // Don't close if clicking on Radix UI Select dropdown (it uses a portal)
      const isWithinComponent = target.closest(".debounced-search-multi-user-select");
      const isSelectContent = target.closest("[data-slot='select-content']");
      
      // Only close if click is truly outside both this component and any Select dropdowns
      if (!isWithinComponent && !isSelectContent) {
        setOpen(false);
        setSelectedValue("");
      }
    };

    // Use capture phase to catch events before they're stopped by stopPropagation
    document.addEventListener("mousedown", handleClickOutside, true);
    return () => document.removeEventListener("mousedown", handleClickOutside, true);
  }, []);

  useEffect(() => {
    const fetchItems = async () => {
      if (debouncedValue.trim()) {
        setIsLoading(true);
        try {
          const results = await onSearch(debouncedValue);
          setSearchResults(results || []);
        } catch (error) {
          console.error("Error fetching items:", error);
          setSearchResults([]);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    };

    fetchItems();
  }, [debouncedValue, onSearch]);

  const handleSelect = (item: UserSearchItem) => {
    const itemId = getItemId(item);
    const isSelected = deduplicatedValue.some((v) => getItemId(v) === itemId);
    if (isSelected) {
      onChange(deduplicatedValue.filter((v) => getItemId(v) !== itemId));
    } else {
      const newValue = [...deduplicatedValue, item];
      const deduped = Array.from(
        new Map(newValue.map((v) => [getItemId(v), v])).values()
      );
      onChange(deduped);
    }
    setInputValue("");
  };

  const removeItem = (itemId: string) => {
    onChange(deduplicatedValue.filter((v) => getItemId(v) !== itemId));
  };

  const claimedResults = searchResults.filter((r) => r.claimed !== false);
  const unclaimedResults = searchResults.filter((r) => r.claimed === false);

  const handleCreateUnclaimed = async () => {
    if (!onCreateUnclaimedUser) {
      toast.error("Creation not supported");
      return;
    }
    const displayName = newName.trim();
    const instagram = newIg.trim();
    if (!displayName || !instagram) {
      toast.error("Name and Instagram are required");
      return;
    }
    setConfirmLoading(true);
    try {
      const user = await onCreateUnclaimedUser(displayName, instagram);
      if (!user) {
        toast.error("Failed to create account");
        return;
      }
      onChange([...deduplicatedValue, user]);
      setAddFormOpen(false);
      setNewName("");
      setNewIg("");
      toast.success(`${displayName} @${instagram} created`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create account"
      );
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  const confirmDescription = (
    <>
      Once created, this unclaimed profile cannot be deleted or updated without
      admin support or until the profile is claimed.
      <br />
      <br />
      {context?.role ? (
        <>
          Are you sure the instagram handle{" "}
          <span className="text-secondary-light">{newIg}</span> is the same person
          as the{" "}
          <span className="text-secondary-light">{context.role}</span> in
          this{" "}
          {context?.videoId
            ? "video"
            : context?.sectionId
            ? "section"
            : context?.eventId
            ? "event"
            : "context"}
          ?
        </>
      ) : (
        <>
          Does this Instagram person{" "}
          <span className="text-secondary-light">{newIg}</span> appear in this{" "}
          {context?.videoId
            ? "video"
            : context?.sectionId
            ? "section"
            : context?.eventId
            ? "event"
            : "context"}
          ?
        </>
      )}
    </>
  );

  return (
    <div
      className={cn(
        "flex flex-col debounced-search-multi-user-select",
        className
      )}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {label && (
        <label className={cn("text-sm font-medium block", labelColor)}>
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-1 mb-2">
        {deduplicatedValue.map((item) => {
          const itemId = getItemId(item);
          const isPreexisting = preexistingSet.has(itemId);
          return (
            <UserBadge
              key={itemId}
              username={item.username}
              displayName={item.displayName}
              instagram={item.instagram}
              claimed={item.claimed}
              avatar={item.avatar}
              image={item.image}
              onRemove={isPreexisting ? undefined : () => removeItem(itemId)}
            />
          );
        })}
      </div>
      <div className="relative w-full">
        <div className="flex items-center border rounded-sm bg-neutral-300">
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50 text-black" />
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
              setSelectedValue("");
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            className="border-0 p-2 shadow-none focus-visible:ring-0 flex-1 bg-neutral-300"
            disabled={disabled}
          />
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin opacity-50" />
          ) : (
            <ChevronsUpDown
              className="mr-2 h-4 w-4 shrink-0 opacity-50 cursor-pointer text-black"
              onClick={() => {
                setOpen(!open);
                setSelectedValue("");
              }}
            />
          )}
        </div>
        {open && (
          <div className="absolute z-50 w-full mt-1 bg-neutral-300 border rounded-sm shadow-lg">
            <Command
              className="bg-neutral-300"
              value={selectedValue}
              onValueChange={setSelectedValue}
            >
              <CommandList
                onMouseLeave={() => setSelectedValue("")}
                className="overflow-y-scroll max-h-[200px]"
              >
                {claimedResults.length === 0 &&
                unclaimedResults.length === 0 &&
                !isLoading ? (
                  <CommandEmpty>No results found.</CommandEmpty>
                ) : (
                  <>
                    {claimedResults.length > 0 && (
                      <CommandGroup heading="Verified Accounts">
                        {claimedResults.map((item, index) => {
                          const itemId = getItemId(item);
                          const isSelected = deduplicatedValue.some(
                            (v) => getItemId(v) === itemId
                          );
                          return (
                            <CommandItem
                              key={`${itemId}-claimed-${index}`}
                              value={`${itemId}-claimed`}
                              onSelect={() => handleSelect(item)}
                              onMouseEnter={() =>
                                setSelectedValue(`${itemId}-claimed`)
                              }
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.displayName} @
                              {item.instagram ?? item.username}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                    {unclaimedResults.length > 0 && (
                      <CommandGroup heading="Unclaimed Accounts">
                        {unclaimedResults.map((item, index) => {
                          const itemId = getItemId(item);
                          const isSelected = deduplicatedValue.some(
                            (v) => getItemId(v) === itemId
                          );
                          return (
                            <CommandItem
                              key={`${itemId}-unclaimed-${index}`}
                              value={`${itemId}-unclaimed`}
                              onSelect={() => handleSelect(item)}
                              onMouseEnter={() =>
                                setSelectedValue(`${itemId}-unclaimed`)
                              }
                              className="italic"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  isSelected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {item.displayName} @
                              {item.instagram || item.username}
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </>
                )}
              </CommandList>
              <div className="border-t border-neutral-400 p-2">
                {addFormOpen ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                      <InstagramInput
                        value={newIg}
                        onChange={(e) => setNewIg(e.target.value)}
                        placeholder="Instagram"
                      />
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAddFormOpen(false);
                          setNewName("");
                          setNewIg("");
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setConfirmOpen(true)}
                        disabled={!newName.trim() || !newIg.trim()}
                      >
                        Create
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => setAddFormOpen(true)}
                  >
                    + Add Account
                  </Button>
                )}
              </div>
            </Command>
          </div>
        )}
      </div>
      <input
        type="hidden"
        name={name}
        value={JSON.stringify(deduplicatedValue)}
        required={required}
        disabled={disabled}
      />
      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleCreateUnclaimed}
        loading={confirmLoading}
        title="Confirm new unclaimed profile"
        description={confirmDescription}
        confirmLabel="Confirm"
        cancelLabel="Cancel"
      />
    </div>
  );
}
