import { AppNavbar } from "@/components/AppNavbar";
import SectionBracketTabSelector from "@/components/SectionBracketTabSelector";
import { getEvent } from "@/db/queries/event";

type PageProps = {
  params: Promise<{ event: string }>;
};

export default async function SectionsPage({ params }: PageProps) {
  const paramResult = await params;
  //   const { sections, title } = await getEventSections(paramResult.event);

  const title = "Summer Dance Championship 2024";

  const sections = [
    {
      id: "1",
      title: "Breaking 1v1",
      description: "Open breaking competition for all levels",
      hasBrackets: true,
      videos: [],
      brackets: [
        {
          id: "b1",
          title: "Quarter Finals",
          videos: [
            {
              id: "v2",
              title: "Quarter Final Match 1",
              src: "https://www.youtube.com/watch?v=ZJ4yQqcat34",
              taggedUsers: [
                {
                  id: "u2",
                  username: "janesmith",
                  displayName: "Jane Smith",
                },
              ],
            },
            {
              id: "v3",
              title: "Quarter Final Match 2",
              src: "https://www.youtube.com/watch?v=3HWLCbuyBBw",
              taggedUsers: [
                {
                  id: "u3",
                  username: "mikejohnson",
                  displayName: "Mike Johnson",
                },
                {
                  id: "u4",
                  username: "sarahwilson",
                  displayName: "Sarah Wilson",
                },
              ],
            },
            {
              id: "v4",
              title: "Quarter Final Match 3",
              src: "https://www.youtube.com/watch?v=zfv4ZIqKh8Q",
              taggedUsers: [
                {
                  id: "u5",
                  username: "alexbrown",
                  displayName: "Alex Brown",
                },
                {
                  id: "u6",
                  username: "sarahwilson",
                  displayName: "Sarah Wilson",
                },
              ],
            },
          ],
        },
        {
          id: "b2",
          title: "Semi Finals",
          videos: [
            {
              id: "v5",
              title: "Semi Final Match 1",
              src: "https://www.youtube.com/watch?v=_E7SMkgHcsM",
              taggedUsers: [
                {
                  id: "u7",
                  username: "johnsmith",
                  displayName: "John Smith",
                },
                {
                  id: "u8",
                  username: "janesmith",
                  displayName: "Jane Smith",
                },
              ],
            },
            {
              id: "v6",
              title: "Semi Final Match 2",
              src: "https://www.youtube.com/watch?v=3E7oWIkC4B0",
              taggedUsers: [
                {
                  id: "u9",
                  username: "johnsmith",
                  displayName: "John Smith",
                },
                {
                  id: "u10",
                  username: "janesmith",
                  displayName: "Jane Smith",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "2",
      title: "Popping Showcase",
      description: "Group popping performance showcase",
      hasBrackets: false,
      videos: [
        {
          id: "v3",
          title: "Team Alpha Performance",
          src: "https://www.youtube.com/watch?v=YPchwNAXOgc",
          taggedUsers: [
            {
              id: "u3",
              username: "mikejohnson",
              displayName: "Mike Johnson",
            },
            {
              id: "u4",
              username: "sarahwilson",
              displayName: "Sarah Wilson",
            },
          ],
        },
      ],
      brackets: [],
    },
    {
      id: "3",
      title: "Hip Hop Crew Battle",
      description: "5v5 crew battle championship",
      hasBrackets: true,
      videos: [],
      brackets: [
        {
          id: "b2",
          title: "Semi Finals",
          videos: [
            {
              id: "v5",
              title: "Crew A vs Crew B",
              src: "https://www.youtube.com/watch?v=fHeneea0qGk",
              taggedUsers: [
                {
                  id: "u5",
                  username: "alexbrown",
                  displayName: "Alex Brown",
                },
              ],
            },
          ],
        },
        {
          id: "b3",
          title: "Finals",
          videos: [
            {
              id: "v6",
              title: "Championship Battle",
              src: "https://www.youtube.com/watch?v=wGMYNMGNuSE",
              taggedUsers: [],
            },
          ],
        },
      ],
    },
  ];

  return (
    <>
      <AppNavbar />
      <SectionBracketTabSelector sections={sections} eventTitle={title} />
    </>
  );
}
