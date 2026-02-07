import { PageSkeleton } from "@/components/PageSkeleton";

export default function WatchLoading() {
  return (
    <div className="flex flex-col justify-center items-center bg-black h-full w-full">
      <PageSkeleton />
    </div>
  );
}
