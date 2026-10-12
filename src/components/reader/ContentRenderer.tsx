import React from "react";
import { ContentBlock, LessonContentJson } from "@/types/editor";
import { Hash, Quote, Info, CheckCircle2 } from "lucide-react";

interface ContentRendererProps {
  content: LessonContentJson;
  fontSize?: number; // In px, e.g., 18
  className?: string;
}

export function ContentRenderer({
  content,
  fontSize = 18,
  className = "",
}: ContentRendererProps) {
  if (!content || !Array.isArray(content.blocks) || content.blocks.length === 0) {
    return (
      <div className="py-8 text-center text-[#536B61] italic">
        Nội dung bài học đang được hoàn thiện.
      </div>
    );
  }

  const renderBlock = (block: ContentBlock, index: number) => {
    switch (block.type) {
      case "heading": {
        const anchorId = block.id || `heading-${index}`;
        if (block.level === 2) {
          return (
            <h2
              key={block.id || index}
              id={anchorId}
              className="text-xl sm:text-2xl font-bold text-[#176B4A] mt-10 mb-4 pt-6 border-t border-[#E3E1D8]/70 scroll-mt-24 group flex items-baseline gap-2"
            >
              <span>{block.text}</span>
              <a
                href={`#${anchorId}`}
                className="opacity-0 group-hover:opacity-100 text-[#536B61]/50 hover:text-[#176B4A] transition-opacity text-sm ml-1"
                aria-label={`Neo tới mục ${block.text}`}
              >
                <Hash className="w-4 h-4 inline" aria-hidden="true" />
              </a>
            </h2>
          );
        }
        return (
          <h3
            key={block.id || index}
            id={anchorId}
            className="text-lg sm:text-xl font-semibold text-[#24352E] mt-6 mb-3 scroll-mt-24 group flex items-baseline gap-2"
          >
            <span>{block.text}</span>
            <a
              href={`#${anchorId}`}
              className="opacity-0 group-hover:opacity-100 text-[#536B61]/50 hover:text-[#176B4A] transition-opacity text-xs ml-1"
              aria-label={`Neo tới mục ${block.text}`}
            >
              <Hash className="w-3.5 h-3.5 inline" aria-hidden="true" />
            </a>
          </h3>
        );
      }

      case "paragraph": {
        return (
          <p
            key={block.id || index}
            className="my-4 leading-relaxed sm:leading-loose text-justify text-[#24352E]/90"
            style={{ fontSize: `${fontSize}px` }}
          >
            {block.text}
          </p>
        );
      }

      case "list": {
        if (block.ordered) {
          return (
            <ol
              key={block.id || index}
              className="my-5 space-y-2.5 pl-6 list-decimal text-[#24352E]/90 marker:text-[#176B4A] marker:font-semibold"
              style={{ fontSize: `${fontSize}px` }}
            >
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="leading-relaxed pl-1">
                  {item}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <ul
            key={block.id || index}
            className="my-5 space-y-2.5 pl-2 text-[#24352E]/90"
            style={{ fontSize: `${fontSize}px` }}
          >
            {block.items.map((item, itemIdx) => (
              <li key={itemIdx} className="flex items-start gap-3 leading-relaxed">
                <span className="w-2 h-2 rounded-full bg-[#176B4A] mt-2.5 shrink-0" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        );
      }

      case "image": {
        const imageUrl = block.url || (block.imageId ? `/images/lessons/${block.imageId}.jpg` : "");
        return (
          <figure key={block.id || index} className="my-8 text-center">
            <div className="overflow-hidden rounded-[14px] border border-[#E3E1D8] bg-[#F8F7F2] shadow-xs max-w-full inline-block">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={block.altText || block.caption || "Minh họa bài học"}
                  className="max-h-[420px] w-auto object-contain mx-auto"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-48 sm:h-64 flex flex-col items-center justify-center bg-[#EBF4F0] p-6 text-[#176B4A]">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-12 h-12 mb-2 text-[#176B4A]/70"
                    aria-hidden="true"
                  >
                    <path d="M12 3v18" />
                    <path d="M12 3c-3 4-7 8-7 13a7 7 0 0 0 7 5" />
                    <path d="M12 3c3 4 7 8 7 13a7 7 0 0 1-7 5" />
                    <path d="M12 10c-2 2-4 5-4 8a4 4 0 0 0 4 3" />
                    <path d="M12 10c2 2 4 5 4 8a4 4 0 0 1-4 3" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium text-[#536B61]">
                    {block.altText || "Hình ảnh giáo trình tu học"}
                  </span>
                </div>
              )}
            </div>
            {block.caption && (
              <figcaption className="mt-2.5 text-xs sm:text-sm text-[#536B61] italic text-center">
                {block.caption}
              </figcaption>
            )}
          </figure>
        );
      }

      case "callout": {
        const isQuote = block.variant === "quote";
        return (
          <div
            key={block.id || index}
            className={`my-6 p-4 sm:p-5 rounded-r-[14px] rounded-l-[4px] border-l-4 shadow-xs ${
              isQuote
                ? "bg-[#FBF6EC] border-[#D4AD69] text-[#4A3D24]"
                : "bg-[#EBF4F0] border-[#176B4A] text-[#164332]"
            }`}
          >
            <div className="flex items-start gap-3">
              {isQuote ? (
                <Quote className="w-5 h-5 text-[#D4AD69] shrink-0 mt-0.5" aria-hidden="true" />
              ) : (
                <Info className="w-5 h-5 text-[#176B4A] shrink-0 mt-0.5" aria-hidden="true" />
              )}
              <div className="flex-1">
                {block.title && (
                  <h4 className="font-bold text-sm sm:text-base mb-1">
                    {block.title}
                  </h4>
                )}
                <div
                  className="leading-relaxed"
                  style={{ fontSize: `${Math.max(14, fontSize - 1)}px` }}
                >
                  {block.text}
                </div>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <article
      className={`lesson-prose max-w-none transition-all duration-150 ${className}`}
    >
      {content.blocks.map(renderBlock)}
    </article>
  );
}
