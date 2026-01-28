import { cn } from "../../lib/utils";
import { IconCloud, IconCurrencyDollar, IconEaseInOut, IconTerminal2 } from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
    const features = [
        { title: "Built for developers", description: "Built for engineers, developers, dreamers, thinkers and doers.", icon: <IconTerminal2 /> },
        { title: "Ease of use", description: "It's as easy as using an Apple, and as expensive as buying one.", icon: <IconEaseInOut /> },
        { title: "Pricing like no other", description: "Our prices are best in the market. No cap, no lock, no credit card required.", icon: <IconCurrencyDollar /> },
        { title: "100% Uptime guarantee", description: "We just cannot be taken down by anyone.", icon: <IconCloud /> },
    ];
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-10 max-w-7xl mx-auto bg-white">
            {features.map((feature, index) => (
                <Feature key={feature.title} {...feature} index={index} />
            ))}
        </div>
    );
}

const Feature = ({ title, description, icon, index }: any) => {
    return (
        <div className={cn("flex flex-col lg:border-r py-10 relative group/feature border-neutral-200", (index === 0 || index === 4) && "lg:border-l", index < 4 && "lg:border-b")}>
            <div className="mb-4 relative z-10 px-10 text-neutral-600">{icon}</div>
            <div className="text-lg font-bold mb-2 relative z-10 px-10">
                <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800">{title}</span>
            </div>
            <p className="text-sm text-neutral-600 max-w-xs relative z-10 px-10">{description}</p>
        </div>
    );
};
