import React from "react";

export interface SymbolProps {
    x: number;
    y: number;
    rotation?: number;
    label?: string;
    value?: string;
}

/** Resistor Symbol (zigzag) */
export function ResistorSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Zigzag resistor */}
            <path
                d="M-30,0 L-20,0 L-15,-8 L-5,8 L5,-8 L15,8 L20,0 L30,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-15"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Capacitor Symbol (two parallel lines) */
export function CapacitorSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Left wire */}
            <line x1="-30" y1="0" x2="-5" y2="0" stroke="currentColor" strokeWidth="2" />
            {/* Left plate */}
            <line x1="-5" y1="-12" x2="-5" y2="12" stroke="currentColor" strokeWidth="2" />
            {/* Right plate */}
            <line x1="5" y1="-12" x2="5" y2="12" stroke="currentColor" strokeWidth="2" />
            {/* Right wire */}
            <line x1="5" y1="0" x2="30" y2="0" stroke="currentColor" strokeWidth="2" />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-18"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Inductor Symbol (coils) */
export function InductorSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Coil arcs */}
            <path
                d="M-30,0 L-25,0 
                   A5,5 0 0 1 -15,0 
                   A5,5 0 0 1 -5,0 
                   A5,5 0 0 1 5,0 
                   A5,5 0 0 1 15,0 
                   A5,5 0 0 1 25,0 
                   L30,0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-15"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Voltage Source Symbol (circle with + -) */
export function VoltageSourceSymbol({ x, y, rotation = 0, label }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            {/* Circle */}
            <circle cx="0" cy="0" r="15" fill="none" stroke="currentColor" strokeWidth="2" />
            {/* Plus sign */}
            <line x1="-5" y1="-5" x2="5" y2="-5" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="-10" x2="0" y2="0" stroke="currentColor" strokeWidth="1.5" />
            {/* Minus sign */}
            <line x1="-5" y1="5" x2="5" y2="5" stroke="currentColor" strokeWidth="1.5" />
            {/* Wires */}
            <line x1="-30" y1="0" x2="-15" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="15" y1="0" x2="30" y2="0" stroke="currentColor" strokeWidth="2" />
            {/* Label */}
            {label && (
                <text
                    x="0"
                    y="-25"
                    textAnchor="middle"
                    className="text-xs fill-current font-mono"
                >
                    {label}
                </text>
            )}
        </g>
    );
}

/** Ground Symbol */
export function GroundSymbol({ x, y, rotation = 0 }: SymbolProps) {
    const transform = `translate(${x}, ${y}) rotate(${rotation})`;
    return (
        <g transform={transform}>
            <line x1="0" y1="-15" x2="0" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="-12" y1="0" x2="12" y2="0" stroke="currentColor" strokeWidth="2" />
            <line x1="-8" y1="5" x2="8" y2="5" stroke="currentColor" strokeWidth="2" />
            <line x1="-4" y1="10" x2="4" y2="10" stroke="currentColor" strokeWidth="2" />
        </g>
    );
}

/** Wire/Node point */
export function NodeSymbol({ x, y }: SymbolProps) {
    return (
        <circle cx={x} cy={y} r="3" fill="currentColor" />
    );
}

// Map strings to components
export const COMPONENT_RENDERERS: Record<string, React.FC<SymbolProps>> = {
    resistor: ResistorSymbol,
    capacitor: CapacitorSymbol,
    inductor: InductorSymbol,
    "voltage-source": VoltageSourceSymbol,
    ground: GroundSymbol,
    node: NodeSymbol,
};
