interface StatCardsGridProps {
  children: React.ReactNode;
}

/**
 * Lưới thẻ KPI — căn trên + gap cố định.
 * Tránh place-content-center / content-center: khi ô fullscreen cao,
 * CSS phân phối khoảng trống vào giữa các hàng → khoảng cách “ô” bị phình to.
 */
const StatCardsGrid = ({ children }: StatCardsGridProps) => (
  <div className="@container h-full min-h-0 w-full grid grid-cols-[repeat(auto-fit,minmax(min(100%,9rem),1fr))] auto-rows-[minmax(0,1fr)] gap-2 content-start items-stretch">
    {children}
  </div>
);

export default StatCardsGrid;
