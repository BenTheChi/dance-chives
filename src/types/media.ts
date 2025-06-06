export interface Image {
  id?: string;
  title: string;
  src: string;
  type: "photo" | "poster";
}

export interface Embed {
  id?: string;
  src: string;
  type: "youtube" | "ig";
}
