import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-primary border-t-4 border-primary-light">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="flex flex-col md:flex-row justify-between gap-8">
          {/* Links Section - Left Side */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white mb-2">Quick Links</h3>
            <nav className="flex flex-col gap-3">
              <Link
                href="/events"
                className="text-primary-light hover:text-white transition-colors font-medium"
              >
                Events
              </Link>
              <Link
                href="/calendar"
                className="text-primary-light hover:text-white transition-colors font-medium"
              >
                Calendar
              </Link>
              <Link
                href="/profiles"
                className="text-primary-light hover:text-white transition-colors font-medium"
              >
                Community
              </Link>
              <Link
                href="/search"
                className="text-primary-light hover:text-white transition-colors font-medium"
              >
                Search
              </Link>
              <Link
                href="/faq"
                className="text-primary-light hover:text-white transition-colors font-medium"
              >
                FAQ
              </Link>
            </nav>
          </div>

          {/* Newsletter Signup - Right Side */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white mb-2">Stay Updated</h3>
            <div className="bg-charcoal border-4 border-primary-light shadow-[6px_6px_0_0_var(--primary-color-light)] p-6 max-w-md">
              <p className="text-primary-light text-lg font-bold mb-4">
                Newsletter Signup Placeholder
              </p>
              <p className="text-primary-light text-sm">
                Subscribe to get updates about new features and events.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
