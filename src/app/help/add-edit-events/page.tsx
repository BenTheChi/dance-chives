import Link from "next/link";
import { ReportLink } from "@/components/report/ReportLink";

export default function AddEditEventsPage() {
  return (
    <>
      <div className="flex flex-col gap-8 w-full max-w-5xl mx-auto p-6 md:p-8 pb-16">
        {/* Page Header */}
        <h1 className="mb-2">Adding and Editing Events</h1>

        {/* Introduction */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-4">
          <p className="text-base leading-relaxed text-white">
            The event form is organized into four main tabs:{" "}
            <strong>Details</strong>, <strong>Roles</strong>,{" "}
            <strong>Sections</strong>, and <strong>Photo Gallery</strong>. You
            can navigate between tabs using the buttons at the top of the form,
            or use the Previous/Next buttons at the bottom. You can save your
            progress at any time by clicking the "Save" button.
          </p>
          <p className="text-base leading-relaxed text-white">
            Required fields (Title, City, Type, and Date) must be filled before
            you can save. Once saved, your event will be live on Dance Chives
            and visible to the community.
          </p>
        </section>

        {/* Event Details Tab */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Event Details Tab
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Basic Information
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                <strong>Title:</strong> The name of your event (required). This
                is what will appear in search results and event listings.
              </p>
              <p>
                <strong>City:</strong> The city where the event takes place
                (required). Start typing to search for your city. If your city
                doesn&apos;t appear, it will be added automatically.
              </p>
              <p>
                <strong>Type:</strong> Select the type of event from the
                dropdown (required). Options include Battle, Workshop, Session,
                and Other.
              </p>
              <p>
                <strong>Dates:</strong> Add one or more dates for your event
                (required). You can add multiple dates for multi-day events. For
                each date, you can specify if it&apos;s an all-day event or set
                specific start and end times.
              </p>
              <p>
                <strong>Description:</strong> A detailed description of your
                event. This is where you can provide information about the
                event, its purpose, and any special details.
              </p>
              <p>
                <strong>Schedule:</strong> Additional schedule information, such
                as timing for different activities or sessions.
              </p>
              <p>
                <strong>Location:</strong> The specific venue or location where
                the event takes place.
              </p>
              <p>
                <strong>Cost:</strong> Entry fee or cost information for the
                event.
              </p>
              <p>
                <strong>Prize:</strong> Prize information for competitions or
                battles.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Visual Elements
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                <strong>Poster:</strong> Upload an event poster image. This will
                be displayed as the main visual for your event. Supported
                formats include JPG, PNG, and other common image formats.
              </p>
              <p>
                <strong>Background Color:</strong> Choose a background color for
                your event page. This color will be used as the theme for your
                event display.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Social Media Links
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              You can add links to your event&apos;s social media profiles,
              including Instagram, YouTube, and Facebook. These links will be
              displayed on your event page.
            </p>
          </div>
        </section>

        {/* Roles Tab */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Roles Tab
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              What are Event Roles?
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              Event roles recognize people who were involved in organizing and
              running the event. These are event-level roles that apply to the
              entire event, separate from section-specific roles. Common roles
              include Organizer, DJ, MC, Videographer, Photographer, and Teacher.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Adding Roles
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                To add a role, click the plus button (+) in the Roles tab. Then:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                  <li>
                    Select the role title from the dropdown (e.g., Organizer, DJ,
                    MC, Teacher, etc.)
                  </li>
                <li>
                  Search for and select the user who held that role. Start
                  typing their username or display name to find them.
                </li>
                <li>
                  You can add multiple people to the same role by adding
                  multiple role entries with the same title.
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Removing Roles
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              To remove a role, click the X button next to the role entry you
              want to remove.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Available Role Types
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              The available role types include: Organizer, DJ, MC, Videographer,
              Photographer, Teacher, Host, Sponsor, and more. These roles help
              give proper credit to everyone who contributed to making the event
              happen.
            </p>
          </div>
        </section>

        {/* Sections Tab */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Sections Tab
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              What are Sections?
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              Sections are the main organizational units within an event where
              videos are stored. Each section represents a distinct part of your
              event, such as a specific battle, competition, performance, or
              class. Sections help organize your event content and make it
              easier for viewers to find specific videos.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Creating a Section
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>To create a new section:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Click the plus button (+) in the Sections tab</li>
                <li>
                  Give your section a title (e.g., &quot;1v1 Breaking
                  Finals&quot;, &quot;Popping Workshop&quot;)
                </li>
                <li>Select the section type from the dropdown</li>
                <li>
                  Optionally add a description to provide more context about the
                  section
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Section Types
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                Each section must have a type, which determines how it&apos;s
                organized and what features are available:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Battle:</strong> Competitive dance battles. This type
                  supports winners and judges. Videos can be organized within
                  brackets or directly in the section.
                </li>
                <li>
                  <strong>Competition:</strong> Judged dance competitions. This
                  type
                  <strong> disallows brackets</strong> but supports winners and
                  judges. Videos are added directly to the section.
                </li>
                <li>
                  <strong>Performance:</strong> Showcase performances. This type
                  <strong> disallows brackets</strong> and doesn&apos;t support
                  winners or judges. Videos are added directly to the section.
                </li>
                <li>
                  <strong>Showcase:</strong> Featured dance showcases. This type
                  <strong> disallows brackets</strong> and doesn&apos;t support
                  winners or judges. Videos are added directly to the section.
                </li>
                <li>
                  <strong>Class:</strong> Dance classes and workshops. This type
                  <strong> disallows brackets</strong> and doesn&apos;t support
                  winners or judges. Videos are added directly to the section.
                </li>
                <li>
                  <strong>Session:</strong> Open dance sessions. This type
                  <strong> disallows brackets</strong> and doesn&apos;t support
                  winners or judges. Videos are added directly to the section.
                </li>
                <li>
                  <strong>Other:</strong> For sections that don&apos;t fit the
                  above categories. This type allows you to choose whether to
                  use brackets or not, and doesn&apos;t support winners or
                  judges.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Brackets
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                Brackets are used to organize videos in structured competitions.
                When a section uses brackets:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  Sections can optionally use brackets to organize videos
                </li>
                <li>
                  <strong>Performance</strong>, <strong>Showcase</strong>,{" "}
                  <strong>Class</strong>, and <strong>Session</strong> sections
                  cannot use brackets
                </li>
                <li>
                  <strong>Other</strong> sections
                  allow you to choose whether to use brackets
                </li>
                <li>
                  When brackets are enabled, videos must be added to specific
                  brackets rather than directly to the section
                </li>
                <li>
                  You can create multiple brackets within a section (e.g.,
                  &quot;Round 1&quot;, &quot;Round 2&quot;, &quot;Finals&quot;)
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Section Overview (Left Column)
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                When you select a section, the left column shows the section
                overview where you can:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Title:</strong> Edit the section title
                </li>
                <li>
                  <strong>Description:</strong> Add or edit a description for
                  the section
                </li>
                <li>
                  <strong>Type:</strong> Change the section type (note: changing
                  types may affect brackets, winners, and judges)
                </li>
                <li>
                  <strong>Use Brackets:</strong> Toggle whether to use brackets
                  (only available for Mixed and Other types)
                </li>
                <li>
                  <strong>Styles:</strong> Add dance styles associated with this
                  section (e.g., Breaking, Popping, Locking). You can apply
                  these styles to all videos in the section automatically.
                </li>
                <li>
                  <strong>Apply Styles to Videos:</strong> When enabled, all
                  videos in the section (and brackets) will automatically
                  inherit the section&apos;s styles
                </li>
                <li>
                  <strong>Winners:</strong> Tag section winners (only available
                  for Battle and Competition types)
                </li>
                <li>
                  <strong>Judges:</strong> Tag section judges (only available
                  for Battle and Competition types)
                </li>
                <li>
                  <strong>Poster:</strong> Upload a poster image specific to
                  this section
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Adding Videos (Right Column)
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                The right column shows either videos or brackets, depending on
                whether your section uses brackets:
              </p>
              <div className="space-y-4 ml-4">
                <div>
                  <p className="font-semibold mb-2">
                    For sections <strong>without brackets</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Click the plus button (+) to add a video directly to the
                      section
                    </li>
                    <li>
                      Enter the video URL (YouTube, Vimeo, or other supported
                      platforms)
                    </li>
                    <li>
                      Add a title for the video (optional but recommended)
                    </li>
                    <li>
                      Select the video type (Battle, Freestyle, Choreography,
                      Class, or Other)
                    </li>
                    <li>Optionally add dance styles specific to that video</li>
                    <li>
                      Tag dancers, winners, choreographers, or teachers as
                      appropriate
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold mb-2">
                    For sections <strong>with brackets</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      First, create brackets by clicking the plus button (+)
                      next to &quot;Brackets&quot;
                    </li>
                    <li>
                      Give each bracket a title (e.g., &quot;Round 1&quot;,
                      &quot;Semifinals&quot;, &quot;Finals&quot;)
                    </li>
                    <li>
                      Select a bracket from the bracket tabs to add videos to it
                    </li>
                    <li>
                      Within each bracket, click the plus button (+) to add
                      videos
                    </li>
                    <li>
                      Follow the same process as adding videos to sections
                      without brackets
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Managing Videos
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>For each video, you can:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Edit:</strong> Click on a video to edit its title,
                  type, styles, and tags
                </li>
                <li>
                  <strong>Remove:</strong> Click the X button to remove a video
                  from the section or bracket
                </li>
                <li>
                  <strong>Tag People:</strong> Tag dancers, winners,
                  choreographers, or teachers associated with the video
                </li>
                <li>
                  <strong>Video Types:</strong> Each video can be classified as
                  Battle, Freestyle, Choreography, Class, or Other. The default
                  type depends on the section type.
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Section Navigation
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              When you have multiple sections, you&apos;ll see tabs at the top
              showing each section. Click on a section tab to edit that section.
              You can remove a section by hovering over its tab and clicking the
              X button that appears.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Tips for Sections
            </h3>
            <ul className="list-disc list-inside space-y-2 text-base leading-relaxed text-white ml-4">
              <li>
                Create separate sections for different parts of your event
                (e.g., one section for &quot;1v1 Breaking&quot; and another for
                &quot;2v2 Popping&quot;)
              </li>
              <li>
                Use brackets for structured competitions to organize rounds and
                matches
              </li>
              <li>
                Add descriptions to sections to provide context about what
                happened in that part of the event
              </li>
              <li>
                Tag winners and judges for competitive sections to properly
                recognize participants
              </li>
              <li>
                Use section posters to visually distinguish different parts of
                your event
              </li>
            </ul>
          </div>
        </section>

        {/* Photo Gallery Tab */}
        <section className="bg-neutral-600 rounded-sm border-4 border-primary-light p-6 md:p-8 space-y-8">
          <h2 className="text-2xl font-bold mb-6 text-white border-b-2 border-secondary-light pb-3">
            Photo Gallery Tab
          </h2>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Uploading Photos
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>
                The Photo Gallery tab allows you to upload and manage photos
                from your event. You can upload up to 10 photos per event.
              </p>
              <p>To upload photos:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  Click in the upload area or drag and drop photos into the
                  gallery section
                </li>
                <li>
                  Select one or more photos from your device (supported formats
                  include JPG, PNG, and other common image formats)
                </li>
                <li>
                  Optionally add captions to your photos by clicking on them
                  after upload
                </li>
              </ol>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Managing Photos
            </h3>
            <div className="space-y-3 text-base leading-relaxed text-white ml-4">
              <p>Once photos are uploaded, you can:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Reorder:</strong> Drag and drop photos to change their
                  order. The first photo will be used as the gallery thumbnail.
                </li>
                <li>
                  <strong>Edit Captions:</strong> Click on a photo to add or
                  edit its caption
                </li>
                <li>
                  <strong>Remove:</strong> Click the X button on a photo to
                  remove it from the gallery
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold font-display text-white">
              Photo Display
            </h3>
            <p className="text-base leading-relaxed text-white ml-4">
              Photos in your gallery will be displayed on your event page in a
              scrollable gallery format. Visitors can click on photos to view
              them in full size. The order you set in the form will be the order
              photos appear on the event page.
            </p>
          </div>
        </section>

        {/* Additional Resources */}
        <section className="bg-amber-900/30 border-2 border-amber-600 rounded-sm p-6 md:p-8 space-y-4">
          <h2 className="text-xl font-bold text-white">
            Need Additional Help?
          </h2>
          <p className="text-base leading-relaxed text-white">
            For more information about managing events after creation, see the{" "}
            <Link
              href="/help/event-management"
              className="text-primary-light underline hover:text-primary"
            >
              Event Management
            </Link>{" "}
            help page. For questions about role tagging, see the{" "}
            <Link
              href="/help/role-tagging"
              className="text-primary-light underline hover:text-primary"
            >
              Role Tagging
            </Link>{" "}
            help page. If you encounter issues or have questions, please{" "}
            <ReportLink className="text-primary-light underline hover:text-primary">
              file a report
            </ReportLink>
            .
          </p>
        </section>
      </div>
    </>
  );
}
