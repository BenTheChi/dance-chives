import Link from "next/link";
import { ReportLink } from "./report/ReportLink";
import { MaintenanceLink } from "./MaintenanceLink";

export function Footer({ className }: { className?: string }) {
  return (
    <footer
      className={`bg-primary border-t-4 border-primary-light relative z-10 ${
        className || ""
      }`}
    >
      <div>
        <div className="flex flex-col-reverse md:flex-row justify-between gap-6 flex-1">
          {/* Links Section - Left Side */}
          <div className="flex flex-col gap-4 items-center w-full pb-6 md:pt-6 flex-1">
            <h2>Quick Links</h2>
            <nav className="grid grid-cols-3 gap-6">
              <MaintenanceLink
                href="/events"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Events
              </MaintenanceLink>
              <MaintenanceLink
                href="/calendar"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Calendar
              </MaintenanceLink>
              <MaintenanceLink
                href="/profiles"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Community
              </MaintenanceLink>
              <MaintenanceLink
                href="/search"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Search
              </MaintenanceLink>
              <MaintenanceLink
                href="/help"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                FAQ
              </MaintenanceLink>
              <ReportLink className="text-primary-light hover:text-white transition-colors text-xl text-left cursor-pointer">
                Report
              </ReportLink>
            </nav>
            {/* Policy Links */}
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <MaintenanceLink
                href="/terms"
                className="text-primary-light/80 hover:text-white transition-colors text-xs"
              >
                Terms of Service
              </MaintenanceLink>
              <MaintenanceLink
                href="/privacy"
                className="text-primary-light/80 hover:text-white transition-colors text-xs"
              >
                Privacy Policy
              </MaintenanceLink>
              <MaintenanceLink
                href="/content-usage"
                className="text-primary-light/80 hover:text-white transition-colors text-xs"
              >
                Content Usage Policy
              </MaintenanceLink>
            </div>
          </div>

          {/* Newsletter Signup - Right Side */}
          <div className="flex flex-col bg-secondary-dark flex-1 border-b-4 md:border-l-4 border-primary-light md:border-b-0">
            <div className="ml-embedded" data-form="op8sua"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
