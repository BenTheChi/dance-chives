"use client";

export default function PrivacyPage() {
  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">PRIVACY POLICY</h1>

        {/* Introduction Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Introduction
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Welcome to Dance Chives ("we," "our," or "us"). We are committed
              to protecting your privacy and being transparent about how we
              collect, use, and safeguard your personal information. This
              Privacy Policy explains our practices regarding data collection
              and usage on dancechives.com (the "Site").
            </p>
          </div>
        </section>

        {/* Information We Collect Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Information We Collect
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Email address (provided through Google OAuth or Magic Link
                authentication)
              </li>
              <li>
                Display name and profile information you choose to provide
              </li>
              <li>
                Google profile information (if you sign in with Google OAuth)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Automatically Collected Information
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Authentication cookies (necessary for maintaining your logged-in
                session)
              </li>
              <li>
                Log data including IP address, browser type, and access times
              </li>
              <li>
                Usage data such as pages visited, features used, and
                interactions on the Site
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              User-Generated Content
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Videos you add, save, or share (stored as YouTube URLs and
                metadata)
              </li>
              <li>Comments, reviews, and other content you post</li>
              <li>Playlists and collections you create</li>
              <li>Your interactions with other users' content</li>
              <li>
                Metadata you provide about videos (dancer tags, event
                information, styles, choreographers, teachers)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              YouTube Video Data
            </h3>
            <p>
              When you add a YouTube video to the Site, we automatically collect
              limited metadata through YouTube's public oEmbed API (no API key
              required):
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Video title</li>
              <li>Thumbnail image URL</li>
              <li>Channel/author name</li>
              <li>Provider information</li>
            </ul>
            <p className="font-semibold mt-4">We store:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The YouTube video URL you provide</li>
              <li>
                Video metadata from oEmbed (titles are truncated to 60
                characters for display)
              </li>
              <li>
                Video type classifications (battle, freestyle, choreography,
                class, other)
              </li>
              <li>
                User-provided tags and associations (dancers, winners,
                choreographers, teachers, events)
              </li>
            </ul>
            <p className="font-semibold mt-4">We do not:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Download or store actual video files</li>
              <li>Access your YouTube account or viewing history</li>
              <li>Track your YouTube viewing behavior through our embeds</li>
              <li>
                Collect YouTube analytics or user engagement data beyond what
                you explicitly provide
              </li>
            </ul>
          </div>
        </section>

        {/* How We Use Your Information Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            How We Use Your Information
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide, maintain, and improve the Site's functionality</li>
              <li>Authenticate your identity and manage your account</li>
              <li>Enable you to access and use Site features</li>
              <li>Personalize your experience and content recommendations</li>
              <li>Communicate with you about your account and Site updates</li>
              <li>Monitor and analyze Site usage and trends</li>
              <li>
                Detect, prevent, and address technical issues or security
                concerns
              </li>
              <li>Enforce our Terms of Service</li>
              <li>Send promotional communications (with your consent)</li>
            </ul>
          </div>
        </section>

        {/* Data Sharing and Disclosure Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Data Sharing and Disclosure
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              We do not sell, rent, or share your personal information with
              third parties for their marketing purposes.
            </p>
            <p>
              We may share limited information only in the following
              circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Service Providers:</strong> With trusted third-party
                services that help us operate the Site (e.g., hosting providers,
                authentication services like Google OAuth, email service
                providers)
              </li>
              <li>
                <strong>Legal Requirements:</strong> When required by law, court
                order, or governmental authority
              </li>
              <li>
                <strong>Safety and Security:</strong> To protect the rights,
                property, or safety of Dance Chives, our users, or the public
              </li>
              <li>
                <strong>Business Transfers:</strong> In connection with a
                merger, acquisition, or sale of assets (users would be notified
                of any such change)
              </li>
              <li>
                <strong>With Your Consent:</strong> When you explicitly
                authorize us to share your information
              </li>
            </ul>
          </div>
        </section>

        {/* Authentication and Cookies Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Authentication and Cookies
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              We use authentication cookies solely to maintain your logged-in
              session. These cookies are essential for the Site to function
              properly and for your security. We do not use tracking cookies,
              advertising cookies, or third-party analytics cookies beyond what
              is necessary for authentication.
            </p>
            <p className="font-semibold mt-4">Types of Cookies We Use:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Essential Cookies:</strong> Required for authentication
                and security
              </li>
              <li>
                <strong>Functional Cookies:</strong> Remember your preferences
                and settings
              </li>
            </ul>
            <p>
              You can configure your browser to refuse cookies, but this will
              prevent you from using certain features of the Site that require
              authentication.
            </p>
          </div>
        </section>

        {/* Data Security Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Data Security
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              We implement reasonable security measures to protect your personal
              information from unauthorized access, alteration, disclosure, or
              destruction.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Infrastructure and Hosting
            </h3>
            <p>
              Dance Chives uses trusted, enterprise-grade infrastructure
              providers:
            </p>
            <p className="font-semibold mt-4">Vercel (Hosting and Delivery):</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Automatic HTTPS/TLS encryption for all connections</li>
              <li>DDoS protection</li>
              <li>SOC 2 Type II certified</li>
              <li>
                Learn more:{" "}
                <a
                  href="https://vercel.com/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white underline"
                >
                  Vercel Security
                </a>
              </li>
            </ul>
            <p className="font-semibold mt-4">Neo4j Aura (Graph Database):</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption for data in transit and at rest</li>
              <li>SOC 2 Type II and ISO 27001 certified</li>
              <li>Isolated database instances</li>
              <li>
                Learn more:{" "}
                <a
                  href="https://neo4j.com/cloud/aura/security/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white underline"
                >
                  Neo4j Aura Security
                </a>
              </li>
            </ul>
            <p className="font-semibold mt-4">Neon (PostgreSQL Database):</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Encryption at rest using AES-256</li>
              <li>TLS encryption for all connections</li>
              <li>SOC 2 Type II certified</li>
              <li>
                Learn more:{" "}
                <a
                  href="https://neon.tech/docs/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white underline"
                >
                  Neon Security
                </a>
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Security Measures
            </h3>
            <p className="font-semibold">Data Encryption:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                All data transmitted between your device and our servers is
                encrypted using HTTPS/TLS
              </li>
              <li>
                Database data is encrypted at rest by our infrastructure
                providers
              </li>
            </ul>
            <p className="font-semibold mt-4">Authentication:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Secure authentication using Google OAuth or Magic Link email
                authentication
              </li>
              <li>Secure session management with encrypted cookies</li>
              <li>Automatic session expiration after periods of inactivity</li>
            </ul>
            <p className="font-semibold mt-4">Access Control:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Limited access to production systems and databases</li>
              <li>Employee access is logged and monitored</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Security Limitations
            </h3>
            <p>
              However, no method of transmission over the internet or electronic
              storage is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Your Responsibilities
            </h3>
            <p>You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Keeping your login credentials confidential</li>
              <li>Logging out from shared or public devices</li>
              <li>
                Reporting any suspicious activity to{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>
                Maintaining the security of your email account (used for
                authentication)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Security Breach Notification
            </h3>
            <p>
              In the event of a data breach that compromises your personal
              information, we will notify affected users as required by
              applicable law, typically within 72 hours of discovering the
              breach. Notification will be sent to your registered email address
              and may also be posted on the Site.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Contact</h3>
            <p>
              If you have security concerns or discover a vulnerability, please
              contact us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* Your Rights and Choices Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Your Rights and Choices
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Depending on your location, you may have certain rights regarding
              your personal information:
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Data Access and Portability
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Access:</strong> Request a copy of the personal
                information we hold about you
              </li>
              <li>
                <strong>Data Portability:</strong> Request your data in a
                structured, commonly used, and machine-readable format (such as
                JSON or CSV)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Data Management</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or
                incomplete information
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and
                associated personal information
              </li>
              <li>
                <strong>Restriction:</strong> Request restriction of processing
                of your personal information in certain circumstances
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Communication Preferences
            </h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from promotional
                communications (account-related communications may still be
                necessary)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              California Privacy Rights (CCPA/CPRA)
            </h3>
            <p>
              If you are a California resident, you have additional rights
              including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Right to know what personal information we collect, use, and
                share
              </li>
              <li>
                Right to delete personal information (with certain exceptions)
              </li>
              <li>
                Right to opt-out of sale of personal information (we do not sell
                personal information)
              </li>
              <li>
                Right to non-discrimination for exercising your privacy rights
              </li>
              <li>Right to correct inaccurate personal information</li>
              <li>
                Right to limit use and disclosure of sensitive personal
                information
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              European Privacy Rights (GDPR)
            </h3>
            <p>
              If you are in the European Economic Area (EEA) or United Kingdom,
              you have additional rights including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Right to object to processing of your personal information
              </li>
              <li>
                Right to withdraw consent at any time (where processing is based
                on consent)
              </li>
              <li>
                Right to lodge a complaint with your local data protection
                authority
              </li>
              <li>Right to data portability in machine-readable format</li>
            </ul>
            <p>
              To exercise these rights, please contact us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>
              . We will respond to your request within 30 days (or as required
              by applicable law).
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              Verification Process
            </h3>
            <p>
              To protect your privacy and security, we may need to verify your
              identity before processing certain requests. This may include
              asking for additional information to confirm you are the account
              holder.
            </p>
          </div>
        </section>

        {/* Data Retention Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Data Retention
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              We retain your personal information for as long as your account is
              active or as needed to provide you services. If you delete your
              account, we will delete or anonymize your personal information
              within 30-90 days, except where we are required to retain it for:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Legal obligations (tax, accounting, regulatory requirements)
              </li>
              <li>Dispute resolution and enforcement of our agreements</li>
              <li>Prevention of fraud and abuse</li>
              <li>Backup and disaster recovery purposes</li>
            </ul>
            <p>
              User-generated content (events, metadata, Youtube links, NOT user
              profile or account information) may remain visible on the Site
              after account deletion but will be dissociated from your personal
              account information. You may opt in to full event deletion for all
              owned events upon account deletion.
            </p>
          </div>
        </section>

        {/* Third-Party Services Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Third-Party Services
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              The Site integrates with YouTube and other video platforms to
              aggregate and display dance content. When you interact with
              embedded videos or external links, those third-party services may
              collect information according to their own privacy policies.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              YouTube Integration
            </h3>
            <p className="font-semibold">
              Data Collection via YouTube oEmbed API:
            </p>
            <p>
              When you add a YouTube video URL, we use YouTube's public oEmbed
              API endpoint to automatically fetch:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Video title</li>
              <li>Thumbnail image URL</li>
              <li>Channel/author name</li>
              <li>Provider information</li>
            </ul>
            <p>
              This API does not require authentication and does not access your
              YouTube account or viewing history.
            </p>
            <p className="font-semibold mt-4">YouTube Thumbnails:</p>
            <p>
              Video thumbnail images are loaded directly from YouTube's image
              servers (img.youtube.com, i.ytimg.com, ytimg.com) when displaying
              video cards and galleries on the Site.
            </p>
            <p className="font-semibold mt-4">YouTube Embeds:</p>
            <p>
              When you choose to watch a video, we display it using YouTube's
              official iframe embed player. YouTube may collect information
              about your viewing session according to their privacy policy. We
              do not receive or track this viewing data.
            </p>
            <p className="font-semibold mt-4">Supported URL Formats:</p>
            <p>We support multiple YouTube URL formats including:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>youtube.com/watch?v=...</li>
              <li>youtu.be/...</li>
              <li>youtube.com/embed/...</li>
              <li>youtube.com/shorts/...</li>
            </ul>
            <p className="font-semibold mt-4">What We Don't Do:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We do not use the YouTube Data API (no API key)</li>
              <li>We do not download or cache video files</li>
              <li>We do not track your YouTube viewing behavior</li>
              <li>
                We do not access your YouTube account, subscriptions, or watch
                history
              </li>
              <li>We do not collect YouTube analytics or engagement metrics</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Google OAuth</h3>
            <p>
              If you sign in using Google OAuth, we receive limited information
              from Google as authorized by you. Google's use of information
              received from our use of Google APIs will adhere to the{" "}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:text-white underline"
              >
                Google API Services User Data Policy
              </a>
              .
            </p>
            <p className="mt-4">
              We encourage you to review the privacy policies of any third-party
              services you access through the Site:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white underline"
                >
                  YouTube Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="https://policies.google.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white underline"
                >
                  Google Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* Children's Privacy Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Children's Privacy
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              The Site is not intended for children under the age of 13 (or the
              applicable age of consent in your jurisdiction). We do not
              knowingly collect personal information from children. If we become
              aware that we have collected personal information from a child
              without proper consent, we will take steps to delete such
              information within 30 days.
            </p>
            <p>
              If you are a parent or guardian and believe your child has
              provided us with personal information, please contact us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* International Users Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            International Users
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              If you access the Site from outside the United States, please be
              aware that your information may be transferred to, stored, and
              processed in the United States or other countries where our
              service providers operate. By using the Site, you consent to such
              transfer.
            </p>
            <p>
              The data protection laws in the United States may differ from
              those in your country. We will take reasonable steps to ensure
              your data is treated securely and in accordance with this Privacy
              Policy.
            </p>
          </div>
        </section>

        {/* Changes to This Privacy Policy Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Changes to This Privacy Policy
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the new Privacy Policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification (for significant changes)</li>
              <li>Displaying a prominent notice on the Site</li>
            </ul>
            <p>
              Your continued use of the Site after such changes constitutes
              acceptance of the updated Privacy Policy.
            </p>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Contact Us
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              If you have questions, concerns, or requests regarding this
              Privacy Policy or our data practices, please contact us at:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                <strong>Email:</strong>{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>
                <strong>Website:</strong>{" "}
                <a
                  href="https://www.dancechives.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-light hover:text-white underline"
                >
                  https://www.dancechives.com/
                </a>
              </li>
            </ul>
            <p>
              For California residents: You may also contact us at the above
              address to exercise your CCPA rights.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
