import { motion } from "framer-motion";

const PageLoader = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <motion.div 
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <div className="relative">
          <div className="w-12 h-12 border-4 border-primary/20 rounded-full" />
          <div className="absolute top-0 left-0 w-12 h-12 border-4 border-transparent border-t-primary rounded-full animate-spin" />
        </div>
        <p className="text-muted-foreground text-sm">جاري التحميل...</p>
      </motion.div>
    </div>
  );
};

export default PageLoader;
