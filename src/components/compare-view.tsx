// Last-month comparison: a small card for the home screen and a full view for /compare.

import Link from "next/link";
import { IconChevron } from "./icons";
import { formatBaht, type Comparison } from "@/lib/summary";

export type Tone = "up" | "down" | "same";

export function toneOf(diff: number): Tone {
  return diff > 0 ? "up" : diff < 0 ? "down" : "same";
}

export function signed(diff: number): string {
  return diff === 0 ? "เท่าเดิม" : `${diff > 0 ? "+" : "−"}${formatBaht(Math.abs(diff))}`;
}

// Arrow pill: orange when spending went up, green when it went down.
export function ChangePill({ diff, percent }: { diff: number; percent: number | null }) {
  const tone = toneOf(diff);
  const arrow = tone === "up" ? "▲" : tone === "down" ? "▼" : "•";
  return (
    <span className={`cmp-pill ${tone}`}>
      <span aria-hidden="true">{arrow}</span>
      {signed(diff)} บาท{percent !== null && percent !== 0 ? ` · ${percent > 0 ? "+" : "−"}${Math.abs(percent)}%` : ""}
    </span>
  );
}

export function TwoBars({ now, before }: { now: number; before: number }) {
  const max = Math.max(now, before, 1);
  return (
    <div className="cmp-bars" aria-hidden="true">
      <span className="cmp-bar now" style={{ width: `${(now / max) * 100}%` }} />
      <span className="cmp-bar before" style={{ width: `${(before / max) * 100}%` }} />
    </div>
  );
}

// Home screen: the answer in one glance, tap for details.
export function CompareSummaryCard({ comparison, beforeLabel }: { comparison: Comparison; beforeLabel: string }) {
  const { hasBefore, nowSatang, beforeSatang, diffSatang, percent, headline } = comparison;
  return (
    <Link href="/compare" className="card cmp-card" aria-label="ดูรายละเอียดการเทียบเดือนก่อน">
      <div className="card-head">
        <h2>เทียบเดือนก่อน</h2>
        <span className="cmp-more">ดูรายละเอียด<IconChevron size={16} /></span>
      </div>
      {hasBefore ? (
        <>
          <ChangePill diff={diffSatang} percent={percent} />
          <div className="cmp-pair">
            <div>
              <span className="cmp-label">เดือนนี้</span>
              <strong>{formatBaht(nowSatang)}</strong>
            </div>
            <div>
              <span className="cmp-label">{beforeLabel}</span>
              <strong className="muted">{formatBaht(beforeSatang)}</strong>
            </div>
          </div>
          <TwoBars now={nowSatang} before={beforeSatang} />
        </>
      ) : (
        <p className="cmp-empty">{headline}</p>
      )}
    </Link>
  );
}

// One calm line on the home screen; the full view is a tap away.
export function CompareLine({ comparison }: { comparison: Comparison }) {
  const { hasBefore, diffSatang, percent, headline } = comparison;
  return (
    <Link href="/compare" className="cmp-line" aria-label="ดูรายละเอียดการเทียบเดือนก่อน">
      {hasBefore ? <ChangePill diff={diffSatang} percent={percent} /> : null}
      <span className="cmp-line-text">{headline}</span>
      <IconChevron size={16} />
    </Link>
  );
}
