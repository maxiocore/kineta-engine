import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "أحمد محمد العلي",
    role: "مدير شركة التقنية المتقدمة",
    content: "تجربة استثنائية مع فريق ماكسيو كور. نفذوا مشروعنا باحترافية عالية وتجاوزوا توقعاتنا في الجودة والالتزام بالمواعيد.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 2,
    name: "سارة عبدالله",
    role: "مؤسسة متجر أناقة",
    content: "من أفضل الشركات التي تعاملت معها. فهموا احتياجاتنا من اللحظة الأولى وقدموا حلولًا إبداعية ساعدتنا على النمو.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 3,
    name: "محمد خالد السعيد",
    role: "رائد أعمال",
    content: "الاحترافية والإبداع في أعلى مستوياته. ساعدونا في بناء هوية رقمية قوية وزيادة مبيعاتنا بشكل ملحوظ.",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
  {
    id: 4,
    name: "نورة فهد",
    role: "مديرة التسويق",
    content: "فريق متميز ومتفاني. حملاتنا التسويقية أصبحت أكثر فعالية بفضل استراتيجياتهم المبتكرة.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
    rating: 5,
  },
];

const NewTestimonialsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const navigate = (newDirection: number) => {
    setDirection(newDirection);
    setActiveIndex((prev) => {
      if (newDirection === 1) {
        return (prev + 1) % testimonials.length;
      }
      return prev === 0 ? testimonials.length - 1 : prev - 1;
    });
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <section ref={ref} className="py-16 md:py-24 bg-muted/30 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-dots opacity-30" />
      
      {/* Decorative Quote */}
      <div className="absolute top-20 right-10 text-primary/5">
        <Quote className="w-32 h-32 md:w-48 md:h-48" />
      </div>

      <div className="container px-5 sm:px-6 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10 md:mb-14"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            آراء العملاء
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            ماذا يقول عملاؤنا
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm md:text-base">
            نفخر بثقة عملائنا ونسعى دائمًا لتجاوز توقعاتهم
          </p>
        </motion.div>

        {/* Testimonials Carousel */}
        <div className="max-w-3xl mx-auto">
          <div className="relative">
            {/* Main Card */}
            <div className="relative overflow-hidden rounded-3xl bg-card border border-border/50 p-6 md:p-10 min-h-[280px] md:min-h-[260px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={activeIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="text-center"
                >
                  {/* Avatar */}
                  <div className="mb-5">
                    <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full overflow-hidden ring-4 ring-primary/20">
                      <img
                        src={testimonials[activeIndex].avatar}
                        alt={testimonials[activeIndex].name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-center gap-1 mb-4">
                    {[...Array(testimonials[activeIndex].rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 md:w-5 md:h-5 text-yellow-500 fill-yellow-500" />
                    ))}
                  </div>

                  {/* Content */}
                  <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-5 max-w-2xl mx-auto">
                    "{testimonials[activeIndex].content}"
                  </p>

                  {/* Author */}
                  <div>
                    <h4 className="font-bold text-foreground">
                      {testimonials[activeIndex].name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {testimonials[activeIndex].role}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => navigate(-1)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              
              {/* Dots */}
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setDirection(index > activeIndex ? 1 : -1);
                      setActiveIndex(index);
                    }}
                    className="p-1"
                  >
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === activeIndex
                          ? "w-6 bg-primary"
                          : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                      }`}
                    />
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => navigate(1)}
                className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-border flex items-center justify-center hover:border-primary hover:text-primary transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewTestimonialsSection;
