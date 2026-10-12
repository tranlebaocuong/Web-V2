// Schema định dạng content_json blocks

export type ContentBlock =
  | {
      id: string;
      type: "heading";
      level: 2 | 3;
      text: string;
    }
  | {
      id: string;
      type: "paragraph";
      text: string;
    }
  | {
      id: string;
      type: "image";
      imageId?: string;
      url?: string;
      caption?: string;
      altText?: string;
    }
  | {
      id: string;
      type: "list";
      ordered: boolean;
      items: string[];
    }
  | {
      id: string;
      type: "callout";
      variant?: "info" | "warning" | "success" | "quote";
      title?: string;
      text: string;
    };

export interface LessonContentJson {
  version: number;
  blocks: ContentBlock[];
}

export interface TocItem {
  id: string;
  level: number;
  text: string;
}
