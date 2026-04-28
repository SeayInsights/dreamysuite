"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionProps {
	title: React.ReactNode;
	children: React.ReactNode;
	defaultOpen?: boolean;
	className?: string;
	headerClassName?: string;
	contentClassName?: string;
}

export function Accordion({
	title,
	children,
	defaultOpen = false,
	className,
	headerClassName,
	contentClassName,
}: AccordionProps) {
	const [isOpen, setIsOpen] = React.useState(defaultOpen);

	return (
		<div className={cn("border-b border-border", className)}>
			<button
				type="button"
				onClick={() => setIsOpen(!isOpen)}
				className={cn(
					"flex w-full items-center justify-between py-3 text-left font-medium transition-colors hover:text-foreground/80",
					headerClassName,
				)}
			>
				{title}
				<motion.div
					animate={{ rotate: isOpen ? 180 : 0 }}
					transition={{ duration: 0.2, ease: "easeInOut" }}
				>
					<ChevronDown className="size-4 shrink-0" />
				</motion.div>
			</button>

			<AnimatePresence initial={false}>
				{isOpen && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2, ease: "easeInOut" }}
						className="overflow-hidden"
					>
						<div className={cn("pb-4", contentClassName)}>{children}</div>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
