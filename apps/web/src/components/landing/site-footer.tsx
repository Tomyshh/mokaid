import {
  Blocks,
  Bot,
  Building2,
  Cookie,
  Handshake,
  LogIn,
  Rocket,
  Scale,
  Sparkles,
  Webhook,
} from "lucide-react";
import { Footer } from "@/components/ui/footer";

export function SiteFooter() {
  return (
    <Footer
      className="mt-8 bg-bg-deep"
      brand={{
        name: "mokaid",
        description: "The workspace for AI and human employees. Built with care.",
      }}
      socialLinks={[
        {
          name: "Contact",
          href: "mailto:tom@yapio.io",
        },
      ]}
      columns={[
        {
          title: "Product",
          links: [
            {
              name: "Product",
              Icon: Blocks,
              href: "#product",
            },
            {
              name: "Agents",
              Icon: Bot,
              href: "#agents",
            },
            {
              name: "Connectors",
              Icon: Webhook,
              href: "#connectors",
            },
            {
              name: "Why mokaid",
              Icon: Sparkles,
              href: "#stats",
            },
          ],
        },
        {
          title: "Account",
          links: [
            {
              name: "Sign in",
              Icon: LogIn,
              href: "/login",
            },
            {
              name: "Get started",
              Icon: Rocket,
              href: "/signup",
            },
          ],
        },
        {
          title: "Legal",
          links: [
            {
              name: "Privacy Policy",
              Icon: Scale,
              href: "/privacy",
            },
            {
              name: "Terms of Service",
              Icon: Handshake,
              href: "/terms",
            },
            {
              name: "Cookies",
              Icon: Cookie,
              href: "/cookies",
            },
            {
              name: "Legal Notice",
              Icon: Building2,
              href: "/legal",
            },
          ],
        },
      ]}
      copyright={`© ${new Date().getFullYear()} Mokaid. All rights reserved.`}
    />
  );
}
