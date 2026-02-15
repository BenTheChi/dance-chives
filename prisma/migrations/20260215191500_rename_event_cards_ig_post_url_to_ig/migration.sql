-- RenameColumn
ALTER TABLE "event_cards" RENAME COLUMN "igPostUrl" TO "IG";

-- RenameIndex
ALTER INDEX "event_cards_igPostUrl_key" RENAME TO "event_cards_IG_key";
