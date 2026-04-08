const roadmapItems = [
  {
    emoji: "🏛️",
    title: "The Consensus Council Customizer",
    description:
      "Hand-select your AI validator models (Llama, GPT, Claude) for every audit for ultimate trust.",
    className: "md:col-span-2",
  },
  {
    emoji: "🧠",
    title: "AI-Generated 'Hard Skill' Quizzes",
    description:
      "Instant technical assessments based on the audited skills for on-chain verification.",
    className: "md:col-span-1",
  },
  {
    emoji: "💸",
    title: "Audit-to-Hire Escrow Payments",
    description:
      "Secure hiring bonuses in a smart contract escrow that only unlocks upon a successful audit.",
    className: "md:col-span-3",
  },
];

const RoadmapBento = () => {
  return (
    <section className="relative py-24 border-t border-border/30">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Roadmap
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-foreground font-serif">
            What's <span className="gradient-text">next</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmapItems.map((item) => (
            <div
              key={item.title}
              className={`glass-card p-8 group hover:border-primary/30 transition-all duration-300 hover:-translate-y-1 ${item.className}`}
            >
              <span className="text-3xl block mb-4">{item.emoji}</span>
              <h3 className="text-lg font-bold text-foreground mb-2">
                {item.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RoadmapBento;
