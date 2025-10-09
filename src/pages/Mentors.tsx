import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Linkedin, Mail, Star } from "lucide-react";

const Mentors = () => {
  const mentors = [
    {
      name: "Ms. Sonali Gupta",
      title: "Project Mentor",
      expertise: "Software Engineering, Web Development, AI/ML",
      bio: "With over 10 years of experience in software development and education, Ms. Gupta specializes in guiding students through complex technical projects and research.",
      email: "sonali.gupta@university.edu",
      linkedin: "https://linkedin.com/in/sonaligupta"
    },
    {
      name: "Dr. Rajesh Kumar",
      title: "Senior Faculty",
      expertise: "Data Science, Machine Learning, Research Methodology",
      bio: "Published researcher with expertise in data science and machine learning. Passionate about mentoring students in cutting-edge tech.",
      email: "rajesh.kumar@university.edu",
      linkedin: "https://linkedin.com/in/rajeshkumar"
    },
    {
      name: "Prof. Neha Sharma",
      title: "Department Head",
      expertise: "Software Architecture, Cloud Computing, DevOps",
      bio: "Industry veteran turned educator, specializing in system design and cloud-native applications. Active mentor for hackathon teams.",
      email: "neha.sharma@university.edu",
      linkedin: "https://linkedin.com/in/nehasharma"
    },
    {
      name: "Mr. Aditya Singh",
      title: "Senior Student Mentor",
      expertise: "Full Stack Development, Competitive Programming",
      bio: "Final year student with multiple hackathon wins and internship experience. Helps juniors navigate project development and career planning.",
      email: "aditya.singh@university.edu",
      linkedin: "https://linkedin.com/in/adityasingh"
    }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto">
          {/* Header */}
          <div className="text-center mb-16 animate-slide-up">
            <h1 className="text-5xl font-bold mb-6">
              Connect with <span className="gradient-text">Mentors</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get guidance from experienced faculty members and senior students. 
              Whether you need help with a project, research advice, or career guidance, our mentors are here to help.
            </p>
          </div>

          {/* Mentors Grid */}
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {mentors.map((mentor, index) => (
              <Card 
                key={index}
                className="glass-card p-8 hover:scale-105 transition-all duration-300"
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary via-accent to-secondary flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                    {mentor.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-1">{mentor.name}</h3>
                    <p className="text-primary font-semibold mb-2">{mentor.title}</p>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <Star className="w-4 h-4 text-highlight fill-highlight" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {mentor.expertise}
                      </span>
                    </div>

                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                      {mentor.bio}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-primary to-accent text-white"
                        asChild
                      >
                        <a href={`mailto:${mentor.email}`}>
                          <Mail className="w-4 h-4 mr-2" />
                          Contact
                        </a>
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        asChild
                      >
                        <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="w-4 h-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* CTA Section */}
          <Card className="glass-card p-10 text-center bg-gradient-to-br from-primary/10 to-accent/10">
            <h2 className="text-3xl font-bold mb-4">Want to Become a Mentor?</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              If you're a faculty member or experienced student interested in mentoring, 
              we'd love to have you join our community.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent text-white font-semibold glow-hover"
              asChild
            >
              <a href="mailto:mentors@skillsync.com">
                <Mail className="w-5 h-5 mr-2" />
                Apply as Mentor
              </a>
            </Button>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Mentors;
