import { cn } from "@/lib/utils";

interface MainContentProps {
  sidebarOpen: boolean;
}

export default function MainContent({ sidebarOpen }: MainContentProps) {
  return (
    <div
      className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        sidebarOpen ? "md:pl-64" : "md:pl-0",
      )}
    ></div>
  );
}
