const languages = [
  { name: "English", flag: "🇬🇧" },
  { name: "Spanish", flag: "🇪🇸" },
  { name: "Chinese", flag: "🇨🇳" },
  { name: "French", flag: "🇫🇷" },
  { name: "German", flag: "🇩🇪" },
  { name: "Portuguese", flag: "🇧🇷" },
  { name: "Japanese", flag: "🇯🇵" },
  { name: "Arabic", flag: "🇦🇪" },
];

const LanguageMarquee = () => {
  const doubled = [...languages, ...languages];

  return (
    <section className="relative py-16 border-t border-border/30 overflow-hidden">
      <div className="container mx-auto px-4 max-w-4xl text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-foreground font-serif mb-4">
          Truly Global. Audit Candidates in{" "}
          <span className="gradient-text">50+ Languages.</span>
        </h2>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          AuditGen handles the translation and technical understanding
          automatically using on-chain AI consensus.
        </p>
      </div>

      <div className="relative w-full">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

        <div className="flex animate-marquee w-max">
          {doubled.map((lang, i) => (
            <div
              key={`${lang.name}-${i}`}
              className="flex items-center gap-3 px-6 py-3 mx-2 glass-card shrink-0"
            >
              <span className="text-2xl">{lang.flag}</span>
              <span className="text-sm font-semibold text-foreground whitespace-nowrap">
                {lang.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LanguageMarquee;
