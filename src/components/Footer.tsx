import { Link } from "react-router-dom";
import { Mail, Shield } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-3">
            <h3 className="font-display text-2xl tracking-wide text-foreground">
              STREAM<span className="text-primary">VAULT</span>
            </h3>
            <p className="text-xs leading-relaxed text-muted-foreground">
              StreamVault does not host, store, or distribute any copyrighted content.
              All media is provided by unaffiliated third-party services. We are not
              responsible for the content, accuracy, or legality of material streamed
              through external players.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" /> Copyright &amp; DMCA
            </h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              All trademarks, logos, and images are property of their respective owners.
              If you believe your copyrighted work has been linked without authorization,
              please contact us and we will remove it promptly.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4 text-primary" /> Contact
            </h4>
            <p className="text-xs text-muted-foreground">
              For DMCA takedown requests, business inquiries, or general feedback:
            </p>
            <Link to="/contact" className="inline-block text-sm font-medium text-primary hover:underline">
              Get in touch →
            </Link>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} StreamVault. All rights reserved. For educational purposes only.
          </p>
        </div>
      </div>
    </footer>
  );
}
