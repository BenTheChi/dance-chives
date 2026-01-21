"use client";

export default function TermsPage() {
  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">TERMS OF SERVICE</h1>

        {/* Section 1: Acceptance of Terms */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            1. Acceptance of Terms
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Welcome to Dance Chives. By accessing or using dancechives.com
              (the "Site"), you agree to be bound by these Terms of Service
              ("Terms"). If you do not agree to these Terms, you may not access
              or use the Site.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and
              Dance Chives ("we," "our," or "us"). We reserve the right to
              modify these Terms at any time. Your continued use of the Site
              after changes are posted constitutes acceptance of the modified
              Terms.
            </p>
          </div>
        </section>

        {/* Section 2: Description of Service */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            2. Description of Service
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Dance Chives is a community-driven platform that aggregates,
              organizes, and shares dance videos from YouTube and other video
              platforms. The Site offers both free and premium subscription
              features ("Service"). We provide tools for users to discover,
              save, comment on, and organize dance content.
            </p>
          </div>
        </section>

        {/* Section 3: Account Registration and Security */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            3. Account Registration and Security
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">3.1 Account Creation</h3>
            <p>
              To access certain features of the Site, you must create an account
              using either Google OAuth or Magic Link email authentication. You
              agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your account credentials</li>
              <li>
                Notify us immediately of any unauthorized use of your account
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.2 Account Eligibility
            </h3>
            <p>
              You must be at least 13 years old to create an account. By
              creating an account, you represent that you are at least 13 years
              of age. We do not knowingly collect information from children
              under 13. If we become aware that a user is under 13, we will
              terminate the account and delete associated information.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3.3 Account Termination
            </h3>
            <p>
              We reserve the right to suspend or terminate your account at any
              time for violation of these Terms, illegal activity, or other
              conduct we deem harmful to the Site or other users. You may also
              terminate your account at any time through your account settings.
            </p>
          </div>
        </section>

        {/* Section 4: User Responsibilities and Acceptable Use */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            4. User Responsibilities and Acceptable Use
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">
              4.1 Prohibited Conduct
            </h3>
            <p>You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Violate any applicable laws, regulations, or third-party rights
              </li>
              <li>
                Upload, post, or share content that is illegal, harmful,
                threatening, abusive, harassing, defamatory, vulgar, obscene,
                invasive of privacy, hateful, or racially or ethnically
                objectionable
              </li>
              <li>
                Impersonate any person or entity or misrepresent your
                affiliation with any person or entity
              </li>
              <li>
                Upload or share content that infringes intellectual property
                rights, including copyrighted videos, music, or images
              </li>
              <li>Engage in spam, phishing, or other deceptive practices</li>
              <li>
                Attempt to gain unauthorized access to the Site, other accounts,
                or computer systems
              </li>
              <li>
                Use automated tools (bots, scrapers) to access or collect data
                from the Site without permission
              </li>
              <li>
                Interfere with or disrupt the Site's functionality or servers
              </li>
              <li>Harass, bully, or threaten other users</li>
              <li>
                Share sexually explicit content or content that exploits minors
              </li>
              <li>Promote violence, terrorism, or illegal activities</li>
              <li>
                Manipulate or artificially inflate metrics (views, likes,
                comments)
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              4.2 Content Standards
            </h3>
            <p>All user-generated content must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Comply with all applicable laws and regulations</li>
              <li>Respect intellectual property rights of others</li>
              <li>Be relevant to the dance community and the Site's purpose</li>
              <li>
                Maintain a respectful and constructive tone in community
                interactions
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              4.3 Reporting Violations
            </h3>
            <p>
              If you encounter content or behavior that violates these Terms,
              please report it to us at{" "}
              <a
                href="mailto:reports@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                reports@dancechives.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* Section 5: Intellectual Property Rights */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            5. Intellectual Property Rights
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">5.1 Site Content</h3>
            <p>
              The Site and its original content (excluding user-generated
              content and third-party embedded content), features, and
              functionality are owned by Dance Chives and are protected by
              copyright, trademark, and other intellectual property laws. You
              may not reproduce, distribute, modify, or create derivative works
              without our express written permission.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              5.2 User-Generated Content
            </h3>
            <p>
              You retain ownership of any content you post on the Site. However,
              by creating an account and posting content, you grant Dance Chives
              a non-exclusive, worldwide, royalty-free, transferable,
              sublicensable license to use, reproduce, distribute, display,
              perform, and create derivative works from your content in
              connection with operating, promoting, and improving the Site.
            </p>
            <p>You represent and warrant that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You own or have necessary rights to all content you post</li>
              <li>
                Your content does not violate any third-party rights or
                applicable laws
              </li>
              <li>
                You have obtained all necessary permissions for any content
                featuring identifiable individuals
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              5.3 Third-Party Content
            </h3>
            <p>
              The Site aggregates videos from YouTube and other platforms. All
              such third-party content remains the property of its respective
              owners and is subject to their terms and licenses. We claim no
              ownership over third-party content displayed on the Site.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              5.4 Copyright Infringement and DMCA
            </h3>
            <p>
              We respect intellectual property rights and comply with the
              Digital Millennium Copyright Act (DMCA). We will respond to valid
              copyright infringement notices and maintain a policy for
              terminating repeat infringers.
            </p>
            <p className="font-semibold mt-4">Filing a DMCA Takedown Notice:</p>
            <p>
              If you believe your copyrighted work has been used
              inappropriately, please contact our designated DMCA agent at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>{" "}
              with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your contact information</li>
              <li>Description of the copyrighted work</li>
              <li>
                Location of the infringing material on the Site (specific URL)
              </li>
              <li>
                A statement that you have a good faith belief the use is
                unauthorized
              </li>
              <li>
                A statement that your notice is accurate and, under penalty of
                perjury, that you are authorized to act on behalf of the
                copyright owner
              </li>
              <li>Your physical or electronic signature</li>
            </ul>
            <p className="font-semibold mt-4">DMCA Counter-Notice:</p>
            <p>
              If you believe content was removed in error, you may file a
              counter-notice with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your contact information and physical address</li>
              <li>
                Identification of the removed content and its former location
              </li>
              <li>
                A statement under penalty of perjury that you believe the
                content was removed in error
              </li>
              <li>Consent to jurisdiction in your district</li>
              <li>Your physical or electronic signature</li>
            </ul>
            <p className="font-semibold mt-4">Repeat Infringer Policy:</p>
            <p>
              We will terminate accounts of users who repeatedly infringe
              copyrights, as determined in our sole discretion.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              5.5 Content Removal Requests
            </h3>
            <p>
              If you are a content creator or rights holder and would like your
              content removed from or properly attributed on the Site, we will
              gladly accommodate your request. Please contact us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>{" "}
              with details about the content in question. We are committed to
              working cooperatively with creators and rights holders.
            </p>
          </div>
        </section>

        {/* Section 6: Third-Party Embedded Content and YouTube */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            6. Third-Party Embedded Content and YouTube
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">
              6.1 YouTube Embeds and Data Collection
            </h3>
            <p>
              Dance Chives aggregates and displays videos from YouTube using
              official embed functionality and publicly available APIs. Our use
              of YouTube content includes:
            </p>
            <p className="font-semibold mt-4">Data We Collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>YouTube video URLs provided by users</li>
              <li>
                Video metadata obtained through YouTube's public oEmbed API (no
                API key required), including:
                <ul className="list-disc list-inside space-y-1 ml-6 mt-2">
                  <li>Video titles</li>
                  <li>Thumbnail images</li>
                  <li>Author/channel names</li>
                  <li>Provider information</li>
                </ul>
              </li>
              <li>
                User-provided metadata (video type, tagged dancers, event
                information, styles, choreographers)
              </li>
            </ul>
            <p className="font-semibold mt-4">How Videos Are Displayed:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Thumbnail images are loaded from YouTube's thumbnail service
                (img.youtube.com, i.ytimg.com)
              </li>
              <li>
                Videos are embedded using YouTube's official iframe player
              </li>
              <li>
                Videos load only when users actively choose to watch them
                (lightbox/modal display)
              </li>
              <li>
                We do not host, store, download, or redistribute video files
              </li>
              <li>
                We do not alter, manipulate, or circumvent YouTube's player or
                monetization features
              </li>
            </ul>
            <p className="font-semibold mt-4">URL Formats Supported:</p>
            <p>
              We accept videos from multiple YouTube URL formats, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>youtube.com/watch?v=...</li>
              <li>youtu.be/...</li>
              <li>youtube.com/embed/...</li>
              <li>youtube.com/shorts/...</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.2 Video Availability
            </h3>
            <p>
              Videos displayed on the Site may become unavailable at any time
              if:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>The original uploader removes or restricts the video</li>
              <li>
                The video is taken down for violating the platform's policies
              </li>
              <li>Embedding permissions are revoked by the uploader</li>
            </ul>
            <p>
              We are not responsible for the availability, accuracy, or legality
              of third-party embedded content.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.3 Creator Attribution and Credit
            </h3>
            <p>
              We make reasonable efforts to properly attribute video content to
              original creators and organizers. Video metadata displayed on the
              Site includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Channel name from YouTube</li>
              <li>Instagram link to creator's page</li>
              <li>Website link to creator's page</li>
              <li>Facebook link to creator's page</li>
              <li>
                User-provided attribution (event organizers, choreographers,
                dancers, teachers)
              </li>
            </ul>
            <p>If you are a content creator and would like to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Request proper attribution or credit</li>
              <li>Update how your content is displayed</li>
              <li>Request removal of your content from our database</li>
              <li>Assume ownership of the event</li>
              <li>Partner with Dance Chives</li>
            </ul>
            <p>
              Please contact us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>
              . We are committed to supporting the dance community and working
              collaboratively with content creators.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              6.4 Compliance with Platform Terms
            </h3>
            <p>
              By using Dance Chives, you also agree to comply with the terms of
              service of any third-party platforms whose content is embedded on
              the Site, including but not limited to YouTube's Terms of Service
              (
              <a
                href="https://www.youtube.com/t/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-light hover:text-white underline"
              >
                https://www.youtube.com/t/terms
              </a>
              ).
            </p>
            <p className="font-semibold mt-4">
              Important YouTube Requirements:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                All embedded videos remain subject to YouTube's Terms of Service
              </li>
              <li>
                YouTube reserves the right to restrict or terminate access to
                their content at any time
              </li>
              <li>
                We do not circumvent, remove, or alter any technical protection
                measures, monetization features, or attribution implemented by
                YouTube
              </li>
              <li>
                Users must comply with YouTube's Terms when interacting with
                embedded content
              </li>
            </ul>
          </div>
        </section>

        {/* Section 7: Content Moderation and Reporting */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            7. Content Moderation and Reporting
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">
              7.1 Content Moderation Policy
            </h3>
            <p>
              We strive to maintain a safe, respectful community. We reserve the
              right to review, monitor, and remove content or suspend accounts
              that violate these Terms, even without a user report. However, we
              are not obligated to moderate all content and do not pre-screen
              user submissions.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              7.2 Reporting Violations
            </h3>
            <p>
              If you encounter content or behavior that violates these Terms,
              including harassment, illegal content, copyright infringement, or
              spam, please report it to us at{" "}
              <a
                href="mailto:reports@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                reports@dancechives.com
              </a>{" "}
              or through the in-platform reporting mechanism.
            </p>
            <p>Include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Link to the violating content</li>
              <li>Description of the violation</li>
              <li>Screenshot if applicable</li>
              <li>Any relevant context or evidence</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              7.3 Response and Removal
            </h3>
            <p>
              We will review reports and take appropriate action, which may
              include:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Warning the user</li>
              <li>Removing the content</li>
              <li>Suspending or terminating the account</li>
              <li>Reporting to law enforcement (if illegal activity)</li>
            </ul>
            <p>
              We aim to respond to reports within 48-72 hours, though response
              times may vary based on report volume and severity.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              7.4 Appeals Process
            </h3>
            <p>
              If your content was removed or your account was suspended, you may
              appeal by contacting{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>{" "}
              with:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your account information</li>
              <li>The content or action in question</li>
              <li>Explanation of why you believe the action was in error</li>
            </ul>
            <p>
              We will review appeals within 5-7 business days and provide a
              response.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              7.5 No Liability for User Content
            </h3>
            <p>
              We are not responsible for user-generated content and do not
              endorse any opinions, recommendations, or advice expressed by
              users. The views expressed in user content do not reflect the
              views of Dance Chives.
            </p>
          </div>
        </section>

        {/* Section 10: Disclaimers and Limitation of Liability */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            10. Disclaimers and Limitation of Liability
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">10.1 "AS IS" Basis</h3>
            <p className="uppercase font-semibold">
              THE SITE AND SERVICE ARE PROVIDED ON AN "AS IS" AND "AS AVAILABLE"
              BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED,
              INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY,
              FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              10.2 No Guarantee of Availability
            </h3>
            <p>We do not warrant that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                The Site will be uninterrupted, timely, secure, or error-free
              </li>
              <li>
                The results obtained from using the Site will be accurate or
                reliable
              </li>
              <li>Any errors in the Site will be corrected</li>
              <li>The Site will meet your requirements or expectations</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              10.3 Third-Party Content Disclaimer
            </h3>
            <p>
              We are not responsible for the accuracy, legality, or
              appropriateness of third-party content aggregated from YouTube or
              other platforms. The views expressed in user-generated content do
              not represent the views of Dance Chives.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              10.4 Limitation of Liability
            </h3>
            <p className="uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DANCE CHIVES, ITS
              OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE
              FOR:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 uppercase">
              <li>
                Any indirect, incidental, special, consequential, or punitive
                damages
              </li>
              <li>
                Loss of profits, data, use, goodwill, or other intangible losses
              </li>
              <li>
                Damages resulting from your use or inability to use the Site
              </li>
              <li>
                Unauthorized access to or alteration of your content or data
              </li>
              <li>Statements or conduct of any third party on the Site</li>
              <li>Any interactions, disputes, or transactions between users</li>
              <li>
                Any events, meetups, or real-world interactions organized
                through the Site
              </li>
              <li>Any other matter relating to the Site or Service</li>
            </ul>
            <p className="uppercase font-semibold mt-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID
              US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED
              DOLLARS ($100), WHICHEVER IS GREATER.
            </p>
            <p>
              Some jurisdictions do not allow the exclusion of certain
              warranties or limitation of liability for certain types of
              damages, so some of the above limitations may not apply to you.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              10.5 Force Majeure
            </h3>
            <p>
              We shall not be liable for any failure or delay in performance due
              to circumstances beyond our reasonable control, including but not
              limited to acts of God, natural disasters, war, terrorism, riots,
              embargoes, acts of civil or military authorities, fire, floods,
              accidents, pandemics, network infrastructure failures, strikes, or
              shortages of transportation, facilities, fuel, energy, labor, or
              materials.
            </p>
          </div>
        </section>

        {/* Section 11: Indemnification */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            11. Indemnification
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              You agree to indemnify, defend, and hold harmless Dance Chives,
              its affiliates, officers, directors, employees, and agents from
              any claims, liabilities, damages, losses, costs, or expenses
              (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your use of the Site</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your content posted on the Site</li>
              <li>
                Any claims that your content caused damage to a third party
              </li>
            </ul>
          </div>
        </section>

        {/* Section 12: Privacy and Data Security */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            12. Privacy and Data Security
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">12.1 Privacy Policy</h3>
            <p>
              Your use of the Site is also governed by our Privacy Policy, which
              is incorporated into these Terms by reference. Please review our
              Privacy Policy to understand our data practices.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              12.2 Data Export and Portability
            </h3>
            <p>
              You may request a copy of your personal data in a portable format
              by contacting us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>
              . We will provide your data within a reasonable timeframe as
              required by applicable law.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              12.3 Account Deletion and Data Retention
            </h3>
            <p>
              Upon account deletion, we will delete or anonymize your personal
              information within 30-90 days, except where we are required to
              retain it for legal, regulatory, or legitimate business purposes.
              User-generated content may remain visible on the Site but will be
              dissociated from your account.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              12.4 Security Breach Notification
            </h3>
            <p>
              In the event of a data breach that may compromise your personal
              information, we will notify affected users as required by
              applicable law, typically within 72 hours of discovering the
              breach.
            </p>
          </div>
        </section>

        {/* Section 13: Dispute Resolution */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            13. Dispute Resolution
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">13.1 Governing Law</h3>
            <p>
              These Terms shall be governed by and construed in accordance with
              the laws of the State of Washington, without regard to its
              conflict of law provisions.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              13.2 Jurisdiction and Venue
            </h3>
            <p>
              You agree that any legal action or proceeding relating to these
              Terms or your use of the Site shall be brought exclusively in the
              state or federal courts located in King County, Washington. You
              consent to the personal jurisdiction of such courts and waive any
              objection to venue in such courts.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              13.3 Informal Resolution
            </h3>
            <p>
              Before filing any legal action, you agree to first contact us at{" "}
              <a
                href="mailto:support@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                support@dancechives.com
              </a>{" "}
              to attempt to resolve the dispute informally. We commit to working
              with you in good faith to reach a fair resolution.
            </p>
          </div>
        </section>

        {/* Section 14: Changes and Modifications */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            14. Changes and Modifications
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">
              14.1 Modifications to Terms
            </h3>
            <p>
              We reserve the right to modify these Terms at any time. We will
              notify users of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Posting the updated Terms on the Site with a new "Last Updated"
                date
              </li>
              <li>
                Sending an email notification to your registered email address
                (for significant changes)
              </li>
              <li>Displaying a prominent notice on the Site</li>
            </ul>
            <p>
              Your continued use of the Site after changes take effect
              constitutes acceptance of the modified Terms. If you do not agree
              to the changes, you must stop using the Site and may delete your
              account.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              14.2 Modifications to the Site
            </h3>
            <p>We reserve the right to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Modify, suspend, or discontinue any feature or functionality of
                the Site at any time
              </li>
              <li>Change the scope or availability of premium features</li>
              <li>Limit or restrict access to certain parts of the Site</li>
            </ul>
            <p>
              We will make reasonable efforts to notify users of significant
              changes, but we are not obligated to do so.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              14.3 Service Discontinuation
            </h3>
            <p>
              If we decide to permanently discontinue the Site, we will provide
              at least 30 days' notice and information about accessing or
              exporting your data.
            </p>
          </div>
        </section>

        {/* Section 15: General Provisions */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            15. General Provisions
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">
              15.1 Geographic Availability
            </h3>
            <p>
              The Site is operated from the United States and is intended for
              users worldwide. However, certain features or content may be
              restricted in specific jurisdictions. We make no representation
              that the Site is appropriate or available for use in all
              locations.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              15.2 Entire Agreement
            </h3>
            <p>
              These Terms, together with the Privacy Policy, constitute the
              entire agreement between you and Dance Chives regarding the Site.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              15.3 Severability
            </h3>
            <p>
              If any provision of these Terms is found to be unenforceable, the
              remaining provisions will remain in full effect.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">15.4 Waiver</h3>
            <p>
              Our failure to enforce any right or provision of these Terms will
              not be considered a waiver of those rights.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">15.5 Assignment</h3>
            <p>
              You may not assign or transfer these Terms without our prior
              written consent. We may assign our rights and obligations without
              restriction.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">15.6 No Agency</h3>
            <p>
              Nothing in these Terms creates any agency, partnership, joint
              venture, or employment relationship between you and Dance Chives.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">15.7 Survival</h3>
            <p>
              Provisions that by their nature should survive termination
              (including indemnification, limitation of liability, and dispute
              resolution) shall survive termination of these Terms.
            </p>
          </div>
        </section>

        {/* Section 16: Contact Information */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            16. Contact Information
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              For questions, concerns, or notices regarding these Terms, please
              contact us at:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                <strong>General Inquiries:</strong>{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>
                <strong>DMCA Agent:</strong>{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>
                <strong>DMCA Address:</strong> 8311 15th Ave NW Unit 321
                Seattle, WA 98117
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
          </div>
        </section>
      </div>
    </>
  );
}
