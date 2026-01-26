# hero section
""use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Circle } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";


function ElegantShape({
    className,
    delay = 0,
    width = 400,
    height = 100,
    rotate = 0,
    gradient = "from-white/[0.08]",
}: {
    className?: string;
    delay?: number;
    width?: number;
    height?: number;
    rotate?: number;
    gradient?: string;
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: -150,
                rotate: rotate - 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
                rotate: rotate,
            }}
            transition={{
                duration: 2.4,
                delay,
                ease: [0.23, 0.86, 0.39, 0.96],
                opacity: { duration: 1.2 },
            }}
            className={cn("absolute", className)}
        >
            <motion.div
                animate={{
                    y: [0, 15, 0],
                }}
                transition={{
                    duration: 12,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
                style={{
                    width,
                    height,
                }}
                className="relative"
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-full",
                        "bg-gradient-to-r to-transparent",
                        gradient,
                        "backdrop-blur-[2px] border-2 border-white/[0.15]",
                        "shadow-[0_8px_32px_0_rgba(255,255,255,0.1)]",
                        "after:absolute after:inset-0 after:rounded-full",
                        "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"
                    )}
                />
            </motion.div>
        </motion.div>
    );
}

function HeroGeometric({
    badge = "Design Collective",
    title1 = "Elevate Your Digital Vision",
    title2 = "Crafting Exceptional Websites",
}: {
    badge?: string;
    title1?: string;
    title2?: string;
}) {
    const fadeUpVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                duration: 1,
                delay: 0.5 + i * 0.2,
                ease: [0.25, 0.4, 0.25, 1],
            },
        }),
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#030303]">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.05] via-transparent to-rose-500/[0.05] blur-3xl" />

            <div className="absolute inset-0 overflow-hidden">
                <ElegantShape
                    delay={0.3}
                    width={600}
                    height={140}
                    rotate={12}
                    gradient="from-indigo-500/[0.15]"
                    className="left-[-10%] md:left-[-5%] top-[15%] md:top-[20%]"
                />

                <ElegantShape
                    delay={0.5}
                    width={500}
                    height={120}
                    rotate={-15}
                    gradient="from-rose-500/[0.15]"
                    className="right-[-5%] md:right-[0%] top-[70%] md:top-[75%]"
                />

                <ElegantShape
                    delay={0.4}
                    width={300}
                    height={80}
                    rotate={-8}
                    gradient="from-violet-500/[0.15]"
                    className="left-[5%] md:left-[10%] bottom-[5%] md:bottom-[10%]"
                />

                <ElegantShape
                    delay={0.6}
                    width={200}
                    height={60}
                    rotate={20}
                    gradient="from-amber-500/[0.15]"
                    className="right-[15%] md:right-[20%] top-[10%] md:top-[15%]"
                />

                <ElegantShape
                    delay={0.7}
                    width={150}
                    height={40}
                    rotate={-25}
                    gradient="from-cyan-500/[0.15]"
                    className="left-[20%] md:left-[25%] top-[5%] md:top-[10%]"
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 md:px-6">
                <div className="max-w-3xl mx-auto text-center">
                    <motion.div
                        custom={0}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] mb-8 md:mb-12"
                    >
                        <Circle className="h-2 w-2 fill-rose-500/80" />
                        <span className="text-sm text-white/60 tracking-wide">
                            {badge}
                        </span>
                    </motion.div>

                    <motion.div
                        custom={1}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <h1 className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 md:mb-8 tracking-tight">
                            <span className="bg-clip-text text-transparent bg-gradient-to-b from-white to-white/80">
                                {title1}
                            </span>
                            <br />
                            <span
                                className={cn(
                                    "bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white/90 to-rose-300 "
                                )}
                            >
                                {title2}
                            </span>
                        </h1>
                    </motion.div>

                    <motion.div
                        custom={2}
                        variants={fadeUpVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <p className="text-base sm:text-lg md:text-xl text-white/40 mb-8 leading-relaxed font-light tracking-wide max-w-xl mx-auto px-4">
                            Crafting exceptional digital experiences through
                            innovative design and cutting-edge technology.
                        </p>
                    </motion.div>
                </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-[#030303]/80 pointer-events-none" />
        </div>
    );
}

export { HeroGeometric }
"
# Pricing section
"import NumberFlow from '@number-flow/react'
import React from "react";

export function PricingInteraction ({
  starterMonth,
  starterAnnual,
  proMonth,
  proAnnual,
}:{
  starterMonth: number;
  starterAnnual: number;
  proMonth: number;
  proAnnual: number;
}) {
  const [active, setActive] = React.useState(0);
  const [period, setPeriod] = React.useState(0);
  const handleChangePlan = (index: number) => {
    setActive(index);
  };
  const handleChangePeriod = (index: number) => {
    setPeriod(index);
    if (index === 0) {
      setStarter(starterMonth);
      setPro(proMonth);
    } else {
      setStarter(starterAnnual);
      setPro(proAnnual);
    }
  };
  const [starter, setStarter] = React.useState(starterMonth);
  const [pro, setPro] = React.useState(proMonth);

  return (
    <div className="border-2 rounded-[32px] p-3 shadow-md max-w-sm w-full flex flex-col items-center gap-3 bg-white">
        <div className="rounded-full relative w-full bg-slate-100 p-1.5 flex items-center">
          <button
            className="font-semibold rounded-full w-full p-1.5 text-slate-800 z-20"
            onClick={() => handleChangePeriod(0)}
          >
            Monthly
          </button>
          <button
            className="font-semibold rounded-full w-full p-1.5 text-slate-800 z-20"
            onClick={() => handleChangePeriod(1)}
          >
            Yearly
          </button>
          <div
            className="p-1.5 flex items-cnter justify-center absolute inset-0 w-1/2 z-10"
            style={{
              transform: `translateX(${period * 100}%)`,
              transition: "transform 0.3s",
            }}
          >
            <div className="bg-white shadow-sm rounded-full w-full h-full"></div>
          </div>
        </div>
        <div className="w-full relative flex flex-col items-center justify-center gap-3">
          <div
            className="w-full flex justify-between cursor-pointer border-2 border-gray-400 p-4 rounded-2xl"
            onClick={() => handleChangePlan(0)}
          >
            <div className="flex flex-col items-start">
              <p className="font-semibold text-xl text-gray-950">Free</p>
              <p className="text-slate-500 text-md">
                <span className="text-black font-medium">$0.00</span>/month
              </p>
            </div>
            <div
              className="border-2 border-slate-500 size-6 rounded-full mt-0.5 p-1 flex items-center justify-center"
              style={{
                borderColor: `${active === 0 ? "#000" : "#64748b"}`,
                transition: "border-color 0.3s",
              }}
            >
              <div
                className="size-3 bg-black rounded-full"
                style={{
                  opacity: `${active === 0 ? 1 : 0}`,
                  transition: "opacity 0.3s",
                }}
              ></div>
            </div>
          </div>
          <div
            className="w-full flex justify-between cursor-pointer border-2 border-gray-400 p-4 rounded-2xl"
            onClick={() => handleChangePlan(1)}
          >
            <div className="flex flex-col items-start">
              <p className="font-semibold text-xl flex items-center gap-2 text-gray-950">
                Starter{" "}
                <span className="py-1 px-2 block rounded-lg bg-yellow-100 text-yellow-950 text-sm">
                  Popular
                </span>
              </p>
              <p className="text-slate-500 text-md flex">
                <span className="text-black font-medium flex items-center">
                  ${" "}
                  <NumberFlow
                    className="text-black font-medium"
                    value={starter}
                  />
                </span>
                /month
              </p>
            </div>
            <div
              className="border-2 border-slate-500 size-6 rounded-full mt-0.5 p-1 flex items-center justify-center"
              style={{
                borderColor: `${active === 1 ? "#000" : "#64748b"}`,
                transition: "border-color 0.3s",
              }}
            >
              <div
                className="size-3 bg-black rounded-full"
                style={{
                  opacity: `${active === 1 ? 1 : 0}`,
                  transition: "opacity 0.3s",
                }}
              ></div>
            </div>
          </div>
          <div
            className="w-full flex justify-between cursor-pointer border-2 border-gray-400 p-4 rounded-2xl"
            onClick={() => handleChangePlan(2)}
          >
            <div className="flex flex-col items-start">
              <p className="font-semibold text-xl text-gray-950">Pro</p>
              <p className="text-slate-500 text-md flex">
                <span className="text-black font-medium flex items-center">
                  ${" "}
                  <NumberFlow
                    className="text-black font-medium"
                    value={pro}
                  />
                </span>
                /month
              </p>
            </div>
            <div
              className="border-2 border-slate-500 size-6 rounded-full mt-0.5 p-1 flex items-center justify-center"
              style={{
                borderColor: `${active === 2 ? "#000" : "#64748b"}`,
                transition: "border-color 0.3s",
              }}
            >
              <div
                className="size-3 bg-black rounded-full"
                style={{
                  opacity: `${active === 2 ? 1 : 0}`,
                  transition: "opacity 0.3s",
                }}
              ></div>
            </div>
          </div>
          <div
            className={`w-full h-[88px] absolute top-0 border-[3px] border-black rounded-2xl`}
            style={{
              transform: `translateY(${active * 88 + 12 * active}px)`,
              transition: "transform 0.3s",
            }}
          ></div>
        </div>
        <button className="rounded-full bg-black text-lg text-white w-full p-3 active:scale-95 transition-transform duration-300">
          Get Started
        </button>
      </div>
  );
};

"
# Feature section with hoover animation
"import { cn } from "@/lib/utils";
import {
  IconAdjustmentsBolt,
  IconCloud,
  IconCurrencyDollar,
  IconEaseInOut,
  IconHeart,
  IconHelp,
  IconRouteAltLeft,
  IconTerminal2,
} from "@tabler/icons-react";

export function FeaturesSectionWithHoverEffects() {
  const features = [
    {
      title: "Built for developers",
      description:
        "Built for engineers, developers, dreamers, thinkers and doers.",
      icon: <IconTerminal2 />,
    },
    {
      title: "Ease of use",
      description:
        "It's as easy as using an Apple, and as expensive as buying one.",
      icon: <IconEaseInOut />,
    },
    {
      title: "Pricing like no other",
      description:
        "Our prices are best in the market. No cap, no lock, no credit card required.",
      icon: <IconCurrencyDollar />,
    },
    {
      title: "100% Uptime guarantee",
      description: "We just cannot be taken down by anyone.",
      icon: <IconCloud />,
    },
    {
      title: "Multi-tenant Architecture",
      description: "You can simply share passwords instead of buying new seats",
      icon: <IconRouteAltLeft />,
    },
    {
      title: "24/7 Customer Support",
      description:
        "We are available a 100% of the time. Atleast our AI Agents are.",
      icon: <IconHelp />,
    },
    {
      title: "Money back guarantee",
      description:
        "If you donot like EveryAI, we will convince you to like us.",
      icon: <IconAdjustmentsBolt />,
    },
    {
      title: "And everything else",
      description: "I just ran out of copy ideas. Accept my sincere apologies",
      icon: <IconHeart />,
    },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4  relative z-10 py-10 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r  py-10 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-4 relative z-10 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-10">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-10">
        {description}
      </p>
    </div>
  );
};
"