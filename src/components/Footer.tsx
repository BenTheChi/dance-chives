import Link from "next/link";
import { ReportLink } from "./report/ReportLink";

export function Footer() {
  return (
    <footer className="bg-primary border-t-4 border-primary-light relative z-10 mt-6">
      <div>
        <div className="flex flex-col-reverse md:flex-row justify-between gap-6 flex-1">
          {/* Links Section - Left Side */}
          <div className="flex flex-col gap-4 items-center w-full pb-6 md:pt-6 flex-1">
            <h2>Quick Links</h2>
            <nav className="grid grid-cols-3 gap-6">
              <Link
                href="/events"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Events
              </Link>
              <Link
                href="/calendar"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Calendar
              </Link>
              <Link
                href="/profiles"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Community
              </Link>
              <Link
                href="/search"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                Search
              </Link>
              <Link
                href="/faq"
                className="text-primary-light hover:text-white transition-colors text-xl"
              >
                FAQ
              </Link>
              <ReportLink className="text-primary-light hover:text-white transition-colors text-xl text-left cursor-pointer">
                Report
              </ReportLink>
            </nav>
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
