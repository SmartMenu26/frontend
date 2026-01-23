"use client";

import React, { forwardRef } from "react";

type CategoryLinkProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
};

const CategoryLink = forwardRef<HTMLButtonElement, CategoryLinkProps>(
  ({ label, active = false, onClick, className = "" }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onMouseDown={(e) => e.preventDefault()} // ⬅️ KEY LINE
        onClick={onClick}
        className={[
          "relative pb-2 shrink-0 cursor-pointer",
          "text-lg md:text-3xl",
          active
            ? "text-[#074128] font-semibold underline"
            : "text-[#074128]/80 font-normal",
          "focus:outline-none focus-visible:ring-0",
          className,
        ].join(" ")}
      >
        {label}
      </button>
    );
  }
);

CategoryLink.displayName = "CategoryLink";

export default CategoryLink;
