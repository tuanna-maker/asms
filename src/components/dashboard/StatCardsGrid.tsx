interface StatCardsGridProps {
  children: React.ReactNode;
}

/** Lưới thẻ KPI co theo kích thước ô grid — tự wrap cột, không min-height cố định */
const StatCardsGrid = ({ children }: StatCardsGridProps) => (
  <div className="@container h-full min-h-0 w-full grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] auto-rows-[minmax(0,1fr)] gap-2 sm:gap-3 place-content-center content-center items-center">
    {children}
  </div>
);

export default StatCardsGrid;
