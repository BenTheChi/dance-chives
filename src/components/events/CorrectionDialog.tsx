"use client";

import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CitySearchInput } from "@/components/CitySearchInput";
import { StyleMultiSelect } from "@/components/ui/style-multi-select";
import {
  applyCityCorrection,
  applyDateCorrection,
  applyStyleCorrection,
  type DatePrecision,
} from "@/lib/server_actions/contribution_actions";
import { City } from "@/types/city";

/**
 * The correction surfaces a member reaches from a fact's disclosure.
 *
 * Each dialog asks for exactly one fact. That is not a simplification of a
 * bigger form — it is the point: the old path made a stranger open a
 * 1,600-line event form to fix a city, and almost nobody ever did.
 *
 * All three post through the Phase 2 server actions, which enforce auth,
 * write Neo4j before Postgres, and record the prior value so a moderator can
 * put it back. Nothing here needs to re-check permission; the action is the
 * gate.
 */

type CorrectionKind = "city" | "date" | "styles";

interface CorrectionDialogProps {
  eventId: string;
  kind: CorrectionKind | null;
  onClose: () => void;
  /** Current styles, so the multi-select opens on what the event already has. */
  currentStyles?: string[];
}

const TITLES: Record<CorrectionKind, string> = {
  city: "Where was this event?",
  date: "When was this event?",
  styles: "Which styles were danced?",
};

export function CorrectionDialog({
  eventId,
  kind,
  onClose,
  currentStyles = [],
}: CorrectionDialogProps) {
  return (
    <Dialog open={kind !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        {kind ? (
          <>
            <DialogTitle>{TITLES[kind]}</DialogTitle>
            <DialogDescription className="sr-only">
              Correct this event&apos;s {kind}.
            </DialogDescription>

            {kind === "city" ? (
              <CityCorrection eventId={eventId} onDone={onClose} />
            ) : null}
            {kind === "date" ? (
              <DateCorrection eventId={eventId} onDone={onClose} />
            ) : null}
            {kind === "styles" ? (
              <StyleCorrection
                eventId={eventId}
                current={currentStyles}
                onDone={onClose}
              />
            ) : null}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

/** Shared submit/cancel footer, so all three dialogs behave identically. */
function Actions({
  pending,
  disabled,
  onCancel,
}: {
  pending: boolean;
  disabled: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={pending || disabled}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}

function CityCorrection({
  eventId,
  onDone,
}: {
  eventId: string;
  onDone: () => void;
}) {
  // CitySearchInput is react-hook-form bound; a one-field form is the smallest
  // way to reuse it rather than duplicating the Places-backed autocomplete.
  const form = useForm<{ city: City | null }>({ defaultValues: { city: null } });
  const city = useWatch({ control: form.control, name: "city" });
  const [pending, startTransition] = useTransition();

  function submit() {
    if (!city) return;
    startTransition(async () => {
      const result = await applyCityCorrection(eventId, city);
      if (result.status === 200) {
        toast.success("City updated — thank you");
        onDone();
      } else {
        toast.error("error" in result ? result.error : "Could not save that");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <CitySearchInput
        control={form.control}
        name="city"
        label="City"
        value={city}
        onChange={(value) => form.setValue("city", value)}
        placeholder="Search for the city…"
      />
      <Actions pending={pending} disabled={!city} onCancel={onDone} />
    </form>
  );
}

function DateCorrection({
  eventId,
  onDone,
}: {
  eventId: string;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  // How sure the member is, asked outright rather than inferred.
  //
  // A native date input always yields a full Y-M-D, so there is no way to tell
  // "I know it was the 4th" from "I picked a day to get through the form". The
  // difference is the whole signal: recording a guessed day as exact would
  // remove the event from the queue that asks about it, and the archive would
  // never learn the real date. So the question is asked directly.
  const [precision, setPrecision] = useState<DatePrecision>("day");
  const [pending, startTransition] = useTransition();

  function submit() {
    const [year, month, day] = value.split("-");
    if (!year || !month || !day) return;

    startTransition(async () => {
      const result = await applyDateCorrection(
        eventId,
        `${month}/${day}/${year}`,
        precision,
      );
      if (result.status === 200) {
        toast.success("Date updated — thank you");
        onDone();
      } else {
        toast.error("error" in result ? result.error : "Could not save that");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <div className="space-y-2">
        <label htmlFor="correction-date" className="text-sm font-medium">
          Date
        </label>
        <input
          id="correction-date"
          type="date"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full h-10 rounded-sm border-2 border-secondary-light bg-background px-3"
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">How sure are you?</legend>
        {(
          [
            ["day", "That exact day"],
            ["month", "The month is right, not sure of the day"],
            ["year", "Only sure of the year"],
          ] as const
        ).map(([level, label]) => (
          <label key={level} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="date-precision"
              value={level}
              checked={precision === level}
              onChange={() => setPrecision(level)}
            />
            {label}
          </label>
        ))}
        <p className="text-xs text-muted-foreground">
          Saying you&apos;re unsure is genuinely useful — it keeps the event in
          the list of things we still want to pin down.
        </p>
      </fieldset>

      <Actions pending={pending} disabled={!value} onCancel={onDone} />
    </form>
  );
}

function StyleCorrection({
  eventId,
  current,
  onDone,
}: {
  eventId: string;
  current: string[];
  onDone: () => void;
}) {
  const [styles, setStyles] = useState<string[]>(current);
  const [pending, startTransition] = useTransition();

  function submit() {
    startTransition(async () => {
      const result = await applyStyleCorrection(eventId, styles);
      if (result.status === 200) {
        toast.success("Styles updated — thank you");
        onDone();
      } else {
        toast.error("error" in result ? result.error : "Could not save that");
      }
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-4"
    >
      <StyleMultiSelect value={styles} onChange={setStyles} />
      <Actions
        pending={pending}
        disabled={styles.length === 0}
        onCancel={onDone}
      />
    </form>
  );
}
