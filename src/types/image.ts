// Base Image interface - replaces Picture
export interface Image {
  id: string;
  title: string;
  url: string;
  type: "gallery" | "profile" | "poster";
  file: File | null;
  caption?: string; // Optional caption for gallery photos (max 100 chars)
}

// Gallery Image - for event/workshop/session galleries
export interface GalleryImage extends Image {
  type: "gallery";
}

// Profile Image - for user profiles
export interface ProfileImage extends Image {
  type: "profile";
}

// Poster Image - for event/workshop/session posters
export interface PosterImage extends Image {
  type: "poster";
}

