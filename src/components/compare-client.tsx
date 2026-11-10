"use client";

// Compare this month with any of the last 12 months. Picking a month is instant: all data is already here.

import { useState } from "react";
import { formatBaht, buildComparison } from "@/lib/summary";
import { thaiMonthLabel, thaiMonthShort } from "@/lib/dates";
import type { CompareData } from "@/lib/load";
import { toneOf, signed } from "./compare-view";

const ARROW = { up: "▲", down: "▼", same: "•" } as const;

function Bars({ now, before, color }: { now: number; before: number; color?: string }) {
  const max = Math.max(now, before, 1);
  return (
    <div className="cmpx-bars" aria-hidden="true">
      <span className="cmpx-bar now" style={{ width: `${(now / max) * 100}%`, background: color }} />
      <span className="cmpx-bar before" style={{ width: `${(before / max) * 100}%` }} />
    </div>
  );
}

export function CompareClient({ data }: { data: CompareData }) {
  const [picked, setPicked] = useState(data.months[0]);

  const comparison = buildComparison(data.categories, data.byMonth[data.current] ?? {}, data.byMonth[picked] ?? {});
  const { hasBefore, nowSatang, beforeSatang, diffSatang, percent, rows } = comparison;
  const tone = toneOf(diffSatang);
  const pickedLabel = thaiMonthLabel(picked);

  const biggestUp = rows.filter((r) => r.diffSatang > 0).sort((a, b) => b.diffSatang - a.diffSatang)[0];
  const biggestDown = rows.filter((r) => r.diffSatang < 0).sort((a, b) => a.diffSatang - b.diffSatang)[0];

  return (
    <>
      <section className="cmpx-picker" aria-label="เลือกเดือนที่จะเทียบ">
        <p className="cmpx-kicker">เทียบเดือนนี้กับ</p>
        <div className="cmpx-chips" role="radiogroup">
          {data.months.map((m) => {
            const has = Object.keys(data.byMonth[m] ?? {}).length > 0;
            return (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={picked === m}
                className="cmpx-chip"
                data-empty={!has}
                onClick={() => setPicked(m)}
              >
                {thaiMonthShort(m)}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card cmpx-hero" data-tone={hasBefore ? tone : "none"}>
        <p className="cmpx-kicker">รายจ่าย{thaiMonthLabel(data.current)} เทียบกับ {pickedLabel}</p>
        {hasBefore ? (
          <>
            <div className="cmpx-delta">
              <span className="cmpx-arrow" aria-hidden="true">{ARROW[tone]}</span>
              <span className="cmpx-num">{formatBaht(Math.abs(diffSatang))}</span>
              <span className="cmpx-unit">บาท</span>
            </div>
            <p className="cmpx-sub">
              {tone === "same" ? "ใช้เท่ากับเดือนที่เทียบ" : tone === "up" ? "ใช้มากกว่า" : "ใช้น้อยกว่า"}
              {percent !== null && percent !== 0 ? ` · ${percent > 0 ? "+" : "−"}${Math.abs(percent)}%` : ""}
            </p>
          </>
        ) : (
          <p className="cmpx-empty">{pickedLabel}ยังไม่มีรายจ่ายให้เทียบ ลองเลือกเดือนอื่นด้านบน</p>
        )}

        <div className="cmpx-pair">
          <div>
            <span className="cmpx-label"><i className="swatch now" />{thaiMonthShort(data.current)} (เดือนนี้)</span>
            <strong>{formatBaht(nowSatang)}</strong>
          </div>
          <div>
            <span className="cmpx-label"><i className="swatch before" />{thaiMonthShort(picked)}</span>
            <strong className="muted">{formatBaht(beforeSatang)}</strong>
          </div>
        </div>
        <Bars now={nowSatang} before={beforeSatang} />
      </section>

      {hasBefore && (biggestUp || biggestDown) ? (
        <section className="cmpx-insights" aria-label="ข้อสังเกต">
          {biggestUp ? (
            <div className="cmpx-insight up">
              <span className="cmpx-label">เพิ่มขึ้นมากสุด</span>
              <strong>{biggestUp.name}</strong>
              <span className="cmpx-insight-num">{signed(biggestUp.diffSatang)} บาท</span>
            </div>
          ) : null}
          {biggestDown ? (
            <div className="cmpx-insight down">
              <span className="cmpx-label">ลดลงมากสุด</span>
              <strong>{biggestDown.name}</strong>
              <span className="cmpx-insight-num">{signed(biggestDown.diffSatang)} บาท</span>
            </div>
          ) : null}
        </section>
      ) : null}

      {hasBefore ? (
        <section className="card cmpx-table" aria-label="เทียบรายหมวด">
          <div className="cmpx-table-head">
            <h2>รายหมวด</h2>
            <span className="cmpx-legend">
              <span><i className="swatch now" />เดือนนี้</span>
              <span><i className="swatch before" />{thaiMonthShort(picked)}</span>
            </span>
          </div>
          <ul>
            {rows.map((row) => {
              const t = toneOf(row.diffSatang);
              return (
                <li key={row.id}>
                  <div className="cmpx-row-head">
                    <span className="dot" style={{ background: row.color }} />
                    <span className="cmpx-name">{row.name}</span>
                    <span className={`cmpx-chip-diff ${t}`}>
                      <span aria-hidden="true">{ARROW[t]}</span> {signed(row.diffSatang)}
                    </span>
                  </div>
                  <Bars now={row.nowSatang} before={row.beforeSatang} color={row.color} />
                  <p className="cmpx-meta">
                    <span>{formatBaht(row.nowSatang)}</span>
                    <span>{formatBaht(row.beforeSatang)}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </>
  );
}
