"use client";

import {
  CSSProperties,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react";
import { X } from "lucide-react";

export type HealthCornerIngredient = {
  id?: string;
  label: string;
  value: number;
};

type LayoutSegment = Required<HealthCornerIngredient> & {
  index: number;
  rotation: number;
  text: LabelPoint;
};

type LabelPoint = {
  x: number;
  y: number;
};

type DefaultIngredient = {
  id: string;
  value: number;
  label: string;
};

type Props = {
  imageUrl: string;
  imageAlt?: string;
  className?: string;
  ingredients?: HealthCornerIngredient[];
};

const DEFAULT_INGREDIENTS: DefaultIngredient[] = [
  {
    id: "tomatoes",
    value: 34,
    label: "Tomatoes",
  },
  {
    id: "herbs",
    value: 5,
    label: "Herbs",
  },
  {
    id: "nuts",
    value: 12,
    label: "Nuts",
  },
  {
    id: "olive-oil",
    value: 6,
    label: "Olive oil",
  },
  {
    id: "spinach",
    value: 15,
    label: "Spinach",
  },
  {
    id: "avocados",
    value: 25,
    label: "Avocados",
  },
];

const CENTER = 280;
const PETAL_PATH =
  "M280 280 L178 104 C178 55 218 25 280 25 C342 25 382 55 382 104 L280 280 Z";
const PETAL_FILL_BOTTOM = 280;
const PETAL_FILL_HEIGHT = PETAL_FILL_BOTTOM - 25;
const COUNT_DURATION_MS = 1400;
const CENTER_IMAGE_RADIUS = 96;
const CENTER_IMAGE_SIZE = CENTER_IMAGE_RADIUS * 2;
const CENTER_IMAGE_OFFSET = 280 - CENTER_IMAGE_RADIUS;
const CENTER_INNER_RING_RADIUS = CENTER_IMAGE_RADIUS + 4;
const CENTER_GLOW_RADIUS = CENTER_IMAGE_RADIUS + 16;
const CENTER_OUTER_RING_RADIUS = CENTER_IMAGE_RADIUS + 10;
const GRADIENT_START_Y = CENTER - CENTER_OUTER_RING_RADIUS;
const GRADIENT_ORANGE = "#F5A15F";
const GRADIENT_YELLOW = "#FFE36D";
const GRADIENT_GREEN = "#BEF05B";
const SIX_SEGMENT_LABEL_POINTS: LabelPoint[] = [
  { x: 280, y: 78 },
  { x: 443, y: 180 },
  { x: 433, y: 358 },
  { x: 280, y: 474 },
  { x: 127, y: 358 },
  { x: 117, y: 180 },
];

const easeOutCubic = (value: number) => 1 - Math.pow(1 - value, 3);

const getAreaFillRatio = (value: number) => {
  if (value <= 0) return 0;
  return Math.min(0.92, 0.3 + Math.sqrt(value / 100) * 0.9);
};

const getRoundedFillPath = (fillY: number) => {
  const fillHeight = PETAL_FILL_BOTTOM - fillY;
  const capDepth = Math.min(76, Math.max(30, fillHeight * 0.34));
  const capJoinY = Math.min(PETAL_FILL_BOTTOM - 6, fillY + capDepth);
  const sideSlope = (280 - 178) / (280 - 104);
  const halfWidth = Math.max(10, (PETAL_FILL_BOTTOM - capJoinY) * sideSlope);
  const left = 280 - halfWidth;
  const right = 280 + halfWidth;
  const capTopY = Math.max(25, fillY);
  const capMidY = capTopY + capDepth * 0.18;

  return [
    "M280 280",
    `L${left} ${capJoinY}`,
    `C${left} ${capMidY} ${280 - halfWidth * 0.62} ${capTopY} 280 ${capTopY}`,
    `C${280 + halfWidth * 0.62} ${capTopY} ${right} ${capMidY} ${right} ${capJoinY}`,
    "L280 280",
    "Z",
  ].join(" ");
};

const EMPTY_FILL_PATH = getRoundedFillPath(PETAL_FILL_BOTTOM);

const createIngredientId = (label: string, index: number) =>
  `${label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "ingredient"}-${index}`;

const getDynamicLabelPoint = (rotation: number, count: number): LabelPoint => {
  const angle = ((rotation - 90) * Math.PI) / 180;
  const radiusX = count === 4 ? 182 : 186;
  const radiusY = count === 4 ? 198 : 202;

  return {
    x: CENTER + Math.cos(angle) * radiusX,
    y: CENTER + Math.sin(angle) * radiusY,
  };
};

const buildLayoutSegments = (
  ingredients: HealthCornerIngredient[] | undefined
): LayoutSegment[] => {
  const source =
    ingredients && ingredients.length > 0
      ? ingredients.slice(0, 6)
      : DEFAULT_INGREDIENTS;
  const angleStep = 360 / source.length;

  return source.map((ingredient, index) => {
    const rotation = index * angleStep;
    const text =
      source.length === 6
        ? SIX_SEGMENT_LABEL_POINTS[index]
        : getDynamicLabelPoint(rotation, source.length);

    return {
      id: ingredient.id ?? createIngredientId(ingredient.label, index),
      label: ingredient.label,
      value: Math.max(0, Math.min(100, ingredient.value)),
      index,
      rotation,
      text,
    };
  });
};

export default function HealthCornerRadialInfographic({
  imageUrl,
  imageAlt = "",
  className,
  ingredients,
}: Props) {
  const uid = useId().replace(/:/g, "");
  const segments = useMemo(() => buildLayoutSegments(ingredients), [ingredients]);
  const [countProgress, setCountProgress] = useState(0);
  const [isImageModalOpen, setImageModalOpen] = useState(false);

  const closeImageModal = useCallback(() => {
    setImageModalOpen(false);
  }, []);

  useEffect(() => {
    let startTime: number | null = null;
    let frameId = 0;

    const tick = (time: number) => {
      if (startTime === null) {
        startTime = time;
      }
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / COUNT_DURATION_MS, 1);
      setCountProgress(easeOutCubic(progress));

      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    if (!isImageModalOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeImageModal();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [closeImageModal, isImageModalOpen]);

  return (
    <>
      <figure
        className={className}
        aria-label="AM Health Corner ingredient balance infographic"
      >
        <svg
          viewBox="0 0 560 560"
          role="img"
          aria-labelledby={`${uid}-title ${uid}-desc`}
          className="h-auto w-full overflow-visible"
        >
          <title id={`${uid}-title`}>Ingredient balance</title>
          <desc id={`${uid}-desc`}>
            A six segment radial infographic with the dish image in the center.
          </desc>

          <defs>
            <filter id={`${uid}-soft-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#1D2A25" floodOpacity="0.16" />
            </filter>
            <filter id={`${uid}-fill-blur`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="14" />
            </filter>
            <clipPath id={`${uid}-image-clip`}>
              <circle cx="280" cy="280" r={CENTER_IMAGE_RADIUS} />
            </clipPath>
            <clipPath id={`${uid}-petal-clip`} clipPathUnits="userSpaceOnUse">
              <path d={PETAL_PATH} />
            </clipPath>
            <radialGradient id={`${uid}-center-glow`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E7F4DB" />
            </radialGradient>
            {segments.map((segment) => (
              <linearGradient
                key={segment.id}
                id={`${uid}-${segment.id}-gradient`}
                gradientUnits="userSpaceOnUse"
                x1="280"
                y1={GRADIENT_START_Y}
                x2="280"
                y2="25"
              >
                <stop offset="0%" stopColor={GRADIENT_ORANGE}>
                  <animate
                    attributeName="stop-color"
                    values={`${GRADIENT_ORANGE};#F9AD61;${GRADIENT_ORANGE}`}
                    dur="2.8s"
                    repeatCount="indefinite"
                  />
                </stop>
                <stop offset="5%" stopColor="#FFC867" />
                <stop offset="20%" stopColor={GRADIENT_YELLOW} />
                <stop offset="36%" stopColor={GRADIENT_GREEN} />
                <stop offset="62%" stopColor="#DDF9A5" />
                <stop offset="84%" stopColor="#FBFFF3" />
                <stop offset="100%" stopColor="#FFFFFF">
                  <animate
                    attributeName="stop-color"
                    values="#FFFFFF;#F9FFF1;#FFFFFF"
                    dur="3.2s"
                    repeatCount="indefinite"
                  />
                </stop>
              </linearGradient>
            ))}
          </defs>

          <g filter={`url(#${uid}-soft-shadow)`}>
            {segments.map((segment) => {
              const fillRatio = getAreaFillRatio(segment.value);
              const fillHeight = PETAL_FILL_HEIGHT * fillRatio;
              const fillY = PETAL_FILL_BOTTOM - fillHeight;
              const fillPath = getRoundedFillPath(fillY);
              const startFillPath = getRoundedFillPath(PETAL_FILL_BOTTOM);
              const begin = `${segment.index * 0.09}s`;
              const fillStyle = {
                "--target-opacity": segment.value > 0 ? 1 : 0,
              } as CSSProperties;

              return (
                <g
                  key={segment.id}
                  id={`segment-${segment.id}`}
                  data-segment={segment.id}
                  data-value={segment.value}
                  transform={`rotate(${segment.rotation} 280 280)`}
                >
                  <path
                    d={PETAL_PATH}
                    fill="#FFFFFF"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                  <g
                    id={`segment-fill-${segment.id}`}
                    clipPath={`url(#${uid}-petal-clip)`}
                    className="health-corner-fill"
                    style={fillStyle}
                  >
                    <path
                      d={EMPTY_FILL_PATH}
                      fill={`url(#${uid}-${segment.id}-gradient)`}
                      filter={`url(#${uid}-fill-blur)`}
                      opacity="0.96"
                    >
                      <animate
                        attributeName="d"
                        from={startFillPath}
                        to={fillPath}
                        dur="1.25s"
                        begin={begin}
                        fill="freeze"
                        calcMode="spline"
                        keyTimes="0;1"
                        keySplines="0.16 1 0.3 1"
                      />
                    </path>
                    <path
                      d={EMPTY_FILL_PATH}
                      fill={`url(#${uid}-${segment.id}-gradient)`}
                      filter={`url(#${uid}-fill-blur)`}
                      opacity="0.44"
                    >
                      <animate
                        attributeName="d"
                        from={startFillPath}
                        to={fillPath}
                        dur="1.25s"
                        begin={begin}
                        fill="freeze"
                        calcMode="spline"
                        keyTimes="0;1"
                        keySplines="0.16 1 0.3 1"
                      />
                    </path>
                    <path
                      d={EMPTY_FILL_PATH}
                      fill={`url(#${uid}-${segment.id}-gradient)`}
                      opacity="0.54"
                    >
                      <animate
                        attributeName="d"
                        from={startFillPath}
                        to={fillPath}
                        dur="1.25s"
                        begin={begin}
                        fill="freeze"
                        calcMode="spline"
                        keyTimes="0;1"
                        keySplines="0.16 1 0.3 1"
                      />
                    </path>
                  </g>
                  <path
                    d={PETAL_PATH}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </g>
              );
            })}
          </g>

          <g aria-hidden="true">
            {segments.map((segment) => (
              <g key={`${segment.id}-label`} id={`label-${segment.id}`}>
                <text
                  x={segment.text.x}
                  y={segment.text.y}
                  textAnchor="middle"
                  className="fill-[#101614] text-[28px] font-bold"
                >
                  {Math.round(segment.value * countProgress)}%
                </text>
                <foreignObject
                  x={segment.text.x - 60}   // center it
                  y={segment.text.y + 18}
                  width={120}
                  height={60}
                >
                  <div
                    style={{
                      textAlign: "center",
                      fontSize: "21px",
                      fontWeight: 600,
                      color: "#5E6661",
                      lineHeight: "1.1",
                      wordBreak: "break-word",
                    }}
                  >
                    {segment.label}
                  </div>
                </foreignObject>
              </g>
            ))}
          </g>

          <g
            id="center-dish"
            role="button"
            tabIndex={0}
            aria-label={`Open ${imageAlt || "menu item"} image`}
            className="cursor-pointer outline-none"
            filter={`url(#${uid}-soft-shadow)`}
            onClick={() => setImageModalOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                setImageModalOpen(true);
              }
            }}
          >
            <circle cx="280" cy="280" r={CENTER_GLOW_RADIUS} fill="url(#${uid}-center-glow)" />
            <circle cx="280" cy="280" r={CENTER_INNER_RING_RADIUS} fill="#FFFFFF" />
            <image
              href={imageUrl}
              x={CENTER_IMAGE_OFFSET}
              y={CENTER_IMAGE_OFFSET}
              width={CENTER_IMAGE_SIZE}
              height={CENTER_IMAGE_SIZE}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#${uid}-image-clip)`}
              aria-label={imageAlt}
            />
            <circle
              cx="280"
              cy="280"
              r={CENTER_INNER_RING_RADIUS}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="8"
            />
            <circle
              cx="280"
              cy="280"
              r={CENTER_OUTER_RING_RADIUS}
              fill="none"
              stroke="#DDE7D5"
              strokeWidth="2"
            />
          </g>
        </svg>
        <style jsx>{`
          .health-corner-fill {
            opacity: 0;
            animation: health-corner-fill-fade 0.45s ease-out forwards;
          }

          @keyframes health-corner-fill-fade {
            to {
              opacity: var(--target-opacity);
            }
          }

          @media (prefers-reduced-motion: reduce) {
            .health-corner-fill {
              animation: none;
              opacity: var(--target-opacity);
            }
          }
        `}</style>
      </figure>

      {isImageModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={imageAlt || "Menu item image"}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
          onClick={closeImageModal}
        >
          <button
            type="button"
            aria-label="Close image"
            className="absolute right-4 top-4 grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-white/95 text-[#1B1F1E] shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            onClick={closeImageModal}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={imageUrl}
            alt={imageAlt || "Menu item"}
            className="max-h-[82dvh] max-w-[92vw] rounded-3xl object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
