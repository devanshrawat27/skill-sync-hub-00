import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Users, Sparkles } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-hover">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">SkillSync</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Home
            </Link>
            <Link to="/features" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Features
            </Link>
            <Link to="/about" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              About Us
            </Link>
            <Link to="/mentors" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Mentors
            </Link>
            <Link to="/contact" className="text-foreground/80 hover:text-primary transition-colors font-medium">
              Contact
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" className="font-medium">
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent text-white font-medium glow-hover">
                <Sparkles className="w-4 h-4 mr-2" />
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
