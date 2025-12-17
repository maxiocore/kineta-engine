import { Palette, Sun, Moon, Monitor } from "lucide-react";
import SettingsCard from "./SettingsCard";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'light', label: 'فاتح', icon: Sun, gradient: 'from-yellow-400 to-orange-400' },
    { id: 'dark', label: 'داكن', icon: Moon, gradient: 'from-indigo-500 to-purple-600' },
    { id: 'system', label: 'تلقائي', icon: Monitor, gradient: 'from-gray-400 to-gray-600' },
  ];

  const colors = [
    { name: 'أزرق', class: 'bg-blue-500' },
    { name: 'بنفسجي', class: 'bg-purple-500' },
    { name: 'أخضر', class: 'bg-green-500' },
    { name: 'برتقالي', class: 'bg-orange-500' },
    { name: 'وردي', class: 'bg-pink-500' },
    { name: 'سماوي', class: 'bg-cyan-500' },
  ];

  return (
    <SettingsCard
      icon={Palette}
      title="المظهر والتخصيص"
      description="تخصيص مظهر لوحة التحكم"
      delay={0.5}
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-3">الوضع</p>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t, index) => (
              <motion.button
                key={t.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onClick={() => setTheme(t.id)}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === t.id 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border/50 hover:border-primary/50 bg-secondary/30'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-2`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium">{t.label}</span>
                {theme === t.id && (
                  <motion.div
                    layoutId="activeTheme"
                    className="absolute inset-0 border-2 border-primary rounded-xl"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-3">اللون الرئيسي</p>
          <div className="flex flex-wrap gap-2">
            {colors.map((color, index) => (
              <motion.button
                key={color.name}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.05 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 rounded-full ${color.class} ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-primary/50 transition-all`}
                title={color.name}
              />
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">التأثيرات الحركية</span>
            <span className="text-sm font-medium text-green-500">مُفعّلة</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-muted-foreground">الخط</span>
            <span className="text-sm font-medium">IBM Plex Sans Arabic</span>
          </div>
        </div>
      </div>
    </SettingsCard>
  );
};

export default AppearanceSettings;
