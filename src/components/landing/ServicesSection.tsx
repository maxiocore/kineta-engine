import { motion } from "framer-motion";
import { 
  BarChart3, 
  Megaphone, 
  Target, 
  Zap, 
  LineChart, 
  Users 
} from "lucide-react";

const services = [
  {
    icon: BarChart3,
    title: "Analytics & Insights",
    description: "Deep dive into your data with AI-powered analytics that reveal actionable insights and growth opportunities.",
    gradient: "from-primary to-cyan-400",
  },
  {
    icon: Megaphone,
    title: "Campaign Management",
    description: "Launch, manage, and optimize multi-channel campaigns with intelligent automation and real-time tracking.",
    gradient: "from-accent to-pink-400",
  },
  {
    icon: Target,
    title: "Audience Targeting",
    description: "Reach the right people at the right time with precision targeting powered by machine learning algorithms.",
    gradient: "from-success to-emerald-400",
  },
  {
    icon: Zap,
    title: "Marketing Automation",
    description: "Automate repetitive tasks and create sophisticated workflows that nurture leads 24/7.",
    gradient: "from-warning to-orange-400",
  },
  {
    icon: LineChart,
    title: "Performance Tracking",
    description: "Monitor KPIs in real-time with customizable dashboards and comprehensive reporting tools.",
    gradient: "from-primary to-blue-400",
  },
  {
    icon: Users,
    title: "Lead Generation",
    description: "Capture and convert high-quality leads with optimized funnels and smart lead scoring.",
    gradient: "from-accent to-purple-400",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-dots opacity-20" />
      
      <div className="container px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-medium text-sm tracking-wider uppercase">
            Our Services
          </span>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-4 mb-6">
            Everything You Need to <span className="text-gradient">Succeed</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Comprehensive marketing solutions designed to accelerate your growth 
            and maximize your ROI.
          </p>
        </motion.div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div className="glass rounded-2xl p-8 h-full transition-all duration-300 hover:border-primary/30">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} p-3 mb-6 shadow-lg group-hover:shadow-glow transition-shadow`}>
                  <service.icon className="w-full h-full text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {service.description}
                </p>

                {/* Hover Glow */}
                <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;