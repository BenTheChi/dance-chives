import { IconCirclePlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { AspectRatio, Card, Spoiler, Stack, Text, Title } from '@mantine/core';
import { useEventContext } from '../Providers/EventProvider';

interface BattleCard {
  title: string;
  src: string;
  teams:
    | {
        name: string;
        members: string[];
        winner: boolean;
      }[]
    | [];
  dancers: string[];
}

interface Bracket {
  type: string;
  battleCards: BattleCard[];
}

interface BattlesSection {
  type: string;
  format: string;
  styles: string[];
  judges: string[];
  brackets: Bracket[];
}

export function BattleCard({
  sectionIndex,
  bracketIndex,
  cardIndex,
}: {
  sectionIndex: number;
  bracketIndex: number;
  cardIndex: number;
}) {
  const { eventData } = useEventContext();

  const card = (eventData.sections[sectionIndex] as BattlesSection).brackets[bracketIndex]
    .battleCards[cardIndex];

  function convertYouTubeUrlToEmbed(url: string): string | null {
    // Regular expressions to match different YouTube URL formats
    const patterns = [
      // Standard watch URL
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,

      // Shortened youtu.be URL
      /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?&]+)/,

      // Embed URL (already in correct format)
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?&]+)/,
    ];

    // Try each pattern
    for (const pattern of patterns) {
      const match = url.match(pattern);

      if (match) {
        // Extract video ID (first capturing group)
        const videoId = match[1];

        // Return embed URL
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // Return null if no match found
    return null;
  }

  return (
    <Card withBorder radius="md" shadow="sm" h="100%" w="460">
      <Title order={4}>{card.title}</Title>
      <AspectRatio ratio={16 / 9}>
        <iframe
          src={convertYouTubeUrlToEmbed(card.src) || ''}
          title={card.title}
          style={{ border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </AspectRatio>
      <Stack gap="0">
        <Text>Dancers: {card.dancers.join(', ')}</Text>
        {/* <Spoiler maxHeight={1} w="460" showLabel="See Winner" hideLabel="Hide">
            {card.winner}
          </Spoiler> */}
      </Stack>
    </Card>
  );
}
