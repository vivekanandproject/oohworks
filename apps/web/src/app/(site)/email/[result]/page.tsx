import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Button, Container } from "@ohworks/ui";
import { Shell } from "@/components/Shell";
import { CENTER, PageHead } from "@/components/owners/Frame";

/** Where a link in an email lands (/api/email-link/): what it did, and where to go next. */

const RESULTS = {
  following: {
    eyebrow: "Search alerts",
    title: "You will hear about new sites",
    text: "We email you when sites that match your search are listed. Every email has a link to stop them.",
    action: { label: "Back to finding sites", href: "/search/" },
  },
  unfollowed: {
    eyebrow: "Search alerts",
    title: "No more emails about that search",
    text: "You will not hear from us about it again. You can follow a search again at any time.",
    action: { label: "Find sites", href: "/search/" },
  },
  subscribed: {
    eyebrow: "Newsletter",
    title: "You are on the list",
    text: "The briefing reaches you when it starts. Every issue has a link to stop it.",
    action: { label: "Read the newsroom", href: "/newsroom/" },
  },
  unsubscribed: {
    eyebrow: "Newsletter",
    title: "You are off the list",
    text: "No more newsletter emails. You can sign up again from the newsroom at any time.",
    action: { label: "Go to the newsroom", href: "/newsroom/" },
  },
  "availability-confirmed": {
    eyebrow: "Your sites",
    title: "Your sites are confirmed as free",
    text: "Buyers now see today's date beside each one. If one is booked, give its date on its page.",
    action: { label: "Go to your sites", href: "/owner/" },
  },
  "link-expired": {
    eyebrow: "Your sites",
    title: "This link has expired",
    text: "A link to confirm availability works for two weeks. Sign in to confirm your sites from their pages.",
    action: { label: "Sign in", href: "/sign-in/" },
  },
  "link-not-valid": {
    eyebrow: "ohworks",
    title: "This link does not work",
    text: "It may have been copied only in part, or what it was for has gone. Nothing was changed.",
    action: { label: "Go to the homepage", href: "/" },
  },
} as const;

type Result = keyof typeof RESULTS;

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function EmailResultPage({ params }: { params: Promise<{ result: string }> }) {
  const { result } = await params;
  if (!(result in RESULTS)) notFound();
  const r = RESULTS[result as Result];
  return (
    <Shell>
      <Container className="py-8 lg:py-12">
        <div className={CENTER} data-section="email-result">
          <PageHead center eyebrow={r.eyebrow} title={r.title}>
            {r.text}
          </PageHead>
          <div className="mt-6 flex justify-center">
            <Button href={r.action.href} variant="primary">
              {r.action.label}
            </Button>
          </div>
        </div>
      </Container>
    </Shell>
  );
}
