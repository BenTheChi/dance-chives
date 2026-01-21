"use client";

export default function ContentUsagePage() {
  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">CONTENT USAGE AND MARKETING POLICY</h1>

        {/* Purpose Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Purpose
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              This Content Usage and Marketing Policy explains how Dance Chives may
              use content posted on the Site for marketing, promotional, and
              operational purposes. By using the Site, you agree to the terms
              outlined in this policy.
            </p>
          </div>
        </section>

        {/* Content License Grant Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Content License Grant
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">
              1. User-Generated Content License
            </h3>
            <p>
              By posting content on Dance Chives (including comments, reviews,
              playlists, profile information, video tags, event information, or any
              other contributions), you retain full ownership of your content.
              However, you grant Dance Chives a non-exclusive, worldwide,
              royalty-free license to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Use, reproduce, display, and distribute your content on the Site and
                in connection with the Service
              </li>
              <li>
                Share your content on our social media channels and in marketing
                materials (newsletters, blog posts, promotional campaigns,
                advertisements)
              </li>
              <li>
                Modify your content for technical purposes (resizing, formatting,
                excerpting) or to comply with platform requirements
              </li>
              <li>
                Create compilations or features that include your content alongside
                other users' content
              </li>
              <li>
                Sublicense your content to service providers who help us operate and
                promote the Site (e.g., email service providers, social media
                platforms, hosting services)
              </li>
            </ul>
            <p className="font-semibold mt-4">This license:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Lasts for the duration of your account plus 90 days after account
                deletion (to allow for caching and scheduled marketing materials
                already in production)
              </li>
              <li>
                Automatically terminates if you delete specific content from your
                account (though we may need up to 30 days to remove it from all
                systems)
              </li>
              <li>Does not transfer ownership of your content to us</li>
              <li>
                Is necessary for us to operate the Site and showcase the dance
                community
              </li>
            </ul>
            <p className="font-semibold mt-4">
              Opting Out of Marketing Use:
            </p>
            <p>You may opt out of having your content used in marketing materials by:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Checking "Opt out of using my account's content for marketing" in
                your settings
              </li>
              <li>Removing specific content from your account</li>
              <li>
                Contacting{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
            </ul>
            <p>
              Opting out will not affect the display of your content on the Site
              itself or our ability to operate the Service.
            </p>
            <p className="font-semibold mt-4">Content Ownership Transfer:</p>
            <p>
              If you claim ownership of events, videos, or other content that was
              previously added to the platform by Dance Chives staff or other users,
              that content becomes subject to this user content license from the
              moment you claim it. You may remove the content or opt out of marketing
              use at any time after claiming ownership.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Attribution</h3>
            <p>We will make reasonable efforts to attribute content to you when:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Your content is featured in marketing materials</li>
              <li>Your content is shared on external platforms</li>
              <li>Your content is highlighted in newsletters or promotional campaigns</li>
            </ul>
            <p>However, attribution may be limited or omitted when:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Space or format constraints make it impractical</li>
              <li>Content is aggregated or compiled with other users' content</li>
              <li>The context makes individual attribution unnecessary</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3. Platform-Added Content (Unclaimed)
            </h3>
            <p>
              Events, YouTube videos, and related content added to Dance Chives by the
              Dance Chives team or community members (and not claimed/owned by a
              registered user) are included solely for archival, discovery, and
              informational purposes. Such content will NOT be used in marketing,
              advertising, or promotional materials without the express permission of
              the applicable rights holder or organizer.
            </p>
            <p>
              Dance Chives does not copy, upload, or reproduce images or descriptions
              for platform-added content without the express permission of the owner.
              Event descriptions are summarized or adapted from publicly available
              information provided by organizers or promoters and are intended for
              informational use only. Where available, attribution to original
              creators and organizers is provided.
            </p>
            <p className="font-semibold mt-4">When Ownership is Claimed:</p>
            <p>
              If platform-added content is later claimed or assumed by a registered
              user (by verifying ownership through our ownership claim process), the
              use of such content becomes governed by the user content license in
              Section 1. This means:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                The content may now be used for marketing purposes (subject to the
                user's opt-out preference)
              </li>
              <li>
                The user has full control to remove the content or disable marketing
                use
              </li>
              <li>
                The user accepts the terms of the content license for that claimed
                content
              </li>
            </ul>
            <p className="font-semibold mt-4">Creator Rights:</p>
            <p>
              If you are a content creator, event organizer, or rights holder and would
              like:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>To claim ownership of existing content on the platform</li>
              <li>To request removal of your content</li>
              <li>To update how your content is displayed or attributed</li>
              <li>To opt out of marketing use</li>
              <li>To partner with Dance Chives</li>
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
              4. Third-Party Embedded Content
            </h3>
            <p>
              For YouTube videos and other third-party content aggregated on the Site:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We may share links, thumbnails, and metadata in our marketing</li>
              <li>
                We will include attribution to original creators (channel names,
                video titles)
              </li>
              <li>We respect the intellectual property rights of content creators</li>
              <li>
                We will promptly remove content upon request from rights holders
              </li>
            </ul>
          </div>
        </section>

        {/* Marketing and Promotional Use Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Marketing and Promotional Use
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. How We May Use Your Content</h3>
            <p>Dance Chives may use your content for:</p>
            <p className="font-semibold mt-4">Social Media Marketing:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Sharing user playlists, collections, and curation highlights on our
                social media channels (Instagram, Twitter, Facebook, TikTok, etc.)
              </li>
              <li>Featuring community discussions and reviews</li>
              <li>Highlighting dance videos you've tagged or organized</li>
              <li>Showcasing user profiles and achievements</li>
            </ul>
            <p className="font-semibold mt-4">Email Marketing:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Including your content in newsletters</li>
              <li>Featuring user spotlights and community highlights</li>
              <li>Promoting new features using example content</li>
              <li>Sending curated content recommendations</li>
            </ul>
            <p className="font-semibold mt-4">Website and Platform Promotion:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Displaying your content in homepage features</li>
              <li>Displaying user content in onboarding tutorials</li>
              <li>Showcasing community activity in promotional materials</li>
              <li>Including content in blog posts or articles</li>
            </ul>
            <p className="font-semibold mt-4">Advertising and Paid Promotion:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Using your content in online advertisements (Google Ads, social media
                ads)
              </li>
              <li>Including content in sponsored posts or campaigns</li>
              <li>Featuring content in partnership announcements</li>
              <li>Using content in promotional videos or presentations</li>
            </ul>
            <p className="font-semibold mt-4">Press and Media:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Sharing your content with journalists or media outlets</li>
              <li>Including content in press releases</li>
              <li>Using content in interviews or media appearances</li>
              <li>Featuring content in case studies or success stories</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2. User Testimonials and Reviews
            </h3>
            <p>
              If you provide feedback, testimonials, or reviews about Dance Chives:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                We may use them in marketing materials without additional permission
              </li>
              <li>We may attribute them to you by name, username, or anonymously</li>
              <li>
                We may edit for length, clarity, or formatting while preserving the
                meaning
              </li>
              <li>
                We may display them on the Site, in emails, on social media, or in
                advertisements
              </li>
            </ul>
            <p>
              If you prefer your testimonial not be attributed to you, please indicate
              this when submitting feedback.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3. Community Highlights and Features
            </h3>
            <p>We regularly feature outstanding community contributions:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>"Organizer of the Month" or similar recognition programs</li>
              <li>Featured playlists and collections</li>
              <li>Highlighted dance events or battles</li>
              <li>Community member spotlights</li>
            </ul>
            <p>Featured users may receive:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Prominent placement on the Site</li>
              <li>Social media recognition</li>
              <li>Email newsletter features</li>
            </ul>
          </div>
        </section>

        {/* Content Standards for Marketing Use Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Content Standards for Marketing Use
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. Quality Standards</h3>
            <p>Content used in marketing will generally meet these criteria:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>High-quality curation or thoughtful commentary</li>
              <li>Relevant to the dance community</li>
              <li>Positive representation of the Dance Chives platform</li>
              <li>Appropriate for public distribution</li>
              <li>Free from offensive or controversial material</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Content We Won't Use</h3>
            <p>We will not use content for marketing that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Is marked as hidden or private</li>
              <li>Violates our Terms of Service or Community Guidelines</li>
              <li>Contains hateful, discriminatory, or offensive material</li>
              <li>Infringes on third-party rights</li>
              <li>You've specifically requested we not use</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Context and Presentation</h3>
            <p>When using your content in marketing:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will present it fairly and accurately</li>
              <li>We will not misrepresent your views or opinions</li>
              <li>We will not use it in a misleading context</li>
              <li>We will respect the original intent of your content</li>
            </ul>
          </div>
        </section>

        {/* Opt-Out and Content Control Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Opt-Out and Content Control
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. How to Opt Out</h3>
            <p>
              If you do not want your content used in marketing materials:
            </p>
            <p className="font-semibold mt-4">Account-Wide Opt-Out:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Go to 'Settings' from your avatar dropdown</li>
              <li>
                Check the 'Opt out of using my account's content for marketing' box
              </li>
            </ul>
            <p className="font-semibold mt-4">Specific Content Opt-Out:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Contact{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>Request removal of specific content from marketing materials</li>
              <li>Provide links or descriptions of the content in question</li>
              <li>We will remove it within 5-7 business days</li>
            </ul>
            <p className="font-semibold mt-4">Platform Settings:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Adjust your privacy settings (if available) to limit content
                visibility
              </li>
              <li>Mark specific playlists or content as private</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2. Processing Opt-Out Requests
            </h3>
            <p>We will process opt-out requests as follows:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Removal from future marketing materials immediately</li>
              <li>Removal from active campaigns within 5-7 business days</li>
              <li>
                Note: Content already distributed (past social media posts, sent
                emails) cannot be recalled but will not be reused.
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Limitations</h3>
            <p>Certain uses may continue even after opt-out:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Content that has been aggregated or anonymized</li>
              <li>
                Content that is publicly visible on the Site (not marketing-specific)
              </li>
              <li>Operational uses necessary for Site functionality</li>
              <li>Legal obligations or legitimate business interests</li>
            </ul>
          </div>
        </section>

        {/* Email Marketing Communications Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Email Marketing Communications
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. Types of Email Communications</h3>
            <p className="font-semibold">Transactional Emails (Cannot Opt Out):</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Account verification and password resets</li>
              <li>Security alerts and account notifications</li>
              <li>Service updates and critical announcements</li>
              <li>
                Account activity notifications (if enabled in your preferences)
              </li>
            </ul>
            <p className="font-semibold mt-4">Newsletter and promotional Emails (Can Opt Out):</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>New feature announcements</li>
              <li>Premium subscription offers</li>
              <li>Community highlights and curated content</li>
              <li>Event promotion and partnerships</li>
              <li>Special offers or discounts</li>
              <li>Community updates (up to 2-3 times per week)</li>
              <li>Featured playlists and creators</li>
              <li>Dance event calendar</li>
              <li>Platform news and announcements</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2. Email Marketing Compliance (CAN-SPAM Act)
            </h3>
            <p>All promotional emails will include:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Clear identification of Dance Chives as the sender</li>
              <li>
                Clear indication that the email is an advertisement or promotional
                message
              </li>
              <li>Our physical mailing address</li>
              <li>A conspicuous and easy-to-use unsubscribe mechanism</li>
              <li>Honest subject lines and content</li>
            </ul>
            <p>You can opt out of promotional emails at any time by:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Clicking the "unsubscribe" link in any promotional email</li>
              <li>
                Contacting{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
            </ul>
            <p>
              We will process opt-out requests within 10 business days as required by
              the CAN-SPAM Act. Once you opt out, we will not sell or transfer your
              email address to third parties. You cannot opt out of essential
              transactional or security-related emails.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Email Frequency</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Promotional emails: Occasional (based on platform updates and special
                offers)
              </li>
              <li>
                Newsletters: Up to 2-3 times per week during major events or
                announcements
              </li>
              <li>Transactional emails: As needed (cannot opt out)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4. Personalization</h3>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Emails may be personalized based on your activity and preferences
              </li>
              <li>We may segment users for targeted campaigns</li>
              <li>
                All personalization respects your privacy settings and opt-out
                preferences
              </li>
            </ul>
          </div>
        </section>

        {/* Social Media Marketing Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Social Media Marketing
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. Platform Usage</h3>
            <p>We may share content on:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Instagram</li>
              <li>Twitter/X</li>
              <li>Facebook</li>
              <li>TikTok</li>
              <li>YouTube</li>
              <li>LinkedIn</li>
              <li>Other emerging platforms relevant to the dance community</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Tagging and Mentions</h3>
            <p>When sharing your content on social media:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will tag your social media accounts when known</li>
              <li>We will mention your Dance Chives username</li>
              <li>We may use relevant hashtags to increase visibility</li>
              <li>We will link back to the original content on Dance Chives</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              3. User-Generated Content Campaigns
            </h3>
            <p>We may run social media campaigns encouraging:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Sharing your Dance Chives profile</li>
              <li>Using branded hashtags</li>
              <li>Participating in contests or challenges</li>
              <li>Creating content about the platform</li>
            </ul>
            <p>
              Participation is voluntary, and specific campaign rules will be provided.
            </p>
          </div>
        </section>

        {/* YouTube and Third-Party Content Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            YouTube and Third-Party Content
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. Creator Rights and Respect</h3>
            <p>For YouTube videos and other third-party content:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We respect the rights of original content creators</li>
              <li>We will attribute content to creators whenever possible</li>
              <li>We will remove content from marketing upon creator request</li>
              <li>We will comply with platform-specific requirements (YouTube TOS, etc.)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">
              2. Marketing Use of Aggregated Content
            </h3>
            <p>When promoting Dance Chives using YouTube content:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will link to original sources when possible</li>
              <li>
                We will include creator attribution (channel names, usernames)
              </li>
              <li>
                We will not imply endorsement by creators unless explicitly given
              </li>
              <li>We will honor embedding permissions and restrictions</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Creator Partnerships</h3>
            <p>Content creators who partner with Dance Chives may receive:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Priority attribution in marketing materials</li>
              <li>Co-marketing opportunities</li>
              <li>Revenue sharing arrangements (where applicable)</li>
              <li>Exclusive promotional features</li>
            </ul>
            <p>
              To explore partnership opportunities, contact{" "}
              <a
                href="mailto:partnerships@dancechives.com"
                className="text-primary-light hover:text-white underline"
              >
                partnerships@dancechives.com
              </a>
              .
            </p>
          </div>
        </section>

        {/* Data and Analytics in Marketing Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Data and Analytics in Marketing
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. Aggregated Data</h3>
            <p>We may use aggregated, anonymized data in marketing:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Platform statistics (number of videos, users, events)</li>
              <li>Usage trends and growth metrics</li>
              <li>Popular dance styles or events</li>
              <li>Community engagement data</li>
            </ul>
            <p>This data will not identify individual users.</p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Case Studies</h3>
            <p>We may create case studies featuring:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>How users utilize the platform</li>
              <li>Community success stories</li>
              <li>Event organizer experiences</li>
              <li>Platform user profiles</li>
            </ul>
            <p className="font-semibold mt-4">For Detailed Case Studies:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will request explicit permission before publication</li>
              <li>You will have the opportunity to review and approve content</li>
              <li>You may request anonymity or use of a pseudonym</li>
              <li>You may withdraw consent before publication</li>
            </ul>
          </div>
        </section>

        {/* Intellectual Property and Rights Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Intellectual Property and Rights
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. Your Ownership</h3>
            <p>
              You retain ownership of all content you post on Dance Chives. The
              license you grant us (as described above) does not transfer ownership to
              us.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Third-Party Rights</h3>
            <p>
              By granting us the license to use your content, you represent and
              warrant that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You own or have rights to the content</li>
              <li>Your content does not infringe on third-party rights</li>
              <li>You have obtained necessary permissions (model releases, etc.)</li>
              <li>Your content complies with applicable laws</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Copyright Claims</h3>
            <p>If you believe your copyrighted content has been used improperly:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                Contact us immediately at{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>Provide details about the content and your ownership</li>
              <li>We will investigate and respond within 5-7 business days</li>
              <li>We will remove content if a valid claim is substantiated</li>
            </ul>
          </div>
        </section>

        {/* Compensation and Benefits Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Compensation and Benefits
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <h3 className="text-xl font-semibold mb-3">1. No Automatic Compensation</h3>
            <p>Unless otherwise agreed in writing:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>You will not receive payment for content used in marketing</li>
              <li>The license you grant is royalty-free</li>
              <li>
                Marketing use of content does not entitle you to revenue sharing
              </li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2. Potential Benefits</h3>
            <p>Featured users may receive:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Increased visibility and exposure</li>
              <li>Growth in followers and community recognition</li>
              <li>Premium account upgrades (at our discretion)</li>
              <li>Partnership opportunities</li>
              <li>Early access to new features</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">3. Partnership Agreements</h3>
            <p>For formal partnerships or sponsored content:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>We will negotiate separate written agreements</li>
              <li>Compensation terms will be clearly defined</li>
              <li>Rights and obligations will be specified</li>
              <li>Either party may terminate as per agreement terms</li>
            </ul>
          </div>
        </section>

        {/* Modifications to This Policy Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Modifications to This Policy
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              We may update this Content Usage and Marketing Policy from time to time.
              Changes will be communicated via:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Posting the updated policy on the Site</li>
              <li>Email notification for significant changes</li>
              <li>Prominent notice on the Site</li>
            </ul>
            <p>
              Your continued use of the Site after changes constitutes acceptance of
              the updated policy.
            </p>
          </div>
        </section>

        {/* Questions and Concerns Section */}
        <section className="bg-primary-dark/80 rounded-sm border-4 border-secondary-light p-6 md:p-8 space-y-4">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Questions and Concerns
          </h2>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              If you have questions about how your content is used or wish to discuss
              marketing opportunities, contact us at:
            </p>
            <ul className="list-none space-y-2 ml-4">
              <li>
                <strong>Marketing Inquiries:</strong>{" "}
                <a
                  href="mailto:partnerships@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  partnerships@dancechives.com
                </a>
              </li>
              <li>
                <strong>Content Removal Requests:</strong>{" "}
                <a
                  href="mailto:support@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  support@dancechives.com
                </a>
              </li>
              <li>
                <strong>Partnership Opportunities:</strong>{" "}
                <a
                  href="mailto:partnerships@dancechives.com"
                  className="text-primary-light hover:text-white underline"
                >
                  partnerships@dancechives.com
                </a>
              </li>
              <li>
                <strong>General Questions:</strong>{" "}
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
          </div>
        </section>
      </div>
    </>
  );
}

