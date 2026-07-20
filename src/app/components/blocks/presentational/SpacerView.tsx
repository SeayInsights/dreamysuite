/** Presentational spacer block — single source for published markup. */
export function SpacerView({ height }: { height: number }) {
  return (
    <div
      className="block-spacer"
      style={{ height: `${height}px` }}
      aria-hidden="true"
    />
  );
}
