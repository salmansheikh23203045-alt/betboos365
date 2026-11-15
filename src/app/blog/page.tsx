import type { Metadata } from "next";
import { PageBanner } from "@/components/pages/PageBanner";
import { NeonCard } from "@/components/ui/NeonCard";
import { SecondaryButton } from "@/components/ui/SecondaryButton";
import { Pill } from "@/components/ui/Pill";
import { ICONS } from "@/lib/icons";
import { BLOG_POSTS } from "@/data/pages";

export const metadata: Metadata = { title: "Blog | BetBoos365" };

export default function BlogPage() {
  return (
    <div className="animate-fade-in-up mx-auto max-w-[1280px] space-y-6 px-4 py-6 lg:px-6">
      <PageBanner title="Blog" subtitle="Tips, guides, and the latest news from BetBoos365" icon="BookOpen" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BLOG_POSTS.map((post, i) => (
          <NeonCard key={post.id} as="article" hoverGlow className="animate-stagger flex flex-col justify-between space-y-3" style={{ "--stagger-i": i } as React.CSSProperties}>
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Pill variant="free">{post.category}</Pill>
                <span className="text-[10px] text-tcl-muted">{post.readTime} read</span>
              </div>
              <h2 className="text-heading-sm font-bold text-tcl-white">{post.title}</h2>
              <p className="mt-1.5 text-caption text-tcl-muted leading-relaxed">{post.excerpt}</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="flex items-center gap-1 text-[10px] text-tcl-muted">
                <ICONS.Calendar aria-hidden="true" className="size-3" />
                {new Date(post.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
              <SecondaryButton size="sm" variant="outline">
                Read More
              </SecondaryButton>
            </div>
          </NeonCard>
        ))}
      </div>
    </div>
  );
}
