import type { ReactNode } from "react";
import type { BlogBlock } from "@/app/lib/blogs";

type BlogBodyProps = {
  blocks: BlogBlock[];
};

const paragraphSplitRegex = /\n{2,}/;
const urlPattern = /(https?:\/\/[^\s)]+)/gi;

const buildParagraphs = (text?: string) => {
  if (!text) return [];
  return text
    .split(paragraphSplitRegex)
    .map((entry) => entry.trim())
    .filter(Boolean);
};

const renderWithLinks = (paragraph: string) => {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  const regex = new RegExp(urlPattern); // clone to reset state
  let match: RegExpExecArray | null;

  while ((match = regex.exec(paragraph)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(paragraph.slice(lastIndex, match.index));
    }

    const url = match[0];
    nodes.push(
      <a
        key={`link-${match.index}-${url}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="break-all text-[#355B4B] underline underline-offset-4"
      >
        {url}
      </a>,
    );
    lastIndex = match.index + url.length;
  }

  if (lastIndex < paragraph.length) {
    nodes.push(paragraph.slice(lastIndex));
  }

  return nodes.length ? nodes : [paragraph];
};

export default function BlogBody({ blocks }: BlogBodyProps) {
  if (!blocks.length) return null;

  return (
    <article className="container mx-auto px-4 pb-16 text-[#1B1F1E]">
      <div className="mx-auto max-w-3xl text-center pt-8">
        {blocks.map((block, index) => {
          if (block.type === "heading" && block.text) {
            return (
              <h2
                key={`heading-${index}`}
                className="mt-12 text-2xl font-semibold leading-snug text-[#1B1F1E] first:mt-0"
              >
                {block.text}
              </h2>
            );
          }

          if (block.type === "text" && block.text) {
            const paragraphs = buildParagraphs(block.text);
            if (paragraphs.length === 0) return null;
            return (
              <div
                key={`text-${index}`}
                className="mt-6 space-y-4 text-lg leading-relaxed text-[#3B3F45] break-all md:break-words"
              >
                {paragraphs.map((paragraph, idx) => (
                  <p key={idx}>{renderWithLinks(paragraph)}</p>
                ))}
              </div>
            );
          }

          if (block.type === "image" && block.imageUrl) {
            return (
              <figure key={`image-${index}`} className="mt-10">
                <div className="overflow-hidden rounded-[28px] border border-black/5 shadow-[0_16px_40px_rgba(0,0,0,0.08)]">
                  <img
                    src={block.imageUrl}
                    alt={block.alt || block.caption || "Blog illustration"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                {block.caption && (
                  <figcaption className="mt-3 text-center text-sm text-[#5A5F68]">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );
          }

          return null;
        })}
      </div>
    </article>
  );
}
